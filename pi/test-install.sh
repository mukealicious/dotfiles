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

# Keep the fixture independent of the checkout's installed dependencies.
tar -C "$ROOT" --exclude='node_modules' -cf - pi lib | tar -C "$REPO" -xf -

cat > "$HOME_ROOT/.bun/bin/pi" <<'EOF'
#!/bin/sh
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
  log="$1"
  HOME="$HOME_ROOT" PATH="$FAKE_BIN:$PATH" sh "$REPO/pi/install.sh" >"$log" 2>&1
}

run_install "$TMP_ROOT/first.log"
[ ! -e "$HOME_ROOT/.pi/work/extensions/cost.ts" ] && [ ! -L "$HOME_ROOT/.pi/work/extensions/cost.ts" ] || fail "managed cost link was retained"
[ ! -e "$HOME_ROOT/.pi/work/extensions/watchdog.ts" ] && [ ! -L "$HOME_ROOT/.pi/work/extensions/watchdog.ts" ] || fail "managed watchdog link was retained"
[ -f "$HOME_ROOT/.pi/personal/extensions/cost.ts" ] || fail "user cost file was removed"
[ -d "$HOME_ROOT/.pi/personal/extensions/watchdog.ts" ] || fail "user watchdog directory was removed"
assert_contains "$TMP_ROOT/first.log" 'Removed retired managed extension link: work/extensions/cost.ts'
assert_contains "$TMP_ROOT/first.log" 'Removed retired managed extension link: work/extensions/watchdog.ts'
assert_contains "$TMP_ROOT/first.log" 'Preserving user-owned extension entry: personal/extensions/cost.ts'
assert_contains "$TMP_ROOT/first.log" 'Preserving user-owned extension entry: personal/extensions/watchdog.ts'

# A live link with the retired basename but another source is unmanaged.
rm "$HOME_ROOT/.pi/personal/extensions/cost.ts"
printf 'unmanaged extension\n' > "$TMP_ROOT/unmanaged-cost.ts"
ln -s "$TMP_ROOT/unmanaged-cost.ts" "$HOME_ROOT/.pi/personal/extensions/cost.ts"
ln -s "$TMP_ROOT/missing-watchdog.ts" "$HOME_ROOT/.pi/work/extensions/watchdog.ts"
run_install "$TMP_ROOT/second.log"
[ -L "$HOME_ROOT/.pi/personal/extensions/cost.ts" ] || fail "live unmanaged link was removed"
[ "$(readlink "$HOME_ROOT/.pi/personal/extensions/cost.ts")" = "$TMP_ROOT/unmanaged-cost.ts" ] || fail "live unmanaged link changed"
[ -L "$HOME_ROOT/.pi/work/extensions/watchdog.ts" ] || fail "dead unmanaged link was removed"
assert_contains "$TMP_ROOT/second.log" 'Preserving unmanaged extension link: personal/extensions/cost.ts'
assert_contains "$TMP_ROOT/second.log" 'Preserving dead unmanaged extension link: work/extensions/watchdog.ts'

# A third run has no managed retired links left to remove.
run_install "$TMP_ROOT/third.log"
if grep -Fq 'Removed retired managed extension link' "$TMP_ROOT/third.log"; then
  fail "retired-link cleanup is not idempotent"
fi
[ -L "$HOME_ROOT/.pi/personal/extensions/cost.ts" ] || fail "idempotent run removed unmanaged link"
[ -L "$HOME_ROOT/.pi/work/extensions/watchdog.ts" ] || fail "idempotent run removed dead unmanaged link"
[ -d "$HOME_ROOT/.pi/personal/extensions/watchdog.ts" ] || fail "idempotent run removed user directory"

echo "Pi installer retired-extension cleanup tests passed"
