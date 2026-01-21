---
name: index-knowledge
description: Generate an AGENTS.md file documenting the codebase. Use when onboarding to a new project or creating documentation for AI agents. Invoke with /index-knowledge.
---

# Index Knowledge

Generate hierarchical AGENTS.md files for a codebase. Creates root documentation with optional subdirectory files for complex projects.

## Usage

```
/index-knowledge              # Update mode (modify existing + create new)
/index-knowledge --create-new # Remove all existing, regenerate from scratch
/index-knowledge --max-depth=2  # Limit directory depth (default: 5)
```

## Workflow

### Phase 1: Discovery

1. **Analyze project structure**:
   ```bash
   # Directory depth + file counts
   find . -type d -not -path '*/\.*' -not -path '*/node_modules/*' | head -50

   # Files per directory (top 30)
   find . -type f -not -path '*/\.*' -not -path '*/node_modules/*' | sed 's|/[^/]*$||' | sort | uniq -c | sort -rn | head -30

   # Existing AGENTS.md
   find . -type f -name "AGENTS.md" -not -path '*/node_modules/*' 2>/dev/null
   ```

2. **Explore key areas** using Task agents in parallel:
   - Project structure and entry points
   - Conventions and config files
   - Anti-patterns (DO NOT, NEVER comments)
   - Build/CI patterns
   - Test patterns

3. **Read existing AGENTS.md** if present (preserve context even with --create-new)

### Phase 2: Score & Decide

Score directories for AGENTS.md placement:

| Factor | Weight | High Threshold |
|--------|--------|----------------|
| File count | 3x | >20 files |
| Subdir count | 2x | >5 subdirs |
| Code ratio | 2x | >70% code files |
| Unique patterns | 1x | Has own config |
| Module boundary | 2x | Has index/init |

| Score | Action |
|-------|--------|
| Root | ALWAYS create |
| >15 | Create AGENTS.md |
| 8-15 | Create if distinct domain |
| <8 | Skip (parent covers) |

### Phase 3: Generate

#### Root AGENTS.md

```markdown
# PROJECT KNOWLEDGE BASE

**Generated:** {TIMESTAMP}
**Commit:** {SHORT_SHA}

## OVERVIEW
{1-2 sentences: what + core stack}

## STRUCTURE
```
{root}/
├── {dir}/    # {non-obvious purpose only}
└── {entry}
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|

## CONVENTIONS
{ONLY deviations from standard}

## ANTI-PATTERNS (THIS PROJECT)
{Explicitly forbidden here}

## COMMANDS
```bash
{dev/test/build}
```

## NOTES
{Gotchas, non-obvious behaviors}
```

#### Subdirectory AGENTS.md

For high-scoring directories, create smaller files (30-80 lines):
- OVERVIEW (1 line)
- WHERE TO LOOK
- CONVENTIONS (if different from parent)
- ANTI-PATTERNS

**NEVER repeat parent content in child files.**

### Phase 4: Review

- Remove generic advice
- Remove parent duplicates
- Trim to size limits (root: 50-150 lines, subdir: 30-80 lines)
- Verify telegraphic style

## Output

```
=== index-knowledge Complete ===

Mode: {update | create-new}

Files:
  ✓ ./AGENTS.md (root, {N} lines)
  ✓ ./src/hooks/AGENTS.md ({N} lines)

Dirs Analyzed: {N}
AGENTS.md Created: {N}
AGENTS.md Updated: {N}
```

## Anti-Patterns

- **Over-documenting** - Not every dir needs AGENTS.md
- **Redundancy** - Child never repeats parent
- **Generic content** - Remove anything that applies to ALL projects
- **Verbose style** - Telegraphic or die
- **Ignoring existing** - ALWAYS read existing first
