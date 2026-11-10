# AI tools configuration

Dotfiles owns machine configuration and shared instruction assembly. Portable
skills now have a separate canonical repository: `~/Code/mu-stack`.

## Ownership and reading map

| Task | Owner / read first |
|---|---|
| Portable skill authoring, provenance, installation | `~/Code/mu-stack/README.md`, then `skills/<name>/SKILL.md` |
| Machine-owned skills | `ai/skills/apple-reminders/`, `ai/skills/dotfiles-dev/` |
| Shared instruction policy | `ai/instructions/base.md` |
| Instruction assembly and local skill projections | `ai/install.sh`, `ai/test-install.sh` |
| Upstream comparisons and adoption decisions | Canonical method: `~/Code/mu-stack/maintenance/upstream-review.md`; [dotfiles tooling](maintenance/upstream-review.md) |
| Claude settings, hooks, MCP | [Claude README](../claude/README.md) |
| Pi resources, models, MCP, delegation | [Pi README](../pi/README.md) |

Specs and progress notes describe historical decisions, not active source paths
or permission to implement, install, or deploy.

## Skill ownership

`mu-stack/skills/` owns the extracted portable skills, including their supporting
scripts, licenses, and provenance. `apple-reminders` and `dotfiles-dev` remain
here because they describe this machine's setup. mu-stack owns the canonical
review method in `maintenance/upstream-review.md`, outside distributed skills.
Dotfiles keeps only its watchlist/tooling adapter in `ai/maintenance/upstream-review.md`. `mono-color`
remains removed. `~/skills/tldraw-offline` remains separately owned and configured.

Edit the canonical source once. Runtime links and `.ai-runtime/` are generated
outputs, not authoring locations. `dot skills` synchronizes the canonical
mu-stack repository; it does not import changes from third-party skill sources.
There is no capability profile or second maintained copy of a skill.

### Discovery and installation

- Pi consumes mu-stack as an explicit skills-only local package.
- mu-stack's explicit installer links its canonical directories into
  `~/.claude/skills/` and `~/.agents/skills/` for Claude Code and Codex.
- Pi also discovers `~/.agents/skills/`. Canonical symlinks let it identify the
  same real source rather than receiving provider-specific duplicate copies.
- Dotfiles keeps projection support for its 2 machine-owned skills and optional
  Claude-native overlays in `claude/skills/`.
- Existing managed links to extracted projections are retired by the owning
  installer. Foreign files and links must be preserved, not replaced by name.

See mu-stack's README for current official discovery sources and installation
commands. Dotfiles owns checkout bootstrap/update through `mu-stack/install.sh`;
`dot skills` runs that same topic entry point without unrelated machine updates.
The full installer runs AI retirement cleanup, then mu-stack, then dependent
Claude/OpenCode/Pi setup. See [safety and recovery](../mu-stack/README.md).
For the initial extraction cutover, run `ai/install.sh` before `dot skills` to
remove exact old managed links. Foreign collisions always require manual review.
OpenCode's old extracted projections are retired; mu-stack currently documents
Pi, Claude Code, and Codex installation only.

### Authoring

Use standard `SKILL.md` frontmatter (`name`, `description`) and skill-relative
references. Manual-only skills retain `disable-model-invocation: true`. Pi and Claude honor
that marker; mu-stack documents the existing Codex invocation-policy limitation. Read mu-stack's
`skills/writing-for-agents/SKILL.md` for requested agent-document authoring.
Harness-native runtime features belong in the harness adapter, not a portable
skill. Supporting references stay with their owning skill.

The optional coding-standards source material moved to
`mu-stack/skills/project-guidance/references/coding-standards/`. It is not an
installed skill or global policy. Project-owned guidance remains authoritative.
[Project defaults](references/project-defaults.md) remain here as local preferences
for new projects or explicitly approved modernization.

## Shared instructions

Instruction policy is unchanged by the extraction:

| Installed file | Composition |
|---|---|
| `~/.claude/CLAUDE.md` | `ai/instructions/base.md` |
| `.ai-runtime/pi/AGENTS.md` | Base + `pi/instructions/appendix.md` |
| `~/.pi/agent/AGENTS.md` | Link to the generated Pi instruction file |
| `~/.config/opencode/AGENTS.md` | Base |
| `~/.codex/instructions.md` | Base |
| `~/.gemini/GEMINI.md` | Base |
| `~/.AGENTS.md` | Base compatibility output |

Global instructions own conduct and safety; repository instructions own
engineering decisions. Specialist skills operate within those decisions.
No custom advisors, researchers, or review personas are shipped. Agents and
chains remain harness/user-owned. Narrow cleanup of exact retired managed agents
preserves user-owned definitions.

## Upstream provenance

`metadata.watch-sources` and adjacent `VENDORED_FROM.md` files stay with each
canonical artifact. Adopt only explicitly reviewed snapshots or justified local
adaptations. Preserve licenses. Never automatically synchronize upstream content.

`ai/watchlist.toml` and `bin/ai-watch` remain optional dotfiles maintenance tools.
The watchlist can retain research interests in extracted skills, but the scanner
only inventories dotfiles; inspect mu-stack directly for its local provenance.
Read [the dotfiles adapter](maintenance/upstream-review.md) for inventory commands
and its pointer to mu-stack’s canonical review method.
Historical adoption records remain in `specs/` and Git history; their old paths
are historical references.

## Apply and validate

Apply only the owning installer, not the full `dot` updater:

```sh
sh ai/test-install.sh
~/.dotfiles/ai/install.sh
```

Use `dot skills` for the scoped checkout update and Claude/Codex installation.
Use mu-stack's README for standalone installation without a Git update and its tests.
Validate dotfiles update orchestration with `node --test mu-stack/test-update.mjs`.
Pi integration changes use `pi/install.sh` after its isolated tests pass.
Documentation-only changes need no installation. Native discovery checks live in
`pi/test-native-skills.mjs`; they require the installed Pi host. Structural and
loader checks do not prove model behavior.
