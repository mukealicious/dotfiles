---
name: commit
description: Create git commits using Conventional Commits format. Use when the user asks to commit, save changes, or invokes /commit.
---

# Commit

Create commits following [Conventional Commits](https://www.conventionalcommits.org/).

## Format

```
<type>(<scope>): <summary>
```

- Summary: imperative mood, lowercase, no period, <=72 chars
- Scope: optional, derived from changed files or project area

## Types

| Type | When |
|---|---|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code change that neither fixes nor adds |
| `chore` | Build, config, tooling, dependencies |
| `test` | Adding or correcting tests |
| `perf` | Performance improvement |

## Workflow

1. Run `git status` to see all changes
2. Run `git diff` (staged + unstaged) to understand what changed
3. Run `git log -n 50 --oneline` to check common scopes and style
4. Stage relevant files (`git add <files>` — prefer specific files over `git add .`)
5. Write commit message matching the format above
6. Commit — do NOT push unless explicitly asked

## Rules

- One logical change per commit — split unrelated changes
- Never commit secrets (`.env`, credentials, API keys)
- Never use `--no-verify` unless explicitly asked
- If a pre-commit hook fails, fix the issue and create a NEW commit (don't amend)
- Use the repo's existing scope conventions from `git log`

## Multi-line Messages

For commits needing more context, add a body after a blank line:

```
feat(auth): add JWT refresh token rotation

Tokens now rotate on each refresh request. Old tokens are
invalidated after a 30-second grace period to handle concurrent
requests.
```
