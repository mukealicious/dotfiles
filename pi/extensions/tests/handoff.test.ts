import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { type AssistantMessage, InMemoryCredentialStore, type StopReason, type UserMessage } from "@earendil-works/pi-ai";
import {
	discoverAndLoadExtensions,
	ExtensionRunner,
	ModelRegistry,
	ModelRuntime,
	SessionManager,
	type ExtensionCommandContextActions,
} from "@earendil-works/pi-coding-agent";

const extensionPath = join(dirname(fileURLToPath(import.meta.url)), "..", "handoff.ts");

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
	loaded.runtime.sendUserMessage = (content, options) => {
		if (typeof content !== "string") {
			throw new Error("Handoff test received unexpected image content");
		}
		sentUserMessages.push({ content, ...(options ? { options } : {}) });
		if (content.startsWith("/skill:handoff")) {
			sessionManager.appendMessage(userMessage(content));
			handoffAssistantEntryId = sessionManager.appendMessage(
				assistantMessage(harnessOptions.handoffStopReason ?? "stop"),
			);
			queueMicrotask(() => void runner.emit({ type: "agent_start" }));
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
		},
		newSession: async () => ({ cancelled: false }),
		fork: async () => ({ cancelled: false }),
		navigateTree: async (targetId, options) => {
			navigations.push({ targetId, ...(options ? { options } : {}) });
			const target = sessionManager.getEntry(targetId);
			const targetText = target?.type === "message" && target.message.role === "user"
				? (Array.isArray(target.message.content)
					? target.message.content.filter((part) => part.type === "text").map((part) => part.text).join("")
					: target.message.content)
				: "";
			editorText = harnessOptions.editorAfterNavigation ?? targetText;
			return { cancelled: false };
		},
		switchSession: async () => ({ cancelled: false }),
		reload: async () => undefined,
	};
	runner.bindCommandContext(commandActions);

	const editorValues: string[] = [];
	const notifications: Array<{ readonly message: string; readonly type?: "info" | "warning" | "error" }> = [];
	runner.setUIContext({
		...runner.getUIContext(),
		notify: (message, type) => notifications.push({ message, ...(type ? { type } : {}) }),
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
		assert.equal(harness.sessionManager.getLeafId(), harness.handoffAssistantEntryId());
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
