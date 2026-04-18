#!/bin/sh
#
# Claude Code Configuration
#
# Sets up Claude-specific config: settings.json and plugins.
# Skills and agents are managed by ai/install.sh (single source of truth).

set -e

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"

# Parse arguments
FORCE=false
for arg in "$@"; do
  case "$arg" in
    --force) FORCE=true ;;
  esac
done

# Shared symlink helpers
. "$DOTFILES_ROOT/lib/symlink.sh"

if [ "$FORCE" = "true" ]; then
  log_force_enabled
fi

log_info "Setting up Claude Code configuration..."

# Symlink global settings.json
mkdir -p "$HOME/.claude"
ensure_symlink "$DOTFILES_ROOT/claude/settings.json" "$HOME/.claude/settings.json" "$HOME/.claude/settings.json"

# Install plugins from marketplaces (if claude CLI available)
if command -v claude >/dev/null 2>&1; then
  log_info "Setting up Claude Code plugins..."

  # Migration cleanup for legacy / unused MCPs
  claude mcp remove --scope user context7 2>/dev/null || true

  # Ensure user-scope MCP servers (idempotent - won't overwrite existing)
  claude mcp add --transport http --scope user grep_app https://mcp.grep.app 2>/dev/null || true
  claude mcp add --transport http --scope user figma https://mcp.figma.com/mcp 2>/dev/null || true
  claude mcp add --transport http --scope user cloudflare https://mcp.cloudflare.com/mcp 2>/dev/null || true

  # Add marketplaces (idempotent - won't duplicate)
  claude plugin marketplace add anthropics/skills 2>/dev/null || true
  claude plugin marketplace update claude-plugins-official 2>/dev/null || true

  # Install plugins (idempotent - skips if installed)
  claude plugin install document-skills@anthropic-agent-skills 2>/dev/null || true
  claude plugin install playground@claude-plugins-official 2>/dev/null || true
  claude plugin install figma@claude-plugins-official 2>/dev/null || true

  log_success "Claude Code plugins setup complete!"
else
  log_warn "Claude CLI not found, skipping plugin installation"
fi

log_success "Claude Code configuration complete!"
