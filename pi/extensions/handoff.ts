import { accessSync, constants, statSync } from "node:fs";
import { isAbsolute } from "node:path";
import { type AssistantMessage, StringEnum, Type } from "@earendil-works/pi-ai";
import type { ExtensionAPI, ExtensionContext, SessionEntry } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";

const HANDOFF_STATE = "handoff-state";
const HANDOFF_RECEIPT = "handoff-receipt";
const stages = ["Prepare", "Write handoff document", "Summarize and switch branch", "Start continuation"] as const;
type Stage = typeof stages[number];
type Outcome = "running" | "started" | "prepared" | "dispatched" | "partial" | "cancelled" | "failed" | "interrupted";
const routes = ["here", "external", "document"] as const;
type Route = typeof routes[number];
const destinationStatuses = ["planned", "prepared", "launched", "start-confirmed", "failed"] as const;
const destinationSchema = Type.Object({
	id: Type.String({ minLength: 1, maxLength: 120, description: "Stable task identifier; repeated reports update this destination" }),
	document: Type.Optional(Type.String({ minLength: 1, maxLength: 4096, description: "Absolute handoff document path; required once prepared or launched" })),
	locator: Type.Optional(Type.String({ minLength: 1, maxLength: 4096, description: "Verified destination session/pane locator; required once launched" })),
	status: StringEnum(destinationStatuses),
	detail: Type.String({ minLength: 1, maxLength: 2000, description: "Scope, ownership, launch evidence, or failure/recovery notes. No secrets." }),
});
type Destination = {
	id: string;
	document?: string;
	locator?: string;
	status: typeof destinationStatuses[number];
	detail: string;
};

function isDestination(value: unknown): value is Destination {
	if (!value || typeof value !== "object") return false;
	const data = value as Record<string, unknown>;
	return typeof data.id === "string" && typeof data.detail === "string"
		&& destinationStatuses.includes(data.status as Destination["status"])
		&& [data.document, data.locator].every((v) => v === undefined || typeof v === "string");
}

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
	route?: Route;
	destinations?: Destination[];
}

function isTrace(value: unknown): value is HandoffTrace {
	if (!value || typeof value !== "object") return false;
	const data = value as Record<string, unknown>;
	return data.version === 1 && typeof data.startedAt === "number" && Number.isFinite(data.startedAt)
		&& typeof data.updatedAt === "number" && Number.isFinite(data.updatedAt)
		&& Math.abs(data.startedAt) <= 8.64e15 && Math.abs(data.updatedAt) <= 8.64e15
		&& typeof data.stage === "string" && stages.includes(data.stage as Stage)
		&& typeof data.outcome === "string" && ["running", "started", "prepared", "dispatched", "partial", "cancelled", "failed", "interrupted"].includes(data.outcome)
		&& typeof data.sourceId === "string"
		&& (data.route === undefined || routes.includes(data.route as Route))
		&& (data.destinations === undefined || (Array.isArray(data.destinations) && data.destinations.every(isDestination)))
		&& [data.targetId, data.sessionFile, data.detail].every((v) => v === undefined || typeof v === "string");
}

const statusLabels: Record<Destination["status"], string> = {
	planned: "not launched", prepared: "document ready", launched: "launched",
	"start-confirmed": "start confirmed", failed: "failed",
};

function receiptText(trace: HandoffTrace, expanded: boolean): string {
	const destinations = trace.destinations ?? [];
	const count = destinations.length;
	const launched = destinations.filter((d) => d.status === "launched" || d.status === "start-confirmed").length;
	const confirmed = count > 0 && destinations.every((d) => d.status === "start-confirmed");
	const outcome = trace.outcome === "started" ? "Continuation started"
		: trace.outcome === "prepared" ? `${count} document${count === 1 ? "" : "s"} ready`
		: trace.outcome === "dispatched" ? `${count} session${count === 1 ? "" : "s"} ${confirmed ? "started" : "launched"}`
		: trace.outcome === "partial" ? `${launched} of ${count} sessions launched`
		: trace.outcome === "failed" ? "Needs attention"
		: trace.outcome === "cancelled" ? "Cancelled"
		: trace.outcome === "interrupted" ? "Interrupted"
		: "In progress";
	const lines = [`Handoff · ${outcome}`];
	for (const destination of destinations) {
		// Stable IDs remain the protocol identity; make simple task slugs readable.
		const name = destination.id.replace(/[-_]+/g, " ");
		lines.push(`  ${name} · ${statusLabels[destination.status]}`);
	}
	const needsAttention = ["failed", "cancelled", "interrupted", "partial"].includes(trace.outcome);
	if (needsAttention) lines.push(`Stopped at: ${trace.stage}. Expand for recovery details.`);
	lines.push(trace.targetId ? "Continuation branch available in /tree." : "Source conversation kept here.");
	if (expanded) {
		lines.push("", "Recovery details");
		for (const destination of destinations) {
			lines.push(`${destination.id} · ${statusLabels[destination.status]}`);
			if (destination.document) lines.push(`Document: ${destination.document}`);
			if (destination.locator) lines.push(`Session: ${destination.locator}`);
			lines.push(destination.detail);
		}
		if (trace.detail) lines.push(trace.detail);
		lines.push(
			`/tree: source ${trace.sourceId}${trace.targetId ? ` → resume ${trace.targetId}` : ""}`,
			`Route: ${trace.route ?? "not recorded"}`,
			`Duration: ${Math.floor((trace.updatedAt - trace.startedAt) / 1000)}s`,
			`Started: ${new Date(trace.startedAt).toISOString()}`,
			`Updated: ${new Date(trace.updatedAt).toISOString()}`,
			`Source session: ${trace.sessionFile ?? "ephemeral"}`,
			"Destination statuses are agent-reported. Acceptance and work completion are not verified.",
			"Source history and temporary files are retained. Inspect destinations before retrying launches.",
		);
	}
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

/** Agent-designed handoffs; only an explicit `here` route switches the source branch. */
export default function registerHandoffExtension(pi: ExtensionAPI): void {
	const agentStartWaiters = new Set<() => void>();
	let handoffInProgress = false;
	let trace: HandoffTrace | undefined;
	let timer: ReturnType<typeof setInterval> | undefined;
	let shutdown = false;

	const showProgress = (ctx: ExtensionContext): void => {
		if (!ctx.hasUI || !trace) return;
		const visibleStages = trace.route === "here" ? stages : stages.slice(0, 2);
		const current = visibleStages.indexOf(trace.stage);
		ctx.ui.setWidget("handoff", [
			`Handoff · ${Math.floor((Date.now() - trace.startedAt) / 1000)}s`,
			...visibleStages.map((stage, index) => `${index < current ? "✓" : index === current ? "›" : "○"} ${stage}`),
			...(trace.destinations ?? []).map((destination) => `${destination.id} · ${destination.status}`),
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

	pi.registerTool({
		name: "handoff_control",
		label: "Handoff control",
		description: "During /handoff only: select here (local continuation), external (agent-designed dispatch), or document (no launch) before doing handoff work. The route cannot change during a run. Report destinations incrementally by stable id; reports replace that destination's previous fields. This tool records lifecycle only: use existing tools to design/write/launch. External statuses are agent-reported, not independently monitored. Maximum 16 destinations; bounded text fields.",
		parameters: Type.Object({
			route: StringEnum(routes),
			destinations: Type.Optional(Type.Array(destinationSchema, { maxItems: 16 })),
		}),
		async execute(_id, params, signal, _onUpdate, ctx) {
			signal?.throwIfAborted();
			if (shutdown || !handoffInProgress || trace?.outcome !== "running" || trace.stage !== "Write handoff document") {
				throw new Error("handoff_control is only available during the /handoff preparation turn");
			}
			if (trace.route && trace.route !== params.route) throw new Error("Handoff route is already selected; finish this run before choosing another route");
			if (params.route === "here" && params.destinations?.length) throw new Error("The here route uses the local branch summary, not external destinations");
			const destinations = new Map((trace.destinations ?? []).map((destination) => [destination.id, destination]));
			const ids = new Set<string>();
			for (const destination of params.destinations ?? []) {
				if (ids.has(destination.id)) throw new Error("Duplicate destination id in report");
				ids.add(destination.id);
				const launched = destination.status === "launched" || destination.status === "start-confirmed";
				if (params.route === "document" && launched) throw new Error("Document-only handoffs cannot report launches");
				if ((destination.status === "prepared" || launched) && !destination.document) throw new Error("Prepared destinations require a handoff document");
				if (launched && !destination.locator) throw new Error("Launched destinations require a session or pane locator");
				if (destination.document) {
					if (!isAbsolute(destination.document)) throw new Error("Handoff document paths must be absolute");
					if (!statSync(destination.document).isFile()) throw new Error("Handoff document must be a file");
					accessSync(destination.document, constants.R_OK);
				}
				destinations.set(destination.id, { ...destination });
			}
			if (destinations.size > 16) throw new Error("A handoff supports at most 16 destinations");
			save(ctx, {
				route: params.route, destinations: [...destinations.values()],
				sourceId: ctx.sessionManager.getLeafId() ?? trace.sourceId,
			});
			return {
				content: [{ type: "text", text: params.route === "here"
					? "Local continuation selected. Write the handoff and end your turn; the extension will summarize and continue here."
					: "Recorded. The source branch will not switch or continue locally. Use existing tools for preparation/dispatch, report each destination, then end your turn. External sessions are not monitored by this extension." }],
				details: { route: trace.route, destinations: trace.destinations },
			};
		},
	});

	pi.registerEntryRenderer(HANDOFF_RECEIPT, (entry, { expanded }, theme) => {
		const text = isTrace(entry.data) ? receiptText(entry.data, expanded) : "Handoff receipt unavailable";
		const [heading, ...body] = text.split("\n");
		const attention = isTrace(entry.data) && ["failed", "partial", "cancelled", "interrupted"].includes(entry.data.outcome);
		return new Text([
			theme.bold(theme.fg(attention ? "warning" : "accent", heading)),
			...body.map((line) => theme.fg("text", line)),
		].join("\n"), 0, 0);
	});

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
		finish(ctx, "interrupted", trace?.route === "external" || trace?.route === "document"
			? "Source runtime stopped; destination reports are preserved. External sessions may still be running; inspect them before retrying. No local continuation is scheduled."
			: "Runtime stopped; automatic continuation is no longer monitored.");
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
		description: "Design handoffs: continue here, dispatch elsewhere, or prepare documents only",
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

				if (!trace.route) {
					finish(ctx, "failed", "No handoff route was recorded; source retained and no local continuation attempted. Inspect the source before retrying any launches.");
					ctx.ui.notify("Handoff route missing; no local continuation attempted", "warning");
					return;
				}
				if (trace.route !== "here") {
					const destinations = trace.destinations ?? [];
					const launched = destinations.filter((destination) => ["launched", "start-confirmed"].includes(destination.status)).length;
					const incomplete = destinations.length === 0 || destinations.some((destination) => ["planned", "failed"].includes(destination.status));
					const outcome = launched === destinations.length && launched > 0 ? "dispatched"
						: launched > 0 ? "partial" : incomplete ? "failed" : "prepared";
					finish(ctx, outcome, "Source branch retained; no local continuation. Destination statuses are agent-reported; acceptance and work completion are not verified. Inspect destinations before retrying; launched sessions are independent and not monitored here.");
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
