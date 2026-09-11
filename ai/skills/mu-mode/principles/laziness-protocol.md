# Laziness Protocol

Borrow a future maintainer's fatigue. Achieve the result with the least code, indirection, and coordination cost.

- Look for safe deletion before adding code.
- Keep call paths flat. A boundary earns its place only when it hides meaningful complexity or isolates real change.
- Consolidate repeated decisions behind one source of truth.
- Prefer the smallest complete diff over elegant-looking boilerplate.
- Before threading a signal through multiple schemas or layers, look for a more direct ownership path.
- Remove small pass-throughs, representation leaks, and duplicated choices before they spread.

Do not turn simplicity into a line-count contest. Preserve safety, clarity, required compatibility, and proof. The test is whether the next maintainer can understand and change the result without carrying unnecessary machinery.
