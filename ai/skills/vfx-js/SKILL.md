---
name: vfx-js
description: "Apply WebGL post-processing effects to DOM elements using vfx-js (@vfx-js/core, react-vfx). Use when adding shader effects to images, video, text, or canvas elements — glitch, chromatic aberration, halftone, custom GLSL, multipass pipelines, fluid simulations, scroll-triggered transitions, or feedback/trail effects on HTML content."
---

# vfx-js

WebGL post-processing for DOM elements. Captures any HTML element as a texture, renders it through GLSL fragment shaders on a shared canvas overlay. Two packages: `@vfx-js/core` (vanilla JS) and `react-vfx` (React wrapper). Depends on Three.js at runtime.

```bash
npm i @vfx-js/core        # Vanilla JS
npm i react-vfx           # React
```

## When to Use vfx-js vs Alternatives

| Situation | Use |
|-----------|-----|
| Shader effect on img/video/text with scroll trigger | vfx-js |
| React component tree with VFX elements | react-vfx |
| Effect achievable with `filter: blur/hue-rotate/invert` | CSS filters (free, no JS) |
| Smallest bundle, vanilla JS, WebGL1 | Aladino (~5kb) |
| Image-to-image hover distortion | hover-effect (Three.js + GSAP) |
| Post-processing a full 3D Three.js scene | pmndrs/postprocessing |
| Custom canvas/p5.js sketch as live VFX source | vfx-js — pass canvas to `vfx.add()` |

## Quick Start

### Vanilla JS

```javascript
import { VFX } from "@vfx-js/core";
const vfx = new VFX();
await vfx.add(document.querySelector("img"), {
  shader: "rgbShift",
  overflow: 80,
});
```

### React

```tsx
import { VFXProvider, VFXImg, VFXSpan } from "react-vfx";
<VFXProvider>
  <VFXImg src="hero.jpg" shader="glitch" overflow={100} />
  <VFXSpan shader="rainbow">Glowing text</VFXSpan>
</VFXProvider>
```

## Key Concepts

### Auto-Injected Uniforms

Every shader receives these automatically — no declaration needed in `uniforms`:

| Uniform | Type | Description |
|---------|------|-------------|
| `src` | `sampler2D` | Element texture |
| `resolution` | `vec2` | Element size in physical pixels |
| `offset` | `vec2` | Canvas-space position (bottom-left origin) |
| `time` | `float` | Seconds since VFX instantiation |
| `enterTime` | `float` | Seconds since entering viewport (-1 if never) |
| `leaveTime` | `float` | Seconds since leaving viewport (-1 if still in) |
| `mouse` | `vec2` | Mouse position in physical pixels |
| `intersection` | `float` | Viewport overlap ratio 0-1 |
| `backbuffer` | `sampler2D` | Previous frame (when `backbuffer: true`) |

**Canonical UV calculation**: `vec2 uv = (gl_FragCoord.xy - offset) / resolution;`

### Overflow is Essential

Distortion effects (glitch, rgbShift, chromatic) move pixels outside element bounds. Without `overflow`, displacement clips at element edges. Always set `overflow: 50`-`100` for distortion shaders.

### Multipass Pipelines

Pass an array of `VFXPass` objects. Named `target` buffers auto-bind as `sampler2D` uniforms in subsequent passes. Last pass (no `target`) renders to screen.

```javascript
vfx.add(el, { shader: [
  { frag: blurGLSL, target: "blur" },
  { frag: compositeGLSL },  // reads `uniform sampler2D blur;` automatically
]});
```

Key `VFXPass` fields: `target` (named buffer), `persistent` (retain across frames), `float` (32-bit precision), `size` (custom resolution).

### Custom Uniforms

Static values or per-frame functions. Functions are called every frame — keep them cheap.

```javascript
uniforms: {
  speed: 1.5,                                    // static float
  color: [1, 0, 0, 1],                           // static vec4
  scroll: () => window.scrollY / innerHeight,     // dynamic per-frame
}
```

## Critical Gotchas

1. **Web fonts broken in VFXSpan** — SVG foreignObject can't load external fonts. Use system fonts only, or render custom fonts to a canvas first.
2. **React wrappers don't forward all props** — `VFXImg`/`VFXVideo` skip `overlay`, `intersection`, `backbuffer`, `autoCrop`, `glslVersion`. Use vanilla `vfx.add()` for full control.
3. **Browser-only** — throws if `window`/`document` undefined. No SSR. Requires WebGL2.
4. **Single shared canvas** at `z-index: 9999`, `pointer-events: none`. Original element hidden (opacity 0). Use `overlay` prop to keep original visible.
5. **GIF detection is URL-based** — only `.gif` in the URL triggers GIF mode. Data URIs of GIFs won't animate.
6. **Mouse coordinates are screen pixels** — convert in shader: `vec2 m = (mouse - offset) / resolution;`
7. **Canvas elements need manual refresh** — call `vfx.update(el)` after drawing. In React, use `rerenderElement()` from `useVFX()`.

## 23 Built-in Shader Presets

See [shaders.md](./references/shaders.md) for the full catalog with parameters and usage.

**Categories**: Color (rainbow, duotone, tritone, hueShift, invert, grayscale), Distortion (glitch, rgbGlitch, rgbShift, sinewave, chromatic), Stylize (halftone, pixelate, shine, vignette), Animation (blink, spring), Transition (warpTransition, slitScanTransition, pixelateTransition, focusTransition), Utility (none, uvGradient).

## References

| File | When to read |
|------|-------------|
| [api.md](./references/api.md) | Full API for core + React: constructor, add/remove, VFXProps, VFXPass, postEffect |
| [shaders.md](./references/shaders.md) | Built-in shader catalog with uniforms and usage examples |
| [recipes.md](./references/recipes.md) | Creative coding patterns: multipass pipelines, fluid sim, feedback trails, audio-reactive, p5.js integration |
