---
name: prd-task
description: Convert a PRD markdown file into executable JSON tasks. Use after creating a PRD with /prd. Invoke with /prd-task <prd-name>.
---

# PRD Task Conversion

Convert markdown PRDs to executable JSON format for autonomous task completion.

The PRD defines the **end state** via tasks with verification steps. The agent decides HOW to get there.

## Workflow

1. Read PRD from `.claude/state/<prd-name>/prd.md`
2. Extract tasks with verification steps
3. Output JSON to `.claude/state/<prd-name>/prd.json`
4. Create empty `.claude/state/<prd-name>/progress.txt`

## State Directory

```
.claude/state/<prd-name>/
├── prd.md        # Original markdown PRD
├── prd.json      # Converted JSON tasks
└── progress.txt  # Cross-iteration memory
```

## Input: PRD Markdown

Expects PRD with tasks and verification steps:

```markdown
## Tasks

### User Registration [functional]
User can register with email and password.

**Verification:**
- POST /api/auth/register with valid email/password
- Verify 201 response with user object
- Attempt duplicate email, verify 409
```

## Output: prd.json

```json
{
  "prdName": "<prd-name>",
  "tasks": [
    {
      "id": "functional-1",
      "category": "functional",
      "description": "User can register with email and password",
      "steps": [
        "POST /api/auth/register with valid email/password",
        "Verify 201 response with user object",
        "Attempt duplicate email, verify 409"
      ],
      "passes": false
    }
  ],
  "context": {
    "patterns": ["API routes: src/routes/items.ts"],
    "keyFiles": ["src/db/schema.ts"],
    "nonGoals": ["OAuth/social login"]
  }
}
```

## Task Schema

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | `<category>-<number>` e.g., "db-1", "api-2" |
| `category` | string | "functional", "ui", "api", "security", "testing" |
| `description` | string | What the task does when complete |
| `steps` | string[] | **Verification steps** - how to test it works |
| `passes` | boolean | Set to `true` when ALL steps verified |

## Conversion Rules

### Task Sizing
- One logical change per task
- Split large sections into multiple tasks
- Each task completable in one commit
- Prefer many small tasks over few large ones

### From Markdown
- `### Title [category]` → task with category
- Text after title → `description`
- Items under `**Verification:**` → `steps`
- `passes` always starts `false`

### Context Preserved
- `context.patterns` - existing code patterns
- `context.keyFiles` - files to explore first
- `context.nonGoals` - explicit scope boundaries

## PRD Name

Derive from title:
- `# PRD: User Authentication` → `"prdName": "user-authentication"`

## After Conversion

```
PRD converted to .claude/state/<prd-name>/

Files:
  - prd.md (original)
  - prd.json (generated)
  - progress.txt (empty)

PRD: <prd-name>
Tasks: X total
  - functional: N
  - testing: N

To complete tasks:
  /complete-task <prd-name>
```

## Field Rules

**READ-ONLY except:**
- `passes`: Set to `true` when ALL verification steps pass

**NEVER edit or remove tasks** - Could lead to missing functionality.
