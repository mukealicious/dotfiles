#!/bin/sh
# Isolated, read-only skill ownership diagnostics.
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/skill-doctor.XXXXXX")"
trap 'rm -rf "$TMP"' EXIT INT TERM
export HOME="$TMP/home"
DOTFILES_ROOT="$TMP/repo"
mkdir -p "$DOTFILES_ROOT/lib" "$HOME/Code/mu-stack/skills/portable" "$HOME/.pi/agent" "$HOME/.claude/skills" "$HOME/.agents/skills"
cp "$ROOT/lib/log.sh" "$DOTFILES_ROOT/lib/log.sh"
mkdir -p "$DOTFILES_ROOT/pi"
cp "$ROOT/pi/skill-package.sh" "$DOTFILES_ROOT/pi/skill-package.sh"
. "$ROOT/lib/symlink.sh"
. "$ROOT/ai/scripts/check-external-skills.sh"
assert() { if ! "$@"; then echo "FAIL: $*" >&2; exit 1; fi; }
printf '%s\n' '{"name":"mu-stack","pi":{"skills":["./skills"],"extensions":[],"prompts":[],"themes":[]}}' > "$HOME/Code/mu-stack/package.json"
printf '%s\n' '---' 'name: portable' 'description: Portable fixture' '---' 'Guidance' > "$HOME/Code/mu-stack/skills/portable/SKILL.md"
cp "$ROOT/pi/settings.json" "$HOME/.pi/agent/settings.json"
for directory in "$HOME/.claude/skills" "$HOME/.agents/skills"; do
  ln -s "$HOME/Code/mu-stack/skills/portable" "$directory/portable"
done
# A live Claude-only overlay is not a retired portable skill.
mkdir -p "$DOTFILES_ROOT/claude/skills/native-overlay" "$DOTFILES_ROOT/.claude/skills"
printf 'active overlay\n' > "$DOTFILES_ROOT/claude/skills/native-overlay/SKILL.md"
ln -s "$DOTFILES_ROOT/claude/skills/native-overlay" "$HOME/.claude/skills/native-overlay"
ln -s "$DOTFILES_ROOT/claude/skills/native-overlay" "$DOTFILES_ROOT/.claude/skills/native-overlay"
check_external_skill_installation > "$TMP/clean.log"
assert test "$_check_failures" = 0
assert test "$_check_warnings" = 0
# Exact stale links warn. Unrelated aliases and broken links remain untouched.
mkdir -p "$DOTFILES_ROOT/.agents/skills"
ln -s "$DOTFILES_ROOT/.ai-runtime/codex/skills/retired" "$DOTFILES_ROOT/.agents/skills/retired"
ln -s "$DOTFILES_ROOT/.ai-runtime/codex/skills/other" "$DOTFILES_ROOT/.agents/skills/alias"
ln -s "$HOME/missing" "$DOTFILES_ROOT/.agents/skills/custom"
check_external_skill_installation > "$TMP/stale.log"
assert test "$_check_warnings" = 1
assert grep -Fq 'Retired dotfiles skill link remains:' "$TMP/stale.log"
assert test -L "$DOTFILES_ROOT/.agents/skills/retired"
assert test -L "$DOTFILES_ROOT/.agents/skills/alias"
assert test -L "$DOTFILES_ROOT/.agents/skills/custom"
# Collisions offer the owning package command, never dot or forced replacement.
rm "$HOME/.agents/skills/portable"
printf 'user content\n' > "$HOME/.agents/skills/portable"
check_external_skill_installation > "$TMP/collision.log"
assert grep -Fq "node $HOME/Code/mu-stack/scripts/install.mjs all" "$TMP/collision.log"
assert grep -qx 'user content' "$HOME/.agents/skills/portable"
# Missing selections/package fail without writing any configuration.
printf '{}\n' > "$HOME/.pi/agent/settings.json"
check_external_skill_installation > "$TMP/settings.log"
assert test "$_check_failures" = 1
assert grep -qx '{}' "$HOME/.pi/agent/settings.json"
mv "$HOME/Code/mu-stack/package.json" "$TMP/package.json"
check_external_skill_installation > "$TMP/package.log"
assert test "$_check_failures" = 2
assert test ! -e "$HOME/Code/mu-stack/package.json"
mv "$TMP/package.json" "$HOME/Code/mu-stack/package.json"
cp "$ROOT/pi/settings.json" "$HOME/.pi/agent/settings.json"
invalid_package() {
  _check_failures=0
  check_external_skill_installation > "$TMP/invalid.log"
  assert test "$_check_failures" = 1
  assert grep -Fq 'skills-only package is missing or invalid' "$TMP/invalid.log"
}
mv "$HOME/Code/mu-stack/skills" "$TMP/skills"
invalid_package
mkdir "$HOME/Code/mu-stack/skills"
invalid_package
rmdir "$HOME/Code/mu-stack/skills"
mv "$TMP/skills" "$HOME/Code/mu-stack/skills"
mv "$HOME/Code/mu-stack/skills/portable/SKILL.md" "$TMP/SKILL.md"
invalid_package
printf 'invalid entry\n' > "$HOME/Code/mu-stack/skills/portable/SKILL.md"
invalid_package
assert grep -qx 'invalid entry' "$HOME/Code/mu-stack/skills/portable/SKILL.md"
mv "$TMP/SKILL.md" "$HOME/Code/mu-stack/skills/portable/SKILL.md"
echo 'Skill ownership doctor tests passed'
