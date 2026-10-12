# Adopted From

- Upstream: https://github.com/dmmulroy/skills
- Path: `tech-spec/`
- Ref: `8603380821fee6a77c82639f364ce8fe4f5a92be`
- Adopted: 2026-10-12

## Source decision

Explicitly adopted from Mulroy's published skills collection, whose reviewed
`main` is this July 23 snapshot. This is not the October dotfiles snapshot or
evidence that its later deletions were a move. The user approved this collection
in addition to the retained dotfiles skills and Joel's independent Uncomplect.

The complete upstream directory is retained, including supporting resources.
Preserved `disable-model-invocation: true`: this remains a manual, design-only workflow.

## Local changes

- Added this provenance file and `metadata.watch-sources`.
- Copied the repository's root MIT `LICENSE` unchanged, including its Matt Pocock
  copyright notice. Do not rewrite attribution to infer different authorship.
- Replaced the missing sibling TDD-workflow dependency with a relative link to
  the Testing section of `coding-standards/SKILL.md`. Upstream ships no sibling TDD skill.
  The explicit RGR plan, grill-first branch, required outline, and design-only
  behavior are otherwise unchanged; no retired global TDD skill was restored.

No upstream installer, package manifest, or `prelude` skill is imported or run.
The four adopted skills do not depend on prelude; installation remains owned by
`ai/install.sh`. Spec-writing guidance is owned by `tech-spec`; the former local
worked example and its instruction pointer have been removed.
