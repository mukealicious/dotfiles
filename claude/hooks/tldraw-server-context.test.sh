#!/bin/sh
# Hermetic regression coverage for the app-managed tldraw context adapter.
set -eu

ROOT="$(cd "$(dirname "$0")/../.." && pwd -P)"
ADAPTER="$ROOT/claude/hooks/tldraw-server-context.sh"
TMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/tldraw-context-hook.XXXXXX")"
trap 'rm -rf "$TMP_ROOT"' EXIT INT TERM
FIXTURE_HOME="$TMP_ROOT/home with spaces"
INJECTOR="$FIXTURE_HOME/skills/tldraw-offline/inject-server-context.mjs"
NODE="$(command -v "${NODE:-node}")"
PATH="$(dirname "$NODE"):$PATH"
export PATH
mkdir -p "$(dirname "$INJECTOR")"
ln -s "$ROOT" "$FIXTURE_HOME/.dotfiles"

fail() {
  echo "FAIL: tldraw context hook: $*" >&2
  exit 1
}

# An absent app injector is an optional integration, not a hook failure.
HOME="$FIXTURE_HOME" sh "$ADAPTER" >"$TMP_ROOT/stdout" 2>"$TMP_ROOT/stderr"
[ ! -s "$TMP_ROOT/stdout" ] || fail "missing injector produced output"
[ ! -s "$TMP_ROOT/stderr" ] || fail "missing injector produced an error"

# Exercise Node delegation without reading the live app's credentials or canvas.
cat > "$INJECTOR" <<'NODE'
import fs from "node:fs";

process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: process.argv[2],
    additionalContext: fs.readFileSync(0, "utf8"),
  },
}));
NODE

payload='{"agent_type":"tldraw-offline","fixture":"stdin preserved"}'

assert_tldraw_context_output() {
  [ -s "$TMP_ROOT/stdout" ] || fail "installed .mjs injector was not called"
  "$NODE" --input-type=module - "$TMP_ROOT/stdout" "$1" "$payload" <<'NODE'
import assert from "node:assert/strict";
import fs from "node:fs";

assert.deepEqual(JSON.parse(fs.readFileSync(process.argv[2], "utf8")), {
  hookSpecificOutput: {
    hookEventName: process.argv[3],
    additionalContext: process.argv[4],
  },
});
NODE
}

printf '%s' "$payload" | HOME="$FIXTURE_HOME" sh "$ADAPTER" >"$TMP_ROOT/stdout"
assert_tldraw_context_output SubagentStart

printf '%s' "$payload" | HOME="$FIXTURE_HOME" sh "$ADAPTER" SessionStart >"$TMP_ROOT/stdout"
assert_tldraw_context_output SessionStart

# Keep exactly one portable registration, then exercise that configured command.
configured_command="$("$NODE" --input-type=module - "$ROOT/claude/settings.json" <<'NODE'
import assert from "node:assert/strict";
import fs from "node:fs";

const settings = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const tldrawHooks = settings.hooks.SubagentStart.filter(
  (hook) => hook.matcher === "tldraw-offline",
);
assert.deepEqual(tldrawHooks, [{
  matcher: "tldraw-offline",
  hooks: [{
    type: "command",
    command: 'sh "$HOME/.dotfiles/claude/hooks/tldraw-server-context.sh" SubagentStart',
  }],
}]);
process.stdout.write(tldrawHooks[0].hooks[0].command);
NODE
)"
printf '%s' "$payload" | HOME="$FIXTURE_HOME" sh -c "$configured_command" >"$TMP_ROOT/stdout"
assert_tldraw_context_output SubagentStart

# A present injector's error must reach Claude, not become a success-shaped no-op.
cat > "$INJECTOR" <<'NODE'
process.stderr.write("tldraw fixture injector failed\n");
process.exit(23);
NODE
if HOME="$FIXTURE_HOME" sh "$ADAPTER" >"$TMP_ROOT/stdout" 2>"$TMP_ROOT/stderr"; then
  fail "injector failure reported success"
else
  status=$?
fi
[ "$status" -eq 23 ] || fail "injector exit status was not preserved"
[ ! -s "$TMP_ROOT/stdout" ] || fail "failed injector produced success output"
grep -Fx 'tldraw fixture injector failed' "$TMP_ROOT/stderr" >/dev/null \
  || fail "injector error was not forwarded"

echo "Portable tldraw context hook tests passed"
