#!/bin/sh
# Hermetic native Pi installer regression tests. No package/network access.
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/pi-install.XXXXXX")"
TMP="$(cd "$TMP" && pwd -P)"
trap 'rm -rf "$TMP"' EXIT INT TERM
REPO="$TMP/repo"
export HOME="$TMP/home"
mkdir -p "$REPO" "$HOME/.bun/bin" "$TMP/bin" "$HOME/.pi/agent/git/github.com/mitsuhiko/agent-stuff/extensions" "$REPO/pi/packages/pi-subagents/node_modules"
for dependency_version in acorn:8.18.0 jiti:2.7.0 undici:8.10.2 yaml:2.8.3; do
  dependency="${dependency_version%%:*}"
  version="${dependency_version#*:}"
  mkdir -p "$REPO/pi/packages/pi-subagents/node_modules/$dependency"
  printf '{"name":"%s","version":"%s"}\n' "$dependency" "$version" > "$REPO/pi/packages/pi-subagents/node_modules/$dependency/package.json"
done
tar -C "$ROOT" --exclude=node_modules -cf - pi lib | tar -C "$REPO" -xf -
fail() { echo "FAIL: $*" >&2; exit 1; }
# Exact upstream bytes exercise the unmodified installer's production digest checks.
FAST_FIXTURE="$ROOT/pi/test-fixtures/pi-openai-fast-1.1.1-pristine-index.ts"
cp "$REPO/pi/packages/pi-subagents/node_modules/acorn/package.json" "$TMP/acorn.package.json"
cp "$REPO/pi/packages/pi-subagents/node_modules/jiti/package.json" "$TMP/jiti.package.json"
cp "$REPO/pi/packages/pi-subagents/node_modules/undici/package.json" "$TMP/undici.package.json"
cp "$REPO/pi/packages/pi-subagents/node_modules/yaml/package.json" "$TMP/yaml.package.json"
cat > "$HOME/.bun/bin/pi" <<'EOF'
#!/bin/sh
if [ "$1" = --version ]; then echo "${PI_FAKE_VERSION:-0.99.1}"; exit; fi
printf '%s %s\n' "$PI_CODING_AGENT_DIR" "$*" >> "$HOME/installs.log"
last_arg=
for arg do last_arg="$arg"; done
if [ "${PI_TEST_INSTALL_FAIL:-}" = "$last_arg" ]; then
  echo "injected install failure: $last_arg" >&2
  exit 29
fi
EOF
cat > "$TMP/bin/mise" <<'EOF'
#!/bin/sh
[ "$1" = exec ] || exit 1
shift
while [ "$1" != -- ]; do shift; done
shift
exec "$@"
EOF
printf '#!/bin/sh\necho called >> "$HOME/npm.log"\nexit 0\n' > "$TMP/bin/npm"
# No Parallel CLI installer or other network download belongs in this fixture.
printf '#!/bin/sh\necho unexpected-curl >> "$HOME/forbidden-network"; exit 1\n' > "$TMP/bin/curl"
chmod +x "$HOME/.bun/bin/pi" "$TMP/bin/"*
export PATH="$TMP/bin:$PATH"
PACKAGE="$HOME/.pi/agent/git/github.com/mitsuhiko/agent-stuff"
printf '{"name":"mitsupi","version":"1.6.0"}\n' > "$PACKAGE/package.json"
# Retired extension code and todo history must remain untouched.
printf 'inactive files extension\n' > "$PACKAGE/extensions/files.ts"
printf 'inactive todos extension\n' > "$PACKAGE/extensions/todos.ts"
mkdir -p "$REPO/.pi/todos"
printf 'closed historical todo\n' > "$REPO/.pi/todos/kept.md"
cp "$PACKAGE/extensions/files.ts" "$TMP/files.original"
cp "$PACKAGE/extensions/todos.ts" "$TMP/todos.original"
FAST_PACKAGE="$HOME/.pi/agent/npm/node_modules/@benvargas/pi-openai-fast"
mkdir -p "$FAST_PACKAGE/extensions" "$HOME/.pi/agent/extensions"
printf '{"name":"@benvargas/pi-openai-fast","version":"1.1.1"}\n' > "$FAST_PACKAGE/package.json"
cp "$FAST_FIXTURE" "$FAST_PACKAGE/extensions/index.ts"
printf '{"active":true,"persistState":false,"supportedModels":["custom/model"]}\n' > "$HOME/.pi/agent/extensions/pi-openai-fast.json"
cp "$HOME/.pi/agent/extensions/pi-openai-fast.json" "$TMP/fast-config"
# Older profiles are not ongoing installer targets.
mkdir -p "$HOME/.pi/personal" "$HOME/.pi/work"
printf 'untouched\n' > "$HOME/.pi/personal/settings.json"
printf 'untouched\n' > "$HOME/.pi/work/settings.json"
ln -s "$REPO/pi/extensions/handoff.ts" "$HOME/.pi/agent/extensions/handoff.ts"
ln -s "$REPO/pi/lib" "$HOME/.pi/agent/lib"
mkdir -p "$HOME/.pi/agent/sessions/handoff-connections"
printf 'preserved connection\n' > "$HOME/.pi/agent/sessions/handoff-connections/kept.json"
run() { sh "$REPO/pi/install.sh" > "$TMP/install.log" 2>&1; }
if (PI_FAKE_VERSION=0.98.0 run); then fail 'old Pi accepted'; fi
[ ! -e "$HOME/.pi/agent/settings.json" ] || fail 'version guard mutated settings'
# Fast patch preflight remains fail-closed.
cp "$FAST_PACKAGE/extensions/index.ts" "$TMP/fast.original"
printf 'unknown fast context\n' > "$FAST_PACKAGE/extensions/index.ts"
if run; then fail 'unknown fast patch context accepted'; fi
grep -qx 'unknown fast context' "$FAST_PACKAGE/extensions/index.ts" || fail 'fast preflight mutated unknown context'
[ ! -e "$HOME/.pi/agent/settings.json" ] || fail 'fast patch guard mutated settings'
cp "$TMP/fast.original" "$FAST_PACKAGE/extensions/index.ts"
# Alter a patched policy hunk; exact whole-file identity must reject it.
(cd "$FAST_PACKAGE" && patch -p1 -N -F 0 -f < "$ROOT/pi/patches/pi-openai-fast-1.1.1-policy.patch") >/dev/null
sed 's/configuration must be a JSON object/altered root-policy context/' "$FAST_PACKAGE/extensions/index.ts" > "$TMP/fast.partial-source"
mv "$TMP/fast.partial-source" "$FAST_PACKAGE/extensions/index.ts"
cp "$FAST_PACKAGE/extensions/index.ts" "$TMP/fast.unknown-root"
if run; then fail 'unknown root-policy context accepted'; fi
cmp "$TMP/fast.unknown-root" "$FAST_PACKAGE/extensions/index.ts" || fail 'partial patch context was modified'
[ ! -e "$HOME/.pi/agent/settings.json" ] || fail 'root-policy guard mutated settings'
cp "$TMP/fast.original" "$FAST_PACKAGE/extensions/index.ts"
# Dependency readiness fails before any profile settings or links are materialized.
mv "$REPO/pi/packages/pi-subagents/node_modules" "$TMP/subagents-node-modules"
if run; then fail 'missing runtime dependencies reported success'; fi
grep -Fq 'Stop all Pi/subagent runners' "$TMP/install.log" || fail 'missing dependency stop-runner instruction'
[ ! -e "$HOME/.pi/agent/settings.json" ] || fail 'dependency preflight ran after settings mutation'
[ ! -e "$HOME/.pi/agent/extensions/notify.ts" ] || fail 'dependency preflight ran after extension mutation'
cmp "$TMP/fast.original" "$FAST_PACKAGE/extensions/index.ts" || fail 'dependency preflight ran after fast package mutation'
[ ! -e "$HOME/installs.log" ] || fail 'dependency preflight ran after package installation'
[ ! -e "$HOME/npm.log" ] || fail 'dependency preflight invoked npm'
mkdir -p "$REPO/pi/packages/pi-subagents"
mv "$TMP/subagents-node-modules" "$REPO/pi/packages/pi-subagents/node_modules"
printf '{"name":"acorn","version":"0.0.0"}\n' > "$REPO/pi/packages/pi-subagents/node_modules/acorn/package.json"
if run; then fail 'wrong runtime dependency version reported success'; fi
grep -Fq 'does not match the lockfile' "$TMP/install.log" || fail 'wrong dependency diagnostic'
[ ! -e "$HOME/.pi/agent/settings.json" ] || fail 'wrong dependency preflight ran after settings mutation'
cmp "$TMP/fast.original" "$FAST_PACKAGE/extensions/index.ts" || fail 'wrong dependency preflight ran after fast package mutation'
printf '{"name":"acorn","version":"8.18.0"}\n' > "$REPO/pi/packages/pi-subagents/node_modules/acorn/package.json"
run || { tail -30 "$TMP/install.log"; fail install; }
SETTINGS="$HOME/.pi/agent/settings.json"
MODES="$HOME/.pi/agent/modes.json"
MODELS="$HOME/.pi/agent/models.json"
[ ! -e "$MODELS" ] || fail 'installer created competing native priority policy'
jq -e '.packages | index("npm:@benvargas/pi-openai-fast@1.1.1") != null and index("~/.dotfiles/pi/packages/pi-openai-fast") == null' "$SETTINGS" >/dev/null || fail 'fast package pin'
jq -e '.packages[] | select(type == "object" and .source == "~/.dotfiles/pi/packages/pi-subagents") | .skills == ["skills/pi-subagents/SKILL.md"] and .prompts == []' "$SETTINGS" >/dev/null || fail 'upstream subagent resource selection'
jq -e '.subagents.agentOverrides.scout | .model == "openai/gpt-6-luna" and .tools == ["read", "grep", "find", "ls"] and .output == false' "$SETTINGS" >/dev/null || fail 'scout policy'
grep -Fq 'ctx.isProjectTrusted()' "$FAST_PACKAGE/extensions/index.ts" || fail 'fast trust patch'
grep -Fq 'supportedModels must be an array' "$FAST_PACKAGE/extensions/index.ts" || fail 'fast allowlist patch'
grep -Fq 'configuration must be a JSON object' "$FAST_PACKAGE/extensions/index.ts" || fail 'fast config root patch'
grep -Fq 'ctx.ui.setStatus("pi-openai-fast", status)' "$FAST_PACKAGE/extensions/index.ts" || fail 'native fast footer status'
grep -Fq 'pi.on("model_select"' "$FAST_PACKAGE/extensions/index.ts" || fail 'fast footer model refresh'
grep -Fq '"openai/gpt-6.1-sol"' "$FAST_PACKAGE/extensions/index.ts" || fail 'Sol Fast default missing'
grep -Fq 'priority requested, not server-confirmed' "$FAST_PACKAGE/extensions/index.ts" || fail 'Fast request intent missing'
[ ! -L "$SETTINGS" ] || fail 'runtime settings are symlinks'
[ ! -e "$MODES" ] || fail 'retired modes baseline created'
jq -e '.defaultProvider == "openai" and .defaultModel == "gpt-6-astra" and .defaultTools == ["+codemode"] and ([.packages[] | select(type == "string") | contains("mcp-adapter")] | any | not)' "$SETTINGS" >/dev/null || fail 'native defaults'
jq -e '.packages[] | select(type == "object" and .source == "git:github.com/mitsuhiko/agent-stuff@0865c849befd2021490679f96a8dee58c84ac857") | .themes == [] and .prompts == [] and (.extensions == []) and (.skills | length == 8)' "$SETTINGS" >/dev/null || fail 'Mitsupi curation'
jq -e '(.skills | index("~/.dotfiles/.agents/skills") != null) and (.skills | index("!**/.dotfiles/.agents/skills/**") != null)' "$SETTINGS" >/dev/null || fail 'skill projection exclusion'
for extension in notify modes; do
  [ -L "$HOME/.pi/agent/extensions/$extension.ts" ] || fail "missing $extension"
done
[ -L "$HOME/.pi/agent/prompts/review.md" ] || fail 'native review prompt missing'
[ ! -e "$HOME/.pi/agent/extensions/usage-footer.ts" ] || fail 'legacy footer active'
[ ! -L "$HOME/.pi/agent/extensions/handoff.ts" ] || fail 'retired managed handoff link survived'
[ ! -L "$HOME/.pi/agent/lib" ] || fail 'retired managed library link survived'
grep -qx 'preserved connection' "$HOME/.pi/agent/sessions/handoff-connections/kept.json" || fail 'historical handoff data changed'
[ ! -e "$HOME/.pi/agent/mcp-adapter.json" ] || fail 'adapter config created'
[ ! -e "$HOME/forbidden-network" ] || fail 'unexpected network installer'
jq -e '[.packages[] | (if type == "object" then .source else . end) | select(contains("mitsupi") or contains("mitsuhiko/agent-stuff"))] == ["git:github.com/mitsuhiko/agent-stuff@0865c849befd2021490679f96a8dee58c84ac857"]' "$SETTINGS" >/dev/null || fail 'duplicate or legacy Mitsupi selection'
# Old mode data and inactive editor code must survive even if no longer valid.
printf 'legacy mode choices\n' > "$MODES"
printf 'retired editor, not a patch target\n' > "$PACKAGE/extensions/prompt-editor.ts"
cp "$MODES" "$TMP/legacy-modes"
cp "$PACKAGE/extensions/prompt-editor.ts" "$TMP/legacy-editor"
jq '.deviceId="stable-device" | .trackingId="tracking" | .lastChangelogVersion="version" | .defaultModel="chosen-model" | .defaultThinkingLevel="high" | .theme="chosen-theme" | .retry={"maxRetries":4} | .subagents.agentOverrides.worker.model="custom/model" | .subagents.agentOverrides.custom={"disabled":true} | .packages=["stale-package"]' "$SETTINGS" > "$TMP/settings"
mv "$TMP/settings" "$SETTINGS"
printf '{"mcpServers":{"custom":{"url":"https://example.com/mcp","enabled":false}}}\n' > "$HOME/.pi/agent/mcp.json"
cp "$HOME/.pi/agent/mcp.json" "$TMP/mcp"
# Removing the priority override must survive reinstalls, along with custom models.
printf '{"providers":{"custom":{"baseUrl":"http://localhost:1234","models":[{"id":"local"}]},"openai":{"modelOverrides":{"gpt-6-astra":{"samplingParams":{"service_tier":"priority","temperature":0.5}}}}}}\n' > "$MODELS"
cp "$MODELS" "$TMP/models"
run || fail 'second install'
run || fail 'third install'
cp "$FAST_PACKAGE/extensions/index.ts" "$TMP/fast.patched"
run || { tail -30 "$TMP/install.log"; fail 'exact-current fast reinstall'; }
cmp "$TMP/fast.patched" "$FAST_PACKAGE/extensions/index.ts" || fail 'fast patch idempotence'
# Upgrade the exact previous footer output without touching other resources.
(cd "$FAST_PACKAGE" && patch -R -p1 -F 0 -f < "$ROOT/pi/patches/pi-openai-fast-1.1.1-sol.patch") >/dev/null
cp "$SETTINGS" "$TMP/fast-only.settings"
cp "$HOME/installs.log" "$TMP/fast-only.installs"
sh "$REPO/pi/install.sh" --fast-only > "$TMP/install.log" 2>&1 || { tail -30 "$TMP/install.log"; fail 'Fast-only upgrade'; }
cmp "$TMP/fast.patched" "$FAST_PACKAGE/extensions/index.ts" || fail 'prior footer upgrade output differs'
cmp "$TMP/fast-only.settings" "$SETTINGS" || fail 'Fast-only changed settings'
cmp "$TMP/fast-only.installs" "$HOME/installs.log" || fail 'Fast-only installed unrelated packages'
cmp "$TMP/fast-config" "$HOME/.pi/agent/extensions/pi-openai-fast.json" || fail 'Fast-only changed policy'
# Upgrade the exact prior policy output in place; partial states fail closed.
(cd "$FAST_PACKAGE" && patch -R -p1 -F 0 -f < "$ROOT/pi/patches/pi-openai-fast-1.1.1-sol.patch" && patch -R -p1 -F 0 -f < "$ROOT/pi/patches/pi-openai-fast-1.1.1-footer-status.patch") >/dev/null
run || { tail -30 "$TMP/install.log"; fail 'previous policy output upgrade'; }
cmp "$TMP/fast.patched" "$FAST_PACKAGE/extensions/index.ts" || fail 'prior policy upgrade output differs'
cp "$FAST_PACKAGE/extensions/index.ts" "$TMP/fast.patched"
# The whole-file digest must reject edits outside every patch hunk too.
printf '\n// unexpected edit outside patch hunks\n' >> "$FAST_PACKAGE/extensions/index.ts"
cp "$FAST_PACKAGE/extensions/index.ts" "$TMP/fast.outside-edit"
if run; then fail 'outside-hunk fast edit accepted'; fi
cmp "$TMP/fast.outside-edit" "$FAST_PACKAGE/extensions/index.ts" || fail 'outside-hunk fast edit changed'
grep -Fq 'Unknown or partially patched Fast package context' "$TMP/install.log" || fail 'outside-hunk edit diagnostic'
cp "$TMP/fast.patched" "$FAST_PACKAGE/extensions/index.ts"
node -e 'const fs=require("fs"),p=process.argv[1];fs.writeFileSync(p,fs.readFileSync(p,"utf8").replace("ctx.ui.setStatus(\"pi-openai-fast\", status)","ctx.ui.setStatus(\"pi-openai-fast\", altered)"));' "$FAST_PACKAGE/extensions/index.ts"
cp "$FAST_PACKAGE/extensions/index.ts" "$TMP/fast.partial"
if run; then fail 'partial fast patch accepted'; fi
cmp "$TMP/fast.partial" "$FAST_PACKAGE/extensions/index.ts" || fail 'partial fast package mutated'
grep -Fq 'Reinstall npm:@benvargas/pi-openai-fast@1.1.1' "$TMP/install.log" || fail 'partial fast recovery hint'
cp "$TMP/fast.patched" "$FAST_PACKAGE/extensions/index.ts"
jq -e '.deviceId == "stable-device" and .trackingId == "tracking" and .lastChangelogVersion == "version" and .defaultModel == "chosen-model" and .defaultThinkingLevel == "high" and .theme == "chosen-theme" and .retry.maxRetries == 4 and (.packages | index("stale-package") == null)' "$SETTINGS" >/dev/null || fail 'runtime preferences or managed resources not preserved'
jq -e '.subagents.agentOverrides.worker.model == "custom/model" and .subagents.agentOverrides.custom.disabled == true' "$SETTINGS" >/dev/null || fail 'personal subagent overrides changed'
cmp "$TMP/mcp" "$HOME/.pi/agent/mcp.json" || fail 'machine MCP modified'
cmp "$TMP/models" "$MODELS" || fail 'runtime model preferences modified'
cmp "$TMP/files.original" "$PACKAGE/extensions/files.ts" || fail 'retired files extension modified'
cmp "$TMP/todos.original" "$PACKAGE/extensions/todos.ts" || fail 'retired todos extension modified'
grep -qx 'closed historical todo' "$REPO/.pi/todos/kept.md" || fail 'todo history changed'
cmp "$TMP/legacy-modes" "$MODES" || fail 'retired modes modified'
cmp "$TMP/legacy-editor" "$PACKAGE/extensions/prompt-editor.ts" || fail 'retired editor modified'
cmp "$TMP/fast-config" "$HOME/.pi/agent/extensions/pi-openai-fast.json" || fail 'fast choices changed'
for profile in personal work; do
  grep -qx untouched "$HOME/.pi/$profile/settings.json" || fail 'old profile modified'
  if grep -Fq ".pi/$profile " "$HOME/installs.log"; then fail 'installed into old profile'; fi
done
if grep -Fq mcp-adapter "$HOME/installs.log"; then fail 'adapter installed'; fi
[ ! -e "$HOME/npm.log" ] || fail 'routine installer invoked npm'
printf 'user-owned extension\n' > "$HOME/.pi/agent/extensions/handoff.ts"
mkdir "$HOME/custom-lib"
ln -s "$HOME/custom-lib" "$HOME/.pi/agent/lib"
run || { tail -30 "$TMP/install.log"; fail 'install with unmanaged retired-name entries'; }
grep -qx 'user-owned extension' "$HOME/.pi/agent/extensions/handoff.ts" || fail 'user-owned handoff entry changed'
[ "$(readlink "$HOME/.pi/agent/lib")" = "$HOME/custom-lib" ] || fail 'unmanaged library link changed'
for package in "$REPO/pi/packages/pi-exa" "$REPO/pi/packages/pi-parallel" "$REPO/pi/packages/pi-subagents" git:github.com/mitsuhiko/agent-stuff@0865c849befd2021490679f96a8dee58c84ac857; do
  if (PI_TEST_INSTALL_FAIL="$package" run); then fail "$package install failure reported success"; fi
  grep -Fq "injected install failure: $package" "$TMP/install.log" || fail "$package stderr was suppressed"
  grep -Fq "Retry manually:" "$TMP/install.log" || fail "$package recovery hint missing"
done
[ ! -e "$HOME/forbidden-network" ] || fail 'unexpected network installer'
for dependency in acorn jiti undici yaml; do
  cmp "$TMP/$dependency.package.json" "$REPO/pi/packages/pi-subagents/node_modules/$dependency/package.json" || fail "dependency changed: $dependency"
done
cmp "$TMP/fast-config" "$HOME/.pi/agent/extensions/pi-openai-fast.json" || fail 'dependency failure changed fast config'
echo 'Native Pi installer tests passed'
