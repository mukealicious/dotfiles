#!/bin/sh
# Hermetic coverage for the read-only D10 profile-boundary evidence command.
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
TMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/dotfiles-pi-profile-check.XXXXXX")"
trap 'rm -rf "$TMP_ROOT"' EXIT INT TERM
HOME_ROOT="$TMP_ROOT/home"
FAKE_BIN="$TMP_ROOT/bin"
mkdir -p "$HOME_ROOT/.pi/work" "$HOME_ROOT/.pi/personal" "$FAKE_BIN"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

assert_jq() {
  file="$1"
  expression="$2"
  jq -e "$expression" "$file" >/dev/null || fail "evidence assertion failed: $expression"
}

cat > "$FAKE_BIN/pi" <<'EOF'
#!/bin/sh
case "$PI_CODING_AGENT_DIR" in
  */personal)
    printf '%s\n' '{"status":"ready","provider":"openai-codex","authType":"oauth"}'
    ;;
  */work)
    printf '%s\n' '{"status":"ready","provider":"openai"}'
    ;;
  *)
    exit 1
    ;;
esac
EOF
cat > "$FAKE_BIN/herdr" <<'EOF'
#!/bin/sh
printf '%s\n' 'pi: current v8'
EOF
chmod +x "$FAKE_BIN/pi" "$FAKE_BIN/herdr"

make_profile() {
  profile="$1"
  profile_dir="$HOME_ROOT/.pi/$profile"
  mkdir -p "$profile_dir/agents" "$profile_dir/extensions" "$profile_dir/themes" \
    "$profile_dir/sessions" "$profile_dir/npm/node_modules/mitsupi/extensions" \
    "$profile_dir/npm/node_modules/mitsupi/skills"

  ln -s "$ROOT/.ai-runtime/pi/AGENTS.md" "$profile_dir/AGENTS.md"
  ln -s "$ROOT/.ai-runtime/pi/agents/review.md" "$profile_dir/agents/review.md"
  for source in "$ROOT/pi/extensions/"*.ts; do
    ln -s "$source" "$profile_dir/extensions/$(basename "$source")"
  done
  for source in "$ROOT/pi/themes/"*.json; do
    ln -s "$source" "$profile_dir/themes/$(basename "$source")"
  done
  ln -s "$ROOT/pi/node_modules" "$profile_dir/node_modules"

  cat > "$profile_dir/settings.json" <<EOF
{
  "theme": "gruvbox-dark",
  "defaultProvider": "$(if [ "$profile" = personal ]; then printf '%s' openai-codex; else printf '%s' openai; fi)",
  "skills": ["$ROOT/.ai-runtime/pi/skills"],
  "packages": [
    "$ROOT/pi/packages/pi-exa",
    "$ROOT/pi/packages/pi-parallel",
    "$ROOT/pi/packages/pi-openai-fast",
    "$ROOT/pi/packages/pi-subagents",
    {
      "source": "npm:mitsupi@1.6.0",
      "extensions": [
        "extensions/answer.ts",
        "extensions/context.ts",
        "extensions/files.ts",
        "extensions/multi-edit.ts",
        "extensions/prompt-editor.ts",
        "extensions/todos.ts",
        "extensions/uv.ts",
        "extensions/whimsical.ts",
        "extensions/btw.ts",
        "extensions/review.ts"
      ],
      "skills": [
        "skills/apple-mail/SKILL.md",
        "skills/commit/SKILL.md",
        "skills/github/SKILL.md",
        "skills/google-workspace/SKILL.md",
        "skills/mermaid/SKILL.md",
        "skills/pi-share/SKILL.md",
        "skills/sentry/SKILL.md",
        "skills/summarize/SKILL.md",
        "skills/uv/SKILL.md"
      ],
      "prompts": [],
      "themes": []
    }
  ]
}
EOF
  printf '{}\n' > "$profile_dir/auth.json"
  printf '{}\n' > "$profile_dir/models-store.json"
  printf '{}\n' > "$profile_dir/trust.json"

  cat > "$profile_dir/npm/node_modules/mitsupi/package.json" <<'EOF'
{"name":"mitsupi","version":"1.6.0"}
EOF
  for extension in answer context files multi-edit prompt-editor todos uv whimsical btw review; do
    : > "$profile_dir/npm/node_modules/mitsupi/extensions/$extension.ts"
  done
  for skill in apple-mail commit github google-workspace mermaid pi-share sentry summarize uv; do
    mkdir -p "$profile_dir/npm/node_modules/mitsupi/skills/$skill"
    printf '%s\n' '---' "name: $skill" '---' > "$profile_dir/npm/node_modules/mitsupi/skills/$skill/SKILL.md"
  done
}

make_profile work
make_profile personal

# The absent fallback must stay absent; the command cannot create it.
set +e
PI_PROFILE_CHECK_PI_COMMAND="$FAKE_BIN/pi" \
PI_PROFILE_CHECK_HERDR_COMMAND="$FAKE_BIN/herdr" \
  "$ROOT/bin/pi-profile-check" --home "$HOME_ROOT" --repo "$ROOT" --large-session-bytes 1 > "$TMP_ROOT/absent.json"
status=$?
set -e
if [ "$status" -ne 0 ]; then
  jq '{blockers, profiles: [.profiles[] | {name, criteria, stateFailures: (.state.paths | to_entries | map(select(.value.owned == false or .value.safe == false)) | map(.key)), resourceFailures: (.resources | to_entries | map(select(.value.safe == false)) | map(.key))}]}' "$TMP_ROOT/absent.json" >&2
  fail "profile check failed for the healthy fixture"
fi
[ ! -e "$HOME_ROOT/.pi/agent" ] || fail "profile check created the absent fallback"
assert_jq "$TMP_ROOT/absent.json" '
  .deletion.status == "pass" and
  (.deletion.manualCommand | startswith("rm -rf -- ")) and
  .deletion.automationPerformed == false and
  .fallback.present == false and
  (.profiles | length) == 2 and
  all(.profiles[];
    .criteria.profilePass and
    .launch.auth.usable and
    .resources.mitsupi.safe and
    .resources.handoff.safe and
    .resources.projectedSkills.generatedRootConfigured and
    (.resources.projectedSkills.expected == .resources.projectedSkills.authored) and
    (.resources.projectedSkills.expected == .resources.projectedSkills.projected) and
    (.resources.packages.required == .resources.packages.requiredConfigured) and
    (.resources.packages.required == .resources.packages.requiredPresent)
  )
'
assert_jq "$TMP_ROOT/absent.json" '
  .sourceBoundary.pass and
  .sourceBoundary.localPackageFallbacks["pi-subagents"].compatibilityFallbackPresent and
  .sourceBoundary.localPackageFallbacks["pi-subagents"].profileEnvironmentPresent and
  .sourceBoundary.localPackageFallbacks["pi-openai-fast"].documented and
  .sourceBoundary.localPackageFallbacks["pi-openai-fast"].profileEnvironmentPresent and
  all(.sourceBoundary.sources[]; .operationalDependency == false)
'

# Fixed required manifests fail even when an authored skill and its projection disappear together.
BROKEN_REPO="$TMP_ROOT/broken-repo"
mkdir -p "$BROKEN_REPO/ai" "$BROKEN_REPO/.ai-runtime/pi"
cp -R "$ROOT/ai/skills" "$BROKEN_REPO/ai/skills"
cp -R "$ROOT/.ai-runtime/pi/skills" "$BROKEN_REPO/.ai-runtime/pi/skills"
rm -rf "$BROKEN_REPO/ai/skills/code-review" "$BROKEN_REPO/.ai-runtime/pi/skills/code-review"
set +e
PI_PROFILE_CHECK_PI_COMMAND="$FAKE_BIN/pi" \
PI_PROFILE_CHECK_HERDR_COMMAND="$FAKE_BIN/herdr" \
  "$ROOT/bin/pi-profile-check" --home "$HOME_ROOT" --repo "$BROKEN_REPO" > "$TMP_ROOT/missing-required-skill.json"
status=$?
set -e
[ "$status" -ne 0 ] || fail "missing authored and projected required skill was silently accepted"
assert_jq "$TMP_ROOT/missing-required-skill.json" '
  all(.profiles[];
    .resources.projectedSkills.expected == 31 and
    .resources.projectedSkills.authored == 30 and
    .resources.projectedSkills.projected == 30 and
    .resources.projectedSkills.safe == false
  )
'

# Ready-looking JSON from a failed auth command must not pass launch/auth checks.
cat > "$FAKE_BIN/pi-failed" <<'EOF'
#!/bin/sh
provider="openai"
case "$PI_CODING_AGENT_DIR" in
  */personal) provider="openai-codex" ;;
esac
printf '{"status":"ready","provider":"%s","authType":"api_key"}\n' "$provider"
exit 1
EOF
chmod +x "$FAKE_BIN/pi-failed"
set +e
PI_PROFILE_CHECK_PI_COMMAND="$FAKE_BIN/pi-failed" \
PI_PROFILE_CHECK_HERDR_COMMAND="$FAKE_BIN/herdr" \
  "$ROOT/bin/pi-profile-check" --home "$HOME_ROOT" --repo "$ROOT" > "$TMP_ROOT/failed-auth.json"
status=$?
set -e
[ "$status" -ne 0 ] || fail "failed auth command with ready JSON was silently accepted"
assert_jq "$TMP_ROOT/failed-auth.json" '
  (.deletion.status == "blocked") and
  (.deletion.manualCommand == null) and
  all(.profiles[]; (.launch.auth.commandSucceeded == false) and (.launch.auth.usable == false))
'

# Session evidence is metadata-only and offers an optional manual cleanup hint.
printf 'session metadata\n' > "$HOME_ROOT/.pi/work/sessions/work.jsonl"
printf 'personal session metadata\n' > "$HOME_ROOT/.pi/personal/sessions/personal.jsonl"
PI_PROFILE_CHECK_PI_COMMAND="$FAKE_BIN/pi" \
PI_PROFILE_CHECK_HERDR_COMMAND="$FAKE_BIN/herdr" \
  "$ROOT/bin/pi-profile-check" --home "$HOME_ROOT" --repo "$ROOT" --large-session-bytes 1 > "$TMP_ROOT/sessions.json"
assert_jq "$TMP_ROOT/sessions.json" '
  all(.profiles[]; .state.sessions.present and .state.sessions.large and .state.sessions.optionalManualDeletion and .state.sessions.safe)
'

# Known fallback categories are classified without printing entry names.
mkdir -p "$HOME_ROOT/.pi/agent/sessions" "$HOME_ROOT/.pi/agent/cache" \
  "$HOME_ROOT/.pi/agent/git/package-cache" "$HOME_ROOT/.pi/agent/skills/tldraw-offline" \
  "$HOME_ROOT/.pi/agent/extensions"
printf 'old session\n' > "$HOME_ROOT/.pi/agent/sessions/old.jsonl"
printf 'cache\n' > "$HOME_ROOT/.pi/agent/cache/index"
printf 'git package cache\n' > "$HOME_ROOT/.pi/agent/git/package-cache/index"
printf '%s\n' '<!-- Managed by ~/.dotfiles/ai/install.sh. Edit source files instead. -->' > "$HOME_ROOT/.pi/agent/AGENTS.md"
printf '%s\n' '---' 'name: tldraw-offline' 'description: fixture' '---' '<!-- installed-by:tldraw-desktop-agent-skills -->' > "$HOME_ROOT/.pi/agent/skills/tldraw-offline/SKILL.md"
printf '{}\n' > "$HOME_ROOT/.pi/agent/auth.json"
ln -s "$ROOT/pi/extensions/notify.ts" "$HOME_ROOT/.pi/agent/extensions/notify.ts"
FALLBACK_BEFORE="$(tar -C "$HOME_ROOT/.pi/agent" -cf - . | shasum -a 256 | awk '{print $1}')"
PI_PROFILE_CHECK_PI_COMMAND="$FAKE_BIN/pi" \
PI_PROFILE_CHECK_HERDR_COMMAND="$FAKE_BIN/herdr" \
  "$ROOT/bin/pi-profile-check" --home "$HOME_ROOT" --repo "$ROOT" > "$TMP_ROOT/known-fallback.json"
FALLBACK_AFTER="$(tar -C "$HOME_ROOT/.pi/agent" -cf - . | shasum -a 256 | awk '{print $1}')"
[ "$FALLBACK_BEFORE" = "$FALLBACK_AFTER" ] || fail "profile check modified fallback bytes"
assert_jq "$TMP_ROOT/known-fallback.json" '
  .fallback.present and
  (.fallback.categories | map(.category) | index("unsupported_historical_sessions_state")) and
  (.fallback.categories | map(.category) | index("cache")) and
  (.fallback.categories | map(.category) | index("stale_generated_resources_integration")) and
  (.fallback.unknownUserOwnedData == false) and
  (.deletion.status == "pass") and
  (.deletion.manualCommand | startswith("rm -rf -- "))
'

# A known generated name with the wrong file kind is treated as user-owned data.
rm "$HOME_ROOT/.pi/agent/extensions/notify.ts"
printf 'custom replacement\n' > "$HOME_ROOT/.pi/agent/extensions/notify.ts"
set +e
PI_PROFILE_CHECK_PI_COMMAND="$FAKE_BIN/pi" \
PI_PROFILE_CHECK_HERDR_COMMAND="$FAKE_BIN/herdr" \
  "$ROOT/bin/pi-profile-check" --home "$HOME_ROOT" --repo "$ROOT" > "$TMP_ROOT/replaced-known-fallback.json"
status=$?
set -e
[ "$status" -ne 0 ] || fail "custom replacement at a known fallback path was silently accepted"
assert_jq "$TMP_ROOT/replaced-known-fallback.json" '
  .fallback.unknownUserOwnedData and
  .deletion.status == "manual_review" and
  .deletion.manualCommand == null
'
if grep -Fq 'notify.ts' "$TMP_ROOT/replaced-known-fallback.json" || grep -Fq 'custom replacement' "$TMP_ROOT/replaced-known-fallback.json"; then
  fail "fallback evidence exposed a replaced entry name or content"
fi
rm "$HOME_ROOT/.pi/agent/extensions/notify.ts"
ln -s "$ROOT/pi/extensions/notify.ts" "$HOME_ROOT/.pi/agent/extensions/notify.ts"

# Nested mutable-state links into the fallback or another profile are hard blockers.
ln -s "$HOME_ROOT/.pi/agent/sessions" "$HOME_ROOT/.pi/work/sessions/fallback-link"
set +e
PI_PROFILE_CHECK_PI_COMMAND="$FAKE_BIN/pi" \
PI_PROFILE_CHECK_HERDR_COMMAND="$FAKE_BIN/herdr" \
  "$ROOT/bin/pi-profile-check" --home "$HOME_ROOT" --repo "$ROOT" > "$TMP_ROOT/nested-fallback.json"
status=$?
set -e
[ "$status" -ne 0 ] || fail "nested fallback state crossing was silently accepted"
assert_jq "$TMP_ROOT/nested-fallback.json" '
  (.profiles[] | select(.name == "work") | .criteria.stateOwned == false) and
  (.profiles[] | select(.name == "work") | .state.paths.sessions.fallbackCrossings > 0)
'
rm "$HOME_ROOT/.pi/work/sessions/fallback-link"

ln -s "$HOME_ROOT/.pi/personal/sessions" "$HOME_ROOT/.pi/work/sessions/personal-link"
set +e
PI_PROFILE_CHECK_PI_COMMAND="$FAKE_BIN/pi" \
PI_PROFILE_CHECK_HERDR_COMMAND="$FAKE_BIN/herdr" \
  "$ROOT/bin/pi-profile-check" --home "$HOME_ROOT" --repo "$ROOT" > "$TMP_ROOT/cross-profile-state.json"
status=$?
set -e
[ "$status" -ne 0 ] || fail "nested cross-profile state crossing was silently accepted"
assert_jq "$TMP_ROOT/cross-profile-state.json" '
  (.profiles[] | select(.name == "work") | .criteria.stateOwned == false) and
  (.profiles[] | select(.name == "work") | .state.paths.sessions.externalCrossings > 0)
'
rm "$HOME_ROOT/.pi/work/sessions/personal-link"

# A required resource that traverses the fallback is a hard blocker.
rm "$HOME_ROOT/.pi/work/AGENTS.md"
ln -s "$HOME_ROOT/.pi/agent/AGENTS.md" "$HOME_ROOT/.pi/work/AGENTS.md"
set +e
PI_PROFILE_CHECK_PI_COMMAND="$FAKE_BIN/pi" \
PI_PROFILE_CHECK_HERDR_COMMAND="$FAKE_BIN/herdr" \
  "$ROOT/bin/pi-profile-check" --home "$HOME_ROOT" --repo "$ROOT" > "$TMP_ROOT/crossing.json"
status=$?
set -e
[ "$status" -ne 0 ] || fail "fallback resource crossing was silently accepted"
assert_jq "$TMP_ROOT/crossing.json" '
  (.profiles[] | select(.name == "work") | .resources.instructions.safe == false) and
  (.profiles[] | select(.name == "work") | .resources.instructions.fallbackCrossings > 0)
'
rm "$HOME_ROOT/.pi/work/AGENTS.md"
ln -s "$ROOT/.ai-runtime/pi/AGENTS.md" "$HOME_ROOT/.pi/work/AGENTS.md"

# Unknown user-owned data blocks the recommendation; it is never assumed safe.
mkdir -p "$HOME_ROOT/.pi/agent/extensions"
printf 'user review\n' > "$HOME_ROOT/.pi/agent/extensions/private-custom.ts"
set +e
PI_PROFILE_CHECK_PI_COMMAND="$FAKE_BIN/pi" \
PI_PROFILE_CHECK_HERDR_COMMAND="$FAKE_BIN/herdr" \
  "$ROOT/bin/pi-profile-check" --home "$HOME_ROOT" --repo "$ROOT" > "$TMP_ROOT/unknown-fallback.json"
status=$?
set -e
[ "$status" -ne 0 ] || fail "unknown fallback data was silently accepted"
assert_jq "$TMP_ROOT/unknown-fallback.json" '
  .fallback.unknownUserOwnedData and
  .fallback.manualReviewRequired and
  .deletion.status == "manual_review" and
  .deletion.manualCommand == null and
  (.blockers | index("fallback:unknown_user_owned"))
'
if grep -Fq 'private-custom.ts' "$TMP_ROOT/unknown-fallback.json" || grep -Fq 'user review' "$TMP_ROOT/unknown-fallback.json"; then
  fail "fallback evidence exposed an entry name or content"
fi

# A non-directory fallback root is user-owned data, never disposable state.
rm -rf "$HOME_ROOT/.pi/agent"
printf 'user file\n' > "$HOME_ROOT/.pi/agent"
set +e
PI_PROFILE_CHECK_PI_COMMAND="$FAKE_BIN/pi" \
PI_PROFILE_CHECK_HERDR_COMMAND="$FAKE_BIN/herdr" \
  "$ROOT/bin/pi-profile-check" --home "$HOME_ROOT" --repo "$ROOT" > "$TMP_ROOT/fallback-file.json"
status=$?
set -e
[ "$status" -ne 0 ] || fail "fallback file was silently accepted"
assert_jq "$TMP_ROOT/fallback-file.json" '
  .fallback.unknownUserOwnedData and
  .deletion.status == "manual_review" and
  .deletion.manualCommand == null
'

# The probe is read-only: deleting the test fixture is the only cleanup here.
rm "$HOME_ROOT/.pi/agent"
[ ! -e "$HOME_ROOT/.pi/agent" ] || fail "test fallback cleanup failed"

echo "Pi profile-boundary evidence tests passed"
