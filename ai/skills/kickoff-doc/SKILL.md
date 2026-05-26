---
name: kickoff-doc
description: Creates builder-facing kickoff documents from project kickoff transcripts, VTT files, call notes, mockup walkthroughs, or shaped planning conversations. Use when a conversation should become a reference doc describing the frame and shaped territory.
metadata:
  watch-sources: rjs/shaping-skills/kickoff-doc@main
---

# Kickoff Doc

Turn a shaped kickoff conversation into a builder-facing reference document. The output is not a chronological summary. It reconstructs the territory that was agreed so a builder can make local decisions without replaying the call.

## Inputs

Before drafting, identify:

1. The transcript or notes to read.
2. The primary audience, usually the builder.
3. Any supporting inputs: screenshots, mockups, breadboards, tickets, sketches, or existing frame docs.

Read the full transcript before writing.

## Organizing Principle

Organize by the thing being built, not by the order people talked.

Each Shape subsection should describe one area of the system fully: what is on the screen, what it does, how it relates to other areas, and which decisions matter there.

Do not include a build sequence unless the user explicitly asks. If the team discussed slices, mention that slices are tracked separately.

## Output Shape

```markdown
# [Project] - Kickoff

## Frame

### Problem

[Why this project, why now. What is broken or missing.]

### Outcome

[Specific outcomes expected. What success looks like.]

## Shape

### [Area of the System]

[What this area is, what appears there, how it behaves, and what decisions were agreed.]

### [Another Area]

[Same pattern.]
```

## Voice and Evidence

This document records shared understanding from the kickoff.

- Use the actual words and phrases people used when they are important.
- Synthesize scattered discussion into clean statements.
- Capture the reasoning people gave for decisions.
- Do not add new ideas, motivational framing, or conclusions that were not said or clearly meant.

For every sentence, be able to point to the transcript moment that supports it. If a sentence is useful synthesis rather than directly stated, keep it grounded and avoid overstating certainty.

## Design Decisions

Place decisions inline where they matter. Avoid a generic "Design Decisions" grab bag.

Examples:

- A storage decision for matching belongs in the matching section.
- A materialization rule for candidates belongs in the candidate attachment section.
- A temporary placeholder belongs in the area where the placeholder appears.

The builder should not need to cross-reference a separate list to understand a specific area.

## Process

1. Read the whole transcript and supporting inputs.
2. Identify the system areas that were discussed.
3. Draft Frame from problem/outcome discussion.
4. Write Shape sections by area, pulling related comments from anywhere in the transcript.
5. Put decisions, edge cases, and temporary-vs-committed notes inline.
6. Review against the source and remove unsupported claims.
