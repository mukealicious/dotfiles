import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { cleanupAllArtifactDirs } from "../../artifacts.ts";
import { getSubagentConfigPath, loadConfig } from "../../config.ts";
import {
	diagnoseIntercomBridge,
	getIntercomConfigPath,
	getIntercomExtensionDir,
	getSubagentConfigDir,
	resolveIntercomBridge,
} from "../../intercom-bridge.ts";
import { getRunHistoryPath, loadRunsForAgent, recordRun } from "../../run-history.ts";
import { clearSkillCache, discoverAvailableSkills } from "../../skills.ts";

let root = "";
let savedEnv: Record<string, string | undefined>;

function setProfile(profileDir: string | undefined): void {
	if (profileDir === undefined) delete process.env.PI_CODING_AGENT_DIR;
	else process.env.PI_CODING_AGENT_DIR = profileDir;
	clearSkillCache();
}

function writePackageSkill(packageRoot: string, name: string): void {
	fs.mkdirSync(path.join(packageRoot, "skills", name), { recursive: true });
	fs.writeFileSync(
		path.join(packageRoot, "package.json"),
		JSON.stringify({ name, pi: { skills: ["./skills"] } }),
		"utf-8",
	);
	fs.writeFileSync(path.join(packageRoot, "skills", name, "SKILL.md"), `${name}\n`, "utf-8");
}

function writeProfileSkills(profileDir: string, prefix: string): void {
	fs.mkdirSync(path.join(profileDir, "skills", `${prefix}-direct`), { recursive: true });
	fs.writeFileSync(path.join(profileDir, "skills", `${prefix}-direct`, "SKILL.md"), `${prefix} direct\n`, "utf-8");
	fs.writeFileSync(path.join(profileDir, `${prefix}-settings.md`), `${prefix} settings\n`, "utf-8");
	writePackageSkill(path.join(profileDir, "packages", `${prefix}-package`), `${prefix}-package`);
	writePackageSkill(path.join(profileDir, "npm", "node_modules", `${prefix}-installed`), `${prefix}-installed`);
	fs.writeFileSync(
		path.join(profileDir, "settings.json"),
		JSON.stringify({
			skills: [`./${prefix}-settings.md`],
			packages: [`./packages/${prefix}-package`],
		}),
		"utf-8",
	);
}

beforeEach(() => {
	root = fs.mkdtempSync(path.join(os.tmpdir(), "pi-subagent-profile-state-"));
	savedEnv = {
		HOME: process.env.HOME,
		USERPROFILE: process.env.USERPROFILE,
		PI_CODING_AGENT_DIR: process.env.PI_CODING_AGENT_DIR,
	};
	process.env.HOME = path.join(root, "home");
	process.env.USERPROFILE = process.env.HOME;
	fs.mkdirSync(process.env.HOME, { recursive: true });
});

afterEach(() => {
	clearSkillCache();
	for (const [key, value] of Object.entries(savedEnv)) {
		if (value === undefined) delete process.env[key];
		else process.env[key] = value;
	}
	fs.rmSync(root, { recursive: true, force: true });
});

describe("profile-scoped runtime state", () => {
	it("isolates extension config and preserves the no-environment fallback", () => {
		const work = path.join(root, "profiles", "work");
		const personal = path.join(root, "profiles", "personal");
		for (const [profile, asyncByDefault] of [[work, true], [personal, false]] as const) {
			fs.mkdirSync(path.join(profile, "extensions", "subagent"), { recursive: true });
			fs.writeFileSync(path.join(profile, "extensions", "subagent", "config.json"), JSON.stringify({ asyncByDefault }), "utf-8");
		}
		const fallback = path.join(process.env.HOME!, ".pi", "agent");
		fs.mkdirSync(path.join(fallback, "extensions", "subagent"), { recursive: true });
		fs.writeFileSync(path.join(fallback, "extensions", "subagent", "config.json"), JSON.stringify({ maxSubagentDepth: 0 }), "utf-8");

		setProfile(work);
		assert.equal(getSubagentConfigPath(), path.join(work, "extensions", "subagent", "config.json"));
		assert.equal(loadConfig().asyncByDefault, true);
		setProfile(personal);
		assert.equal(getSubagentConfigPath(), path.join(personal, "extensions", "subagent", "config.json"));
		assert.equal(loadConfig().asyncByDefault, false);
		setProfile(undefined);
		assert.equal(getSubagentConfigPath(), path.join(fallback, "extensions", "subagent", "config.json"));
		assert.equal(loadConfig().maxSubagentDepth, 0);
	});

	it("isolates user skills, settings-declared skills, and settings packages", () => {
		const work = path.join(root, "profiles", "work");
		const personal = path.join(root, "profiles", "personal");
		const fallback = path.join(process.env.HOME!, ".pi", "agent");
		writeProfileSkills(work, "work");
		writeProfileSkills(personal, "personal");
		writeProfileSkills(fallback, "fallback");

		for (const [profile, prefix] of [[work, "work"], [personal, "personal"], [undefined, "fallback"]] as const) {
			setProfile(profile);
			const names = discoverAvailableSkills(root).map((skill) => skill.name);
			assert.ok(names.includes(`${prefix}-direct`));
			assert.ok(names.includes(`${prefix}-settings`));
			assert.ok(names.includes(`${prefix}-package`));
			assert.ok(names.includes(`${prefix}-installed`));
			const other = prefix === "work" ? "personal" : "work";
			assert.ok(!names.includes(`${other}-direct`));
			assert.ok(!names.includes(`${other}-installed`));
		}
	});

	it("isolates run history, intercom roots, and session artifact cleanup", () => {
		const work = path.join(root, "profiles", "work");
		const personal = path.join(root, "profiles", "personal");
		const fallback = path.join(process.env.HOME!, ".pi", "agent");
		for (const profile of [work, personal, fallback]) {
			fs.mkdirSync(path.join(profile, "extensions", "pi-intercom"), { recursive: true });
			fs.mkdirSync(path.join(profile, "intercom"), { recursive: true });
			fs.writeFileSync(path.join(profile, "intercom", "config.json"), JSON.stringify({ enabled: true }), "utf-8");
		}

		setProfile(work);
		recordRun("worker", "work task", 0, 1);
		assert.equal(getRunHistoryPath(), path.join(work, "run-history.jsonl"));
		assert.equal(loadRunsForAgent("worker")[0]?.task, "work task");
		assert.equal(getIntercomExtensionDir(), path.join(work, "extensions", "pi-intercom"));
		assert.equal(getIntercomConfigPath(), path.join(work, "intercom", "config.json"));
		assert.equal(getSubagentConfigDir(), path.join(work, "extensions", "subagent"));
		assert.equal(resolveIntercomBridge({ config: { mode: "always" }, context: "fresh", orchestratorTarget: "main" }).active, true);

		setProfile(personal);
		recordRun("worker", "personal task", 0, 1);
		assert.equal(loadRunsForAgent("worker")[0]?.task, "personal task");
		assert.equal(fs.existsSync(path.join(work, "run-history.jsonl")), true);
		assert.equal(diagnoseIntercomBridge({ config: { mode: "always" }, context: "fresh", orchestratorTarget: "main" }).extensionDir, path.join(personal, "extensions", "pi-intercom"));

		const oldWorkArtifact = path.join(work, "sessions", "work-session", "subagent-artifacts", "old.md");
		const oldPersonalArtifact = path.join(personal, "sessions", "personal-session", "subagent-artifacts", "old.md");
		fs.mkdirSync(path.dirname(oldWorkArtifact), { recursive: true });
		fs.mkdirSync(path.dirname(oldPersonalArtifact), { recursive: true });
		fs.writeFileSync(oldWorkArtifact, "old", "utf-8");
		fs.writeFileSync(oldPersonalArtifact, "old", "utf-8");
		const stale = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
		fs.utimesSync(oldWorkArtifact, stale, stale);
		fs.utimesSync(oldPersonalArtifact, stale, stale);
		setProfile(work);
		cleanupAllArtifactDirs(1);
		assert.equal(fs.existsSync(oldWorkArtifact), false);
		assert.equal(fs.existsSync(oldPersonalArtifact), true);

		setProfile(undefined);
		recordRun("worker", "fallback task", 0, 1);
		assert.equal(loadRunsForAgent("worker")[0]?.task, "fallback task");
		assert.equal(getIntercomConfigPath(), path.join(fallback, "intercom", "config.json"));
	});
});
