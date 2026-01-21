# Dotfiles Repository

Topic-centric dotfiles (Holman-style). Manages macOS dev environment.

## Quick Reference

- `script/bootstrap` - initial setup, symlinks
- `script/install` - run all installers
- `bin/dot` - update everything

## Development

Use the `dotfiles-dev` skill for detailed guidance on:
- Adding topics, skills, configurations
- File patterns and conventions
- Custom git commands

## Claude Code Capabilities

**Safety Hook**: PreToolUse hook intercepts `rm -rf/-r/-f` commands and rewrites to `trash` (macOS built-in). User confirms the modified command.

**MCP Servers**:
- Linear - project management via OAuth (auth on first use)

**Skills**:
- `remotion-best-practices` - Remotion video creation guidance

## Secrets

Never commit: `~/.localrc`, `~/.gitconfig.local`
