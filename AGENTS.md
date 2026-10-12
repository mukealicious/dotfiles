# Dotfiles Repository

Topic-centric dotfiles for a macOS development environment.

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
| Pi settings, resources, or extensions | Read [pi/README.md](pi/README.md) |
| Claude settings, hooks, MCP, or advisors | Read [claude/README.md](claude/README.md) |

Read [ai/README.md](ai/README.md) before changing skill projections, instruction
assembly, agent definitions, or upstream provenance. Use the `dotfiles-dev` skill
for topic setup and custom Git commands; read its
[file patterns](ai/skills/dotfiles-dev/references/file-patterns.md) before changing
shell scripts or symlink behavior.

## Ownership Model

Keep changes in the narrowest layer that owns them; one owner per configuration area:

- `[topic]/install.sh` — idempotent topic-specific setup
- `script/install` — installer ordering, discovery, skip behavior, and argument forwarding
- `bin/dot` — top-level update workflow and pre/post sequencing
- `bin/dot-doctor` — read-only diagnostics and actionable fix hints

Foundational installers are listed in `script/install`'s `CORE_INSTALLERS`;
remaining installers are discovered in sorted order. Change orchestration only
for a real ordering dependency. When `bin/dot` handles a topic directly, keep
its `script/install --skip` usage in sync.

Reuse `lib/log.sh` and `lib/symlink.sh`. Validate symlink targets, handle missing,
correct, broken, and misdirected links, and clean dead links before replacement.
Preserve conflicting user content; use the helper's explicit `--force` backup path
when replacement is authorized. Avoid `find | while` for order-dependent operations.

Apply local changes with the owning installer or `script/symlink`, rather than
the full `dot` updater. Documentation-only edits need no installation.

## Toolchain Boundaries

- Homebrew owns system/native CLIs and apps.
- `uv.reqs` owns Python CLIs.
- `mise.toml` and `mise.lock` own Node, pnpm, Bun, and ordinary versioned JS CLIs.
- `mise/node-globals.reqs` owns npm CLIs with native dependencies or Node ABI sensitivity.
- `pnpm/config.yaml` owns global pnpm policy.
- `bin/yarn` is the narrow Corepack compatibility path for Yarn repositories.
- `bin/` owns behavior wrappers that should win on `PATH`.

Existing repositories keep their declared package manager and lockfile; new or
unmarked repositories default to pnpm.

## Shell Installers

Topic installers use `#!/bin/sh` and `set -e`. The file-patterns reference owns
the root-resolution template, safe glob iteration, failure handling, and
`--force` convention.

## Generated and Runtime Files

- Edit installer-managed configuration in this repository, not its installed
  outputs under `~/.claude/`, `~/.pi/`, `~/.codex/`, or `~/.config/opencode/`.
  Machine-local credentials and native preferences remain runtime-owned.
- Author shared skills in `ai/skills/`; `.agents/skills/`, `.claude/skills/`, and
  `.ai-runtime/` are installer-managed projections.
- `ai/install.sh` owns shared instructions, projected skills, and assembled agents.
- `claude/install.sh` owns Claude settings and MCP setup.
- `pi/install.sh` owns Pi startup settings, resource links, and packages.
- Never commit `~/.localrc`, `~/.gitconfig.local`, or `.env*` files.
