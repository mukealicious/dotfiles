#!/bin/sh
# Regression coverage for generated resources and shared-skill retirement.
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

RETIRED_SKILLS='coding-standards mu-mode mu-stack rat-stack tdd domain-modeling codebase-design code-review grill-with-docs build-skill agent-context librarian visual-deliverables'

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

# Exact legacy links migrate, while custom profile-local agents and chains stay
# in their own real directories. A same-name regular file must stop the run.
SUCCESS_REPO="$TMP_ROOT/success-repo"
SUCCESS_HOME="$TMP_ROOT/success-home"
make_test_repo "$SUCCESS_REPO"
# Exercise optional agent linking/collision handling without shipping a persona.
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
    ln -s "$SUCCESS_REPO_PHYSICAL/.ai-runtime/$provider/skills/$retired" "$directory/$retired"
  done
done
HOME="$SUCCESS_HOME" PATH="$TEST_PATH" sh "$SUCCESS_REPO/ai/install.sh" >"$TMP_ROOT/migration.log" 2>&1
assert_retired_skill_cleanup
[ ! -e "$SUCCESS_HOME/.claude/skills/handoff" ] && [ ! -L "$SUCCESS_HOME/.claude/skills/handoff" ] || fail "retired handoff link survived"
[ ! -e "$SUCCESS_HOME/.claude/skills/principle-boundary-discipline" ] && [ ! -L "$SUCCESS_HOME/.claude/skills/principle-boundary-discipline" ] || fail "stale installed principle link survived"
for profile in agent; do
  [ "$(readlink "$SUCCESS_HOME/.pi/$profile/AGENTS.md")" = "$SUCCESS_REPO_PHYSICAL/.ai-runtime/pi/AGENTS.md" ] || fail "$profile instruction link was not migrated"
  [ -d "$SUCCESS_HOME/.pi/$profile/agents" ] && [ ! -L "$SUCCESS_HOME/.pi/$profile/agents" ] || fail "$profile agents directory is not real"
  [ "$(readlink "$SUCCESS_HOME/.pi/$profile/agents/fixture.md")" = "$SUCCESS_REPO_PHYSICAL/.ai-runtime/pi/agents/fixture.md" ] || fail "$profile fixture agent was not linked individually"
  cmp "$SUCCESS_REPO/pi/agents/fixture.md" "$SUCCESS_HOME/.pi/$profile/agents/fixture.md" || fail 'fixture projection changed content'
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
  for skill in diagnosing-bugs write-discoverable-code uncomplect cloudflare-composition-root effect-service-design tech-spec writing-for-agents; do
    diff -r "$SUCCESS_REPO/ai/skills/$skill" "$skills/$skill" || fail "$provider changed or omitted $skill resources/metadata"
  done
  [ ! -e "$skills/coding-standards/references" ] || fail "$provider retains the abandoned coding corpus"
  for skipped in prelude bootstrap-prelude; do
    [ ! -e "$skills/$skipped" ] || fail "$provider imports skipped $skipped"
  done
  assert_file_contains "$skills/writing-for-agents/SKILL.md" 'disable-model-invocation: true'
  [ -s "$skills/writing-for-agents/SKILL-MECHANICS.md" ] || fail "$provider lost authoring mechanics"
  [ -s "$skills/writing-for-agents/agents/openai.yaml" ] || fail "$provider lost upstream authoring metadata"
  [ ! -e "$skills/writing-for-agents/scripts" ] && [ ! -e "$skills/writing-for-agents/references" ] || fail "$provider carried over retired authoring resources"
  assert_file_contains "$skills/tech-spec/SKILL.md" 'disable-model-invocation: true'
  [ ! -e "$skills/coding-standards" ] || fail "$provider retains the retired policy skill"
  assert_file_contains "$SUCCESS_REPO/ai/references/coding-standards/typescript.md" 'not active engineering policy'
  assert_file_contains "$SUCCESS_REPO/ai/references/coding-standards/typescript.md" '## Testing'
  for specialist in tech-spec cloudflare-composition-root effect-service-design write-discoverable-code; do
    if grep -Fq '../coding-standards/' "$skills/$specialist/SKILL.md"; then
      fail "$provider $specialist depends on the retired policy skill"
    fi
  done
  [ -s "$skills/diagnosing-bugs/scripts/hitl-loop.template.sh" ] || fail "$provider lost debugging template"
  [ -s "$skills/uncomplect/references/source-map.md" ] || fail "$provider lost Uncomplect source map"
  [ -s "$skills/uncomplect/evals/trigger-evals.json" ] || fail "$provider lost upstream evals"
  for standalone in "$skills"/principle-*; do
    [ ! -e "$standalone" ] || fail "$provider exposes a standalone principle skill"
  done
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
assert_retired_skill_cleanup
for instruction in \
  "$SUCCESS_HOME/.AGENTS.md" \
  "$SUCCESS_HOME/.claude/CLAUDE.md" \
  "$SUCCESS_REPO/.ai-runtime/pi/AGENTS.md" \
  "$SUCCESS_HOME/.config/opencode/AGENTS.md" \
  "$SUCCESS_HOME/.codex/instructions.md" \
  "$SUCCESS_HOME/.gemini/GEMINI.md"; do
  assert_file_contains "$instruction" 'ai/references/project-defaults.md'
  assert_file_contains "$instruction" '## Project Engineering Policy'
  if grep -Fq 'implementation-spec.md' "$instruction"; then
    fail "installed instructions retain the retired spec pointer: $instruction"
  fi
done
for provider in pi codex claude-code opencode; do
  [ ! -e "$SUCCESS_REPO/.ai-runtime/$provider/skills/coding-standards/references" ] || fail "$provider restored the abandoned coding corpus on repeat install"
done
for directory in "$SUCCESS_REPO/.agents/skills" "$SUCCESS_REPO/.claude/skills" "$SUCCESS_HOME/.claude/skills" "$SUCCESS_HOME/.config/opencode/skill"; do
  for skill in cloudflare-composition-root effect-service-design tech-spec writing-for-agents; do
    [ -L "$directory/$skill" ] && [ -s "$directory/$skill/SKILL.md" ] || fail "missing installed skill link: $directory/$skill"
  done
done
[ -f "$SUCCESS_HOME/.pi/agent/agents/custom.md" ] || fail "custom agent was removed"
[ -f "$SUCCESS_HOME/.pi/agent/agents/custom.chain.md" ] || fail "custom chain was removed"
[ ! -e "$SUCCESS_HOME/.pi/agent/agents/removed.md" ] && [ ! -L "$SUCCESS_HOME/.pi/agent/agents/removed.md" ] || fail "stale managed agent link was preserved"
[ ! -e "$SUCCESS_HOME/.pi/personal/agents/custom.md" ] || fail "work custom agent crossed profiles"
rm "$SUCCESS_HOME/.pi/agent/agents/fixture.md"
printf '%s\n' 'user-owned collision' > "$SUCCESS_HOME/.pi/agent/agents/fixture.md"
if HOME="$SUCCESS_HOME" PATH="$TEST_PATH" sh "$SUCCESS_REPO/ai/install.sh" >"$TMP_ROOT/collision.log" 2>&1; then
  fail "managed-name collision unexpectedly succeeded"
fi
assert_file_contains "$TMP_ROOT/collision.log" "managed agent collision"
assert_file_contains "$SUCCESS_HOME/.pi/agent/agents/fixture.md" "user-owned collision"

# Ongoing installers must not manage retired profiles.
if grep -Eq '\.pi/(work|personal)' "$ROOT/pi/install.sh" "$ROOT/ai/install.sh"; then
  fail "installer still targets retired profiles"
fi
assert_file_contains "$SUCCESS_HOME/.pi/work/settings.json" 'retired profile sentinel'

echo "ai/install Pi cutover tests passed"
