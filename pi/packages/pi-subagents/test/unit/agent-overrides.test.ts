import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { buildBuiltinOverrideConfig, discoverAgents, getActiveAgentDir, getUserAgentSettingsPath, removeBuiltinAgentOverride } from "../../agents.ts";

let tempHome = "";
let tempProject = "";
const originalHome = process.env.HOME;
const originalUserProfile = process.env.USERPROFILE;
const originalAgentDir = process.env.PI_CODING_AGENT_DIR;

function writeJson(filePath: string, value: unknown): void {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf-8");
}

function writeProjectAgent(cwd: string, name: string, body: string): void {
	const filePath = path.join(cwd, ".pi", "agents", `${name}.md`);
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, body, "utf-8");
}

describe("builtin agent overrides", () => {
	beforeEach(() => {
		tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "pi-subagents-home-"));
		tempProject = fs.mkdtempSync(path.join(os.tmpdir(), "pi-subagents-project-"));
		process.env.HOME = tempHome;
		process.env.USERPROFILE = tempHome;
		delete process.env.PI_CODING_AGENT_DIR;
	});

	afterEach(() => {
		if (originalHome === undefined) delete process.env.HOME;
		else process.env.HOME = originalHome;
		if (originalUserProfile === undefined) delete process.env.USERPROFILE;
		else process.env.USERPROFILE = originalUserProfile;
		if (originalAgentDir === undefined) delete process.env.PI_CODING_AGENT_DIR;
		else process.env.PI_CODING_AGENT_DIR = originalAgentDir;
		fs.rmSync(tempHome, { recursive: true, force: true });
		fs.rmSync(tempProject, { recursive: true, force: true });
	});

	it("reads user overrides from the active Pi profile", () => {
		const profileDir = path.join(tempHome, ".pi", "personal");
		process.env.PI_CODING_AGENT_DIR = profileDir;
		writeJson(path.join(profileDir, "settings.json"), {
			subagents: {
				agentOverrides: {
					scout: { model: "openai-codex/gpt-5.6-terra" },
				},
			},
		});

		assert.equal(getActiveAgentDir(), profileDir);
		assert.equal(getUserAgentSettingsPath(), path.join(profileDir, "settings.json"));
		const scout = discoverAgents(tempProject, "both").agents.find((agent) => agent.name === "scout");
		assert.equal(scout?.model, "openai-codex/gpt-5.6-terra");
	});

	it("applies user settings overrides to builtin agents", () => {
		writeJson(path.join(tempHome, ".pi", "agent", "settings.json"), {
			subagents: {
				agentOverrides: {
					scout: {
						model: "openai/gpt-5.4",
						thinking: "xhigh",
						systemPromptMode: "replace",
						inheritProjectContext: true,
						inheritSkills: true,
					},
				},
			},
		});

		const scout = discoverAgents(tempProject, "both").agents.find((agent) => agent.name === "scout");
		assert.ok(scout);
		assert.equal(scout.source, "builtin");
		assert.equal(scout.model, "openai/gpt-5.4");
		assert.equal(scout.thinking, "xhigh");
		assert.equal(scout.systemPromptMode, "replace");
		assert.equal(scout.inheritProjectContext, true);
		assert.equal(scout.inheritSkills, true);
		assert.equal(scout.override?.scope, "user");
		assert.equal(scout.override?.path, path.join(tempHome, ".pi", "agent", "settings.json"));
	});

	it("prefers project settings overrides over user settings overrides", () => {
		fs.mkdirSync(path.join(tempProject, ".pi"), { recursive: true });
		writeJson(path.join(tempHome, ".pi", "agent", "settings.json"), {
			subagents: { agentOverrides: { scout: { model: "openai/gpt-5.4" } } },
		});
		writeJson(path.join(tempProject, ".pi", "settings.json"), {
			subagents: { agentOverrides: { scout: { model: "openai-codex/gpt-5.4-mini", thinking: "high" } } },
		});

		const scout = discoverAgents(tempProject, "both").agents.find((agent) => agent.name === "scout");
		assert.ok(scout);
		assert.equal(scout.model, "openai-codex/gpt-5.4-mini");
		assert.equal(scout.thinking, "high");
		assert.equal(scout.override?.scope, "project");
		assert.equal(scout.override?.path, path.join(tempProject, ".pi", "settings.json"));
	});

	it("does not apply project settings overrides when scope is user", () => {
		fs.mkdirSync(path.join(tempProject, ".pi"), { recursive: true });
		writeJson(path.join(tempHome, ".pi", "agent", "settings.json"), {
			subagents: { agentOverrides: { scout: { model: "openai/gpt-5.4" } } },
		});
		writeJson(path.join(tempProject, ".pi", "settings.json"), {
			subagents: { agentOverrides: { scout: { model: "openai-codex/gpt-5.4-mini" } } },
		});

		const scout = discoverAgents(tempProject, "user").agents.find((agent) => agent.name === "scout");
		assert.ok(scout);
		assert.equal(scout.model, "openai/gpt-5.4");
		assert.equal(scout.override?.scope, "user");
	});

	it("does not apply user settings overrides when scope is project", () => {
		fs.mkdirSync(path.join(tempProject, ".pi"), { recursive: true });
		writeJson(path.join(tempHome, ".pi", "agent", "settings.json"), {
			subagents: { agentOverrides: { scout: { model: "openai/gpt-5.4" } } },
		});

		const scout = discoverAgents(tempProject, "project").agents.find((agent) => agent.name === "scout");
		assert.ok(scout);
		assert.notEqual(scout.model, "openai/gpt-5.4");
		assert.equal(scout.override, undefined);
	});

	it("does not read malformed out-of-scope settings files", () => {
		fs.mkdirSync(path.join(tempProject, ".pi"), { recursive: true });
		fs.mkdirSync(path.join(tempHome, ".pi", "agent"), { recursive: true });
		fs.writeFileSync(path.join(tempHome, ".pi", "agent", "settings.json"), '{"subagents":', "utf-8");
		writeJson(path.join(tempProject, ".pi", "settings.json"), {
			subagents: { agentOverrides: { scout: { model: "openai-codex/gpt-5.4-mini" } } },
		});

		const scout = discoverAgents(tempProject, "project").agents.find((agent) => agent.name === "scout");
		assert.ok(scout);
		assert.equal(scout.model, "openai-codex/gpt-5.4-mini");
		assert.equal(scout.override?.scope, "project");
	});

	it("does not apply builtin settings overrides when a full project agent overrides the builtin", () => {
		fs.mkdirSync(path.join(tempProject, ".pi"), { recursive: true });
		writeJson(path.join(tempProject, ".pi", "settings.json"), {
			subagents: { agentOverrides: { scout: { model: "openai/gpt-5.4" } } },
		});
		writeProjectAgent(tempProject, "scout", `---\nname: scout\ndescription: Project scout\nmodel: google/gemini-3-pro\n---\n\nUse the project scout.\n`);

		const scout = discoverAgents(tempProject, "both").agents.find((agent) => agent.name === "scout");
		assert.ok(scout);
		assert.equal(scout.source, "project");
		assert.equal(scout.model, "google/gemini-3-pro");
		assert.equal(scout.override, undefined);
	});

	it("does not create a settings file when removing a non-existent override", () => {
		const settingsPath = path.join(tempHome, ".pi", "agent", "settings.json");
		assert.equal(fs.existsSync(settingsPath), false);
		removeBuiltinAgentOverride(tempProject, "scout", "user");
		assert.equal(fs.existsSync(settingsPath), false);
	});

	it("surfaces malformed settings files instead of silently ignoring them", () => {
		const settingsPath = path.join(tempHome, ".pi", "agent", "settings.json");
		fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
		fs.writeFileSync(settingsPath, '{"subagents":', "utf-8");

		assert.throws(
			() => discoverAgents(tempProject, "both"),
			(error: unknown) => error instanceof Error
				&& error.message.includes(settingsPath)
				&& error.message.includes("Failed to parse settings file"),
		);
	});

	it("surfaces settings read failures without mislabeling them as parse errors", () => {
		const settingsPath = path.join(tempHome, ".pi", "agent", "settings.json");
		fs.mkdirSync(settingsPath, { recursive: true });

		assert.throws(
			() => discoverAgents(tempProject, "both"),
			(error: unknown) => error instanceof Error
				&& error.message.includes(settingsPath)
				&& error.message.includes("Failed to read settings file"),
		);
	});

	it("surfaces malformed builtin override entries instead of silently ignoring them", () => {
		const settingsPath = path.join(tempHome, ".pi", "agent", "settings.json");
		writeJson(settingsPath, {
			subagents: {
				agentOverrides: {
					scout: {
						inheritProjectContext: "true",
					},
				},
			},
		});

		assert.throws(
			() => discoverAgents(tempProject, "both"),
			(error: unknown) => error instanceof Error
				&& error.message.includes(settingsPath)
				&& error.message.includes("scout")
				&& error.message.includes("inheritProjectContext"),
		);
	});

	it("builds false sentinels when an override clears builtin fields", () => {
		const override = buildBuiltinOverrideConfig(
			{
				model: "openai-codex/gpt-5.4-mini",
				fallbackModels: ["openai/gpt-5-mini"],
				thinking: "high",
				systemPromptMode: "append",
				inheritProjectContext: true,
				inheritSkills: false,
				systemPrompt: "Base prompt",
				skills: ["safe-bash"],
				tools: ["bash"],
				mcpDirectTools: ["xcodebuild_list_sims"],
			},
			{
				model: undefined,
				fallbackModels: undefined,
				thinking: undefined,
				systemPromptMode: "replace",
				inheritProjectContext: false,
				inheritSkills: false,
				systemPrompt: "Base prompt",
				skills: undefined,
				tools: undefined,
				mcpDirectTools: undefined,
			},
		);

		assert.deepEqual(override, {
			model: false,
			fallbackModels: false,
			thinking: false,
			systemPromptMode: "replace",
			inheritProjectContext: false,
			skills: false,
			tools: false,
		});
	});
});
