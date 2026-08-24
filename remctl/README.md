# RemCTL

Installs [viticci/remctl](https://github.com/viticci/remctl) as the shared Apple Reminders CLI for local agents.

## Ownership

- `version.env` pins the reviewed release and commit.
- `install.sh` keeps an installer-managed checkout at `~/.local/share/remctl/source`, copies the CLI/helpers to `~/.local/bin`, and pins the CLI shebang to a uv-managed Python 3.10+ runtime so GUI helpers do not fall back to Xcode's Python 3.9.
- `ai/skills/apple-reminders/` owns agent usage and safety guidance.
- macOS privacy grants remain interactive and are never changed by `dot`.

## Setup

```bash
./remctl/install.sh
remctl onboard
remctl permissions full-disk-access
remctl doctor --for-agent --json
```

Full Disk Access and Reminders/EventKit authorization are scoped to the host process. Run the final doctor command from every agent environment that will use RemCTL; a passing Terminal check does not authorize a separate app or runner.

## Updating

Update `REMCTL_VERSION`, `REMCTL_REF`, and `REMCTL_COMMIT` together in `version.env`, review the upstream skill and changelog, then run `./remctl/install.sh` to copy and rebuild the pinned release.
