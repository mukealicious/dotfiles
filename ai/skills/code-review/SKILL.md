---
name: code-review
description: Review code changes using parallel review agents. Use when reviewing PRs, recent commits, or uncommitted changes. Invoke with /code-review or when asked to review code.
---

# Code Review

Review code changes by running three independent reviews in parallel, correlating findings by severity, then validating with an architecture-level review pass. Use provided user guidance to steer the review and focus on specific code paths, changes, or areas of concern.

## Workflow

1. **Determine scope** — what to review:
   - If PR number/URL provided: fetch with `gh pr view` / `gh pr diff`
   - If uncommitted changes exist: review those (`git diff HEAD`)
   - Otherwise: review last commit (`git show HEAD`)

2. **Run 3 independent reviews in parallel** — each gets the same diff but reviews independently, focusing on bugs, security, and structure. Each review outputs findings with severity, file path, line number, and suggested fix.

3. **Correlate findings** by severity:
   - **Critical** — Will cause data loss, security breach, or system failure
   - **High** — Likely to cause bugs in production
   - **Medium** — Could cause issues under certain conditions
   - **Low** — Minor improvements, best practices

4. **Architecture validation** — Send correlated findings to an architecture-level reviewer for a deep accuracy/correctness review. The reviewer evaluates each finding against surrounding code, subsystems, abstractions, and overall architecture. Apply any recommendations (upgrade, downgrade, or dismiss findings). **NEVER SKIP ARCHITECTURE REVIEW.**

5. **Output unified report** — deduplicated, grouped by severity, with file paths, line numbers, and suggested fixes.

## Usage

```
/code-review              # Review uncommitted changes or last commit
/code-review 123          # Review PR #123
/code-review --last 3     # Review last 3 commits
```

## Output Format

```markdown
## Code Review Summary

**Scope:** {uncommitted changes | PR #X | last N commits}
**Files reviewed:** {count}

### Critical Issues
- **[file:line]** Description. Fix: suggestion.

### High Priority
- **[file:line]** Description. Fix: suggestion.

### Medium Priority
- **[file:line]** Description. Fix: suggestion.

### Low Priority / Suggestions
- **[file:line]** Description.

### Summary
{1-2 sentences: overall assessment}
```

## Review Principles

- **Be certain** — Don't flag something unless you've investigated
- **Full context** — Read entire files, not just diffs
- **No style zealotry** — Focus on bugs, not preferences
- **Realistic scenarios** — Don't invent hypothetical edge cases
- **Matter-of-fact** — No flattery, no hedging
