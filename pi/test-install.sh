#!/bin/sh
# Focused hermetic coverage for retired Pi extension-link cleanup.
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
TMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/dotfiles-pi-install.XXXXXX")"
TMP_ROOT="$(cd "$TMP_ROOT" && pwd -P)"
trap 'rm -rf "$TMP_ROOT"' EXIT INT TERM
REPO="$TMP_ROOT/repo"
HOME_ROOT="$TMP_ROOT/home"
FAKE_BIN="$TMP_ROOT/bin"
mkdir -p "$REPO" "$HOME_ROOT/.bun/bin" "$FAKE_BIN"

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
tar -C "$ROOT" --exclude='node_modules' -cf - pi lib | tar -C "$REPO" -xf -

cat > "$HOME_ROOT/.bun/bin/pi" <<'EOF'
#!/bin/sh
if [ "$1" = "--version" ]; then
  printf '%s\n' "${PI_FAKE_VERSION:-0.84.2}"
  exit 0
fi
exit 0
EOF
cat > "$FAKE_BIN/mise" <<'EOF'
#!/bin/sh
if [ "$1" = "exec" ]; then
  shift
  while [ "$#" -gt 0 ] && [ "$1" != "--" ]; do shift; done
  [ "$#" -gt 0 ] && shift
  exec "$@"
fi
if [ "$1" = "which" ]; then
  exit 1
fi
exit 1
EOF
cat > "$FAKE_BIN/npm" <<'EOF'
#!/bin/sh
exit 0
EOF
cat > "$FAKE_BIN/parallel-cli" <<'EOF'
#!/bin/sh
[ "$1" = "--version" ]
EOF
chmod +x "$HOME_ROOT/.bun/bin/pi" "$FAKE_BIN/mise" "$FAKE_BIN/npm" "$FAKE_BIN/parallel-cli"

# These sparse fixtures contain patch context only; neither is typechecked or
# executed by the installer tests.
PROMPT_EDITOR_FIXTURE="$TMP_ROOT/prompt-editor.fixture.ts"
cat > "$PROMPT_EDITOR_FIXTURE" <<'EOF'
// Mitsupi 1.6.0 prompt-editor fixture
function normalizeThinkingLevel(level: unknown): ThinkingLevel | undefined {
  if (typeof level !== "string") return undefined;
  const v = level as ThinkingLevel;
  // Keep the list local to avoid importing internal enums.
  const allowed: ThinkingLevel[] = ["off", "minimal", "low", "medium", "high", "xhigh"];
  return allowed.includes(v) ? v : undefined;
}

function createDefaultModes(): ModesFile {
  return {
    version: 1,
    currentMode: "default",
    modes: {
      // Forced default mode
      default: { ...base },
      // Convenience mode (user can delete/rename)
      fast: { ...base, thinkingLevel: "off" },
    },
  };
}

const MODE_UI_CONFIGURE = "Configure modes…";
const MODE_UI_ADD = "Add mode…";
const MODE_UI_BACK = "Back";

const ALL_THINKING_LEVELS: ThinkingLevel[] = ["off", "minimal", "low", "medium", "high", "xhigh"];
const THINKING_UNSET_LABEL = "(don't change)";

function isDefaultModeName(name: string): boolean {
  return name === "default";
}
async function pickModelForModeUI(
  ctx: ExtensionContext,
  spec: ModeSpec,
): Promise<{ provider: string; modelId: string } | undefined> {
  if (!ctx.hasUI) return undefined;

  const settingsManager = SettingsManager.inMemory();
  const currentModel = spec.provider && spec.modelId ? ctx.modelRegistry.find(spec.provider, spec.modelId) : ctx.model;

  const scopedModels: Array<{ model: any; thinkingLevel: string }> = [];

  return ctx.ui.custom<{ provider: string; modelId: string } | undefined>((tui, _theme, _keybindings, done) => {
    const selector = new ModelSelectorComponent(
      tui,
      currentModel,
      settingsManager,
      ctx.modelRegistry as any,
      scopedModels as any,
      (model) => done({ provider: model.provider, modelId: model.id }),
      () => done(undefined),
    );
    return selector;
  });
}
EOF
# Keep the sparse fixture at its upstream source lines. macOS `patch -F 0`
# requires the hunk positions as well as exact context.
awk '
  NR == 3 { for (i = 1; i <= 243; i++) print "" }
  NR == 10 { for (i = 1; i <= 19; i++) print "" }
  NR == 23 { for (i = 1; i <= 324; i++) print "" }
  NR == 33 { for (i = 1; i <= 242; i++) print "" }
  { print }
' "$PROMPT_EDITOR_FIXTURE" > "$PROMPT_EDITOR_FIXTURE.tmp"
mv "$PROMPT_EDITOR_FIXTURE.tmp" "$PROMPT_EDITOR_FIXTURE"
# The upstream file uses tabs; keep the fixture's patch context byte-for-byte
# compatible while keeping this shell fixture readable above.
sed -e 's/^      /\t\t\t/' -e 's/^    /\t\t/' -e 's/^  /\t/' "$PROMPT_EDITOR_FIXTURE" > "$PROMPT_EDITOR_FIXTURE.tmp"
mv "$PROMPT_EDITOR_FIXTURE.tmp" "$PROMPT_EDITOR_FIXTURE"

FILES_SHORTCUT_FIXTURE="$TMP_ROOT/files-shortcut.fixture.ts"
cat > "$FILES_SHORTCUT_FIXTURE" <<'EOF'
const runFileBrowser = async (_pi: unknown, _ctx: unknown): Promise<void> => {};

export default function (pi: any): void {
	pi.registerShortcut("ctrl+shift+o", {
		handler: async (ctx: any) => {
			await runFileBrowser(pi, ctx);
		},
	});

	pi.registerShortcut("ctrl+shift+f", {
		description: "Reveal the latest file reference in Finder",
		handler: async (ctx) => {
			const entries = ctx.sessionManager.getBranch();
			const latest = findLatestFileReference(entries, ctx.cwd);

			if (!latest) {
				ctx.ui.notify("No file reference found in the session", "warning");
				return;
			}

			const canonical = toCanonicalPath(latest.path);
			if (!canonical) {
				ctx.ui.notify(`File not found: ${latest.display}`, "error");
				return;
			}

			await revealPath(pi, ctx, {
				canonicalPath: canonical.canonicalPath,
				resolvedPath: canonical.canonicalPath,
				displayPath: latest.display,
				exists: true,
				isDirectory: canonical.isDirectory,
				status: undefined,
				inRepo: false,
				isTracked: false,
				isReferenced: true,
				hasSessionChange: false,
				lastTimestamp: 0,
			});
		},
	});

	pi.registerShortcut("ctrl+shift+r", {
		description: "Quick Look the latest file reference",
EOF
# Match the source line that starts the patch hunk without retaining the rest
# of Mitsupi's files extension in this hermetic fixture.
awk 'BEGIN { for (i = 1; i <= 1037; i++) print "" } { print }' "$FILES_SHORTCUT_FIXTURE" > "$FILES_SHORTCUT_FIXTURE.tmp"
mv "$FILES_SHORTCUT_FIXTURE.tmp" "$FILES_SHORTCUT_FIXTURE"

make_mitsupi_copy() {
  home="$1"
  profile="$2"
  version="$3"
  context="$4"
  package_dir="$home/.pi/$profile/npm/node_modules/mitsupi"
  mkdir -p "$package_dir/extensions" "$package_dir/skills" "$package_dir/themes" "$package_dir/commands"
  cat > "$package_dir/package.json" <<EOF
{
  "name": "mitsupi",
  "version": "$version",
  "pi": {
    "extensions": ["./extensions"],
    "skills": ["./skills"],
    "themes": ["./themes"],
    "prompts": ["./commands"]
  }
}
EOF
  if [ "$context" = "original" ]; then
    cp "$PROMPT_EDITOR_FIXTURE" "$package_dir/extensions/prompt-editor.ts"
  else
    sed 's/"xhigh"/"broken"/g' "$PROMPT_EDITOR_FIXTURE" > "$package_dir/extensions/prompt-editor.ts"
  fi
  cp "$FILES_SHORTCUT_FIXTURE" "$package_dir/extensions/files.ts"
  for extension in answer context multi-edit todos uv whimsical btw review control go-to-bed loop notify session-breakdown split-fork; do
    : > "$package_dir/extensions/$extension.ts"
  done
  for skill in apple-mail commit github google-workspace mermaid pi-share sentry summarize uv anachb frontend-design ghidra librarian native-web-search oebb-scotty openscad tmux update-changelog web-browser; do
    mkdir -p "$package_dir/skills/$skill"
    printf '%s\n' "---" "name: $skill" "description: fixture" "---" > "$package_dir/skills/$skill/SKILL.md"
  done
  : > "$package_dir/themes/nightowl.json"
  : > "$package_dir/commands/unused.md"
}

for profile in work personal; do
  make_mitsupi_copy "$HOME_ROOT" "$profile" "1.6.0" original
done

# Simulate an existing installation: prompt-editor was patched by an earlier
# installer run while files.ts remains unpatched.
(
  cd "$HOME_ROOT/.pi/personal/npm/node_modules/mitsupi"
  patch -p1 -N -t < "$REPO/pi/patches/mitsupi-1.6.0-prompt-editor.patch"
) >/dev/null

for profile in work personal; do
  mkdir -p "$HOME_ROOT/.pi/$profile/extensions"
done

# Previous installer runs created exact absolute links. Those links must be
# removed even though their deleted source paths are now dead.
ln -s "$REPO/pi/extensions/cost.ts" "$HOME_ROOT/.pi/work/extensions/cost.ts"
ln -s "$REPO/pi/extensions/watchdog.ts" "$HOME_ROOT/.pi/work/extensions/watchdog.ts"

# Same-name user entries must remain untouched and be reported.
printf 'user cost extension\n' > "$HOME_ROOT/.pi/personal/extensions/cost.ts"
mkdir "$HOME_ROOT/.pi/personal/extensions/watchdog.ts"

run_install() {
  home="$1"
  log="$2"
  HOME="$home" PATH="$FAKE_BIN:$PATH" sh "$REPO/pi/install.sh" >"$log" 2>&1
}

run_install "$HOME_ROOT" "$TMP_ROOT/first.log"
[ ! -e "$HOME_ROOT/.pi/work/extensions/cost.ts" ] && [ ! -L "$HOME_ROOT/.pi/work/extensions/cost.ts" ] || fail "managed cost link was retained"
[ ! -e "$HOME_ROOT/.pi/work/extensions/watchdog.ts" ] && [ ! -L "$HOME_ROOT/.pi/work/extensions/watchdog.ts" ] || fail "managed watchdog link was retained"
[ -f "$HOME_ROOT/.pi/personal/extensions/cost.ts" ] || fail "user cost file was removed"
[ -d "$HOME_ROOT/.pi/personal/extensions/watchdog.ts" ] || fail "user watchdog directory was removed"
assert_contains "$TMP_ROOT/first.log" 'Removed retired managed extension link: work/extensions/cost.ts'
assert_contains "$TMP_ROOT/first.log" 'Removed retired managed extension link: work/extensions/watchdog.ts'
assert_contains "$TMP_ROOT/first.log" 'Preserving user-owned extension entry: personal/extensions/cost.ts'
assert_contains "$TMP_ROOT/first.log" 'Preserving user-owned extension entry: personal/extensions/watchdog.ts'
assert_contains "$TMP_ROOT/first.log" 'Applied Mitsupi 1.6.0 prompt-editor patch for work'
assert_contains "$TMP_ROOT/first.log" 'Applied Mitsupi 1.6.0 files shortcut patch for work'
assert_contains "$TMP_ROOT/first.log" 'Mitsupi 1.6.0 prompt-editor patch already applied for personal'
assert_contains "$TMP_ROOT/first.log" 'Applied Mitsupi 1.6.0 files shortcut patch for personal'

EXPECTED_EXTENSIONS='["extensions/answer.ts","extensions/context.ts","extensions/files.ts","extensions/multi-edit.ts","extensions/prompt-editor.ts","extensions/todos.ts","extensions/uv.ts","extensions/whimsical.ts","extensions/btw.ts","extensions/review.ts"]'
EXPECTED_SKILLS='["skills/apple-mail/SKILL.md","skills/commit/SKILL.md","skills/github/SKILL.md","skills/google-workspace/SKILL.md","skills/mermaid/SKILL.md","skills/pi-share/SKILL.md","skills/sentry/SKILL.md","skills/summarize/SKILL.md","skills/uv/SKILL.md"]'
for profile in work personal; do
  settings="$HOME_ROOT/.pi/$profile/settings.json"
  jq -e --argjson expected_extensions "$EXPECTED_EXTENSIONS" --argjson expected_skills "$EXPECTED_SKILLS" '
    ([.packages[] | select(type == "object" and .source == "npm:mitsupi@1.6.0")] | length == 1)
    and ([.packages[] | select(type == "object" and .source == "npm:mitsupi@1.6.0")][0].extensions == $expected_extensions)
    and ([.packages[] | select(type == "object" and .source == "npm:mitsupi@1.6.0")][0].skills == $expected_skills)
    and ([.packages[] | select(type == "object" and .source == "npm:mitsupi@1.6.0")][0].prompts == [])
    and ([.packages[] | select(type == "object" and .source == "npm:mitsupi@1.6.0")][0].themes == [])
  ' "$settings" >/dev/null || fail "$profile Mitsupi resource allowlist changed"
  [ -L "$HOME_ROOT/.pi/$profile/extensions/notify.ts" ] || fail "$profile local notify extension is missing"
  [ "$(readlink "$HOME_ROOT/.pi/$profile/extensions/notify.ts")" = "$REPO/pi/extensions/notify.ts" ] || fail "$profile local notify link is misdirected"
  [ -L "$HOME_ROOT/.pi/$profile/extensions/handoff.ts" ] || fail "$profile handoff extension is missing"
  [ "$(readlink "$HOME_ROOT/.pi/$profile/extensions/handoff.ts")" = "$REPO/pi/extensions/handoff.ts" ] || fail "$profile handoff link is misdirected"
  assert_not_contains "$settings" 'extensions/notify.ts'
  assert_not_contains "$settings" 'extensions/loop.ts'
  assert_not_contains "$settings" 'extensions/control.ts'
  assert_not_contains "$settings" 'extensions/session-breakdown.ts'
  assert_not_contains "$settings" 'nightowl'
  assert_contains "$settings" 'extensions/btw.ts'
  assert_contains "$settings" 'extensions/review.ts'
  [ -f "$HOME_ROOT/.pi/$profile/npm/node_modules/mitsupi/extensions/btw.ts" ] || fail "$profile /btw resource is missing"
  [ -f "$HOME_ROOT/.pi/$profile/npm/node_modules/mitsupi/extensions/review.ts" ] || fail "$profile /review resource is missing"
  snapshot="$TMP_ROOT/$profile-prompt-editor.patched.ts"
  cp "$HOME_ROOT/.pi/$profile/npm/node_modules/mitsupi/extensions/prompt-editor.ts" "$snapshot"
  assert_contains "$snapshot" '"xhigh", "max"'
  assert_not_contains "$snapshot" 'fast: { ...base'
  assert_contains "$snapshot" 'const modelRuntimeAdapter = {'
  assert_contains "$snapshot" 'getAvailableSnapshot: () => ctx.modelRegistry.getAvailable()'
  assert_contains "$snapshot" 'modelRuntimeAdapter as any'
  assert_not_contains "$snapshot" 'ctx.modelRegistry as any'
  files_snapshot="$TMP_ROOT/$profile-files.patched.ts"
  cp "$HOME_ROOT/.pi/$profile/npm/node_modules/mitsupi/extensions/files.ts" "$files_snapshot"
  assert_not_contains "$files_snapshot" 'ctrl+shift+f'
  assert_not_contains "$files_snapshot" 'Reveal the latest file reference in Finder'
done

# Mitsupi's mode-picker compatibility and `max` support are local patches;
# `/fast` remains owned by pi-openai-fast and no latency-named mode is seeded.
[ -f "$HOME_ROOT/.pi/work/npm/node_modules/mitsupi/extensions/fast.ts" ] && fail "Mitsupi unexpectedly exposes a fast extension"
assert_contains "$HOME_ROOT/.pi/work/settings.json" 'pi-openai-fast'

# A live link with the retired basename but another source is unmanaged.
rm "$HOME_ROOT/.pi/personal/extensions/cost.ts"
printf 'unmanaged extension\n' > "$TMP_ROOT/unmanaged-cost.ts"
ln -s "$TMP_ROOT/unmanaged-cost.ts" "$HOME_ROOT/.pi/personal/extensions/cost.ts"
ln -s "$TMP_ROOT/missing-watchdog.ts" "$HOME_ROOT/.pi/work/extensions/watchdog.ts"
run_install "$HOME_ROOT" "$TMP_ROOT/second.log"
[ -L "$HOME_ROOT/.pi/personal/extensions/cost.ts" ] || fail "live unmanaged link was removed"
[ "$(readlink "$HOME_ROOT/.pi/personal/extensions/cost.ts")" = "$TMP_ROOT/unmanaged-cost.ts" ] || fail "live unmanaged link changed"
[ -L "$HOME_ROOT/.pi/work/extensions/watchdog.ts" ] || fail "dead unmanaged link was removed"
assert_contains "$TMP_ROOT/second.log" 'Preserving unmanaged extension link: personal/extensions/cost.ts'
assert_contains "$TMP_ROOT/second.log" 'Preserving dead unmanaged extension link: work/extensions/watchdog.ts'
assert_contains "$TMP_ROOT/second.log" 'Mitsupi 1.6.0 prompt-editor patch already applied for work'
assert_contains "$TMP_ROOT/second.log" 'Mitsupi 1.6.0 files shortcut patch already applied for work'
assert_contains "$TMP_ROOT/second.log" 'Mitsupi 1.6.0 prompt-editor patch already applied for personal'
assert_contains "$TMP_ROOT/second.log" 'Mitsupi 1.6.0 files shortcut patch already applied for personal'
for profile in work personal; do
  cmp -s "$TMP_ROOT/$profile-prompt-editor.patched.ts" "$HOME_ROOT/.pi/$profile/npm/node_modules/mitsupi/extensions/prompt-editor.ts" || fail "$profile Mitsupi prompt-editor patch is not idempotent"
  cmp -s "$TMP_ROOT/$profile-files.patched.ts" "$HOME_ROOT/.pi/$profile/npm/node_modules/mitsupi/extensions/files.ts" || fail "$profile Mitsupi files shortcut patch is not idempotent"
done

# A third run has no managed retired links left to remove.
run_install "$HOME_ROOT" "$TMP_ROOT/third.log"
if grep -Fq 'Removed retired managed extension link' "$TMP_ROOT/third.log"; then
  fail "retired-link cleanup is not idempotent"
fi
[ -L "$HOME_ROOT/.pi/personal/extensions/cost.ts" ] || fail "idempotent run removed unmanaged link"
[ -L "$HOME_ROOT/.pi/work/extensions/watchdog.ts" ] || fail "idempotent run removed dead unmanaged link"
[ -d "$HOME_ROOT/.pi/personal/extensions/watchdog.ts" ] || fail "idempotent run removed user directory"

# Existing but unknown versions and patch contexts fail before either profile
# is materialized or mutated.
UNKNOWN_VERSION_HOME="$TMP_ROOT/unknown-version-home"
mkdir -p "$UNKNOWN_VERSION_HOME/.bun/bin"
cp "$HOME_ROOT/.bun/bin/pi" "$UNKNOWN_VERSION_HOME/.bun/bin/pi"
make_mitsupi_copy "$UNKNOWN_VERSION_HOME" work "1.6.0" original
make_mitsupi_copy "$UNKNOWN_VERSION_HOME" personal "1.5.0" original
if run_install "$UNKNOWN_VERSION_HOME" "$TMP_ROOT/unknown-version.log"; then
  fail "unknown Mitsupi version unexpectedly passed preflight"
fi
assert_contains "$TMP_ROOT/unknown-version.log" 'is not exactly version 1.6.0'
[ ! -e "$UNKNOWN_VERSION_HOME/.pi/work/settings.json" ] || fail "unknown version mutated work settings"
[ ! -e "$UNKNOWN_VERSION_HOME/.pi/personal/settings.json" ] || fail "unknown version mutated personal settings"
[ "$(grep -Fc '"xhigh"' "$UNKNOWN_VERSION_HOME/.pi/work/npm/node_modules/mitsupi/extensions/prompt-editor.ts")" -eq 2 ] || fail "unknown version mutated work Mitsupi copy"

UNKNOWN_CONTEXT_HOME="$TMP_ROOT/unknown-context-home"
mkdir -p "$UNKNOWN_CONTEXT_HOME/.bun/bin"
cp "$HOME_ROOT/.bun/bin/pi" "$UNKNOWN_CONTEXT_HOME/.bun/bin/pi"
make_mitsupi_copy "$UNKNOWN_CONTEXT_HOME" work "1.6.0" original
make_mitsupi_copy "$UNKNOWN_CONTEXT_HOME" personal "1.6.0" unknown
if run_install "$UNKNOWN_CONTEXT_HOME" "$TMP_ROOT/unknown-context.log"; then
  fail "unknown Mitsupi context unexpectedly passed preflight"
fi
assert_contains "$TMP_ROOT/unknown-context.log" 'Unknown Mitsupi 1.6.0 prompt-editor context'
[ ! -e "$UNKNOWN_CONTEXT_HOME/.pi/work/settings.json" ] || fail "unknown context mutated work settings"
[ ! -e "$UNKNOWN_CONTEXT_HOME/.pi/personal/settings.json" ] || fail "unknown context mutated personal settings"
[ "$(grep -Fc '"xhigh"' "$UNKNOWN_CONTEXT_HOME/.pi/work/npm/node_modules/mitsupi/extensions/prompt-editor.ts")" -eq 2 ] || fail "unknown context mutated work Mitsupi copy"

# A one-line change in patch context must not be accepted through patch fuzz.
UNKNOWN_FILES_CONTEXT_HOME="$TMP_ROOT/unknown-files-context-home"
mkdir -p "$UNKNOWN_FILES_CONTEXT_HOME/.bun/bin"
cp "$HOME_ROOT/.bun/bin/pi" "$UNKNOWN_FILES_CONTEXT_HOME/.bun/bin/pi"
make_mitsupi_copy "$UNKNOWN_FILES_CONTEXT_HOME" work "1.6.0" original
make_mitsupi_copy "$UNKNOWN_FILES_CONTEXT_HOME" personal "1.6.0" original
unknown_files_extension="$UNKNOWN_FILES_CONTEXT_HOME/.pi/personal/npm/node_modules/mitsupi/extensions/files.ts"
sed 's/Quick Look the latest file reference/Changed test context/' "$unknown_files_extension" > "$unknown_files_extension.tmp"
mv "$unknown_files_extension.tmp" "$unknown_files_extension"
if run_install "$UNKNOWN_FILES_CONTEXT_HOME" "$TMP_ROOT/unknown-files-context.log"; then
  fail "unknown files context unexpectedly passed preflight"
fi
assert_contains "$TMP_ROOT/unknown-files-context.log" 'Unknown Mitsupi 1.6.0 files shortcut context'
[ ! -e "$UNKNOWN_FILES_CONTEXT_HOME/.pi/work/settings.json" ] || fail "unknown files context mutated work settings"
[ ! -e "$UNKNOWN_FILES_CONTEXT_HOME/.pi/personal/settings.json" ] || fail "unknown files context mutated personal settings"
assert_contains "$unknown_files_extension" 'Changed test context'
assert_contains "$unknown_files_extension" 'ctrl+shift+f'

OLD_PI_HOME="$TMP_ROOT/old-pi-home"
mkdir -p "$OLD_PI_HOME/.bun/bin"
cp "$HOME_ROOT/.bun/bin/pi" "$OLD_PI_HOME/.bun/bin/pi"
make_mitsupi_copy "$OLD_PI_HOME" work "1.6.0" original
make_mitsupi_copy "$OLD_PI_HOME" personal "1.6.0" original
if PI_FAKE_VERSION=0.80.5 run_install "$OLD_PI_HOME" "$TMP_ROOT/old-pi.log"; then
  fail "old Pi version unexpectedly passed the version guard"
fi
assert_contains "$TMP_ROOT/old-pi.log" 'Pi 0.80.5 is too old'
[ ! -e "$OLD_PI_HOME/.pi/work/settings.json" ] || fail "old Pi guard mutated work settings"

echo "Pi installer Mitsupi curation, patch, preflight, and retired-extension tests passed"
