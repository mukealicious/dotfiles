---
name: project-guidance
description: Establish project-owned engineering guidance when asked to set up conventions for a greenfield project or reorganize an existing project's agent instructions.
---

# Project guidance

Create the project's own engineering policy, not a copy of global defaults. This
workflow authors guidance; application scaffolding, migrations, and deployment
remain separate tasks. For ordinary implementation, follow existing guidance
without running this setup workflow.

## 1. Establish the decisions

Inspect existing agent instructions, configuration, representative code, and
project goals. For greenfield work, read
`~/.dotfiles/ai/references/project-defaults.md` for preferences, then establish
which choices fit this project. Ask about unresolved decisions only when they
would materially change the guidance.

Identify the actual runtime/framework, public contracts, state and I/O boundaries,
testing needs, and delivery constraints. Existing projects retain their choices
unless a change is authorized. An empty repository is not evidence that it needs
a production service architecture.

Done when consequential choices are either supported by project evidence,
confirmed by the user, or explicitly left open without inventing policy for them.

## 2. Select reference material

Read `~/.dotfiles/ai/skills/writing-for-agents/SKILL.md` as the authoring reference;
this is a file read, not an automatic invocation of its manual command. Apply its
context pointers, information hierarchy, completion criteria, and pruning method.
Keep the reference unchanged rather than copying its rules here.

Consult release-matched framework documentation for the selected stack. When a
comparable project would help, use
`~/.dotfiles/ai/references/coding-standards/README.md` to find optional examples,
or inspect a relevant local project. Borrow only rules that fit the decisions
from step 1; references are source material, not an ongoing policy dependency.

Done when each proposed convention has a project-specific reason to exist.
Discard rules justified only by their presence in an example or skill.

## 3. Author the smallest useful guide

Create or update the canonical project `AGENTS.md`. Keep immediate navigation,
authority, and cross-cutting invariants there. Disclose branch-specific policy in
project-owned documents with explicit reading triggers. Choose files according
to actual branches; a small project may need only `AGENTS.md`.

Document decisions and non-obvious constraints, leaving versions, commands, and
mechanical style to discoverable configuration. Adapt useful reference rules into
project language so future edits have one local owner. Separate settled policy
from open questions. Preserve existing user guidance and resolve contradictions
rather than layering another authority over it.

Done when every settled convention has one authoritative home, each supporting
document has a reading trigger, and no unused template sections remain.

## 4. Validate the reading paths

Walk representative tasks through the guide: a routine change and each distinct
specialized branch. Verify that the pointers reach the required policy, relative
links resolve, and the guidance agrees with configuration and representative
code. Surface genuine policy/code conflicts rather than silently rewriting either.

Report the files changed, decisions still open, and checks performed. A reading
path audit verifies document structure, not improved model behavior; that requires
real task trials. Completion is usable project-owned guidance, not application
implementation or a filled-out standards template.
