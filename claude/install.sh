#!/bin/sh
#
# Claude Code Skills
#
# This sets up Claude Code skills by symlinking individual skills
# from the dotfiles to ~/.claude/skills/

set -e

echo "  Setting up Claude Code skills..."

# Get the dotfiles root directory
DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
SKILLS_SOURCE="$DOTFILES_ROOT/claude/skills"
SKILLS_TARGET="$HOME/.claude/skills"

# Create ~/.claude directory if it doesn't exist
if [ ! -d "$HOME/.claude" ]; then
  echo "  Creating ~/.claude directory"
  mkdir -p "$HOME/.claude"
fi

# Symlink global settings.json
SETTINGS_SOURCE="$DOTFILES_ROOT/claude/settings.json"
SETTINGS_TARGET="$HOME/.claude/settings.json"

if [ -L "$SETTINGS_TARGET" ]; then
  echo "  ~/.claude/settings.json symlink already exists"
elif [ -e "$SETTINGS_TARGET" ]; then
  echo "  Warning: ~/.claude/settings.json already exists (not a symlink)"
  echo "  Back it up and remove it, then re-run: mv ~/.claude/settings.json ~/.claude/settings.json.bak"
else
  echo "  Linking ~/.claude/settings.json -> $SETTINGS_SOURCE"
  ln -s "$SETTINGS_SOURCE" "$SETTINGS_TARGET"
fi

# Create ~/.claude/skills directory if it doesn't exist
if [ ! -d "$SKILLS_TARGET" ]; then
  echo "  Creating ~/.claude/skills directory"
  mkdir -p "$SKILLS_TARGET"
fi

# Symlink each skill individually
for skill_dir in "$SKILLS_SOURCE"/*; do
  if [ -d "$skill_dir" ]; then
    skill_name=$(basename "$skill_dir")
    target_path="$SKILLS_TARGET/$skill_name"

    if [ -L "$target_path" ]; then
      echo "  ~/.claude/skills/$skill_name symlink already exists"
    elif [ -e "$target_path" ]; then
      echo "  Warning: ~/.claude/skills/$skill_name already exists (not a symlink)"
      echo "  Skipping to preserve existing skill"
    else
      echo "  Linking ~/.claude/skills/$skill_name -> $skill_dir"
      ln -s "$skill_dir" "$target_path"
    fi
  fi
done

echo "  Claude Code skills setup complete!"

# Symlink subagents
AGENTS_SOURCE="$DOTFILES_ROOT/claude/agents"
AGENTS_TARGET="$HOME/.claude/agents"

if [ -d "$AGENTS_SOURCE" ]; then
  echo "  Setting up Claude Code agents..."

  if [ ! -d "$AGENTS_TARGET" ]; then
    echo "  Creating ~/.claude/agents directory"
    mkdir -p "$AGENTS_TARGET"
  fi

  for agent_file in "$AGENTS_SOURCE"/*.md; do
    if [ -f "$agent_file" ]; then
      agent_name=$(basename "$agent_file")
      target="$AGENTS_TARGET/$agent_name"

      if [ -L "$target" ]; then
        echo "  ~/.claude/agents/$agent_name symlink already exists"
      elif [ -e "$target" ]; then
        echo "  Warning: ~/.claude/agents/$agent_name already exists (not a symlink)"
        echo "  Skipping to preserve existing agent"
      else
        echo "  Linking ~/.claude/agents/$agent_name -> $agent_file"
        ln -s "$agent_file" "$target"
      fi
    fi
  done

  echo "  Claude Code agents setup complete!"
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

  # Install external skills via skills.sh
  if command -v npx >/dev/null 2>&1; then
    echo "  Installing external skills..."
    npx skills add remotion-dev/skills --global --agent claude-code --skill remotion-best-practices --yes 2>/dev/null || true
  fi

  echo "  Claude Code plugins setup complete!"
else
  echo "  Claude CLI not found, skipping plugin installation"
fi
