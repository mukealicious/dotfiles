import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { handleCreate, handleDelete, handleUpdate } from "../../agent-management.ts";
import { createEditState, handleEditInput } from "../../agent-manager-edit.ts";

let tempDir = "";

function readText(result: { content: Array<{ type: string; text?: string }> }): string {
	const first = result.content[0];
	assert.ok(first);
	assert.equal(first.type, "text");
	assert.equal(typeof first.text, "string");
	return first.text;
}

describe("agent management config parsing", () => {
	beforeEach(() => {
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-subagents-management-"));
	});

	afterEach(() => {
		fs.rmSync(tempDir, { recursive: true, force: true });
	});

	it("surfaces JSON parse errors for create config strings", () => {
		const result = handleCreate(
			{ config: '{"name":' },
			{ cwd: tempDir, modelRegistry: { getAvailable: () => [] } },
		);

		assert.equal(result.isError, true);
		assert.match(readText(result), /config must be valid JSON:/);
	});

	it("surfaces JSON parse errors for update config strings", () => {
		const result = handleUpdate(
			{ agent: "reviewer", config: '{"description":' },
			{ cwd: tempDir, modelRegistry: { getAvailable: () => [] } },
		);

		assert.equal(result.isError, true);
		assert.match(readText(result), /config must be valid JSON:/);
	});

	it("creates ordinary custom agents as leaf roles", () => {
		const result = handleCreate(
			{ config: { name: "helper", description: "Helper", scope: "project" } },
			{ cwd: tempDir, modelRegistry: { getAvailable: () => [] } },
		);

		assert.equal(result.isError, false);
		const filePath = path.join(tempDir, ".pi", "agents", "helper.md");
		const content = fs.readFileSync(filePath, "utf-8");
		assert.match(content, /systemPromptMode: replace/);
		assert.match(content, /inheritProjectContext: false/);
		assert.match(content, /inheritSkills: false/);
		assert.match(content, /tools: read, grep, find, ls/);
		assert.doesNotMatch(content, /^extensions:/m);
		assert.match(content, /maxSubagentDepth: 0/);
	});

	it("does not turn an ordinary role into an unrestricted writer when tools are cleared", () => {
		const result = handleCreate(
			{ config: { name: "safe-helper", description: "Helper", scope: "project", tools: false } },
			{ cwd: tempDir, modelRegistry: { getAvailable: () => [] } },
		);

		assert.equal(result.isError, false);
		const content = fs.readFileSync(path.join(tempDir, ".pi", "agents", "safe-helper.md"), "utf-8");
		assert.match(content, /tools: read, grep, find, ls/);
		assert.doesNotMatch(content, /^extensions:/m);
	});

	it("rejects updates and deletion of linked managed agents", () => {
		const savedProfile = process.env.PI_CODING_AGENT_DIR;
		const profile = path.join(tempDir, "personal");
		const agentsDir = path.join(profile, "agents");
		const generated = path.join(tempDir, "generated-review.md");
		const original = `---\nname: review\ndescription: Managed review\n---\n\nReview changes.\n`;
		fs.mkdirSync(agentsDir, { recursive: true });
		fs.writeFileSync(generated, original);
		fs.symlinkSync(generated, path.join(agentsDir, "review.md"));
		const ctx = { cwd: tempDir, modelRegistry: { getAvailable: () => [] } };

		try {
			process.env.PI_CODING_AGENT_DIR = profile;
			const update = handleUpdate({ agent: "review", agentScope: "user", config: { description: "Changed" } }, ctx);
			assert.equal(update.isError, true);
			assert.match(readText(update), /linked or managed/);
			const deletion = handleDelete({ agent: "review", agentScope: "user" }, ctx);
			assert.equal(deletion.isError, true);
			assert.match(readText(deletion), /linked or managed/);
			assert.equal(fs.readFileSync(generated, "utf-8"), original);
			assert.equal(fs.lstatSync(path.join(agentsDir, "review.md")).isSymbolicLink(), true);
		} finally {
			if (savedProfile === undefined) delete process.env.PI_CODING_AGENT_DIR;
			else process.env.PI_CODING_AGENT_DIR = savedProfile;
		}
	});

	it("keeps user agent CRUD in the active profile's real agents directory", () => {
		const savedProfile = process.env.PI_CODING_AGENT_DIR;
		const work = path.join(tempDir, "work");
		const personal = path.join(tempDir, "personal");
		const ctx = { cwd: tempDir, modelRegistry: { getAvailable: () => [] } };

		try {
			process.env.PI_CODING_AGENT_DIR = work;
			assert.equal(handleCreate({ config: { name: "work custom", description: "Work-only agent" } }, ctx).isError, false);
			assert.equal(handleCreate({ config: { name: "work flow", description: "Work-only chain", steps: [{ agent: "worker", task: "Do work" }] } }, ctx).isError, false);
			const workAgent = path.join(work, "agents", "work-custom.md");
			const workChain = path.join(work, "agents", "work-flow.chain.md");
			assert.equal(fs.existsSync(workAgent), true);
			assert.equal(fs.existsSync(workChain), true);

			process.env.PI_CODING_AGENT_DIR = personal;
			assert.equal(handleCreate({ config: { name: "personal custom", description: "Personal-only agent" } }, ctx).isError, false);
			const personalAgent = path.join(personal, "agents", "personal-custom.md");
			assert.equal(fs.existsSync(personalAgent), true);
			assert.equal(fs.existsSync(path.join(personal, "agents", "work-custom.md")), false);
			assert.equal(fs.existsSync(path.join(personal, "agents", "work-flow.chain.md")), false);

			process.env.PI_CODING_AGENT_DIR = work;
			assert.equal(handleUpdate({ agent: "work-custom", agentScope: "user", config: { description: "Updated work-only agent" } }, ctx).isError, false);
			assert.equal(handleUpdate({ chainName: "work-flow", agentScope: "user", config: { description: "Updated work-only chain" } }, ctx).isError, false);
			assert.match(fs.readFileSync(workAgent, "utf-8"), /Updated work-only agent/);
			assert.match(fs.readFileSync(workChain, "utf-8"), /Updated work-only chain/);
			assert.equal(handleDelete({ agent: "work-custom", agentScope: "user" }, ctx).isError, false);
			assert.equal(handleDelete({ chainName: "work-flow", agentScope: "user" }, ctx).isError, false);
			assert.equal(fs.existsSync(workAgent), false);
			assert.equal(fs.existsSync(workChain), false);
			assert.equal(fs.existsSync(personalAgent), true);
		} finally {
			if (savedProfile === undefined) delete process.env.PI_CODING_AGENT_DIR;
			else process.env.PI_CODING_AGENT_DIR = savedProfile;
		}
	});
});

describe("agent manager edit prompt mode", () => {
	it("preserves explicit append mode when reopening and confirming the field", () => {
		const state = createEditState(
			{
				name: "worker",
				description: "Worker",
				source: "user",
				filePath: "/tmp/worker.md",
				systemPrompt: "Do work",
				systemPromptMode: "append",
				inheritProjectContext: false,
				inheritSkills: false,
			},
			false,
			[],
			[],
		);

		state.fieldIndex = state.fields.indexOf("systemPromptMode");
		const first = handleEditInput("edit", state, "\r", 80, [], []);
		assert.equal(first?.nextScreen, "edit-field");
		assert.equal(state.fieldEditor.buffer, "append");

		const second = handleEditInput("edit-field", state, "\r", 80, [], []);
		assert.equal(second?.nextScreen, "edit");
		assert.equal(state.draft.systemPromptMode, "append");
	});
});
