---
name: opensrc
description: Fetch source context for external packages and repositories. Use when you need implementation details beyond docs or types, or want a local source snapshot for a dependency or GitHub repo. Supports project mode and scratch mode via `--cwd`, and can optionally update `AGENTS.md`.
---

# OpenSrc

Fetch real source code into a local `opensrc/` directory so you can inspect implementation details, not just docs and type signatures.

## Use When

- A library's public API is not enough and you need to see internals
- You want to compare implementations across packages or repositories
- You want persistent local source context for future AI sessions
- You need a quick scratch setup for exploring an external repo without polluting the current project

## Choose a Mode

### Project Mode

Use the current repo root when the fetched source should stay attached to this project.

Good fit for:
- app dependencies already used by the repo
- libraries the team will revisit often
- projects where updating `AGENTS.md` with source-context guidance is useful

### Scratch Mode

Use a scratch directory under `.context/opensrc/<slug>/` for one-off exploration or when the current repo should stay clean.

Good fit for:
- evaluating an unfamiliar external repo
- comparing libraries before choosing one
- investigations where the fetched source should not modify the main workspace

## Workflow

### 1. Pick the Working Directory

- **Project mode:** current repo root
- **Scratch mode:** `.context/opensrc/<slug>/`

Create the scratch directory first if needed.

### 2. Fetch the Source

Prefer the installed `opensrc` CLI when available. Fall back to `npx opensrc` if needed.

```bash
opensrc zod
opensrc pypi:requests
opensrc crates:serde
opensrc vercel/ai
opensrc https://github.com/vercel/ai

opensrc --cwd .context/opensrc/vercel-ai vercel/ai --modify=false
```

### 3. Decide Whether File Modifications Are Allowed

`opensrc` can update these files in the chosen working directory:

- `.gitignore`
- `tsconfig.json`
- `AGENTS.md`

Guidance:

- Use `--modify` when persistent source-context guidance is helpful.
- Use `--modify=false` when the user does not want repo docs/config touched.
- In scratch mode, `--modify` is usually fine because the changes stay inside the scratch directory.
- If you omit `--modify`, `opensrc` may prompt the user on first run.

### 4. Inspect the Artifacts

After a successful fetch, inspect these paths in the chosen working directory:

- `opensrc/sources.json` — fetched source inventory
- `opensrc/settings.json` — saved modification preference
- `opensrc/...` — fetched source tree
- `AGENTS.md` — only if modifications were allowed

Treat `opensrc/sources.json` as the source of truth for what was fetched and where it lives. Do not guess the final source path when the file already records it.

### 5. Explore and Summarize

Once the source is present:

- inspect the tree and key entry points
- grep for the subsystem the user cares about
- read the implementation files that answer the question
- hand off to `librarian` for deeper architecture analysis if helpful

## Return Summary

Use a summary shaped like this:

```markdown
Fetched source context for `<spec>`.

Working directory:
- `<cwd>`

Artifacts:
- `opensrc/sources.json`
- `opensrc/settings.json` (if created)
- `<actual fetched path from sources.json>`
- `AGENTS.md` (only if updated)

Key findings:
- <notable implementation detail>
- <entry point or internal pattern>
- <follow-up area worth reading>
```

## Guardrails

- Do not claim the source was written to `~/.opensrc/`.
- Do not claim `AGENTS.md` was updated unless it actually exists or the CLI reported success.
- Do not hand-write an `opensrc` section into `AGENTS.md`; let the CLI manage its own markers.
- Prefer scratch mode for exploratory work when the user has not asked for persistent repo changes.

## Notes

- `opensrc` works for npm packages, PyPI packages, crates.io crates, and public GitHub repos.
- The fetched source layout can vary by source type; use `opensrc/sources.json` instead of assuming a hard-coded path shape.
- Re-running the command updates the fetched source to the current requested version or ref.
