---
name: framing-doc
description: Creates evidence-grounded framing documents from transcripts, call notes, VTT files, or pasted stakeholder conversations. Use when turning raw conversations into a problem frame with source quotes, options considered, problem, outcome, and solution-space boundaries.
metadata:
  watch-sources: rjs/shaping-skills/framing-doc@main
---

# Framing Doc

Turn one or more real conversations into a framing document. The frame captures the "why": what problem is worth solving now, why this one rose above other options, and what success looks like without prescribing the implementation.

## Inputs

Before drafting, get:

1. Transcript paths or pasted source material, in conversation order when order matters.
2. Topic area, even if rough.
3. Intended audience and where the output should live, if the user wants a file.

Read the full source before drafting. Do not start writing from a partial read unless the user explicitly asks for an incremental pass.

## Output Shape

Use this structure unless the user asks for a different format:

```markdown
---
shaping: true
---

# [Topic] - Frame

## Source

### [Speaker or Conversation] ([Date if known])

> "Verbatim quote..."

[Brief connective context only where needed.]

## Pre-work: [Topic] Options Landscape

| Option | What it does | Who benefits | Signal strength |
|--------|--------------|--------------|-----------------|
| **A. [Name]** | ... | ... | ... |

**Why this now:** [Evidence-based argument.]

## Problem

- [Pain or broken condition, traceable to source]

## Outcome

- [High-level success condition, not a solution detail]

## Less about

- [Wrong or less-central direction, if useful]

## More about

- [What kind of problem/solution direction actually fits]
```

## Evidence Discipline

Treat the Source section as ground truth. Everything else is interpretation and must be traceable.

- Attribute quotes to speakers when known.
- Keep quotes short enough to support the frame, not summarize the whole conversation.
- For each Problem and Outcome bullet, ask: who said this, and where?
- If a claim is directly implied rather than stated, mark it as synthesis and explain the reasoning.
- If a claim cannot be traced to the source, drop it.

## Options Landscape

List only options with real signal. Signal can mean multiple people raised it independently, others built on it, or it clearly shaped the final direction.

Avoid padded option lists. One-off ideas that nobody picked up can be mentioned briefly as dropped, but should not be elevated into equal alternatives.

When explaining why one option is first, use "why this now" and "why not the others right now." Do not invent a roadmap for the rest.

## Boundaries

Include Less about / More about only when the source material shows a likely misunderstanding or an obvious but wrong solution direction. These sections are synthesis, not quotes.

## What This Skill Does Not Do

- It does not shape the solution.
- It does not produce a build sequence.
- It does not summarize the entire conversation.
- It does not judge whether the underlying thinking is correct beyond evidence traceability.
