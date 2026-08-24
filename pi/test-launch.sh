#!/bin/sh
# Focused hermetic coverage for supported Pi launch dispatch.
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
TMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/dotfiles-pi-launch.XXXXXX")"
TMP_ROOT="$(cd "$TMP_ROOT" && pwd -P)"
trap 'rm -rf "$TMP_ROOT"' EXIT INT TERM
HOME_ROOT="$TMP_ROOT/home"
FAKE_BIN="$TMP_ROOT/bin"
CWD="$TMP_ROOT/project with spaces"
mkdir -p "$HOME_ROOT/.bun/bin" "$FAKE_BIN" "$CWD"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

assert_contains() {
  file="$1"
  expected="$2"
  grep -Fq "$expected" "$file" || fail "$file is missing: $expected"
}

assert_launch() {
  name="$1"
  expected_profile="$2"
  shift 2
  capture="$TMP_ROOT/$name.log"
  (
    cd "$CWD"
    HOME="$HOME_ROOT" PATH="$FAKE_BIN:$PATH" PI_CAPTURE="$capture" OPENAI_API_KEY=test-key "$@"
  )
  assert_contains "$capture" "profile=$HOME_ROOT/.pi/$expected_profile"
  assert_contains "$capture" 'git_editor=true'
  assert_contains "$capture" 'git_sequence_editor=true'
  assert_contains "$capture" 'git_merge_autoedit=no'
  assert_contains "$capture" "cwd=$CWD"
}

cat > "$HOME_ROOT/.bun/bin/pi" <<'EOF'
#!/bin/sh
{
  printf 'profile=%s\n' "$PI_CODING_AGENT_DIR"
  printf 'git_editor=%s\n' "$GIT_EDITOR"
  printf 'git_sequence_editor=%s\n' "$GIT_SEQUENCE_EDITOR"
  printf 'git_merge_autoedit=%s\n' "$GIT_MERGE_AUTOEDIT"
  printf 'cwd=%s\n' "$PWD"
  index=0
  for arg in "$@"; do
    printf 'arg_%s=%s\n' "$index" "$arg"
    index=$((index + 1))
  done
} > "$PI_CAPTURE"
EOF
cat > "$FAKE_BIN/mise" <<EOF
#!/bin/sh
if [ "\$1" = "which" ]; then
  printf '%s\\n' '$FAKE_BIN/node'
  exit 0
fi
exit 1
EOF
cat > "$FAKE_BIN/node" <<'EOF'
#!/bin/sh
exec "$@"
EOF
chmod +x "$HOME_ROOT/.bun/bin/pi" "$FAKE_BIN/mise" "$FAKE_BIN/node"

# Default dispatch preserves cwd and arguments, including values with spaces.
assert_launch default-work work env -u PI_CODING_AGENT_DIR PI_DEFAULT_PROFILE=work "$ROOT/bin/pi" 'two words' --flag
assert_launch default-personal personal env -u PI_CODING_AGENT_DIR PI_DEFAULT_PROFILE=personal "$ROOT/bin/pi" default-personal
assert_contains "$TMP_ROOT/default-work.log" 'arg_0=two words'
assert_contains "$TMP_ROOT/default-work.log" 'arg_1=--flag'

# A recognized inherited profile wins over the machine default.
assert_launch inherited-personal personal env PI_CODING_AGENT_DIR="$HOME_ROOT/.pi/personal" PI_DEFAULT_PROFILE=work "$ROOT/bin/pi" inherited

# Both supported --session syntaxes select their owning profile before default.
assert_launch session-separated personal env -u PI_CODING_AGENT_DIR PI_DEFAULT_PROFILE=work "$ROOT/bin/pi" --session "$HOME_ROOT/.pi/personal/sessions/test.jsonl"
assert_launch session-equals work env -u PI_CODING_AGENT_DIR PI_DEFAULT_PROFILE=personal "$ROOT/bin/pi" --session="$HOME_ROOT/.pi/work/sessions/test.jsonl"

# Direct wrappers always select their own profile, even with another profile inherited.
assert_launch direct-work work env PI_CODING_AGENT_DIR="$HOME_ROOT/.pi/personal" "$ROOT/bin/pi-work" direct-work
assert_launch direct-personal personal env PI_CODING_AGENT_DIR="$HOME_ROOT/.pi/work" "$ROOT/bin/pi-personal" direct-personal

# Recognized sessions cannot cross an inherited or direct-wrapper selection.
if (
  cd "$CWD"
  HOME="$HOME_ROOT" PATH="$FAKE_BIN:$PATH" OPENAI_API_KEY=test-key \
    PI_CODING_AGENT_DIR="$HOME_ROOT/.pi/personal" "$ROOT/bin/pi" --session "$HOME_ROOT/.pi/work/sessions/test.jsonl"
) >"$TMP_ROOT/inherited-conflict.log" 2>&1; then
  fail "inherited/session conflict unexpectedly launched"
fi
assert_contains "$TMP_ROOT/inherited-conflict.log" 'session path belongs to work profile, but selected profile is personal'

if (
  cd "$CWD"
  HOME="$HOME_ROOT" PATH="$FAKE_BIN:$PATH" OPENAI_API_KEY=test-key \
    "$ROOT/bin/pi-personal" --session="$HOME_ROOT/.pi/work/sessions/test.jsonl"
) >"$TMP_ROOT/wrapper-conflict.log" 2>&1; then
  fail "wrapper/session conflict unexpectedly launched"
fi
assert_contains "$TMP_ROOT/wrapper-conflict.log" 'session path belongs to work profile, but selected profile is personal'

if (
  cd "$CWD"
  HOME="$HOME_ROOT" PATH="$FAKE_BIN:$PATH" OPENAI_API_KEY=test-key \
    "$ROOT/bin/pi" \
      --session "$HOME_ROOT/.pi/work/sessions/work.jsonl" \
      --session="$HOME_ROOT/.pi/personal/sessions/personal.jsonl"
) >"$TMP_ROOT/multiple-session-conflict.log" 2>&1; then
  fail "mixed-profile session arguments unexpectedly launched"
fi
assert_contains "$TMP_ROOT/multiple-session-conflict.log" 'session paths select both work and personal profiles'

# Fish is deliberately only a forwarding layer; it must not implement selection.
grep -Fq 'command "$DOTFILES/bin/pi" $argv' "$ROOT/pi/aliases.fish" || fail "Fish no longer delegates to bin/pi"
assert_launch fish-delegation work env -u PI_CODING_AGENT_DIR PI_DEFAULT_PROFILE=work DOTFILES="$ROOT" fish -c 'source "$DOTFILES/pi/aliases.fish"; pi fish-delegation'

# The wrappers scope editor overrides to the child process.
GIT_EDITOR='editor --wait'
export GIT_EDITOR
assert_launch shell-editor-unchanged work env -u PI_CODING_AGENT_DIR PI_DEFAULT_PROFILE=work "$ROOT/bin/pi" shell-editor
[ "$GIT_EDITOR" = 'editor --wait' ] || fail "Pi launch changed the caller Git editor"

echo "Pi launch dispatch tests passed"
