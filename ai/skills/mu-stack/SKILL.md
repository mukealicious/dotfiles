---
name: mu-stack
description: Shape, scaffold, or substantially modernize a JavaScript/TypeScript project using Mikey's preferred stack. Use when starting a repo, choosing repo-wide JS/TS tooling, or deciding whether to adopt StyleX or Effect/EffectTS. Do not use for routine .ts/.tsx edits or ordinary module refactors.
---

# Mu Stack

Use this skill for project-level decisions, not as an always-on TypeScript style guide. Existing repository guidance and declared tooling win until the user deliberately chooses a migration.

## Routes

| Request | Action | References |
|---|---|---|
| Start or scaffold a project | Establish the smallest applicable baseline | [defaults.md](references/defaults.md) |
| Choose styling for a React project | Prefer StyleX and verify framework support | [stylex.md](references/stylex.md) |
| Decide on Effect / EffectTS | Compare Effect with a plain-TypeScript baseline | [effect.md](references/effect.md) |
| Modernize an existing project | Audit first; propose one reversible migration slice | Relevant reference only |
| Routine feature or bug work | Do not apply Mu Stack unless a repo-wide decision is actually required | None |

Do not load every reference automatically. Read only the files selected by the route.

## Workflow

1. **Classify the project.** Name its shape: web UI, full-stack web app, Worker/service, library, CLI, automation, or monorepo.
2. **Inspect before prescribing.** Read the nearest `AGENTS.md`, manifest, lockfile, mise config, TypeScript config, framework config, scripts, and relevant architecture records. Check worktree changes before editing.
3. **Name constraints.** Identify runtime and deployment target, team or solo use, compatibility requirements, expected I/O and concurrency, and whether the repository is new or established.
4. **Make route decisions explicit.** For each component relevant to the active route, mark `adopt`, `keep existing`, `defer`, or `not applicable`. Consider the full inventory only for scaffolding or an explicit stack audit.
5. **Prefer the smallest coherent stack.** Do not add a tool merely because it appears in Mu Stack. Avoid overlapping package managers, formatters, linters, styling systems, or effect abstractions.
6. **Implement a thin slice.** Establish one working dev/build/check path before adding optional rules, adapters, or templates.
7. **Prove the real path.** Run the smallest relevant format, lint, typecheck, test, build, and local-server checks. For web services, verify the named Portless URL when Portless is part of the decision.
8. **Record durable decisions locally.** Put project-specific commands and constraints in repo-local guidance. Use an ADR only for a consequential choice that is surprising, hard to reverse, or the result of a real tradeoff.

## Decision Boundaries

- **Mu Stack owns:** project-level JS/TS toolchain selection plus the StyleX and Effect adoption decisions. It consumes the base mise/pnpm ownership policy rather than replacing it.
- **Repository guidance owns:** an established project's actual commands, versions, conventions, and migration constraints.
- **codebase-design owns:** module interfaces, seams, and structural architecture beyond the stack choice.
- **domain-modeling owns:** domain terminology, `CONTEXT.md`, and qualifying ADRs.
- **impeccable owns:** product UI and visual design; Mu Stack only chooses the styling mechanism.
- **flares owns:** quick context-derived mini-apps and dashboards. Use Mu Stack only when the user asks for an independent repository or explicit stack design.

## Guardrails

- Never bulk-migrate existing repositories.
- Never introduce a competing lockfile or package manager.
- Keep mise and pnpm as runtime/package-manager owners; use Vite+ for its toolchain rather than handing it overlapping environment ownership unless the user explicitly chooses otherwise.
- Do not install Effect merely because a project uses TypeScript or Cloudflare.
- Do not introduce StyleX outside a compatible UI stack or alongside another component styling system without a migration plan.
- Prefer current stable releases. Check release notes and peer requirements before adopting prerelease or newly released major versions.
- Pin or lock tool versions using the repository's existing policy; do not hardcode transient versions in this skill.
- Convert repeated policy into config, lint, scripts, or types rather than relying on prose alone.

## Deliverable

For planning, return a compact decision table and the first verifiable slice. For implementation, report changed files, commands run, the working dev URL when applicable, and anything deliberately deferred.
