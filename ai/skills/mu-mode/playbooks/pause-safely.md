# Pause Safely

Use this playbook when the user wants work to stop now while remaining genuinely resumable. This is not Pi's handoff command, which immediately starts another continuation.

## Contract

Reach a trustworthy stopping point, verify the state being left behind, emit a checkpoint-ready resume packet, and stop. Do not claim completion or silently begin the next phase.

Load these principle modules:

- [Guard the Context Window](../principles/guard-the-context-window.md)
- [Make Operations Idempotent](../principles/make-operations-idempotent.md)
- [Prove It Works](../principles/prove-it-works.md)
- [Never Block on the Human](../principles/never-block-on-the-human.md)

## Workflow

First announce `Mu Mode: Pause Safely — stop at a verified boundary and emit a resumable state packet.` This remains required after a handoff or compaction; reload the Mu Mode router if its route rules are no longer present in context.

### 1. Stop expanding the work

Do not start another unit. Let a consequential in-flight command reach a safe boundary when practical. Interrupt only when continuing would be riskier than stopping.

Do not invoke Pi's handoff command; it automatically continues. A separate temporary handoff document may follow the shared [handoff](../../handoff/SKILL.md) skill's document contract when an artifact is useful, but Pause Safely itself must return control to the user.

### 2. Stabilize the state

Inspect the real working state. Finish, revert, or explicitly preserve partial writes so a resumed agent can distinguish intentional work from debris. Keep user changes intact. Do not commit, stash, push, close processes, or delete temporary state without existing authority.

Record any live process that matters, whether it is safe to leave running, and how its state was verified.

### 3. Verify the stopping point

Capture the smallest relevant evidence:

- Git branch, HEAD, worktree changes, and ownership of unrelated changes;
- completed and partial work;
- checks run, results, and known failures;
- blockers, assumptions, and the exact next unfinished step;
- authoritative issue, plan, spec, checkpoint, or artifact paths.

Do not rerun a broad suite merely to pause. Verify enough to prevent the next agent from relying on a false state.

### 4. Emit a resume packet

Include verified coordinates when available:

- repository and working directory;
- source harness and its verified native session locator;
- for Pi, the verified profile (including `PI_DEFAULT_PROFILE` when provided), session ID, JSONL path, and current tree-entry ID when branch identity matters;
- handoff path when relevant;
- Herdr workspace, tab, and pane IDs plus human-readable labels;
- active Mu Mode route and whether pickup should continue it or rematch;
- one concrete next action.

Herdr IDs are live hints. The Pi session path and repository state are the durable recovery anchors.

Write the packet so it can be passed directly to Moja Glava, but do not update the knowledge base automatically. The user may invoke Moja afterward when durable recall is wanted.

### 5. Stop

Return the resume packet and state clearly that work is paused. Do not launch Session Pickup, invoke Pi's handoff command, or continue implementation.
