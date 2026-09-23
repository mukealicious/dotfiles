import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname, isAbsolute, join } from "node:path";
import { Type } from "@earendil-works/pi-ai";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";

const INCOMING = "handoff-origin";
export interface Endpoint { sessionFile: string; entryId: string; name: string; pane?: string }
export interface Connection { version: 1; id: string; name: string; source: Endpoint }
interface Origin { connection: Connection; path: string }

export function endpoint(ctx: ExtensionContext): Endpoint | undefined {
	const sessionFile = ctx.sessionManager.getSessionFile();
	const entryId = ctx.sessionManager.getLeafId();
	return sessionFile && entryId ? { sessionFile, entryId, name: ctx.sessionManager.getSessionName() || "Source conversation" } : undefined;
}
export async function captureEndpoint(pi: ExtensionAPI, ctx: ExtensionContext, signal?: AbortSignal): Promise<Endpoint | undefined> {
	const target = endpoint(ctx);
	if (!target || process.env.HERDR_ENV !== "1") return target;
	const result = await pi.exec("herdr", ["pane", "current", "--current"], { timeout: 3000, signal });
	if (result.code !== 0) throw new Error("Could not identify the current Herdr pane");
	const pane = JSON.parse(result.stdout).result?.pane;
	if (pane?.agent_session?.value !== target.sessionFile) return target;
	if (typeof pane.pane_id === "string") target.pane = pane.pane_id;
	if (typeof pane.tab_id === "string" && !ctx.sessionManager.getSessionName()) {
		const tab = await pi.exec("herdr", ["tab", "get", pane.tab_id], { timeout: 3000, signal });
		if (tab.code !== 0) throw new Error("Could not read the current Herdr tab label");
		const name = JSON.parse(tab.stdout).result?.tab?.label;
		if (typeof name === "string" && name.trim()) target.name = name;
	}
	return target;
}
function isEndpoint(value: unknown): value is Endpoint {
	if (!value || typeof value !== "object") return false;
	const e = value as Record<string, unknown>;
	return typeof e.sessionFile === "string" && isAbsolute(e.sessionFile) && typeof e.entryId === "string" && e.entryId.length > 0
		&& typeof e.name === "string" && (e.pane === undefined || typeof e.pane === "string");
}
function isConnection(value: unknown): value is Connection {
	if (!value || typeof value !== "object") return false;
	const c = value as Record<string, unknown>;
	return c.version === 1 && typeof c.id === "string" && /^[0-9a-f-]{36}$/.test(c.id) && typeof c.name === "string" && isEndpoint(c.source);
}
function readJson(path: string): unknown {
	if (statSync(path).size > 32_768) throw new Error("Connection record is too large");
	const text = readFileSync(path, "utf8");
	if (text.length > 32_768) throw new Error("Connection record is too large");
	return JSON.parse(text);
}
export function readConnection(path: string): Connection {
	if (!isAbsolute(path)) throw new Error("Connection path must be absolute");
	const value = readJson(path);
	if (!isConnection(value)) throw new Error("Invalid handoff connection");
	return value;
}
export function createConnection(source: Endpoint, name: string): string {
	const connection: Connection = { version: 1, id: randomUUID(), name, source };
	const dir = join(dirname(source.sessionFile), "handoff-connections");
	mkdirSync(dir, { recursive: true, mode: 0o700 });
	const path = join(dir, `${connection.id}.json`);
	writeFileSync(path, JSON.stringify(connection), { flag: "wx", mode: 0o600 });
	return path;
}
export function readDestination(path: string): Endpoint | undefined {
	try {
		const value = readJson(`${path}.accepted.json`);
		if (!isEndpoint(value)) throw new Error("Invalid destination acknowledgement");
		return value;
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
		throw error;
	}
}
export function acceptConnection(path: string, target: Endpoint): Connection {
	const connection = readConnection(path);
	if (connection.source.sessionFile === target.sessionFile) throw new Error("Local handoffs use /tree, not cross-session connections");
	const existing = readDestination(path);
	if (existing && existing.sessionFile !== target.sessionFile) throw new Error("Connection already accepted by another session; create a separate connection for a retry");
	if (!existing) writeFileSync(`${path}.accepted.json`, JSON.stringify(target), { flag: "wx", mode: 0o600 });
	return connection;
}
function origins(ctx: ExtensionContext): Origin[] {
	return ctx.sessionManager.getBranch().flatMap((entry) => {
		if (entry.type !== "custom" || entry.customType !== INCOMING) return [];
		const value = entry.data as Partial<Origin> | undefined;
		return value && isConnection(value.connection) && typeof value.path === "string" ? [value as Origin] : [];
	});
}
export async function focusEndpoint(pi: Pick<ExtensionAPI, "exec">, target: Endpoint): Promise<void> {
	if (!target.pane) throw new Error("No live pane was recorded; use the session and tree locator for recovery");
	const current = await pi.exec("herdr", ["agent", "get", target.pane], { timeout: 3000 });
	const agent = current.code === 0 ? JSON.parse(current.stdout).result?.agent : undefined;
	if (agent?.agent_session?.value !== target.sessionFile || agent?.agent !== "pi") throw new Error("Original pane is unavailable or now holds a different session. Use the saved session and /tree locator for recovery.");
	const focused = await pi.exec("herdr", ["agent", "focus", target.pane], { timeout: 3000 });
	if (focused.code !== 0) throw new Error("Herdr could not focus the destination; recovery locators remain available");
}
export function registerConnections(pi: ExtensionAPI): void {
	pi.registerTool({
		name: "handoff_accept", label: "Link handoff origin",
		description: "In a destination session, register the connection file supplied by its handoff. Adds a persistent origin backlink. This confirms document acceptance, not completion. Never modifies the source session.",
		parameters: Type.Object({ connection: Type.String({ maxLength: 4096, description: "Absolute connection path returned by handoff_control" }) }),
		async execute(_id, params, signal, _onUpdate, ctx) {
			signal?.throwIfAborted();
			const target = await captureEndpoint(pi, ctx, signal);
			if (!target) throw new Error("A persisted destination session with a tree entry is required");
			const connection = acceptConnection(params.connection, target);
			if (!origins(ctx).some((o) => o.connection.id === connection.id)) pi.appendEntry(INCOMING, { connection, path: params.connection });
			return { content: [{ type: "text", text: `Linked from ${connection.source.name}. Use /handoffs to inspect the origin. This does not report work completion.` }], details: { connectionId: connection.id } };
		},
	});
	pi.registerEntryRenderer(INCOMING, (entry, { expanded }, theme) => {
		const origin = entry.data as Partial<Origin> | undefined;
		if (!origin || !isConnection(origin.connection)) return new Text("Handoff origin unavailable", 0, 0);
		const { source, name } = origin.connection;
		return new Text(theme.fg("muted", `From ${source.name}`) + `\n└─ Here · ${name}` + theme.fg("dim", "\n/handoffs · connections")
			+ (expanded ? `\nSource session: ${source.sessionFile}\n/tree: ${source.entryId}\nConnection: ${origin.path}` : ""), 0, 0);
	});
	pi.registerCommand("handoffs", {
		description: "Inspect cross-session handoffs and focus verified Herdr sessions",
		async handler(_args, ctx) {
			if (!ctx.hasUI) return;
			const sessionFile = ctx.sessionManager.getSessionFile();
			// Ignore legacy local connections; /tree owns navigation within this session.
			const links: { label: string; path?: string; target?: Endpoint; document?: string; detail?: string }[] = origins(ctx)
				.filter((o) => o.connection.source.sessionFile !== sessionFile)
				.map((o) => ({ label: `Came from · ${o.connection.source.name} · ${o.connection.name}`, target: o.connection.source, path: o.path }));
			// Use the latest checkpoint per connection, including interrupted runs.
			const outgoing = new Map<string, typeof links[number]>();
			for (const entry of ctx.sessionManager.getEntries()) {
				if (entry.type !== "custom" || !["handoff-state", "handoff-receipt"].includes(entry.customType)) continue;
				const data = entry.data as { destinations?: { id: string; name?: string; connection?: string; document?: string; detail?: string }[] };
				for (const d of data.destinations ?? []) if (d.connection) outgoing.set(d.connection, { label: `Sent to · ${d.name || d.id.replace(/[-_]+/g, " ")}`, path: d.connection, document: d.document, detail: d.detail });
			}
			for (const link of outgoing.values()) {
				if (!links.some((existing) => existing.target && link.target && existing.target.sessionFile === link.target.sessionFile && existing.target.entryId === link.target.entryId)) links.push(link);
			}
			if (!links.length) { ctx.ui.notify("No cross-session handoffs. Use /tree for local handoff branches.", "info"); return; }
			const labels = links.map((link, i) => `${i + 1}. ${link.label}`);
			const selected = await ctx.ui.select("Cross-session handoffs · came from this branch / sent from this session", labels);
			if (!selected) return;
			const link = links[labels.indexOf(selected)]!;
			try {
				const target = link.target ?? (link.path ? readDestination(link.path) : undefined);
				const info = [link.label, target ? `Session: ${target.sessionFile}\n/tree: ${target.entryId}` : "Destination has not registered a backlink.", link.document && `Document: ${link.document}`, link.detail, link.path && `Connection: ${link.path}`].filter(Boolean).join("\n");
				const navigation = target?.pane && process.env.HERDR_ENV === "1" ? ["Focus session in Herdr (branch unchanged)"] : [];
				const action = await ctx.ui.select(`${link.label}\n${target ? "Saved session and branch" : "No destination backlink yet"}`, [...navigation, "Recovery details", "Close"]);
				if (action === "Recovery details") { await ctx.ui.select(info, ["Close"]); return; }
				if (action !== "Focus session in Herdr (branch unchanged)" || !target?.pane) return;
				await focusEndpoint(pi, target);
			} catch (error) { ctx.ui.notify(error instanceof Error ? error.message : String(error), "error"); }
		},
	});
}
