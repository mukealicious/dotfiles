# Dotfiles upstream inventory

For upstream comparisons or adoption recommendations, read the canonical method
at `~/Code/mu-stack/maintenance/upstream-review.md`. This file owns only the
dotfiles inventory and tooling details; it does not define another review method.

## Dotfiles tooling

For a requested dotfiles watchlist pass:

1. Read `ai/watchlist.toml`.
2. Run `bin/ai-watch --json` (or `bin/ai-watch --source <id>` for a named source).
3. Inspect the local artifacts reported in `localMatches`, then apply the
   canonical review method.

`bin/ai-watch` scans dotfiles only. It does not inventory the external mu-stack
repository. For an extracted skill, inspect `~/Code/mu-stack/skills/<name>/`
and its adjacent provenance directly. Watchlist notes can name external research
interests without making them local inventory matches.

Keep `ai/watchlist.toml` and `bin/ai-watch` in dotfiles. This adapter is plain
repository documentation, not a globally distributed skill.
