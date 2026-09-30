# RemCTL

Installs the reviewed, notarized [RemCTL](https://github.com/viticci/remctl) Apple silicon distribution for CLI-based Apple Reminders workflows. MCP, plugins, and Tailscale are not registered.

## Ownership

- `version.env` pins the release and DMG SHA-256, with source provenance.
- `install.sh` verifies the checksum, MacStories Developer ID signature, Gatekeeper acceptance, and distribution version before invoking the installer embedded in the signed app.
- Upstream owns transactional installation, the ownership manifest, protected Python under `/Library/RemCTL`, and the LaunchAgent.
- The CLI stays at `~/.local/bin/remctl`; the app lives at `~/Applications/RemCTL Capability Host.app`. The socket uses the standard `~/Library/Application Support/RemCTL/` location.
- Dotfiles never rewrites the CLI shebang or re-signs the app.
- `ai/skills/apple-reminders/` owns CLI-first usage and safety guidance.
- The old `~/.local/share/remctl/source` checkout is no longer used; it is left untouched.
- Verified downloads are cached under `~/Library/Caches/remctl/<release>/`.

## First migration from 1.7.1

Run in an interactive terminal:

```sh
~/.dotfiles/remctl/install.sh
remctl onboard --no-mcp
remctl doctor --for-agent --json
```

The upstream installer may request your administrator password for its protected Python. Our 1.7.1 installer changed the CLI shebang to a uv runtime, so upstream does not recognize it as an exact stock install. It lists the old managed files and asks before moving them to the Trash. Review that list; approve only known RemCTL files. Settings in `~/.config/remctl` and your Apple Reminders data stay in place. Do not use adoption flags to bypass unrecognized files.

The new Capability Host needs Reminders, Automation, and Full Disk Access once. Grant only the app shown by onboarding, not Terminal or the agent. After granting Full Disk Access:

```sh
launchctl kickstart -k "gui/$(id -u)/net.macstories.remctl.capability-host"
remctl doctor --for-agent --json
```

Check `access.effective`: `route: "capabilityHost"` and `ready: true`. A blocked `access.direct` is normal. Onboarding uses `--no-mcp` to skip AI-client and remote endpoint setup.

## Updates

`dot` runs this topic installer. It keeps the reviewed pin, not GitHub's latest release. To adopt another version, update the version, tag, digest, and source provenance in `version.env`, review upstream installation changes and the skill, then run the topic installer. Updates requiring installation run interactively; already-current installs are a no-op even in automation.

`--force` requests reinstallation but does not bypass upstream ownership or signature checks. `--dry-run` downloads and verifies the release and runs upstream preflight without installing, requesting sudo, or starting the host:

```sh
~/.dotfiles/remctl/install.sh --dry-run
```

Keep the same signing route and path overrides. Do not independently use the DMG launcher (which defaults to `~/bin`), add `--migrate-signing`, or install a competing source build.

Intel Macs are explicitly unsupported by this wrapper until a source-build route is separately reviewed.

## Validation

```sh
sh remctl/test-install.sh
shellcheck -x -P SCRIPTDIR remctl/install.sh remctl/test-install.sh
```
