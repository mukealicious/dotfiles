# Vendored upstream — unchanged

| Field | Pin |
|---|---|
| Package | `pi-subagents@0.74.0` |
| Repository | https://github.com/nicobailon/pi-subagents |
| Source revision | `10694a673cb077b4d3ec6a6cfe68acb6c28b83a5` |
| Release base | `v0.74.0` (20 upstream commits later; manifest version unchanged) |
| Adopted | 2026-10-01 |

All upstream files, including its matching skills, prompts, tests, manifest and
lockfile, are copied unchanged from the pinned GitHub source archive. This file
is the only local addition; top-level `node_modules/` is untracked installation
output. Upstream's five source-controlled shim files under
`test/fixtures/pi-coding-agent-shim/node_modules/` are tracked test source, not
installed dependencies. No local implementation patches are carried. Configuration belongs outside this
subtree (`pi/settings.json`, `pi/agents/`, and writable runtime configuration).

Production dependencies: `npm ci --omit=dev --ignore-scripts --legacy-peer-deps`
with mise Node 24. Host Pi supplies peer modules. Do not install upstream's
0.87.0 development peers into the production tree; use a disposable source copy
for the upstream test toolchain. Use a directory named `pi-subagents` for that
copy (npm self-peer resolution depends on the directory name).

The outgoing dirty fork was preserved before replacement at:
`~/.pi/backups/pi-subagents-before-0.74.0-20260930T130849.tar.gz`.
Do not restore it over active runners. Restart Pi after changing source versions.

This revision includes upstream [#2634](https://github.com/nicobailon/pi-subagents/pull/2634),
which permits Pi 1.0 hosts without the removed `pi-agent-core/node` export.
The temporary local fix/test were replaced with unchanged upstream source.
Manifest and lockfile are unchanged from the previous pin; installed production
dependencies were preserved.

Acceptance in a disposable copy: typecheck and 8 focused alias/spawn tests passed;
unit suite 3593 passed / 14 skipped; integration suite 1154 passed / 7 skipped /
1 filesystem-watcher timeout. The failing `result-publication.test.ts` file passed
on isolated rerun. Independent review confirmed all 939 upstream files match,
including executable bits, and reproduced the unit totals. Its integration run
also had 1154 passed / 7 skipped / 1 timeout, in `foreign-workflow-steering.test.ts`;
both affected files passed together on isolated rerun (10 tests). Neither full
integration run was clean.

Against installed Pi 1.0, all 12 host aliases resolved and imported, two real-host
SDK integration tests passed, and a detached review child launched and completed.
These host checks are separate from upstream's mocked suites with development
peers; they do not prove every feature on Pi 1.0.

## Known accepted upstream limitation

Claude Code async dynamic fanout (`expand` / `parallel` / `collect`) fails when an
explicit or agent-pinned model/effort generates `claudeCodeOverrideArgs`. The
runner injects this field, but its dynamic-template allowlist omits it, producing:

```text
Dynamic chain step 2 parallel does not support field 'claudeCodeOverrideArgs'.
```

Independent review reproduced this through the real background runner with a
fake Claude CLI. A minimal allowlist correction and regressions passed in a
separate checkout, but no local implementation patch is carried and no upstream
PR was requested. Avoid this combination; use native Pi children or Claude Code
single/static-parallel runs instead. Revisit the pin when upstream fixes it.

## Preservation

Pre-adoption source backup and validation logs:
`~/.pi/backups/pi-subagents-before-10694a6-20261001T143653/`.
Reload/restart Pi before testing a real child against the newly pinned source.

For acceptance results and the intentionally accepted discovery, trust, and
execution differences, see `../../CUSTOMIZATION-AUDIT.md` and `../../README.md`.
