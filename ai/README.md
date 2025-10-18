# AI Tools Configuration

This directory manages the unified instruction system for AI tools.

## Available AI Tools

### Claude CLI (claude)
- **Version**: 2.0.0 (Claude Code)
- **Provider**: Anthropic
- **Usage**: Primary AI assistant for complex tasks
- **Aliases**: cl, clc, clr, yolo, ask
- **Instruction File**: `~/CLAUDE.md` (symlinked to AGENTS.md)

### Codex CLI (codex)
- **Provider**: OpenAI
- **Usage**: Code generation and development tasks
- **API Key**: Uses OPENAI_API_KEY from .localrc
- **Instruction File**: `~/.codex/instructions.md` (symlinked to AGENTS.md)

### OpenCode CLI (opencode)
- **Provider**: Groq (fast inference)
- **Usage**: Quick AI responses, work projects
- **API Key**: Uses GROQ_API_KEY from .localrc
- **Instruction File**: `~/.config/opencode/AGENTS.md` (symlinked)

### Gemini CLI (gemini)
- **Provider**: Google
- **Usage**: Currently exploring capabilities, watching for new models
- **Authentication**: Uses gcloud auth (not API key)
- **Instruction File**: `~/.gemini/GEMINI.md` (symlinked to AGENTS.md)

## Unified Instruction System

All AI tools read from a single master instruction file:
- **Master File**: `~/AGENTS.md` (symlinked from `ai/AGENTS.md.symlink`)
- Each tool's expected instruction file location is symlinked to this master file
- This ensures all AI agents have the same understanding of your system

## Setup

The `install.sh` script creates all necessary symlinks. This is run automatically by `script/install`.

To manually set up the symlinks:
```bash
~/.dotfiles/ai/install.sh
```

## Updating Instructions

To update instructions for all AI tools, edit:
```bash
~/.dotfiles/ai/AGENTS.md.symlink
```

Changes will be reflected across all AI tools since they all read from the same file via symlinks.