# AI Skill Runtime and OpenSrc Fixes — Implementation Spec

**Status:** Ready for implementation
**Type:** Feature plan / refactoring
**Effort:** M
**Date:** 2026-03-14

## Problem Statement

The shared-skill migration left three pieces out of sync:

1. Runtime skill projection documents that Claude overlays win over shared skills, but the installer does not actually replace a shared symlink with an overlay on a normal run.
2. `dot doctor` validates shared and overlay skills independently, so once overlay precedence is fixed it will misreport healthy overlay-backed skills as broken.
3. The shared `opensrc` skill still describes a legacy “clone to `~/.opensrc/` and generate a knowledge base” workflow that no longer matches the installed `opensrc` CLI. The CLI actually fetches source into a local `opensrc/` directory, can optionally update `AGENTS.md`, and supports isolated work via `--cwd`.

These mismatches create the worst kind of failure mode: the docs say one thing, the runtime does another, and health checks disagree with both.

## Discovery

- Explored `ai/install.sh`, `lib/symlink.sh`, `bin/dot-doctor`, `ai/README.md`, `README.md`, `claude/README.md`, `ai/skills/opensrc/SKILL.md`, and `ai/skills/dotfiles-dev/SKILL.md`.
- Verified the installed `opensrc` CLI (`0.1.0`) supports `--modify` and updates `.gitignore`, `opensrc/settings.json`, `opensrc/sources.json`, and `AGENTS.md`.
- Ran a smoke test in `.context/opensrc-smoke/` and confirmed:
  - fetched sources land under a local `opensrc/` tree, not `~/.opensrc/`
  - `AGENTS.md` is updated when `--modify=true`
  - `sources.json` is the authoritative inventory of fetched sources

## Recommendation

Implement one coherent cleanup across runtime behavior, health-check logic, and skill/docs contracts:

- Make overlay precedence real in `ai/install.sh` by explicitly re-linking managed symlinks when a Claude overlay exists for the same skill name.
- Teach `bin/dot-doctor` to validate the single effective source for each skill name instead of checking shared and overlay candidates separately.
- Redesign the shared `opensrc` skill around the actual CLI behavior, with two clear modes:
  - **Project mode**: fetch into the current repo and allow `AGENTS.md`/ignore-file integration when persistent guidance is desirable.
  - **Scratch mode**: fetch into `.context/opensrc/<slug>/` with `--cwd`, so one-off exploration does not pollute the working repo.
- Update top-level docs to describe `opensrc` as “fetch source context for external packages/repos” rather than “clone repo + generate knowledge base.”

This preserves the value of `AGENTS.md` generation where it is genuinely useful, but grounds it in the real `opensrc` workflow instead of a stale promise.

## Scope & Deliverables

| Deliverable | Effort | Depends On |
|-------------|--------|------------|
| D1. Enforce overlay precedence in runtime skill projections | S | - |
| D2. Make `dot doctor` validate effective skill winners | S | D1 |
| D3. Rewrite `opensrc` skill around actual CLI behavior, including project/scratch modes and AGENTS integration | M | - |
| D4. Align README surfaces and skill-authoring guidance with the final behavior | S | D1, D3 |

## Non-Goals

- Reintroducing the deleted `index-knowledge` workflow or its subagent-heavy generation model.
- Modifying the external `opensrc` package itself.
- Migrating more Claude agents or creating new runtime projection layers.
- Expanding `dot doctor` into a full repo-runtime validator beyond the touched AI skill path.

## Data Model

### Skill Projection Winner

For any projected runtime directory and skill name:

```text
effective_source(skill_name) =
  claude/skills/<name>   if overlay exists
  ai/skills/<name>       otherwise
```

Target runtime directories must contain one symlink per skill name, pointing to the effective source.

### OpenSrc Artifacts

When `opensrc` is run in a working directory, the canonical artifacts are:

- `opensrc/settings.json` — file-modification preference cache
- `opensrc/sources.json` — fetched source inventory
- `opensrc/...` — fetched package/repo source tree
- `AGENTS.md` — optional `opensrc`-managed section bracketed by `<!-- opensrc:start -->` / `<!-- opensrc:end -->`

Scratch exploration should use `.context/opensrc/<slug>/` as the working directory when the current repo should remain untouched.

## API / Interface Contract

### Runtime Projection Contract

- `ai/install.sh` must produce deterministic winner-takes-precedence symlinks for `.claude/skills/` and `~/.claude/skills/`.
- Shared skills remain the baseline.
- Overlay skills replace shared symlinks with the same name without requiring `--force`.
- Regular files/directories at runtime targets are still preserved with warnings.

### Health Check Contract

- `bin/dot-doctor` should validate exactly one expected source per skill name.
- If an overlay exists, the expected symlink target is the overlay path.
- If no overlay exists, the expected target is the shared path.

### OpenSrc Skill Contract

The shared skill should instruct the agent to:

1. Choose **project mode** or **scratch mode** based on whether the fetched source should persist in the current repo.
2. Run `opensrc <spec>` or `opensrc --cwd <dir> <spec>`.
3. Use `--modify` when AGENTS/ignore-file integration is desirable, or `--modify=false` when the repo should stay untouched.
4. Treat `opensrc/sources.json` as the inventory of fetched context.
5. Report actual local paths created by the CLI.

## Acceptance Criteria

- [ ] If `ai/skills/foo/` and `claude/skills/foo/` both exist, a normal `dot` run leaves the Claude runtime symlink pointing at `claude/skills/foo/`.
- [ ] `dot doctor` does not warn about a healthy overlay-backed skill because it no longer checks the shared candidate separately.
- [ ] `ai/skills/opensrc/SKILL.md` no longer claims repos are cloned to `~/.opensrc/`.
- [ ] `ai/skills/opensrc/SKILL.md` no longer promises a hand-written AGENTS knowledge base; it documents the real `opensrc` CLI outputs and optional `AGENTS.md` integration.
- [ ] README surfaces that list skills describe `opensrc` consistently with the new contract.
- [ ] Claude skill authoring guidance clearly distinguishes shared skills from Claude-only overlays.

## Test Strategy

| Layer | What | How |
|-------|------|-----|
| Shell smoke | Overlay precedence | Create temporary shared/overlay skill dirs, run projection logic, assert winning symlink target |
| Shell smoke | `dot doctor` winner logic | Simulate overlay collision and confirm doctor expects the overlay path |
| CLI smoke | `opensrc` behavior | Run `opensrc --cwd <scratch> <small-package> --modify=true` and inspect `AGENTS.md` + `opensrc/sources.json` |
| Docs review | Contract consistency | Search repo for stale `~/.opensrc/`, “generate knowledge base,” and outdated skill-creation wording |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Overlay fix accidentally overwrites non-managed files | Low | Medium | Only auto-replace symlinks; preserve regular files/directories with warnings |
| `dot doctor` logic drifts from installer logic again | Medium | Medium | Share the same winner rule in code structure and validate with a collision smoke test |
| `opensrc` docs become package-version-specific | Medium | Low | Document stable behaviors verified locally (`--cwd`, `--modify`, `sources.json`, AGENTS section markers) |
| Scratch mode path feels too opinionated | Low | Low | Frame `.context/opensrc/<slug>/` as the repo convention, not a CLI requirement |

## Trade-offs Made

| Chose | Over | Because |
|-------|------|---------|
| Keep `AGENTS.md` integration in `opensrc` docs | Removing AGENTS integration entirely | The installed CLI already supports it well and it is genuinely useful for persistent agent context |
| CLI-first `opensrc` skill guidance | MCP-specific workflow | Shared skills must work across runtimes that may not expose the same MCP tool surface |
| Minimal installer/doctor changes | Broad shared symlink utility refactor | The bug is isolated to AI skill projection precedence |

## Open Questions

- [ ] None blocking. If future runtimes need overlay precedence outside Claude, extend the same winner rule there. → Owner: repo maintainer

## Success Metrics

- `dot` and `dot doctor` agree on which skill source wins.
- `opensrc` documentation matches a real smoke-tested CLI run.
- No repository docs continue advertising the removed “`~/.opensrc/` knowledge base” model.
