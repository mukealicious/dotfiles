import type { AssistantMessage } from "@earendil-works/pi-ai";
import type { ExtensionAPI, ExtensionContext, SessionEntry } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";

const HANDOFF_STATE = "handoff-state";
const HANDOFF_RECEIPT = "handoff-receipt";
const stages = ["Prepare", "Write handoff document", "Summarize and switch branch", "Start continuation"] as const;
type Stage = typeof stages[number];
type Outcome = "running" | "started" | "cancelled" | "failed" | "interrupted";
interface HandoffTrace {
	version: 1;
	startedAt: number;
	updatedAt: number;
	stage: Stage;
	outcome: Outcome;
	sourceId: string;
	targetId?: string;
	sessionFile?: string;
	detail?: string;
}

function isTrace(value: unknown): value is HandoffTrace {
	if (!value || typeof value !== "object") return false;
	const data = value as Record<string, unknown>;
	return data.version === 1 && typeof data.startedAt === "number" && Number.isFinite(data.startedAt)
		&& typeof data.updatedAt === "number" && Number.isFinite(data.updatedAt)
		&& Math.abs(data.startedAt) <= 8.64e15 && Math.abs(data.updatedAt) <= 8.64e15
		&& typeof data.stage === "string" && stages.includes(data.stage as Stage)
		&& typeof data.outcome === "string" && ["running", "started", "cancelled", "failed", "interrupted"].includes(data.outcome)
		&& typeof data.sourceId === "string"
		&& [data.targetId, data.sessionFile, data.detail].every((v) => v === undefined || typeof v === "string");
}

function receiptText(trace: HandoffTrace, expanded: boolean): string {
	const outcome = trace.outcome === "started" ? "Continuation started" : `${trace.outcome} at ${trace.stage}`;
	const lines = [
		`Handoff · ${outcome} · ${Math.floor((trace.updatedAt - trace.startedAt) / 1000)}s`,
		`/tree: source ${trace.sourceId}${trace.targetId ? ` → resume ${trace.targetId}` : ""}`,
	];
	if (trace.detail) lines.push(trace.detail);
	if (expanded) lines.push(
		`Started: ${new Date(trace.startedAt).toISOString()}`,
		`Updated: ${new Date(trace.updatedAt).toISOString()}`,
		`Session: ${trace.sessionFile ?? "ephemeral"}`,
		"Document path: see source turn or branch summary. Acceptance and work completion are not verified.",
		"Source history and temporary files are retained. Open the handoff to resume; use /tree for recovery.",
	);
	return lines.join("\n");
}

const HANDOFF_AGENT_START_TIMEOUT_MS = 30_000;
function buildContinueFromHandoffPrompt(
	sessionFile: string | undefined,
	sourceLeafEntryId: string,
): string {
	const sourceBranchInstructions =
		sessionFile === undefined
			? `The source branch ends at session tree entry ${JSON.stringify(sourceLeafEntryId)}. If the handoff leaves a blocking ambiguity, use available session or tree inspection capabilities to recover the needed context from that branch, then resume.`
			: `The source branch ends at session tree entry ${JSON.stringify(sourceLeafEntryId)} in ${JSON.stringify(sessionFile)}. If the handoff leaves a blocking ambiguity, inspect that JSONL with read or bash. Reconstruct the source branch by following parentId links from the entry ID; append order may include other branches. Recover the needed context, then resume.`;

	return `Open the handoff document identified in the branch summary. Resume the work by performing its next unfinished step.\n\n${sourceBranchInstructions}`;
}

function userMessageEditorText(entry: SessionEntry): string | undefined {
	if (entry.type !== "message" || entry.message.role !== "user") return undefined;
	if (typeof entry.message.content === "string") return entry.message.content;
	return entry.message.content
		.filter((part): part is { type: "text"; text: string } => part.type === "text")
		.map((part) => part.text)
		.join("");
}

function findFirstUserMessageEntry(entries: readonly SessionEntry[]): SessionEntry | undefined {
	return entries.find((entry) => userMessageEditorText(entry) !== undefined);
}

function findTerminalHandoffAssistant(
	entries: readonly SessionEntry[],
	previousLeafId: string,
): (Extract<SessionEntry, { type: "message" }> & { message: AssistantMessage }) | undefined {
	const previousLeafIndex = entries.findIndex((entry) => entry.id === previousLeafId);
	if (previousLeafIndex < 0) return undefined;
	for (let index = entries.length - 1; index > previousLeafIndex; index -= 1) {
		const entry = entries[index];
		if (entry?.type === "message" && entry.message.role === "assistant") {
			return entry as Extract<SessionEntry, { type: "message" }> & { message: AssistantMessage };
		}
	}
	return undefined;
}

function buildHandoffSkillCommand(focus: string): string {
	return focus.length === 0 ? "/skill:handoff" : `/skill:handoff ${focus}`;
}

function buildBranchSummaryInstructions(focus: string): string {
	const focusInstruction =
		focus.length === 0
			? ""
			: ` The next turn's focus is: ${focus}`;

	return `The source branch produced a handoff document. Include its exact absolute path so the next turn can open it. Keep the document as the source of truth; use the branch summary to orient the next turn toward continuing the work.${focusInstruction}`;
}

/** Registers `/handoff`, which writes a handoff document and continues from it on a summarized root branch. */
export default function registerHandoffExtension(pi: ExtensionAPI): void {
	const agentStartWaiters = new Set<() => void>();
	let handoffInProgress = false;
	let trace: HandoffTrace | undefined;
	let timer: ReturnType<typeof setInterval> | undefined;
	let shutdown = false;

	const showProgress = (ctx: ExtensionContext): void => {
		if (!ctx.hasUI || !trace) return;
		const current = stages.indexOf(trace.stage);
		ctx.ui.setWidget("handoff", [
			`Handoff · ${Math.floor((Date.now() - trace.startedAt) / 1000)}s`,
			...stages.map((stage, index) => `${index < current ? "✓" : index === current ? "›" : "○"} ${stage}`),
		]);
	};
	const save = (ctx: ExtensionContext, patch: Partial<HandoffTrace>): void => {
		if (!trace || shutdown) return;
		trace = { ...trace, ...patch, updatedAt: Date.now() };
		pi.appendEntry(HANDOFF_STATE, trace);
		showProgress(ctx);
	};
	const finish = (ctx: ExtensionContext, outcome: Exclude<Outcome, "running">, detail?: string): void => {
		if (!trace || shutdown || trace.outcome !== "running") return;
		// On an interrupted document turn, recovery must include partial tool work,
		// not just the leaf from before the skill was submitted.
		const sourceId = handoffInProgress && trace.stage === "Write handoff document"
			? ctx.sessionManager.getLeafId() ?? trace.sourceId : trace.sourceId;
		if (ctx.sessionManager.getEntry(sourceId) && !ctx.sessionManager.getLabel(sourceId)) {
			pi.setLabel(sourceId, "handoff source");
		}
		save(ctx, { outcome, detail, sourceId });
		pi.appendEntry(HANDOFF_RECEIPT, trace);
		clearInterval(timer);
		timer = undefined;
		if (ctx.hasUI) ctx.ui.setWidget("handoff", undefined);
	};

	pi.registerEntryRenderer(HANDOFF_RECEIPT, (entry, { expanded }) =>
		new Text(isTrace(entry.data) ? receiptText(entry.data, expanded) : "Handoff receipt unavailable", 0, 0));

	pi.on("session_start", (_event, ctx) => {
		shutdown = false;
		const lastState = ctx.sessionManager.getEntries().filter(
			(entry) => entry.type === "custom" && entry.customType === HANDOFF_STATE,
		).at(-1);
		if (lastState?.type === "custom" && isTrace(lastState.data) && lastState.data.outcome === "running") {
			trace = lastState.data;
			finish(ctx, "interrupted", "Runtime stopped before the handoff outcome was recorded; inspect the source before retrying.");
		}
	});
	pi.on("session_tree", (_event, ctx) => {
		if (trace?.outcome === "running") showProgress(ctx);
	});
	pi.on("session_shutdown", (_event, ctx) => {
		finish(ctx, "interrupted", "Runtime stopped; automatic continuation is no longer monitored.");
		shutdown = true;
		clearInterval(timer);
		for (const resolve of agentStartWaiters) resolve();
		agentStartWaiters.clear();
	});

	let expectedPrompt: string | undefined;
	let promptMatched = false;
	pi.on("before_agent_start", (event) => {
		promptMatched = event.prompt === expectedPrompt;
	});
	pi.on("agent_start", () => {
		if (expectedPrompt !== undefined && !promptMatched) return;
		for (const resolveAgentStart of agentStartWaiters) resolveAgentStart();
		agentStartWaiters.clear();
	});

	const sendAndWaitForStart = (send: () => void, prompt?: string): Promise<void> =>
		new Promise((resolve, reject) => {
			expectedPrompt = prompt;
			promptMatched = false;
			const cleanup = (): void => {
				clearTimeout(timeout);
				agentStartWaiters.delete(resolveAgentStart);
				expectedPrompt = undefined;
			};
			const resolveAgentStart = (): void => {
				cleanup();
				if (shutdown) reject(new Error("Handoff runtime stopped"));
				else resolve();
			};
			const timeout = setTimeout(() => {
				cleanup();
				reject(new Error("Handoff agent start was not observed within 30 seconds"));
			}, HANDOFF_AGENT_START_TIMEOUT_MS);
			agentStartWaiters.add(resolveAgentStart);
			try {
				send();
			} catch (error) {
				cleanup();
				reject(error);
			}
		});

	pi.registerCommand("handoff", {
		description: "Write a handoff document, summarize back to the first message, and continue",
		handler: async (args, ctx) => {
			if (handoffInProgress) {
				ctx.ui.notify("A handoff is already in progress", "warning");
				return;
			}
			handoffInProgress = true;
			trace = undefined;

			try {
				await ctx.waitForIdle();
				if (shutdown) return;

				if (!ctx.model) {
					ctx.ui.notify("Handoff requires a selected model", "error");
					return;
				}

				const providerAuth = await ctx.modelRegistry.getProviderAuth(ctx.model.provider);
				if (shutdown) return;
				if (!providerAuth) {
					ctx.ui.notify("Handoff requires authentication for the selected model", "error");
					return;
				}

				const firstUserMessageEntry = findFirstUserMessageEntry(
					ctx.sessionManager.getBranch(),
				);
				if (!firstUserMessageEntry) {
					ctx.ui.notify("There is no conversation to hand off", "warning");
					return;
				}
				const previousLeafId = ctx.sessionManager.getLeafId();
				if (!previousLeafId) {
					ctx.ui.notify("Handoff source branch has no leaf entry", "error");
					return;
				}

				const focus = args.trim();
				trace = {
					version: 1, startedAt: Date.now(), updatedAt: Date.now(), stage: "Prepare",
					outcome: "running", sourceId: previousLeafId, sessionFile: ctx.sessionManager.getSessionFile(),
				};
				save(ctx, { stage: "Write handoff document" });
				if (ctx.hasUI) timer = setInterval(() => showProgress(ctx), 1000);
				await sendAndWaitForStart(() => pi.sendUserMessage(buildHandoffSkillCommand(focus), {
					expandPromptTemplates: true,
				}));
				await ctx.waitForIdle();
				if (shutdown) return;

				const handoffAssistant = findTerminalHandoffAssistant(
					ctx.sessionManager.getBranch(),
					previousLeafId,
				);
				if (!handoffAssistant || handoffAssistant.message.stopReason !== "stop") {
					const reason = handoffAssistant?.message.stopReason ?? "missing result";
					finish(ctx, reason === "aborted" ? "cancelled" : "failed", `Document turn did not complete (${reason}); source branch retained.`);
					ctx.ui.notify(`Handoff document turn did not complete (${reason}); source branch retained`, "warning");
					return;
				}

				const sourceLeafEntryId = ctx.sessionManager.getLeafId();
				if (!sourceLeafEntryId) {
					ctx.ui.notify("Handoff source branch has no leaf entry", "error");
					return;
				}
				const sessionFile = ctx.sessionManager.getSessionFile();
				if (!ctx.sessionManager.getLabel(sourceLeafEntryId)) pi.setLabel(sourceLeafEntryId, "handoff source");
				save(ctx, { stage: "Summarize and switch branch", sourceId: sourceLeafEntryId });

				const editorTextBeforeNavigation = ctx.ui.getEditorText();
				const navigation = await ctx.navigateTree(firstUserMessageEntry.id, {
					summarize: true,
					customInstructions: buildBranchSummaryInstructions(focus),
					label: `handoff resume ← ${sourceLeafEntryId}`,
				});
				if (shutdown) return;
				if (navigation.cancelled) {
					finish(ctx, "cancelled", "Tree navigation was cancelled; source branch and temporary files retained.");
					ctx.ui.notify("Handoff tree navigation was cancelled", "warning");
					return;
				}

				const restoredEditorText = userMessageEditorText(firstUserMessageEntry);
				if (
					editorTextBeforeNavigation.trim() === ""
					&& restoredEditorText !== undefined
					&& ctx.ui.getEditorText() === restoredEditorText
				) {
					ctx.ui.setEditorText("");
				}
				// Pi can restore the source prompt over a draft. Restore only that known replacement,
				// never text the user may have typed while summarization was running.
				if (editorTextBeforeNavigation.trim() !== "" && ctx.ui.getEditorText() === restoredEditorText
					&& ctx.ui.getEditorText() !== editorTextBeforeNavigation) {
					ctx.ui.setEditorText(editorTextBeforeNavigation);
				}
				const targetId = ctx.sessionManager.getBranch().reverse().find((entry) => entry.type === "branch_summary")?.id
					?? ctx.sessionManager.getLeafId() ?? undefined;
				save(ctx, { stage: "Start continuation", targetId });
				const prompt = buildContinueFromHandoffPrompt(sessionFile, sourceLeafEntryId);
				await sendAndWaitForStart(() => pi.sendUserMessage(prompt), prompt);
				finish(ctx, "started", "Document acceptance and work completion are not verified.");
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				finish(ctx, "failed", message);
				if (!shutdown) ctx.ui.notify(`Handoff failed at ${trace?.stage ?? "Prepare"}: ${message}`, "error");
			} finally {
				if (trace?.outcome === "running") finish(ctx, "failed", "Handoff stopped before continuation was observed.");
				clearInterval(timer);
				timer = undefined;
				handoffInProgress = false;
			}
		},
	});
}
