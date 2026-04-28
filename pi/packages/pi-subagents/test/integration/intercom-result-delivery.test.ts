import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { after, afterEach, before, beforeEach, describe, it } from "node:test";
import type { MockPi } from "../support/helpers.ts";
import {
	createMockPi,
	createTempDir,
	makeAgent,
	makeMinimalCtx,
	removeTempDir,
	tryImport,
} from "../support/helpers.ts";

interface ExecutorResult {
	content: Array<{ text?: string }>;
	isError?: boolean;
	details?: {
		mode?: string;
		results?: Array<{ agent?: string; finalOutput?: string }>;
	};
}

interface ExecutorModule {
	createSubagentExecutor?: (...args: unknown[]) => {
		execute: (
			id: string,
			params: Record<string, unknown>,
			signal: AbortSignal,
			onUpdate: ((result: unknown) => void) | undefined,
			ctx: unknown,
		) => Promise<ExecutorResult>;
	};
}

const executorMod = await tryImport<ExecutorModule>("./subagent-executor.ts");
const available = !!executorMod?.createSubagentExecutor;
const createSubagentExecutor = executorMod?.createSubagentExecutor;

function createRecordingEventBus(options: { acknowledgeResults?: boolean } = {}) {
	const listeners = new Map<string, Set<(payload: unknown) => void>>();
	const emitted: Array<{ channel: string; payload: unknown }> = [];
	const bus = {
		emitted,
		on(channel: string, handler: (payload: unknown) => void) {
			const channelListeners = listeners.get(channel) ?? new Set();
			channelListeners.add(handler);
			listeners.set(channel, channelListeners);
			return () => {
				channelListeners.delete(handler);
				if (channelListeners.size === 0) listeners.delete(channel);
			};
		},
		emit(channel: string, payload: unknown) {
			emitted.push({ channel, payload });
			for (const handler of listeners.get(channel) ?? []) {
				handler(payload);
			}
			if (options.acknowledgeResults && channel === "subagent:result-intercom") {
				const requestId = payload && typeof payload === "object" ? (payload as { requestId?: unknown }).requestId : undefined;
				if (typeof requestId === "string") {
					setImmediate(() => bus.emit("subagent:result-intercom-delivery", { requestId, delivered: true }));
				}
			}
		},
	};
	return bus;
}

describe("intercom result delivery cutover", { skip: !available ? "executor not importable" : undefined }, () => {
	let tempDir: string;
	let homeDir: string;
	let mockPi: MockPi;
	let originalHome: string | undefined;
	let originalUserProfile: string | undefined;

	before(() => {
		originalHome = process.env.HOME;
		originalUserProfile = process.env.USERPROFILE;
		homeDir = createTempDir("pi-subagent-intercom-home-");
		process.env.HOME = homeDir;
		process.env.USERPROFILE = homeDir;
		mockPi = createMockPi();
		mockPi.install();
		fs.mkdirSync(path.join(os.homedir(), ".pi", "agent", "extensions", "pi-intercom"), { recursive: true });
		fs.mkdirSync(path.join(os.homedir(), ".pi", "agent", "intercom"), { recursive: true });
		fs.writeFileSync(path.join(os.homedir(), ".pi", "agent", "intercom", "config.json"), JSON.stringify({ enabled: true }), "utf-8");
	});

	after(() => {
		mockPi.uninstall();
		if (originalHome === undefined) delete process.env.HOME;
		else process.env.HOME = originalHome;
		if (originalUserProfile === undefined) delete process.env.USERPROFILE;
		else process.env.USERPROFILE = originalUserProfile;
		removeTempDir(homeDir);
	});

	beforeEach(() => {
		tempDir = createTempDir("pi-subagent-intercom-result-");
		mockPi.reset();
	});

	afterEach(() => {
		removeTempDir(tempDir);
	});

	function makeExecutor(options: { bridgeMode?: "always" | "off"; agents?: ReturnType<typeof makeAgent>[]; acknowledgeResults?: boolean } = {}) {
		const events = createRecordingEventBus({ acknowledgeResults: options.acknowledgeResults ?? true });
		const executor = createSubagentExecutor!({
			pi: {
				events,
				getSessionName: () => "orchestrator",
				setSessionName: () => {},
			},
			state: {
				baseCwd: tempDir,
				currentSessionId: null,
				asyncJobs: new Map(),
				foregroundControls: new Map(),
				lastForegroundControlId: null,
				cleanupTimers: new Map(),
				lastUiContext: null,
				poller: null,
				completionSeen: new Map(),
				watcher: null,
				watcherRestartTimer: null,
				resultFileCoalescer: {
					schedule: () => false,
					clear: () => {},
				},
			},
			config: {
				intercomBridge: { mode: options.bridgeMode ?? "always" },
			},
			asyncByDefault: false,
			tempArtifactsDir: tempDir,
			getSubagentSessionRoot: () => tempDir,
			expandTilde: (value: string) => value,
			discoverAgents: () => ({ agents: options.agents ?? [makeAgent("worker")] }),
		});
		return { executor, events };
	}

	it("single foreground runs emit one grouped event and return a compact receipt", async () => {
		mockPi.onCall({ output: "Full child output from worker" });
		const { executor, events } = makeExecutor();

		const result = await executor.execute(
			"single-intercom",
			{ agent: "worker", task: "Implement feature" },
			new AbortController().signal,
			undefined,
			makeMinimalCtx(tempDir),
		);

		const intercomEvents = events.emitted.filter((entry) => entry.channel === "subagent:result-intercom");
		assert.equal(intercomEvents.length, 1);
		const payload = intercomEvents[0]!.payload as { children?: Array<{ agent?: string; intercomTarget?: string }>; message?: string; mode?: string };
		assert.equal(payload.mode, "single");
		assert.equal(payload.children?.length, 1);
		assert.equal(payload.children?.[0]?.agent, "worker");
		assert.match(payload.children?.[0]?.intercomTarget ?? "", /^subagent-worker-[a-f0-9]+-1$/);
		assert.match(String(payload.message ?? ""), /For clarification, message a listed subagent at its Intercom target\./);
		assert.match(String(payload.message ?? ""), /Intercom target: subagent-worker-[a-f0-9]+-1/);
		assert.match(result.content[0]?.text ?? "", /Delivered single subagent result via intercom\./);
		assert.doesNotMatch(result.content[0]?.text ?? "", /Full child output from worker/);
		assert.equal(result.details?.results?.[0]?.finalOutput, undefined);
		assert.match(String(payload.message ?? ""), /Full child output from worker/);
	});

	it("falls back to legacy foreground output when the bridge is inactive", async () => {
		mockPi.onCall({ output: "Legacy foreground output" });
		const { executor, events } = makeExecutor({ bridgeMode: "off" });

		const result = await executor.execute(
			"single-no-intercom",
			{ agent: "worker", task: "Implement feature" },
			new AbortController().signal,
			undefined,
			makeMinimalCtx(tempDir),
		);

		assert.equal(events.emitted.some((entry) => entry.channel === "subagent:result-intercom"), false);
		assert.match(result.content[0]?.text ?? "", /Legacy foreground output/);
	});

	it("falls back to legacy foreground output when grouped delivery is not acknowledged", async () => {
		mockPi.onCall({ output: "Unacknowledged foreground output" });
		const { executor, events } = makeExecutor({ acknowledgeResults: false });

		const result = await executor.execute(
			"single-no-ack",
			{ agent: "worker", task: "Implement feature" },
			new AbortController().signal,
			undefined,
			makeMinimalCtx(tempDir),
		);

		assert.equal(events.emitted.some((entry) => entry.channel === "subagent:result-intercom"), true);
		assert.match(result.content[0]?.text ?? "", /Unacknowledged foreground output/);
	});

	it("top-level parallel runs emit one grouped event containing all children", async () => {
		mockPi.onCall({ output: "Parallel child output" });
		const { executor, events } = makeExecutor({ agents: [makeAgent("a"), makeAgent("b")] });

		const result = await executor.execute(
			"parallel-intercom",
			{ tasks: [{ agent: "a", task: "task-a" }, { agent: "b", task: "task-b" }] },
			new AbortController().signal,
			undefined,
			makeMinimalCtx(tempDir),
		);

		const intercomEvents = events.emitted.filter((entry) => entry.channel === "subagent:result-intercom");
		assert.equal(intercomEvents.length, 1);
		const payload = intercomEvents[0]!.payload as { children?: Array<{ agent?: string; intercomTarget?: string }>; message?: string; mode?: string };
		assert.equal(payload.mode, "parallel");
		assert.deepEqual((payload.children ?? []).map((child) => child.agent).sort(), ["a", "b"]);
		assert.equal((payload.children ?? []).every((child) => /^subagent-[ab]-[a-f0-9]+-[12]$/.test(child.intercomTarget ?? "")), true);
		assert.match(String(payload.message ?? ""), /For clarification, message a listed subagent at its Intercom target\./);
		assert.match(String(payload.message ?? ""), /Intercom target: subagent-a-[a-f0-9]+-1/);
		assert.match(String(payload.message ?? ""), /1\. a — completed/);
		assert.match(String(payload.message ?? ""), /2\. b — completed/);
		assert.match(result.content[0]?.text ?? "", /Delivered parallel subagent results via intercom\./);
		assert.equal(result.details?.results?.every((entry) => entry.finalOutput === undefined), true);
	});

	it("chain runs emit one grouped event containing all executed children", async () => {
		mockPi.onCall({ output: "Chain child output" });
		const { executor, events } = makeExecutor({ agents: [makeAgent("a"), makeAgent("b"), makeAgent("c")] });

		const result = await executor.execute(
			"chain-intercom",
			{
				chain: [
					{ agent: "a", task: "step-a" },
					{ parallel: [{ agent: "b", task: "step-b" }, { agent: "c", task: "step-c" }] },
				],
			},
			new AbortController().signal,
			undefined,
			makeMinimalCtx(tempDir),
		);

		const intercomEvents = events.emitted.filter((entry) => entry.channel === "subagent:result-intercom");
		assert.equal(intercomEvents.length, 1);
		const payload = intercomEvents[0]!.payload as { children?: Array<{ agent?: string; intercomTarget?: string }>; message?: string; mode?: string };
		assert.equal(payload.mode, "chain");
		assert.deepEqual((payload.children ?? []).map((child) => child.agent).sort(), ["a", "b", "c"]);
		assert.equal((payload.children ?? []).every((child) => /^subagent-[abc]-[a-f0-9]+-[123]$/.test(child.intercomTarget ?? "")), true);
		assert.match(String(payload.message ?? ""), /1\. a — completed/);
		assert.match(String(payload.message ?? ""), /2\. b — completed/);
		assert.match(String(payload.message ?? ""), /3\. c — completed/);
		assert.match(result.content[0]?.text ?? "", /Delivered chain subagent results via intercom\./);
		assert.equal(result.details?.results?.every((entry) => entry.finalOutput === undefined), true);
	});

	it("mixed foreground outcomes produce failed grouped status and receipt counts", async () => {
		mockPi.onCall({ output: "Parallel child success", exitCode: 0 });
		mockPi.onCall({ output: "Parallel child failure", exitCode: 1 });
		const { executor, events } = makeExecutor({ agents: [makeAgent("a"), makeAgent("b")] });

		const result = await executor.execute(
			"parallel-mixed-intercom",
			{ tasks: [{ agent: "a", task: "task-a" }, { agent: "b", task: "task-b" }] },
			new AbortController().signal,
			undefined,
			makeMinimalCtx(tempDir),
		);

		const intercomEvents = events.emitted.filter((entry) => entry.channel === "subagent:result-intercom");
		assert.equal(intercomEvents.length, 1);
		const payload = intercomEvents[0]!.payload as { status?: string; summary?: string; message?: string };
		assert.equal(payload.status, "failed");
		assert.match(String(payload.summary ?? ""), /1 completed, 1 failed/);
		assert.match(String(payload.message ?? ""), /Status: failed/);
		assert.match(result.content[0]?.text ?? "", /Children: 1 completed, 1 failed/);
	});
});
