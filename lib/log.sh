#!/bin/sh
#
# Shared logging helpers for dotfiles shell scripts.
#
# Usage:
#   . "$DOTFILES_ROOT/lib/log.sh"

if [ -t 1 ]; then
  LOG_RESET="$(printf '\033[0m')"
  LOG_BOLD="$(printf '\033[1m')"
  LOG_DIM="$(printf '\033[2m')"
  LOG_BLUE="$(printf '\033[34m')"
  LOG_GREEN="$(printf '\033[32m')"
  LOG_YELLOW="$(printf '\033[33m')"
  LOG_RED="$(printf '\033[31m')"
else
  LOG_RESET=''
  LOG_BOLD=''
  LOG_DIM=''
  LOG_BLUE=''
  LOG_GREEN=''
  LOG_YELLOW=''
  LOG_RED=''
fi

log_section() {
  printf '\n%s==>%s %s%s%s\n' "$LOG_BLUE" "$LOG_RESET" "$LOG_BOLD" "$1" "$LOG_RESET"
}

log_step() {
  printf '%s›%s %s\n' "$LOG_GREEN" "$LOG_RESET" "$1"
}

log_info() {
  printf '  %s\n' "$1"
}

log_success() {
  printf '  %s✓%s %s\n' "$LOG_GREEN" "$LOG_RESET" "$1"
}

log_warn() {
  printf '  %s!%s %s\n' "$LOG_YELLOW" "$LOG_RESET" "$1"
}

log_error() {
  printf '  %s✗%s %s\n' "$LOG_RED" "$LOG_RESET" "$1"
}

log_hint() {
  printf '  %s%s%s\n' "$LOG_DIM" "$1" "$LOG_RESET"
}

log_force_enabled() {
  log_info "Running in --force mode: will fix managed files where supported"
}
