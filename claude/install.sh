#!/bin/sh
#
# Claude Code Configuration
#
# Sets up Claude-specific config: settings.json and plugins.
# Skills and agents are managed by ai/install.sh (single source of truth).

set -e

echo "  Setting up Claude Code configuration..."

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"

# Create ~/.claude directory if it doesn't exist
if [ ! -d "$HOME/.claude" ]; then
  echo "  Creating ~/.claude directory"
  mkdir -p "$HOME/.claude"
fi

# Symlink global settings.json
SETTINGS_SOURCE="$DOTFILES_ROOT/claude/settings.json"
SETTINGS_TARGET="$HOME/.claude/settings.json"

if [ -L "$SETTINGS_TARGET" ]; then
  current_target="$(readlink "$SETTINGS_TARGET")"
  if [ "$current_target" = "$SETTINGS_SOURCE" ]; then
    echo "  ~/.claude/settings.json already linked correctly"
  else
    echo "  Warning: ~/.claude/settings.json points to wrong location"
    echo "    Current: $current_target"
    echo "    Expected: $SETTINGS_SOURCE"
    echo "    Fix: rm ~/.claude/settings.json && dot"
  fi
elif [ -e "$SETTINGS_TARGET" ]; then
  echo "  Warning: ~/.claude/settings.json exists (not a symlink)"
  echo "  Back it up and remove it: mv ~/.claude/settings.json ~/.claude/settings.json.bak"
else
  echo "  Linking ~/.claude/settings.json -> $SETTINGS_SOURCE"
  ln -s "$SETTINGS_SOURCE" "$SETTINGS_TARGET"
fi

# Install plugins from marketplaces (if claude CLI available)
if command -v claude >/dev/null 2>&1; then
  echo "  Setting up Claude Code plugins..."

  # Add marketplaces (idempotent - won't duplicate)
  claude plugin marketplace add anthropics/skills 2>/dev/null || true
  claude plugin marketplace update claude-plugins-official 2>/dev/null || true

  # Install plugins (idempotent - skips if installed)
  claude plugin install document-skills@anthropic-agent-skills 2>/dev/null || true
  claude plugin install playground@claude-plugins-official 2>/dev/null || true

  echo "  Claude Code plugins setup complete!"
else
  echo "  Claude CLI not found, skipping plugin installation"
fi

echo "  Claude Code configuration complete!"
