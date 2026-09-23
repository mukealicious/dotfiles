---
name: handoff
description: Design temporary handoffs for local continuation, other sessions, parallel work, or document-only recovery. Use when explicitly handing off the next phase or recording the next unfinished step.
argument-hint: "What should the next continuation do?"
disable-model-invocation: true
user-invocable: true
metadata:
  watch-sources: dmmulroy/.dotfiles/home/.agents/skills/handoff@f9f7aa1a3638d6bfb6fa0b94fd110185534a2895
---

# Handoff

Design the handoff from the user's intent and current context. You own the topology:
one or many continuations, destination tabs/workspaces, filesystem isolation, skill
selection, and shared artifacts. The extension owns lifecycle bookkeeping, not a
launcher or a fixed planning recipe.

## Choose the lifecycle first

When invoked by Pi's `/handoff`, call `handoff_control` before writing or launching:

- `route: "here"` — the default intent when no other destination is requested.
  Write one document and end your turn. The extension summarizes the source branch
  and starts the continuation in this session. Do not launch another session.
- `route: "external"` — another tab, workspace, harness, or parallel continuations.
  Design and dispatch with your existing tools. The extension leaves this branch
  intact and never starts a local continuation.
- `route: "document"` — prepare documents without launching anything. Also use this
  when a consequential ambiguity needs the user's answer before dispatch.

Select once; the route cannot change within that invocation. Missing control data
stops the extension rather than guessing a local continuation. For a direct skill
invocation without an active `/handoff` transaction, follow the same planning rules
but do not call `handoff_control`; no extension continuation is scheduled.

## Design and dispatch

- Treat arguments as intent, not just focus: destinations, parallelism, isolation,
  shared output, and review requirements matter. Resolve retrievable facts yourself;
  ask when destination or write ownership remains consequentially ambiguous.
- For Herdr destinations, load the Herdr skill and its coordination references.
  Use new, labeled, unfocused tabs; do not repurpose unrelated panes. Preserve the
  source profile unless the user explicitly requests a different one. Start fresh
  sessions with their document paths, never concurrent writers to the source JSONL.
- Separate worktrees when writes overlap. A shared worktree is reasonable with
  explicit non-overlapping ownership and a single owner for shared artifacts.
  Skill directories are instructions, not filesystem isolation. Reuse skills;
  don't create new ones merely to represent tasks.
- For multiple approaches plus a comparison viewer, define baseline separation,
  output locations/contracts, and who writes the viewer. Record dependencies and
  blocking decisions rather than silently choosing unresolved requirements.
- For external/document routes, record destinations with `handoff_control` using
  stable task IDs. Report all planned destinations before dispatch, then update
  each as `prepared`, `launched`, `start-confirmed`, or `failed`. Each update replaces
  that destination's fields: include its document, locator, and relevant notes again.
  Record failures without dropping successful siblings. Reports survive interruption.
- Give destinations short, human-readable `name` values. The first report returns
  a persistent connection file for each destination. Include that exact path in
  its document and launch prompt. After reading the handoff, a Pi destination calls
  `handoff_accept` with `{ connection: "<absolute path>" }` to register its origin
  backlink. If that tool is unavailable in another harness, retain the path as
  recovery information; do not claim a backlink was registered.
  Connection files are extension-owned, separate from temporary handoff documents.
  Updates to the same destination retain its connection. A retry in a different
  session needs a new task ID and connection; never overwrite a prior acceptance.
  Acceptance is independent of launch status and does not mean work completion.
  `/handoffs` inspects cross-session incoming/outgoing links and can focus a verified
  Herdr session without moving its branch. Local handoffs use labeled `/tree` entries
  only; do not create or accept connections within the same session.
- Each prepared destination needs an existing absolute document path. Launch prompts
  must open that document directly and perform its next unfinished step; they cannot
  depend on this session's branch summary. Include cwd/worktree, ownership, source
  recovery locator, and suggested skills in the document.
- `launched` means the launch command succeeded; `start-confirmed` additionally needs
  observed destination activity/session evidence. Record the verified locator and
  evidence in the report. Neither means document acceptance or completed work.
- End with a compact destination/status/document/ownership report. Do not wait for
  the remote work to finish, shut down the source runtime, or retry successful
  launches. Remote sessions live independently; this extension does not monitor them.

## Handoff documents

- Save the document in the user's OS temporary directory, never in the checkout
  or a project runtime directory. Include its exact absolute path in the
  document so the continuation can open it.
- Record the current Git branch and commit, relevant durable artifact paths,
  changed areas, validation results, known failures, the exact next unfinished
  step, recovery information, and a **Suggested skills** section tailored to that
  step. When a manually invoked mode such as Mu Mode is active, record the mode,
  current route, intended continuation or rematch, and suggest its router skill.
  Make reloading that router the first continuation step; summaries preserve mode
  intent but do not guarantee that its full instructions remain loaded.
- Include a compact resume locator when recovery may cross process boundaries:
  source harness, its verified native session locator, working directory, and
  available Herdr workspace, tab, and pane identifiers. For Pi, include the
  profile, session ID or JSONL path, and relevant tree-entry ID when branch
  identity matters. Treat Herdr identifiers as live hints, not durable identity.
- Keep specs, ADRs, issues, commits, and diffs as the durable sources of truth;
  reference them instead of copying their contents. Do not create `context.md`,
  `plan.md`, `progress.md`, or another checkout artifact just for handoff.
- Handoffs are temporary continuation context. Moja Glava checkpoints are
  durable personal recall artifacts and are a separate workflow; do not use one
  as a substitute for the other.
- Redact API keys, access tokens, passwords, cookies, private URLs, PII, and
  other secrets. Describe their presence or location without copying values.
- For local continuation, repeating Pi's handoff command is the normal phase loop. Each continuation
  already carries prior branch summaries on its active path. Do not instruct the
  user to navigate with Pi's tree browser between handoffs; reserve it for
  history, recovery, or a deliberate alternative branch.
- Explain how to recover: identify the source session/tree branch and its next
  step, point to the temporary artifact and durable references, and state what
  remains safe to retry. If writing, internal tree navigation, or continuation
  fails, retain the existing artifact and old branch and report the failure
  honestly rather than claiming a successful handoff.

Do not duplicate content already captured in durable artifacts. A handoff should
make continuation possible, not become a second plan or project record.
