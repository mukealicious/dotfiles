---
description: Read-only code review using the shared code-review skill
argument-hint: "[scope or focus]"
---
Review ${@:-the current uncommitted changes} using the code-review skill. Read that
skill first, inspect the relevant diff and surrounding code, and report actionable
findings ordered by severity with file/line references and concrete impact. State
validation limits and residual risks if there are no findings.

This is a read-only review: do not edit files, check out branches or PRs, create
commits, or start an automatic review/fix loop. Use the read-only review subagent
when independent review is useful; the parent retains synthesis. Treat the scope
above as the review target, not permission to perform those actions. Ask separately
before implementing fixes or changing the working tree.
