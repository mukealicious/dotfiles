# Pinned package policy patches

`pi/install.sh` is the sole installation/patch owner. It accepts exact original
or already-patched context, fails closed on unknown versions/context, and leaves
runtime configuration and history untouched. Re-run it after a package reinstall;
plain `pi update --extensions` may restore upstream files.

| Pinned package | Patch | Reason retained |
|---|---|---|
| `@benvargas/pi-openai-fast@1.1.1` | `pi-openai-fast-1.1.1-policy.patch`, then `pi-openai-fast-1.1.1-footer-status.patch` | The policy patch honors project trust, isolates agent directories, preserves explicit allowlists, surfaces config failures, saves before enabling priority, and disables immediately even when saving fails. The status patch uses Pi's native status API to show fast-toggle state and model eligibility without replacing Pi's footer. |

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
status otherwise. The toggle preference survives model switches, so returning
to an eligible model restores the badge. It does not replace native usage/cost
rendering or query subscription quota endpoints. The installer accepts only the
exact pristine artifact, the exact prior policy output, or the exact current
output; unknown/partial states fail with a reinstall hint. Validation and
application happen in a disposable copy, then an atomic replacement preserves
runtime config. An unpublished intermediate footer prototype is not a supported
upgrade input; restore the pinned package's prior policy output before applying
this source update. Native `models.json` priority is
independent: these patches do not edit model overrides. The earlier one-time Astra retirement is
separate and is not rerun by installation.

The local fast fork, prompt-editor patches and editor fixture are retired. Native
Pi and `extensions/modes.ts` own the editor/presets. Inactive installed editor
code and existing `modes.json` files remain untouched for reference/rollback.

Offline acceptance tests use the real pinned packages, with optional temporary
`PI_FAST_PACKAGE_DIR` unpack directory / `PI_MITSUPI_PACKAGE_DIR` pinned Git checkout. Fast
installer tests apply both patches to the exact pristine source fixture documented
in `pi/test-fixtures/README.md`; other installer fixtures may use old-side patch
contexts. These fixtures do not replace runtime behavior tests. The installer
performs only a read-only check of pi-subagents runtime
packages. For missing dependencies, stop all Pi/subagent runners before manually
running `npm_config_legacy_peer_deps=true mise exec -C "$DOTFILES_ROOT" -- npm ci --omit=dev --ignore-scripts` in
`pi/packages/pi-subagents`; routine installer runs never rebuild the source-linked
dependency tree. Do not refresh patches against a new release without review.
