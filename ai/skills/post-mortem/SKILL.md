---
name: post-mortem
description: Analyze a session to identify successes, failures, and improvement opportunities in this repo's agent instructions, skills, and related AI-facing configuration. Use when the user asks for a post-mortem, retrospective, session analysis, or wants to improve agent behavior based on past interactions.
metadata:
  watch-sources: walterra/agent-tools/packages/post-mortem@ef2ef41
---

# Post-Mortem

Analyze a live session or chat export, identify what helped or hurt, and turn the findings into durable improvements for this repo's agent-facing setup.

## When to Use

- User asks for a post-mortem, retrospective, or session analysis
- User wants to improve agent behavior based on a prior interaction
- User provides a local chat export or shared URL for review

## Input Modes

Support all three input modes as first-class paths:

1. **Current session** - default when no external source is provided
2. **Local export file** - read JSON, markdown, or text chat exports
3. **Remote URL** - fetch the shared export, then analyze it

If the user narrows the focus, keep the analysis scoped to that theme while still noting broader structural issues when they are clearly causal.

## Workflow

### Phase 1: Load the Session

1. If no source is provided, analyze the current conversation.
2. If a local path is provided, read the export file.
3. If a URL is provided, fetch it and analyze the fetched content.
4. Trace the conversation flow, tool usage, decision points, confusion, retries, and recovery moments.

### Phase 2: Analyze What Happened

Identify:

- what went well
- what went wrong
- root causes
- missed opportunities
- user friction points
- tool selection or workflow issues
- missing instructions, missing context, or unclear guidance

Focus on durable causes, not just surface mistakes.

### Phase 3: Map Findings to Repo Surfaces

Recommend the narrowest local authoring surface that owns the fix:

- shared behavior -> `ai/instructions/base.md` or `ai/skills/*/SKILL.md`
- harness-specific behavior -> `claude/instructions/appendix.md`, `pi/instructions/appendix.md`, or `opencode/instructions/appendix.md`
- Claude-only runtime glue -> `claude/skills/*/SKILL.md` only when a shared skill is not enough
- Pi-runtime behavior -> `pi/extensions/*`, `pi/packages/*`, or nearby Pi docs when the issue is Pi-specific
- documentation confusion -> the narrowest doc that explains the workflow, such as `ai/README.md` or `pi/README.md`

Prefer local source files over installed runtime outputs. Do not recommend edits to generated or installer-managed projections when the source file is available.

## Assessment Heuristics

Check whether the outcome was shaped by:

- missing or weak shared instructions
- an absent skill or incomplete skill workflow
- the wrong ownership boundary for a rule or behavior
- harness-specific behavior leaking into shared guidance
- unclear docs around install flow, runtime discovery, or tool usage
- Pi-specific runtime behavior that belongs in an extension or package rather than skill text

## Recommendation Rules

- Tie every recommendation to a real file or concrete new artifact
- Explain why that file is the right owner for the fix
- Prefer concrete wording or workflow changes over vague advice
- Prefer narrow edits over broad repo rewrites
- Keep Watch integration lightweight; `metadata.watch-sources` is for future comparison, not a reason to add Watch-only dependencies

## Required Output

Present the post-mortem with these sections in substance, even if the exact headings vary by harness:

- what went well
- key issues
- root causes
- recommended file changes
- approval checkpoint

For recommended file changes, include:

- target file
- proposed change
- rationale
- whether the change is shared, harness-specific, or Pi-runtime-specific

Make the recommendations specific enough that they can be implemented immediately after approval.

## Approval Gate

Before editing anything, stop and clearly separate:

- analysis findings
- proposed file changes
- what will happen if the user approves

Ask the user to review the recommendations. Do not edit files until the user explicitly approves.

## After Approval

Once the user explicitly approves, apply the approved changes directly in the same flow.

- Do not require a second planning pass unless the approved changes materially expand scope
- Edit only the approved files
- Preserve the narrowest-owner rule while implementing
- Summarize what changed after the edits are complete

## Guardrails

- Do not recommend Cursor-specific files such as `.cursorrules` or `.cursor/skills/`
- Do not broaden scope to arbitrary repo history outside the provided session or export
- Do not make edits without explicit approval
- Do not assume every issue belongs in a skill; sometimes the fix belongs in shared instructions, docs, or Pi runtime surfaces

This skill is intentionally instruction-only in v1.
