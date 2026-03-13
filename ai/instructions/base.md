# AI Agent Instructions

## Working Style

- Be concise and direct.
- Prefer surgical changes over broad rewrites.
- Follow repo-local instruction files such as `AGENTS.md` or `CLAUDE.md` when they appear.
- For multi-step work, keep an explicit plan and surface unresolved questions at the end.
- For durable artifacts such as PRs, handoffs, and architecture docs, prefer high-density text-native structure over long prose when it improves comprehension: use tables, compact Mermaid or ASCII diagrams, before/after blocks, and review maps. Prefer layouts that fit comfortably in GitHub-style markdown widths; if a Mermaid graph becomes wide or clunky, switch to a narrower table or ASCII form. Prefer text-native diagrams over screenshots so both humans and agents can parse them.

## System

- macOS (Darwin), Fish shell, VSCode (experimenting with Cursor)
- WezTerm terminal, AeroSpace window manager
- Dotfiles: topic-based (Holman-style) in `~/.dotfiles`

## CLI Tools

- `git`, `gh`, `docker`, `jq`, `httpie`
- `op` - 1Password CLI for secrets
- `brew`, `asdf`, `bun`, `uv`
- `sg` (ast-grep) - structural code search/rewrite
- `z` (zoxide) - smart cd with frecency ranking
- `fd` - modern find replacement
- `shellcheck` - shell script linter
- `just` - simple command runner
- `agent-browser` - headless browser automation for AI agents

Databases: PostgreSQL 17, Redis

## Runtime Management

- **Node.js**: managed by asdf (`node`, `npm` just work)
- **Python**: always use `uv` — see `/uv` skill for details

## Key Commands

- `dot` - update dotfiles (Homebrew, installers, defaults)
- `dot -e` - edit dotfiles in editor

## Secrets

Never commit:
- `~/.localrc` - private env vars, API keys
- `~/.gitconfig.local` - private git config

## Notes

- Check for `.envrc` in projects (direnv)
- Custom git commands in `~/.dotfiles/bin/`
