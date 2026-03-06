# Plan: Harness-Aware Subagent Models

> **Status**: Planning only — not yet implemented.

## Context

Anthropic discourages using Max plan via third-party harnesses (Pi, OpenCode). Currently Pi uses `anthropic/claude-opus-4-6` and would spawn Anthropic subagents. User wants Pi and OpenCode to use OpenAI models instead, keeping Claude Code on Anthropic.

Additionally, agent prompt bodies are duplicated across harnesses when they should be shared. This plan introduces a shared agents directory with harness-specific frontmatter assembly.

## Architecture: Shared Bodies + Harness Frontmatter

```
ai/agents/                        # NEW - shared prompt bodies (no frontmatter)
  oracle.body.md
  librarian.body.md
  review.body.md

claude/agents/                    # Existing dir, files change from .md to .frontmatter
  oracle.frontmatter              # model: opus, tools: Read, Grep, Glob, WebFetch, LSP
  librarian.frontmatter           # model: sonnet, tools: Read, Grep, Glob, WebFetch, Bash
  review.frontmatter              # model: sonnet, tools: Read, Grep, Glob, WebFetch

pi/agents/                        # NEW
  oracle.frontmatter              # model: openai/gpt-5.4, tools: read, bash
  librarian.frontmatter           # model: openai/gpt-5.4, tools: read, bash
  review.frontmatter              # model: openai/gpt-5.4, tools: read, bash
```

**Install-time assembly**: `cat frontmatter body > destination` — no intermediate files in repo, no symlinks for agents.

## Steps

### 1. Create `ai/agents/` with shared prompt bodies

Extract prompt content (everything after frontmatter `---`) from each existing `claude/agents/*.md` into `ai/agents/*.body.md`.

Files to create:
- `ai/agents/oracle.body.md` — from `claude/agents/oracle.md` lines 7-78
- `ai/agents/librarian.body.md` — from `claude/agents/librarian.md` lines 8-82
- `ai/agents/review.body.md` — from `claude/agents/review.md` lines 8-50

### 2. Create frontmatter files for Claude Code

Convert existing `claude/agents/*.md` into `claude/agents/*.frontmatter` (just the YAML block).

- `claude/agents/oracle.frontmatter` — model: opus, tools: Read, Grep, Glob, WebFetch, LSP
- `claude/agents/librarian.frontmatter` — model: sonnet, tools: Read, Grep, Glob, WebFetch, Bash + disallowedTools: Edit, Write
- `claude/agents/review.frontmatter` — model: sonnet, tools: Read, Grep, Glob, WebFetch + disallowedTools: Edit, Write

### 3. Create `pi/agents/` with OpenAI frontmatter

- `pi/agents/oracle.frontmatter` — model: openai/gpt-5.4, tools: read, bash, thinking: high
- `pi/agents/librarian.frontmatter` — model: openai/gpt-5.4, tools: read, bash, thinking: medium
- `pi/agents/review.frontmatter` — model: openai/gpt-5.4, tools: read, bash, thinking: medium

### 4. Remove old `claude/agents/*.md` from git

Delete the original combined files — they'll be assembled at install time.

### 5. Add `assemble_agents` helper to `ai/install.sh`

```sh
# Assemble agent: concatenate frontmatter + shared body -> destination
assemble_agent() {
  frontmatter="$1"
  body="$2"
  output="$3"
  cat "$frontmatter" "$body" > "$output"
}
```

### 6. Update Claude agent section in `ai/install.sh`

Replace the current symlink loop (lines 186-197) with assembly logic:

```sh
SHARED_AGENTS="$DOTFILES_ROOT/ai/agents"
CLAUDE_FM="$DOTFILES_ROOT/claude/agents"
CLAUDE_DEST="$HOME/.claude/agents"

mkdir -p "$CLAUDE_DEST"
for body in "$SHARED_AGENTS"/*.body.md; do
  [ -e "$body" ] || continue
  name=$(basename "$body" .body.md)
  fm="$CLAUDE_FM/${name}.frontmatter"
  [ -e "$fm" ] || continue
  assemble_agent "$fm" "$body" "$CLAUDE_DEST/${name}.md"
done
```

### 7. Add Pi agent assembly to `pi/install.sh`

Source the `assemble_agent` function (or inline it) and add:

```sh
SHARED_AGENTS="$DOTFILES_ROOT/ai/agents"
PI_FM="$DOTFILES_ROOT/pi/agents"
PI_AGENTS_DEST="$HOME/.pi/agent/agents"

mkdir -p "$PI_AGENTS_DEST"
for body in "$SHARED_AGENTS"/*.body.md; do
  [ -e "$body" ] || continue
  name=$(basename "$body" .body.md)
  fm="$PI_FM/${name}.frontmatter"
  [ -e "$fm" ] || continue
  assemble_agent "$fm" "$body" "$PI_AGENTS_DEST/${name}.md"
done
```

### 8. Switch Pi main model to OpenAI

In `pi/settings.json`, change:
```json
"model": "anthropic/claude-opus-4-6"
```
to:
```json
"model": "openai/gpt-5.4"
```

### 9. Update documentation

- `pi/README.md` — add agents section, update model from Claude to GPT-5.4
- `ai/README.md` — document `ai/agents/` shared directory and assembly pattern
- `CLAUDE.md` — update subagent table to note Pi uses OpenAI models

### 10. OpenCode agents — deferred

OpenCode already uses OpenAI provider but has no agent support wired up. When ready, add `opencode/agents/*.frontmatter` following the same pattern. The `ai/install.sh` cleanup block (lines 222-241) stays as-is for now.

## Librarian skill instruction

The librarian body ends with "Use the Skill tool with name 'librarian'". This is Claude-specific but harmless on Pi (tool doesn't exist, instruction ignored). Keep it in the shared body for simplicity.

## Critical Files

| File | Action |
|------|--------|
| `ai/agents/oracle.body.md` | Create (extract from claude/agents/oracle.md) |
| `ai/agents/librarian.body.md` | Create (extract from claude/agents/librarian.md) |
| `ai/agents/review.body.md` | Create (extract from claude/agents/review.md) |
| `claude/agents/oracle.frontmatter` | Create (extract frontmatter) |
| `claude/agents/librarian.frontmatter` | Create (extract frontmatter) |
| `claude/agents/review.frontmatter` | Create (extract frontmatter) |
| `claude/agents/oracle.md` | Delete (assembled at install time) |
| `claude/agents/librarian.md` | Delete (assembled at install time) |
| `claude/agents/review.md` | Delete (assembled at install time) |
| `pi/agents/oracle.frontmatter` | Create |
| `pi/agents/librarian.frontmatter` | Create |
| `pi/agents/review.frontmatter` | Create |
| `pi/settings.json` | Edit model field |
| `ai/install.sh` | Edit: add assemble_agent, replace symlink loop |
| `pi/install.sh` | Edit: add agent assembly section |
| `pi/README.md` | Edit: add agents section, update model |
| `ai/README.md` | Edit: document shared agents |
| `CLAUDE.md` | Edit: update subagent table |

## Reusable utilities

- `ensure_symlink` in `ai/install.sh` (lines 28-70) — not needed for agents anymore (direct write), but still used for skills
- `clean_dead_symlinks` in `ai/install.sh` (lines 72-82) — use to clean old agent symlinks before writing assembled files

## Verification

1. Run `~/.dotfiles/ai/install.sh` — verify `~/.claude/agents/*.md` are assembled correctly with Anthropic models
2. Run `~/.dotfiles/pi/install.sh` — verify `~/.pi/agent/agents/*.md` are assembled correctly with OpenAI models
3. `diff` assembled Claude agents against current `~/.claude/agents/*.md` backup — content should be identical
4. Open Pi, verify `openai/gpt-5.4` is the main model and subagents are available
5. Open Claude Code, verify oracle/librarian/review agents still work with Anthropic models
6. Run `bin/dot` to verify full install pipeline works

## Unresolved

- Exact Pi tool names for subagents (need to verify: `read, bash` or `read, grep, find, ls, bash`?)
- Whether Pi frontmatter supports `thinking:` field — needs verification against pi-subagents docs
- Model cost: gpt-5.4 for all 3 agents might be expensive for librarian/review. Can downgrade later.
