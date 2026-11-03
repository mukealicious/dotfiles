# Adopted From

- Upstream: https://github.com/joelhooks/skills
- Path: `skills/uncomplect/`
- Ref: `022f29cbfa2ddd36916622d49c02b763060f6847` (latest main reviewed 2026-10-12)
- Previous ref: `7c0a930d761bc05f50c3d31cf55ba7f289b45861`
- Role: Independent architectural simplification and replacement-design guidance, explicitly retained by the user.

The skill body, `references/source-map.md`, and all `evals/` files preserve the upstream snapshot. Local frontmatter makes the skill manual-only (`disable-model-invocation: true`) with a short human-facing description. Other local additions are this provenance file and `metadata.watch-sources` in `SKILL.md`. One extra trailing blank line in `references/source-map.md` was removed to satisfy `git diff --check`; all substantive upstream text is unchanged.

The refresh adds behavior/interface separation, whole-unit infrastructure ownership and deletion, and agent-sized context enforced through types/lint/boundaries. The external Rat Stack link is an example, not a local skill dependency or adoption requirement. No framework substitutions, router, or review integration is added.

Bundled benchmarks report upstream results, not locally reproduced evaluations. Upstream trigger evals describe automatic routing and are not acceptance criteria for this manual-only installation.

## License status

No license file was found at the upstream repository root or within the skill in the reviewed archive. No license grant is inferred from public availability or installation instructions. Clarify reuse terms before redistribution.
