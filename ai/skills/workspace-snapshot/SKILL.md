---
name: workspace-snapshot
description: Gather a quick orientation snapshot of the current workspace before making changes. Use when the user asks for a repo overview, a handoff check, the current working state, or a brief summary of what files and docs matter first.
---

# Workspace Snapshot

Start with the cheapest useful orientation pass before editing files.

## Quick Pass

1. Confirm the working directory with `pwd`.
2. Check local changes with `git status --short`.
3. List likely entry points with `rg --files` or a targeted `find`.
4. Read the smallest set of docs or config files that explain the task.
5. Summarize the workspace in a few bullets before making changes.

## Guidelines

- Prefer `rg` over slower recursive searches.
- Read handoff or sprint docs before broader exploration when the task starts from one.
- Avoid broad builds, tests, or installs during the initial snapshot unless the user asked for them.
- Call out existing uncommitted changes before touching files.
- Keep the first summary short: what the repo is, what changed, and what files likely matter next.

This skill is intentionally small and instruction-only. Add scripts or references only if repeated use proves they are necessary.
