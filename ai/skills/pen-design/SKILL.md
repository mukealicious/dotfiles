---
name: pen-design
description: Work with Pen.dev canvases and .pen design deliverables. Use when the user requests a Pen.dev design, editable mockup, or changes to an existing .pen file.
---

# Pen.dev integration

This skill routes design work to the installed Pen.dev tools. It does not bundle
Pen.dev's documentation or prescribe a particular CLI version.

## Choose the tool path

- If the Pen.dev/Pencil MCP server is available, read its `read_skill` guidance
  and inspect `get_app_state` before changing a canvas. Read the operation's
  schema and any referenced instructions before executing it.
- If only the CLI is available, consult the installed `pen --help` and its
  version-matched documentation. Do not guess flags from remembered examples.
- If neither is available, explain the missing dependency. Follow this repo's
  tool-installation policy rather than automatically downloading a CLI or
  creating an account.

## Working contract

Agree on the intended artifact and destination. Inspect existing work before
editing, and preserve unrelated canvas content. Use Pen.dev tooling for `.pen`
files rather than treating them as ordinary text files.

For visual decisions, use `impeccable`; code-only interface work does not require
Pen.dev. Use `mono-color` when the task calls for its print-art direction.
Inspect a rendered preview before reporting a design as complete, and give the
user the saved artifact's location. Report missing access or failed operations
without claiming an export succeeded.

Keep provider documentation as session context, not copied repository content.
Confirm redistribution rights separately before adding any third-party skill,
example, or asset to this public repository.
