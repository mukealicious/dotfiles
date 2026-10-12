# Adopted From

- Imported snapshot: https://github.com/dmmulroy/.dotfiles
- Path: `home/.agents/skills/diagnosing-bugs/`
- Ref: `bdf5e0611d62436eeb5dc58555c1396ced2dddeb` (latest main reviewed 2026-10-12)
- Original source: https://github.com/mattpocock/skills
- Original path: `skills/engineering/diagnosing-bugs/SKILL.md`, as recorded in Mulroy's `.skill-lock.json`.

The entire skill directory is retained, including `agents/openai.yaml` and the human-in-the-loop script template. The upstream body and resources are unchanged. Local additions are this file, the original MIT `LICENSE`, and `metadata.watch-sources` in `SKILL.md`. No invocation override, framework policy, or debugging wrapper is added.

The current snapshot adds a check that a deliberately induced red-test mutation actually landed before trusting its failure. The template was inspected and syntax-checked, not executed against an application.

## License status

All three imported files were verified byte-identical to `mattpocock/skills@49dd158d1076134a641b33efb035946536778336`, under `skills/engineering/diagnosing-bugs/`. Its root MIT license (copyright 2026 Matt Pocock) is retained here as `LICENSE`. Mulroy's lockfile folder hash is not a commit pin; the original-source commit above was separately verified.
