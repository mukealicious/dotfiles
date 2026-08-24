import { describe, test, before, after } from "node:test";
import * as assert from "node:assert";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { discoverAgents } from "./agents.ts";
import { resolveSkillPath, clearSkillCache } from "./skills.ts";

let tmpDir = "";
let cwdDir = "";
let homeDir = "";
let profileDir = "";
let originalHome: string | undefined;
let originalUserProfile: string | undefined;
let originalProfile: string | undefined;

before(() => {
	tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-path-resolution-test-"));
	cwdDir = path.join(tmpDir, "cwd");
	homeDir = path.join(tmpDir, "home");
	profileDir = path.join(homeDir, ".pi", "personal");
	fs.mkdirSync(cwdDir, { recursive: true });
	fs.mkdirSync(homeDir, { recursive: true });

	originalHome = process.env.HOME;
	originalUserProfile = process.env.USERPROFILE;
	originalProfile = process.env.PI_CODING_AGENT_DIR;
	process.env.HOME = homeDir;
	process.env.USERPROFILE = homeDir;
	process.env.PI_CODING_AGENT_DIR = profileDir;
});

after(() => {
	clearSkillCache();
	if (originalHome === undefined) delete process.env.HOME;
	else process.env.HOME = originalHome;
	if (originalUserProfile === undefined) delete process.env.USERPROFILE;
	else process.env.USERPROFILE = originalUserProfile;
	if (originalProfile === undefined) delete process.env.PI_CODING_AGENT_DIR;
	else process.env.PI_CODING_AGENT_DIR = originalProfile;
	fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("Path resolution for .agents skills and active-profile agents", () => {
	test("should resolve skills in .agents/skills", () => {
		const skillsDir = path.join(cwdDir, ".agents", "skills");
		fs.mkdirSync(skillsDir, { recursive: true });
		fs.writeFileSync(path.join(skillsDir, "test-skill-1.md"), "---\nname: test-skill-1\ndescription: test desc\n---\nSkill content");

		clearSkillCache();
		const resolved = resolveSkillPath("test-skill-1", cwdDir);
		assert.ok(resolved);
		assert.strictEqual(resolved?.path, path.join(skillsDir, "test-skill-1.md"));
	});

	test("should resolve skills in ~/.agents/skills", () => {
		const userSkillsDir = path.join(homeDir, ".agents", "skills");
		fs.mkdirSync(userSkillsDir, { recursive: true });
		fs.writeFileSync(path.join(userSkillsDir, "test-skill-2.md"), "---\nname: test-skill-2\ndescription: test desc\n---\nSkill content");

		clearSkillCache();
		const resolved = resolveSkillPath("test-skill-2", cwdDir);
		assert.ok(resolved);
		assert.strictEqual(resolved?.path, path.join(userSkillsDir, "test-skill-2.md"));
	});

	test("should resolve project agents from both .agents and .pi/agents", () => {
		const legacyDir = path.join(cwdDir, ".agents");
		const agentsDir = path.join(cwdDir, ".pi", "agents");
		fs.mkdirSync(path.join(cwdDir, ".agents", "skills"), { recursive: true });
		fs.mkdirSync(legacyDir, { recursive: true });
		fs.mkdirSync(agentsDir, { recursive: true });
		fs.writeFileSync(
			path.join(legacyDir, "test-agent-legacy.md"),
			"---\nname: test-agent-legacy\ndescription: Legacy agent\n---\nLegacy content",
		);
		fs.writeFileSync(
			path.join(agentsDir, "test-agent-1.md"),
			"---\nname: test-agent-1\ndescription: Test agent\n---\nAgent content",
		);

		const result = discoverAgents(cwdDir, "project");
		const legacyAgent = result.agents.find((agent) => agent.name === "test-agent-legacy");
		const agent = result.agents.find((candidate) => candidate.name === "test-agent-1");
		assert.ok(legacyAgent);
		assert.strictEqual(legacyAgent?.filePath, path.join(legacyDir, "test-agent-legacy.md"));
		assert.ok(agent);
		assert.strictEqual(agent?.filePath, path.join(agentsDir, "test-agent-1.md"));
	});

	test("should resolve user agents only from the active profile", () => {
		const homeAgentsDir = path.join(homeDir, ".agents");
		const profileAgentsDir = path.join(profileDir, "agents");
		fs.mkdirSync(homeAgentsDir, { recursive: true });
		fs.mkdirSync(profileAgentsDir, { recursive: true });
		fs.writeFileSync(
			path.join(homeAgentsDir, "ignored-agent.md"),
			"---\nname: ignored-agent\ndescription: Ignored agent\n---\nAgent content",
		);
		fs.writeFileSync(
			path.join(profileAgentsDir, "profile-agent.md"),
			"---\nname: profile-agent\ndescription: Profile agent\n---\nAgent content",
		);

		const result = discoverAgents(cwdDir, "user");
		assert.equal(result.agents.some((agent) => agent.name === "ignored-agent"), false);
		const agent = result.agents.find((candidate) => candidate.name === "profile-agent");
		assert.ok(agent);
		assert.strictEqual(agent?.filePath, path.join(profileAgentsDir, "profile-agent.md"));
	});
});
