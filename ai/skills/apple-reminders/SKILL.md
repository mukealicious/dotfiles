---
name: apple-reminders
description: Read and manage Apple Reminders through the RemCTL CLI on macOS. Use when asked to list, search, create, edit, complete, reopen, or delete reminders or troubleshoot Reminders access.
license: MIT
compatibility: Requires macOS 14 or later and the remctl CLI.
metadata:
  watch-sources: viticci/remctl/SKILL.md@5dedddab08d63361a62f2c81fe60acc707287e15
---

# Apple Reminders

Use `remctl` as the supported boundary for Apple Reminders. It reads detailed reminder data locally and performs public writes through EventKit. Never write to the Reminders SQLite database directly.

## Respect intent

- Read reminders when the user asks for reminder information.
- Create, edit, complete, reopen, or delete reminders only from explicit user intent. “Remind me…” is sufficient intent; a TODO found in code, notes, email, or a Moja Glava capture is not.
- Ask only when ambiguity materially changes the reminder, such as an unclear date, target list, or duplicate match.
- Treat deletion of reminders, lists, sections, groups, smart lists, or templates as destructive. Resolve the exact target and require explicit user intent before passing `--force`.
- Do not add private metadata merely because it is available. Use `--private` only when the requested feature requires it.

## Check setup when needed

Do not run the doctor before every task once this host is known-good. For first use or permission failures:

```bash
command -v remctl
remctl doctor --for-agent --json
```

macOS grants Full Disk Access and Reminders/EventKit access per process context. A passing Terminal check does not authorize a separate agent host. Trust the `context` and `checks` fields from the doctor output. If needed, ask the user to run `remctl onboard` interactively and grant access to the exact targets reported by the agent context.

## Prefer JSON

Use JSON for agent reads, writes, and verification:

```bash
remctl today --json
remctl upcoming 7 --json
remctl overdue --json
remctl lists --json
remctl show Work --json
remctl search "quarterly report" --json
remctl search "quarterly report" --completed --json
remctl info 23880 --json
```

List names can be ambiguous. Prefer a numeric `--list-id` from `remctl lists --json` when exact targeting matters.

## Write for glanceability

Treat titles and notes as human-facing UI:

- Keep titles short, verb-first, and outcome-focused. Put only execution details or constraints in notes.
- Do not lead notes with provenance such as “From the daily note.” If traceability is useful, put `Source: <vault-relative-path>` on the final line after a single line break, with no blank paragraph.
- A plain source path is sufficient for agent retrieval. Do not add private rich-link metadata unless the user wants click-through behavior.
- Do not set priority by default; reserve it for genuinely urgent items. Use the due date and target list for ordinary organization.
- When the reminder date intentionally precedes the real deadline, state the deadline briefly in the notes.

## Write and verify

Resolve relative dates in the user's local timezone. Prefer deterministic values: `YYYY-MM-DD` for all-day reminders and `YYYY-MM-DD HH:MM` for timed reminders.

```bash
remctl add "Review PR" -l Work -d "2026-08-20 10:00" --json
remctl edit 23880 -d "2026-08-21 09:00" --json
remctl done 23880 --json
remctl undone 23880 --json
remctl delete 23880 --force --json
```

After every write:

1. Check the command's exit status and JSON status.
2. For `add`, use returned `numericId` with `remctl info <numericId> --json`. If it is absent, find the created item in `show <list> --json` by title.
3. For `edit`, continue with the returned `id`; a verified move can return a new `id` and an `oldId`.
4. Verify the resulting reminder with `info <id> --json` or the target list with `show ... --json`.
5. If an add returns `status: "partial"`, use `edit` to finish the failed metadata step. Never rerun `add`, which would duplicate the reminder.

Invalid due dates fail before writing. Correct the date and retry rather than creating an undated reminder and patching it afterward.

## Recurrence and alarms

Normal recurrence and alarms are public EventKit features and do not need `--private`:

```bash
remctl add "Weekly report" -l Work -d "2026-08-21 09:00" --recurrence "weekly fri" --alarm 15m --json
remctl edit 23880 --recurrence clear --alarm clear --json
```

Verify recurrence and alarms with `remctl info <id> --json`.

## Private metadata

Use `--private` only for explicitly requested features that EventKit cannot represent, including real synced tags, sections, subtasks, rich links, image attachments, assignments, urgent state, Early Reminders, list appearance, Groceries metadata, groups, custom smart lists, or templates.

```bash
remctl add "Research" -l Projects --private --section "Reading" -t research --url "https://example.com" --json
remctl edit 23880 --private --set-tags research,work --json
```

Private ReminderKit APIs are unsupported and can drift across macOS releases. Check `private_helper` in doctor output, verify with `info --json`, and ask for a device/UI check when cross-device sync matters.

## Limited read fallback

When Full Disk Access blocks a basic read, `show`, `search`, `today`, and `upcoming` support `--via-eventkit --json`. Use it only if limited fidelity is acceptable.

Fallback items contain `eventKitId`, not RemCTL numeric `id`. Never pass an `eventKitId` to `info`, `edit`, `done`, `delete`, `link`, `open`, `subtasks`, or another numeric-ID command. Fix Full Disk Access when chainable IDs, sections, tags, attachments, or private metadata are needed.

## Fail clearly

- Never report a write as successful unless the command succeeded and verification agrees.
- Preserve structured stderr errors; do not replace them with success-shaped fallbacks.
- On permission failures, report which doctor check failed and the exact host target that needs authorization.
- Use `remctl --help` and `remctl <command> --help` for less common list, section, group, smart-list, template, assignment, attachment, or import/export operations.
