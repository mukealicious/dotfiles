import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { InMemoryCredentialStore, type UserMessage } from "@earendil-works/pi-ai";
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

async function createHandoffHarness(cwd: string) {
	const credentials = new InMemoryCredentialStore();
	const modelRuntime = await ModelRuntime.create({
		credentials,
		modelsPath: null,
		allowModelNetwork: false,
	});
	const model = modelRuntime.getModels()[0];
	assert.ok(model, "the bundled model catalog should not be empty");
	await credentials.modify(model.provider, async () => ({ type: "api_key", key: "test-key" }));

	const sessionManager = SessionManager.create(cwd, join(cwd, ".sessions"));
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
	loaded.runtime.sendUserMessage = (content, options) => {
		if (typeof content !== "string") {
			throw new Error("Handoff test received unexpected image content");
		}
		sentUserMessages.push({ content, ...(options ? { options } : {}) });
		if (content.startsWith("/skill:handoff")) {
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
		setEditorText: (value) => editorValues.push(value),
	});

	return {
		editorValues,
		navigations,
		notifications,
		runner,
		sentUserMessages,
		sessionManager,
		waitForIdleCalls: () => waitForIdleCalls,
	};
}

test("/handoff runs the handoff skill, summarizes to the first message, and continues", async () => {
	const cwd = await mkdtemp(join(tmpdir(), "pi-handoff-"));

	try {
		const harness = await createHandoffHarness(cwd);
		const firstUserMessageEntryId = harness.sessionManager.appendMessage(
			userMessage("Implement the feature"),
		);
		const sourceLeafEntryId = harness.sessionManager.appendMessage(userMessage("Use tests"));

		const command = harness.runner.getCommand("handoff");
		assert.ok(command, "/handoff should be registered");
		await command.handler("focus on error recovery", harness.runner.createCommandContext());

		const sessionFile = harness.sessionManager.getSessionFile();
		assert.ok(sessionFile);
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

		const harness = await createHandoffHarness(cwd);
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
	}
});
