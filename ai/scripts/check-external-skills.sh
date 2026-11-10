# Read-only mu-stack ownership diagnostics, sourced by bin/dot-doctor.
# Caller supplies DOTFILES_ROOT and lib/symlink.sh logging/counters.
check_external_skill_installation() {
  mu_stack="$HOME/Code/mu-stack"
  . "$DOTFILES_ROOT/pi/skill-package.sh"
  if ! external_skill_package_is_valid "$mu_stack"; then
    fail "mu-stack skills-only package is missing or invalid"
    info "Fix: dot skills (requires GitHub access; inspect checkout conflicts first)"
    return 0
  fi
  pass "mu-stack skills-only package"
  if jq -e '[.packages[] | select(type == "object" and .source == "~/Code/mu-stack" and .extensions == [] and .prompts == [] and .themes == [])] | length == 1' "$HOME/.pi/agent/settings.json" >/dev/null 2>&1 \
    && jq -e '(.skills | index("~/skills/tldraw-offline") != null) and (.skills | index("~/.dotfiles/.ai-runtime/pi/skills") != null) and (.skills | index("~/.dotfiles/.agents/skills") != null) and (.skills | index("!**/.dotfiles/.agents/skills/**") != null)' "$HOME/.pi/agent/settings.json" >/dev/null 2>&1; then
    pass "Pi external skills and local discovery exclusions"
  else
    fail "Pi skill selection needs refresh"
    info "Fix: $DOTFILES_ROOT/pi/install.sh"
  fi

  for skill_dir in "$mu_stack/skills"/*; do
    [ -f "$skill_dir/SKILL.md" ] || continue
    name="$(basename "$skill_dir")"
    for directory in "$HOME/.claude/skills" "$HOME/.agents/skills"; do
      target="$directory/$name"
      if [ -L "$target" ] && [ "$(readlink "$target")" = "$skill_dir" ] && [ -f "$target/SKILL.md" ]; then
        pass "$target (mu-stack)"
      else
        warn "$target is missing or not a canonical mu-stack link"
        info "Inspect collisions, then run: node $mu_stack/scripts/install.mjs all"
      fi
    done
  done

  # Exact old targets identify stale dotfiles ownership, not arbitrary aliases.
  for directory in "$DOTFILES_ROOT/.agents/skills" "$DOTFILES_ROOT/.claude/skills" "$HOME/.claude/skills" "$HOME/.agents/skills" "$HOME/.codex/skills" "$HOME/.pi/agent/skills" "$HOME/.config/opencode/skill"; do
    [ -d "$directory" ] && [ ! -L "$directory" ] || continue
    for link in "$directory"/*; do
      [ -L "$link" ] || continue
      name="$(basename "$link")"
      case "$name" in apple-reminders|dotfiles-dev) continue ;; esac
      # Existing Claude-native overlays remain owned by their source topic.
      if [ "$(readlink "$link")" = "$DOTFILES_ROOT/claude/skills/$name" ] && [ -f "$DOTFILES_ROOT/claude/skills/$name/SKILL.md" ]; then
        continue
      fi
      case "$(readlink "$link")" in
        "$DOTFILES_ROOT/.ai-runtime/pi/skills/$name"|"$DOTFILES_ROOT/.ai-runtime/codex/skills/$name"|"$DOTFILES_ROOT/.ai-runtime/claude-code/skills/$name"|"$DOTFILES_ROOT/.ai-runtime/opencode/skills/$name"|"$DOTFILES_ROOT/ai/skills/$name"|"$DOTFILES_ROOT/claude/skills/$name")
          warn "Retired dotfiles skill link remains: $link"
          info "Fix: $DOTFILES_ROOT/ai/install.sh, then dot skills"
          ;;
      esac
    done
  done
  for provider in pi codex claude-code opencode; do
    for skill_dir in "$DOTFILES_ROOT/.ai-runtime/$provider/skills"/*; do
      [ -e "$skill_dir" ] || continue
      case "$(basename "$skill_dir")" in apple-reminders|dotfiles-dev) continue ;; esac
      warn "Retired dotfiles skill projection remains: $skill_dir"
      info "Fix: $DOTFILES_ROOT/ai/install.sh"
    done
  done
}
