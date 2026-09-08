---
name: mu-mode
description: Routes explicitly invoked focused engineering work through concrete task contracts and composable principles. Use when the user explicitly invokes Mu Mode.
disable-model-invocation: true
user-invocable: true
metadata:
  watch-sources: cursor/plugins/pstack/skills/poteto-mode/SKILL.md@73f8be4873ea4ba2b7378243a036d3360c69e04d
---

# Mu Mode

Mu Mode is a portable router for focused, nontrivial engineering work. It selects a concrete task contract, loads only the guidance needed for that contract, and adapts mechanics to the repository and risk.

## Activation and continuity

Activate only after explicit user invocation. Do not infer Mu Mode from an ordinary engineering request.

After activation:

1. Say `Mu Mode: <route> — <defining contract>`.
2. Read [principles.md](references/principles.md), then load only the full principle modules named by the route or triggered by the work.
3. Read [composition-and-checkpoints.md](references/composition-and-checkpoints.md) and the selected playbook when it exists. Preserve the contract and specialist requirements; adapt the suggested methods, tools, delegation, and phase shape to the task.
4. Carry this contract forward through conversation context until the user exits, disables, or leaves Mu Mode. This is soft continuity, not runtime-enforced state. When using Pi's handoff command, record Mu Mode, the current route, and whether the continuation should stay on it or rematch; make reloading this router the continuation's first step. Reinvoke after other compaction or visible drift when needed.
5. Treat `new task` as a request to clear the current route and rematch without leaving Mu Mode.

## Routing

Read [active-playbooks.md](references/active-playbooks.md) and choose the most specific contract that subsumes the requested deliverable. Do not choose a route merely because one step resembles it.

Implemented playbooks are linked from the catalogue. If another active route matches but its file is not present yet, preserve the route's defining contract and use [Figure It Out](playbooks/figure-it-out.md) to design the run. Do not pretend the missing playbook exists.

When no permanent route fits, select Figure It Out. Planning composition lives in its [planning recipe](playbooks/figure-it-out.md); there is no dedicated Planning route. Figure It Out is a legitimate workflow, not a failure to route. Keep its bespoke workflow proportionate. If the same bespoke shape recurs, propose promoting it to a permanent playbook.

The deferred catalogue in [deferred-playbooks.md](references/deferred-playbooks.md) records possible future routes. Do not invoke a deferred route as if it were implemented; Figure It Out may compose its useful semantics without claiming the capability.

## Route transitions

- Stay in the current route while the deliverable and defining contract remain unchanged.
- If the deliverable genuinely changes, finish or pause the current contract, announce the transition, and load the new route.
- For mixed requests, select one primary route. Name later transitions rather than running overlapping contracts implicitly.
- Diagnosis followed by an authorized fix is a transition. A refactor discovered inside a feature is not a transition unless behavior preservation becomes the deliverable.
- `new task` always rematches. Explicit exit disables Mu Mode.

## Operating boundaries

- Repository guidance and universal safety rules outrank Mu Mode.
- Reversible, low-risk work proceeds without ceremony. Ask only when blocked, when ambiguity materially changes the outcome, or before consequential, privileged, shared, irreversible, costly, or production-visible action.
- Generic requests to investigate, fix, build, or refactor do not authorize commits, pushes, PRs, merges, deploys, remote deletion, or customer communication.
- Never use process ritual as a substitute for the route's invariant. Plans and todos are useful only when they improve coordination, auditability, or resumability.
- Direct invocation of a leaf skill outside Mu Mode remains valid.

## Completion

Verify the route's defining contract against the real artifact. Report the outcome, evidence, consequential choices, and anything unverified or deferred. Principle citations are optional; explain decisions normally rather than ceremonially.
