# Synthetic authorization lab

This optional experiment uses original, reviewed dummy code only. It accepts no
repository path, URL, credential, or provider option. It does not read target code,
start a server, install packages, or use a model. Review both `.mjs` files first.

## Reproduce

Use the existing Node 24 toolchain. From this repository root on macOS:

```sh
NODE="$(command -v node)"
cd ai/skills/security-audit-local/lab
LAB="$(pwd -P)"
(
  set -e
  ulimit -t 5
  ulimit -f 0
  env -i PATH=/usr/bin:/bin /usr/bin/sandbox-exec \
    -p '(version 1)(allow default)(deny network*)(deny file-write*)' \
    "$NODE" --permission --allow-fs-read="$LAB" --max-old-space-size=64 \
    --test-isolation=none --test-timeout=3000 --test ./invoice-boundary.test.mjs
)
(
  set -e
  ulimit -t 5
  ulimit -f 0
  env -i PATH=/usr/bin:/bin /usr/bin/sandbox-exec \
    -p '(version 1)(allow default)(deny network*)(deny file-write*)' \
    "$NODE" --permission --allow-fs-read="$LAB" --max-old-space-size=64 \
    ./invoice-boundary.mjs
)
```

Use a physical path (`pwd -P`), and run from the lab directory. With the narrow
filesystem grant, Node test discovery cannot traverse an unrelated working directory.
On macOS `/tmp` is a symlink; granting its lexical path alone also caused denied
realpath reads. Both failures were corrected without broadening the grant.

Expected output: 6 passing tests, then:

```json
{"principal":"tenant-a","requested":"invoice-b","vulnerable":"tenant-b","scoped":"denied"}
```

The test runner has a 3-second timeout and the shell has a 5-second CPU limit.
The experiment was also called with a 15-second outer tool timeout. The OS profile
denies network and file writes. Node permits filesystem reads only under this
physical lab directory and denies child processes, workers, and addons by default.
The environment contains only `PATH=/usr/bin:/bin`. No provider credential is used.

These are layered controls for trusted toy code, **not** a general target sandbox:
64 MiB is a V8 old-space limit, not an OS memory bound. The profile does not provide
the complete process, memory, disk, namespace, and evidence-promotion controls that
upstream requires. Never substitute an arbitrary target or downloaded script here.
If `sandbox-exec` or Node permission support is unavailable, stop; do not remove
the restrictions as a fallback. No installer or runtime projection was run.

## Result and negative control — 2026-10-24

| Check | Observed result | Meaning |
| --- | --- | --- |
| Authenticated `tenant-a` reads `invoice-b` through vulnerable lookup | `tenant-b` record returned | Authentication alone does not enforce tenant scope. |
| Same request through scoped lookup | `undefined` / CLI `denied` | The same sink now enforces the tenant invariant. |
| Authorized same-tenant read | Dummy invoice preserved | The fix retains intended behavior. |
| Anonymous, absent tenant, unknown invoice | Expected denial / absent result | Regression cases remain explicit. |
| Temporarily remove `&& invoice.tenant === principal.tenant` from the scoped lookup | 5 pass, 1 fail; exit 1 | The cross-tenant regression test detects removal of the control. |
| Restore that condition and rerun | 6 pass, 0 fail; exit 0 | The committed fixture retains the fix. |

The negative control was a temporary edit to this original fixture only. To repeat
it, make that single edit in a disposable copy, run the same test command, then
restore it. Do not mutate a real target.

This demonstrates a minimum trust-boundary result and a red-capable regression
test. It is not a complete Cloudflare audit, an independent verifier result, or
evidence that any model finds more vulnerabilities. No upstream validator,
third-party target, public endpoint, or AI/provider call was executed.
