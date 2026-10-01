#!/bin/sh
# Focused regression coverage for Pi's generated-resource cutover.
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
TMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/dotfiles-ai-install.XXXXXX")"
TMP_ROOT="$(cd "$TMP_ROOT" && pwd -P)"
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

# An incomplete stage must fail validation without replacing the active tree.
EMPTY_REPO="$TMP_ROOT/empty-agent-repo"
EMPTY_HOME="$TMP_ROOT/empty-agent-home"
make_test_repo "$EMPTY_REPO"
prepare_legacy_profiles "$EMPTY_HOME" "$EMPTY_REPO"
rm "$EMPTY_REPO/ai/agents/review.body.md" "$EMPTY_REPO/pi/agents/researcher.md"
if HOME="$EMPTY_HOME" PATH="$TEST_PATH" sh "$EMPTY_REPO/ai/install.sh" >"$TMP_ROOT/empty-agent.log" 2>&1; then
  fail "agent-less staged Pi tree unexpectedly succeeded"
fi
assert_file_contains "$TMP_ROOT/empty-agent.log" "staged Pi tree contains no managed agents"
assert_file_contains "$EMPTY_REPO/.ai-runtime/pi/AGENTS.md" "previous generated tree"
[ "$(readlink "$EMPTY_HOME/.pi/agent/AGENTS.md")" = "$EMPTY_REPO/.ai-runtime/pi/AGENTS.md" ] || fail "agent-less stage changed instruction link"

# Exact legacy links migrate, while custom profile-local agents and chains stay
# in their own real directories. A same-name regular file must stop the run.
SUCCESS_REPO="$TMP_ROOT/success-repo"
SUCCESS_HOME="$TMP_ROOT/success-home"
make_test_repo "$SUCCESS_REPO"
SUCCESS_REPO_PHYSICAL="$(cd "$SUCCESS_REPO" && pwd -P)"
prepare_legacy_profiles "$SUCCESS_HOME" "$SUCCESS_REPO"
# Seed the old standalone projection and its installed link to test cleanup.
mkdir -p "$SUCCESS_REPO/.ai-runtime/claude-code/skills/principle-boundary-discipline" "$SUCCESS_HOME/.claude/skills"
printf 'old principle skill\n' > "$SUCCESS_REPO/.ai-runtime/claude-code/skills/principle-boundary-discipline/SKILL.md"
ln -s "$SUCCESS_REPO_PHYSICAL/.ai-runtime/claude-code/skills/principle-boundary-discipline" "$SUCCESS_HOME/.claude/skills/principle-boundary-discipline"
mkdir -p "$SUCCESS_REPO/.ai-runtime/pi/skills/handoff" "$SUCCESS_REPO/.ai-runtime/claude-code/skills/handoff"
printf 'retired handoff\n' > "$SUCCESS_REPO/.ai-runtime/pi/skills/handoff/SKILL.md"
ln -s "$SUCCESS_REPO_PHYSICAL/.ai-runtime/claude-code/skills/handoff" "$SUCCESS_HOME/.claude/skills/handoff"
HOME="$SUCCESS_HOME" PATH="$TEST_PATH" sh "$SUCCESS_REPO/ai/install.sh" >"$TMP_ROOT/migration.log" 2>&1
[ ! -e "$SUCCESS_HOME/.claude/skills/handoff" ] && [ ! -L "$SUCCESS_HOME/.claude/skills/handoff" ] || fail "retired handoff link survived"
[ ! -e "$SUCCESS_HOME/.claude/skills/principle-boundary-discipline" ] && [ ! -L "$SUCCESS_HOME/.claude/skills/principle-boundary-discipline" ] || fail "stale installed principle link survived"
for profile in agent; do
  [ "$(readlink "$SUCCESS_HOME/.pi/$profile/AGENTS.md")" = "$SUCCESS_REPO_PHYSICAL/.ai-runtime/pi/AGENTS.md" ] || fail "$profile instruction link was not migrated"
  [ -d "$SUCCESS_HOME/.pi/$profile/agents" ] && [ ! -L "$SUCCESS_HOME/.pi/$profile/agents" ] || fail "$profile agents directory is not real"
  [ "$(readlink "$SUCCESS_HOME/.pi/$profile/agents/review.md")" = "$SUCCESS_REPO_PHYSICAL/.ai-runtime/pi/agents/review.md" ] || fail "$profile review agent was not linked individually"
  [ "$(readlink "$SUCCESS_HOME/.pi/$profile/agents/researcher.md")" = "$SUCCESS_REPO_PHYSICAL/.ai-runtime/pi/agents/researcher.md" ] || fail "$profile researcher agent was not linked individually"
  cmp "$SUCCESS_REPO/pi/agents/researcher.md" "$SUCCESS_HOME/.pi/$profile/agents/researcher.md" || fail 'researcher projection changed content'
done
# Installed instructions must resolve scripts against the published tree, not
# the temporary directory used while constructing it.
PI_SKILLS="$SUCCESS_REPO_PHYSICAL/.ai-runtime/pi/skills"
for instruction in \
  "$PI_SKILLS/impeccable/SKILL.md" \
  "$PI_SKILLS/impeccable/reference/live.md" \
  "$PI_SKILLS/impeccable/reference/teach.md" \
  "$PI_SKILLS/moja-glava/SKILL.md" \
  "$PI_SKILLS/moja-glava/references/studying.md"; do
  [ -f "$instruction" ] || fail "missing installed instruction $instruction"
done
CHECKER="$TMP_ROOT/check-pi-script-references.cjs"
cat > "$CHECKER" <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const [root, directory] = process.argv.slice(2);
const counts = new Map([['impeccable', 0], ['moja-glava', 0]]);
function check(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      check(file);
    } else if (entry.isFile() && file.endsWith('.md')) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('/.pi.stage.')) throw new Error(`stale staging reference in ${file}`);
      for (const match of content.matchAll(/(\/[^\s"'<>`]+\/skills\/([^/\s"'<>`]+)\/scripts)\/([^\s"'<>`]+)/g)) {
        const [, scriptsDirectory, skill, scriptName] = match;
        if (!scriptsDirectory.startsWith('/')) continue;
        const expectedDirectory = path.join(root, skill, 'scripts');
        if (scriptsDirectory !== expectedDirectory) {
          throw new Error(`wrong published script root ${scriptsDirectory}; expected ${expectedDirectory} in ${file}`);
        }
        const script = path.join(scriptsDirectory, scriptName);
        if (!fs.existsSync(script)) throw new Error(`missing referenced script ${script} from ${file}`);
        if (counts.has(skill)) counts.set(skill, counts.get(skill) + 1);
      }
    }
  }
}
check(directory);
for (const [skill, count] of counts) {
  if (count === 0) throw new Error(`no installed ${skill} script references were checked`);
}
NODE
"$NODE" "$CHECKER" "$PI_SKILLS" "$PI_SKILLS"
# Deliberately reference a missing file to verify that the checker fails closed.
NEGATIVE_ROOT="$TMP_ROOT/negative-pi-skills"
mkdir -p "$NEGATIVE_ROOT/impeccable"
printf '%s\n' "$PI_SKILLS/impeccable/scripts/missing-regression-file.mjs" > "$NEGATIVE_ROOT/impeccable/SKILL.md"
if "$NODE" "$CHECKER" "$PI_SKILLS" "$NEGATIVE_ROOT" >"$TMP_ROOT/missing-reference.log" 2>&1; then
  fail "script-reference checker accepted a missing file"
fi
assert_file_contains "$TMP_ROOT/missing-reference.log" "missing referenced script"
for skill in impeccable moja-glava; do
  [ -d "$PI_SKILLS/$skill/scripts" ] || fail "missing published $skill scripts"
done
# Other providers continue to reference their own published projection roots.
for provider in codex claude-code opencode; do
  provider_skills="$SUCCESS_REPO_PHYSICAL/.ai-runtime/$provider/skills"
  assert_file_contains "$provider_skills/impeccable/SKILL.md" "$provider_skills/impeccable/scripts"
done
# Progressive disclosure must survive projection with its supporting resources.
for provider in pi codex claude-code opencode; do
  skills="$SUCCESS_REPO/.ai-runtime/$provider/skills"
  [ ! -e "$skills/handoff" ] || fail "$provider retains the retired handoff skill"
  for reference in herdr/references/workflows.md mono-color/references/recipe.md mono-color/references/color-and-layout.md mono-color/references/image-and-type.md mono-color/references/composition.md mono-color/references/production.md mono-color/references/inspection.md; do
    [ -s "$skills/$reference" ] || fail "$provider is missing $reference"
  done
  for principle in "$SUCCESS_REPO/ai/skills/mu-mode/principles"/*.md; do
    [ -s "$principle" ] || fail "Mu Mode has no bundled principles"
    name="$(basename "$principle")"
    cmp -s "$principle" "$skills/mu-mode/principles/$name" || fail "$provider changed or omitted $name"
  done
  for standalone in "$skills"/principle-*; do
    [ ! -e "$standalone" ] || fail "$provider exposes a standalone principle skill"
  done
  [ "$(find "$skills/mu-mode" -name SKILL.md | wc -l | tr -d ' ')" = 1 ] || fail "$provider exposes nested Mu Mode skills"
  assert_file_contains "$skills/mu-mode/SKILL.md" "disable-model-invocation: true"
  [ ! -e "$skills/implement" ] || fail "$provider retains the retired implement wrapper"
  [ -f "$skills/mermaid/tools/validate.sh" ] || fail "$provider lost the preserved Mermaid validator"
done
for provider in codex claude-code opencode; do
  if grep -R -Fq '/skill:' "$SUCCESS_REPO/.ai-runtime/$provider/skills"; then
    fail "$provider skill projection contains Pi-only /skill syntax"
  fi
done
[ -f "$SUCCESS_HOME/.pi/agent/AGENTS.md" ] || fail "legacy fallback was modified"
printf '%s\n' 'custom agent' > "$SUCCESS_HOME/.pi/agent/agents/custom.md"
printf '%s\n' 'custom chain' > "$SUCCESS_HOME/.pi/agent/agents/custom.chain.md"
ln -s "$SUCCESS_REPO_PHYSICAL/.ai-runtime/pi/agents/removed.md" "$SUCCESS_HOME/.pi/agent/agents/removed.md"
HOME="$SUCCESS_HOME" PATH="$TEST_PATH" sh "$SUCCESS_REPO/ai/install.sh" >"$TMP_ROOT/idempotence.log" 2>&1
[ -f "$SUCCESS_HOME/.pi/agent/agents/custom.md" ] || fail "custom agent was removed"
[ -f "$SUCCESS_HOME/.pi/agent/agents/custom.chain.md" ] || fail "custom chain was removed"
[ ! -e "$SUCCESS_HOME/.pi/agent/agents/removed.md" ] && [ ! -L "$SUCCESS_HOME/.pi/agent/agents/removed.md" ] || fail "stale managed agent link was preserved"
[ ! -e "$SUCCESS_HOME/.pi/personal/agents/custom.md" ] || fail "work custom agent crossed profiles"
rm "$SUCCESS_HOME/.pi/agent/agents/review.md"
printf '%s\n' 'user-owned collision' > "$SUCCESS_HOME/.pi/agent/agents/review.md"
if HOME="$SUCCESS_HOME" PATH="$TEST_PATH" sh "$SUCCESS_REPO/ai/install.sh" >"$TMP_ROOT/collision.log" 2>&1; then
  fail "managed-name collision unexpectedly succeeded"
fi
assert_file_contains "$TMP_ROOT/collision.log" "managed agent collision"
assert_file_contains "$SUCCESS_HOME/.pi/agent/agents/review.md" "user-owned collision"

# Ongoing installers must not manage retired profiles.
if grep -Eq '\.pi/(work|personal)' "$ROOT/pi/install.sh" "$ROOT/ai/install.sh"; then
  fail "installer still targets retired profiles"
fi
assert_file_contains "$SUCCESS_HOME/.pi/work/settings.json" 'retired profile sentinel'

echo "ai/install Pi cutover tests passed"
