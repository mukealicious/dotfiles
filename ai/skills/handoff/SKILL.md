---
name: handoff
description: Compact the current conversation into a temporary handoff document for another agent to continue. Use when explicitly handing work to a fresh session or recording the next unfinished step.
argument-hint: "What will the next session be used for?"
disable-model-invocation: true
user-invocable: true
metadata:
  watch-sources: dmmulroy/.dotfiles/home/.agents/skills/handoff@f9f7aa1a3638d6bfb6fa0b94fd110185534a2895
---

# Handoff

Write a concise handoff for a fresh agent to continue the current work. The Pi handoff command invokes this skill, writes the document, summarizes the
source branch, and continues from the handoff on the new branch.

- Save the document in the user's OS temporary directory, never in the checkout
  or a project runtime directory. Include its exact absolute path in the
  document so the continuation can open it.
- Record the current branch and commit, relevant durable artifact paths, changed
  areas, validation results, known failures, the next unfinished step, recovery
  information, and a **Suggested skills** section tailored to that next step.
- Treat arguments as the next session's focus and tailor the handoff to them.
- Keep specs, ADRs, issues, commits, and diffs as the durable sources of truth;
  reference them instead of copying their contents. Do not create `context.md`,
  `plan.md`, `progress.md`, or another checkout artifact just for handoff.
- Handoffs are temporary continuation context. Moja Glava checkpoints are
  durable personal recall artifacts and are a separate workflow; do not use one
  as a substitute for the other.
- Redact API keys, access tokens, passwords, cookies, private URLs, PII, and
  other secrets. Describe their presence or location without copying values.
- Explain how to recover: identify the source session/tree branch and its next
  step, point to the temporary artifact and durable references, and state what
  remains safe to retry. If writing, navigation, or continuation fails, retain
  the existing artifact and old branch and report the failure honestly rather
  than claiming a successful handoff.

Do not duplicate content already captured in durable artifacts. A handoff should
make continuation possible, not become a second plan or project record.
