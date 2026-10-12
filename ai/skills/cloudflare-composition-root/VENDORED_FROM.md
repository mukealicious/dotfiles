# Adopted From

- Upstream: https://github.com/dmmulroy/skills
- Path: `cloudflare-composition-root/`
- Ref: `8603380821fee6a77c82639f364ce8fe4f5a92be`
- Adopted: 2026-10-12

## Source decision

Explicitly adopted from Mulroy's published skills collection, whose reviewed
`main` is this July 23 snapshot. This is not the October dotfiles snapshot or
evidence that its later deletions were a move. The user approved this collection
in addition to the retained dotfiles skills and Joel's independent Uncomplect.

The complete upstream directory is retained, including supporting resources.
Upstream does not set `disable-model-invocation`; model invocation remains enabled.

## Local changes

- Added this provenance file and `metadata.watch-sources`.
- Copied the repository's root MIT `LICENSE` unchanged, including its Matt Pocock
  copyright notice. Do not rewrite attribution to infer different authorship.
- Upstream skill body and supporting files are unchanged.

No upstream installer, package manifest, or `prelude` skill is imported or run.
The four adopted skills do not depend on prelude; installation remains owned by
`ai/install.sh`. Spec-writing guidance is owned by `tech-spec`; the former local
worked example and its instruction pointer have been removed.
