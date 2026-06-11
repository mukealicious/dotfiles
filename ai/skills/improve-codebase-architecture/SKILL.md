---
name: improve-codebase-architecture
description: Explore an existing codebase to find architecture/refactoring opportunities. Use for architecture discovery passes that identify deepening candidates, module-shape friction, CONTEXT.md vocabulary gaps, or ADR-worthy decisions. For everyday implementation/refactoring doctrine, use engineering-patterns.
license: MIT. Copyright (c) 2026 Matt Pocock.
metadata:
  watch-sources: mattpocock/skills/skills/engineering/improve-codebase-architecture@b843cb5ea74b1fe5e58a0fc23cddef9e66076fb8
references:
  - ../engineering-patterns/SKILL.md
  - ../engineering-patterns/references/deep-modules.md
  - LANGUAGE.md
  - DEEPENING.md
---

# Improve Codebase Architecture

Surface architectural friction and propose **deepening opportunities** — refactors that turn shallow modules into deep ones. The aim is testability and AI-navigability.

This skill is now the **exploration workflow**. Use
`engineering-patterns` for the canonical day-to-day doctrine and vocabulary
when implementing, refactoring, reviewing, or doing final cleanup.

## Vocabulary Discipline

Use `engineering-patterns` vocabulary exactly: module, interface, implementation,
depth, seam, adapter, leverage, locality, deletion test. Load [LANGUAGE.md](LANGUAGE.md)
only when you need full definitions or are writing durable architecture notes.

This skill is informed by the project's domain model. Domain language gives
names to good seams; ADRs record decisions this skill should not re-litigate.

## Process

### 1. Explore

Read the project's domain glossary and any ADRs in the area you're touching first.

Then use available scout/explore subagents to walk the codebase. Don't follow rigid heuristics — explore organically and note where you experience friction:

- Where does understanding one concept require bouncing between many small modules?
- Where are modules **shallow** — interface nearly as complex as the implementation?
- Where have pure functions been extracted just for testability, but the real bugs hide in how they're called (no **locality**)?
- Where do tightly-coupled modules leak across their seams?
- Which parts of the codebase are untested, or hard to test through their current interface?

Apply the **deletion test** to anything you suspect is shallow: would deleting it concentrate complexity, or just move it? A "yes, concentrates" is the signal you want.

### 2. Present candidates

Present a numbered list of deepening opportunities. For each candidate:

- **Files** — which files/modules are involved
- **Problem** — why the current architecture is causing friction
- **Solution** — plain English description of what would change
- **Benefits** — explained in terms of locality and leverage, and also in how tests would improve

**Use CONTEXT.md vocabulary for the domain, and [LANGUAGE.md](LANGUAGE.md) vocabulary for the architecture.** If `CONTEXT.md` defines "Order," talk about "the Order intake module" — not "the FooBarHandler," and not "the Order service."

**ADR conflicts**: if a candidate contradicts an existing ADR, only surface it when the friction is real enough to warrant revisiting the ADR. Mark it clearly (e.g. _"contradicts ADR-0007 — but worth reopening because…"_). Don't list every theoretical refactor an ADR forbids.

Do NOT propose interfaces yet. Ask the user: "Which of these would you like to explore?"

### 3. Grilling loop

Once the user picks a candidate, drop into a grilling conversation. Walk the design tree with them — constraints, dependencies, the shape of the deepened module, what sits behind the seam, what tests survive.

Side effects happen inline as decisions crystallize:

- **Naming a deepened module after a concept not in `CONTEXT.md`?** Add the term to `CONTEXT.md` — same discipline as `/grill-with-docs` (see [CONTEXT-FORMAT.md](CONTEXT-FORMAT.md)). Create the file lazily if it doesn't exist.
- **Sharpening a fuzzy term during the conversation?** Update `CONTEXT.md` right there.
- **User rejects the candidate with a load-bearing reason?** Offer an ADR, framed as: _"Want me to record this as an ADR so future architecture reviews don't re-suggest it?"_ Only offer when the reason would actually be needed by a future explorer to avoid re-suggesting the same thing — skip ephemeral reasons ("not worth it right now") and self-evident ones. See [ADR-FORMAT.md](ADR-FORMAT.md).
- **Want to explore alternative interfaces for the deepened module?** See [INTERFACE-DESIGN.md](INTERFACE-DESIGN.md).
