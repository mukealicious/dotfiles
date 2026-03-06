import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { StringEnum, Type } from "@mariozechner/pi-ai";

type JsonObject = Record<string, unknown>;

type AnyObj = Record<string, any>;

type LinearClientCtor = new (opts: { apiKey: string }) => AnyObj;

let cachedLinearClient: AnyObj | null = null;
let cachedLinearKey: string | null = null;
let cachedLinearCtor: LinearClientCtor | null = null;

const parseDate = (d: unknown): string | undefined => {
  if (!d) return undefined;
  if (d instanceof Date) return d.toISOString();
  if (typeof d === "string") return d;
  return undefined;
};

const text = (value: string, details?: JsonObject, isError = false) => ({
  content: [{ type: "text" as const, text: value }],
  details,
  isError,
});

const first = <T>(arr: T[] | undefined | null): T | undefined => (arr && arr.length > 0 ? arr[0] : undefined);

const norm = (s: unknown): string => String(s ?? "").trim();

const eqi = (a: unknown, b: unknown): boolean => norm(a).toLowerCase() === norm(b).toLowerCase();

const singleLine = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();

const truncateText = (value: string, max: number): string => {
  if (max <= 0) return "";
  const v = singleLine(value);
  if (v.length <= max) return v;
  if (max === 1) return "…";
  return `${v.slice(0, max - 1)}…`;
};

const pad = (value: string, width: number): string => {
  if (value.length >= width) return value.slice(0, width);
  return value + " ".repeat(width - value.length);
};

const resolveLinearApiKey = async (pi: ExtensionAPI, signal?: AbortSignal): Promise<string> => {
  const direct = process.env.LINEAR_API_KEY?.trim();
  if (direct) return direct.replace(/^Bearer\s+/i, "");

  const ref = process.env.LINEAR_OP_REF?.trim();
  if (!ref) throw new Error("Missing Linear auth. Set LINEAR_API_KEY or LINEAR_OP_REF.");

  if (ref.startsWith("lin_api_")) return ref;

  if (ref.startsWith("op://")) {
    const op = await pi.exec("op", ["read", ref], { signal, timeout: 15000 });
    if (op.code !== 0) throw new Error((op.stderr || op.stdout || "Failed to resolve LINEAR_OP_REF via op").trim());
    const key = op.stdout.trim();
    if (!key) throw new Error("1Password reference resolved to empty value.");
    return key.replace(/^Bearer\s+/i, "");
  }

  throw new Error("LINEAR_OP_REF must be op://... or set LINEAR_API_KEY directly.");
};

const getClient = async (pi: ExtensionAPI, signal?: AbortSignal): Promise<AnyObj> => {
  const key = await resolveLinearApiKey(pi, signal);
  if (cachedLinearClient && cachedLinearKey === key) return cachedLinearClient;

  if (!cachedLinearCtor) {
    const sdk = (await import("@linear/sdk")) as { LinearClient: LinearClientCtor };
    cachedLinearCtor = sdk.LinearClient;
  }

  cachedLinearClient = new cachedLinearCtor({ apiKey: key });
  cachedLinearKey = key;
  return cachedLinearClient;
};

const withClient = async (
  pi: ExtensionAPI,
  signal: AbortSignal | undefined,
  run: (client: AnyObj) => Promise<ReturnType<typeof text>>,
): Promise<ReturnType<typeof text>> => {
  try {
    const client = await getClient(pi, signal);
    return await run(client);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const hint = msg.includes("Missing Linear auth") ? ensureLinearConfiguredMessage : `Linear init failed: ${msg}`;
    return text(hint, { error: msg }, true);
  }
};

const shortIssueUrl = (url: string | undefined, identifier: string | undefined): string => {
  const u = singleLine(url ?? "");
  const id = singleLine(identifier ?? "");
  if (!u || !id) return u;
  const m = u.match(/^(https?:\/\/[^/]+\/[^/]+\/issue\/[A-Z]+-\d+)/i);
  if (m) return m[1];
  return u;
};

const mapIssue = async (issue: AnyObj): Promise<AnyObj> => {
  if (!issue) return null;
  const [state, team, project, assignee, milestone] = await Promise.all([
    issue.state?.catch?.(() => null) ?? issue.state,
    issue.team?.catch?.(() => null) ?? issue.team,
    issue.project?.catch?.(() => null) ?? issue.project,
    issue.assignee?.catch?.(() => null) ?? issue.assignee,
    issue.projectMilestone?.catch?.(() => null) ?? issue.projectMilestone,
  ]);

  return {
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    description: issue.description ?? "",
    url: issue.url,
    branchName: issue.branchName ?? undefined,
    priority: issue.priority,
    state: state ? { id: state.id, name: state.name, type: state.type } : null,
    team: team ? { id: team.id, key: team.key, name: team.name } : null,
    project: project ? { id: project.id, name: project.name } : null,
    projectMilestone: milestone ? { id: milestone.id, name: milestone.name } : null,
    assignee: assignee ? { id: assignee.id, name: assignee.name, displayName: assignee.displayName } : null,
    createdAt: parseDate(issue.createdAt),
    updatedAt: parseDate(issue.updatedAt),
  };
};

const mapDocument = (doc: AnyObj): AnyObj => ({
  id: doc.id,
  title: doc.title,
  slugId: doc.slugId,
  url: doc.url,
  content: doc.content ?? "",
  createdAt: parseDate(doc.createdAt),
  updatedAt: parseDate(doc.updatedAt),
});

const resolveTeam = async (client: AnyObj, teamRef?: string): Promise<AnyObj | null> => {
  if (!teamRef) return null;
  const tr = norm(teamRef);
  const teams = (await client.teams()).nodes ?? [];
  return (
    teams.find((t: AnyObj) => t.id === tr) ??
    teams.find((t: AnyObj) => eqi(t.key, tr)) ??
    teams.find((t: AnyObj) => eqi(t.name, tr)) ??
    null
  );
};

const resolveProject = async (client: AnyObj, projectRef?: string): Promise<AnyObj | null> => {
  if (!projectRef) return null;
  const pr = norm(projectRef);
  const projects = (await client.projects()).nodes ?? [];
  return (
    projects.find((p: AnyObj) => p.id === pr) ??
    projects.find((p: AnyObj) => eqi(p.name, pr)) ??
    null
  );
};

const resolveIssue = async (client: AnyObj, issueRef: string): Promise<AnyObj> => {
  const ref = norm(issueRef);
  if (!ref) throw new Error("Missing issue reference.");
  const issue = await client.issue(ref);
  if (!issue) throw new Error(`Issue not found: ${ref}`);
  return issue;
};

const resolveIssueStateId = async (issue: AnyObj, stateRef?: string): Promise<string | undefined> => {
  const sr = norm(stateRef);
  if (!sr) return undefined;
  const team = await (issue.team?.catch?.(() => null) ?? issue.team ?? null);
  if (!team) throw new Error("Issue has no team; cannot resolve state.");
  const states = (await team.states()).nodes ?? [];
  const found =
    states.find((s: AnyObj) => s.id === sr) ??
    states.find((s: AnyObj) => eqi(s.name, sr)) ??
    states.find((s: AnyObj) => eqi(s.type, sr));
  if (!found) throw new Error(`State not found in team workflow: ${sr}`);
  return found.id;
};

const resolveMilestoneIdForIssue = async (issue: AnyObj, milestoneRef?: string): Promise<string | null | undefined> => {
  if (milestoneRef === undefined) return undefined;
  const mr = norm(milestoneRef);
  if (!mr || ["none", "null", "clear"].includes(mr.toLowerCase())) return null;

  const project = await (issue.project?.catch?.(() => null) ?? issue.project ?? null);
  if (!project) throw new Error("Issue has no project; cannot resolve milestone.");
  const milestones = (await project.projectMilestones()).nodes ?? [];
  const found =
    milestones.find((m: AnyObj) => m.id === mr) ??
    milestones.find((m: AnyObj) => eqi(m.name, mr));
  if (!found) throw new Error(`Milestone not found in project: ${mr}`);
  return found.id;
};

const ensureLinearConfiguredMessage =
  "Linear auth missing. Set LINEAR_API_KEY or LINEAR_OP_REF (op://...).";

const IssueSchema = Type.Object({
  action: StringEnum(["list", "view", "create", "update", "comment", "start", "delete"] as const),
  issue: Type.Optional(Type.String({ description: "Issue identifier (e.g. INV-4470) or UUID." })),
  project: Type.Optional(Type.String({ description: "Project name or id for list/create." })),
  team: Type.Optional(Type.String({ description: "Team key/name/id for create." })),
  states: Type.Optional(Type.Array(Type.String({ description: "State name filter for list." }))),
  assignee: Type.Optional(Type.String({ description: "Assignee id, or 'me' for current user." })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 25 })),
  compact: Type.Optional(Type.Boolean({ description: "List only: render each issue as a minimal one-line entry. Default false." })),
  format: Type.Optional(StringEnum(["plain", "table"] as const, { description: "List only: output format (plain or fixed-width table). Default plain." })),
  showUrl: Type.Optional(Type.Boolean({ description: "List only: include URL in each row. Default true." })),
  maxTitle: Type.Optional(Type.Integer({ minimum: 12, maximum: 54, default: 54, description: "List only: truncate title width to reduce wrapping." })),
  includeComments: Type.Optional(Type.Boolean({ default: true })),
  title: Type.Optional(Type.String()),
  description: Type.Optional(Type.String()),
  body: Type.Optional(Type.String({ description: "Comment markdown body for action=comment" })),
  priority: Type.Optional(Type.Integer({ minimum: 0, maximum: 4 })),
  state: Type.Optional(Type.String({ description: "State name/id/type for update/start" })),
  milestone: Type.Optional(Type.String({ description: "Milestone name/id, or 'none' to clear" })),
  branch: Type.Optional(Type.String({ description: "Optional branch override for action=start" })),
  createBranch: Type.Optional(Type.Boolean({ default: true })),
  fromRef: Type.Optional(Type.String({ description: "Git ref for branch creation", default: "HEAD" })),
});

const ProjectSchema = Type.Object({
  action: StringEnum(["list"] as const),
});

const TeamSchema = Type.Object({
  action: StringEnum(["list"] as const),
});

const MilestoneSchema = Type.Object({
  action: StringEnum(["list", "view", "create", "update", "delete"] as const),
  milestone: Type.Optional(Type.String({ description: "Milestone id for view/update/delete." })),
  project: Type.Optional(Type.String({ description: "Project name/id for list/create." })),
  name: Type.Optional(Type.String()),
  description: Type.Optional(Type.String()),
  targetDate: Type.Optional(Type.String({ description: "YYYY-MM-DD" })),
  status: Type.Optional(Type.String({ description: "planned|inProgress|completed|canceled etc." })),
});

const DocumentRefSchema = Type.Object({
  ref: Type.String({ description: "Document URL, slugId, UUID, or title." }),
  includeContent: Type.Optional(Type.Boolean({ default: true })),
});

const DocumentSearchSchema = Type.Object({
  query: Type.String(),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 50, default: 10 })),
});

const DocumentCreateSchema = Type.Object({
  title: Type.String(),
  contentMarkdown: Type.String(),
});

const DocumentUpdateSchema = Type.Object({
  ref: Type.String(),
  contentMarkdown: Type.String(),
  mode: Type.Optional(StringEnum(["replace", "append"] as const, { default: "replace" })),
  expectedUpdatedAt: Type.Optional(Type.String()),
});

const FormatListSchema = Type.Object({
  columns: Type.Array(Type.String(), { description: "Column headers in order." }),
  rows: Type.Array(Type.Array(Type.String()), { description: "Row values, each row aligned with columns." }),
  maxColWidth: Type.Optional(
    Type.Integer({ minimum: 8, maximum: 120, default: 48, description: "Max width per column before truncation." }),
  ),
  includeHeader: Type.Optional(Type.Boolean({ default: true })),
});

const parseDocRef = (ref: string): { kind: "slugId" | "id" | "title"; value: string } => {
  const trimmed = ref.trim();
  if (/^[a-f0-9]{12}$/i.test(trimmed)) return { kind: "slugId", value: trimmed };
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) return { kind: "id", value: trimmed };

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const match = url.pathname.match(/\/document\/[^/]+-([a-z0-9]{12})$/i);
      if (match) return { kind: "slugId", value: match[1] };
    } catch {
      // title fallback
    }
  }

  return { kind: "title", value: trimmed };
};

const findDocument = async (client: AnyObj, ref: string): Promise<AnyObj | null> => {
  const parsed = parseDocRef(ref);

  if (parsed.kind === "id") {
    const d = await client.document(parsed.value);
    return d ?? null;
  }

  if (parsed.kind === "slugId") {
    const bySlug = await client.documents({ first: 1, filter: { slugId: { eq: parsed.value } } });
    return first(bySlug.nodes) ?? null;
  }

  let docs = (await client.documents({ first: 10, filter: { title: { containsIgnoreCase: parsed.value } } })).nodes ?? [];
  if (!docs.length) {
    docs = (await client.documents({ first: 10, filter: { title: { contains: parsed.value } } })).nodes ?? [];
  }

  if (!docs.length) return null;

  const exact = docs.filter((d: AnyObj) => eqi(d.title, parsed.value));
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) {
    throw new Error(`Multiple documents match exact title '${parsed.value}'. Use URL/slugId/id. Matches: ${exact.map((d: AnyObj) => d.url).join(", ")}`);
  }

  if (docs.length === 1) return docs[0];
  throw new Error(`Multiple documents match '${parsed.value}'. Use URL/slugId/id. Matches: ${docs.map((d: AnyObj) => d.url).join(", ")}`);
};

const renderIssue = (i: AnyObj, includeDescription = false): string => {
  const lines = [
    `${i.identifier}: ${i.title}`,
    `State: ${i.state?.name ?? "unknown"}`,
    `Assignee: ${i.assignee?.name ?? i.assignee?.displayName ?? "unassigned"}`,
    `Project: ${i.project?.name ?? "none"}`,
    `URL: ${i.url}`,
  ];
  if (includeDescription && i.description) lines.push("", i.description);
  return lines.join("\n");
};

const renderDoc = (d: AnyObj, includeContent: boolean): string => {
  const lines = [`Title: ${d.title}`, `URL: ${d.url}`, `Updated: ${d.updatedAt ?? "unknown"}`];
  if (includeContent) lines.push("---CONTENT---", d.content ?? "");
  return lines.join("\n");
};

const formatFixedList = (
  columns: string[],
  rows: string[][],
  maxColWidth = 48,
  includeHeader = true,
): { text: string; widths: number[] } => {
  const colCount = Math.max(columns.length, ...rows.map((r) => r.length), 0);
  const safeCols = Array.from({ length: colCount }, (_, i) => columns[i] ?? `col_${i + 1}`);

  const normalizedRows = rows.map((row) => Array.from({ length: colCount }, (_, i) => singleLine(row[i] ?? "")));
  const normalizedCols = safeCols.map((c) => singleLine(c));

  const widths = Array.from({ length: colCount }, (_, i) => {
    const headerLen = truncateText(normalizedCols[i] ?? "", maxColWidth).length;
    const rowLen = Math.max(0, ...normalizedRows.map((r) => truncateText(r[i] ?? "", maxColWidth).length));
    return Math.min(maxColWidth, Math.max(3, headerLen, rowLen));
  });

  const rowToLine = (row: string[]): string =>
    row
      .map((cell, i) => pad(truncateText(cell ?? "", widths[i] ?? maxColWidth), widths[i] ?? maxColWidth))
      .join("  ");

  const lines: string[] = [];
  if (includeHeader) {
    lines.push(rowToLine(normalizedCols));
    lines.push(widths.map((w) => "-".repeat(w)).join("  "));
  }
  for (const r of normalizedRows) lines.push(rowToLine(r));

  return { text: lines.join("\n"), widths };
};

const toComments = (comments: AnyObj[]): AnyObj[] =>
  comments.map((c) => ({
    id: c.id,
    body: c.body ?? "",
    createdAt: parseDate(c.createdAt),
    userId: c.userId,
    parentId: c.parentId,
  }));

export default function linearExtension(pi: ExtensionAPI) {
  pi.registerTool({
    name: "linear_issue",
    label: "Linear Issue",
    description: "SDK-backed Linear issue operations: list, view, create, update, comment, start, delete.",
    promptGuidelines: [
      "For action=list, choose showUrl based on readability and user intent.",
      "When user asks for a table, set format='table'.",
      "Do not call format_list on linear_issue list output; linear_issue with format='table' already returns final table text.",
      "For action=list, prefer compact=true and maxTitle around 48-64 for scannable output.",
      "When reporting list results to the user, preserve the tool's row layout verbatim unless the user asks to reformat.",
    ],
    parameters: IssueSchema,
    async execute(_toolCallId, params, signal) {
      return withClient(pi, signal, async (client) => {
        if (params.action === "list") {
        const limit = params.limit ?? 25;
        const filter: AnyObj = {};

        if (params.project) {
          const project = await resolveProject(client, params.project);
          if (!project) return text(`Project not found: ${params.project}`, { project: params.project }, true);
          filter.project = { id: { eq: project.id } };
        }

        if (params.states && params.states.length > 0) {
          filter.state = { name: { in: params.states } };
        }

        if (params.assignee) {
          if (eqi(params.assignee, "me")) {
            const viewer = await client.viewer;
            filter.assignee = { id: { eq: viewer.id } };
          } else {
            filter.assignee = { id: { eq: params.assignee } };
          }
        }

        const res = await client.issues({ first: limit, filter: Object.keys(filter).length ? filter : undefined });
        const issues = await Promise.all((res.nodes ?? []).map(mapIssue));
        if (!issues.length) return text("No issues found.", { count: 0, issues: [] });

        const showUrl = params.showUrl ?? true;
        const format = params.format ?? "plain";
        const effectiveShowUrl = format === "table" ? true : showUrl;
        const requestedMaxTitle = params.maxTitle ?? 54;
        // Keep a conservative cap to avoid terminal wrap in narrow panes.
        const maxTitle = Math.max(12, Math.min(requestedMaxTitle, 54));

        if (format === "table") {
          const idW = 10;
          const stateW = 12;
          const header = `${pad("Issue", idW)} ${pad("State", stateW)} Title`;
          const separator = "─".repeat(Math.max(40, idW + 1 + stateW + 1 + maxTitle));

          const blocks = issues.map((i) => {
            const url = shortIssueUrl(i.url, i.identifier);
            const row = `${pad(singleLine(i.identifier ?? ""), idW)} ${pad(singleLine(i.state?.name ?? "unknown"), stateW)} ${truncateText(i.title ?? "", maxTitle)}`;
            // Table mode enforces links for scanability/reference.
            return `${url}\n${row}`;
          });

          const rendered = `${header}\n${separator}\n\n${blocks.join("\n\n")}`;
          return text(rendered, {
            count: issues.length,
            issues,
            showUrl: effectiveShowUrl,
            format,
            maxTitle,
            columns: { idW, stateW },
            style: "url-first-blocks",
          });
        }

        const idW = 10;
        const stateW = 12;

        const rows = issues.map((i) => {
          const id = pad(i.identifier ?? "", idW);
          const state = pad(i.state?.name ?? "unknown", stateW);
          const title = truncateText(i.title ?? "", maxTitle);
          const main = `${id} ${state} ${title}`;
          if (!effectiveShowUrl) return main;
          return `${main} — ${shortIssueUrl(i.url, i.identifier)}`;
        });

        const body = rows.join("\n");
        const out = params.compact
          ? body
          : effectiveShowUrl
            ? `ID${" ".repeat(idW - 2)} STATE${" ".repeat(Math.max(1, stateW - 5))} TITLE / URL\n${body}`
            : `ID${" ".repeat(idW - 2)} STATE${" ".repeat(Math.max(1, stateW - 5))} TITLE\n${body}`;

        return text(out, { count: issues.length, issues, showUrl: effectiveShowUrl, format, maxTitle, columns: { idW, stateW } });
      }

      if (params.action === "view") {
        if (!params.issue) return text("Missing required field: issue", {}, true);
        const issue = await resolveIssue(client, params.issue);
        const mapped = await mapIssue(issue);

        let comments: AnyObj[] = [];
        if (params.includeComments ?? true) {
          const cr = await (issue.comments?.({ first: 20 }) ?? { nodes: [] });
          comments = toComments(cr.nodes ?? []);
        }

        const base = renderIssue(mapped, true);
        const commentText = comments.length
          ? `\n\nComments (${comments.length}):\n${comments
              .map((c) => `- ${c.createdAt ?? ""}: ${String(c.body).slice(0, 240)}`)
              .join("\n")}`
          : "";

        return text(`${base}${commentText}`, { issue: mapped, comments });
      }

      if (params.action === "create") {
        if (!params.title) return text("Missing required field: title", {}, true);

        let teamId: string | undefined;
        if (params.team) {
          const team = await resolveTeam(client, params.team);
          if (!team) return text(`Team not found: ${params.team}`, { team: params.team }, true);
          teamId = team.id;
        }

        let projectId: string | undefined;
        if (params.project) {
          const project = await resolveProject(client, params.project);
          if (!project) return text(`Project not found: ${params.project}`, { project: params.project }, true);
          projectId = project.id;
          if (!teamId) {
            const pteam = await (project.team?.catch?.(() => null) ?? project.team ?? null);
            if (pteam?.id) teamId = pteam.id;
          }
        }

        if (!teamId) return text("Issue create requires team (explicit or inferred from project).", {}, true);

        const payload: AnyObj = {
          title: params.title,
          description: params.description,
          teamId,
          projectId,
          priority: params.priority,
        };

        const result = await client.createIssue(payload);
        const issue = result.issue ? await mapIssue(result.issue) : null;
        if (!issue) return text("Failed to create issue.", { payload }, true);
        return text(`Created ${issue.identifier}: ${issue.title}\n${issue.url}`, { issue });
      }

      if (params.action === "update") {
        if (!params.issue) return text("Missing required field: issue", {}, true);
        const issue = await resolveIssue(client, params.issue);

        const update: AnyObj = {};
        if (params.title !== undefined) update.title = params.title;
        if (params.description !== undefined) update.description = params.description;
        if (params.priority !== undefined) update.priority = params.priority;

        if (params.state !== undefined) {
          const stateId = await resolveIssueStateId(issue, params.state);
          if (stateId) update.stateId = stateId;
        }

        if (params.assignee !== undefined) {
          if (!params.assignee || eqi(params.assignee, "none") || eqi(params.assignee, "null")) {
            update.assigneeId = null;
          } else if (eqi(params.assignee, "me")) {
            const viewer = await client.viewer;
            update.assigneeId = viewer.id;
          } else {
            update.assigneeId = params.assignee;
          }
        }

        if (params.milestone !== undefined) {
          const msId = await resolveMilestoneIdForIssue(issue, params.milestone);
          if (msId !== undefined) update.projectMilestoneId = msId;
        }

        const updatedRes = await issue.update(update);
        const updated = updatedRes?.issue ? await mapIssue(updatedRes.issue) : await mapIssue(await resolveIssue(client, params.issue));
        return text(`Updated ${updated.identifier}: ${updated.title}\n${updated.url}`, { issue: updated, update });
      }

      if (params.action === "comment") {
        if (!params.issue) return text("Missing required field: issue", {}, true);
        if (!params.body) return text("Missing required field: body", {}, true);

        const issue = await resolveIssue(client, params.issue);
        const result = await client.createComment({ issueId: issue.id, body: params.body });
        const mapped = await mapIssue(issue);
        return text(`Comment added to ${mapped.identifier}\n${mapped.url}`, {
          issue: mapped,
          comment: result.comment ? { id: result.comment.id, body: result.comment.body } : undefined,
        });
      }

      if (params.action === "start") {
        if (!params.issue) return text("Missing required field: issue", {}, true);
        const issue = await resolveIssue(client, params.issue);

        const team = await (issue.team?.catch?.(() => null) ?? issue.team ?? null);
        const states = team ? (await team.states()).nodes ?? [] : [];
        const target =
          states.find((s: AnyObj) => eqi(s.type, "started")) ??
          states.find((s: AnyObj) => eqi(s.name, "In Progress")) ??
          states.find((s: AnyObj) => /progress/i.test(String(s.name ?? "")));

        if (target) await issue.update({ stateId: target.id });

        const refreshed = await mapIssue(await resolveIssue(client, params.issue));
        const branchName = params.branch || refreshed.branchName || `${String(refreshed.identifier || "issue").toLowerCase()}-${String(refreshed.title || "work").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48)}`;

        let branchInfo = "";
        if ((params.createBranch ?? true) && branchName) {
          const fromRef = params.fromRef || "HEAD";
          const create = await pi.exec("git", ["checkout", "-b", branchName, fromRef], { signal, timeout: 20000 });
          if (create.code !== 0 && /already exists/i.test(`${create.stderr} ${create.stdout}`)) {
            const sw = await pi.exec("git", ["checkout", branchName], { signal, timeout: 20000 });
            branchInfo = sw.code === 0 ? `\nSwitched existing branch: ${branchName}` : "\nBranch exists but failed to switch.";
          } else if (create.code === 0) {
            branchInfo = `\nCreated branch: ${branchName}`;
          } else {
            branchInfo = `\nBranch creation failed: ${(create.stderr || create.stdout || "unknown error").trim()}`;
          }
        }

        return text(`Started ${refreshed.identifier}: ${refreshed.title}\n${refreshed.url}${branchInfo}`, {
          issue: refreshed,
          branchName,
        });
      }

      if (params.action === "delete") {
        if (!params.issue) return text("Missing required field: issue", {}, true);
        const issue = await resolveIssue(client, params.issue);
        const mapped = await mapIssue(issue);
        const res = await client.deleteIssue(issue.id);
        return text(`Deleted issue: ${mapped.identifier} (${mapped.title})`, { success: res?.success ?? true, issue: mapped });
      }

      return text(`Unsupported action: ${params.action}`, {}, true);
      });
    },
  });

  pi.registerTool({
    name: "linear_project",
    label: "Linear Project",
    description: "SDK-backed Linear project operations (list).",
    parameters: ProjectSchema,
    async execute(_toolCallId, params, signal) {
      if (params.action !== "list") return text(`Unsupported action: ${params.action}`, {}, true);
      return withClient(pi, signal, async (client) => {
      const projects = (await client.projects()).nodes ?? [];
      if (!projects.length) return text("No projects found.", { count: 0, projects: [] });

      const mapped = projects.map((p: AnyObj) => ({
        id: p.id,
        name: p.name,
        description: p.description ?? "",
        state: p.state ?? undefined,
        url: p.url,
        targetDate: parseDate(p.targetDate),
        createdAt: parseDate(p.createdAt),
        updatedAt: parseDate(p.updatedAt),
      }));

      const out = mapped.map((p: AnyObj) => `- ${p.name} — ${p.url ?? p.id}`).join("\n");
      return text(out, { count: mapped.length, projects: mapped });
      });
    },
  });

  pi.registerTool({
    name: "linear_team",
    label: "Linear Team",
    description: "SDK-backed Linear team operations (list).",
    parameters: TeamSchema,
    async execute(_toolCallId, params, signal) {
      if (params.action !== "list") return text(`Unsupported action: ${params.action}`, {}, true);
      return withClient(pi, signal, async (client) => {

      const teams = (await client.teams()).nodes ?? [];
      if (!teams.length) return text("No teams found.", { count: 0, teams: [] });

      const mapped = teams.map((t: AnyObj) => ({ id: t.id, key: t.key, name: t.name }));
      const out = mapped.map((t: AnyObj) => `- ${t.key}: ${t.name} (${t.id})`).join("\n");
      return text(out, { count: mapped.length, teams: mapped });
      });
    },
  });

  pi.registerTool({
    name: "linear_milestone",
    label: "Linear Milestone",
    description: "SDK-backed Linear milestone operations: list, view, create, update, delete.",
    parameters: MilestoneSchema,
    async execute(_toolCallId, params, signal) {
      return withClient(pi, signal, async (client) => {

      if (params.action === "list") {
        if (!params.project) return text("Missing required field: project", {}, true);
        const project = await resolveProject(client, params.project);
        if (!project) return text(`Project not found: ${params.project}`, { project: params.project }, true);
        const milestones = (await project.projectMilestones()).nodes ?? [];
        const mapped = milestones.map((m: AnyObj) => ({
          id: m.id,
          name: m.name,
          description: m.description ?? "",
          status: m.status,
          targetDate: parseDate(m.targetDate),
          url: m.url,
          updatedAt: parseDate(m.updatedAt),
        }));
        if (!mapped.length) return text(`No milestones for project: ${project.name}`, { count: 0, milestones: [] });
        const out = mapped.map((m: AnyObj) => `- ${m.name} [${m.status ?? "unknown"}] — ${m.url ?? m.id}`).join("\n");
        return text(out, { project: { id: project.id, name: project.name }, count: mapped.length, milestones: mapped });
      }

      if (params.action === "view") {
        if (!params.milestone) return text("Missing required field: milestone", {}, true);
        const m = await client.projectMilestone(params.milestone);
        if (!m) return text(`Milestone not found: ${params.milestone}`, {}, true);
        const payload = {
          id: m.id,
          name: m.name,
          description: m.description ?? "",
          status: m.status,
          targetDate: parseDate(m.targetDate),
          url: m.url,
          updatedAt: parseDate(m.updatedAt),
        };
        const out = [`${payload.name}`, `Status: ${payload.status ?? "unknown"}`, `URL: ${payload.url ?? payload.id}`, payload.description ? `\n${payload.description}` : ""]
          .filter(Boolean)
          .join("\n");
        return text(out, { milestone: payload });
      }

      if (params.action === "create") {
        if (!params.project) return text("Missing required field: project", {}, true);
        if (!params.name) return text("Missing required field: name", {}, true);
        const project = await resolveProject(client, params.project);
        if (!project) return text(`Project not found: ${params.project}`, {}, true);

        const result = await client.createProjectMilestone({
          projectId: project.id,
          name: params.name,
          description: params.description,
          targetDate: params.targetDate,
          status: params.status,
        });

        const m = result.projectMilestone;
        if (!m) return text("Failed to create milestone.", {}, true);
        return text(`Created milestone: ${m.name}\n${m.url ?? m.id}`, {
          milestone: {
            id: m.id,
            name: m.name,
            status: m.status,
            url: m.url,
          },
        });
      }

      if (params.action === "update") {
        if (!params.milestone) return text("Missing required field: milestone", {}, true);
        const patch: AnyObj = {};
        if (params.name !== undefined) patch.name = params.name;
        if (params.description !== undefined) patch.description = params.description;
        if (params.targetDate !== undefined) patch.targetDate = params.targetDate;
        if (params.status !== undefined) patch.status = params.status;

        const result = await client.updateProjectMilestone(params.milestone, patch);
        const m = result.projectMilestone;
        if (!m) return text(`Failed to update milestone: ${params.milestone}`, { patch }, true);

        return text(`Updated milestone: ${m.name}\n${m.url ?? m.id}`, {
          milestone: { id: m.id, name: m.name, status: m.status, url: m.url },
          patch,
        });
      }

      if (params.action === "delete") {
        if (!params.milestone) return text("Missing required field: milestone", {}, true);
        const existing = await client.projectMilestone(params.milestone);
        const res = await client.deleteProjectMilestone(params.milestone);
        return text(`Deleted milestone: ${existing?.name ?? params.milestone}`, {
          success: res?.success ?? true,
          milestone: existing
            ? { id: existing.id, name: existing.name, url: existing.url }
            : { id: params.milestone },
        });
      }

      return text(`Unsupported action: ${params.action}`, {}, true);
      });
    },
  });

  pi.registerTool({
    name: "linear_doc_get",
    label: "Linear Doc Get",
    description: "Fetch a Linear document by URL/slugId/id/title.",
    parameters: DocumentRefSchema,
    async execute(_toolCallId, params, signal) {
      return withClient(pi, signal, async (client) => {
      const includeContent = params.includeContent ?? true;
      let doc: AnyObj | null = null;
      try {
        doc = await findDocument(client, params.ref);
      } catch (e) {
        const err = e instanceof Error ? e.message : String(e);
        return text(`Document lookup failed: ${err}`, { ref: params.ref, error: err }, true);
      }
      if (!doc) return text(`Document not found for ref: ${params.ref}`, { ref: params.ref }, true);

      const mapped = mapDocument(doc);
      if (!includeContent) delete mapped.content;
      return text(renderDoc(mapped, includeContent), { document: mapped });
      });
    },
  });

  pi.registerTool({
    name: "linear_doc_search",
    label: "Linear Doc Search",
    description: "Search Linear documents by title.",
    parameters: DocumentSearchSchema,
    async execute(_toolCallId, params, signal) {
      return withClient(pi, signal, async (client) => {

      const limit = params.limit ?? 10;
      let docs = (await client.documents({ first: limit, filter: { title: { containsIgnoreCase: params.query } } })).nodes ?? [];
      if (!docs.length) docs = (await client.documents({ first: limit, filter: { title: { contains: params.query } } })).nodes ?? [];

      if (!docs.length) return text(`No documents found for query: ${params.query}`, { query: params.query, count: 0, documents: [] });

      const mapped = docs.map(mapDocument).map((d: AnyObj) => {
        delete d.content;
        return d;
      });
      const out = mapped.map((d: AnyObj) => `- ${d.title} (${d.updatedAt ?? "unknown"}) — ${d.url}`).join("\n");
      return text(out, { query: params.query, count: mapped.length, documents: mapped });
      });
    },
  });

  pi.registerTool({
    name: "linear_doc_create",
    label: "Linear Doc Create",
    description: "Create a Linear document from markdown content.",
    parameters: DocumentCreateSchema,
    async execute(_toolCallId, params, signal) {
      return withClient(pi, signal, async (client) => {

      let created: AnyObj | null = null;
      try {
        const res = await client.createDocument({ title: params.title, content: params.contentMarkdown });
        created = res.document ?? null;
      } catch (e) {
        const err = e instanceof Error ? e.message : String(e);
        return text(`Failed to create document: ${err}`, { title: params.title, error: err }, true);
      }

      if (!created) return text("Failed to create document: empty response", { title: params.title }, true);
      const mapped = mapDocument(created);
      return text(`Created document: ${mapped.title}\n${mapped.url}`, { document: mapped });
      });
    },
  });

  pi.registerTool({
    name: "linear_doc_update",
    label: "Linear Doc Update",
    description: "Update a Linear document (replace/append).",
    parameters: DocumentUpdateSchema,
    async execute(_toolCallId, params, signal) {
      return withClient(pi, signal, async (client) => {

      let current: AnyObj | null = null;
      try {
        current = await findDocument(client, params.ref);
      } catch (e) {
        const err = e instanceof Error ? e.message : String(e);
        return text(`Document lookup failed: ${err}`, { ref: params.ref, error: err }, true);
      }
      if (!current) return text(`Document not found for ref: ${params.ref}`, { ref: params.ref }, true);

      const currentMapped = mapDocument(current);
      if (
        params.expectedUpdatedAt &&
        currentMapped.updatedAt &&
        params.expectedUpdatedAt !== currentMapped.updatedAt
      ) {
        return text(
          `Conflict: document updated since expected timestamp. expected=${params.expectedUpdatedAt} actual=${currentMapped.updatedAt}`,
          { conflict: true, expectedUpdatedAt: params.expectedUpdatedAt, actualUpdatedAt: currentMapped.updatedAt, document: currentMapped },
          true,
        );
      }

      const mode = params.mode ?? "replace";
      const next = mode === "append" ? `${currentMapped.content ?? ""}\n\n${params.contentMarkdown}` : params.contentMarkdown;

      let updated: AnyObj | null = null;
      try {
        const res = await client.updateDocument(current.id, { content: next });
        updated = res.document ?? null;
      } catch (e) {
        const err = e instanceof Error ? e.message : String(e);
        return text(`Failed to update document: ${err}`, { document: currentMapped, error: err }, true);
      }

      if (!updated) return text("Failed to update document: empty response", { document: currentMapped }, true);

      const mapped = mapDocument(updated);
      return text(`Updated document: ${mapped.title}\n${mapped.url}`, { mode, document: mapped });
      });
    },
  });

  pi.registerTool({
    name: "format_list",
    label: "Format List",
    description: "Format rows into a fixed-width, scannable text table for final responses.",
    promptGuidelines: [
      "Use this before finalizing list-heavy responses when readability matters.",
      "In Pi CLI responses, paste the formatted table as plain text (no markdown code fences).",
    ],
    parameters: FormatListSchema,
    async execute(_toolCallId, params) {
      const maxColWidth = params.maxColWidth ?? 48;
      const includeHeader = params.includeHeader ?? true;
      const { text: rendered, widths } = formatFixedList(params.columns ?? [], params.rows ?? [], maxColWidth, includeHeader);
      return text(rendered, { columns: params.columns, rowCount: (params.rows ?? []).length, widths, maxColWidth, includeHeader });
    },
  });
}
