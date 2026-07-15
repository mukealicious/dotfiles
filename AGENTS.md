# Dotfiles Repository

Topic-centric dotfiles for a macOS development environment.

## Commands

- `script/bootstrap` — initial setup and symlinks
- `script/install` — run all installers
- `bin/dot` — update everything
- `bin/dot doctor` — check environment health

## Where to Look

| Task | Start here |
|---|---|
| Shell alias or abbreviation | `[topic]/aliases.fish` |
| Fish function or config | `fish/functions/`, `fish/config.fish`, `fish/conf.d/` |
| Homebrew package | `Brewfile` |
| Versioned JS CLI | `mise.toml` (`npm:<package>`) |
| Native-sensitive Node CLI | `mise/node-globals.reqs` |
| JS runtime/package-manager policy | `mise.toml`, `mise.lock`, `pnpm/config.yaml` |
| Python CLI | `uv.reqs` |
| New topic or tool | `[topic]/`, usually with `install.sh` |
| Custom git command | `bin/git-<name>` |
| Git config | `git/gitconfig.symlink` |
| Stream Deck layout/button | `streamdeck/layouts/`, `streamdeck/bin/sync-profile` |
| Shared AI instruction | `ai/instructions/base.md` |
| Shared AI skill | `ai/skills/[name]/SKILL.md` |
| Pi config or extension | `pi/`; see `pi/README.md` |
| Claude-specific config | `claude/`; see `claude/README.md` |
| AI capability architecture | `ai/README.md` |

Use the `dotfiles-dev` skill for detailed file patterns, topic setup, skills, and custom git commands.

## Ownership Model

Keep changes in the narrowest layer that owns them:

- `[topic]/install.sh` — idempotent topic-specific setup; default home for install logic
- `script/install` — installer orchestration, ordering, skip behavior, and argument forwarding
- `bin/dot` — top-level update workflow specific to `dot`
- `bin/dot-doctor` — diagnostics and actionable fix hints

Foundational installers are listed in `script/install`'s `CORE_INSTALLERS`; remaining installers are discovered in sorted order. Update orchestration only when a new installer has a real ordering dependency.

Reuse `lib/log.sh` and `lib/symlink.sh`. A single script should own each configuration area, and symlink logic must handle missing, correct, broken, and misdirected links.

## Toolchain Boundaries

- Homebrew owns system/native CLIs and apps.
- `uv.reqs` owns Python CLIs.
- `mise.toml` and `mise.lock` own Node, pnpm, Bun, and ordinary versioned JS CLIs.
- `mise/node-globals.reqs` owns npm CLIs with native dependencies or Node ABI sensitivity.
- `pnpm/config.yaml` owns global pnpm policy.
- `bin/yarn` is the narrow Corepack compatibility path for Yarn repositories.
- `bin/` owns behavior wrappers that should win on `PATH`.

Existing repositories keep their declared package manager and lockfile; new or unmarked repositories default to pnpm.

## Shell Installers

Installer scripts use `#!/bin/sh` and `set -e`. Resolve the repository root with:

```sh
DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
```

Use `[ -e "$file" ] || continue` for safe glob iteration and provide `--force` when an installer needs to correct existing misconfiguration.

## Generated and Runtime Files

- Edit source files in this repository, not installed outputs under `~/.claude/`, `~/.pi/`, `~/.codex/`, or `~/.config/opencode/`.
- Author shared skills in `ai/skills/`; `.agents/skills/`, `.claude/skills/`, and `.ai-runtime/` are installer-managed projections.
- `ai/install.sh` owns shared AI instructions, projected skills, and assembled agents.
- `claude/install.sh` owns Claude settings and hooks.
- `pi/install.sh` owns Pi profiles, settings, themes, extensions, and packages.

## Guardrails

- Do not put topic-specific behavior in `script/install` or `bin/dot` unless orchestration requires it.
- Do not create overlapping owners for the same config directory.
- Validate symlink targets and clean dead symlinks before creating replacements.
- Avoid `find | while` for order-dependent operations.
- Never commit `~/.localrc`, `~/.gitconfig.local`, or `.env*` files.
