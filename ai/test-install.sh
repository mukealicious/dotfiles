#!/bin/sh
# Regression coverage for generated resources and shared-skill retirement.
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
TMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/dotfiles-ai-install.XXXXXX")"
TMP_ROOT="$(cd "$TMP_ROOT" && pwd -P)"
trap 'result=$?; if [ "$result" -ne 0 ]; then for log in "$TMP_ROOT"/*.log; do [ ! -f "$log" ] || tail -40 "$log"; done; fi; rm -rf "$TMP_ROOT"; exit "$result"' EXIT
trap 'exit 1' INT TERM

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

assert_file_contains() {
  file="$1"
  text="$2"
  grep -Fq "$text" "$file" || fail "$file does not contain expected text"
}

RETIRED_SKILLS='breadboarding bro effect-service-design framing-doc grill-me grilling herdr hunk-review kickoff-doc mermaid moja-glava mu-design-eng opensrc pen-design post-mortem production-readiness project-guidance qmd surf-browser tech-spec technical-writing tufte-data-viz uncomplect upstream-review write-discoverable-code writing-for-agents impeccable diagnosing-bugs coding-standards mu-mode mu-stack rat-stack tdd domain-modeling codebase-design code-review grill-with-docs build-skill agent-context librarian visual-deliverables cloudflare-composition-root'

assert_retired_skill_cleanup() {
  for retired in $RETIRED_SKILLS; do
    for provider in pi codex claude-code opencode; do
      target="$SUCCESS_REPO/.ai-runtime/$provider/skills/$retired"
      [ ! -e "$target" ] && [ ! -L "$target" ] || fail "$provider retains $retired"
    done
    for directory in "$SUCCESS_REPO/.agents/skills" "$SUCCESS_REPO/.claude/skills" "$SUCCESS_HOME/.claude/skills" "$SUCCESS_HOME/.config/opencode/skill"; do
      [ ! -e "$directory/$retired" ] && [ ! -L "$directory/$retired" ] || fail "retired link survived: $directory/$retired"
    done
  done
  for directory in "$SUCCESS_REPO/.agents/skills" "$SUCCESS_REPO/.claude/skills" "$SUCCESS_HOME/.claude/skills" "$SUCCESS_HOME/.config/opencode/skill"; do
    [ "$(readlink "$directory/custom-link")" = "$SUCCESS_HOME/custom-skill" ] || fail "custom link changed"
    [ "$(readlink "$directory/custom-broken-link")" = "$SUCCESS_HOME/missing-custom-skill" ] || fail "unrelated broken link removed"
    assert_file_contains "$directory/custom-directory/SKILL.md" 'user-owned skill'
  done
}

for retired in $RETIRED_SKILLS prelude bootstrap-prelude; do
  [ ! -e "$ROOT/ai/skills/$retired" ] || fail "retired or unapproved source remains: $retired"
done
[ -s "$ROOT/ai/references/project-defaults.md" ] || fail "missing local project defaults"
assert_file_contains "$ROOT/ai/instructions/base.md" '~/.dotfiles/ai/references/project-defaults.md'
[ ! -e "$ROOT/ai/references/implementation-spec.md" ] && [ ! -L "$ROOT/ai/references/implementation-spec.md" ] || fail "retired local spec example remains"
if grep -Fq 'implementation-spec.md' "$ROOT/ai/instructions/base.md"; then
  fail "shared instructions still route to the retired spec example"
fi

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
  ln -s "$repo/.ai-runtime/pi/AGENTS.md" "$home/.pi/agent/AGENTS.md"
  printf 'previous generated tree\n' > "$repo/.ai-runtime/pi/AGENTS.md"
  printf 'previous generated agent\n' > "$repo/.ai-runtime/pi/agents/researcher.md"
  mkdir -p "$repo/.ai-runtime/pi/skills/previous"
  mkdir -p "$home/.pi/work"
  printf 'retired profile sentinel\n' > "$home/.pi/work/settings.json"
}

# Use the test runner's Node, with an optional portable override.
NODE="${NODE:-node}"
BIN="$TMP_ROOT/bin"
mkdir -p "$BIN"
cat > "$BIN/mise" <<'EOF'
#!/bin/sh
exit 1
EOF
chmod +x "$BIN/mise"
TEST_PATH="$BIN:$(dirname "$NODE"):$PATH"

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
[ "$(readlink "$FAIL_HOME/.pi/agent/AGENTS.md")" = "$FAIL_REPO/.ai-runtime/pi/AGENTS.md" ] || fail "failed stage changed instruction link"

# A tree with no custom agents is valid; old managed links must be retired.
EMPTY_REPO="$TMP_ROOT/empty-agent-repo"
EMPTY_HOME="$TMP_ROOT/empty-agent-home"
make_test_repo "$EMPTY_REPO"
prepare_legacy_profiles "$EMPTY_HOME" "$EMPTY_REPO"
ln -s "$EMPTY_REPO/.ai-runtime/pi/agents/researcher.md" "$EMPTY_HOME/.pi/agent/agents/researcher.md"
ln -s "$EMPTY_REPO/.ai-runtime/pi/agents/review.md" "$EMPTY_HOME/.pi/agent/agents/review.md"
mkdir -p "$EMPTY_HOME/.claude/agents"
for name in librarian oracle; do
  ln -s "$EMPTY_REPO/claude/agents/$name.md" "$EMPTY_HOME/.claude/agents/$name.md"
done
printf '%s\n' '# Managed by ~/.dotfiles/ai/install.sh. Edit source files instead.' > "$EMPTY_HOME/.claude/agents/review.md"
printf 'user-owned advisor\n' > "$EMPTY_HOME/.claude/agents/custom.md"
ln -s "$EMPTY_HOME/missing-advisor" "$EMPTY_HOME/.claude/agents/custom-link.md"
HOME="$EMPTY_HOME" PATH="$TEST_PATH" sh "$EMPTY_REPO/ai/install.sh" >"$TMP_ROOT/empty-agent.log" 2>&1
for target in "$EMPTY_HOME/.pi/agent/agents/researcher.md" "$EMPTY_HOME/.pi/agent/agents/review.md" "$EMPTY_HOME/.claude/agents/librarian.md" "$EMPTY_HOME/.claude/agents/oracle.md" "$EMPTY_HOME/.claude/agents/review.md"; do
  [ ! -e "$target" ] && [ ! -L "$target" ] || fail "retired agent survived: $target"
done
assert_file_contains "$EMPTY_HOME/.claude/agents/custom.md" 'user-owned advisor'
[ -L "$EMPTY_HOME/.claude/agents/custom-link.md" ] || fail "unrelated broken advisor link removed"
# Same-name user-owned replacements must survive repeated installation.
for name in librarian oracle review; do
  printf 'user-owned replacement\n' > "$EMPTY_HOME/.claude/agents/$name.md"
done
HOME="$EMPTY_HOME" PATH="$TEST_PATH" sh "$EMPTY_REPO/ai/install.sh" >"$TMP_ROOT/agent-preservation.log" 2>&1
for name in librarian oracle review; do
  assert_file_contains "$EMPTY_HOME/.claude/agents/$name.md" 'user-owned replacement'
done

# Instructions and skills install without publishing any agent definitions.
SUCCESS_REPO="$TMP_ROOT/success-repo"
SUCCESS_HOME="$TMP_ROOT/success-home"
make_test_repo "$SUCCESS_REPO"
# Old source directories must no longer activate agent publishing.
mkdir -p "$SUCCESS_REPO/pi/agents"
printf '%s\n' '---' 'name: fixture' '---' 'Test fixture agent.' > "$SUCCESS_REPO/pi/agents/fixture.md"
SUCCESS_REPO_PHYSICAL="$(cd "$SUCCESS_REPO" && pwd -P)"
prepare_legacy_profiles "$SUCCESS_HOME" "$SUCCESS_REPO"
# Seed the old standalone projection and its installed link to test cleanup.
mkdir -p "$SUCCESS_REPO/.ai-runtime/claude-code/skills/principle-boundary-discipline" "$SUCCESS_HOME/.claude/skills"
printf 'old principle skill\n' > "$SUCCESS_REPO/.ai-runtime/claude-code/skills/principle-boundary-discipline/SKILL.md"
ln -s "$SUCCESS_REPO_PHYSICAL/.ai-runtime/claude-code/skills/principle-boundary-discipline" "$SUCCESS_HOME/.claude/skills/principle-boundary-discipline"
mkdir -p "$SUCCESS_REPO/.ai-runtime/pi/skills/handoff" "$SUCCESS_REPO/.ai-runtime/claude-code/skills/handoff"
printf 'retired handoff\n' > "$SUCCESS_REPO/.ai-runtime/pi/skills/handoff/SKILL.md"
ln -s "$SUCCESS_REPO_PHYSICAL/.ai-runtime/claude-code/skills/handoff" "$SUCCESS_HOME/.claude/skills/handoff"
# Seed the abandoned dotfiles coding corpus to prove replacement, not overlay.
# The published collection has no references/ tree; stale resources must disappear.
for provider in pi codex claude-code opencode; do
  mkdir -p "$SUCCESS_REPO/.ai-runtime/$provider/skills/coding-standards/references"
  printf 'obsolete October reference\n' > "$SUCCESS_REPO/.ai-runtime/$provider/skills/coding-standards/references/effect.md"
done
# Seed every retired projection and each installed alias, plus user-owned entries.
for provider in pi codex claude-code opencode; do
  for retired in $RETIRED_SKILLS; do
    mkdir -p "$SUCCESS_REPO/.ai-runtime/$provider/skills/$retired"
    printf 'retired skill\n' > "$SUCCESS_REPO/.ai-runtime/$provider/skills/$retired/SKILL.md"
  done
done
mkdir -p "$SUCCESS_HOME/custom-skill"
for directory in "$SUCCESS_REPO/.agents/skills" "$SUCCESS_REPO/.claude/skills" "$SUCCESS_HOME/.claude/skills" "$SUCCESS_HOME/.config/opencode/skill"; do
  case "$directory" in
    */.agents/skills) provider=codex ;;
    */.config/opencode/skill) provider=opencode ;;
    *) provider=claude-code ;;
  esac
  mkdir -p "$directory/custom-directory"
  printf 'user-owned skill\n' > "$directory/custom-directory/SKILL.md"
  ln -s "$SUCCESS_HOME/custom-skill" "$directory/custom-link"
  ln -s "$SUCCESS_HOME/missing-custom-skill" "$directory/custom-broken-link"
  for retired in $RETIRED_SKILLS; do
    # Cross-provider links remain live until the later Pi tree swap.
    old_provider="$provider"
    [ "$retired" != moja-glava ] || old_provider=pi
    ln -s "$SUCCESS_REPO_PHYSICAL/.ai-runtime/$old_provider/skills/$retired" "$directory/$retired"
  done
done
# Former global entry points also need exact-link cleanup after the Pi swap.
for directory in "$SUCCESS_HOME/.agents/skills" "$SUCCESS_HOME/.codex/skills" "$SUCCESS_HOME/.pi/agent/skills"; do
  mkdir -p "$directory"
  ln -s "$SUCCESS_REPO/.ai-runtime/pi/skills/moja-glava" "$directory/moja-glava"
  ln -s "$SUCCESS_REPO/.ai-runtime/pi/skills/other-name" "$directory/custom-alias"
  ln -s "$SUCCESS_REPO/.ai-runtime/custom/skills/retired" "$directory/retired"
done
HOME="$SUCCESS_HOME" PATH="$TEST_PATH" sh "$SUCCESS_REPO/ai/install.sh" >"$TMP_ROOT/migration.log" 2>&1
for directory in "$SUCCESS_HOME/.agents/skills" "$SUCCESS_HOME/.codex/skills" "$SUCCESS_HOME/.pi/agent/skills"; do
  [ ! -L "$directory/moja-glava" ] || fail 'old global link survived'
  [ -L "$directory/custom-alias" ] || fail 'alias into managed tree removed'
  [ -L "$directory/retired" ] || fail 'unknown provider link removed'
done
assert_retired_skill_cleanup
[ ! -e "$SUCCESS_HOME/.claude/skills/handoff" ] && [ ! -L "$SUCCESS_HOME/.claude/skills/handoff" ] || fail "retired handoff link survived"
[ ! -e "$SUCCESS_HOME/.claude/skills/principle-boundary-discipline" ] && [ ! -L "$SUCCESS_HOME/.claude/skills/principle-boundary-discipline" ] || fail "stale installed principle link survived"
for profile in agent; do
  [ "$(readlink "$SUCCESS_HOME/.pi/$profile/AGENTS.md")" = "$SUCCESS_REPO_PHYSICAL/.ai-runtime/pi/AGENTS.md" ] || fail "$profile instruction link was not migrated"
  [ -d "$SUCCESS_HOME/.pi/$profile/agents" ] && [ ! -L "$SUCCESS_HOME/.pi/$profile/agents" ] || fail "$profile agents directory is not real"
  [ ! -e "$SUCCESS_HOME/.pi/$profile/agents/fixture.md" ] || fail "installer published an agent"
  [ ! -e "$SUCCESS_REPO/.ai-runtime/pi/agents" ] || fail "generated agent tree survived"
done
# Only the 2 machine-owned skills belong in dotfiles projections.
for provider in pi codex claude-code opencode; do
  skills="$SUCCESS_REPO/.ai-runtime/$provider/skills"
  for skill in apple-reminders dotfiles-dev; do
    diff -r "$SUCCESS_REPO/ai/skills/$skill" "$skills/$skill" || fail "$provider changed $skill"
  done
  [ "$(ls "$skills" | wc -l | tr -d ' ')" = 2 ] || fail "$provider publishes non-local skills"
done
[ -f "$SUCCESS_HOME/.pi/agent/AGENTS.md" ] || fail "legacy fallback was modified"
printf '%s\n' 'custom agent' > "$SUCCESS_HOME/.pi/agent/agents/custom.md"
printf '%s\n' 'custom chain' > "$SUCCESS_HOME/.pi/agent/agents/custom.chain.md"
ln -s "$SUCCESS_HOME/missing-custom-agent.md" "$SUCCESS_HOME/.pi/agent/agents/custom-link.md"
HOME="$SUCCESS_HOME" PATH="$TEST_PATH" sh "$SUCCESS_REPO/ai/install.sh" >"$TMP_ROOT/idempotence.log" 2>&1
assert_retired_skill_cleanup
for instruction in \
  "$SUCCESS_HOME/.AGENTS.md" \
  "$SUCCESS_HOME/.claude/CLAUDE.md" \
  "$SUCCESS_REPO/.ai-runtime/pi/AGENTS.md" \
  "$SUCCESS_HOME/.config/opencode/AGENTS.md" \
  "$SUCCESS_HOME/.codex/instructions.md" \
  "$SUCCESS_HOME/.gemini/GEMINI.md"; do
  assert_file_contains "$instruction" 'ai/references/project-defaults.md'
  assert_file_contains "$instruction" '## Project Authority'
  if grep -Eq 'Parse and validate inputs at boundaries|Preserve type safety and existing invariants|thin end-to-end slices' "$instruction"; then
    fail "installed instructions retain global engineering prescriptions: $instruction"
  fi
  if grep -Fq 'implementation-spec.md' "$instruction"; then
    fail "installed instructions retain the retired spec pointer: $instruction"
  fi
done
for provider in pi codex claude-code opencode; do
  [ ! -e "$SUCCESS_REPO/.ai-runtime/$provider/skills/coding-standards/references" ] || fail "$provider restored the abandoned coding corpus on repeat install"
done
for directory in "$SUCCESS_REPO/.agents/skills" "$SUCCESS_REPO/.claude/skills" "$SUCCESS_HOME/.claude/skills" "$SUCCESS_HOME/.config/opencode/skill"; do
  for skill in apple-reminders dotfiles-dev; do
    [ -L "$directory/$skill" ] && [ -s "$directory/$skill/SKILL.md" ] || fail "missing installed skill link: $directory/$skill"
  done
done
[ -f "$SUCCESS_HOME/.pi/agent/agents/custom.md" ] || fail "custom agent was removed"
[ -f "$SUCCESS_HOME/.pi/agent/agents/custom.chain.md" ] || fail "custom chain was removed"
[ "$(readlink "$SUCCESS_HOME/.pi/agent/agents/custom-link.md")" = "$SUCCESS_HOME/missing-custom-agent.md" ] || fail "custom broken agent link changed"
[ ! -e "$SUCCESS_HOME/.pi/personal/agents/custom.md" ] || fail "work custom agent crossed profiles"
# Agent directories may themselves be user-owned links; do not traverse them.
mv "$SUCCESS_HOME/.pi/agent/agents" "$SUCCESS_HOME/custom-agents"
ln -s "$SUCCESS_HOME/custom-agents" "$SUCCESS_HOME/.pi/agent/agents"
printf 'user-owned review\n' > "$SUCCESS_HOME/custom-agents/review.md"
HOME="$SUCCESS_HOME" PATH="$TEST_PATH" sh "$SUCCESS_REPO/ai/install.sh" >"$TMP_ROOT/custom-agent-directory.log" 2>&1
[ "$(readlink "$SUCCESS_HOME/.pi/agent/agents")" = "$SUCCESS_HOME/custom-agents" ] || fail "custom agent directory changed"
assert_file_contains "$SUCCESS_HOME/custom-agents/review.md" "user-owned review"

# Same-name collisions must survive, including broken links and --force.
rm "$SUCCESS_HOME/.claude/skills/apple-reminders" "$SUCCESS_HOME/.claude/skills/dotfiles-dev"
ln -s "$SUCCESS_HOME/missing-user-skill" "$SUCCESS_HOME/.claude/skills/apple-reminders"
mkdir "$SUCCESS_HOME/.claude/skills/dotfiles-dev"
printf 'user skill\n' > "$SUCCESS_HOME/.claude/skills/dotfiles-dev/SKILL.md"
HOME="$SUCCESS_HOME" PATH="$TEST_PATH" sh "$SUCCESS_REPO/ai/install.sh" --force >"$TMP_ROOT/skill-collision.log" 2>&1
[ "$(readlink "$SUCCESS_HOME/.claude/skills/apple-reminders")" = "$SUCCESS_HOME/missing-user-skill" ] || fail 'broken same-name link replaced'
assert_file_contains "$SUCCESS_HOME/.claude/skills/dotfiles-dev/SKILL.md" 'user skill'
# Never publish into a user-owned skill directory symlink.
mv "$SUCCESS_HOME/.claude/skills" "$SUCCESS_HOME/custom-skills"
ln -s "$SUCCESS_HOME/custom-skills" "$SUCCESS_HOME/.claude/skills"
ln -s "$SUCCESS_REPO/.ai-runtime/claude-code/skills/moja-glava" "$SUCCESS_HOME/custom-skills/moja-glava"
HOME="$SUCCESS_HOME" PATH="$TEST_PATH" sh "$SUCCESS_REPO/ai/install.sh" >"$TMP_ROOT/skill-directory.log" 2>&1
[ -L "$SUCCESS_HOME/custom-skills/moja-glava" ] || fail 'traversed user skill directory link'

# Redirected ancestors must block both publication and retirement cleanup.
# Use real skills/ leaves so checking only that last component cannot pass.
rm "$SUCCESS_HOME/.claude/skills"
mkdir "$SUCCESS_HOME/.claude/skills"
for parent in "$SUCCESS_HOME/.agents" "$SUCCESS_HOME/.claude" "$SUCCESS_REPO/.agents"; do
  mkdir -p "$parent/skills"
  [ ! -L "$parent/skills/apple-reminders" ] || rm "$parent/skills/apple-reminders"
  [ ! -L "$parent/skills/moja-glava" ] || rm "$parent/skills/moja-glava"
  ln -s "$SUCCESS_REPO/.ai-runtime/pi/skills/moja-glava" "$parent/skills/moja-glava"
  mv "$parent" "$parent.redirected"
  ln -s "$parent.redirected" "$parent"
done
HOME="$SUCCESS_HOME" PATH="$TEST_PATH" sh "$SUCCESS_REPO/ai/install.sh" >"$TMP_ROOT/skill-ancestor.log" 2>&1
for parent in "$SUCCESS_HOME/.agents" "$SUCCESS_HOME/.claude" "$SUCCESS_REPO/.agents"; do
  [ "$(readlink "$parent")" = "$parent.redirected" ] || fail 'redirected ancestor changed'
  [ -L "$parent/skills/moja-glava" ] || fail 'cleanup traversed redirected ancestor'
  [ ! -e "$parent/skills/apple-reminders" ] && [ ! -L "$parent/skills/apple-reminders" ] || fail 'publication traversed redirected ancestor'
done

# Instruction ownership remains fail-closed even with no agent publisher.
rm "$SUCCESS_HOME/.pi/agent/AGENTS.md"
printf 'user-owned instructions\n' > "$SUCCESS_HOME/.pi/agent/AGENTS.md"
cp "$SUCCESS_REPO/.ai-runtime/pi/AGENTS.md" "$TMP_ROOT/previous-instructions"
if HOME="$SUCCESS_HOME" PATH="$TEST_PATH" sh "$SUCCESS_REPO/ai/install.sh" >"$TMP_ROOT/collision.log" 2>&1; then
  fail "instruction collision unexpectedly succeeded"
fi
assert_file_contains "$TMP_ROOT/collision.log" "not the installer-managed link"
assert_file_contains "$SUCCESS_HOME/.pi/agent/AGENTS.md" "user-owned instructions"
cmp "$SUCCESS_REPO/.ai-runtime/pi/AGENTS.md" "$TMP_ROOT/previous-instructions" || fail "instruction collision replaced active tree"

# Ongoing installers must not manage retired profiles.
if grep -Eq '\.pi/(work|personal)' "$ROOT/pi/install.sh" "$ROOT/ai/install.sh"; then
  fail "installer still targets retired profiles"
fi
assert_file_contains "$SUCCESS_HOME/.pi/work/settings.json" 'retired profile sentinel'

echo "ai/install Pi cutover tests passed"
