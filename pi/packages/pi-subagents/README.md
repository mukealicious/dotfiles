# pi-subagents

`pi-subagents` lets a Pi parent delegate bounded work to child Pi sessions. It
supports single runs, top-level parallel runs, sequential and fan-out chains,
async jobs, worktrees, management, intercom, control, and `context: "fork"`.
Those are engine capabilities, not a required workflow.

## Coordinator policy and retained roles

Work directly when delegation costs more than it saves. The parent remains
user-facing and owns decomposition, decisions, approvals, integration, and
final validation. Prefer fresh, narrow, non-overlapping leaf tasks. Use one
checkout writer unless explicit worktrees isolate concurrent writers.

| Role | Default model / thinking | Authority |
| --- | --- | --- |
| `scout` | `gpt-5.6-luna` / `high` | Read-only local reconnaissance |
| `researcher` | `gpt-5.6-terra` / `high` | Read-only web evidence and local reading |
| `worker` | `gpt-5.6-luna` / `max` | The only default delegated checkout writer |
| `review` | `gpt-5.6-sol` / `xhigh` | Shared read-only code review |

The package contains only builtin `scout`, `researcher`, and `worker`.
Generated profile resources supply the canonical `review` agent. Bare model IDs
resolve through the active profile's provider registry at launch; a caller may
explicitly override a run.

Scout, researcher, and review are mechanically read-only leaves. Scout and
review receive only `read`, `grep`, `find`, and `ls`; researcher receives
`read` and its evidence tools. They have no shell, generic filesystem write,
default output, default progress, mutation-tool, or nested-delegation path.
Explicit `output` or `progress` overrides for an effectively read-only agent
are rejected before session or checkout persistence. An intercom bridge never
widens an explicit tool allowlist. Worker is also a leaf, but is the one default
role that may write the checkout.

Ordinary custom agents default to leaf depth and the same local read-only tool
set. A purpose-built custom role can opt into other tools or a nonzero
`maxSubagentDepth` explicitly.

## Running work

Use the `subagent` tool directly, or use `/run`, `/parallel`, `/chain`, and
`/run-chain` from the slash-command layer.

```ts
// Single
subagent({ agent: "scout", task: "Map the authentication flow and cite files." })
subagent({ agent: "worker", task: "Implement the approved change and run its test." })

// Top-level parallel
subagent({
  tasks: [
    { agent: "scout", task: "Map the local API flow." },
    { agent: "researcher", task: "Find the governing API documentation." },
  ],
  concurrency: 2,
})

// Sequential chain
subagent({
  chain: [
    { agent: "scout", task: "Map the module for {task}." },
    { agent: "worker", task: "Implement the approved task using {previous}." },
  ],
})
```

Use `context: "fork"` only when a child needs a separate branch of a persisted
parent conversation. It is context isolation, not filesystem isolation. Use
`worktree: true` only when concurrent writers have explicit disjoint ownership.

## Tool schema

`subagent(...)` has one management mode and three execution modes. Use exactly
one execution shape: a single `agent`, top-level `tasks`, or `chain`.

### Common execution fields

| Field | Type | Meaning |
| --- | --- | --- |
| `agent` | string | Single-run agent name; management target when `action` is set. |
| `task` | string | Single-run task. It may be omitted for a self-contained role. |
| `context` | `fresh \| fork` | `fresh` is the default. `fork` creates child session branches. |
| `cwd` | string | Working-directory override, resolved from the parent cwd. |
| `model` | string | Explicit single-run model override. |
| `skill` | string, string[], boolean | Inject named skills; `false` disables injection. |
| `async` | boolean | Start background execution. Chains also require `clarify: false`. |
| `clarify` | boolean | Open the preview/edit UI. Chains default to it; it implies sync. |
| `artifacts` | boolean | Enable debug artifacts (default `true`). Not a workflow handoff. |
| `maxOutput` | object | Bound returned output; internal callers may use it for line/byte limits. |
| `includeProgress` | boolean | Include full collected progress in the result. |
| `control` | object | Per-run control configuration; see [Control](#control). |
| `agentScope` | `user \| project \| both` | Discovery scope; `both` is default and project wins collisions. |
| `sessionDir` | string | Override the derived child-session directory. |
| `share` | boolean | Export a session through the configured sharing mechanism; off by default. |

A single run also accepts `output: string | false`. It overrides the role's
single-output setting; relative paths resolve against its effective cwd. Passing
`false` disables that output. Read-only roles reject even an explicit `false`
override so the boundary is unambiguous.

### Top-level parallel fields

Pass `tasks`, an array of independent task objects:

```ts
subagent({
  tasks: [
    { agent: "scout", task: "Inspect routes", reads: false },
    { agent: "worker", task: "Implement the approved route", model: "gpt-5.6-sol" },
  ],
  concurrency: 2,
  worktree: false,
})
```

Each task accepts `agent`, `task`, `cwd`, `count`, `model`, `skill`, `output`,
`reads`, and `progress`. `count` repeats that task and must be at least one.
`concurrency` is a top-level limit (default four, subject to package config).
`worktree: true` creates one isolated Git worktree per expanded task.

Do not give concurrent writers the same checkout or output path. Read-only task
objects reject explicit `output` and `progress` before any child starts.

### Chains

A chain is an ordered array of sequential steps or parallel groups:

```ts
subagent({
  chain: [
    { agent: "scout", task: "Map {task}." },
    { parallel: [
      { agent: "researcher", task: "Research the standard from {previous}." },
      { agent: "review", task: "Identify local risks from {previous}." },
    ], concurrency: 2, failFast: true },
    { agent: "worker", task: "Implement the approved narrow change using {previous}." },
  ],
  clarify: false,
})
```

Sequential steps accept `agent`, optional `task`, `cwd`, `model`, `skill`,
`output`, `reads`, and `progress`. Parallel groups contain `parallel` task
objects with those fields plus `count`; groups accept `concurrency`, `failFast`,
and `worktree`. Chain templates may use:

| Template | Value |
| --- | --- |
| `{task}` | Original chain task. |
| `{previous}` | Previous sequential output or the labelled aggregate from a parallel group. |
| `{chain_dir}` | The package-managed temporary chain directory. |

`output`, `reads`, and `progress` have three-state chain behavior: omitted uses
the role behavior, a value overrides it, and `false` disables it. A read-only
step cannot supply `output` or `progress` at all. This protects both sequential
and parallel chain paths before progress/output handling is initialized.

### Saved chain files

Saved chains are `.chain.md` files beside user or project agents. A file has
`name` and `description` frontmatter followed by `## agent-name` sections.
Configuration lines directly after a section header may set `output`, `reads`,
`model`, `skills`, and `progress`; a blank line begins the task body.

```md
---
name: inspect-and-build
description: Map a module then implement the approved work
---

## scout

Map {task}.

## worker

Implement the approved work using {previous}.
```

Run a saved chain with `/run-chain inspect-and-build -- <task>` or inspect and
manage it with `/agents` or management actions.

## Agents, tools, and discovery

Agent files are Markdown with YAML frontmatter and a prompt body. A conservative
custom leaf can be written as:

```md
---
name: release-notes
description: Summarizes confirmed changes
tools: read, grep, find, ls
maxSubagentDepth: 0
---

Summarize only confirmed changes and cite the supporting files.
```

Supported frontmatter includes `name`, `description`, `tools`, `extensions`,
`model`, `fallbackModels`, `thinking`, `systemPromptMode`,
`inheritProjectContext`, `inheritSkills`, `skills`, `output`, `defaultReads`,
`defaultProgress`, `interactive`, and `maxSubagentDepth`.

An explicit `tools` list is a strict allowlist across builtin, extension, and
custom tools. `mcp:<tool>` entries select direct MCP tools when the adapter is
installed. If `extensions` is omitted, normal extensions load; `extensions:`
with no values disables them. Read-only retained roles keep normal extension
discovery so researcher can load its evidence tools, while their explicit tool
lists prevent extra extension tools from becoming callable. A custom writer
must state its required tools explicitly rather than relying on a blank default.

Definitions resolve in this precedence order:

1. `.pi/agents/*.md` project definitions;
2. `$PI_CODING_AGENT_DIR/agents/*.md` user definitions;
3. bundled builtins.

Legacy `.agents/*.md` and `.agents/*.chain.md` project discovery remains for
compatibility, but `.pi/agents/` wins a collision. User agents and chains always
live under the active profile directory; when no profile is selected, upstream
fallback behavior uses `~/.pi/agent`. The supported local launchers set the
profile environment variable.

Builtin field overrides live in `$PI_CODING_AGENT_DIR/settings.json` or
`.pi/settings.json` under `subagents.agentOverrides`. Project overrides beat
user overrides. `disabled: true` hides a builtin while preserving it in
management inspection; `disableBuiltins: true` is the bulk setting.

## Async jobs and status

Set `async: true` to detach a single, parallel, or non-clarifying chain run:

```ts
const started = subagent({ agent: "worker", task: "Run the approved slow suite.", async: true })
subagent({ action: "status" })
subagent({ action: "status", id: "<run-id-or-prefix>" })
```

Async state is scoped to the active profile and temporary package scope. Status
reports active and recent jobs; `/subagents-status` provides the interactive
view. Detached job directories contain status, event, and output logs so a
failed child remains diagnosable. They are not intended as checkout artifacts or
an implementation pipeline.

`forceTopLevelAsync` config forces depth-zero calls into background mode and
suppresses clarify. `asyncByDefault` changes only requests that omit `async`.
Neither setting changes a nested child's inherited depth boundary.

## Worktree isolation

`worktree: true` is available for top-level parallel tasks and chain parallel
groups. Each expanded task gets a Git worktree branched from `HEAD`; package
cleanup runs in `finally` blocks and captures per-worktree diffs for the result.

Requirements:

- run inside a Git repository with a clean working tree;
- give each writer disjoint ownership;
- omit task `cwd` overrides or make them match the shared cwd;
- ensure a configured `worktreeSetupHook` returns valid JSON before its timeout.

`node_modules/` is linked into generated worktrees when present. A setup hook
receives JSON on stdin with repository, worktree, agent cwd, branch, index, run
id, and base commit. It may return relative untracked `syntheticPaths`; tracked
or absolute synthetic paths fail validation. Worktrees isolate filesystems, not
conversation context, so add `context: "fork"` separately only when needed.

## Management and custom roles

Management actions use the same tool with `action` set:

```ts
subagent({ action: "list" })
subagent({ action: "get", agent: "scout" })
subagent({ action: "get", chainName: "inspect-and-build" })
subagent({ action: "create", config: {
  name: "release-notes",
  description: "Summarizes confirmed changes",
  tools: "read,grep,find,ls",
  maxSubagentDepth: 0,
} })
subagent({ action: "update", agent: "release-notes", config: { thinking: "high" } })
subagent({ action: "delete", agent: "release-notes" })
```

Valid actions are `list`, `get`, `create`, `update`, `delete`, `status`,
`interrupt`, and `doctor`. `create` uses `config.scope` (`user` by default);
`update` and `delete` can use `agentScope` to disambiguate same-name definitions.
`config` may be an object or a JSON string.

For an agent, `config` accepts the frontmatter fields above. A management-created
agent starts as a read-only leaf (`read,grep,find,ls`, depth zero); set a
different explicit `tools` value only for a purpose-built role.
For a chain, include `name`, `description`, optional `scope`, and `steps`. Each
step has the same chain behavior fields described above. Management validates
unknown chain agents and reports missing models or skills as warnings.

`/agents` exposes the same resolved definitions, builtin overrides, templates,
chain editing, parallel construction, and launch controls. It is a UI over this
contract, not a second role policy.

## Control

Control reports activity, not hidden model intent. A run is `queued`, `running`,
`paused`, `complete`, or `failed`; a `needs_attention` event means the package
has not observed activity past a threshold, not that a child is certainly stuck.

```ts
subagent({
  agent: "worker",
  task: "Run the approved long test suite.",
  control: {
    needsAttentionAfterMs: 300000,
    notifyOn: ["needs_attention"],
  },
})
subagent({ action: "interrupt", id: "<run-id>" })
```

`control.enabled` enables or disables control observation. `needsAttentionAfterMs`
sets the silence threshold. `notifyOn` accepts `needs_attention`; an empty list
disables notifications. `notifyChannels` can select `event`, `async`, and
`intercom` delivery where available.

`interrupt` is soft: it cancels the current child turn and leaves the run
paused. It does not claim success or failure. Resume with a clearer task,
replace the task, ask the user, or stop explicitly.

## Intercom

`pi-subagents` works without `pi-intercom`. When the extension is installed and
enabled, `intercomBridge` may provide a child with a private route to the parent.
Bridge configuration is profile-scoped:

```json
{
  "intercomBridge": {
    "mode": "always",
    "instructionFile": "./intercom-bridge.md"
  }
}
```

`mode` is `always`, `fork-only`, or `off`; a relative instruction file resolves
from the subagent extension configuration directory and may use
`{orchestratorTarget}`. The bridge only injects instructions when its extension
sandbox permits it. It never adds `intercom` to an explicit tool allowlist.
Thus a read-only role cannot gain intercom, shell, or mutation authority from
bridge setup.

A child uses a bridge-provided target only when blocked or explicitly asked for
a concise update:

```ts
intercom({ action: "ask", to: "<bridge-provided-target>", message: "Which constraint wins?" })
intercom({ action: "send", to: "<bridge-provided-target>", message: "UPDATE: blocked on migration choice" })
```

Do not invent targets or send routine completion handoffs. Parent-side grouped
results and control notices may use intercom when a valid route exists.

## Forked context

`context: "fork"` creates a real child branch from the persisted parent session:

```ts
subagent({ agent: "review", task: "Challenge the current approach.", context: "fork" })
```

Forks retain parent history; they are not fresh, filtered review contexts. The
parent session must have a persisted session file and a current leaf. Failure to
create a branch fails the request rather than silently falling back to `fresh`.
Each task in a parallel or chain request receives its own branch. Use a fresh
context for independent evidence or adversarial review unless inherited history
is specifically useful.

## Configuration

Package configuration is read from
`$PI_CODING_AGENT_DIR/extensions/subagent/config.json` (or the upstream fallback
only when no profile is selected). Common settings are:

```json
{
  "asyncByDefault": false,
  "forceTopLevelAsync": false,
  "maxSubagentDepth": 2,
  "parallel": { "maxTasks": 8, "concurrency": 4 },
  "defaultSessionDir": "~/Library/Caches/pi-subagents/sessions",
  "intercomBridge": { "mode": "always" },
  "worktreeSetupHook": "./scripts/setup-worktree.mjs",
  "worktreeSetupHookTimeoutMs": 30000
}
```

`maxSubagentDepth` is an upper bound. Environment depth values take precedence;
per-agent values can only tighten an inherited limit. Every ordinary retained
role has depth zero. Pi thinking levels are `off`, `minimal`, `low`, `medium`,
`high`, `xhigh`, and native `max`. The package preserves `max` in frontmatter,
management and clarify selectors, model suffixes, saved chains, async payloads,
and child launch arguments.

## Diagnostics and troubleshooting

Start with the read-only diagnostic report:

```ts
subagent({ action: "doctor" })
```

`/subagents-doctor` reports runtime paths, discovery, async availability, session
context, and intercom bridge state.

| Symptom | Action |
| --- | --- |
| Unknown agent or chain | Run `subagent({ action: "list" })`; check scope and project-over-user precedence. |
| Read-only override rejected | Remove `output` and `progress`; return findings in the child result instead. |
| Max depth exceeded | Flatten the work or explicitly configure a purpose-built nested role. |
| Fork cannot start | Persist the parent session and ensure it has a current leaf; do not expect fresh fallback. |
| Async launch or result confusion | Check `status`, `/subagents-status`, and `doctor`; inspect the profile-scoped job log. |
| Worktree launch fails | Clean the repository, verify task cwd agreement, and validate the setup hook. |
| Intercom messages missing | Check `doctor`, the active profile's intercom configuration, extension availability, and bridge mode. |
| Child fails before a result | Inspect status detail and child output logs; loader and provider errors are retained there. |
| Model is not available | Use a provider-qualified override or verify the active profile registry. |

## Runtime map

| Area | Owner |
| --- | --- |
| `agents.ts` / `agent-serializer.ts` | Agent and chain discovery, frontmatter, overrides, serialization. |
| `subagent-executor.ts` | Mode routing, validation, role boundaries, management, status, and control. |
| `execution.ts` / `async-execution.ts` / `subagent-runner.ts` | Foreground and detached child launch paths. |
| `chain-execution.ts` / `chain-serializer.ts` | Chain behavior, templating, fan-out, and saved chains. |
| `worktree.ts` | Isolated checkout creation, hook validation, diff capture, cleanup. |
| `intercom-bridge.ts` | Bridge authority and diagnostics. |
| `schemas.ts` / `types.ts` | Public tool schema and shared execution types. |
| `test/unit/` / `test/integration/` | Unit and loader-based integration coverage. |
