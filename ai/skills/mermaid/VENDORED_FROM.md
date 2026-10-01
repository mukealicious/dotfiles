# Preserved upstream snapshot

- Source: https://github.com/mitsuhiko/agent-stuff
- Revision: `b7c45d67c634d361d67340789a02f64ffb9e16f1` (npm `mitsupi@1.6.0` gitHead)
- Paths: `skills/mermaid/SKILL.md`, `skills/mermaid/tools/validate.sh`
- License: upstream Apache-2.0, included as `LICENSE`.

Both source files are unchanged. Upstream later deleted this skill at
`f1c881db21a9ec53977ff8379b74e64e290fef93`. Keep the previously selected Mermaid
capability as a portable frozen snapshot rather than patching it back into the
new Mitsupi package. It is not a maintained current-upstream skill.

The validator retains upstream's on-demand npx downloads; adopting this snapshot
does not install or run Mermaid/Chromium. Retirement or a replacement is a separate
capability decision, not an automatic consequence of upgrading Mitsupi.
