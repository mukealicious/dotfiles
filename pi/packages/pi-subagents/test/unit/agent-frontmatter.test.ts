import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, it } from "node:test";
import { serializeAgent } from "../../agent-serializer.ts";
import { discoverAgents, discoverAgentsAll, type AgentConfig } from "../../agents.ts";

const tempDirs: string[] = [];

afterEach(() => {
	while (tempDirs.length > 0) {
		const dir = tempDirs.pop();
		if (!dir) continue;
		fs.rmSync(dir, { recursive: true, force: true });
	}
});

describe("agent frontmatter maxSubagentDepth", () => {
	it("serializes maxSubagentDepth into agent frontmatter", () => {
		const agent: AgentConfig = {
			name: "scout",
			description: "Scout",
			systemPrompt: "Inspect code",
			systemPromptMode: "replace",
			inheritProjectContext: false,
			inheritSkills: false,
			source: "project",
			filePath: "/tmp/scout.md",
			maxSubagentDepth: 1,
		};

		const serialized = serializeAgent(agent);
		assert.match(serialized, /maxSubagentDepth: 1/);
	});

	it("parses maxSubagentDepth from discovered agent frontmatter", () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-subagents-agent-frontmatter-"));
		tempDirs.push(dir);
		const agentsDir = path.join(dir, ".pi", "agents");
		fs.mkdirSync(agentsDir, { recursive: true });
		fs.writeFileSync(path.join(agentsDir, "scout.md"), `---
name: scout
description: Scout
maxSubagentDepth: 1
---

Inspect code
`, "utf-8");

		const result = discoverAgents(dir, "project");
		const scout = result.agents.find((agent) => agent.name === "scout");
		assert.equal(scout?.maxSubagentDepth, 1);
	});
});

describe("agent frontmatter fallbackModels", () => {
	it("serializes fallbackModels into agent frontmatter", () => {
		const agent: AgentConfig = {
			name: "worker",
			description: "Worker",
			systemPrompt: "Do work",
			systemPromptMode: "replace",
			inheritProjectContext: false,
			inheritSkills: false,
			source: "project",
			filePath: "/tmp/worker.md",
			fallbackModels: ["openai/gpt-5-mini", "anthropic/claude-sonnet-4"],
		};

		const serialized = serializeAgent(agent);
		assert.match(serialized, /fallbackModels: openai\/gpt-5-mini, anthropic\/claude-sonnet-4/);
	});

	it("parses fallbackModels from discovered agent frontmatter", () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-subagents-agent-fallback-frontmatter-"));
		tempDirs.push(dir);
		const agentsDir = path.join(dir, ".pi", "agents");
		fs.mkdirSync(agentsDir, { recursive: true });
		fs.writeFileSync(path.join(agentsDir, "worker.md"), `---
name: worker
description: Worker
fallbackModels: openai/gpt-5-mini, anthropic/claude-sonnet-4
---

Do work
`, "utf-8");

		const result = discoverAgents(dir, "project");
		const worker = result.agents.find((agent) => agent.name === "worker");
		assert.deepEqual(worker?.fallbackModels, ["openai/gpt-5-mini", "anthropic/claude-sonnet-4"]);
	});
});

describe("agent frontmatter systemPromptMode", () => {
	it("serializes systemPromptMode into agent frontmatter", () => {
		const agent: AgentConfig = {
			name: "worker",
			description: "Worker",
			systemPrompt: "Do work",
			systemPromptMode: "replace",
			inheritProjectContext: false,
			inheritSkills: false,
			source: "project",
			filePath: "/tmp/worker.md",
		};

		const serialized = serializeAgent(agent);
		assert.match(serialized, /systemPromptMode: replace/);
	});

	it("parses systemPromptMode from discovered agent frontmatter", () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-subagents-agent-prompt-mode-frontmatter-"));
		tempDirs.push(dir);
		const agentsDir = path.join(dir, ".pi", "agents");
		fs.mkdirSync(agentsDir, { recursive: true });
		fs.writeFileSync(path.join(agentsDir, "worker.md"), `---
name: worker
description: Worker
systemPromptMode: replace
---

Do work
`, "utf-8");

		const result = discoverAgents(dir, "project");
		const worker = result.agents.find((agent) => agent.name === "worker");
		assert.equal(worker?.systemPromptMode, "replace");
	});
});

describe("agent frontmatter prompt inheritance flags", () => {
	it("serializes inheritProjectContext and inheritSkills into agent frontmatter", () => {
		const agent: AgentConfig = {
			name: "worker",
			description: "Worker",
			systemPrompt: "Do work",
			systemPromptMode: "replace",
			inheritProjectContext: true,
			inheritSkills: true,
			source: "project",
			filePath: "/tmp/worker.md",
		};

		const serialized = serializeAgent(agent);
		assert.match(serialized, /inheritProjectContext: true/);
		assert.match(serialized, /inheritSkills: true/);
	});

	it("parses inheritProjectContext and inheritSkills from discovered agent frontmatter", () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-subagents-agent-prompt-inheritance-frontmatter-"));
		tempDirs.push(dir);
		const agentsDir = path.join(dir, ".pi", "agents");
		fs.mkdirSync(agentsDir, { recursive: true });
		fs.writeFileSync(path.join(agentsDir, "worker.md"), `---
name: worker
description: Worker
inheritProjectContext: true
inheritSkills: true
---

Do work
`, "utf-8");

		const result = discoverAgents(dir, "project");
		const worker = result.agents.find((agent) => agent.name === "worker");
		assert.equal(worker?.inheritProjectContext, true);
		assert.equal(worker?.inheritSkills, true);
	});
});

describe("agent frontmatter prompt assembly defaults", () => {
	it("defaults ordinary agents to replace mode with no inherited context or skills", () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-subagents-agent-default-prompt-settings-"));
		tempDirs.push(dir);
		const agentsDir = path.join(dir, ".pi", "agents");
		fs.mkdirSync(agentsDir, { recursive: true });
		fs.writeFileSync(path.join(agentsDir, "worker.md"), `---
name: worker
description: Worker
---

Do work
`, "utf-8");

		const result = discoverAgents(dir, "project");
		const worker = result.agents.find((agent) => agent.name === "worker");
		assert.equal(worker?.systemPromptMode, "replace");
		assert.equal(worker?.inheritProjectContext, false);
		assert.equal(worker?.inheritSkills, false);
	});

	it("builtin agents inherit project context by default", () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-subagents-builtin-default-prompt-settings-"));
		const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-subagents-builtin-default-home-"));
		tempDirs.push(dir);
		tempDirs.push(homeDir);
		const previousHome = process.env.HOME;
		const previousUserProfile = process.env.USERPROFILE;

		try {
			process.env.HOME = homeDir;
			process.env.USERPROFILE = homeDir;

			const result = discoverAgents(dir, "both");
			const scout = result.agents.find((agent) => agent.name === "scout");
			const reviewer = result.agents.find((agent) => agent.name === "reviewer");
			const delegate = result.agents.find((agent) => agent.name === "delegate");
			assert.equal(scout?.inheritProjectContext, true);
			assert.equal(reviewer?.inheritProjectContext, true);
			assert.equal(delegate?.inheritProjectContext, true);
		} finally {
			if (previousHome === undefined) delete process.env.HOME;
			else process.env.HOME = previousHome;
			if (previousUserProfile === undefined) delete process.env.USERPROFILE;
			else process.env.USERPROFILE = previousUserProfile;
		}
	});

	it("defaults delegate to append mode with inherited project context", () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-subagents-agent-delegate-default-prompt-settings-"));
		tempDirs.push(dir);
		const agentsDir = path.join(dir, ".pi", "agents");
		fs.mkdirSync(agentsDir, { recursive: true });
		fs.writeFileSync(path.join(agentsDir, "delegate.md"), `---
name: delegate
description: Delegate
---

Do work
`, "utf-8");

		const result = discoverAgents(dir, "project");
		const delegate = result.agents.find((agent) => agent.name === "delegate");
		assert.equal(delegate?.systemPromptMode, "append");
		assert.equal(delegate?.inheritProjectContext, true);
		assert.equal(delegate?.inheritSkills, false);
	});
});

describe("project agent directory discovery", () => {
	it("discovers project agents from both .agents and .pi/agents", () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-subagents-project-agent-dirs-"));
		tempDirs.push(dir);
		fs.mkdirSync(path.join(dir, ".agents", "skills"), { recursive: true });
		fs.mkdirSync(path.join(dir, ".pi", "agents"), { recursive: true });
		fs.writeFileSync(path.join(dir, ".agents", "legacy.md"), `---
name: legacy
description: Legacy
---

Legacy prompt
`, "utf-8");
		fs.writeFileSync(path.join(dir, ".pi", "agents", "canonical.md"), `---
name: canonical
description: Canonical
---

Canonical prompt
`, "utf-8");

		const result = discoverAgents(dir, "project");
		assert.ok(result.agents.find((agent) => agent.name === "legacy" && agent.filePath === path.join(dir, ".agents", "legacy.md")));
		assert.ok(result.agents.find((agent) => agent.name === "canonical" && agent.filePath === path.join(dir, ".pi", "agents", "canonical.md")));
		assert.equal(result.projectAgentsDir, path.join(dir, ".pi", "agents"));
	});

	it("prefers .pi/agents over .agents on project agent name collisions", () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-subagents-project-agent-collision-"));
		tempDirs.push(dir);
		fs.mkdirSync(path.join(dir, ".agents"), { recursive: true });
		fs.mkdirSync(path.join(dir, ".pi", "agents"), { recursive: true });
		fs.writeFileSync(path.join(dir, ".agents", "shared.md"), `---
name: shared
description: Legacy shared
---

Legacy prompt
`, "utf-8");
		fs.writeFileSync(path.join(dir, ".pi", "agents", "shared.md"), `---
name: shared
description: Canonical shared
---

Canonical prompt
`, "utf-8");

		const shared = discoverAgents(dir, "project").agents.find((agent) => agent.name === "shared");
		assert.ok(shared);
		assert.equal(shared.filePath, path.join(dir, ".pi", "agents", "shared.md"));
		assert.equal(shared.description, "Canonical shared");
		assert.equal(shared.systemPrompt.trim(), "Canonical prompt");
	});

	it("uses the project root for the canonical project agent dir even when only .agents exists", () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-subagents-project-agent-root-"));
		tempDirs.push(dir);
		const nested = path.join(dir, "packages", "app");
		fs.mkdirSync(path.join(dir, ".agents", "skills"), { recursive: true });
		fs.mkdirSync(nested, { recursive: true });

		const result = discoverAgentsAll(nested);
		assert.equal(result.projectDir, path.join(dir, ".pi", "agents"));
	});

	it("discovers project chains from both .agents and .pi/agents", () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-subagents-project-chain-dirs-"));
		tempDirs.push(dir);
		fs.mkdirSync(path.join(dir, ".agents", "skills"), { recursive: true });
		fs.mkdirSync(path.join(dir, ".pi", "agents"), { recursive: true });
		fs.writeFileSync(path.join(dir, ".agents", "legacy.chain.md"), `---
name: legacy-chain
description: Legacy chain
---

## scout

Inspect legacy
`, "utf-8");
		fs.writeFileSync(path.join(dir, ".pi", "agents", "canonical.chain.md"), `---
name: canonical-chain
description: Canonical chain
---

## worker

Inspect canonical
`, "utf-8");

		const result = discoverAgentsAll(dir);
		assert.ok(result.chains.find((chain) => chain.name === "legacy-chain" && chain.filePath === path.join(dir, ".agents", "legacy.chain.md")));
		assert.ok(result.chains.find((chain) => chain.name === "canonical-chain" && chain.filePath === path.join(dir, ".pi", "agents", "canonical.chain.md")));
		assert.equal(result.projectDir, path.join(dir, ".pi", "agents"));
	});

	it("prefers .pi/agents over .agents on project chain name collisions", () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-subagents-project-chain-collision-"));
		tempDirs.push(dir);
		fs.mkdirSync(path.join(dir, ".agents"), { recursive: true });
		fs.mkdirSync(path.join(dir, ".pi", "agents"), { recursive: true });
		fs.writeFileSync(path.join(dir, ".agents", "shared.chain.md"), `---
name: shared-chain
description: Legacy chain
---

## scout

Inspect legacy
`, "utf-8");
		fs.writeFileSync(path.join(dir, ".pi", "agents", "shared.chain.md"), `---
name: shared-chain
description: Canonical chain
---

## worker

Inspect canonical
`, "utf-8");

		const shared = discoverAgentsAll(dir).chains.find((chain) => chain.name === "shared-chain");
		assert.ok(shared);
		assert.equal(shared.filePath, path.join(dir, ".pi", "agents", "shared.chain.md"));
		assert.equal(shared.description, "Canonical chain");
		assert.equal(shared.steps[0]?.agent, "worker");
		assert.equal(shared.steps[0]?.task, "Inspect canonical");
	});
});
