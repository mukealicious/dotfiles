# Coding standards references

Optional source material for project-local docs, not global engineering policy.
Use the manual `writing-for-agents` skill for document authoring. Prefer an
existing project's standards with similar framework, runtime, public contracts,
and delivery constraints; adapt selected rules into the target project's own
docs rather than inheriting another repository's live policy.

## Available examples

| Reference | Useful context |
|---|---|
| [Historical TypeScript standards](typescript.md) | Our previously adopted Mulroy skills snapshot; broad correct-by-construction ideas, not a mandate |
| [Herdr SDK standards](https://github.com/dmmulroy/herdr-ts-sdk/blob/77abbf81ac35407bc5138a8f4fe19f0833af4402/docs/coding-standards.md) | One Effect-native Node package; explicit scope, public compatibility, parsing and lifecycle rules |
| [Cloudflare workflow-pool standards](https://github.com/dmmulroy/cf-workflow-pool/blob/73e0f2f5d3b72d85a17384638716c4b0490e16aa/docs/coding-standards.md) | Effect/Alchemy monorepo, infrastructure isolation, services and runtime boundaries |
| [Workflow-pool error design](https://github.com/dmmulroy/cf-workflow-pool/blob/73e0f2f5d3b72d85a17384638716c4b0490e16aa/docs/errors.md) | Typed internal/public errors, recovery guidance, safe diagnostics |

These upstream examples are backend-oriented, not suitable defaults for every UI
or existing Next.js project. Borrow their document structure where helpful:
state scope, group applicable rules by concern, keep specialized reference
separate, and give project agent instructions explicit reading triggers.
No fixed section list or new policy-generation skill is required.
