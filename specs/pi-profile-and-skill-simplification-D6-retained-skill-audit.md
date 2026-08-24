# D6 Frozen Retained-Skill Source Audit

- **Deliverable:** D6
- **Approved contract:** `specs/pi-profile-and-skill-simplification.md`
- **Frozen:** 2026-08-18, before any D6 skill edit
- **Scope:** retained or adopted upstream-derived shared skills only
- **Rule:** source paths and full commit SHAs below are the finite D6 audit boundary. D6 uses these reviewed snapshots only; it does not sync current upstream or inspect skills outside this retained/adopted inventory.

`keep` means retain the local skill and its current ownership boundary. `adopt` means add or adapt only the named local artifact from the reviewed source. `no-change` means provenance/source ownership remains unchanged in D6. `defer` means retain the source record but leave adoption to a later deliverable.

| Local artifact | Exact upstream source path | Immutable source SHA | Disposition | D6 boundary |
|---|---|---|---|---|
| `ai/skills/codebase-design/` | `mattpocock/skills/skills/engineering/codebase-design/SKILL.md` | `9c9f36ccd3995266cd675468af71639c8dde1ec5` | adopt | Sole deep-module, interface, seam, locality, testability, and conditional design-it-twice owner |
| `ai/skills/codebase-design/` | `mattpocock/skills/skills/engineering/codebase-design/DEEPENING.md` | `9c9f36ccd3995266cd675468af71639c8dde1ec5` | adopt | Deepening vocabulary/reference |
| `ai/skills/codebase-design/` | `mattpocock/skills/skills/engineering/codebase-design/DESIGN-IT-TWICE.md` | `9c9f36ccd3995266cd675468af71639c8dde1ec5` | adopt | Explicit consequential-interface exploration only |
| `ai/skills/grilling/` | `dmmulroy/.dotfiles/home/.agents/skills/grilling/SKILL.md` | `f9f7aa1a3638d6bfb6fa0b94fd110185534a2895` | adopt | Reusable dependency-aware design-tree and batched-frontier questioning |
| `ai/skills/domain-modeling/` | `dmmulroy/.dotfiles/home/.agents/skills/domain-modeling/SKILL.md` | `f9f7aa1a3638d6bfb6fa0b94fd110185534a2895` | adopt | Durable domain language/docs and qualifying ADR decisions |
| `ai/skills/domain-modeling/` | `dmmulroy/.dotfiles/home/.agents/skills/domain-modeling/ADR-FORMAT.md` | `f9f7aa1a3638d6bfb6fa0b94fd110185534a2895` | adopt | Supporting ADR format |
| `ai/skills/domain-modeling/` | `dmmulroy/.dotfiles/home/.agents/skills/domain-modeling/CONTEXT-FORMAT.md` | `f9f7aa1a3638d6bfb6fa0b94fd110185534a2895` | adopt | Supporting context format |
| `ai/skills/tdd/` | `dmmulroy/.dotfiles/home/.agents/skills/tdd/SKILL.md` | `f9f7aa1a3638d6bfb6fa0b94fd110185534a2895` | adopt | Compact red/green vertical-slice TDD discipline |
| `ai/skills/tdd/` | `dmmulroy/.dotfiles/home/.agents/skills/tdd/tests.md` | `f9f7aa1a3638d6bfb6fa0b94fd110185534a2895` | adopt | Focused testing reference |
| `ai/skills/tdd/` | `dmmulroy/.dotfiles/home/.agents/skills/tdd/mocking.md` | `f9f7aa1a3638d6bfb6fa0b94fd110185534a2895` | adopt | Focused mocking reference |
| `ai/skills/implement/` | `dmmulroy/.dotfiles/home/.agents/skills/implement/SKILL.md` | `f9f7aa1a3638d6bfb6fa0b94fd110185534a2895` | adopt | Manual current-session implementation only; no automatic delegation or commit |
| `ai/skills/bro/` | `dmmulroy/.dotfiles/home/.agents/skills/bro/SKILL.md` | `f9f7aa1a3638d6bfb6fa0b94fd110185534a2895` | adopt | Manual plain-language restatement |
| `ai/skills/grill-me/` | `mattpocock/skills/skills/productivity/grill-me/SKILL.md` | `9c9f36ccd3995266cd675468af71639c8dde1ec5` | keep | Thin manual entry into local `grilling`; do not duplicate its body |
| `ai/skills/grill-with-docs/` | `mattpocock/skills/skills/engineering/grill-with-docs/SKILL.md` | `9c9f36ccd3995266cd675468af71639c8dde1ec5` | keep | Thin composition of local `grilling` and `domain-modeling` |
| `ai/skills/framing-doc/` | `rjs/shaping-skills/framing-doc/SKILL.md` | `d8b65d7733c71e9bf436f0c2e4da60e5214a96d9` | keep | Concise evidence-grounded “why” before shaping |
| `ai/skills/kickoff-doc/` | `rjs/shaping-skills/kickoff-doc/SKILL.md` | `d8b65d7733c71e9bf436f0c2e4da60e5214a96d9` | keep | Concise builder-facing shaped territory after shaping |
| `ai/skills/breadboarding/` | `rjs/shaping-skills/breadboarding/skill.md` | `d8b65d7733c71e9bf436f0c2e4da60e5214a96d9` | no-change | Preserve mapping owner and pin reviewed provenance |
| `ai/skills/breadboarding/` | `rjs/shaping-skills/breadboard-reflection/skill.md` | `d8b65d7733c71e9bf436f0c2e4da60e5214a96d9` | no-change | Preserve reflection material folded into breadboarding |
| `ai/skills/post-mortem/SKILL.md` | `walterra/agent-tools/packages/post-mortem/SKILL.md` | `f5d822b92b2610c9f1acc01c8d102cad1ca1c081` | no-change | Preserve maintenance/post-mortem ownership and existing pin |
| `ai/skills/production-readiness/` | `wondelai/skills/release-it/SKILL.md` | `eff8b3cab2d9afab9dc09c4cc04e80ad9641db29` | no-change | Preserve production/reliability ownership and existing pin |
| `ai/skills/production-readiness/` | `wondelai/skills/ddia-systems/SKILL.md` | `eff8b3cab2d9afab9dc09c4cc04e80ad9641db29` | no-change | Preserve data-boundary ownership and existing pin |
| `ai/skills/tufte-data-viz/` | `caylent/tufte-data-viz` | `ae7ca0de7819db83241b24a2618810d5f1171145` | no-change | Preserve quantitative visualization ownership and existing pin |
| `ai/skills/tufte-data-viz/` | `aref-vc/tufte-claude-skill` | `e0d5a48545999c3a2a2f14596f3e1bcedd2b96ea` | no-change | Preserve chart-selection influence and existing pin |
| `ai/skills/tufte-data-viz/` | `gnurio/tufte-vdqi-plugin` | `a8c605400db070095fca33d0944316ed71e72667` | no-change | Preserve assessment-rigor influence and existing pin |
| `ai/skills/visual-deliverables/` | `plannotator/effective-html/skills/html-diagram` | `138daaddddce5b89f0950aa446333bc03f3f7e95` | no-change | Preserve self-contained HTML/SVG artifact ownership |
| `ai/skills/visual-deliverables/` | `plannotator/effective-html/skills/html-plan` | `138daaddddce5b89f0950aa446333bc03f3f7e95` | no-change | Preserve self-contained HTML/SVG artifact ownership |
| `ai/skills/visual-deliverables/` | `ThariqS/html-effectiveness` | `0e8d447494c81c661f2458b329e076a7ff7d75ec` | no-change | Preserve bundled example provenance |
| `ai/skills/impeccable/SKILL.md` | `pbakaus/impeccable/.agents/skills/impeccable` | `39bec7c08c8cb5d694221e2c2e4386140dde8759` | no-change | Preserve product UI/UX ownership; repair watched path only |
| `ai/skills/hunk-review/SKILL.md` | `modem-dev/hunk/skills/hunk-review/SKILL.md` | `8a2e0d86c3696e796eb058d8193e8e553545fb68` | no-change | Preserve Hunk review ownership and source pin |
| `ai/skills/hunk-review/SKILL.md` | `modem-dev/hunk/docs/agent-workflows.md` | `8a2e0d86c3696e796eb058d8193e8e553545fb68` | no-change | Preserve Hunk workflow guidance and source pin |
| `ai/skills/herdr/` | `herdrdev/herdr/skills/herdr/SKILL.md` | `346411fa21afd297f5ed3b3fa56f9e3fbf7654b7` | defer | D9 owns Herdr refresh; retain current local policy in D6 |

## Explicit exclusions

- This audit does not include skills selected for deletion, their source trees, or unrelated upstream resources.
- D7 owns Mitsupi resources, package curation, patches, and modes.
- D8 owns the handoff skill and extension.
- The audited sources are comparison/adoption inputs, not permission to auto-sync current upstream.
