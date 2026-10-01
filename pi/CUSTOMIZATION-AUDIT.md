# Pi customization: current contract

This is the current-state reference with a bounded latest validation summary, not a change log.
The previous accumulated audit is preserved in the [historical archive](docs/CUSTOMIZATION-AUDIT-2026-09-30.md); its superseded recommendations and test claims do not describe current authority. Current source is in `pi/`, shared AI resources in `ai/`, and generated/runtime state under `~/.pi/agent` is user data.

## Ownership and operating contract

- Pi owns native models, sessions, MCP, codemode, tools, compaction, and conversation controls. The `pi/` installer owns resource selection and links; it bootstraps absent settings keys without claiming user preferences, credentials, or histories. Shared skills and instructions are owned by `ai/` and projected by its installer.
- `pi/settings.json` selects installed resources and default tools. `~/.pi/agent/settings.json`, `models.json`, `mcp.json`, OAuth files, custom agents/chains, and conversation histories are runtime/user-owned. Do not overwrite, migrate, or clean them as an audit side effect.
- Native MCP and codemode replace the retired adapter/proxy stack. `/mode` selects model/thinking presets; `/fast` independently controls supported priority mode. Native session history and session controls replace custom cross-session prompt history and handoff controls.
- Use `pi/README.md` for setup and operation. It is the user-facing guide; this audit records reviewed customization boundaries and known qualification only.

## Reviewed package pins and retained local behavior

| Component | Current source and reason for retention |
|---|---|
| `pi-subagents` | Unchanged upstream `0.74.0`, revision `b6bda32f03b7f549623bc404c9be14dca298ddc4`. Upstream owns delegation, built-in agents, background runs, and its matching skill. Local source selection/settings are configuration, not a fork. |
| `pi-parallel` | Unchanged upstream `3.0.0`, revision `75d933b86d304c2e7beab25c5429fd497b8cc36f`. Retained direct `web_search`/`web_fetch` API tools; no Parallel CLI subprocess or research/enrichment fork. |
| Mitsupi | Pinned `mitsuhiko/agent-stuff` revision `0865c849befd2021490679f96a8dee58c84ac857` (manifest version `1.6.0`). Keep eight selected skills only; all extensions, prompts and themes disabled. No local Mitsupi patches remain. |
| `@benvargas/pi-openai-fast` | Reviewed npm `1.1.1`. Keep the consolidated policy patch for isolation, explicit allowlists and fail-closed configuration/persistence, plus a small footer-status patch using Pi's native `ctx.ui.setStatus()` API. Whole-file pristine/policy/current digests guard installation; staged output is verified before replacement. This remains the sole managed priority toggle, not upstream behavior. |
| Mermaid | Keep the portable skill snapshot from `mitsuhiko/agent-stuff` revision `b7c45d67c634d361d67340789a02f64ffb9e16f1`, because upstream removed the selected skill. The snapshot includes authoring guidance and validator; it is a shared AI skill, not a Mitsupi fork. |
| `pi-exa` | Retain the direct Exa search API for its distinct semantic/code/multilingual search capability. Credentials remain private runtime configuration. |
| Local `modes.ts` and Gruvbox theme | Keep the thin four-preset native model/thinking selector and existing theme; native state remains authoritative and the extension does not force startup/resume state. |

Selected source pins are not endorsements of unreviewed package features. For provenance and installation details see package `VENDORED_FROM.md` files and `pi/patches/README.md`.

## Deliberately retired

- **Files/todos add-ons:** `/files`, `/todos`, and the `todo` tool are disabled. Their two patches and installer patching helpers are removed; existing todo data and inactive package code stay untouched. `/fast` and its single policy patch remain supported.
- **Custom handoff product:** no handoff extension, connection/backlink library, handoff skill, receipt-driven continuation, or automatic cross-session continuation remains. Use native conversation/branch/resume controls and approved upstream subagent workflows. Existing handoff records, session histories, backups, and unmanaged links are historical/user data and are not automatically removed or interpreted.
- **Local Parallel CLI/research fork:** removed in favor of unchanged upstream 3.0.0's direct HTTP search/fetch interface. Retained CLI/auth files are not managed or deleted by this decision.
- **Custom Pi MCP adapter, profile wrappers, bespoke prompt-history/mode storage, usage/quota footer, and obsolete Mitsupi tool overrides:** native Pi or shared AI ownership supersedes these. Do not restore retired commands/tools for compatibility.
- **Subagents implementation fork:** retired. Do not infer old trust/discovery/lifecycle guarantees from archived tests or prose; upstream behavior and documented settings are authoritative.

These retirements do not authorize deleting old profiles, histories, connection data, rollback archives, credentials, or user-managed entries.

## Installation boundary

- Skill projection writes to a staging directory but embeds the final published script root; temporary locations never become installed command paths.
- Required package-install failures exit nonzero with diagnostics. Subagent dependency readiness is checked before resource/settings changes; routine installation never rebuilds the shared dependency directory. Missing/mismatched manifests require an explicit refresh after stopping runners (see README).
- Fast installation accepts only reviewed pristine/current file digests, not historical intermediate patch states. No replacement package manager, dependency-repair daemon or handoff framework is introduced.

## Latest validation — 2026-10-01

- Fast status simplification installed: the native status is accented `⚡ FAST` only when the session toggle is active and the selected model is eligible under the configured allowlist; all other conditions clear it. The unpublished local prototype was reversed in staging with exact checksum guards before `pi/install.sh` applied the updated patch. Installer regression tests, all 30 native Fast tests against the installed package, configured TypeScript, and diff hygiene passed. Existing Pi processes need a restart to load the change. OpenAI subscription quota data remains unavailable through Pi's native extension API.
- Follow-up: **131 owned tests, five shell suites, configured TypeScript and diff hygiene passed**. Retired files/todos implementation tests were replaced by two resource-selection tests: eight skills remain, no Mitsupi extensions/commands/tools load, and existing todo data remains intact. Six migration regressions cover native model/keybinding preservation and conflicts, plus native work/personal MCP inclusion.
- Applied `pi/install.sh` on this machine (Pi 0.99.2): eight Mitsupi skills, zero Mitsupi extensions. Nine protected paths covering credentials, MCP/model/keybinding/fast configuration, Fast implementation and inactive files/todos code remained unchanged; native runtime preferences survived. Installer is 319 lines, with one remaining Fast policy patch. No live migration was run; other machines still need their own setup.
- Real detached `researcher` run `d4223255-6ff0-4682-975c-ef1420c209fb` successfully called Exa search and Parallel fetch. Its transcript records both calls without errors; it reported no write/edit/bash/delegation tools. `web_search` was exposed but not called. This is a live smoke receipt, not an automated detached-run regression test.
- Prior 2026-09-30 installation evidence: three isolated writers and two independent reviewers, corrected findings and accepted recheck; 11 watchlist tests passed. Installer tests are hermetic; production fast digests and byte equivalence were independently checked against a disposable copy of the installed pinned artifact.
- Prior installation: both owning installers applied. **13 published script references** resolve to existing files with no staging paths. Installed discovery at repo, nested `pi/` and external cwd: **9 extensions, 46 skills, zero diagnostics**; retired handoff tools absent.
- Seven protected configuration paths, including settings, remained byte-identical. All **537 subagent dependency entries** retained contents, inode and modification time across installation; no dependency rebuild occurred.
- Authorized subagents used models; the follow-up smoke made two live web-provider calls. No commits/pushes. Script-reference checks do not execute every script; Mermaid rendering/downloads, a fresh full upstream test matrix, and broader live service behavior were not exercised. Dependency manifest checks are not complete integrity scans. Accepted upstream discovery/trust semantics remain different from the retired fork; native resource filtering is not a sandbox.

## Rollback and evidence

Historical rollback inputs recorded for prior cutovers include:

- `~/.pi/backups/pi-parallel-before-upstream-3-20260930.tar.gz`
- `~/.pi/backups/settings-before-upstream-adoption-20260930.json`
- `~/.pi/backups/upstream-adoption-source-baseline-20260930.tar.gz`
- `~/.pi/backups/pi-subagents-before-0.74.0-20260930T130849.tar.gz`
- Handoff retirement source/test snapshot: `~/.pi/backups/handoff-retirement-20260930T161047.tar.gz`

- Pre-simplicity-pass affected source: `~/.pi/backups/pi-simplicity-source-before-20260930.tar.gz`

These are preservation pointers, not a guarantee that every machine has them or that restoration was exercised. Historical details remain in the [archive](docs/CUSTOMIZATION-AUDIT-2026-09-30.md). Prior installation evidence belongs to workflow `190a0084-7159-4caf-91ea-d14c77fd5b5b`; final reviewer recheck `7368d10a-1034-4afb-915c-8c5192bcd7dc`. Runtime-managed artifacts retain reports without growing this contract into another diary.
