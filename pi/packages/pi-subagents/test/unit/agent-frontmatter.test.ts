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

	it("serializes native max thinking without degrading it", () => {
		const agent: AgentConfig = {
			name: "worker",
			description: "Worker",
			systemPrompt: "Do work",
			systemPromptMode: "replace",
			inheritProjectContext: false,
			inheritSkills: false,
			source: "project",
			filePath: "/tmp/worker.md",
			thinking: "max",
		};

		assert.match(serializeAgent(agent), /thinking: max/);
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

	it("builtin agents declare their role-specific prompt settings", () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-subagents-builtin-default-prompt-settings-"));
		const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-subagents-builtin-default-home-"));
		tempDirs.push(dir);
		tempDirs.push(homeDir);
		const previousHome = process.env.HOME;
		const previousUserProfile = process.env.USERPROFILE;
		const previousProfile = process.env.PI_CODING_AGENT_DIR;

		try {
			process.env.HOME = homeDir;
			process.env.USERPROFILE = homeDir;
			delete process.env.PI_CODING_AGENT_DIR;

			const result = discoverAgents(dir, "both");
			assert.deepEqual(result.agents.filter((agent) => agent.source === "builtin").map((agent) => agent.name).sort(), ["researcher", "scout", "worker"]);
			const scout = result.agents.find((agent) => agent.name === "scout");
			const researcher = result.agents.find((agent) => agent.name === "researcher");
			const worker = result.agents.find((agent) => agent.name === "worker");
			assert.equal(scout?.inheritProjectContext, true);
			assert.equal(researcher?.inheritProjectContext, true);
			assert.equal(worker?.inheritProjectContext, true);
			assert.deepEqual(scout?.tools, ["read", "grep", "find", "ls"]);
			assert.equal(scout?.model, "gpt-5.6-luna");
			assert.equal(scout?.thinking, "high");
			assert.equal(scout?.output, undefined);
			assert.equal(scout?.defaultReads, undefined);
			assert.equal(scout?.defaultProgress, false);
			assert.equal(scout?.maxSubagentDepth, 0);
			assert.deepEqual(fs.readdirSync(path.dirname(scout!.filePath)).filter((entry) => entry.endsWith(".md")).sort(), ["researcher.md", "scout.md", "worker.md"]);
			assert.deepEqual(researcher?.tools, ["read", "web_search", "web_fetch", "deep_research", "batch_enrich", "exa_search"]);
			assert.equal(researcher?.extensions, undefined);
			assert.equal(researcher?.model, "gpt-5.6-terra");
			assert.equal(researcher?.thinking, "high");
			assert.equal(researcher?.output, undefined);
			assert.equal(researcher?.defaultProgress, false);
			assert.equal(researcher?.maxSubagentDepth, 0);
			assert.equal(worker?.model, "gpt-5.6-luna");
			assert.equal(worker?.thinking, "max");
			assert.equal(worker?.tools, undefined);
			assert.equal(worker?.defaultReads, undefined);
			assert.equal(worker?.defaultProgress, false);
			assert.equal(worker?.maxSubagentDepth, 0);
		} finally {
			if (previousHome === undefined) delete process.env.HOME;
			else process.env.HOME = previousHome;
			if (previousUserProfile === undefined) delete process.env.USERPROFILE;
			else process.env.USERPROFILE = previousUserProfile;
			if (previousProfile === undefined) delete process.env.PI_CODING_AGENT_DIR;
			else process.env.PI_CODING_AGENT_DIR = previousProfile;
		}
	});

	it("defaults ordinary custom agents to leaf depth", () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-subagents-agent-default-leaf-"));
		tempDirs.push(dir);
		const agentsDir = path.join(dir, ".pi", "agents");
		fs.mkdirSync(agentsDir, { recursive: true });
		fs.writeFileSync(path.join(agentsDir, "helper.md"), `---
name: helper
description: Helper
---

Do work
`, "utf-8");

		const helper = discoverAgents(dir, "project").agents.find((agent) => agent.name === "helper");
		assert.equal(helper?.systemPromptMode, "replace");
		assert.equal(helper?.inheritProjectContext, false);
		assert.deepEqual(helper?.tools, ["read", "grep", "find", "ls"]);
		assert.equal(helper?.extensions, undefined);
		assert.equal(helper?.maxSubagentDepth, 0);
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
