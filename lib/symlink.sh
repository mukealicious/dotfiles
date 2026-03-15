#!/bin/sh
#
# Shared symlink and output helpers
#
# Provides:
#   ensure_symlink <src> <target> <desc>  — create/fix symlinks (read-write)
#   check_symlink  <src> <target> <desc>  — validate symlinks (read-only, for dot doctor)
#   Color output: pass(), warn(), fail(), info(), header()
#   Counters: _check_pass, _check_warnings, _check_failures
#
# Usage:
#   . "$DOTFILES_ROOT/lib/symlink.sh"
#
# The FORCE variable (default: false) controls ensure_symlink behavior
# for misdirected symlinks.

# Output helpers
pass() {
  printf "\033[32mOK\033[0m  %s\n" "$1"
  _check_pass=$(( ${_check_pass:-0} + 1 ))
}

warn() {
  printf "\033[33m!!\033[0m  %s\n" "$1"
  _check_warnings=$(( ${_check_warnings:-0} + 1 ))
}

fail() {
  printf "\033[31mXX\033[0m  %s\n" "$1"
  _check_failures=$(( ${_check_failures:-0} + 1 ))
}

info() {
  printf "    %s\n" "$1"
}

header() {
  printf "\n\033[1m==> %s\033[0m\n" "$1"
}

# Counters (initialized to 0)
_check_pass=0
_check_warnings=0
_check_failures=0

#
# ensure_symlink <source> <target> <description>
#
# Create or validate a symlink (read-write).
#
# Behavior:
# - If target doesn't exist: create symlink
# - If target is correct symlink: skip
# - If target is broken symlink: remove and recreate
# - If target points elsewhere: warn (or fix with --force / FORCE=true)
# - If target is regular file/dir: warn and skip
#
ensure_symlink() {
  src="$1"
  target="$2"
  desc="$3"

  if [ -L "$target" ]; then
    current="$(readlink "$target")"
    if [ ! -e "$target" ]; then
      # Broken symlink
      echo "  Removing dead symlink: $desc"
      rm "$target"
      echo "  Linking $desc"
      ln -s "$src" "$target"
    elif [ "$current" = "$src" ]; then
      # Correct symlink
      echo "  $desc already linked correctly"
    else
      # Points to wrong location
      if [ "${FORCE:-false}" = "true" ]; then
        echo "  Fixing $desc (was: $current)"
        rm "$target"
        ln -s "$src" "$target"
      else
        echo "  Warning: $desc points to wrong location"
        echo "    Current:  $current"
        echo "    Expected: $src"
        echo "    Fix: rm \"$target\" && dot"
      fi
    fi
  elif [ -e "$target" ]; then
    # Regular file or directory
    echo "  Warning: $desc exists but is not a symlink"
    echo "    Skipping to preserve existing content"
  else
    # Doesn't exist
    echo "  Linking $desc"
    ln -s "$src" "$target"
  fi
}

#
# check_symlink <source> <target> <description>
#
# Validate a symlink without modifying anything (read-only).
# Uses pass/warn/fail counters for summary output.
#
check_symlink() {
  src="$1"
  target="$2"
  desc="$3"

  if [ -L "$target" ]; then
    current="$(readlink "$target")"
    if [ ! -e "$target" ]; then
      fail "$desc is a broken symlink"
      info "Target: $current (does not exist)"
      info "Fix: rm \"$target\" && dot"
    elif [ "$current" = "$src" ]; then
      pass "$desc"
    else
      warn "$desc points to wrong location"
      info "Current:  $current"
      info "Expected: $src"
      info "Fix: rm \"$target\" && dot"
    fi
  elif [ -e "$target" ]; then
    warn "$desc exists but is not a symlink"
  else
    fail "$desc is missing"
    info "Expected symlink to: $src"
    info "Fix: dot"
  fi
}
