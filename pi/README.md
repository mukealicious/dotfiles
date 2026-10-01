# Pi

One everyday environment at `~/.pi/agent`, using OpenAI's **Sign in with
ChatGPT**, native MCP, and native codemode. Use `pi` or `pi-print`; retired
`pi-personal`/`pi-work` wrappers and print aliases have been removed.

## Setup

Pi itself uses its own updater rather than mise's JS release airlock:

```sh
pi update
ai/install.sh
pi/install.sh
PI_CODING_AGENT_DIR="$HOME/.pi/agent" herdr integration install pi
```

Requires Pi 0.99.1 or later. Before first setup, or when the reviewed subagent
lockfile changes, stop all Pi/subagent runners and prepare its runtime dependencies:

```sh
(cd pi/packages/pi-subagents && npm_config_legacy_peer_deps=true mise exec -C ~/.dotfiles -- npm ci --omit=dev --ignore-scripts)
```

Routine `pi/install.sh` only checks dependency manifest versions against the
reviewed lockfile; it never rebuilds this shared live directory. Missing or
mismatched dependencies stop setup with the recovery command. This is a readiness
check, not a full dependency-integrity scan. Required package-install failures
also stop setup and retain their diagnostics rather than reporting completion.

On a new machine, install Pi with:

```sh
mise exec -C ~/.dotfiles -- bun install -g @earendil-works/pi-coding-agent --minimum-release-age=0
```

Launch `pi`, then `/login openai` and choose **Sign in with ChatGPT**. Legacy
Codex tokens cannot be relabeled as native OpenAI tokens. The launcher clears
inherited `OPENAI_API_KEY` and `OPENAI_OP_REF` to prevent accidental API billing.
It runs Pi with mise's Node and child-scoped noninteractive Git editors. Explicit
custom `PI_CODING_AGENT_DIR` values remain supported for isolated experiments;
inherited retired work/personal paths redirect to the unified environment.

Occasional API use does not warrant a second managed installation. Use an
explicit isolated native invocation when needed; never commit credentials.

## Ownership

| Source | Runtime |
|---|---|
| `pi/settings.json` | Writable `~/.pi/agent/settings.json` |
| User model configuration | Writable `~/.pi/agent/models.json`; not created or modified by installation |
| `pi/extensions/modes.ts` | Four fixed capability presets using native model/thinking APIs |
| `pi/extensions/`, `pi/themes/`, `pi/prompts/` | Installed resource links |
| `ai/instructions/`, `pi/instructions/` | Generated `.ai-runtime/pi/AGENTS.md` |
| Shared skills in `ai/skills/` | Generated `.ai-runtime/pi/skills/` |
| `pi/agents/` and shared agent bodies | Individual links in `~/.pi/agent/agents/` |
| Machine-local connections | **`~/.pi/agent/mcp.json`**, edited through `/mcp` or CLI |

The installer owns resource selection (`packages`, `skills`, `extensions`,
`prompts`, `themes`, `defaultTools`). Other tracked settings bootstrap missing
keys; existing native `/model` and `/settings` preferences and runtime identity
survive reinstalls. Native compaction/thinking/retry defaults are no longer
repeated in the source baseline; existing explicit choices remain respected.
It does not overwrite an existing `mcp.json` or fast-mode configuration. OAuth lives in private `auth.json` and `mcp-auth.json`, not
Git. Custom agents and chains live alongside managed agent links.

Skills are shared across work and personal projects. Project-specific guidance
belongs in repository `AGENTS.md` or trusted `.pi/` configuration.

The paired `.dotfiles/.agents/skills` entry and exclusion in `settings.json`
register the managed Codex projection as disabled before native project discovery.
Keep both: a global exclusion alone does not filter auto-discovered project skills
in Pi 0.99.1. This keeps Pi's provider-specific projection authoritative, including
from nested working directories, without disabling other repositories' skills.

## Native MCP and codemode

Use `/mcp` to inspect servers, sign in, reconnect, or change tool exposure.
From a shell:

```sh
pi mcp add mobbin --url https://api.mobbin.com/mcp
pi mcp login mobbin
pi mcp list
```

OAuth credentials are profile-local files. Native credentials are keyed by URL;
two names for the same endpoint do not provide two separate accounts. This
setup chooses Mobbin personal. Reauthorize Linear and Mobbin after migration.

GitHub can follow the active `gh` account without a token in JSON:

```json
{
  "mcpServers": {
    "github": {
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": {
        "Authorization": "!token=$(gh auth token --hostname github.com) && test -n \"$token\" && printf 'Bearer %s' \"$token\""
      }
    }
  }
}
```

Native Pi reads its agent-directory `mcp.json` and trusted project
`.pi/mcp.json`. It does not read `~/.config/mcp/mcp.json` or adapter files.
There is deliberately no ongoing import/merge layer. Native MCP connects
enabled servers at startup. Disable servers you do not want started.

`defaultTools: ["+codemode"]` enables native JavaScript orchestration alongside
normal tools. MCP defaults to codemode exposure; use deferred discovery for
large tool catalogs as needed. Nested calls still go through Pi's tool events.
Codemode is not a sandbox against the tools it is allowed to call.

The adapter's `mcp`, `mcpScript`, server proxy tools, and `/mcp-auth` are retired.
Native MCP does not render interactive MCP Apps; ordinary tool/image results
remain supported. `/mcp` replaces `/mcp-adapter`.

## Models and useful extensions

All capability modes use provider `openai`:

| Mode | Model | Thinking |
|---|---|---|
| light | GPT-6 Luna | max |
| standard | GPT-6.1 Sol | medium |
| default | GPT-6.1 Sol | high |
| deep | GPT-6 Astra | high |

`/mode` or `Ctrl+Shift+M` opens the native selector; `/mode deep` applies a preset.
`Ctrl+Space` cycles light → standard → default → deep. Both Sol depths remain
separate stops, with Astra reserved for deep. The thin `modes.ts` extension derives the current preset from
native model/thinking state and never overrides startup or resumed selections.
Missing models or credentials produce an error rather than provider fallback.

Pi's native editor replaces Mitsupi's custom editor. Custom mode-border colors,
`/mode store`, project mode overrides and cross-session prompt-history scanning
are retired. Existing `modes.json` files and saved conversations remain untouched;
mode files are no longer read or installed. Native session prompt history remains.

`/fast on|off` is the sole managed priority control; `/mode` only selects model
and thinking. The fast preference survives model switches; only models in its
configured supported-model list receive `service_tier: "priority"`. Unsupported
models stay unchanged. Priority availability and charges depend on OpenAI and
your account, not just a model's name.

The previous bootstrap-only Astra override can be retired once, without running
installation or consolidation:

```sh
node pi/retire-astra-priority.mjs "$HOME/.pi/agent/models.json"
```

This removes only Astra's `samplingParams.service_tier` when it is `"priority"`,
preserves unrelated model configuration and fast preferences, and saves the exact
original as `models.json.before-fast-only`. It refuses symlinks and backup conflicts.
Restart Pi (or open `/model` and reselect) to discard an already-loaded override.
The installer no longer creates model policy or changes user model files. Deliberate
user overrides can still supersede the toggle; `/fast off` does not erase them.

The existing Gruvbox theme is retained. Pi's native footer and `/session` own token/cost
reporting; the legacy Codex quota footer and `/usage` are retired. Native
ChatGPT credentials are not sent to the old Codex quota endpoint, and Pi does
not expose OpenAI subscription quota-window data through its native extension API.

Retained packages:

- **pi-parallel@3.0.0:** unchanged upstream at
  `75d933b86d304c2e7beab25c5429fd497b8cc36f`; direct HTTP `web_search` and
  `web_fetch`. Configure an API key with `/parallel-setup`, or reuse the selected
  organization's existing Parallel CLI auth file. No CLI installation is required.
- **pi-exa:** semantic/code/multilingual search through `exa_search`; private
  `EXA_API_KEY` and `/exa-setup`.
- **@benvargas/pi-openai-fast@1.1.1:** reviewed pinned npm package with a narrow
  policy patch, a native footer-status patch, and a Sol-support patch. The footer uses Pi's
  `ctx.ui.setStatus()` without replacing the native footer: it shows accented
  `⚡ FAST` only while enabled on a configured supported current model, and
  clears the native status otherwise. The preference remains enabled across
  model switches, so switching back to a supported model restores the badge;
  the badge means **priority requested**, not server-confirmed. `/fast status`
  makes that distinction explicit. Existing `active`,
  `persistState` and ordered `supportedModels` are
  preserved. The policy patch honors project trust, isolates alternate agent
  directories, preserves explicit allowlists, surfaces config errors, and does
  not enable priority after a failed save. `/fast off` disables the current
  session even if saving fails. Prefer omitting `supportedModels` from an existing
  fast configuration to follow the installed package's reviewed defaults; toggles
  preserve that omission. Explicit lists remain supported for intentional restrictions.
  New model eligibility then comes from reviewed package updates, not automatic
  provider discovery. Our Sol patch adds `openai/gpt-6.1-sol` to the defaults;
  GPT-6 Luna and legacy `openai-codex/gpt-6.1-sol` remain excluded. Explicit
  lists are never expanded. Apply only Fast patches with `sh pi/install.sh --fast-only`,
  then `/reload`. The [patch notes](patches/README.md#sol-fast-validation) record
  the live comparison and the subscription tier-reporting caveat.
- **pi-subagents@0.74.0:** unchanged upstream source pinned at
  `10694a673cb077b4d3ec6a6cfe68acb6c28b83a5`, including its matching orchestration
  skill. Package prompts and the optional council skill are not auto-loaded.
  See its [README](packages/pi-subagents/README.md) and
  [provenance](packages/pi-subagents/VENDORED_FROM.md).
  **Known limitation:** Claude Code async dynamic fanout fails with model/effort
  overrides or pinned agent models. Use native Pi children or Claude Code
  single/static-parallel runs instead; no local implementation fix is carried.
  See the [accepted upstream limitation](packages/pi-subagents/VENDORED_FROM.md#known-accepted-upstream-limitation).
- **mitsupi:** pinned Git source `mitsuhiko/agent-stuff` at
  `0865c849befd2021490679f96a8dee58c84ac857` (manifest version still 1.6.0);
  eight selected skills only. All package extensions, prompts and themes are
  disabled. `/files`, `/todos` and the `todo` tool are retired; their two local
  patches and installer patching logic are removed. Existing todo files and
  inactive package code remain untouched. Use your editor/Git/Hunk for files
  and ordinary notes for tasks; no replacement extension is installed.
  Upstream removed Mermaid; its previously selected skill/validator remain unchanged
  as the frozen shared snapshot `ai/skills/mermaid/`, not as a package patch.

`/review [scope]` is now a native prompt using the shared read-only review skill
and agent, without PR checkout, editing or an automatic fix loop. `/answer`,
`/btw`, `/loop`, the UV bash override and whimsical indicator are not loaded.
Native bash plus shared `uv` instructions replace interception; this is policy,
not sandbox enforcement. Unreferenced local Python shims were removed.

Exa retains its full structured-result API adapter. Parallel follows upstream's
narrower contract: Turbo search, bounded text results, and visible partial-fetch
errors. `deep_research`, `batch_enrich`, Basic/Advanced search, extra filters and
Parallel's former full structured-result contract are intentionally retired.
Researchers synthesize evidence from the three remaining web tools; there is no
compatibility wrapper, CLI polling lifecycle or automatic CLI download. Existing
CLI installations and credentials are left untouched.

Native `edit` owns file edits: use `edits[]` for disjoint replacements in one
file, each matched against the original content. Separate files require separate
calls; there is no cross-file transaction, `multi`, or Codex patch interface.
Mitsupi's edit override and `/context` are disabled. Use the native footer and
`/session` for usage and startup diagnostics for loaded resources; automatic
loaded-skill highlighting is retired.

Local `notify.ts` is only the non-Herdr OSC notification fallback. Herdr owns
its own integration and notifications.

## Continuation and delegation

Use native `/compact`, `/tree`, `/fork` and session resume for conversation
continuity. Use codemode to compose ordinary tool calls and upstream subagent
workflows for authorized multi-step, multi-agent work. The parent remains
responsible for integration and validation; no local orchestration wrapper is
needed.

The custom `/handoff`, `/handoffs`, `handoff_control`, `handoff_accept` and shared
handoff skill are retired. Automatic document-to-branch continuation and the
backlink UI are intentionally removed, not reimplemented through codemode.
Existing documents, session entries and connection files remain untouched and
can be inspected as historical data.

Use subagents only when the operator authorizes delegation; otherwise work
directly in the parent. Use the matching upstream skill and `action: "list"` before
execution. Upstream owns the implementation, schema, lifecycle and discovery;
we own the reviewed source pin, dependencies and supported personal configuration.
Do not restore old resolver/lifecycle patches to satisfy retired fork tests.

Personal policy uses `subagents.agentOverrides` in settings: scout has a read-only
tool allowlist and Luna model, worker uses Luna. The managed `review` definition
is a read-only Sol role. Our `researcher` definition uses Sol and explicitly loads
Exa/Parallel providers so both foreground and background runs have its named web
tools. It cannot edit files or delegate. These are permission lists, not an OS
sandbox. Additional upstream builtins keep upstream defaults; notably `reviewer`
is distinct from our read-only `review`, and `evidence-auditor` requires
pi-web-access, which this setup does not install. Native settings preserve existing
personal overrides on reinstall; project definitions/settings can override roles.

Foreground children are in-process SDK sessions; background children use a detached
runner. Foreground children do not inherit ambient extensions. Configure required
providers explicitly in an agent's `extensions`/`subagentOnlyExtensions`, or use
upstream's background conventions. `subagent` remains model-only, not
codemode-callable: launch its workflow directly rather than wrapping it in a
codemode script.

**Accepted discovery/trust differences:** upstream uses its own delegated skill
and agent discovery, not our former native parity adapter. It can discover package
skills despite a native `skills: []` filter and project agents without consulting
native project trust. Child execution forwards parent trust, including alternate
cwd cases; it does not retain the fork's independent saved-trust lookup. Manual-only
skills are filtered from child injection. Do not treat native resource filtering or
project trust as a sandbox for upstream discovery.

Upstream workflow scripts, management, background status/recovery, intercom and
worktrees use their supported conventions. Old saved chains and active-run files
are preserved, not migrated or promised compatible. Management no longer has the
fork's managed-link protection: edit managed agents in this checkout. Optional
`disabledFeatures` in `~/.pi/agent/extensions/subagent/config.json` can disable
agent management or workflow scripts (the latter enables simpler chain/tasks
inputs); no compatibility adapter is installed. See upstream
[configuration](packages/pi-subagents/docs/configuration.md) and
[agents](packages/pi-subagents/docs/agents.md).

Restart Pi after this source-linked cutover before launching children. The outgoing
fork snapshot is retained under `~/.pi/backups/`; historical handoff receipts
remain on disk despite retirement of their custom tools.

## One-time consolidation

For installations that still have work/personal directories:

```sh
node pi/migrate-to-native.mjs
ai/install.sh
pi/install.sh
PI_CODING_AGENT_DIR="$HOME/.pi/agent" herdr integration install pi
```

Run this separately on each machine; do not sync credentials or combine machine
histories. Stop Pi/subagent runners before switching that machine, and keep the
old directories for manual recovery. This is a one-time cutover, not ongoing
compatibility with work/personal profiles.

The migration builds a new directory before activating it. It copies histories,
custom resources, and native `models.json`/`keybindings.json` files unchanged.
Different model/keybinding files stop the migration for a manual choice rather
than inventing a merge policy. It converts machine/shared and profile MCP
definitions (both adapter and native `mcp.json`), selects Mobbin personal, and
refuses conflicting preserved files or unsupported adapter options. It preserves other provider credentials but does not copy
legacy Codex tokens or activate stored OpenAI API keys. Project trust is asked
again rather than unioning historical approvals. Custom prompts are included.
Runtime preferences and fast configuration use personal > work > old agent
precedence, falling back when absent; managed resource selectors come from source.
Retired Codex provider/model pairs do not override the native startup defaults.

The previous agent directory is renamed to `agent.before-native-<timestamp>`;
work/personal originals remain untouched. A marker makes reruns a no-op. Active
old sessions continue writing their original files: close them normally and
resume their explicit original path if newer messages are needed. Do not delete
old histories while handoff links or active sessions reference them. When resuming
legacy history, explicitly select the new provider if its old model is restored:
`pi --session PATH --model openai/gpt-6-astra`.

Rollback: close unified Pi sessions, move the new agent directory aside, restore
the saved agent directory, and revert the tracked consolidation changes. Old
profiles remain launchable through Pi's raw binary with an explicit agent dir.

## Native-first customization review

See [CUSTOMIZATION-AUDIT.md](CUSTOMIZATION-AUDIT.md) for the current ownership
contract, retained customizations and validation limits. The accumulated migration
receipts and superseded proposals are in its linked historical archive.

## Validation

```sh
sh pi/test-launch.sh
sh pi/test-install.sh
node --test pi/test-migrate.mjs
sh ai/test-install.sh
sh herdr/test-install.sh
npm --prefix pi install --package-lock=false --ignore-scripts
npm --prefix pi run typecheck
NODE="$(mise which -C "$PWD" node)"
PI_OFFLINE=1 "$NODE" --experimental-strip-types --test pi/test-native-*.mjs pi/test-upstream-subagents.mjs pi/test-mitsupi-policy.mjs pi/extensions/tests/*.test.ts
PI_OFFLINE=1 "$NODE" --experimental-strip-types --test pi/packages/pi-exa/test/*.mjs pi/test-upstream-parallel.mjs
```

Run upstream's full suites in a disposable copy named `pi-subagents`, with its
unchanged lockfile and `npm ci --ignore-scripts --legacy-peer-deps`. Do not install
its development Pi peers into the production vendor tree. Invoke mise Node 24
explicitly using upstream's `test:unit`/`test:integration` flags, adding
`--test-concurrency=8`. On macOS use `TMPDIR=/private/tmp` (short canonical socket
paths); leave `PI_OFFLINE` unset for these suites because npm-discovery fixtures
explicitly test non-offline behavior. Their harness isolates HOME and mocks
execution; keep opt-in live CLI smoke variables unset. See the audit for the
host-versus-upstream-toolchain validation boundary.

`dot doctor` checks the unified installation. MCP connectivity and browser OAuth
are separate checks: run `pi mcp list` and sign in through `/mcp`. No installer
starts a model request or copies OAuth tokens between providers.
