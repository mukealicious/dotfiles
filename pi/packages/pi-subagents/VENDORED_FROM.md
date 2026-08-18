---
metadata:
  watch-sources: nicobailon/pi-subagents@b91c8810785e2574ade9416d3653a5162d103434
---

# Vendored from upstream

- Upstream repo: `nicobailon/pi-subagents`
- Pinned commit: `b91c8810785e2574ade9416d3653a5162d103434`
- Source URL: <https://github.com/nicobailon/pi-subagents/tree/b91c8810785e2574ade9416d3653a5162d103434>

This directory is an in-repo vendor copy so Pi can load the package from a local path instead of installing it from npm.

## Local divergences

- Active user scope resolves through `PI_CODING_AGENT_DIR`, retaining `~/.pi/agent` only when the environment variable is absent.
- Temporary async, result, chain, and artifact state is isolated by both OS user and active Pi profile.
- User configuration, skill/package discovery, run history, intercom, saved chains, and session-artifact cleanup follow the same active-profile boundary.
- User agents and chains resolve only from the active profile's real `agents/` directory; home `~/.agents` remains available for skills but not agent definitions.
- Builtins are limited to leaf scout, researcher, and worker roles. Shared generated `review` is the read-only reviewer; scout/review reject output and progress overrides before persistence, and bridge setup cannot widen explicit tool allowlists.
- Provider-neutral `gpt-5.6` role defaults and Pi's native `max` thinking level are preserved across parsing, selection, serialization, UI, and launch paths.
- Skill fallback discovery honors resource filters on settings-declared packages, keeps project package discovery, and does not scan active-profile or global npm roots opportunistically.
