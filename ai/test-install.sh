#!/bin/sh
# Focused regression coverage for Pi's generated-resource cutover.
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
TMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/dotfiles-ai-install.XXXXXX")"
trap 'rm -rf "$TMP_ROOT"' EXIT INT TERM

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

assert_file_contains() {
  file="$1"
  text="$2"
  grep -Fq "$text" "$file" || fail "$file does not contain expected text"
}

make_test_repo() {
  target="$1"
  mkdir -p "$target"
  tar -C "$ROOT" \
    --exclude='.ai-runtime' \
    --exclude='.agents' \
    --exclude='.claude' \
    --exclude='pi/node_modules' \
    --exclude='pi/packages/*/node_modules' \
    -cf - ai pi lib claude opencode | tar -C "$target" -xf -
}

prepare_legacy_profiles() {
  home="$1"
  repo="$2"
  mkdir -p "$home/.pi/agent/agents" "$repo/.ai-runtime/pi/agents" "$repo/.ai-runtime/pi/skills"
  printf 'legacy instruction\n' > "$home/.pi/agent/AGENTS.md"
  printf 'legacy agent\n' > "$home/.pi/agent/agents/researcher.md"
  printf 'previous generated tree\n' > "$repo/.ai-runtime/pi/AGENTS.md"
  printf 'previous generated agent\n' > "$repo/.ai-runtime/pi/agents/researcher.md"
  mkdir -p "$repo/.ai-runtime/pi/skills/previous"
  for profile in work personal; do
    mkdir -p "$home/.pi/$profile"
    ln -s "$home/.pi/agent/AGENTS.md" "$home/.pi/$profile/AGENTS.md"
    ln -s "$home/.pi/agent/agents" "$home/.pi/$profile/agents"
  done
}

# Force ai/install.sh to use the system node rather than the host's mise setup.
BIN="$TMP_ROOT/bin"
mkdir -p "$BIN"
cat > "$BIN/mise" <<'EOF'
#!/bin/sh
exit 1
EOF
chmod +x "$BIN/mise"
TEST_PATH="$BIN:$PATH"

# A failure while projecting the staged Pi skills must not replace the active
# generated tree or profile links.
FAIL_REPO="$TMP_ROOT/failure-repo"
FAIL_HOME="$TMP_ROOT/failure-home"
make_test_repo "$FAIL_REPO"
prepare_legacy_profiles "$FAIL_HOME" "$FAIL_REPO"
printf '%s\n' 'if (process.argv[4]?.includes("/.pi.stage.")) process.exit(77);' | cat - "$FAIL_REPO/ai/scripts/project-skills.mjs" > "$FAIL_REPO/ai/scripts/project-skills.mjs.tmp"
mv "$FAIL_REPO/ai/scripts/project-skills.mjs.tmp" "$FAIL_REPO/ai/scripts/project-skills.mjs"
if HOME="$FAIL_HOME" PATH="$TEST_PATH" sh "$FAIL_REPO/ai/install.sh" >"$TMP_ROOT/staged-failure.log" 2>&1; then
  fail "staged Pi projection unexpectedly succeeded"
fi
assert_file_contains "$FAIL_REPO/.ai-runtime/pi/AGENTS.md" "previous generated tree"
[ "$(readlink "$FAIL_HOME/.pi/work/AGENTS.md")" = "$FAIL_HOME/.pi/agent/AGENTS.md" ] || fail "failed stage changed work instruction link"
[ "$(readlink "$FAIL_HOME/.pi/personal/agents")" = "$FAIL_HOME/.pi/agent/agents" ] || fail "failed stage changed personal agents link"

# Exact legacy links migrate, while custom profile-local agents and chains stay
# in their own real directories. A same-name regular file must stop the run.
SUCCESS_REPO="$TMP_ROOT/success-repo"
SUCCESS_HOME="$TMP_ROOT/success-home"
make_test_repo "$SUCCESS_REPO"
SUCCESS_REPO_PHYSICAL="$(cd "$SUCCESS_REPO" && pwd -P)"
prepare_legacy_profiles "$SUCCESS_HOME" "$SUCCESS_REPO"
HOME="$SUCCESS_HOME" PATH="$TEST_PATH" sh "$SUCCESS_REPO/ai/install.sh" >"$TMP_ROOT/migration.log" 2>&1
for profile in work personal; do
  [ "$(readlink "$SUCCESS_HOME/.pi/$profile/AGENTS.md")" = "$SUCCESS_REPO_PHYSICAL/.ai-runtime/pi/AGENTS.md" ] || fail "$profile instruction link was not migrated"
  [ -d "$SUCCESS_HOME/.pi/$profile/agents" ] && [ ! -L "$SUCCESS_HOME/.pi/$profile/agents" ] || fail "$profile agents directory is not real"
  [ "$(readlink "$SUCCESS_HOME/.pi/$profile/agents/review.md")" = "$SUCCESS_REPO_PHYSICAL/.ai-runtime/pi/agents/review.md" ] || fail "$profile review agent was not linked individually"
done
[ -f "$SUCCESS_REPO/.ai-runtime/pi/skills/handoff/SKILL.md" ] || fail "handoff skill was not projected into Pi runtime"
assert_file_contains "$SUCCESS_REPO/.ai-runtime/pi/skills/handoff/SKILL.md" "temporary handoff"
[ -f "$SUCCESS_HOME/.pi/agent/AGENTS.md" ] || fail "legacy fallback was modified"
printf '%s\n' 'work custom agent' > "$SUCCESS_HOME/.pi/work/agents/custom.md"
printf '%s\n' 'work custom chain' > "$SUCCESS_HOME/.pi/work/agents/custom.chain.md"
ln -s "$SUCCESS_REPO_PHYSICAL/.ai-runtime/pi/agents/removed.md" "$SUCCESS_HOME/.pi/work/agents/removed.md"
HOME="$SUCCESS_HOME" PATH="$TEST_PATH" sh "$SUCCESS_REPO/ai/install.sh" >"$TMP_ROOT/idempotence.log" 2>&1
[ -f "$SUCCESS_HOME/.pi/work/agents/custom.md" ] || fail "custom work agent was removed"
[ -f "$SUCCESS_HOME/.pi/work/agents/custom.chain.md" ] || fail "custom work chain was removed"
[ ! -e "$SUCCESS_HOME/.pi/work/agents/removed.md" ] && [ ! -L "$SUCCESS_HOME/.pi/work/agents/removed.md" ] || fail "stale managed agent link was preserved"
[ ! -e "$SUCCESS_HOME/.pi/personal/agents/custom.md" ] || fail "work custom agent crossed profiles"
rm "$SUCCESS_HOME/.pi/work/agents/review.md"
printf '%s\n' 'user-owned collision' > "$SUCCESS_HOME/.pi/work/agents/review.md"
if HOME="$SUCCESS_HOME" PATH="$TEST_PATH" sh "$SUCCESS_REPO/ai/install.sh" >"$TMP_ROOT/collision.log" 2>&1; then
  fail "managed-name collision unexpectedly succeeded"
fi
assert_file_contains "$TMP_ROOT/collision.log" "managed agent collision"
assert_file_contains "$SUCCESS_HOME/.pi/work/agents/review.md" "user-owned collision"

# pi/install.sh must never configure or seed the deprecated fallback profile.
if grep -Fq '.pi/agent' "$ROOT/pi/install.sh"; then
  fail "pi/install.sh still depends on ~/.pi/agent"
fi
# ai/install.sh may mention the fallback only as the two exact legacy migration
# targets; it must not create or otherwise manage that directory.
unexpected_fallback_refs="$(grep -F '.pi/agent' "$ROOT/ai/install.sh" | grep -Ev 'legacy_(instruction|agents_dir)=' || true)"
[ -z "$unexpected_fallback_refs" ] || fail "ai/install.sh has a non-migration fallback dependency"

echo "ai/install Pi cutover tests passed"
