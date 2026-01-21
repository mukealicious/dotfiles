---
name: code-review
description: Review code changes using parallel review agents. Use when reviewing PRs, recent commits, or uncommitted changes. Invoke with /code-review or when asked to review code.
---

# Code Review

Review code changes by spawning multiple review agents in parallel and correlating findings by severity.

## Workflow

1. **Determine scope** - What to review:
   - If PR number/URL provided: fetch with `gh pr view`
   - If uncommitted changes exist: review those
   - Otherwise: review last commit

2. **Get the diff**:
   ```bash
   # Uncommitted changes
   git diff HEAD

   # Last commit
   git show HEAD

   # PR
   gh pr diff <number>
   ```

3. **Spawn 3 review agents in parallel** using Task tool:
   - Each agent gets the same diff but reviews independently
   - Use `subagent_type: "review"` or the review agent
   - Agents focus on: bugs, security, structure

4. **Correlate findings** by severity:
   - **Critical** - Will cause data loss, security breach, or system failure
   - **High** - Likely to cause bugs in production
   - **Medium** - Could cause issues under certain conditions
   - **Low** - Minor improvements, best practices

5. **Output unified report**:
   - Deduplicate findings across agents
   - Group by severity
   - Include file paths and line numbers
   - Suggest fixes where appropriate

## Usage

```
/code-review              # Review uncommitted changes or last commit
/code-review 123          # Review PR #123
/code-review --last 3     # Review last 3 commits
```

## Agent Invocation

Spawn three Task agents in a single message for parallel execution:

```
Task(
  description="review-agent-1",
  subagent_type="general",
  prompt="Review these code changes for bugs, security issues, and structural problems. Focus on: logic errors, edge cases, security vulnerabilities. Be certain before flagging - investigate unclear code. Output findings with severity (Critical/High/Medium/Low), file path, line number, and suggested fix.

<diff>
{diff content}
</diff>"
)

Task(
  description="review-agent-2",
  subagent_type="general",
  prompt="Review these code changes... [same prompt]"
)

Task(
  description="review-agent-3",
  subagent_type="general",
  prompt="Review these code changes... [same prompt]"
)
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

- **Be certain** - Don't flag something unless you've investigated
- **Full context** - Read entire files, not just diffs
- **No style zealotry** - Focus on bugs, not preferences
- **Realistic scenarios** - Don't invent hypothetical edge cases
- **Matter-of-fact** - No flattery, no hedging
