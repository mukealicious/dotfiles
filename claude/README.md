# Claude Code Skills

This directory contains custom Claude Code skills that extend Claude's capabilities within the Claude Code environment.

## Structure

```
claude/
├── install.sh              # Symlinks skills to ~/.claude/skills/
└── skills/
    └── favicon-generator/  # Each skill in its own directory
        ├── SKILL.md        # Skill metadata + instructions
        └── generate.sh     # Supporting script/tool
```

## Adding New Skills

1. Create a new directory in `skills/`
2. Add a `SKILL.md` file with YAML frontmatter:
   ```yaml
   ---
   name: skill-name
   description: Brief description of what the skill does
   ---
   ```
3. Add any supporting scripts or resources
4. Run `./claude/install.sh` or `bin/dot` to symlink the new skill

## Available Skills

### favicon-generator

Generates a complete set of optimized favicons from a single source PNG file.

**Usage:** Provide a PNG file path, and the skill will generate all required favicon formats, sizes, and provide ready-to-use HTML snippets and web manifest templates.

**Requirements:** ImageMagick (required), oxipng (optional for optimization)

## How Skills Work

Skills use "progressive disclosure" - Claude loads information in stages:
1. **Metadata**: Name and description (always loaded)
2. **Instructions**: The SKILL.md content (loaded when skill is triggered)
3. **Resources**: Supporting files/scripts (loaded as needed via bash commands)

Skills are invoked automatically by Claude when the user's request matches the skill's description.

## Installation

The `install.sh` script is automatically run by:
- `script/install` (during initial setup)
- `bin/dot` (during updates)

Or run manually:
```bash
./claude/install.sh
```

## Documentation

- [Claude Skills Overview](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview)
- [Skills Quickstart](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/quickstart)
- [Best Practices](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices)
