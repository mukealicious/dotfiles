# Creative Coding Recipes

Advanced patterns for vfx-js beyond simple presets.

## Custom GLSL Shader

Minimal custom shader (GLSL 300 es):

```glsl
precision highp float;
uniform sampler2D src;
uniform vec2 resolution;
uniform vec2 offset;
uniform float time;
uniform vec2 mouse;
out vec4 outColor;

void main() {
  vec2 uv = (gl_FragCoord.xy - offset) / resolution;
  vec2 m = (mouse - offset) / resolution;  // normalized mouse
  float d = distance(uv, m);
  float wave = sin(d * 40.0 - time * 6.0) * 0.02 / (d * 10.0 + 1.0);
  outColor = texture(src, uv + vec2(wave));
}
```

```javascript
vfx.add(el, { shader: rippleGLSL, overflow: 20 });
```

## Feedback / Motion Trail

Use `backbuffer` for single-pass feedback, or `persistent` targets for multipass:

```javascript
// Single-pass backbuffer
vfx.add(video, {
  backbuffer: true,
  shader: `
    precision highp float;
    uniform sampler2D src, backbuffer;
    uniform vec2 resolution, offset;
    out vec4 outColor;
    void main() {
      vec2 uv = (gl_FragCoord.xy - offset) / resolution;
      outColor = mix(texture(src, uv), texture(backbuffer, uv), 0.85);
    }`,
});
```

```javascript
// Multipass persistent target
vfx.add(video, { shader: [
  { frag: trailShader, target: "trail", persistent: true },
  { frag: renderShader },  // reads uniform sampler2D trail
]});
```

## Multipass Blur + Bloom

```javascript
vfx.add(el, { shader: [
  { frag: `
    precision highp float;
    uniform sampler2D src;
    uniform vec2 resolution, offset;
    out vec4 outColor;
    void main() {
      vec2 uv = (gl_FragCoord.xy - offset) / resolution;
      vec2 t = 4.0 / resolution;
      vec4 c = texture(src, uv) * 0.4;
      c += texture(src, uv + vec2(t.x, 0)) * 0.15;
      c += texture(src, uv - vec2(t.x, 0)) * 0.15;
      c += texture(src, uv + vec2(0, t.y)) * 0.15;
      c += texture(src, uv - vec2(0, t.y)) * 0.15;
      outColor = c;
    }`, target: "blur" },
  { frag: `
    precision highp float;
    uniform sampler2D src, blur;
    uniform vec2 resolution, offset;
    out vec4 outColor;
    void main() {
      vec2 uv = (gl_FragCoord.xy - offset) / resolution;
      outColor = texture(src, uv) + texture(blur, uv) * 0.6;
    }` },
]});
```

## Fluid Simulation

Full Navier-Stokes on GPU using vfx-js multipass. Pattern from library author's demo:

```javascript
const SIM = 256;
const aspect = innerWidth / innerHeight;
const simSize = aspect > 1
  ? [Math.round(SIM * aspect), SIM]
  : [SIM, Math.round(SIM / aspect)];

// Track mouse delta (smoothed)
let pos = [-1, -1], delta = [0, 0];
addEventListener("mousemove", (e) => {
  const x = e.clientX, y = innerHeight - e.clientY;
  if (pos[0] >= 0) delta = [x - pos[0], y - pos[1]];
  pos = [x, y];
});

const passes = [
  { frag: copyShader, target: "canvas" },
  { frag: curlShader, target: "curl", float: true, size: simSize },
  { frag: vorticityShader, target: "vort_vel", float: true, size: simSize,
    uniforms: {
      mouseDelta: () => { delta = [delta[0]*0.9, delta[1]*0.9]; return delta; },
      curlStrength: 20, splatForce: 3000, splatRadius: 0.002,
    }},
  { frag: divergenceShader, target: "divergence", float: true, size: simSize },
  // Pressure solver: N Jacobi iterations ping-ponging between p_a and p_b
  { frag: pressureInitShader, target: "p_a", float: true, size: simSize },
  ...Array.from({ length: 12 }, (_, i) => ({
    frag: pressureShader,
    target: i % 2 === 0 ? "p_b" : "p_a",
    float: true, size: simSize,
  })),
  { frag: gradientShader, target: "proj_vel", float: true, size: simSize },
  { frag: advectShader, target: "velocity", persistent: true, float: true, size: simSize,
    uniforms: { velocityDissipation: 1 }},
  { frag: displayShader, uniforms: { simSize } },
];

const vfx = new VFX({ postEffect: passes });
await vfx.add(app, { shader: "none" });
```

Key patterns: `float: true` for simulation precision, `size: simSize` decouples sim from display, `persistent: true` on velocity for accumulation, dynamic uniforms via functions, `shader: "none"` on element when all work is in `postEffect`.

## p5.js / Canvas Integration

```javascript
const vfx = new VFX();
const p5canvas = document.querySelector("#p5-canvas");
await vfx.add(p5canvas, { shader: "rgbShift", overflow: 50 });

// In p5 draw loop — refresh texture each frame:
p5.draw = () => {
  // ... p5 drawing ...
  vfx.update(p5canvas);
};
```

## Audio-Reactive

```javascript
const analyser = audioCtx.createAnalyser();
const data = new Float32Array(analyser.frequencyBinCount);

vfx.add(el, {
  shader: customShader,
  uniforms: {
    amplitude: () => {
      analyser.getFloatTimeDomainData(data);
      return Math.max(...data.map(Math.abs));
    },
    bass: () => {
      analyser.getByteFrequencyData(data);
      return data.slice(0, 4).reduce((a, b) => a + b) / (4 * 255);
    },
  },
});
```

## Manual Render Loop

Sync with your own animation system:

```javascript
const vfx = new VFX({ autoplay: false });
await vfx.add(el, { shader: "chromatic" });
(function loop() { vfx.render(); requestAnimationFrame(loop); })();
```

## Global Post-Effect (Film Grain + Vignette)

```javascript
const vfx = new VFX({ postEffect: { shader: `
  precision highp float;
  uniform sampler2D src;
  uniform vec2 resolution, offset;
  uniform float time;
  out vec4 outColor;
  void main() {
    vec2 uv = (gl_FragCoord.xy - offset) / resolution;
    vec4 c = texture(src, uv);
    float grain = fract(sin(dot(uv * time, vec2(12.9898, 78.233))) * 43758.5453);
    c.rgb += (grain - 0.5) * 0.08;
    c.rgb *= 1.0 - dot(uv - 0.5, uv - 0.5) * 1.2;
    outColor = c;
  }` }});
```
