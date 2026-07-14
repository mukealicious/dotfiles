#!/bin/sh
# shellcheck disable=SC1091
#
# Install the global pnpm policy file.

set -e

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"

. "$DOTFILES_ROOT/lib/symlink.sh"

FORCE="${FORCE:-false}"
if [ "${1:-}" = "--force" ]; then
  FORCE=true
fi

if [ -n "${XDG_CONFIG_HOME:-}" ]; then
  PNPM_CONFIG="$XDG_CONFIG_HOME/pnpm/config.yaml"
else
  case "$(uname -s)" in
    Darwin)
      PNPM_CONFIG="$HOME/Library/Preferences/pnpm/config.yaml"
      ;;
    Linux)
      PNPM_CONFIG="$HOME/.config/pnpm/config.yaml"
      ;;
    *)
      log_warn "pnpm config installation is only implemented for macOS and Linux"
      exit 0
      ;;
  esac
fi

mkdir -p "$(dirname "$PNPM_CONFIG")"
ensure_symlink "$DOTFILES_ROOT/pnpm/config.yaml" "$PNPM_CONFIG" "pnpm config.yaml"

log_success "pnpm policy configured"
