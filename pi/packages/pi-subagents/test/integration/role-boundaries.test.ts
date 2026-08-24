import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { after, afterEach, before, beforeEach, describe, it } from "node:test";
import { createEventBus, createMockPi, createTempDir, makeAgent, makeMinimalCtx, removeTempDir, tryImport, type MockPi } from "../support/helpers.ts";

const executorModule = await tryImport<any>("./subagent-executor.ts");
const agentsModule = await tryImport<any>("./agents.ts");
const available = !!executorModule?.createSubagentExecutor;
const createSubagentExecutor = executorModule?.createSubagentExecutor;

type SnapshotEntry = { type: "directory" | "file" | "symlink"; contents?: Buffer; target?: string };

function snapshot(dir: string): Map<string, SnapshotEntry> {
	const entries = new Map<string, SnapshotEntry>();
	const walk = (current: string) => {
		for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
			const fullPath = path.join(current, entry.name);
			const relative = path.relative(dir, fullPath);
			if (entry.isSymbolicLink()) {
				entries.set(relative, { type: "symlink", target: fs.readlinkSync(fullPath) });
			} else if (entry.isDirectory()) {
				entries.set(relative, { type: "directory" });
				walk(fullPath);
			} else if (entry.isFile()) {
				entries.set(relative, { type: "file", contents: fs.readFileSync(fullPath) });
			}
		}
	};
	walk(dir);
	return entries;
}

function assertUnchanged(before: Map<string, SnapshotEntry>, dir: string): void {
	const after = snapshot(dir);
	assert.deepEqual([...after.keys()].sort(), [...before.keys()].sort());
	for (const [name, entry] of before) {
		const actual = after.get(name);
		assert.deepEqual(actual?.type, entry.type, name);
		if (entry.type === "file") assert.deepEqual(actual?.contents, entry.contents, name);
		if (entry.type === "symlink") assert.equal(actual?.target, entry.target, name);
	}
}

describe("read-only role boundaries", { skip: !available ? "pi packages not available" : undefined }, () => {
	let checkout: string;
	let profile: string;
	let mockPi: MockPi;
	let previousProfile: string | undefined;

	before(() => {
		mockPi = createMockPi();
		mockPi.install();
	});
	after(() => mockPi.uninstall());
	beforeEach(() => {
		checkout = createTempDir("pi-readonly-checkout-");
		profile = createTempDir("pi-readonly-profile-");
		fs.writeFileSync(path.join(checkout, "tracked.txt"), "unchanged\n");
		fs.mkdirSync(path.join(checkout, "existing-dir"));
		fs.symlinkSync("tracked.txt", path.join(checkout, "tracked-link"));
		previousProfile = process.env.PI_CODING_AGENT_DIR;
		process.env.PI_CODING_AGENT_DIR = profile;
		mockPi.reset();
	});
	afterEach(() => {
		if (previousProfile === undefined) delete process.env.PI_CODING_AGENT_DIR;
		else process.env.PI_CODING_AGENT_DIR = previousProfile;
		removeTempDir(checkout);
		removeTempDir(profile);
	});

	function executor(agents: ReturnType<typeof makeAgent>[], bridge = false) {
		return createSubagentExecutor({
			pi: { events: createEventBus(), getSessionName: () => "parent" },
			state: { baseCwd: checkout, currentSessionId: null, asyncJobs: new Map(), foregroundControls: new Map(), lastForegroundControlId: null },
			config: bridge ? { intercomBridge: { mode: "always" } } : {},
			asyncByDefault: false,
			tempArtifactsDir: path.join(profile, "artifacts"),
			getSubagentSessionRoot: () => path.join(profile, "sessions"),
			expandTilde: (value: string) => value,
			discoverAgents: () => ({ agents }),
		});
	}

	const readOnlyAgents = [
		makeAgent("scout", { tools: ["read", "grep", "find", "ls"], maxSubagentDepth: 0 }),
		makeAgent("researcher", { tools: ["read", "web_search", "web_fetch", "deep_research", "batch_enrich", "exa_search"], maxSubagentDepth: 0 }),
		makeAgent("review", { tools: ["read", "grep", "find", "ls"], maxSubagentDepth: 0 }),
	];

	for (const agent of readOnlyAgents) {
		it(`${agent.name} leaves files, directories, and symlinks unchanged in a normal run`, async () => {
			mockPi.onCall({ output: "Findings" });
			const before = snapshot(checkout);
			const result = await executor(readOnlyAgents).execute(
				"normal",
				{ agent: agent.name, task: "Inspect the checkout", artifacts: false },
				new AbortController().signal,
				undefined,
				makeMinimalCtx(checkout),
			);
			assert.equal(result.isError, undefined);
			assertUnchanged(before, checkout);
		});
	}

	const hostileRequests = [
		{ label: "single", params: { agent: "scout", task: "Inspect", output: "escaped.md" } },
		{ label: "top-level parallel", params: { tasks: [{ agent: "researcher", task: "Inspect", progress: true }] } },
		{ label: "sequential chain", params: { chain: [{ agent: "review", task: "Inspect", output: "escaped.md" }], clarify: false } },
		{ label: "parallel chain", params: { chain: [{ parallel: [{ agent: "scout", task: "Inspect", progress: true }] }], clarify: false } },
	];

	for (const request of hostileRequests) {
		it(`rejects ${request.label} output/progress overrides before persistence`, async () => {
			const before = snapshot(checkout);
			const result = await executor(readOnlyAgents).execute(
				"hostile",
				request.params,
				new AbortController().signal,
				undefined,
				makeMinimalCtx(checkout),
			);
			assert.equal(result.isError, true);
			assert.match(result.content[0]?.text ?? "", /Read-only agent/);
			assert.equal(mockPi.callCount(), 0);
			assertUnchanged(before, checkout);
		});
	}

	for (const request of [
		{ label: "single output", params: { agent: "scout", task: "Inspect", clarify: true }, overrides: [{ output: "escaped.md" }] },
		{ label: "chain progress", params: { chain: [{ agent: "review", task: "Inspect" }], clarify: true }, overrides: [{ progress: true }] },
	]) {
		it(`rejects a ${request.label} override returned by clarification`, async () => {
			const before = snapshot(checkout);
			const ctx = makeMinimalCtx(checkout) as any;
			ctx.hasUI = true;
			ctx.ui = {
				custom: async () => ({
					confirmed: true,
					templates: ["Inspect"],
					behaviorOverrides: request.overrides,
				}),
			};
			const result = await executor(readOnlyAgents).execute(
				"hostile-clarification",
				request.params,
				new AbortController().signal,
				undefined,
				ctx,
			);
			assert.equal(result.isError, true);
			assert.match(result.content[0]?.text ?? "", /Read-only agent/);
			assert.equal(mockPi.callCount(), 0);
			assertUnchanged(before, checkout);
		});
	}

	it("strips parent-written defaults from a custom effective read-only configuration", async () => {
		const before = snapshot(checkout);
		mockPi.onCall({ output: "Findings" });
		const result = await executor([makeAgent("evidence", {
			tools: ["read", "web_search"],
			output: "escaped.md",
			defaultProgress: true,
		})]).execute(
			"custom-readonly-defaults",
			{ agent: "evidence", task: "Inspect", artifacts: false },
			new AbortController().signal,
			undefined,
			makeMinimalCtx(checkout),
		);
		assert.equal(result.isError, undefined);
		assertUnchanged(before, checkout);
	});

	it("rejects overrides for a custom effective read-only configuration", async () => {
		const before = snapshot(checkout);
		const result = await executor([makeAgent("evidence", { tools: ["read", "web_search"] })]).execute(
			"custom-readonly",
			{ agent: "evidence", task: "Inspect", progress: false },
			new AbortController().signal,
			undefined,
			makeMinimalCtx(checkout),
		);
		assert.equal(result.isError, true);
		assert.match(result.content[0]?.text ?? "", /Read-only agent 'evidence'/);
		assertUnchanged(before, checkout);
	});

	it("keeps active bridge authority inside the read-only allowlist", async () => {
		fs.mkdirSync(path.join(profile, "extensions", "pi-intercom"), { recursive: true });
		const before = snapshot(checkout);
		mockPi.onCall({ output: "Findings" });
		const result = await executor(readOnlyAgents, true).execute(
			"bridge",
			{ agent: "researcher", task: "Inspect", artifacts: false },
			new AbortController().signal,
			undefined,
			makeMinimalCtx(checkout),
		);
		assert.equal(result.isError, undefined);
		const call = fs.readdirSync(mockPi.dir).find((entry) => entry.startsWith("call-"));
		assert.ok(call);
		const args = JSON.parse(fs.readFileSync(path.join(mockPi.dir, call), "utf-8")).args as string[];
		assert.ok(args.includes("--tools"));
		assert.ok(args.includes("read,web_search,web_fetch,deep_research,batch_enrich,exa_search"));
		assert.ok(!args.includes("--no-extensions"));
		assert.ok(!args[args.indexOf("--tools") + 1]?.split(",").includes("intercom"));
		assertUnchanged(before, checkout);
	});

	for (const profileProvider of ["openai", "openai-codex"]) {
		it(`resolves all role defaults through the ${profileProvider} profile provider and preserves max at launch`, async () => {
			const profileName = profileProvider === "openai" ? "work" : "personal";
			const activeProfile = path.join(profile, ".pi", profileName);
			process.env.PI_CODING_AGENT_DIR = activeProfile;
			const reviewFrontmatter = fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..", "agents", "review.frontmatter"), "utf-8");
			fs.mkdirSync(path.join(activeProfile, "agents"), { recursive: true });
			fs.writeFileSync(path.join(activeProfile, "agents", "review.md"), `---\n${reviewFrontmatter}---\n\nReview the requested change.\n`);
			const roles = agentsModule.discoverAgents(checkout, "both").agents
				.filter((agent: { name: string }) => ["scout", "researcher", "worker", "review"].includes(agent.name))
				.sort((a: { name: string }, b: { name: string }) => ["scout", "researcher", "worker", "review"].indexOf(a.name) - ["scout", "researcher", "worker", "review"].indexOf(b.name));
			assert.deepEqual(roles.map((agent: { name: string; model?: string; thinking?: string }) => [agent.name, agent.model, agent.thinking]), [
				["scout", "gpt-5.6-luna", "high"],
				["researcher", "gpt-5.6-terra", "high"],
				["worker", "gpt-5.6-luna", "max"],
				["review", "gpt-5.6-sol", "xhigh"],
			]);
			mockPi.onCall({ output: "Done" });
			const ctx = makeMinimalCtx(checkout);
			ctx.model = { provider: profileProvider };
			ctx.modelRegistry.getAvailable = () => [
				{ provider: profileProvider, id: "gpt-5.6-luna" },
				{ provider: profileProvider, id: "gpt-5.6-terra" },
				{ provider: profileProvider, id: "gpt-5.6-sol" },
			];
			for (const role of roles) {
				const result = await executor(roles).execute(
					`routing-${role.name}`,
					{ agent: role.name, task: "Report", artifacts: false },
					new AbortController().signal,
					undefined,
					ctx,
				);
				assert.equal(result.isError, undefined);
			}
			const calls = fs.readdirSync(mockPi.dir).filter((entry) => entry.startsWith("call-")).sort();
			assert.equal(calls.length, roles.length);
			const models = calls.map((call) => {
				const args = JSON.parse(fs.readFileSync(path.join(mockPi.dir, call), "utf-8")).args as string[];
				return args[args.indexOf("--model") + 1];
			});
			assert.deepEqual(models, [
				`${profileProvider}/gpt-5.6-luna:high`,
				`${profileProvider}/gpt-5.6-terra:high`,
				`${profileProvider}/gpt-5.6-luna:max`,
				`${profileProvider}/gpt-5.6-sol:xhigh`,
			]);
		});
	}
});
