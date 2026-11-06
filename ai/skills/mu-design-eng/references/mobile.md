# Mobile web behavior

Read for phone-facing UI, PWAs, sheets, carousels, full-screen layouts, touch interaction, or a defect that appears only on a phone. This is web guidance, not React Native guidance. Use capabilities and project support targets rather than user-agent or screen-width guesses. Touch and mouse can coexist on one device.

Apply only fixes whose cause is present. Review-only tasks report findings; this reference does not authorize implementation, dependency changes, or server exposure. Use [verification.md](verification.md) for evidence and [motion/components.md](motion/components.md) for component lifecycle details.

## Symptom map

| Symptom | First check |
| --- | --- |
| Hover sticks after tap | Hover capability query |
| Gray/blue tap flash conflicts with designed feedback | Scoped tap highlight override plus visible press feedback |
| Bottom action hidden behind browser chrome | `dvh`/`svh` choice and actual visual viewport |
| Focusing an input zooms the page | Computed input font size, often below 16px on iOS |
| Tap feels late | Feedback on press, normal click activation, touch-action support |
| Pull-to-refresh or page bounce fights a sheet | Root/inner overscroll policy |
| Content under notch/home indicator | Edge-to-edge viewport plus safe-area padding |
| Long-press selects control labels | Scoped selection/callout policy |
| Carousel/page gesture conflict | Browser-owned versus custom-owned axes |
| Status bar does not match theme | Resolved theme-color and standalone configuration |
| Desktop emulation passes but phone fails | Real browser/device test, keyboard open, landscape |

## 1. Hover and hybrid input

```css
@media (hover: hover) and (pointer: fine) {
  .button:hover { background: var(--gray-3); transform: scale(1.02); }
}
```

These query the primary input's capabilities; they do not classify every stylus or hybrid device perfectly. A hover-capable pen can be fine. Verify hybrid behavior and consider `any-hover`/`any-pointer` only with a clear reason. Keep actions visible without hover and supply `:focus-visible` and press states independently.

Inspect framework output: Tailwind versions differ in hover compilation. Do not introduce a device-detection hook for behavior the media query already covers.

## 2. Tap highlight

```css
.tappable { -webkit-tap-highlight-color: transparent; }
```

Suppress the browser highlight only where equivalent press feedback exists. A global override can be appropriate for an app whose controls all have feedback; it is not an unconditional baseline. Do not remove the only visible sign of activation.

## 3. Viewport height

```css
.app { height: 100dvh; }
.hero { min-height: 100svh; }
```

`dvh` tracks dynamic browser chrome, useful for app shells and sheets. `svh` provides a stable small-viewport minimum for heroes, avoiding resize during scroll. Current mobile `vh` commonly behaves like the large viewport and can put bottom controls below visible chrome. Confirm browser support; use a `100vh` fallback above the newer declaration only where needed.

Dynamic units do not guarantee correct software-keyboard behavior across browsers. Check visual viewport, scrolling, focus, and bottom-pinned controls with the keyboard open. Prefer `min-height` instead of a hard height when content must grow. Test zoom and large text; a full-height shell must still let content scroll.

## 4. Input zoom and keyboard

```css
input, textarea, select { font-size: 16px; }
```

A computed 16px input font is a useful iOS auto-zoom prevention target, not a reason to reduce larger accessible text. `1rem` only equals 16px at that root size. A coarse-pointer rule can scope a desktop-specific exception, but inspect hybrid inputs. Never disable pinch zoom with `user-scalable=no` or `maximum-scale=1`.

Set input semantics deliberately:

- `inputmode="numeric"` for codes; `inputmode="decimal"` for decimal amounts.
- `type="email"` and `type="tel"` where appropriate; preserve validation requirements independently of keyboard layout.
- `autocapitalize="none"` and suitable autocorrection behavior for usernames/codes.
- `enterkeyhint="send"`, `"search"`, or `"done"` to match the action.

Keep numeric identifiers as strings when leading zeroes matter. Check autofill, password managers, keyboard dismissal, validation messages, and focused-field visibility.

## 5. Tap response

```css
button, a, [role="button"], .tappable { touch-action: manipulation; }
.button { transition: transform 100ms var(--ease-out), background-color 100ms; }
.button:active { transform: scale(0.97); background: var(--gray-4); }
```

Modern responsive pages often avoid the historical 300ms double-tap delay already. `touch-action: manipulation` can remove double-tap handling while allowing panning and pinch zoom; test the actual browser instead of diagnosing every late tap as this delay.

Show feedback on press (`:active` or pointer-down), but keep normal action activation on click/keyboard semantics so cancellation remains possible. Do not move form submission or destructive operations to pointer-down just to feel faster. Motion values come from [motion/standards.md](motion/standards.md), including reduced-motion handling.

## 6. Overscroll ownership

```css
/* Only for an app shell that intentionally owns root scrolling: */
html, body { overscroll-behavior: none; }
.sheet-content { overflow-y: auto; overscroll-behavior: contain; }
```

`contain` prevents scroll chaining while allowing the container's own overscroll behavior where supported. `none` can suppress boundary effects and navigation/refresh affordances; apply it only where that tradeoff is wanted. A scrolling document may benefit from pull-to-refresh. Check the actual scroll container and browser support.

Avoid broad `touchmove`/`preventDefault()` listeners for an overscroll problem. They can block intended scrolling and introduce main-thread work. A genuine custom gesture may need explicit handling; scope it and preserve other axes.

## 7. Safe areas

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

```css
.app-header { padding-top: env(safe-area-inset-top, 0px); }
.bottom-bar { padding-bottom: env(safe-area-inset-bottom, 0px); }
.sheet { padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px)); }
```

Edge-to-edge painting and content padding are separate decisions. `viewport-fit=cover` enables the intended edge-to-edge behavior in supporting browsers; actual inset values depend on browser, device, and display mode. Do not assume every environment reports nonzero values, or that every zero means a missing meta tag.

Check all four insets in landscape. Fixed headers, tab bars, toasts, and sheets need particular care. Avoid double-padding content already inside a padded shell. Ensure the backdrop/background reaches the edge while controls remain clear of system regions.

## 8. Selection and callouts

```css
button, [role="button"], .tab, .chip, .drag-handle {
  user-select: none;
  -webkit-user-select: none;
}
.custom-image-control { -webkit-touch-callout: none; }
```

Scope these to actual controls. Body text, error messages, addresses, order numbers, and ordinary links remain selectable. Keep useful browser link menus unless the element truly acts as a custom control. Never apply a body-wide selection ban for a native-like appearance.

## 9. Gesture axes and carousels

Touch-action values describe what the **browser** may handle:

```css
.custom-horizontal-carousel { touch-action: pan-y pinch-zoom; }
.vertical-sheet-handle { touch-action: pan-x pinch-zoom; }
.custom-two-axis-handle { touch-action: none; }
```

The first lets the browser scroll vertically while custom code handles horizontal dragging. The second reserves vertical motion for the sheet. `none` disables browser panning/zoom on that target; restrict it to a small necessary handle, provide alternatives, and verify the user can scroll past the component.

For native scrolling, prefer a horizontal overflow track with `scroll-snap-type: x mandatory` and `scroll-snap-align: start`, where mandatory snapping fits the content. The browser's scrolling physics often remove the need for custom gesture code. Test oversized slides and keyboard access; `proximity` can be better when mandatory snapping traps reading positions.

## 10. Theme and installed mode

```html
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0a0a0a" />
<meta name="color-scheme" content="light dark" />
```

Match the actual top-of-page surface, not automatically the brand color. These colors are examples. Only declare supported schemes. For app-controlled themes, update the effective tag to match the resolved theme rather than leaving OS-only queries in conflict. Use the framework's owning metadata/viewport API.

Installed PWAs also need aligned manifest `theme_color`/`background_color` and, where applicable, Apple status-bar settings. Support and rendering differ by browser; browser chrome color is not fully under page control.

## 11. Keyboard viewport enhancement

`interactive-widget=resizes-content` can request layout-viewport resizing for the software keyboard in supporting browsers:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content" />
```

This is not a cross-browser guarantee, nor proof that iOS behaves identically. Verify focused inputs, bottom bars, scroll position, dismissal, and landscape. If considering `-webkit-text-size-adjust: 100%` to prevent unwanted landscape inflation, test user text settings and zoom first; do not suppress necessary text scaling globally by habit.

## Verification and completion

Use authorized device access. Ordinary project dev-server startup is allowed when the current task and harness authorize it. That permission does not automatically authorize binding to all interfaces, LAN exposure, tunnels, privileged helpers, or other services. If access is unavailable, provide a precise hardware check instead of claiming a fix.

Emulation can reveal layout, CSS media-query, and some input issues. It cannot fully validate physical touch, browser chrome, safe areas, OS keyboard, rubber-banding, memory, or GPU behavior. Use Safari Web Inspector or Android remote debugging when available through an approved setup.

Check an older supported phone, portrait and landscape, keyboard open, zoom/large text, touch and available mouse/trackpad input, light/dark mode, scroll boundaries, and installed mode if targeted. Record device/browser and observed versus inferred results. Each fix needs a symptom, cause, changed declaration or behavior, and a remaining hardware check if unverified. Do not apply this entire reference as a global reset.
