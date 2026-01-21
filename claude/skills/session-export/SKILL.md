---
name: session-export
description: Add AI session summary to GitHub PR description. Use after completing work to document AI assistance. Invoke with /session-export <pr-number>.
---

# Session Export

Update PR descriptions with a structured summary of the AI-assisted conversation.

## Usage

```
/session-export 123        # Update PR #123
/session-export            # Update current branch's PR
```

## Output Format

```markdown
> [!NOTE]
> This PR was written with AI assistance.

<details><summary>AI Session Export</summary>
<p>

```json
{
  "info": {
    "title": "<brief task description>",
    "agent": "claude-code",
    "models": ["<model(s) used>"]
  },
  "summary": [
    "<action 1>",
    "<action 2>"
  ]
}
```

</p>
</details>
```

## Workflow

### 1. Get PR Number

If not provided, find current branch's PR:
```bash
gh pr view --json number -q '.number'
```

### 2. Generate Summary JSON

From conversation context:

- **title**: 2-5 word task description (lowercase)
- **agent**: "claude-code"
- **models**: models used in session
- **summary**: array of terse action statements
  - Use past tense ("added", "fixed", "created")
  - Start with "user requested..." or "user asked..."
  - Chronological order
  - Max ~25 entries

**NEVER include sensitive data**: API keys, credentials, secrets, tokens, passwords, env vars

### 3. Get Existing PR Description

```bash
gh pr view <PR_NUMBER> --json body -q '.body'
```

### 4. Update PR Description

```bash
gh pr edit <PR_NUMBER> --body "$(cat <<'EOF'
<existing description>

> [!NOTE]
> This PR was written with AI assistance.

<details><summary>AI Session Export</summary>
<p>

```json
{
  "info": {
    "title": "...",
    "agent": "claude-code",
    "models": ["..."]
  },
  "summary": [
    "..."
  ]
}
```

</p>
</details>
EOF
)"
```

## Example Summary

```json
{
  "info": {
    "title": "dark mode implementation",
    "agent": "claude-code",
    "models": ["claude-sonnet-4"]
  },
  "summary": [
    "user requested dark mode toggle in settings",
    "agent explored existing theme system",
    "agent created ThemeContext for state management",
    "agent added DarkModeToggle component",
    "agent updated CSS variables for dark theme",
    "agent ran tests and fixed 2 failures",
    "agent committed changes"
  ]
}
```

## Security

**NEVER include in summary:**
- API keys, tokens, secrets
- Passwords, credentials
- Environment variable values
- Private URLs with auth tokens
- Personal identifiable information
- Internal hostnames/IPs
