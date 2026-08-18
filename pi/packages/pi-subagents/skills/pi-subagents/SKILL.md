---
name: pi-subagents
description: Delegate bounded reconnaissance, research, implementation, or review work while the parent retains decisions and integration.
---

# Pi Subagents

Work directly when delegation costs more than it saves.

The parent remains user-facing and owns decomposition, decisions, approvals,
integration, and final validation. Give children narrow, explicit tasks and
supply only the files or context that materially help.

Use fresh leaf tasks by default. Avoid overlapping ownership and do not turn
children into another planning or decision-making layer.

- `scout` maps local code with read-only tools.
- `researcher` gathers web evidence and local read context without writing.
- `worker` is the only default delegated checkout writer.
- `review` is the shared read-only reviewer for bugs, security, and structure.

Scout and review are mechanically read-only: they have no shell, mutation,
output, progress, or child-delegation path. Researcher is also a leaf and has
no shell or filesystem-write path. Worker is a leaf too; it does not assume
context, plan, or progress artifacts.

Use one delegated writer unless explicitly isolated worktrees make concurrent
writers safe. Scale review count and specialist lenses to the scope and risk:
one reviewer for small local work, more independent lenses only when warranted.

Keep user approval for scope, architecture, external actions, and irreversible
work. A child that encounters an unapproved decision escalates rather than
guessing. Synthesize child results into one coherent response.

See the [package README](../../README.md) for tool schemas, custom agents,
chains, async jobs, worktrees, management, intercom, forks, and troubleshooting.
