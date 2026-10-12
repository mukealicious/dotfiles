# Adopted From

- Upstream: https://github.com/dmmulroy/.dotfiles
- Path: `home/.agents/skills/writing-for-agents/`
- Ref: `bdf5e0611d62436eeb5dc58555c1396ced2dddeb`
- Adopted: 2026-10-12

## Fidelity and invocation

All three upstream files are unchanged: `SKILL.md`, `SKILL-MECHANICS.md`, and
`agents/openai.yaml`. Dillon's `disable-model-invocation: true` is preserved.
This is a manual authoring reference for agent-facing documents, replacing local
`build-skill` and `agent-context`; none of their advice, templates, or scripts is
carried forward.

Only this provenance file and `LICENSE` are added. No metadata is inserted into
`SKILL.md`. The optional watchlist entry reports upstream facts without an
automatic local pinned comparison; consult this provenance for that comparison.
No installer or watcher behavior is changed to support this import.

## Original source and license

Dillon's `.skill-lock.json` identifies Matt Pocock's
`skills/productivity/writing-for-agents/` as the source. Verified against
`mattpocock/skills@49dd158d1076134a641b33efb035946536778336`: the only difference
in `SKILL.md` is Dillon's manual-invocation flag; the mechanics and OpenAI
metadata files are identical. `LICENSE` is copied unchanged from that original
repository's root MIT notice, retaining Matt Pocock's copyright.

## Reviewed Git blob IDs

| File | Git blob |
|---|---|
| `SKILL.md` | `645088cb14b438f1cdc922dc2f279fd3a46f51be` |
| `SKILL-MECHANICS.md` | `9cdbdb22aadc438755392216e75ad9a14cc9832e` |
| `agents/openai.yaml` | `079c933b75743dec18b5d0c01006def20b6aad26` |
| Original `LICENSE` | `f1dd2c09108dde1a5f56097cee8461b3ea834499` |
