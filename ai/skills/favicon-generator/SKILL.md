---
name: favicon-generator
description: Generate optimized favicons from PNG/SVG. Use for favicon.ico/svg, apple-touch-icon, android-chrome, browser/website icons, or web manifest icon sets.
---

# Favicon Generator

Generates complete favicon set from source PNG/SVG using ImageMagick. Follows 2025 best practices for minimal, modern favicon sets.

## Prerequisites

- **ImageMagick** (required): `brew install imagemagick`
- **oxipng** (optional): `brew install oxipng` - for PNG optimization

## Usage

Run `generate.sh` from this skill's directory:

```bash
bash generate.sh <input.png|svg> [options]
```

Options:
- `--output-dir <path>` - Output directory (default: `./favicons`)
- `--manifest` - Generate `site.webmanifest` file
- `--help` - Show usage info

## Output Files

- `favicon.ico` - Multi-size ICO (16, 32, 48px) for legacy browsers
- `favicon.svg` - SVG favicon for modern browsers (only if SVG input)
- `apple-touch-icon.png` - 180px for iOS
- `android-chrome-192x192.png`, `android-chrome-512x512.png` - For PWA/Android

Script prints HTML `<link>` tags to stdout. SVG favicons support dark mode via CSS media queries.
