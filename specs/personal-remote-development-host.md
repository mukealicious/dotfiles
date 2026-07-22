# Personal Remote Development Host — Implementation Spec

**Status:** Ready for task breakdown
**Effort:** M (1–3 hours of dotfiles work, plus setup and validation on the personal Mac)
**Approved by:** Mikey Wills
**Date:** 2026-07-22

## Problem Statement

**Who:** Mikey, doing personal development from a Mac and occasionally checking or directing agents from an iPhone.

**What:** Coding-agent and terminal sessions currently depend on the development laptop remaining directly in use. Closing the client or changing networks interrupts the workflow and makes long-running agent work inconvenient.

**Why it matters:** A personal Mac that is already available and often plugged in can provide most of the value of an always-on development host without buying hardware or exposing services publicly.

**Evidence:** The remote-development study and existing Moja Glava plans consistently identify Tailscale, persistent terminal sessions, Git, and a future Mac-native agent node as the preferred boring primitives. The dotfiles already own Herdr, Zed, GitHub CLI, agent configuration, and the `~/Code` project convention.

## Decision

Use the personal Mac laptop as an opt-in remote development host while it is plugged in, open, awake, and connected to Tailscale. Connect initially from an iPhone using Tailscale and a Mosh-capable terminal client. Use Mosh for resilient transport and Herdr for process/session persistence.

Do not expose SSH, Mosh, or development servers publicly. Do not add Caddy or custom project domains until a long-lived browser project demonstrates the need.

This is a single-host workflow. A future Mac mini or second host can reuse the same dotfiles and runbook, but live processes and Herdr sessions do not migrate between hosts.

## Architecture

```text
iPhone
├── Tailscale
└── Mosh-capable terminal client
        │
        │ private tailnet
        ▼
Personal Mac laptop
├── macOS Remote Login / OpenSSH
├── Mosh server
├── Herdr
│   └── Pi / Claude / shell processes
├── ~/Code
│   ├── moja-glava
│   ├── .dotfiles clone
│   └── repositories cloned on demand
└── GitHub + 1Password-backed credentials
```

Zed remote editing is a follow-up client path over SSH. It is independent of Mosh and is not required to validate the first slice.

## First Vertical Slice

**Slice:** Start one Pi session inside Herdr on the personal Mac, disconnect the iPhone, and reconnect to the unchanged session over Mosh.

**Risk proven:** The personal laptop can remain awake and reachable long enough to serve as a practical remote agent host, and the iPhone client can reconnect through Tailscale and Mosh.

**Includes:**

1. Bootstrap the existing dotfiles on the personal Mac.
2. Join the Mac and iPhone to the same tailnet and assign the Mac a stable MagicDNS device name.
3. Enable macOS Remote Login for the intended local user.
4. Install Mosh on the host through Homebrew.
5. Install the relevant Herdr agent integrations.
6. Clone one harmless personal repository under `~/Code`.
7. Connect from the iPhone over Mosh.
8. Start or attach Herdr and launch Pi in the test repository.
9. Disconnect the iPhone while a safe, observable task runs.
10. Reconnect and verify the same Herdr pane, Pi process, and output remain.

**Important failure path:** With Tailscale disconnected or the host asleep, the client must fail closed rather than falling back to a public endpoint. The runbook should distinguish unreachable-host, sleeping-host, SSH-bootstrap, and Mosh-UDP failures.

**Defers:** Zed, browser dev servers, Caddy, custom domains, browser authentication, reboot recovery, public sharing, work-laptop support, and automatic repository mirroring.

## Host Power Policy

Use the built-in macOS setting rather than a permanent third-party keep-awake process:

1. Open **System Settings → Battery → Options**.
2. Enable **Prevent automatic sleeping on power adapter when the display is off**.
3. Allow the display itself to turn off normally.
4. Keep the laptop connected to AC and physically open during the pilot.

Equivalent charger-only CLI configuration, for documented/manual use:

```sh
sudo pmset -c sleep 0
```

Verification:

```sh
pmset -g custom
```

The AC Power section should report `sleep 0`. Do not set battery sleep to zero. Do not encode this preference in the global `macos/install.sh`, because the dotfiles are shared with the work laptop and because server behavior must remain an explicit per-machine choice.

Closing a MacBook lid is a distinct sleep trigger and is outside the first slice. The pilot assumes the lid remains open.

## Repository Availability

GitHub is the repository catalogue and handoff mechanism; it is not mirrored wholesale onto the host.

Bootstrap clones:

- `~/.dotfiles`
- `~/Code/moja-glava`

Other repositories are cloned on demand:

```sh
gh repo clone mukealicious/<repository> "$HOME/Code/<repository>"
```

Rules:

- Keep independent clones on each machine.
- Move durable work through commits, branches, and GitHub.
- Do not synchronize active `.git` working trees through file-sync tools.
- Do not automatically clone every repository in the GitHub account.
- Keep tokens, SSH private keys, agent authentication, and `~/.gitconfig.local` outside the repository.
- Use 1Password CLI when credentials need to be provisioned.

## Dotfiles Deliverables

### D1 — Mosh dependency (S)

Add `mosh` to the top-level `Brewfile`.

Mosh is safe as a shared CLI dependency on both Macs. Tailscale should not become a mandatory Brewfile dependency in this slice because it is unavailable or nonfunctional on the work laptop and requires machine-specific system integration.

**Likely file:** `Brewfile`

### D2 — Remote development runbook (S)

Create `remote-dev/README.md` covering:

- host and iPhone prerequisites;
- Tailscale naming and MagicDNS checks;
- macOS Remote Login setup;
- charger-only power configuration;
- Mosh connection and troubleshooting;
- Herdr integration, detach, and reattach behavior;
- GitHub authentication and clone-on-demand workflow;
- first-slice validation procedure;
- security boundaries and rollback.

The topic is documentation and opt-in host setup. It should not include an auto-discovered `install.sh` that silently changes power, sharing, firewall, hostname, or Tailscale state.

**Likely file:** `remote-dev/README.md`

### D3 — Host diagnostic command (M)

Add `bin/remote-dev-doctor`, a read-only diagnostic that reports actionable pass/warn/fail results for:

- macOS host detection;
- AC power state;
- charger-specific system sleep configuration;
- Tailscale CLI availability, connection, and local device name;
- SSH/Remote Login reachability indicators where readable without privilege;
- `mosh-server` availability;
- Herdr availability and stale-server status;
- Pi availability and recommended Herdr integration;
- `gh auth status`;
- existence of `~/Code`, dotfiles, and `moja-glava` clones.

The command must not change settings, authenticate services, start daemons, or print credentials/tokens.

**Likely file:** `bin/remote-dev-doctor`

### D4 — Existing documentation links (S)

Update Herdr documentation and `dot doctor` guidance to point at the opt-in remote-host runbook/diagnostic without making remote-host checks mandatory for every machine.

**Likely files:**

- `herdr/README.md`
- `bin/dot-doctor`
- optionally the top-level `README.md`

## Interface Contracts

| Interface | Contract | Failure behavior |
|---|---|---|
| Host name | Stable Tailscale MagicDNS device name | No public DNS fallback |
| Terminal connection | `mosh <user>@<tailnet-host>` | Report SSH bootstrap or UDP failure |
| Session persistence | Herdr owns panes/processes independently of client connection | Client loss must not terminate the pane |
| Repository access | `gh repo clone` into `$PROJECTS` | Authentication or repository errors remain explicit |
| Host diagnostic | `remote-dev-doctor` is read-only and secret-safe | Nonzero only for blocking host failures; warnings for optional/deferred items |
| Power policy | System never idles to sleep while on AC; display may sleep | Battery behavior remains unchanged |

## Security Boundary

- No router port forwarding.
- No public SSH or Mosh listener intentionally exposed through NAT.
- No Tailscale Funnel.
- No Cloudflare Tunnel for terminal access.
- No password credentials committed to dotfiles.
- Prefer SSH keys and machine-scoped authentication.
- Restrict macOS Remote Login to the intended user where practical.
- Treat Tailscale device approval and account security as part of the trust boundary.
- Do not weaken FileVault, Gatekeeper, the macOS firewall, or global authentication controls for convenience.

## Follow-up Slices

### Slice 2 — Zed remote editing

Connect Zed to the personal Mac through SSH and open the same repository. Keep Zed's SSH transport separate from Mosh. Decide how host-specific connection entries coexist with the tracked `zed/settings.json` before persisting them.

### Slice 3 — Browser access without named domains

Validate one development server through either:

- an SSH local port forward, allowing the client to use `http://localhost:<port>` while the remote app remains bound to remote loopback; or
- the host's Tailscale name and port, with the app bound narrowly enough to avoid unwanted LAN exposure.

Do not assume that `localhost` on the client refers to the remote host.

### Slice 4 — Selected named project URLs

Only for long-lived projects, evaluate Caddy and a reserved development namespace. Existing Cloudflare DNS is production-sensitive: `muke.me` hosts public services, and `mikeywills.me` has wildcard redirect behavior. DNS and certificate changes require a separate plan and explicit approval.

### Slice 5 — Recovery and dedicated hardware

After the laptop pilot demonstrates sustained value, add reboot/power-loss recovery and reassess the planned Apple Silicon Mac mini. Keep critical home services on the NAS/Pi rather than coupling them to the development host.

## Non-Goals

- Making the personal laptop a critical homelab server.
- Supporting the work laptop as a host or tailnet client.
- Keeping the host available while its lid is closed.
- Surviving host shutdown or reboot in the first slice.
- Mirroring every GitHub repository.
- Migrating live sessions between machines.
- Publicly sharing development applications.
- Running Caddy before a selected long-lived project needs it.
- Giving agents unrestricted access to a primary authenticated browser profile.

## Acceptance Criteria

1. The personal Mac and iPhone appear as approved devices in the same tailnet.
2. The personal Mac resolves from the iPhone by its stable MagicDNS name.
3. The host is configured not to idle-sleep on AC while allowing display sleep; battery sleep remains enabled.
4. macOS Remote Login is enabled only for the intended user(s).
5. The iPhone can establish a Mosh session without public port forwarding.
6. A Pi process launched inside Herdr continues after the iPhone disconnects.
7. Reconnecting returns to the same Herdr pane and Pi session with preserved output.
8. Disconnecting Tailscale makes the host unreachable from the iPhone.
9. `remote-dev-doctor` detects missing blocking prerequisites and does not expose secrets.
10. Running the ordinary dotfiles installer on the work Mac does not enable Tailscale, Remote Login, or server-specific power settings.

## Validation Procedure

1. Run `dot doctor` and `remote-dev-doctor` on the personal Mac.
2. Confirm `pmset -g custom` reports AC `sleep 0` and nonzero battery sleep.
3. Turn off Wi-Fi on the iPhone so the test crosses the mobile network.
4. Connect through the iPhone Tailscale client and Mosh application.
5. Start Herdr, open a pane in a harmless personal repository, and launch Pi.
6. Ask Pi to perform a safe task that takes long enough to observe disconnection.
7. Background or disconnect the phone client.
8. Wait for the task to progress.
9. Reconnect and confirm the same pane/process/output.
10. Disable Tailscale on the phone and confirm the private host is no longer reachable.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---:|---:|---|
| Laptop sleeps despite display settings | Medium | High | Use the macOS AC sleep setting, keep lid open, and verify with `pmset` |
| iOS client lacks working Mosh support | Medium | Medium | Select and validate a Mosh-capable client before the acceptance test; SSH remains a diagnostic fallback, not the success condition |
| Mosh UDP is blocked or misrouted | Low–Medium | Medium | Test over Tailscale first; distinguish SSH bootstrap from Mosh UDP failures in the runbook |
| Laptop heat/battery wear from continuous AC use | Medium | Medium | Use the pilot intermittently, keep ventilation clear, retain optimized battery charging, and reassess dedicated hardware if usage becomes continuous |
| Credentials proliferate onto another machine | Medium | High | Provision intentionally through 1Password and avoid copying broad credential directories |
| Work-machine behavior changes through shared dotfiles | Low | High | Keep Tailscale, power, sharing, and host identity as explicit machine-local steps |
| Laptop restarts or loses power | Medium | Medium | Explicitly accepted in the first slice; add recovery only after proving the workflow's value |

## Trade-offs

| Chose | Over | Because |
|---|---|---|
| Existing personal laptop | Immediate Mac mini purchase | Validates the workflow before buying hardware |
| Tailscale-only access | Public SSH/Cloudflare Tunnel | Smaller private attack surface and alignment with existing homelab direction |
| Mosh + Herdr | SSH alone | Mosh handles connection churn; Herdr owns durable processes |
| Clone on demand | Mirror all GitHub repositories | Less storage, credential, maintenance, and stale-repository overhead |
| Built-in AC sleep setting | Caffeine-style permanent process | System policy survives terminal/client closure and allows display sleep |
| Direct ports/forwarding later | Caddy now | Named URLs do not validate the primary persistence risk |
| Opt-in runbook/doctor | Automatic host installer | Prevents shared dotfiles from silently turning every Mac into a server |

## Success Metric

The pilot succeeds when Mikey can start a useful personal Pi task on the personal Mac, leave the phone disconnected long enough for the task to progress, and return through Mosh to the unchanged Herdr session without any public network exposure.

---

*Spec approved for task breakdown.*
