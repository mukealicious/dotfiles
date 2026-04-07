# Built-in Shader Presets

23 presets available as `shader: "presetName"`. All use auto-injected uniforms (see SKILL.md).

## Color

| Preset | Effect | Custom Uniforms |
|--------|--------|-----------------|
| `rainbow` | Diagonal hue sweep via HSV, time-animated | — |
| `duotone` | Two-color gradient mapped to luminance | `color1` vec4, `color2` vec4, `speed` float |
| `tritone` | Three-color cycling by brightness + time | — |
| `hueShift` | Uniform hue rotation on all pixels | `shift` float (0-1 = full cycle) |
| `invert` | RGB inversion, preserves alpha | — |
| `grayscale` | Weighted luminance desaturation | — |

### duotone example

```javascript
vfx.add(img, {
  shader: "duotone",
  uniforms: { color1: [0, 0, 1, 1], color2: [0, 1, 0, 1], speed: 0.5 },
});
```

## Distortion

| Preset | Effect | Notes |
|--------|--------|-------|
| `glitch` | Horizontal row shifting + chromatic aberration | Needs `overflow: 100` |
| `rgbGlitch` | Random per-channel block offsets, probabilistic | More digital/blocky than glitch |
| `rgbShift` | Smooth sine-wave RGB channel separation | Needs `overflow: [0, 100, 0, 100]` |
| `sinewave` | Per-channel sine distortion, rippling effect | Needs `overflow: 30` |
| `chromatic` | Radial chromatic aberration from center | `intensity`, `radius`, `power` |

### glitch example

```tsx
<VFXImg src="photo.jpg" shader="glitch" overflow={100} />
```

## Stylize

| Preset | Effect | Notes |
|--------|--------|-------|
| `halftone` | CMYK-style rotated dot pattern per RGB channel | Resolution-dependent dot size |
| `pixelate` | Animated block pixelation, size oscillates | — |
| `shine` | Rotating radial gradient overlay | Polar-coordinate sweep |
| `vignette` | Edge darkening toward center | `power`, `radius` |

### halftone example

```tsx
<VFXVideo src="clip.mp4" shader="halftone" autoPlay loop muted />
```

## Animation

| Preset | Effect | Notes |
|--------|--------|-------|
| `blink` | Sinusoidal opacity pulsing | — |
| `spring` | Elastic bounce zoom on enter | Uses `enterTime` for damping |

## Transition

Driven by `enterTime`/`leaveTime` — animate on scroll enter/exit. Best with `intersection: { threshold: 1 }`.

| Preset | Effect |
|--------|--------|
| `slitScanTransition` | Vertical slit wipe, column-by-column reveal |
| `warpTransition` | Horizontal sine-wave distortion that settles on enter |
| `pixelateTransition` | Max pixelation -> sharp resolution on enter |
| `focusTransition` | Horizontal motion blur tied to `intersection` ratio |

### scroll-triggered reveal

```javascript
vfx.add(img, {
  shader: "warpTransition",
  overflow: 30,
  intersection: { threshold: 1 },
});
```

**focusTransition** is unique — it uses `intersection` (continuous 0-1) rather than `enterTime` (elapsed seconds), so the effect tracks scroll position directly.

## Utility

| Preset | Effect |
|--------|--------|
| `none` | Passthrough copy (respects `autoCrop`). Use for testing or post-effect-only setups |
| `uvGradient` | Renders UV coordinates as red/green gradient. Debugging tool |
