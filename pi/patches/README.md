# Pinned package policy patches

`pi/install.sh` is the sole installation/patch owner. It accepts exact original
or already-patched context, fails closed on unknown versions/context, and leaves
runtime configuration and history untouched. Re-run it after a package reinstall;
plain `pi update --extensions` may restore upstream files.

| Pinned package | Patch | Reason retained |
|---|---|---|
| `@benvargas/pi-openai-fast@1.1.1` | `pi-openai-fast-1.1.1-policy.patch`, then `pi-openai-fast-1.1.1-footer-status.patch`, then `pi-openai-fast-1.1.1-sol.patch` | The policy patch honors project trust, isolates agent directories, preserves explicit allowlists, surfaces config failures, saves before enabling priority, and disables immediately even when saving fails. The status patch uses Pi's native status API without replacing the footer. The Sol patch adds only `openai/gpt-6.1-sol` to default eligibility and makes `/fast status` explicit about request intent. |

Mitsupi now supplies only eight selected skills. Its files/todos extensions are
disabled, so their patches and custom patching code are deleted. Native Pi owns
installation of the pinned Git source. Existing package files (including old
patches) and todo history are left untouched; no patch reversal or data cleanup
is needed for disabled extensions.

The fast npm artifact was reviewed and its registry SHA-512 integrity verified:
`sha512-O2lCE2HsHOotJu+KTTNVLvF2EK3vbD4xiK5XwG97KEnoVifrPR4T4VSoHDOaTsnMLyf/3m8AG1nm2IWLOWyMBQ==`.
Its host peer remains upstream's `>=0.74.0`; native Pi suppresses peer installation.
No bundled host runtime or runtime-dependency duplication was found. Upstream
source: [ben-vargas/pi-packages](https://github.com/ben-vargas/pi-packages/tree/a27429aed49cd5e1bd9beb11418b77d47f7bb196/packages/pi-openai-fast).

The consolidated fast policy patch rejects malformed explicit allowlists rather
than falling back to broad defaults, clears active/cached priority eligibility
after a failed refresh, and rejects non-object JSON policies. The footer patch
shows accented `⚡ FAST` through `ctx.ui.setStatus()` only when Fast is active and
the current model matches the configured supported-model list; it clears the
status otherwise. The badge indicates priority request intent, not server confirmation.
The toggle preference survives model switches, so returning
to an eligible model restores the badge. It does not replace native usage/cost
rendering or query subscription quota endpoints. The installer accepts only the
exact pristine artifact, the exact prior policy or footer output, or the exact current
output; unknown/partial states fail with a reinstall hint. Validation and
application happen in a disposable copy, then an atomic replacement preserves
runtime config. An unpublished intermediate footer prototype is not a supported
upgrade input; restore the pinned package's prior policy output before applying
this source update. Native `models.json` priority is
independent: these patches do not edit model overrides. The earlier one-time Astra retirement is
separate and is not rerun by installation.

## Sol Fast validation

The Sol patch changes default eligibility only; explicit allowlists (including
empty lists), saved toggle state and persistence preferences remain untouched.
`sh pi/install.sh --fast-only` applies the same digest-guarded patches without
installing unrelated packages or rewriting settings.

On 2026-10-01, an isolated Pi SDK test used the installed Fast extension and
ChatGPT OAuth through `api.openai.com/v1/responses`. Three sequential pairs per
model copied identical 60-line text at low thinking; the middle pair reversed
Fast-on/off order. All 12 responses matched exactly: 664 output tokens, zero
reasoning tokens and zero cache hits. Median measurements:

| Model | Off tokens/s | On tokens/s | Off total | On total |
|---|---:|---:|---:|---:|
| GPT-6.1 Sol | 33.7 | 63.3 | 22.74s | 12.69s |
| GPT-6 Astra | 33.6 | 63.2 | 22.95s | 13.20s |

All Fast-on requests sent `service_tier: "priority"`, but every completed response
reported `default`. Every Fast-on run outperformed its paired Fast-off run.
This supports enabling Sol, not a guarantee of latency, routing or subscription
billing. It is a small copying benchmark, not a coding-quality benchmark.
[Pi #3188](https://github.com/earendil-works/pi/issues/3188) reports a similar
speed/metadata discrepancy on the older ChatGPT Codex endpoint; it does not
establish the cause on this newer path. Do not infer confirmed processing tier
or subscription charges from the badge or Pi's estimated token costs.

## Retired customizations

The local fast fork, prompt-editor patches and editor fixture are retired. Native
Pi and `extensions/modes.ts` own the editor/presets. Inactive installed editor
code and existing `modes.json` files remain untouched for reference/rollback.

Offline acceptance tests use the real pinned packages, with optional temporary
`PI_FAST_PACKAGE_DIR` unpack directory / `PI_MITSUPI_PACKAGE_DIR` pinned Git checkout. Fast
installer tests apply all three patches to the exact pristine source fixture documented
in `pi/test-fixtures/README.md`; other installer fixtures may use old-side patch
contexts. These fixtures do not replace runtime behavior tests. The installer
performs only a read-only check of pi-subagents runtime
packages. For missing dependencies, stop all Pi/subagent runners before manually
running `npm_config_legacy_peer_deps=true mise exec -C "$DOTFILES_ROOT" -- npm ci --omit=dev --ignore-scripts` in
`pi/packages/pi-subagents`; routine installer runs never rebuild the source-linked
dependency tree. Do not refresh patches against a new release without review.
