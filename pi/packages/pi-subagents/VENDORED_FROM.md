# Vendored upstream — unchanged

| Field | Pin |
|---|---|
| Package | `pi-subagents@0.74.0` |
| Repository | https://github.com/nicobailon/pi-subagents |
| Source revision | `b6bda32f03b7f549623bc404c9be14dca298ddc4` |
| Tag | `v0.74.0` |
| Adopted | 2026-09-30 |

All upstream files, including its matching skills, prompts, tests, manifest and
lockfile, are copied unchanged from the pinned GitHub source archive. This file
is the only local addition; `node_modules/` is untracked installation output.
No local implementation patches are carried. Configuration belongs outside this
subtree (`pi/settings.json`, `pi/agents/`, and writable runtime configuration).

Production dependencies: `npm ci --omit=dev --ignore-scripts --legacy-peer-deps`
with mise Node 24. Host Pi supplies peer modules. Do not install upstream's
0.87.0 development peers into the production tree; use a disposable source copy
for the upstream test toolchain. Use a directory named `pi-subagents` for that
copy (npm self-peer resolution depends on the directory name).

The outgoing dirty fork was preserved before replacement at:
`~/.pi/backups/pi-subagents-before-0.74.0-20260930T130849.tar.gz`.
Do not restore it over active runners. Restart Pi after changing source versions.

For acceptance results and the intentionally accepted discovery, trust, and
execution differences, see `../../CUSTOMIZATION-AUDIT.md` and `../../README.md`.
