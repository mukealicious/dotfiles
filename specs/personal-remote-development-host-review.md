# Personal Remote Development Host — Review Findings

**Status:** Parked for later refinement
**Reviewed:** 2026-07-22
**Source spec:** [`personal-remote-development-host.md`](personal-remote-development-host.md)

## Summary

The proposed direction aligns with the knowledge base: use Tailscale-only remote access, pair Mosh with Herdr, clone repositories on demand, validate an existing personal Mac before buying a Mac mini, defer Caddy/public sharing, and keep critical home services on the NAS/Raspberry Pi.

The source spec should remain in review rather than move directly to task breakdown until the blocking findings below are resolved.

## Blocking Findings

### 1. Identify and approve the host explicitly

**Spec references:** lines 20, 35, 238–242

The spec says “personal Mac” without identifying which machine. The vault explicitly prohibits using the old Intel Gecko MacBook as an always-on host because its battery is bulging.

**Required refinement:**

- Name the approved Apple Silicon personal Mac and expected Tailscale MagicDNS name.
- Explicitly exclude Gecko / the 2015 Intel MacBook.
- Define the intended local account without committing sensitive machine-specific data.

**Evidence:**

- `03 - Resources/Home Server - Intel MacBook Fedora.md`
- `01 - Projects/Personal Systems - Tailscale Homelab System.md`

### 2. Use the personal Pi profile explicitly

**Spec references:** lines 51–66, 160, 243–246

The tracked `bin/pi` wrapper defaults to the work profile unless `PI_DEFAULT_PROFILE=personal` is set. A personal-host validation could therefore launch the wrong profile or fail on missing work credentials.

**Required refinement:**

- Launch `pi-personal` explicitly in the first slice, or require machine-local `PI_DEFAULT_PROFILE=personal`.
- Validate personal Pi OAuth before testing persistence.
- Install the personal Herdr integration explicitly:

```sh
PI_CODING_AGENT_DIR="$HOME/.pi/personal" herdr integration install pi
```

**Evidence:**

- `bin/pi`
- `bin/pi-personal`
- `pi/README.md`
- `herdr/README.md`

### 3. Separate Mosh resilience from Herdr persistence

**Spec references:** lines 51–68, 243–244, 253–260

Backgrounding the iPhone app may only demonstrate that the same Mosh client resumed. It does not prove that a completely new connection can reattach to the durable Herdr session.

**Required refinement:** split validation into three explicit tests:

1. Change networks/background the app and verify the existing Mosh connection resumes.
2. Terminate the mobile client, establish a new Mosh connection, run `herdr`, and verify it reattaches to the original pane/process/output.
3. Let the display actually sleep while the Mac remains open and on AC, then reconnect successfully.

Record a pane/session identifier, process identifier, and observable output before and after each test.

**Evidence:**

- `03 - Resources/Study - Mosh Caddy Tailscale A Remote Dev Deep Dive - 2026-07-22.md`

### 4. Make the network-exposure claim testable

**Spec references:** lines 22, 68, 182–183, 189–199, 245

Enabling macOS Remote Login normally makes SSH reachable on local interfaces; Tailscale does not by itself bind OpenSSH or Mosh exclusively to the tailnet. Disabling Tailscale over cellular proves that the tailnet route disappeared, but it does not rule out router mappings, public IPv6, or LAN reachability.

**Required refinement:**

- Use the full MagicDNS FQDN or a Tailscale 100.x address for validation.
- Check router port mappings, public IPv4/IPv6 reachability, macOS firewall state, and Mosh’s UDP range.
- Define whether all approved tailnet devices are trusted or whether Tailscale grants should restrict access.
- Either prove tailnet-only reachability or narrow the success claim to “no intentionally configured public exposure.”

### 5. Select the mobile client and SSH authentication path

**Spec references:** lines 31, 44, 59, 196–198, 267

“Mosh-capable terminal client” and “prefer SSH keys” leave a first-slice dependency unresolved.

**Required refinement:**

- Select the initial client, such as Termius or Blink Shell.
- Define how a dedicated client public key is added to the approved local account.
- Verify file permissions and a non-interactive SSH command before Mosh testing.
- Avoid allowing password authentication to become the accidental default.

## Important Refinements

### Reconcile the new path with Codex Remote

The active vault decision assigns Codex Remote as the mobile interface for knowledge-base and homelab work. State that Mosh + Herdr + Pi supplements it for persistent development sessions, or explicitly supersede and update that decision.

**Evidence:** `03 - Resources/Decision Memo - Codex Remote Gecko and Coco Direction - 2026-05-16.md`

### Preserve the `gecko` ownership boundary

Dotfiles should own generic Mosh installation, shared configuration, and reusable diagnostics. Host identity, tailnet naming, authorized accounts, and the operational machine map belong in `gecko` under the existing homelab decision. Avoid duplicating those facts in both repositories.

### Do not use full bootstrap as the thin-slice prerequisite

`script/bootstrap` invokes `dot`, which applies macOS defaults, updates/upgrades Homebrew, installs the complete Brewfile, and runs every topic installer. That is broader than the persistence experiment.

For the pilot, prefer a preflight on an already configured personal Mac and targeted installation of Mosh. Do not run the ordinary installer on the work Mac merely to prove it does not enable remote-host settings; use static or isolated validation instead.

**Evidence:**

- `script/bootstrap`
- `bin/dot`
- `script/install`
- `macos/install.sh`

### Keep `remote-dev-doctor` narrow

`bin/dot-doctor` already owns generic Herdr installation, configuration, and stale-server checks. A new doctor should focus on remote-host-specific state rather than duplicate those semantics.

Add an explicit pass/warn/fail matrix and test the actual non-interactive remote command path:

```sh
ssh <host> 'command -v mosh-server'
```

Use `$HOME/Code` directly in shell-neutral checks; `$PROJECTS` is configured by Fish and is not guaranteed in every shell.

### Move recovery ahead of Caddy

The remote-development study recommends validating reboot/power-loss recovery before adding Caddy. The source spec currently schedules Caddy in Slice 4 and recovery in Slice 5. Reorder them or document why named project URLs are worthwhile before recovery is reliable.

### Correct the repository diagram

The architecture diagram places `.dotfiles` under `~/Code`, while the repository contract and bootstrap clone use `~/.dotfiles`.

### Re-estimate the work

A robust doctor, runbook, shell tests, mobile client setup, and physical validation are likely closer to **L / roughly one day** than 1–3 hours, even if the dotfiles edits themselves remain small.

## What Already Aligns

- Tailscale as private connective tissue with no deliberate public exposure.
- Mosh for connection roaming and Herdr for process/session persistence.
- Existing personal hardware as a pilot before a Mac mini purchase.
- Dedicated hardware deferred until a concrete workload proves its value.
- Critical DNS, storage, and Home Assistant services remain on NAS/Pi.
- Caddy, browser authentication, public sharing, and worktrees are deferred.
- Git and independent clones are the durable handoff mechanism.
- Active Git working trees are not synchronized through file-sync tools.
- Machine-specific power, Remote Login, firewall, and Tailscale state remain opt-in rather than automatic dotfiles behavior.
- Existing `muke.me` and `mikeywills.me` DNS are correctly treated as production/identity-sensitive.

## Read-Only Preflight Snapshot

At review time on the current Mac:

- Tailscale was installed but reported that login was required.
- Mosh and `mosh-server` were not installed.
- AC idle sleep was still configured to one minute rather than disabled.
- The Herdr client was newer than the running server and reported `restart_needed: yes`; the documented non-destructive remediation is `herdr server live-handoff`.
- No TCP port 22 listener was observed; macOS Remote Login still requires privileged/manual verification.

These are expected setup gaps, not implementation failures.

## Resume Checklist

When this work resumes:

1. Confirm the approved host, MagicDNS FQDN, and local account.
2. Choose the iPhone Mosh client and SSH-key flow.
3. Decide how this supplements Codex Remote and what operational facts stay in `gecko`.
4. Update the first-slice tests to distinguish Mosh recovery from Herdr reattachment.
5. Narrow and specify `remote-dev-doctor` behavior.
6. Reorder recovery before Caddy.
7. Change the source spec status back to ready only after the blocking findings are resolved.

No implementation changes were made during this review.
