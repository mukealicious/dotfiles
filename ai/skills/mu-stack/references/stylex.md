# StyleX in Mu Stack

StyleX is the preferred component styling system for new React projects. It is not a reason to migrate an established interface that already has a coherent styling system.

## Adopt when

- The project uses React and controls its build pipeline.
- Typed, co-located styles and static extraction are valuable.
- Themes and design tokens should be represented as explicit variables rather than class-string conventions.
- The team accepts StyleX's compile-time restrictions in exchange for predictable atomic output.

## Keep another approach when

- The repository already has a healthy design system built on Tailwind, CSS Modules, vanilla CSS, or another owner.
- A framework, component kit, or delivery environment assumes another styling mechanism.
- The project is a small static artifact where a StyleX compiler adds more machinery than value.
- Required dynamic styles cannot be expressed cleanly through StyleX variables, variants, or supported runtime values.

Do not run StyleX and Tailwind as coequal defaults. During an approved migration, define which system owns new code and how old code is retired.

## Vite and React setup

Use the official `@stylexjs/unplugin` integration. Place the StyleX plugin before the React plugin so Fast Refresh continues to work.

```ts
import stylex from '@stylexjs/unplugin';
import react from '@vitejs/plugin-react';

export default {
  plugins: [
    stylex.vite({ useCSSLayers: true }),
    ...react(),
  ],
};
```

Adapt plugin array shape to the current Vite/Vite+ and React plugin APIs. Import a root CSS entrypoint so Vite emits a CSS asset; StyleX appends its extracted output to that asset.

## Coding conventions

- Use `stylex.create` for static styles and named variants.
- Use `stylex.defineVars` and `stylex.createTheme` for tokens and themes.
- Prefer semantic style names that describe component roles or states.
- Keep reusable visual primitives near the component or design-system module that owns them.
- Represent finite visual states as explicit variants rather than constructing property bags dynamically.
- Use CSS custom properties or StyleX-supported dynamic values at genuine runtime boundaries.
- Do not recreate utility-class strings inside StyleX objects.

## Verification

- Run the normal Mu Stack checks and production build.
- Verify Fast Refresh in development.
- Inspect emitted CSS at least once to confirm extraction.
- Exercise themes, responsive behavior, focus states, and server rendering when applicable.
- Use the `impeccable` skill for interface quality; StyleX only supplies the styling mechanism.

## Sources

- [StyleX documentation](https://stylexjs.com/)
- [Official Vite integration](https://stylexjs.com/docs/learn/installation/vite/vite-react)
- [StyleX API](https://stylexjs.com/docs/api)
