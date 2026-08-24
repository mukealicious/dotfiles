import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
	clearSkillCache,
	discoverAvailableSkills,
	resolveSkills,
	resolveSkillsWithFallback,
} from "../../skills.ts";

let tempDir = "";
const originalProfile = process.env.PI_CODING_AGENT_DIR;

function makeProjectSkill(cwd: string, name: string, body: string): void {
	const skillDir = path.join(cwd, ".pi", "skills", name);
	fs.mkdirSync(skillDir, { recursive: true });
	fs.writeFileSync(
		path.join(skillDir, "SKILL.md"),
		`---\ndescription: Test description\n---\n\n${body}\n`,
		"utf-8",
	);
}

function makeProjectPackageSkill(cwd: string, packageName: string, name: string, body: string): void {
	const packageRoot = path.join(cwd, ".pi", "npm", "node_modules", packageName);
	makePackageSkill(packageRoot, name, body, packageName);
}

function makePackageSkill(packageRoot: string, name: string, body: string, packageName = `${name}-pkg`): void {
	const skillDir = path.join(packageRoot, "skills", name);
	fs.mkdirSync(skillDir, { recursive: true });
	fs.writeFileSync(
		path.join(packageRoot, "package.json"),
		JSON.stringify({ name: packageName, version: "1.0.0", pi: { skills: ["./skills"] } }, null, 2),
		"utf-8",
	);
	fs.writeFileSync(path.join(skillDir, "SKILL.md"), `${body}\n`, "utf-8");
}

async function importSkillsFresh() {
	const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
	const modulePath = path.resolve(projectRoot, "skills.ts");
	const bust = `${Date.now()}-${Math.random()}`;
	return await import(`${pathToFileURL(modulePath).href}?bust=${bust}`) as typeof import("../../skills.ts");
}

describe("skills filesystem fallback", () => {
	beforeEach(() => {
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-skills-fallback-"));
		clearSkillCache();
		delete process.env.PI_CODING_AGENT_DIR;
	});

	afterEach(() => {
		clearSkillCache();
		if (originalProfile === undefined) delete process.env.PI_CODING_AGENT_DIR;
		else process.env.PI_CODING_AGENT_DIR = originalProfile;
		fs.rmSync(tempDir, { recursive: true, force: true });
	});

	it("discovers project skills from filesystem paths", () => {
		makeProjectSkill(tempDir, "fallback-skill", "Use fallback mode.");

		const skills = discoverAvailableSkills(tempDir);
		const discovered = skills.find((skill) => skill.name === "fallback-skill");
		assert.ok(discovered, "expected fallback-skill to be discovered");
		assert.equal(discovered?.source, "project");
		assert.equal(discovered?.description, "Test description");
	});

	it("resolves and reads skill content via filesystem fallback", () => {
		makeProjectSkill(tempDir, "resolve-skill", "Run local fallback checks.");

		const { resolved, missing } = resolveSkills(["resolve-skill"], tempDir);
		assert.deepEqual(missing, []);
		assert.equal(resolved.length, 1);
		assert.equal(resolved[0]?.name, "resolve-skill");
		assert.equal(resolved[0]?.source, "project");
		assert.match(resolved[0]?.content ?? "", /Run local fallback checks\./);
	});

	it("hides and rejects manual-only skills from delegated injection", () => {
		const skillDir = path.join(tempDir, ".pi", "skills", "manual-only");
		fs.mkdirSync(skillDir, { recursive: true });
		fs.writeFileSync(
			path.join(skillDir, "SKILL.md"),
			"---\nname: manual-only\ndescription: Manual-only test skill.\ndisable-model-invocation: true # explicit-only\n---\n\nDo not delegate.\n",
			"utf-8",
		);

		assert.equal(discoverAvailableSkills(tempDir).some((skill) => skill.name === "manual-only"), false);
		assert.throws(
			() => resolveSkills(["manual-only"], tempDir),
			/manual-only and cannot be injected into a subagent/,
		);
	});

	it("fails closed on malformed skill frontmatter", () => {
		const skillDir = path.join(tempDir, ".pi", "skills", "malformed");
		fs.mkdirSync(skillDir, { recursive: true });
		fs.writeFileSync(
			path.join(skillDir, "SKILL.md"),
			"---\nname: malformed\ndescription: [unterminated\n---\n\nDo not inject.\n",
			"utf-8",
		);

		assert.equal(discoverAvailableSkills(tempDir).some((skill) => skill.name === "malformed"), false);
		assert.throws(
			() => resolveSkills(["malformed"], tempDir),
			/invalid frontmatter and cannot be injected into a subagent/,
		);
	});

	it("does not discover installed project packages unless settings declare them", () => {
		makeProjectPackageSkill(tempDir, "test-skill-package", "pkg-skill", "Use package skill.");

		const skills = discoverAvailableSkills(tempDir);
		assert.equal(skills.some((skill) => skill.name === "pkg-skill"), false);
	});

	it("prefers project skills over settings-declared project-package skills with the same name", () => {
		makeProjectPackageSkill(tempDir, "test-skill-package", "shared-skill", "Package version");
		makeProjectSkill(tempDir, "shared-skill", "Project version");
		fs.writeFileSync(
			path.join(tempDir, ".pi", "settings.json"),
			JSON.stringify({ packages: ["npm:test-skill-package@1.0.0"] }, null, 2),
			"utf-8",
		);

		const { resolved, missing } = resolveSkills(["shared-skill"], tempDir);
		assert.deepEqual(missing, []);
		assert.equal(resolved.length, 1);
		assert.equal(resolved[0]?.source, "project");
		assert.match(resolved[0]?.content ?? "", /Project version/);
	});

	it("discovers skills from project settings packages", () => {
		const packageRoot = path.join(tempDir, ".pi", "packages", "local-skill-pkg");
		makePackageSkill(packageRoot, "settings-package-skill", "Settings package skill.");
		fs.mkdirSync(path.join(tempDir, ".pi"), { recursive: true });
		fs.writeFileSync(
			path.join(tempDir, ".pi", "settings.json"),
			JSON.stringify({ packages: ["./packages/local-skill-pkg"] }, null, 2),
			"utf-8",
		);

		const { resolved, missing } = resolveSkills(["settings-package-skill"], tempDir);
		assert.deepEqual(missing, []);
		assert.equal(resolved.length, 1);
		assert.equal(resolved[0]?.source, "project-package");
	});

	it("discovers skills from project settings npm package sources", () => {
		const packageRoot = path.join(tempDir, ".pi", "npm", "node_modules", "@scope", "skill-package");
		makePackageSkill(
			packageRoot,
			"project-settings-scoped-npm-package-skill",
			"Project settings scoped npm package skill.",
			"@scope/skill-package",
		);
		fs.mkdirSync(path.join(tempDir, ".pi"), { recursive: true });
		fs.writeFileSync(
			path.join(tempDir, ".pi", "settings.json"),
			JSON.stringify({ packages: ["npm:@scope/skill-package@1.2.3"] }, null, 2),
			"utf-8",
		);

		const { resolved, missing } = resolveSkills(["project-settings-scoped-npm-package-skill"], tempDir);
		assert.deepEqual(missing, []);
		assert.equal(resolved.length, 1);
		assert.equal(resolved[0]?.source, "project-package");
	});

	it("lets a project package override disable the same profile package", () => {
		const profileDir = path.join(tempDir, "profile");
		const userPackageRoot = path.join(profileDir, "npm", "node_modules", "shared-package");
		const projectPackageRoot = path.join(tempDir, ".pi", "npm", "node_modules", "shared-package");
		process.env.PI_CODING_AGENT_DIR = profileDir;
		makePackageSkill(userPackageRoot, "profile-copy", "Profile package skill.", "shared-package");
		makePackageSkill(projectPackageRoot, "project-copy", "Project package skill.", "shared-package");
		fs.mkdirSync(path.join(tempDir, ".pi"), { recursive: true });
		fs.writeFileSync(
			path.join(profileDir, "settings.json"),
			JSON.stringify({ packages: ["npm:shared-package@1.0.0"] }, null, 2),
			"utf-8",
		);
		fs.writeFileSync(
			path.join(tempDir, ".pi", "settings.json"),
			JSON.stringify({ packages: [{ source: "npm:shared-package@2.0.0", skills: [] }] }, null, 2),
			"utf-8",
		);
		clearSkillCache();

		const { resolved, missing } = resolveSkills(["profile-copy", "project-copy"], tempDir);
		assert.deepEqual(resolved, []);
		assert.deepEqual(missing, ["profile-copy", "project-copy"]);
	});

	it("applies project autoload deltas over the same profile package", () => {
		const profileDir = path.join(tempDir, "profile");
		const userPackageRoot = path.join(profileDir, "npm", "node_modules", "shared-package");
		process.env.PI_CODING_AGENT_DIR = profileDir;
		makePackageSkill(userPackageRoot, "allowed", "Allowed profile package skill.", "shared-package");
		makePackageSkill(userPackageRoot, "blocked", "Blocked profile package skill.", "shared-package");
		fs.mkdirSync(path.join(tempDir, ".pi"), { recursive: true });
		fs.writeFileSync(
			path.join(profileDir, "settings.json"),
			JSON.stringify({ packages: ["npm:shared-package@1.0.0"] }, null, 2),
			"utf-8",
		);
		fs.writeFileSync(
			path.join(tempDir, ".pi", "settings.json"),
			JSON.stringify({
				packages: [{
					source: "npm:shared-package@2.0.0",
					autoload: false,
					skills: ["-skills/blocked/SKILL.md"],
				}],
			}, null, 2),
			"utf-8",
		);
		clearSkillCache();

		const { resolved, missing } = resolveSkills(["allowed", "blocked"], tempDir);
		assert.deepEqual(resolved.map((skill) => skill.name), ["allowed"]);
		assert.deepEqual(missing, ["blocked"]);
	});

	it("does not discover the current cwd package unless settings declare it", () => {
		makePackageSkill(tempDir, "cwd-package-skill", "Cwd package skill.");

		const { resolved, missing } = resolveSkills(["cwd-package-skill"], tempDir);
		assert.deepEqual(resolved, []);
		assert.deepEqual(missing, ["cwd-package-skill"]);
	});

	it("falls back to the runtime cwd when the execution cwd lacks the skill", () => {
		const nestedDir = path.join(tempDir, "nested");
		fs.mkdirSync(nestedDir, { recursive: true });
		makeProjectSkill(tempDir, "runtime-fallback-skill", "Runtime fallback skill.");

		const { resolved, missing } = resolveSkillsWithFallback(["runtime-fallback-skill"], nestedDir, tempDir);
		assert.deepEqual(missing, []);
		assert.equal(resolved.length, 1);
		assert.equal(resolved[0]?.source, "project");
	});

	it("discovers skills from user settings packages", async () => {
		const fakeHome = path.join(tempDir, "fake-home");
		const userAgentDir = path.join(fakeHome, ".pi", "agent");
		const userPackageRoot = path.join(userAgentDir, "user-pkg");
		const previousHome = process.env.HOME;
		const previousUserProfile = process.env.USERPROFILE;

		try {
			process.env.HOME = fakeHome;
			process.env.USERPROFILE = fakeHome;
			makePackageSkill(userPackageRoot, "user-settings-package-skill", "User settings package skill.");
			fs.mkdirSync(userAgentDir, { recursive: true });
			fs.writeFileSync(
				path.join(userAgentDir, "settings.json"),
				JSON.stringify({ packages: [{ source: "./user-pkg" }] }, null, 2),
				"utf-8",
			);

			const fresh = await importSkillsFresh();
			fresh.clearSkillCache();
			const discovered = fresh.discoverAvailableSkills(tempDir);
			const skill = discovered.find((entry) => entry.name === "user-settings-package-skill");
			assert.ok(skill);
			assert.equal(skill?.source, "user-package");
		} finally {
			if (previousHome === undefined) delete process.env.HOME;
			else process.env.HOME = previousHome;
			if (previousUserProfile === undefined) delete process.env.USERPROFILE;
			else process.env.USERPROFILE = previousUserProfile;
		}
	});

	it("discovers skills from user settings git package sources", async () => {
		const fakeHome = path.join(tempDir, "fake-home");
		const userAgentDir = path.join(fakeHome, ".pi", "agent");
		const packageRoot = path.join(userAgentDir, "git", "github.com", "user", "repo");
		const previousHome = process.env.HOME;
		const previousUserProfile = process.env.USERPROFILE;

		try {
			process.env.HOME = fakeHome;
			process.env.USERPROFILE = fakeHome;
			makePackageSkill(packageRoot, "user-settings-git-package-skill", "User settings git package skill.");
			fs.mkdirSync(userAgentDir, { recursive: true });
			fs.writeFileSync(
				path.join(userAgentDir, "settings.json"),
				JSON.stringify({ packages: ["git:github.com/user/repo.git@main"] }, null, 2),
				"utf-8",
			);

			const fresh = await importSkillsFresh();
			fresh.clearSkillCache();
			const discovered = fresh.discoverAvailableSkills(tempDir);
			const skill = discovered.find((entry) => entry.name === "user-settings-git-package-skill");
			assert.ok(skill);
			assert.equal(skill?.source, "user-package");
		} finally {
			if (previousHome === undefined) delete process.env.HOME;
			else process.env.HOME = previousHome;
			if (previousUserProfile === undefined) delete process.env.USERPROFILE;
			else process.env.USERPROFILE = previousUserProfile;
		}
	});

	it("discovers skills from user settings scoped npm package sources", async () => {
		const fakeHome = path.join(tempDir, "fake-home");
		const userAgentDir = path.join(fakeHome, ".pi", "agent");
		const packageRoot = path.join(userAgentDir, "npm", "node_modules", "@scope", "skill-package");
		const previousHome = process.env.HOME;
		const previousUserProfile = process.env.USERPROFILE;

		try {
			process.env.HOME = fakeHome;
			process.env.USERPROFILE = fakeHome;
			makePackageSkill(
				packageRoot,
				"user-settings-scoped-npm-package-skill",
				"User settings scoped npm package skill.",
				"@scope/skill-package",
			);
			fs.mkdirSync(userAgentDir, { recursive: true });
			fs.writeFileSync(
				path.join(userAgentDir, "settings.json"),
				JSON.stringify({ packages: [{ source: "npm:@scope/skill-package@latest" }] }, null, 2),
				"utf-8",
			);

			const fresh = await importSkillsFresh();
			fresh.clearSkillCache();
			const discovered = fresh.discoverAvailableSkills(tempDir);
			const skill = discovered.find((entry) => entry.name === "user-settings-scoped-npm-package-skill");
			assert.ok(skill);
			assert.equal(skill?.source, "user-package");
		} finally {
			if (previousHome === undefined) delete process.env.HOME;
			else process.env.HOME = previousHome;
			if (previousUserProfile === undefined) delete process.env.USERPROFILE;
			else process.env.USERPROFILE = previousUserProfile;
		}
	});

	it("honors positive package skill filters without scanning unrelated installed packages", async () => {
		const fakeHome = path.join(tempDir, "fake-home");
		const userAgentDir = path.join(fakeHome, ".pi", "agent");
		const filteredPackage = path.join(userAgentDir, "packages", "filtered-package");
		const unrelatedPackage = path.join(userAgentDir, "npm", "node_modules", "unrelated-package");
		const previousHome = process.env.HOME;
		const previousUserProfile = process.env.USERPROFILE;

		try {
			process.env.HOME = fakeHome;
			process.env.USERPROFILE = fakeHome;
			makePackageSkill(filteredPackage, "allowed-skill", "Allowed package skill.");
			const blockedDir = path.join(filteredPackage, "skills", "blocked-skill");
			fs.mkdirSync(blockedDir, { recursive: true });
			fs.writeFileSync(path.join(blockedDir, "SKILL.md"), "Blocked package skill.\n", "utf-8");
			if (process.platform !== "win32") {
				fs.symlinkSync(filteredPackage, path.join(filteredPackage, "skills", "package-loop"));
			}
			makePackageSkill(unrelatedPackage, "unrelated-skill", "Unrelated installed package skill.");
			fs.mkdirSync(userAgentDir, { recursive: true });
			fs.writeFileSync(
				path.join(userAgentDir, "settings.json"),
				JSON.stringify({
					packages: [{
						source: "./packages/filtered-package",
						skills: ["skills/allowed-skill/SKILL.md"],
					}],
				}, null, 2),
				"utf-8",
			);

			const fresh = await importSkillsFresh();
			fresh.clearSkillCache();
			const discovered = fresh.discoverAvailableSkills(tempDir).map((entry) => entry.name);
			assert.ok(discovered.includes("allowed-skill"));
			assert.ok(!discovered.includes("blocked-skill"));
			assert.ok(!discovered.includes("unrelated-skill"));
		} finally {
			if (previousHome === undefined) delete process.env.HOME;
			else process.env.HOME = previousHome;
			if (previousUserProfile === undefined) delete process.env.USERPROFILE;
			else process.env.USERPROFILE = previousUserProfile;
		}
	});

	it("surfaces malformed project settings files instead of silently ignoring them", () => {
		fs.mkdirSync(path.join(tempDir, ".pi"), { recursive: true });
		fs.writeFileSync(path.join(tempDir, ".pi", "settings.json"), "{bad-json", "utf-8");

		assert.throws(
			() => resolveSkills(["missing-skill"], tempDir),
			/Failed to read skills settings file .+\.pi[\\/]settings\.json/,
		);
	});

	it("surfaces malformed explicit settings package manifests instead of silently ignoring them", () => {
		const packageRoot = path.join(tempDir, ".pi", "packages", "broken-package");
		fs.mkdirSync(packageRoot, { recursive: true });
		fs.writeFileSync(path.join(packageRoot, "package.json"), "{bad-json", "utf-8");
		fs.mkdirSync(path.join(tempDir, ".pi"), { recursive: true });
		fs.writeFileSync(
			path.join(tempDir, ".pi", "settings.json"),
			JSON.stringify({ packages: ["./packages/broken-package"] }, null, 2),
			"utf-8",
		);

		assert.throws(
			() => discoverAvailableSkills(tempDir),
			/Failed to read package manifest .+broken-package[\\/]package\.json/,
		);
	});
});
