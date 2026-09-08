---
name: handoff
description: Compact the active conversation branch into a temporary handoff for continuation. Use when explicitly handing the next phase to a fresh continuation or recording the next unfinished step.
argument-hint: "What should the next continuation do?"
disable-model-invocation: true
user-invocable: true
metadata:
  watch-sources: dmmulroy/.dotfiles/home/.agents/skills/handoff@f9f7aa1a3638d6bfb6fa0b94fd110185534a2895
---

# Handoff

Write a concise handoff for a fresh continuation of the current work. Pi's handoff command invokes this skill, writes the document, summarizes the active branch, and automatically continues from the handoff on a new active branch in the same session.

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
- Treat arguments as the next continuation's focus and tailor the handoff to them.
- Keep specs, ADRs, issues, commits, and diffs as the durable sources of truth;
  reference them instead of copying their contents. Do not create `context.md`,
  `plan.md`, `progress.md`, or another checkout artifact just for handoff.
- Handoffs are temporary continuation context. Moja Glava checkpoints are
  durable personal recall artifacts and are a separate workflow; do not use one
  as a substitute for the other.
- Redact API keys, access tokens, passwords, cookies, private URLs, PII, and
  other secrets. Describe their presence or location without copying values.
- Repeating Pi's handoff command is the normal phase loop. Each continuation
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
