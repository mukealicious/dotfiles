import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, readdir, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { stripVTControlCharacters } from "node:util";
import test from "node:test";
import { visibleWidth } from "@earendil-works/pi-tui";

import { type AssistantMessage, InMemoryCredentialStore, type StopReason, type UserMessage } from "@earendil-works/pi-ai";
import {
	discoverAndLoadExtensions,
	ExtensionRunner,
	initTheme,
	ModelRegistry,
	ModelRuntime,
	SessionManager,
	type ExtensionCommandContextActions,
} from "@earendil-works/pi-coding-agent";

const extensionPath = join(dirname(fileURLToPath(import.meta.url)), "..", "handoff.ts");
initTheme("dark", false);

function userMessage(text: string): UserMessage {
	return {
		role: "user",
		content: [{ type: "text", text }],
		timestamp: Date.now(),
	};
}

function assistantMessage(stopReason: StopReason): AssistantMessage {
	return {
		role: "assistant",
		content: [{ type: "text", text: "Handoff written." }],
		api: "openai-responses",
		provider: "openai",
		model: "test-model",
		usage: {
			input: 0,
			output: 0,
			cacheRead: 0,
			cacheWrite: 0,
			totalTokens: 0,
			cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
		},
		stopReason,
		timestamp: Date.now(),
	};
}

async function createHandoffHarness(
	cwd: string,
	harnessOptions: {
		handoffStopReason?: StopReason;
		editorBeforeNavigation?: string;
		editorAfterNavigation?: string;
		sessionDir?: string;
		navigationCancelled?: boolean;
		navigationError?: string;
		continuationError?: string;
		deferContinuation?: boolean;
		controlReports?: Array<{ route: "here" | "external" | "document"; destinations?: Array<{
			id: string; name?: string; status: "planned" | "prepared" | "launched" | "start-confirmed" | "failed";
			document?: string; locator?: string; detail: string;
		}> }>;
		shutdownAfterReports?: boolean;
	} = {},
) {
	const credentials = new InMemoryCredentialStore();
	const modelRuntime = await ModelRuntime.create({
		credentials,
		modelsPath: null,
		allowModelNetwork: false,
	});
	const model = modelRuntime.getModels()[0];
	assert.ok(model, "the bundled model catalog should not be empty");
	await credentials.modify(model.provider, async () => ({ type: "api_key", key: "test-key" }));

	const sessionManager = SessionManager.create(cwd, harnessOptions.sessionDir ?? join(cwd, ".sessions"));
	const loaded = await discoverAndLoadExtensions([extensionPath], cwd, join(cwd, ".agent"));
	assert.deepEqual(loaded.errors, []);

	const modelRegistry = new ModelRegistry(modelRuntime);
	const runner = new ExtensionRunner(
		loaded.extensions,
		loaded.runtime,
		cwd,
		sessionManager,
		modelRegistry,
	);
	const sentUserMessages: Array<{
		readonly content: string;
		readonly options?: {
			readonly deliverAs?: "steer" | "followUp";
			readonly expandPromptTemplates?: boolean;
		};
	}> = [];
	let handoffAssistantEntryId: string | undefined;
	loaded.runtime.appendEntry = (type, data) => { sessionManager.appendCustomEntry(type, data); };
	loaded.runtime.setLabel = (id, label) => { sessionManager.appendLabelChange(id, label); };
	const startContinuation = async (prompt = sentUserMessages.at(-1)?.content ?? "") => {
		await runner.emitBeforeAgentStart(prompt, undefined, "", { cwd });
		await runner.emit({ type: "agent_start" });
	};
	loaded.runtime.sendUserMessage = (content, options) => {
		if (typeof content !== "string") {
			throw new Error("Handoff test received unexpected image content");
		}
		sentUserMessages.push({ content, ...(options ? { options } : {}) });
		if (content.startsWith("/skill:handoff")) {
			sessionManager.appendMessage(userMessage(content));
			queueMicrotask(() => void runner.emit({ type: "agent_start" }));
		} else {
			if (harnessOptions.continuationError) throw new Error(harnessOptions.continuationError);
			sessionManager.appendMessage(userMessage(content));
			if (!harnessOptions.deferContinuation) queueMicrotask(() => void startContinuation(content));
		}
	};

	runner.bindCore(loaded.runtime, {
		getModel: () => model,
		getScopedModels: () => [],
		isIdle: () => true,
		isProjectTrusted: () => true,
		getSignal: () => undefined,
		abort: () => undefined,
		hasPendingMessages: () => false,
		shutdown: () => undefined,
		getContextUsage: () => undefined,
		compact: () => undefined,
		getSystemPrompt: () => "",
	});

	let editorText = harnessOptions.editorBeforeNavigation ?? "";
	const navigations: Array<{
		readonly targetId: string;
		readonly options?: {
			readonly summarize?: boolean;
			readonly customInstructions?: string;
			readonly replaceInstructions?: boolean;
			readonly label?: string;
		};
	}> = [];
	let waitForIdleCalls = 0;
	const commandActions: ExtensionCommandContextActions = {
		waitForIdle: async () => {
			waitForIdleCalls += 1;
			if (waitForIdleCalls === 2) {
				const tool = runner.getToolDefinition("handoff_control");
				assert.ok(tool);
				for (const report of harnessOptions.controlReports ?? [{ route: "here" }]) {
					await tool.execute("control", report, undefined, undefined, runner.createContext());
				}
				handoffAssistantEntryId = sessionManager.appendMessage(
					assistantMessage(harnessOptions.handoffStopReason ?? "stop"),
				);
				if (harnessOptions.shutdownAfterReports) await runner.emit({ type: "session_shutdown", reason: "quit" });
			}
		},
		newSession: async () => ({ cancelled: false }),
		fork: async () => ({ cancelled: false }),
		navigateTree: async (targetId, options) => {
			navigations.push({ targetId, ...(options ? { options } : {}) });
			if (harnessOptions.navigationError) throw new Error(harnessOptions.navigationError);
			if (harnessOptions.navigationCancelled) return { cancelled: true };
			const target = sessionManager.getEntry(targetId);
			const targetText = target?.type === "message" && target.message.role === "user"
				? (Array.isArray(target.message.content)
					? target.message.content.filter((part) => part.type === "text").map((part) => part.text).join("")
					: target.message.content)
				: "";
			const oldLeafId = sessionManager.getLeafId();
			const summaryId = sessionManager.branchWithSummary(target?.parentId ?? null, "Handoff summary");
			if (options?.label) sessionManager.appendLabelChange(summaryId, options.label);
			await runner.emit({ type: "session_tree", oldLeafId, newLeafId: sessionManager.getLeafId(), summaryEntry: sessionManager.getEntry(summaryId) as import("@earendil-works/pi-coding-agent").BranchSummaryEntry });
			editorText = harnessOptions.editorAfterNavigation ?? targetText;
			return { cancelled: false };
		},
		switchSession: async () => ({ cancelled: false }),
		reload: async () => undefined,
	};
	runner.bindCommandContext(commandActions);

	const editorValues: string[] = [];
	const widgets: Array<string[] | undefined> = [];
	const notifications: Array<{ readonly message: string; readonly type?: "info" | "warning" | "error" }> = [];
	runner.setUIContext({
		...runner.getUIContext(),
		notify: (message, type) => notifications.push({ message, ...(type ? { type } : {}) }),
		setWidget: (_key, content) => {
			assert.ok(content === undefined || Array.isArray(content));
			widgets.push(content);
		},
		getEditorText: () => editorText,
		setEditorText: (value) => {
			editorText = value;
			editorValues.push(value);
		},
	});

	return {
		editorValues,
		navigations,
		notifications,
		runner,
		sentUserMessages,
		sessionManager,
		widgets,
		startContinuation,
		loaded,
		waitForIdleCalls: () => waitForIdleCalls,
		handoffAssistantEntryId: () => handoffAssistantEntryId,
	};
}

test("/handoff runs the handoff skill, summarizes to the first message, and continues", async () => {
	const cwd = await mkdtemp(join(tmpdir(), "pi-handoff-"));

	try {
		const harness = await createHandoffHarness(cwd);
		const firstUserMessageEntryId = harness.sessionManager.appendMessage(
			userMessage("Implement the feature"),
		);
		harness.sessionManager.appendMessage(userMessage("Use tests"));

		const command = harness.runner.getCommand("handoff");
		assert.ok(command, "/handoff should be registered");
		await command.handler("focus on error recovery", harness.runner.createCommandContext());

		const sessionFile = harness.sessionManager.getSessionFile();
		const sourceLeafEntryId = harness.handoffAssistantEntryId();
		assert.ok(sessionFile);
		assert.ok(sourceLeafEntryId);
		assert.deepEqual(harness.sentUserMessages, [
			{
				content: "/skill:handoff focus on error recovery",
				options: { expandPromptTemplates: true },
			},
			{
				content: `Open the handoff document identified in the branch summary. Resume the work by performing its next unfinished step.\n\nThe source branch ends at session tree entry ${JSON.stringify(sourceLeafEntryId)} in ${JSON.stringify(sessionFile)}. If the handoff leaves a blocking ambiguity, inspect that JSONL with read or bash. Reconstruct the source branch by following parentId links from the entry ID; append order may include other branches. Recover the needed context, then resume.`,
			},
		]);
		assert.deepEqual(harness.navigations, [
			{
				targetId: firstUserMessageEntryId,
				options: {
					summarize: true,
					label: `handoff resume ← ${sourceLeafEntryId}`,
					customInstructions:
						"The source branch produced a handoff document. Include its exact absolute path so the next turn can open it. Keep the document as the source of truth; use the branch summary to orient the next turn toward continuing the work. The next turn's focus is: focus on error recovery",
				},
			},
		]);
		assert.equal(harness.waitForIdleCalls(), 2);
		assert.deepEqual(harness.editorValues, [""]);
	} finally {
		await rm(cwd, { recursive: true, force: true });
	}
});

test("/handoff accepts no focus prompt", async () => {
	const cwd = await mkdtemp(join(tmpdir(), "pi-handoff-"));

	try {
		const harness = await createHandoffHarness(cwd);
		harness.sessionManager.appendMessage(userMessage("Implement the feature"));

		const command = harness.runner.getCommand("handoff");
		assert.ok(command);
		await command.handler("   ", harness.runner.createCommandContext());

		assert.equal(harness.sentUserMessages[0]?.content, "/skill:handoff");
	} finally {
		await rm(cwd, { recursive: true, force: true });
	}
});

test("/handoff retains the source branch when the handoff turn is aborted", async () => {
	const cwd = await mkdtemp(join(tmpdir(), "pi-handoff-"));

	try {
		const harness = await createHandoffHarness(cwd, { handoffStopReason: "aborted" });
		harness.sessionManager.appendMessage(userMessage("Implement the feature"));
		const command = harness.runner.getCommand("handoff");
		assert.ok(command);

		await command.handler("", harness.runner.createCommandContext());

		assert.equal(harness.sentUserMessages.length, 1);
		assert.deepEqual(harness.navigations, []);
		assert.deepEqual(harness.editorValues, []);
		assert.ok(harness.sessionManager.getBranch().some((entry) => entry.id === harness.handoffAssistantEntryId()));
		assert.equal(receipts(harness)[0]?.data.sourceId, harness.handoffAssistantEntryId());
		assert.equal(receipts(harness)[0]?.data.outcome, "cancelled");
		assert.deepEqual(harness.notifications, [
			{
				message: "Handoff document turn did not complete (aborted); source branch retained",
				type: "warning",
			},
		]);
	} finally {
		await rm(cwd, { recursive: true, force: true });
	}
});

test("/handoff preserves a draft that navigation did not replace", async () => {
	const cwd = await mkdtemp(join(tmpdir(), "pi-handoff-"));

	try {
		const harness = await createHandoffHarness(cwd, { editorAfterNavigation: "keep this draft" });
		harness.sessionManager.appendMessage(userMessage("Implement the feature"));
		const command = harness.runner.getCommand("handoff");
		assert.ok(command);

		await command.handler("", harness.runner.createCommandContext());

		assert.deepEqual(harness.editorValues, []);
		assert.equal(harness.sentUserMessages.length, 2);
	} finally {
		await rm(cwd, { recursive: true, force: true });
	}
});

test("/handoff does not clear a preexisting draft that equals the restored prompt", async () => {
	const cwd = await mkdtemp(join(tmpdir(), "pi-handoff-"));

	try {
		const prompt = "Implement the feature";
		const harness = await createHandoffHarness(cwd, {
			editorBeforeNavigation: prompt,
			editorAfterNavigation: prompt,
		});
		harness.sessionManager.appendMessage(userMessage(prompt));
		const command = harness.runner.getCommand("handoff");
		assert.ok(command);

		await command.handler("", harness.runner.createCommandContext());

		assert.deepEqual(harness.editorValues, []);
		assert.equal(harness.sentUserMessages.length, 2);
	} finally {
		await rm(cwd, { recursive: true, force: true });
	}
});

test("/handoff warns when there is no conversation", async () => {
	const cwd = await mkdtemp(join(tmpdir(), "pi-handoff-"));

	try {
		const harness = await createHandoffHarness(cwd);
		const command = harness.runner.getCommand("handoff");
		assert.ok(command);
		await command.handler("", harness.runner.createCommandContext());

		assert.deepEqual(harness.sentUserMessages, []);
		assert.deepEqual(harness.navigations, []);
		assert.deepEqual(harness.notifications, [
			{ message: "There is no conversation to hand off", type: "warning" },
		]);
	} finally {
		await rm(cwd, { recursive: true, force: true });
	}
});

test("/handoff preserves profile, cwd, Herdr identity, and dirty Git state in-process", async () => {
	const cwd = await realpath(await mkdtemp(join(tmpdir(), "pi-handoff-")));
	const sessionDir = await realpath(await mkdtemp(join(tmpdir(), "pi-handoff-sessions-")));
	const previousCwd = process.cwd();
	const trackedEnvironment = {
		PI_CODING_AGENT_DIR: process.env.PI_CODING_AGENT_DIR,
		HERDR_ENV: process.env.HERDR_ENV,
		HERDR_WORKSPACE_ID: process.env.HERDR_WORKSPACE_ID,
		HERDR_TAB_ID: process.env.HERDR_TAB_ID,
		HERDR_PANE_ID: process.env.HERDR_PANE_ID,
	};
	const profileDir = join(cwd, ".pi", "personal");
	const herdrIdentity = {
		HERDR_ENV: "1",
		HERDR_WORKSPACE_ID: "workspace-test",
		HERDR_TAB_ID: "tab-test",
		HERDR_PANE_ID: "pane-test",
	};

	try {
		execFileSync("git", ["init", "--quiet"], { cwd });
		await writeFile(join(cwd, "uncommitted.txt"), "uncommitted handoff smoke\n", "utf8");
		process.env.PI_CODING_AGENT_DIR = profileDir;
		for (const [name, value] of Object.entries(herdrIdentity)) {
			process.env[name] = value;
		}
		process.chdir(cwd);

		const harness = await createHandoffHarness(cwd, { sessionDir });
		harness.sessionManager.appendMessage(userMessage("Continue without changing process state"));
		const statusBefore = execFileSync("git", ["status", "--porcelain=1", "--untracked-files=all"], {
			cwd,
			encoding: "utf8",
		});
		const processId = process.pid;
		const command = harness.runner.getCommand("handoff");
		assert.ok(command);

		await command.handler("preserve the current process", harness.runner.createCommandContext());

		assert.equal(process.pid, processId);
		assert.equal(process.cwd(), cwd);
		assert.equal(process.env.PI_CODING_AGENT_DIR, profileDir);
		for (const [name, value] of Object.entries(herdrIdentity)) {
			assert.equal(process.env[name], value);
		}
		assert.equal(
			execFileSync("git", ["status", "--porcelain=1", "--untracked-files=all"], {
				cwd,
				encoding: "utf8",
			}),
			statusBefore,
		);
	} finally {
		process.chdir(previousCwd);
		for (const [name, value] of Object.entries(trackedEnvironment)) {
			if (value === undefined) {
				delete process.env[name];
			} else {
				process.env[name] = value;
			}
		}
		await rm(cwd, { recursive: true, force: true });
		await rm(sessionDir, { recursive: true, force: true });
	}
});

function receipts(harness: Awaited<ReturnType<typeof createHandoffHarness>>) {
	return harness.sessionManager.getEntries().filter(
		(entry) => entry.type === "custom" && entry.customType === "handoff-receipt",
	).map((entry) => {
		assert.ok(entry.type === "custom" && entry.data && typeof entry.data === "object");
		return { ...entry, data: entry.data as Record<string, unknown> };
	});
}

async function runHandoff(harness: Awaited<ReturnType<typeof createHandoffHarness>>) {
	const command = harness.runner.getCommand("handoff");
	assert.ok(command);
	await command.handler("", harness.runner.createCommandContext());
}

async function waitForContinuation(harness: Awaited<ReturnType<typeof createHandoffHarness>>) {
	for (let i = 0; i < 100 && harness.sentUserMessages.length < 2; i++) {
		await new Promise((resolve) => setImmediate(resolve));
	}
	assert.equal(harness.sentUserMessages.length, 2, "continuation should be submitted");
}

test("handoff progress spans branch redraw, labels both branches, and persists a bounded receipt outside model context", async () => {
	const cwd = await mkdtemp(join(tmpdir(), "pi-handoff-"));
	try {
		const harness = await createHandoffHarness(cwd);
		harness.sessionManager.appendMessage(userMessage("Implement the feature"));
		await runHandoff(harness);
		const sourceId = harness.handoffAssistantEntryId();
		assert.ok(sourceId);
		assert.equal(harness.sessionManager.getLabel(sourceId), "handoff source");
		const summary = harness.sessionManager.getBranch().find((entry) => entry.type === "branch_summary");
		assert.ok(summary);
		assert.equal(harness.sessionManager.getLabel(summary.id), `handoff resume ← ${sourceId}`);
		assert.ok(harness.widgets.some((lines) => lines?.includes("› Write handoff document")));
		assert.ok(harness.widgets.filter((lines) => lines?.includes("› Summarize and switch branch")).length >= 2, "progress is republished on session_tree");
		assert.ok(harness.widgets.some((lines) => lines?.includes("› Start continuation")));
		assert.equal(harness.widgets.at(-1), undefined);
		const receipt = receipts(harness)[0];
		assert.ok(receipt?.type === "custom");
		assert.equal(receipts(harness).length, 1);
		assert.equal(receipt.data.outcome, "started");
		assert.equal(receipt.data.sourceId, sourceId);
		assert.equal(receipt.data.targetId, summary.id);
		const renderer = harness.runner.getEntryRenderer("handoff-receipt");
		assert.ok(renderer);
		for (const expanded of [false, true]) {
			const component = renderer(receipt, { expanded }, harness.runner.getUIContext().theme);
			assert.ok(component);
			for (const width of [20, 40, 80]) {
				const lines = component.render(width);
				assert.ok(lines.every((line) => visibleWidth(line) <= width));
			}
			const rendered = stripVTControlCharacters(component.render(120).join("\n"));
			if (expanded) assert.match(rendered, /not verified/);
			else {
				assert.match(rendered, /Continuation started/);
				assert.doesNotMatch(rendered, /not verified|Source session:|Started:|source [a-f0-9]{8}/);
			}
		}
		assert.ok(!JSON.stringify(harness.sessionManager.buildSessionContext().messages).includes("handoff-receipt"));
		const file = harness.sessionManager.getSessionFile();
		assert.ok(file);
		const reopened = SessionManager.open(file);
		assert.ok(reopened.getEntries().some((entry) => entry.type === "custom" && entry.customType === "handoff-receipt"));
	} finally { await rm(cwd, { recursive: true, force: true }); }
});

test("submission and unrelated agent starts do not claim continuation or release the overlap guard", async () => {
	const cwd = await mkdtemp(join(tmpdir(), "pi-handoff-"));
	try {
		const harness = await createHandoffHarness(cwd, { deferContinuation: true });
		harness.sessionManager.appendMessage(userMessage("Implement the feature"));
		const running = runHandoff(harness);
		await waitForContinuation(harness);
		assert.equal(receipts(harness).length, 0);
		await harness.startContinuation("an unrelated prompt");
		assert.equal(receipts(harness).length, 0);
		await runHandoff(harness);
		assert.equal(harness.sentUserMessages.length, 2);
		assert.match(harness.notifications.at(-1)?.message ?? "", /already in progress/);
		await harness.startContinuation();
		await running;
		assert.equal(receipts(harness).length, 1);
	} finally { await rm(cwd, { recursive: true, force: true }); }
});

for (const failure of ["cancelled", "summary error", "send error"] as const) {
	test(`handoff records ${failure} with recovery and retains source/artifact/draft`, async () => {
		const cwd = await mkdtemp(join(tmpdir(), "pi-handoff-"));
		try {
			const artifact = join(cwd, "handoff.md");
			await writeFile(artifact, "Resume from here");
			const harness = await createHandoffHarness(cwd, {
				navigationCancelled: failure === "cancelled",
				navigationError: failure === "summary error" ? "Summary failed" : undefined,
				continuationError: failure === "send error" ? "Send failed" : undefined,
				editorBeforeNavigation: "my draft",
			});
			harness.sessionManager.appendMessage(userMessage("Implement the feature"));
			await runHandoff(harness);
			const receipt = receipts(harness)[0];
			assert.ok(receipt?.type === "custom");
			assert.equal(receipt.data.outcome, failure === "cancelled" ? "cancelled" : "failed");
			assert.equal(receipt.data.stage, failure === "send error" ? "Start continuation" : "Summarize and switch branch");
			assert.equal(harness.runner.getUIContext().getEditorText(), "my draft");
			assert.ok(harness.sessionManager.getEntry(harness.handoffAssistantEntryId()!));
			assert.equal(await import("node:fs/promises").then((fs) => fs.readFile(artifact, "utf8")), "Resume from here");
			assert.equal(harness.widgets.at(-1), undefined);
		} finally { await rm(cwd, { recursive: true, force: true }); }
	});
}

test("handoff shutdown records interruption and releases the continuation waiter", async () => {
	const cwd = await mkdtemp(join(tmpdir(), "pi-handoff-"));
	try {
		const harness = await createHandoffHarness(cwd, { deferContinuation: true });
		harness.sessionManager.appendMessage(userMessage("Implement the feature"));
		const running = runHandoff(harness);
		await waitForContinuation(harness);
		await harness.runner.emit({ type: "session_shutdown", reason: "reload" });
		await running;
		const receipt = receipts(harness)[0];
		assert.ok(receipt?.type === "custom");
		assert.equal(receipt.data.outcome, "interrupted");
		assert.equal(receipts(harness).length, 1);
		assert.equal(harness.widgets.at(-1), undefined);
	} finally { await rm(cwd, { recursive: true, force: true }); }
});

test("continuation timeout advances elapsed time, not stages, and leaves a failure receipt", async (t) => {
	const cwd = await mkdtemp(join(tmpdir(), "pi-handoff-"));
	try {
		const harness = await createHandoffHarness(cwd, { deferContinuation: true });
		harness.sessionManager.appendMessage(userMessage("Implement the feature"));
		t.mock.timers.enable({ apis: ["setTimeout", "setInterval", "Date"] });
		const running = runHandoff(harness);
		await waitForContinuation(harness);
		t.mock.timers.tick(2000);
		assert.equal(harness.widgets.at(-1)?.[0], "Handoff · 2s");
		assert.ok(harness.widgets.at(-1)?.includes("› Start continuation"));
		assert.equal(receipts(harness).length, 0);
		t.mock.timers.tick(28_000);
		await running;
		assert.equal(receipts(harness)[0]?.data.outcome, "failed");
		assert.equal(receipts(harness)[0]?.data.stage, "Start continuation");
		assert.match(String(receipts(harness)[0]?.data.detail), /start was not observed within 30 seconds/);
		const updates = harness.widgets.length;
		t.mock.timers.tick(60_000);
		assert.equal(harness.widgets.length, updates, "timer must stop after failure");
	} finally {
		t.mock.timers.reset();
		await rm(cwd, { recursive: true, force: true });
	}
});

const parallelHandoffPrompt = "let's create a single or multiple handoffs for the invibe-instrcutor space, each in their own herdr tab and probably their own worktree or skill dir? Maybe a single worktree with multiple skills and a single html artifact or something that compares the latest artifact output of each approach to the baseline, so it's easy for human review.";

for (const route of ["external", "document"] as const) {
	test(`${route} handoffs preserve the source branch and draft without local continuation`, async () => {
		const cwd = await mkdtemp(join(tmpdir(), "pi-handoff-"));
		try {
			const document = join(cwd, "handoff.md");
			await writeFile(document, "Own method outputs; viewer owns HTML. Keep baseline separate.");
			const destinations = [
				{ id: "methods", document, status: route === "external" ? "start-confirmed" as const : "prepared" as const, locator: "w2:t1 / session-methods.jsonl", detail: "Own method outputs; activity observed" },
				{ id: "viewer", document, status: route === "external" ? "launched" as const : "prepared" as const, locator: "w2:t2 / session-viewer.jsonl", detail: "Own comparison HTML; launch returned successfully" },
			];
			const harness = await createHandoffHarness(cwd, {
				editorBeforeNavigation: "preserve this draft",
				controlReports: [
					{ route, destinations: destinations.map((d) => ({ id: d.id, status: "planned", detail: d.detail })) },
					...destinations.map((destination) => ({ route, destinations: [destination] })),
				],
			});
			const source = harness.sessionManager.appendMessage(userMessage("Compare approaches"));
			await harness.runner.getCommand("handoff")!.handler(parallelHandoffPrompt, harness.runner.createCommandContext());
			assert.equal(harness.sentUserMessages[0]?.content, `/skill:handoff ${parallelHandoffPrompt}`);
			assert.equal(harness.sentUserMessages.length, 1);
			assert.deepEqual(harness.navigations, []);
			assert.deepEqual(harness.editorValues, []);
			assert.equal(harness.runner.getUIContext().getEditorText(), "preserve this draft");
			assert.ok(harness.sessionManager.getBranch().some((entry) => entry.id === source));
			const receipt = receipts(harness)[0]!;
			assert.equal(receipt.data.outcome, route === "external" ? "dispatched" : "prepared");
			assert.equal(receipt.data.sourceId, harness.handoffAssistantEntryId());
			const linked = receipt.data.destinations as (typeof destinations[number] & { connection: string; name?: string })[];
			assert.deepEqual(linked.map(({ connection, name, ...d }) => d), destinations);
			for (const d of linked) {
				assert.ok(d.connection);
				const record = JSON.parse(await readFile(d.connection, "utf8"));
				assert.equal(record.source.sessionFile, harness.sessionManager.getSessionFile());
				assert.ok(harness.sessionManager.getEntry(record.source.entryId));
			}
			const renderer = harness.runner.getEntryRenderer("handoff-receipt")!;
			const component = renderer(receipt, { expanded: true }, harness.runner.getUIContext().theme)!;
			assert.match(component.render(120).join("\n"), /agent-reported/);
			const compact = renderer(receipt, { expanded: false }, harness.runner.getUIContext().theme)!;
			const compactText = compact.render(120).map((line) => stripVTControlCharacters(line).trimEnd()).join("\n");
			assert.equal(compactText, [
				`Handoff · ${route === "external" ? "2 sessions launched" : "2 documents ready"}`,
				"Here",
				`├─ methods · ${route === "external" ? "start confirmed" : "document ready"}`,
				`└─ viewer · ${route === "external" ? "launched" : "document ready"}`,
				"Source conversation kept here.",
				"/handoffs · cross-session links",
			].join("\n"));
			assert.doesNotMatch(compactText, /\.jsonl|handoff\.md|agent-reported|w2:t/);
			for (const width of [20, 40, 80]) assert.ok(compact.render(width).every((line) => visibleWidth(line) <= width));
			for (const width of [20, 40, 80]) assert.ok(component.render(width).every((line) => visibleWidth(line) <= width));
			await harness.runner.emit({ type: "session_shutdown", reason: "quit" });
			assert.equal(receipts(harness).length, 1, "completed dispatch is not relabeled interrupted on shutdown");
			assert.equal(harness.widgets.at(-1), undefined);
		} finally { await rm(cwd, { recursive: true, force: true }); }
	});
}

test("receipt presentation keeps raw recovery data expanded and flags unsuccessful outcomes", async () => {
	const cwd = await mkdtemp(join(tmpdir(), "pi-handoff-"));
	try {
		const harness = await createHandoffHarness(cwd);
		harness.sessionManager.appendMessage(userMessage("Receipt display fixture"));
		await runHandoff(harness);
		const receipt = receipts(harness)[0]!;
		const renderer = harness.runner.getEntryRenderer("handoff-receipt")!;
		for (const outcome of ["dispatched", "failed", "partial", "cancelled", "interrupted"]) {
			const fixture = { ...receipt, data: { ...receipt.data, route: "external", targetId: undefined, outcome,
				destinations: [{ id: "smoke-extension", status: "start-confirmed", document: "/tmp/handoff.md", locator: "w1:p21 /tmp/session.jsonl", detail: "Observed activity" }],
			} };
			const compact = renderer(fixture, { expanded: false }, harness.runner.getUIContext().theme)!;
			const expanded = renderer(fixture, { expanded: true }, harness.runner.getUIContext().theme)!;
			const compactText = stripVTControlCharacters(compact.render(120).join("\n"));
			assert.match(compactText, /smoke extension · start confirmed/);
			assert.doesNotMatch(compactText, /\/tmp\/|w1:p21|agent-reported|Observed activity|source [a-f0-9]/);
			if (outcome === "dispatched") assert.match(compactText, /1 session started/);
			else assert.match(compactText, /Expand for recovery details/);
			const fullText = stripVTControlCharacters(expanded.render(200).join("\n"));
			assert.match(fullText, /Document: \/tmp\/handoff.md/);
			assert.match(fullText, /w1:p21 \/tmp\/session.jsonl/);
			assert.match(fullText, /Observed activity/);
			assert.match(fullText, /agent-reported/);
			for (const width of [20, 40, 80]) {
				assert.ok(compact.render(width).every((line) => visibleWidth(line) <= width));
				assert.ok(expanded.render(width).every((line) => visibleWidth(line) <= width));
			}
		}
	} finally { await rm(cwd, { recursive: true, force: true }); }
});

test("local handoffs retain tree labels without creating connections or appearing in /handoffs", async () => {
	const cwd = await mkdtemp(join(tmpdir(), "pi-handoff-local-"));
	try {
		const harness = await createHandoffHarness(cwd);
		harness.sessionManager.appendMessage(userMessage("Continue locally"));
		await runHandoff(harness);
		const receipt = receipts(harness)[0]!;
		assert.equal(receipt.data.localConnection, undefined);
		assert.equal((await readdir(dirname(harness.sessionManager.getSessionFile()!))).includes("handoff-connections"), false);
		assert.equal(harness.sessionManager.getEntries().some((e) => e.type === "custom" && e.customType === "handoff-origin"), false);
		assert.ok(harness.sessionManager.getLabel(receipt.data.sourceId as string));
		assert.ok(harness.sessionManager.getLabel(receipt.data.targetId as string));
		// Old session records remain intact but are excluded from the picker.
		harness.sessionManager.appendCustomEntry("handoff-state", { localConnection: "/missing/legacy.json", sourceId: "old-source", targetId: "old-target", sessionFile: harness.sessionManager.getSessionFile() });
		harness.sessionManager.appendCustomEntry("handoff-origin", { connection: { version: 1, id: "00000000-0000-0000-0000-000000000000", name: "Local continuation", source: { sessionFile: harness.sessionManager.getSessionFile(), entryId: "old-source", name: "Local origin" } }, path: "/missing/legacy.json" });
		await harness.runner.getCommand("handoffs")!.handler("", harness.runner.createCommandContext());
		assert.match(harness.notifications.at(-1)!.message, /No cross-session handoffs.*\/tree/);
	} finally { await rm(cwd, { recursive: true, force: true }); }
});

test("destination acceptance persists an origin backlink without modifying the source session", async () => {
	const cwd = await mkdtemp(join(tmpdir(), "pi-handoff-link-"));
	try {
		const document = join(cwd, "handoff.md");
		await writeFile(document, "Read-only task");
		const source = await createHandoffHarness(cwd, { controlReports: [{ route: "document", destinations: [{ id: "check", name: "Extension check", status: "prepared", document, detail: "Read only" }] }] });
		source.sessionManager.appendMessage(userMessage("Prepare a task"));
		await runHandoff(source);
		const connection = (receipts(source)[0]!.data.destinations as { connection: string }[])[0]!.connection;
		const before = await readFile(source.sessionManager.getSessionFile()!, "utf8");
		const target = await createHandoffHarness(join(cwd, "target"));
		target.sessionManager.appendMessage(userMessage("Open the document and register its connection"));
		const tool = target.runner.getToolDefinition("handoff_accept")!;
		await tool.execute("accept", { connection }, undefined, undefined, target.runner.createContext());
		await tool.execute("accept-again", { connection }, undefined, undefined, target.runner.createContext());
		const entries = target.sessionManager.getBranch().filter((e) => e.type === "custom" && e.customType === "handoff-origin");
		assert.equal(entries.length, 1);
		assert.equal(await readFile(source.sessionManager.getSessionFile()!, "utf8"), before);
		for (const [harness, expected] of [[source, /^1\. Sent to · Extension check$/], [target, /^1\. Came from · .+ · Extension check$/]] as const) {
			let choices: string[] = [];
			harness.runner.setUIContext({ ...harness.runner.getUIContext(), select: async (_title, options) => { choices = options; return undefined; } });
			await harness.runner.getCommand("handoffs")!.handler("", harness.runner.createCommandContext());
			assert.equal(choices.length, 1);
			assert.match(choices[0]!, expected);
		}
		const origin = entries[0]!;
		assert.equal(origin.type, "custom");
		if (origin.type !== "custom") return;
		const renderer = target.runner.getEntryRenderer("handoff-origin")!;
		const compact = renderer(origin, { expanded: false }, target.runner.getUIContext().theme)!;
		assert.match(stripVTControlCharacters(compact.render(120).join("\n")), /Here · Extension check/);
		for (const width of [20, 40, 80]) assert.ok(compact.render(width).every((line) => visibleWidth(line) <= width));
		await target.runner.emit({ type: "session_start", reason: "reload" });
		assert.ok(target.runner.getCommand("handoffs"));
		assert.equal(target.sessionManager.getBranch().filter((e) => e.type === "custom" && e.customType === "handoff-origin").length, 1);
	} finally { await rm(cwd, { recursive: true, force: true }); }
});

test("partial dispatch preserves successful siblings and records a failed destination", async () => {
	const cwd = await mkdtemp(join(tmpdir(), "pi-handoff-"));
	try {
		const document = join(cwd, "handoff.md");
		await writeFile(document, "Resume here");
		const harness = await createHandoffHarness(cwd, { controlReports: [
			{ route: "external", destinations: [{ id: "methods", status: "launched", document, locator: "w2:t1", detail: "Launched" }] },
			{ route: "external", destinations: [{ id: "viewer", status: "failed", detail: "Launch failed; no retry attempted" }] },
		] });
		harness.sessionManager.appendMessage(userMessage("Parallel handoffs"));
		await runHandoff(harness);
		assert.equal(receipts(harness)[0]?.data.outcome, "partial");
		assert.equal((receipts(harness)[0]?.data.destinations as unknown[]).length, 2);
		assert.equal(harness.sentUserMessages.length, 1);
		assert.equal(harness.navigations.length, 0);
	} finally { await rm(cwd, { recursive: true, force: true }); }
});

for (const controlReports of [
	[],
	[{ route: "external" as const }],
	[{ route: "external" as const }, { route: "here" as const }],
	[{ route: "document" as const, destinations: [{ id: "bad", status: "launched" as const, detail: "Not permitted" }] }],
	[{ route: "external" as const, destinations: [{ id: "bad", status: "prepared" as const, document: "relative.md", detail: "Bad path" }] }],
	[{ route: "external" as const, destinations: [{ id: "bad", status: "prepared" as const, document: "/nonexistent-handoff/file.md", detail: "Missing artifact" }] }],
	[{ route: "external" as const, destinations: [{ id: "bad", status: "launched" as const, detail: "Missing document and locator" }] }],
]) {
	test(`incomplete or invalid control data never falls through to local continuation: ${JSON.stringify(controlReports)}`, async () => {
		const cwd = await mkdtemp(join(tmpdir(), "pi-handoff-"));
		try {
			const harness = await createHandoffHarness(cwd, { controlReports });
			harness.sessionManager.appendMessage(userMessage("Hand off elsewhere"));
			await runHandoff(harness);
			assert.equal(receipts(harness)[0]?.data.outcome, "failed");
			assert.equal(harness.sentUserMessages.length, 1);
			assert.equal(harness.navigations.length, 0);
		} finally { await rm(cwd, { recursive: true, force: true }); }
	});
}

test("interrupted external dispatch retains checkpoints and never relaunches on reload", async () => {
	const cwd = await mkdtemp(join(tmpdir(), "pi-handoff-"));
	try {
		const document = join(cwd, "handoff.md");
		await writeFile(document, "Resume here");
		const destinations = [{ id: "methods", status: "launched" as const, document, locator: "w2:t1", detail: "Independent session" }];
		const harness = await createHandoffHarness(cwd, {
			controlReports: [{ route: "external", destinations }], shutdownAfterReports: true,
		});
		harness.sessionManager.appendMessage(userMessage("Dispatch methods"));
		await runHandoff(harness);
		assert.equal(receipts(harness)[0]?.data.outcome, "interrupted");
		const linked = receipts(harness)[0]?.data.destinations as (typeof destinations[number] & { connection: string; name?: string })[];
		assert.deepEqual(linked.map(({ connection, name, ...d }) => d), destinations);
		assert.ok(linked[0]?.connection);
		await harness.runner.emit({ type: "session_start", reason: "reload" });
		assert.equal(harness.sentUserMessages.length, 1);
		assert.equal(harness.navigations.length, 0);
		assert.equal(receipts(harness).length, 1);
		await assert.rejects(() => harness.runner.getToolDefinition("handoff_control")!.execute(
			"outside", { route: "external" }, undefined, undefined, harness.runner.createContext(),
		), /only available/);
	} finally { await rm(cwd, { recursive: true, force: true }); }
});

test("reload reports an unfinished persisted handoff without submitting prompts or navigating", async () => {
	const cwd = await mkdtemp(join(tmpdir(), "pi-handoff-"));
	try {
		const harness = await createHandoffHarness(cwd);
		const sourceId = harness.sessionManager.appendMessage(userMessage("Implement the feature"));
		harness.sessionManager.appendCustomEntry("handoff-state", {
			version: 1, startedAt: Date.now(), updatedAt: Date.now(), stage: "Summarize and switch branch", outcome: "running", sourceId,
		});
		await harness.runner.emit({ type: "session_start", reason: "reload" });
		const receipt = receipts(harness)[0];
		assert.ok(receipt?.type === "custom");
		assert.equal(receipt.data.outcome, "interrupted");
		assert.equal(harness.sentUserMessages.length, 0);
		assert.equal(harness.navigations.length, 0);
		await harness.runner.emit({ type: "session_start", reason: "reload" });
		assert.equal(receipts(harness).length, 1);
	} finally { await rm(cwd, { recursive: true, force: true }); }
});
