import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { describe, it } from "node:test";
import { createTempDir, removeTempDir, tryImport } from "../support/helpers.ts";

interface AsyncJobTrackerModule {
	createAsyncJobTracker(
		pi: { events: { emit(channel: string, data: unknown): void } },
		state: Record<string, unknown>,
		asyncDirRoot: string,
		options?: { completionRetentionMs?: number; pollIntervalMs?: number },
	): {
		resetJobs(ctx?: unknown): void;
		handleStarted(data: unknown): void;
		handleComplete(data: unknown): void;
	};
}

const trackerMod = await tryImport<AsyncJobTrackerModule>("./async-job-tracker.ts");
const available = !!trackerMod;

function createState() {
	return {
		baseCwd: "/repo",
		currentSessionId: null,
		asyncJobs: new Map(),
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
	};
}

function createEventRecorder() {
	const events: Array<{ channel: string; data: unknown }> = [];
	return {
		pi: {
			events: {
				emit: (channel: string, data: unknown) => {
					events.push({ channel, data });
				},
			},
		},
		events,
	};
}

function createUiContext() {
	const widgets: unknown[] = [];
	let renderRequests = 0;
	const ctx = {
		hasUI: true,
		ui: {
			theme: {
				fg: (_theme: string, text: string) => text,
			},
			setWidget: (_key: string, value: unknown) => {
				widgets.push(value);
			},
			requestRender: () => {
				renderRequests += 1;
			},
		},
	};
	return {
		ctx,
		get widgets() {
			return widgets;
		},
		get renderRequests() {
			return renderRequests;
		},
	};
}

describe("async job tracker", { skip: !available ? "pi packages not available" : undefined }, () => {
	it("removes completed jobs after retention and requests a rerender", async () => {
		const asyncRoot = createTempDir("pi-async-job-tracker-");
		try {
			const state = createState();
			const ui = createUiContext();
			const recorder = createEventRecorder();
			const tracker = trackerMod!.createAsyncJobTracker(recorder.pi, state as never, asyncRoot, {
				completionRetentionMs: 5,
			});
			tracker.resetJobs(ui.ctx as never);
			tracker.handleStarted({ id: "run-1", asyncDir: path.join(asyncRoot, "run-1"), agent: "worker" });
			tracker.handleComplete({ id: "run-1", success: true });

			assert.equal(state.asyncJobs.size, 1);
			await new Promise((resolve) => setTimeout(resolve, 40));

			assert.equal(state.asyncJobs.size, 0);
			assert.ok(ui.renderRequests > 0, "expected widget cleanup to request a rerender");
			assert.equal(ui.widgets.at(-1), undefined);
		} finally {
			removeTempDir(asyncRoot);
		}
	});

	it("schedules cleanup when polling observes a completed status without a completion event", async () => {
		const asyncRoot = createTempDir("pi-async-job-tracker-");
		try {
			const runDir = path.join(asyncRoot, "run-2");
			fs.mkdirSync(runDir, { recursive: true });
			fs.writeFileSync(path.join(runDir, "status.json"), JSON.stringify({
				runId: "run-2",
				mode: "single",
				state: "complete",
				startedAt: Date.now() - 1000,
				lastUpdate: Date.now(),
				steps: [{ agent: "worker", status: "complete" }],
			}), "utf-8");

			const state = createState();
			const ui = createUiContext();
			const recorder = createEventRecorder();
			const tracker = trackerMod!.createAsyncJobTracker(recorder.pi, state as never, asyncRoot, {
				completionRetentionMs: 5,
				pollIntervalMs: 10,
			});
			tracker.resetJobs(ui.ctx as never);
			tracker.handleStarted({ id: "run-2", asyncDir: runDir, agent: "worker" });

			await new Promise((resolve) => setTimeout(resolve, 80));

			assert.equal(state.asyncJobs.size, 0);
			assert.ok(ui.renderRequests > 0, "expected polling cleanup to request a rerender");
			assert.equal(ui.widgets.at(-1), undefined);
		} finally {
			removeTempDir(asyncRoot);
		}
	});

	it("keeps incomplete async control event lines for the next poll", async () => {
		const asyncRoot = createTempDir("pi-async-job-tracker-");
		try {
			const runDir = path.join(asyncRoot, "run-partial");
			fs.mkdirSync(runDir, { recursive: true });
			fs.writeFileSync(path.join(runDir, "status.json"), JSON.stringify({
				runId: "run-partial",
				mode: "single",
				state: "running",
				startedAt: Date.now() - 1000,
				lastUpdate: Date.now(),
				steps: [{ agent: "worker", status: "running" }],
			}), "utf-8");
			const eventPath = path.join(runDir, "events.jsonl");
			const partialRecord = JSON.stringify({
				type: "subagent.control",
				channels: ["event"],
				event: {
					type: "needs_attention",
					to: "needs_attention",
					ts: 123,
					runId: "run-partial",
					agent: "worker",
					message: "worker needs attention",
				},
			});
			fs.writeFileSync(eventPath, partialRecord, "utf-8");

			const state = createState();
			const recorder = createEventRecorder();
			const tracker = trackerMod!.createAsyncJobTracker(recorder.pi, state as never, asyncRoot, {
				pollIntervalMs: 10,
			});
			tracker.handleStarted({ id: "run-partial", asyncDir: runDir, agent: "worker" });

			await new Promise((resolve) => setTimeout(resolve, 30));
			assert.equal(recorder.events.length, 0);

			fs.appendFileSync(eventPath, "\n", "utf-8");
			await new Promise((resolve) => setTimeout(resolve, 30));
			assert.equal(recorder.events.some((event) => event.channel === "subagent:control-event"), true);
		} finally {
			removeTempDir(asyncRoot);
		}
	});

	it("honors async control notification channels", async () => {
		const asyncRoot = createTempDir("pi-async-job-tracker-");
		try {
			const runDir = path.join(asyncRoot, "run-channels");
			fs.mkdirSync(runDir, { recursive: true });
			fs.writeFileSync(path.join(runDir, "status.json"), JSON.stringify({
				runId: "run-channels",
				mode: "single",
				state: "running",
				startedAt: Date.now() - 1000,
				lastUpdate: Date.now(),
				steps: [{ agent: "worker", status: "running" }],
			}), "utf-8");
			fs.writeFileSync(path.join(runDir, "events.jsonl"), `${JSON.stringify({
				type: "subagent.control",
				channels: ["intercom"],
				event: {
					type: "needs_attention",
					to: "needs_attention",
					ts: 123,
					runId: "run-channels",
					agent: "worker",
					message: "worker needs attention",
				},
				intercom: { to: "main", message: "SUBAGENT NEEDS ATTENTION: worker in run run-channels." },
			})}\n`, "utf-8");

			const state = createState();
			const recorder = createEventRecorder();
			const tracker = trackerMod!.createAsyncJobTracker(recorder.pi, state as never, asyncRoot, {
				pollIntervalMs: 10,
			});
			tracker.handleStarted({ id: "run-channels", asyncDir: runDir, agent: "worker" });

			await new Promise((resolve) => setTimeout(resolve, 30));
			assert.equal(recorder.events.some((event) => event.channel === "subagent:control-event"), false);
			assert.equal(recorder.events.some((event) => event.channel === "subagent:control-intercom"), true);
		} finally {
			removeTempDir(asyncRoot);
		}
	});

	it("bridges async control events from events.jsonl to the parent event bus", async () => {
		const asyncRoot = createTempDir("pi-async-job-tracker-");
		try {
			const runDir = path.join(asyncRoot, "run-3");
			fs.mkdirSync(runDir, { recursive: true });
			fs.writeFileSync(path.join(runDir, "status.json"), JSON.stringify({
				runId: "run-3",
				mode: "single",
				state: "running",
				startedAt: Date.now() - 1000,
				lastUpdate: Date.now(),
				steps: [{ agent: "worker", status: "running" }],
			}), "utf-8");
			fs.writeFileSync(path.join(runDir, "events.jsonl"), `${JSON.stringify({
				type: "subagent.control",
				channels: ["event", "intercom"],
				childIntercomTarget: "subagent-worker-run-3-1",
				noticeText: "Subagent needs attention: worker\nNudge: intercom({ action: \"send\", to: \"subagent-worker-run-3-1\", message: \"<message>\" })",
				event: {
					type: "needs_attention",
					to: "needs_attention",
					ts: 123,
					runId: "run-3",
					agent: "worker",
					message: "worker needs attention",
				},
				intercom: { to: "main", message: "SUBAGENT NEEDS ATTENTION: worker in run run-3." },
			})}\n`, "utf-8");

			const state = createState();
			const recorder = createEventRecorder();
			const tracker = trackerMod!.createAsyncJobTracker(recorder.pi, state as never, asyncRoot, {
				pollIntervalMs: 10,
			});
			tracker.handleStarted({ id: "run-3", asyncDir: runDir, agent: "worker" });

			await new Promise((resolve) => setTimeout(resolve, 40));

			const controlEvent = recorder.events.find((event) => event.channel === "subagent:control-event");
			assert.ok(controlEvent);
			assert.match((controlEvent.data as { noticeText?: string }).noticeText ?? "", /subagent-worker-run-3-1/);
			assert.equal(recorder.events.some((event) => event.channel === "subagent:control-intercom"), true);
		} finally {
			removeTempDir(asyncRoot);
		}
	});
});
