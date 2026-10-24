# Source provenance

- Primary source: https://github.com/cloudflare/security-audit-skill
- Reviewed commit: `c1c8a8c1471069fb0e188eeaff69b8e8db6564a8`
- Commit date: 2026-09-14; reviewed: 2026-10-24.
- Entry: https://github.com/cloudflare/security-audit-skill/blob/c1c8a8c1471069fb0e188eeaff69b8e8db6564a8/skills/security-audit/SKILL.md
- Context: https://x.com/jurbed/status/2112973191157252103 links through
  `https://t.co/Mu6Dm0fzk8` to that repository.
- Upstream license: MIT, copyright 2025–2026 Cloudflare, Inc. See
  [the pinned license](https://github.com/cloudflare/security-audit-skill/blob/c1c8a8c1471069fb0e188eeaff69b8e8db6564a8/LICENSE).

## Disposition

Local original adaptation, not a vendored upstream snapshot. No upstream executable
code or prompts are copied. The local skill preserves the evidence distinction and
execution gate while deliberately limiting its capability to manual source review.
It does not implement the upstream six-phase workflow, schema, coverage ledger,
agent orchestration, sandbox, or artifact promotion. Source updates require a fresh
manual review; the provenance metadata is not an updater.

The lab is original synthetic code. It demonstrates one authorization boundary and
a regression fix. It is not a test of upstream model effectiveness.

## Capability overlap

| Existing owner | Relationship |
| --- | --- |
| `production-readiness` | Reliability and data-boundary risks; this adds principal-to-resource vulnerability triage. |
| `diagnosing-bugs` | Reproduction and regression method; its execution recipes do not bypass this source-only gate. |
| `uncomplect` | Authority and lifecycle design; this tests a specific boundary claim rather than replacing architecture. |
| `upstream-review` | Owns later adoption and provenance decisions; this does not auto-sync. |
| `opensrc` / `surf-browser` | Acquire sources; neither grants audit authority or provider consent. |

## Risks retained

Source and prior findings can contain prompt injection or secrets. Source review
can disclose code to the current model provider. Reports can assert plausible but
false traces. The upstream validators check format and selected semantic invariants,
not source truth, exploitability, or reviewer independence. The upstream skill does
not supply its required OS sandbox or race-safe evidence promotion implementation.
Its subagent count budget is not a token, cost, or wall-clock ceiling.

The post recommends free models and says the method is model-independent. Its
author later says GPT models do not work. These are anecdotal claims, not validated
compatibility or quality guarantees. No remote model test was performed here.
