# Mu Stack defaults

These are defaults for new or deliberately modernized JavaScript/TypeScript projects. Apply only the rows that fit the project shape.

## Baseline

| Concern | Preferred choice | Apply when | Boundary |
|---|---|---|---|
| Tool versions | mise | Every new JS/TS repository | Record Node and pnpm locally; honor existing mise files |
| Package manager | pnpm | Every new or unmarked repository | Existing repositories keep their declared manager and lockfile |
| Language | TypeScript | Application and library code | Keep configuration strict; validate external data at boundaries |
| Unified web toolchain | Vite+ | Vite-compatible apps, libraries, and workspaces | Use only the capabilities the project needs |
| Local web routing | Portless | Projects that run a local HTTP service | Keep package scripts portable; run them through Portless rather than baking a machine port into the app |
| Lint and format | Oxlint and Oxfmt | New JS/TS projects | Prefer Vite+'s integrated `vp lint`, `vp fmt`, and `vp check` when Vite+ is present |
| Agent-oriented lint | anti-slop | Projects where the user explicitly wants it or generated-code failure patterns justify it | Introduce deliberately, fix real findings, and preserve upstream license/provenance when vendored |
| Complexity | Oxlint `complexity` | Code with branching behavior | Set a low new-project ceiling or ratchet from observed code; do not copy one universal threshold |
| React styling | StyleX | New React interfaces | Read [stylex.md](stylex.md) |
| Effect system | Effect | Service, workflow, integration, or agent code that meets the rubric | Read [effect.md](effect.md) |

## Project-shape defaults

### React web interface

Use pnpm, TypeScript, Vite+, Portless, Oxc, and StyleX. Add Effect only when the application contains a substantial service or workflow core; component code alone does not justify it.

### Cloudflare full-stack app or Worker

Use pnpm, TypeScript, Vite+ when the framework supports it, Portless for local routing, and Oxc. Evaluate Effect early for typed failures, services, concurrency, retries, streaming, resource lifecycles, or AI workflows. Verify Worker lifecycle behavior such as request-scoped dependencies, cancellation, and background work rather than assuming a Node runtime.

### Library

Use pnpm and TypeScript. Evaluate Vite+ pack against the library's actual output, declaration, compatibility, and test requirements. Portless and StyleX are normally not applicable. Effect in a public API is a consequential consumer-facing choice and needs explicit justification.

### CLI or automation

Use pnpm, TypeScript, mise, and Oxc. Use Vite+ only when its run, test, or pack capabilities reduce the total toolchain. Portless and StyleX are not applicable. Effect may fit long-running, concurrent, resource-sensitive, or integration-heavy commands; plain TypeScript is preferable for small scripts.

### Existing repository

Keep its package manager, lockfile, framework, and working commands. Audit before proposing changes. Migrate one concern at a time unless the existing tools are inseparable, and leave the repository working after each slice.

## Minimal scripts

When Vite+ owns the project, prefer a small command surface:

```json
{
  "scripts": {
    "dev": "vp dev",
    "build": "vp build",
    "lint": "vp lint",
    "lint:fix": "vp lint --fix",
    "format": "vp fmt",
    "format:check": "vp fmt --check",
    "typecheck": "vp check --no-fmt --no-lint",
    "check": "vp check"
  }
}
```

The `typecheck` script requires both `lint.options.typeAware` and `lint.options.typeCheck` in Vite+ configuration. Verify that it reports a real type error before trusting it; otherwise retain `tsc --noEmit` or the framework's typecheck command. Adapt all commands to the project. Do not preserve duplicate ESLint, Prettier, Biome, or raw Vite paths after Vite+/Oxc fully owns the same responsibility.

## Portless convention

Keep `dev` as the repository's normal server command when possible. Start it with bare `portless` or `portless run` so the name is inferred from project metadata and the package script remains usable without Portless. Add `portless.json` only for names, monorepo mappings, or behavior that inference cannot represent.

## Quality-gate order

1. Make format, lint, typecheck, and build pass with the base toolchain.
2. Add anti-slop only when selected for the project, and fix violations rather than disabling rules reflexively.
3. Measure current complexity before choosing a ceiling in existing code.
4. Add test or deployment gates only when the project has a real path to exercise.
5. Keep optional tools such as hook managers or preset collections out until they remove demonstrated friction.

## Sources to verify when implementing

- [Vite+ documentation](https://viteplus.dev/)
- [Portless documentation](https://portless.sh/)
- [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) and [Oxfmt](https://oxc.rs/docs/guide/usage/formatter.html)
- [anti-slop](https://github.com/dmmulroy/anti-slop)
