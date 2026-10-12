# Project defaults

Local preferences for new projects or explicitly approved modernization, not a migration mandate. Existing repositories retain their declared tools, lockfile, architecture, and styling system. Shared safety and toolchain instructions still apply.

| Concern | Preference |
|---|---|
| Language | TypeScript for JavaScript applications and libraries |
| Tool versions and packages | mise; pnpm for new or unmarked JS/TS repositories |
| React interfaces | React + StyleX where the build pipeline supports it |
| Web toolchain | Vite+ with Oxc lint/format tooling when compatible |
| Local HTTP routing | Portless where useful; keep the underlying dev command portable |
| Services and cloud | Effect, Alchemy, and Cloudflare where they fit the application's actual needs |

These choices do not justify a framework migration, a new abstraction, or adding service infrastructure to a small script. Verify current APIs and repository support before setup. Deployments, publishing, paid infrastructure, and consequential migrations need their own authorization.
