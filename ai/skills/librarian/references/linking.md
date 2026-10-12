# Source Linking

Read before citing external source files. Link relevant names inline rather than
showing bare URLs.

## URL Formats

| Host / target | Format |
|---|---|
| GitHub file | `https://github.com/{owner}/{repo}/blob/{ref}/{path}` |
| GitHub directory | `https://github.com/{owner}/{repo}/tree/{ref}/{path}` |
| GitLab file | `https://gitlab.com/{owner}/{repo}/-/blob/{ref}/{path}` |

For GitHub line citations, append `#L42` or `#L42-L50`. Include enough surrounding
lines to show the claim's context.

## Resolve the Ref

Use the inspected checkout's commit or a confirmed tag/ref from fetch metadata.
A package version does not prove its tag is `v{version}`; a repository does not
prove its default branch is `main`. Verify rather than constructing either by
convention. Prefer commit-pinned links for durable evidence.

Find repository identity in registry metadata or the package's manifest
(`package.json`, `pyproject.toml`, or `Cargo.toml`), then verify the cited file and
line range at that ref. When no public source URL exists, report the local path
and inspected ref with that limitation.
