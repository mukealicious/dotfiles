# Hammerspoon desktop capture

Hammerspoon is the thin desktop-capture adapter for the `moja-glava` skill. It collects explicitly requested context, persists a recoverable local capture packet, and opens a resumable Pi session beside a live vault diff.

## Install

```sh
brew bundle --file ~/.dotfiles/Brewfile
~/.dotfiles/python/install.sh
~/.dotfiles/ai/install.sh
~/.dotfiles/hammerspoon/install.sh
open -a Hammerspoon
```

On first launch, grant Hammerspoon:

- **Accessibility** for the global palette and reading selected text exposed by the focused app.
- **Screen Recording** for focused-window screenshots.
- Browser **Automation** access if macOS asks when capturing a page URL.

The configuration enables Hammerspoon at login.

## Use

Hold **Command + Control + Option**, then tap **Space** to open the palette:

| Action | Initial work | Herdr behavior |
|---|---|---|
| **Save this** | Preserve and lightly connect the capture | Queues its autonomous initial turn; opens without stealing focus |
| **Study this** | Build a deeper, source-grounded study | Queues its autonomous initial turn; opens without stealing focus |
| **Study this with me…** | Prepare read-only, then continue together | Bypasses the writer queue and focuses immediately |

Every action creates the same reviewable layout in the `moja-glava` Herdr workspace:

```text
┌─────────────────────────────┬──────────────────┐
│ pi-personal                 │ hunk diff --watch│
│                             │                  │
│ Capture prompt and history  │ Live vault diff  │
└─────────────────────────────┴──────────────────┘
```

Pi remains interactive after its initial pass. Open the tab later to inspect its history and diff, continue the conversation, correct the work, or explicitly ask Pi to commit.

Natural-language requests inside Pi use the same three modes through the shared `moja-glava` skill. A saved capture can later be promoted to Study or Study with me without creating another source packet.

Captures can include:

- selected text when the focused app exposes it through macOS Accessibility;
- application and window metadata;
- browser URL when available, sanitized before persistence to remove credentials, fragments, and non-allowlisted query parameters;
- focused-window screenshot.

## Behavior

Hammerspoon reports that a session **started**, not that its knowledge-base changes are complete or verified. Save and Study tabs stay in the background. Their autonomous initial writer turns run one at a time; additional capture packets wait in the in-process queue until Herdr reports that the active initial turn has settled. The interactive Pi session remains open after releasing the queue. If launch state or writer settlement is ambiguous, admission fails closed: the queue pauses and no later autonomous writer starts until the user reconciles the active Herdr tab.

Study with me bypasses that queue and requests focus immediately. Its first turn may acquire and analyze the source and search the vault, but remains read-only until the user participates. Later user-guided writes are intentionally user-managed concurrency. If focus fails after the session starts, Hammerspoon reports the warning without misclassifying the live session as a failed launch.

The Hunk pane shows the vault's complete current worktree diff, which may include unrelated changes that predate the capture. The prompt and vault guidance require Pi to preserve those changes, and the visible diff lets the user review the result before committing.

Capture packets remain under:

```text
~/Library/Application Support/Hammerspoon Agent/Captures/
```

Each packet is restricted to the current user when persisted and remains available as source provenance or for retry. A launch failure never deletes it. Captured pages, selected text, transcripts, and screenshots are treated as untrusted evidence rather than instructions.

If Herdr, Hunk, Pi, or the vault is unavailable, the launch fails clearly instead of starting an untracked fallback process.

### Queue recovery and Hammerspoon reloads

The writer lease and FIFO queue intentionally live only in the current Hammerspoon process. Do not use **Reload Config**, quit Hammerspoon, or run the Lua fixture runner while a capture is active, queued, starting, or paused. Check the public status first:

```sh
/Applications/Hammerspoon.app/Contents/Frameworks/hs/hs -q -c \
  'return hs.json.encode(_G.desktopAgentPalette:writerQueueStatus())'
```

The fixture runner enforces this idle-only rule. An unexpected Hammerspoon crash or reload keeps the source packets but loses admission state and queue order. Before retrying, inspect the capture's Herdr tab to determine whether Pi started and whether its writer turn settled.

When the live process pauses after an ambiguous launcher or waiter failure, first reconcile the active Herdr tab. Only after confirming that the previous writer is settled or never started, explicitly release retained queued work:

```sh
/Applications/Hammerspoon.app/Contents/Frameworks/hs/hs -q -c \
  'return _G.desktopAgentPalette:resumeWriterQueue(true)'
```

This workflow favors writer exclusivity over unattended liveness. It is not crash-resilient or exactly-once.

### Security boundary

Capture sessions trust the vault's repository-local guidance and give Pi its normal personal-profile tools. Prompt instructions and Hunk review reduce accidental misuse, but they are not an OS sandbox: intentionally capturing hostile content retains a prompt-injection risk. Use this workflow only for supervised personal capture, review unexpected tool activity in the Pi session, and do not use it as an unattended ingestion service.

## Architecture

```text
hotkey / chooser
  → lib/desktop_capture.lua   # selection, source metadata, screenshot, durable packet
  → lib/agent_launcher.lua    # writer queue and asynchronous process boundary
  → bin/start-agent.sh        # Herdr tab plus Pi/Hunk layout
  → bin/wait-for-agent.sh     # releases Save/Study queue after the initial turn
  → shared moja-glava skill   # synthesis, vault decisions, provenance
  → private Moja Glava vault
```

The boundaries are deliberate:

- **Hammerspoon** owns sensing, immediate acknowledgement, deterministic capture, and serializing autonomous initial writer turns.
- **The launcher** owns input validation and Herdr layout.
- **Pi** owns the resumable interactive session.
- **Hunk** exposes the current vault diff for review.
- **The skill and vault guidance** own research depth, PARA placement, naming, linking, and whether an existing note should be updated.

Do not add another hotkey or top-level palette action until repeated use demonstrates a distinct, frequent intent that these three modes cannot express.

## Validate

```sh
shellcheck hammerspoon/install.sh hammerspoon/bin/*.sh hammerspoon/test/*.sh
hammerspoon/test/start-agent.test.sh
hammerspoon/test/wait-for-agent.test.sh
hammerspoon/test/run-lua-test.test.sh
hammerspoon/test/run-lua-test.sh hammerspoon/test/agent-launcher.test.lua
hammerspoon/test/run-lua-test.sh hammerspoon/test/desktop-capture.test.lua

for file in hammerspoon/init.lua hammerspoon/lib/*.lua hammerspoon/test/*.lua; do
  pnpm --package=luaparse@0.3.1 dlx luaparse "$file" >/dev/null
done

ai/skills/build-skill/scripts/validate_skill.sh ai/skills/moja-glava
```

After Hammerspoon is running, its standard menu provides **Console** and **Reload Config** for maintenance; they are intentionally not mixed into the capture palette.
