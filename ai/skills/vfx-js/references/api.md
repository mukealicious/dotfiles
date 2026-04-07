# vfx-js API Reference

## `@vfx-js/core`

### Constructor

```javascript
import { VFX } from "@vfx-js/core";
const vfx = new VFX(opts);
```

```typescript
type VFXOpts = {
  pixelRatio?: number;       // default: devicePixelRatio
  zIndex?: number;           // canvas z-index (default: 9999)
  autoplay?: boolean;        // start render loop immediately (default: true)
  scrollPadding?: number | [number, number] | false;
    // fraction of viewport to pre-render outside view
    // default: [0.1, 0.1] — 10% above and below
    // false: fixed canvas, no scroll tracking (fullscreen effects)
  postEffect?: VFXPostEffect | VFXPass[];  // global post-processing
};
```

### Methods

| Method | Signature | Notes |
|--------|-----------|-------|
| `add` | `async add(el: HTMLElement, opts: VFXProps): Promise<void>` | Registers element. Waits for img load / video readyState |
| `remove` | `remove(el: HTMLElement): void` | Deregisters, restores original opacity |
| `update` | `async update(el: HTMLElement): Promise<void>` | Re-captures DOM texture (for canvas/dynamic content) |
| `play` | `play(): void` | Starts render loop |
| `stop` | `stop(): void` | Pauses render loop |
| `render` | `render(): void` | Single manual frame (use with `autoplay: false`) |
| `destroy` | `destroy(): void` | Removes canvas, cleans up Three.js resources |

### VFXProps

Options passed to `vfx.add(element, props)`:

```typescript
type VFXProps = {
  shader?: ShaderPreset | string | VFXPass[];
    // preset name, raw GLSL string, or multipass pipeline
  uniforms?: Record<string, number | number[] | (() => number | number[])>;
    // custom uniforms — static values or per-frame functions
  overflow?: true | number | [top, right, bottom, left] | { top?, right?, bottom?, left? };
    // extend rendering beyond element bounds (px). true = unlimited
  overlay?: true | number;
    // true: keep original visible (opacity 1). number: specific opacity
  release?: number;
    // seconds to keep rendering after leaving viewport (default: Infinity)
  wrap?: "clamp" | "repeat" | "mirror" | ["clamp"|"repeat"|"mirror", "clamp"|"repeat"|"mirror"];
  zIndex?: number;          // per-element z-index within shared canvas
  glslVersion?: "100" | "300 es";  // auto-detected if omitted
  backbuffer?: boolean;     // enable previous-frame feedback texture
  autoCrop?: boolean;       // clip at element boundary (default: true)
  intersection?: {
    threshold?: number;     // 0-1 visibility ratio to trigger enter
    rootMargin?: number | [top, right, bottom, left];
  };
};
```

### VFXPass (Multipass)

```typescript
type VFXPass = {
  frag: string;             // fragment shader GLSL (required)
  vert?: string;            // custom vertex shader (optional)
  target?: string;          // named render target — omit for screen output
  persistent?: boolean;     // retain buffer across frames (feedback effects)
  float?: boolean;          // 32-bit float render target (HDR/simulation)
  size?: [number, number];  // fixed pixel size (decouples from element size)
  uniforms?: VFXUniforms;   // per-pass custom uniforms
};
```

**Auto-binding**: vfx-js scans `frag` source for `uniform sampler2D <name>`. If `<name>` matches a `target` from a prior pass, it binds automatically.

### VFXPostEffect (Global)

Applied to entire canvas output, not individual elements.

```javascript
// Single shader
const vfx = new VFX({ postEffect: { shader: "vignette" } });

// Custom GLSL
const vfx = new VFX({ postEffect: { shader: grainGLSL, uniforms: { intensity: 0.3 } } });

// Multipass
const vfx = new VFX({ postEffect: [
  { frag: blurH, target: "blurH" },
  { frag: blurV },
] });
```

Post-effect uniforms: `src` (composited scene), `resolution`, `offset`, `viewport`, `time`, `mouse`, `passIndex`.

---

## `react-vfx`

### VFXProvider

Wrap your app. Creates the shared VFX canvas.

```tsx
import { VFXProvider } from "react-vfx";
<VFXProvider pixelRatio={1} postEffect={{ shader: "vignette" }}>
  {children}
</VFXProvider>
```

Props: `pixelRatio`, `zIndex`, `postEffect` (same as VFXOpts).

**Note**: Changing `pixelRatio` or `postEffect` triggers full VFX destroy+recreate.

### VFX Elements

| Component | Replaces | Notes |
|-----------|----------|-------|
| `VFXImg` | `<img>` | Handles load timing |
| `VFXVideo` | `<video>` | Handles readyState timing |
| `VFXSpan` | `<span>` | Text nodes only — no child HTML elements |
| `VFXDiv` | `<div>` | MutationObserver for content changes |
| `VFXP` | `<p>` | Same as VFXDiv |

All accept standard HTML props plus: `shader`, `release`, `uniforms`, `overflow`, `wrap`.

**Limitation**: `overlay`, `intersection`, `zIndex`, `glslVersion`, `backbuffer`, `autoCrop` are NOT forwarded by React components. Use vanilla `vfx.add()` via ref for full prop access.

### useVFX Hook

```tsx
const { rerenderElement } = useVFX();
// Force texture re-capture after DOM changes MutationObserver misses
rerenderElement(ref.current);
```

---

## Element Type Support

| Element | Texture source | Auto-update |
|---------|---------------|-------------|
| `<img>` (static) | THREE.TextureLoader | No |
| `<img>` (GIF) | gifuct-js frame decoder | Yes (per-frame) |
| `<video>` | THREE.VideoTexture | Yes (continuous) |
| `<canvas>` | THREE.CanvasTexture | Manual: `vfx.update(el)` |
| Any HTMLElement | SVG foreignObject -> OffscreenCanvas | MutationObserver |

## GLSL Version

Auto-detected from shader source:
- `out vec4` in source -> GLSL 300 es (`texture()`, `out vec4 outColor`)
- `gl_FragColor` in source -> GLSL 100 (`texture2D()`, `gl_FragColor`)

Override: `glslVersion: "100"` or `glslVersion: "300 es"` in VFXProps.
