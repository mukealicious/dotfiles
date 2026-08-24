#!/bin/sh
# Focused hermetic coverage for Herdr's active Pi integration boundary.
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
TMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/dotfiles-herdr-install.XXXXXX")"
trap 'rm -rf "$TMP_ROOT"' EXIT INT TERM
REPO="$TMP_ROOT/repo"
HOME_ROOT="$TMP_ROOT/home"
FAKE_BIN="$TMP_ROOT/bin"
mkdir -p "$REPO" "$HOME_ROOT/.config" "$HOME_ROOT/.pi/work" "$HOME_ROOT/.pi/personal" "$HOME_ROOT/.pi/agent" "$FAKE_BIN"
REPO_PHYSICAL="$(cd "$REPO" && pwd -P)"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

assert_contains() {
  file="$1"
  expected="$2"
  grep -Fq "$expected" "$file" || fail "$file is missing: $expected"
}

assert_not_contains() {
  file="$1"
  unexpected="$2"
  if grep -Fq "$unexpected" "$file"; then
    fail "$file unexpectedly contains: $unexpected"
  fi
}

# Keep the fixture independent of the checkout's installed dependencies.
tar -C "$ROOT" --exclude='node_modules' -cf - herdr lib | tar -C "$REPO" -xf -

cat > "$FAKE_BIN/herdr" <<'EOF'
#!/bin/sh
printf '%s\t%s\n' "${PI_CODING_AGENT_DIR:-}" "$*" >> "${HERDR_LOG:?}"
[ "$*" = "integration install pi" ]
EOF
chmod +x "$FAKE_BIN/herdr"

printf '%s\n' 'legacy integration state' > "$HOME_ROOT/.pi/agent/legacy-state.ts"
cp "$HOME_ROOT/.pi/agent/legacy-state.ts" "$TMP_ROOT/legacy-state.before"

HERDR_LOG="$TMP_ROOT/herdr.log" HOME="$HOME_ROOT" PATH="$FAKE_BIN:/usr/bin:/bin" \
  sh "$REPO/herdr/install.sh" >"$TMP_ROOT/install.log" 2>&1

[ -L "$HOME_ROOT/.config/herdr/config.toml" ] || fail "Herdr config was not linked"
[ "$(readlink "$HOME_ROOT/.config/herdr/config.toml")" = "$REPO_PHYSICAL/herdr/config.toml" ] \
  || fail "Herdr config link is misdirected"
[ "$(wc -l < "$TMP_ROOT/herdr.log" | tr -d ' ')" -eq 2 ] || fail "unexpected Herdr integration count"
grep -F "$(printf '%s\t%s' "$HOME_ROOT/.pi/work" 'integration install pi')" "$TMP_ROOT/herdr.log" >/dev/null \
  || fail "work integration was not profile-scoped"
grep -F "$(printf '%s\t%s' "$HOME_ROOT/.pi/personal" 'integration install pi')" "$TMP_ROOT/herdr.log" >/dev/null \
  || fail "personal integration was not profile-scoped"
assert_not_contains "$TMP_ROOT/herdr.log" 'claude'
assert_not_contains "$TMP_ROOT/herdr.log" 'codex'
assert_not_contains "$TMP_ROOT/herdr.log" 'opencode'
cmp "$TMP_ROOT/legacy-state.before" "$HOME_ROOT/.pi/agent/legacy-state.ts" \
  || fail "deprecated fallback state changed"

# Source contracts prevent accidental ownership from returning during a later edit.
assert_not_contains "$REPO/herdr/install.sh" '.pi/agent'
assert_not_contains "$REPO/herdr/install.sh" 'herdr-agent-state'
assert_contains "$REPO/herdr/install.sh" 'integration install claude'
assert_contains "$REPO/herdr/install.sh" 'integration install codex'
assert_contains "$REPO/herdr/install.sh" 'integration install opencode'

# Validate the tracked config with the installed Herdr parser without installing
# or reloading any live integration.
HERDR_BIN="$(command -v herdr)"
[ -n "$HERDR_BIN" ] || fail "installed Herdr is required for config validation"
HERDR_CONFIG_PATH="$REPO/herdr/config.toml" "$HERDR_BIN" config check >/dev/null \
  || fail "tracked Herdr config did not validate"
assert_contains "$REPO/herdr/config.toml" 'agent_panel_sort = "priority"'
assert_contains "$REPO/herdr/config.toml" 'delivery = "herdr"'
assert_contains "$REPO/herdr/config.toml" 'enabled = false'
assert_contains "$REPO/herdr/config.toml" 'pane_history = false'

# Keep release mechanics and the isolated review recipe discoverable in docs.
assert_contains "$ROOT/ai/skills/herdr/SKILL.md" "first observed \`idle\`, \`done\`, or \`blocked\` state"
assert_contains "$ROOT/ai/skills/herdr/SKILL.md" 'searches the selected current terminal snapshot'
assert_contains "$ROOT/ai/skills/herdr/references/cli.md" 'including output that already exists'
assert_contains "$ROOT/herdr/README.md" 'herdr worktree create'
assert_contains "$ROOT/herdr/README.md" 'hunk diff --watch'
assert_contains "$ROOT/pi/extensions/notify.ts" 'if (process.env.HERDR_ENV === "1") return;'
echo "Herdr config, Pi integration boundary, and documentation tests passed"
