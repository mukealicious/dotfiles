#!/bin/sh

set -e

DOTFILES_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"

. "$DOTFILES_ROOT/lib/log.sh"

if [ "$(uname)" != "Darwin" ]; then
  exit 0
fi

prompt_hidden_password() {
  prompt="$1"

  trap 'stty echo < /dev/tty 2>/dev/null || true' EXIT INT TERM HUP
  printf "%s" "$prompt" > /dev/tty
  stty -echo < /dev/tty
  IFS= read -r password < /dev/tty
  stty echo < /dev/tty
  trap - EXIT INT TERM HUP
  printf "\n" > /dev/tty

  printf "%s" "$password"
}

# Apple silicon may require owner authorization for some updates. Prompt for it
# ourselves so the password stays hidden instead of relying on softwareupdate's
# plaintext tty prompt.
if [ "$(uname -m)" = "arm64" ]; then
  owner_user="${DOT_SOFTWAREUPDATE_USER:-$USER}"

  log_step "sudo -v"
  sudo -v

  owner_password="$(prompt_hidden_password "Owner password for $owner_user: ")"

  log_step "sudo softwareupdate --install --all --user $owner_user --stdinpass"
  printf '%s\n' "$owner_password" | sudo softwareupdate --install --all --user "$owner_user" --stdinpass

  owner_password=''
else
  log_step "sudo softwareupdate -i -a"
  sudo softwareupdate -i -a
fi
