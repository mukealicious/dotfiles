# Check approval and retry ordering

Use this reference when approval, interruption, or retry safety depends on event order.
Use ordinary tests for simple linear behavior. Do not create a new verification skill for every state machine.

## Review method

1. Draw the local states and the remote states separately. A local timeout does not stop a remote request.
2. State the harm and the safety rule before you choose the tool.
3. Mark each atomic action. A remote effect and its idempotency record must commit together, or the model must split them.
4. Explore the reachable graph. Keep the shortest counterexample for each broken rule.
5. Remove each protection in turn. Confirm that its rule fails. Restore the protection and rerun.
6. Replay the counterexample through actual entry points before you report a product bug.
7. Record the bound, exclusions, covered source functions, and last checked commit. Review this mapping after code changes.

TLA+ and TLC are a good next step for larger protocols, fairness, or temporal properties.
Do not download a verifier automatically. Use the project's reviewed toolchain.
A small hand model can expose a design bug. It does not establish that an implementation matches the model.

## Runnable design experiment

This example is a **hypothetical design**, not an audit of a live agent runtime.
It uses Node built-ins and a small explicit-state breadth-first explorer. It does not use TLA+, TLC, or a solver.
No extra installation is needed. The dotfiles mise configuration owns Node.
The recorded run used Node `v24.22.1`.

From the dotfiles root:

```sh
node --test ai/skills/production-readiness/examples/approval-retry-model.test.mjs
node ai/skills/production-readiness/examples/approval-retry-model.mjs corrected 3
node ai/skills/production-readiness/examples/approval-retry-model.mjs unsafe-retry 3
```

The corrected command exits `0`. The unsafe command exits `1` and prints the full counterexample.
The tests expect the unsafe variants to fail. A passing test run does not mean those variants are safe.
The explorer continues after violations and exhausts the reachable graph. It has no depth cutoff or sampling.
The attempt limit bounds the system, not the search depth. Bounds from `1` through `4` are supported.

### Local statechart

```text
Draft --approve current payload--> Ready --dispatch--> Inflight
  ^                                  |                    |
  +----------edit payload-------------+                    |
                                                          |
             +--- retry with SAME key <--- Uncertain <----+ interrupt
             |                                |
             +--> Inflight                    +--> Unresolved (budget used)
                     |
                     +--observe remote commit--> Done
```

The remote state for **each attempt** changes independently:

```text
Pending --atomic effect + deduplication record--> Committed
Pending --request lost-------------------------> Dropped
```

An interruption changes only the local state. Pending remote requests can still commit in `Uncertain`, `Unresolved`, or `Done`.
The local chart omits the `Inflight -> Uncertain` transport-failure edge for readability. The executable model includes it.
A payload cannot change after the first dispatch. An edit before dispatch removes approval.

### Rules and deliberate faults

| Rule | Harm prevented | Fault used to demonstrate failure |
|---|---|---|
| `AtMostOneEffect` | The same operation causes 2 external effects | `unsafe-retry`: each attempt gets a new key |
| `ApprovedPayloadOnly` | The agent sends content the person did not approve | `unsafe-approval`: approval survives an edit and authorizes the new payload |
| `SuccessRequiresEffect` | The agent reports success before any external effect | `unsafe-success`: dispatch alone permits success |

The corrected design binds approval to the payload revision, freezes the dispatched payload, and reuses one operation key.
The provider atomically records that key with the effect. Local code does not infer failure from an interrupted acknowledgement.
If the retry budget ends, the local outcome is `Unresolved`, not success or confirmed failure.

### Exact results

Recorded on 2026-10-24. State counts include initial and terminal states. Transition counts include edges to previously seen states.

| Variant | Maximum attempts | Reachable states | Transitions | Result |
|---|---:|---:|---:|---|
| corrected | 1 | 24 | 36 | All 3 safety rules pass |
| corrected | 2 | 78 | 156 | All 3 safety rules pass |
| corrected | 3 | 240 | 624 | All 3 safety rules pass |
| corrected | 4 | 726 | 2,352 | All 3 safety rules pass |
| unsafe-retry | 3 | 240 | 624 | `AtMostOneEffect` fails |
| unsafe-approval | 3 | 478 | 1,244 | `ApprovedPayloadOnly` fails |
| unsafe-success | 3 | 292 | 784 | `SuccessRequiresEffect` fails |

The test suite has 13 tests. It checks all 4 corrected bounds, all 3 faults, counterexample replay, recorded-result consistency, invalid inputs, and CLI exit codes.
It also checks both interruption orderings: commit before interruption, and late delivery after retry success.
Coverage witnesses include success for both payload revisions, interruption with and without an effect, remote deduplication, and budget exhaustion.
These witnesses prevent an always-blocked design from passing unnoticed. They do not prove eventual progress.

The shortest duplicate-effect trace has 6 transitions:

1. Approve payload `0`.
2. Dispatch attempt `1` with key `attempt-1`.
3. Interrupt the worker. The remote request stays pending.
4. Retry with key `attempt-2`.
5. The remote provider commits attempt `1`. Effect count is `1`.
6. The remote provider commits attempt `2`. Effect count is `2`.

A separate replay test commits attempt `1` **before** interruption. The unsafe retry still causes a second effect.
With a stable key, both traces end with effect count `1`.
The approval fault takes 3 transitions: approve, edit, dispatch. The success fault takes 3: approve, dispatch, claim success.

Full results and shortest traces: [`../examples/approval-retry-results.json`](../examples/approval-retry-results.json).
To regenerate the result packet without changing files:

```sh
node --input-type=module -e '
import { checkApprovalWorkflow } from "./ai/skills/production-readiness/examples/approval-retry-model.mjs";
console.log(JSON.stringify({
  node: process.version,
  bounds: [1,2,3,4].map(n => checkApprovalWorkflow("corrected", n)),
  mutations: ["unsafe-retry", "unsafe-approval", "unsafe-success"].map(v => checkApprovalWorkflow(v))
}, null, 2));'
```

### Scope and assumptions

- There is 1 logical operation, 1 local worker, 2 payload revisions, and at most 4 attempts.
- There is 1 interruption opportunity per attempt. The durable approval, payload, and key survive it.
- Each pending attempt can commit or be dropped. Delivery order is arbitrary, including after local completion.
- The remote provider retains its deduplication record for the full modeled lifetime. It commits that record and the effect atomically.
- The constant key `operation-1` is valid only for this single-operation model. Production keys must distinguish operations and bind their payloads.
- Approval is checked at dispatch. Revocation after dispatch, cancellation, multiple workers, key expiry, storage corruption, and deployments are excluded.
- Safety is checked. Liveness, fairness, clocks, retry delays, backoff, leases, and eventual reconciliation are not checked.
- This is an enumerable transition system, not a verified checker or a proof over an unbounded implementation.

### Coverage and maintenance

The source of this design is `approval-retry-model.mjs`, not production application code.
`initialApprovalWorkflow` defines the start state. `approvalWorkflowTransitions` defines local and remote atomic actions.
`approvalWorkflowViolations` defines the 3 rules. `checkApprovalWorkflow` enumerates states and retains shortest traces.
The adjacent test file replays those traces. The result packet records the run.
There is no application sync commit because no application was modeled. Do not invent one.
When applying this method to a real project, map these concerns to actual functions and record the application commit before making implementation claims.

## Primary sources and adaptation

- [Lauren Tan's post](https://x.com/poteto/status/2112736749281759566), 2026-10-21 UTC. The image is explicitly hypothetical.
- [Release thread](https://x.com/poteto/status/2111926622278521253), 2026-10-18 UTC, describes a beta meta-skill that generates a project-local verification skill.
- [pstack v0.15.27 skill](https://github.com/cursor/plugins/blob/0148b78c56c72a1b8412055913c79f767095b217/pstack/skills/create-formal-verification-skill/SKILL.md). Its key requirements include code fidelity, deliberate failure, cheap reruns, and honest scope.
- [Current reviewed skill](https://github.com/cursor/plugins/blob/9580c23696ac8d7abed0c166f2f9918800afb819/pstack/skills/create-formal-verification-skill/SKILL.md) adds explicit coverage and sync-commit guidance, and `/statechart` integration.
- [Lamport's TLA+ tools](https://lamport.azurewebsites.net/tla/tools.html) describes TLC as an explicit-state checker for safety and liveness.

This is an original small example inspired by the review method. It does not vendor or execute pstack.
It improves the existing production-readiness review rather than adding another top-level skill.
The upstream-baseline `uncomplect` skill stays unchanged.
