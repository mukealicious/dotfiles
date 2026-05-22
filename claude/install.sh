#!/bin/sh
#
# Claude Code Configuration
#
# Sets up Claude-specific config: settings.json and MCP servers.
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

# Configure Claude CLI integrations (if claude CLI available)
if command -v claude >/dev/null 2>&1; then
  log_info "Setting up Claude Code MCP servers..."

  # Migration cleanup for legacy / unused MCPs
  claude mcp remove --scope user context7 2>/dev/null || true

  # Ensure user-scope MCP servers (idempotent - won't overwrite existing)
  claude mcp add --transport http --scope user grep_app https://mcp.grep.app 2>/dev/null || true

  log_success "Claude Code MCP setup complete!"
else
  log_warn "Claude CLI not found, skipping MCP setup"
fi

log_success "Claude Code configuration complete!"
