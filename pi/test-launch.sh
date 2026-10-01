#!/bin/sh
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/pi-launch.XXXXXX")"
TMP="$(cd "$TMP" && pwd -P)"
trap 'rm -rf "$TMP"' EXIT INT TERM
export HOME="$TMP/home"
mkdir -p "$HOME/.bun/bin" "$TMP/bin" "$TMP/project with spaces"
cat > "$HOME/.bun/bin/pi" <<'EOF'
#!/bin/sh
printf '%s\n' "$PI_CODING_AGENT_DIR" "$PWD" "$GIT_EDITOR" "$GIT_SEQUENCE_EDITOR" "$GIT_MERGE_AUTOEDIT" "${OPENAI_API_KEY:-unset}" "${OPENAI_OP_REF:-unset}" "$@"
EOF
cat > "$TMP/bin/mise" <<'EOF'
#!/bin/sh
[ "$1" = which ] || exit 1
printf '%s\n' "$HOME/../bin/node"
EOF
printf '#!/bin/sh\nexec "$@"\n' > "$TMP/bin/node"
chmod +x "$HOME/.bun/bin/pi" "$TMP/bin/"*
export PATH="$TMP/bin:$PATH" OPENAI_API_KEY=not-a-real-key OPENAI_OP_REF=not-a-real-reference
cd "$TMP/project with spaces"
for launcher in pi; do
  for inherited in '' "$HOME/.pi/work" "$HOME/.pi/personal"; do
    PI_CODING_AGENT_DIR="$inherited" "$ROOT/bin/$launcher" 'two words' --session "$HOME/.pi/work/sessions/old.jsonl" > "$TMP/actual"
    printf '%s\n' "$HOME/.pi/agent" "$PWD" true true no unset unset 'two words' --session "$HOME/.pi/work/sessions/old.jsonl" > "$TMP/expected"
    diff -u "$TMP/expected" "$TMP/actual"
  done
done
PI_CODING_AGENT_DIR="$TMP/isolated" "$ROOT/bin/pi" > "$TMP/actual"
grep -Fx "$TMP/isolated" "$TMP/actual" >/dev/null
[ "$OPENAI_API_KEY" = not-a-real-key ]
if command -v fish >/dev/null; then
  DOTFILES="$ROOT" PI_CODING_AGENT_DIR= fish -c 'source "$DOTFILES/pi/aliases.fish"; pi fish-test' > "$TMP/fish"
  grep -Fx "$HOME/.pi/agent" "$TMP/fish" >/dev/null
fi
echo 'Unified Pi launcher tests passed'
