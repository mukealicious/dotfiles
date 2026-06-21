#!/bin/sh
#
# OrbStack
#
# Verifies OrbStack is installed and ready to serve Docker.

set -e

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"

. "$DOTFILES_ROOT/lib/log.sh"

log_info "Checking OrbStack..."

if command -v orbctl >/dev/null 2>&1; then
  ORBCTL="orbctl"
elif [ -x /Applications/OrbStack.app/Contents/MacOS/bin/orbctl ]; then
  ORBCTL="/Applications/OrbStack.app/Contents/MacOS/bin/orbctl"
else
  log_warn "OrbStack CLI not found"
  log_hint "Run: brew bundle --file $DOTFILES_ROOT/Brewfile"
  exit 0
fi

if command -v orb >/dev/null 2>&1; then
  ORB="orb"
elif [ -x /Applications/OrbStack.app/Contents/MacOS/bin/orb ]; then
  ORB="/Applications/OrbStack.app/Contents/MacOS/bin/orb"
else
  ORB=""
fi

if "$ORBCTL" status >/dev/null 2>&1; then
  log_success "OrbStack is running"
else
  log_info "Starting OrbStack..."
  if command -v open >/dev/null 2>&1; then
    open -a OrbStack >/dev/null 2>&1 || true
    sleep 3
  fi

  if "$ORBCTL" status >/dev/null 2>&1; then
    log_success "OrbStack started"
  else
    log_warn "OrbStack is installed but not responding yet"
    log_hint "Open OrbStack once to finish setup, then run: orb-doctor"
  fi
fi

cli_plugins_dir="$HOME/.docker/cli-plugins"
if [ -d "$cli_plugins_dir" ]; then
  removed_plugins=false
  for plugin in "$cli_plugins_dir"/docker-*; do
    [ -L "$plugin" ] || continue
    plugin_target="$(readlink "$plugin" 2>/dev/null || true)"
    case "$plugin_target" in
      /Applications/Docker.app/*)
        rm "$plugin"
        removed_plugins=true
        ;;
    esac
  done
  if [ "$removed_plugins" = true ]; then
    log_success "Removed stale Docker Desktop CLI plugin links"
  fi
fi

if command -v docker >/dev/null 2>&1; then
  docker_os="$(docker info --format '{{.OperatingSystem}}' 2>/dev/null || true)"
  case "$docker_os" in
    *OrbStack*)
      log_success "Docker is using OrbStack"
      ;;
    "")
      log_warn "Docker CLI is installed but the daemon is not responding"
      log_hint "Run: open -a OrbStack"
      ;;
    *)
      log_warn "Docker is not using OrbStack: $docker_os"
      log_hint "Run: docker context use orbstack"
      ;;
  esac

  if docker context inspect desktop-linux >/dev/null 2>&1; then
    log_warn "Stale Docker Desktop context exists: desktop-linux"
    log_hint "Optional cleanup: docker context rm desktop-linux"
  fi
else
  log_warn "docker CLI not found"
  log_hint "Open OrbStack once; it should install Docker-compatible CLI links"
fi

if "$ORBCTL" doctor >/dev/null 2>&1; then
  log_success "orbctl doctor passed"
else
  log_warn "orbctl doctor reported issues"
  log_hint "Run: orbctl doctor"
fi

if [ -n "$ORB" ]; then
  log_success "orb CLI available"
fi
