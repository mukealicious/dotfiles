---
name: favicon-generator
description: Generate a complete set of optimized favicons (PNG, ICO, Apple Touch, Android Chrome) from a single source PNG file using ImageMagick and oxipng
---

# Favicon Generator Skill

Generates a complete, optimized favicon set from a single source PNG image.

## When to Use

Use this skill when the user needs to:
- Generate favicons for a website from a logo or icon
- Create multiple favicon sizes and formats from one source image
- Get ready-to-use HTML snippets and web manifest configuration

## Prerequisites

The script will check for required tools and provide installation instructions if missing:
- ImageMagick (image conversion)
- oxipng (PNG optimization, optional but recommended)

## Usage

1. Ask the user for the input PNG file path
2. Execute the generation script: `bash $SKILL_DIR/generate.sh <input-file>`
3. The script will:
   - Create a `favicons/` directory
   - Generate all required sizes (16x16, 32x32, 180x180, 192x192, 512x512)
   - Create a multi-size .ico file
   - Optimize PNGs if oxipng is available
   - Display HTML snippets and manifest template

## Output Files

The script generates:
- `favicon-16x16.png` - Standard small favicon
- `favicon-32x32.png` - Standard medium favicon
- `favicon.ico` - Multi-resolution ICO (16, 32, 48px)
- `apple-touch-icon.png` - 180x180 for iOS
- `android-chrome-192x192.png` - 192x192 for Android
- `android-chrome-512x512.png` - 512x512 for Android

## HTML Integration

After generation, provide the user with:
1. The HTML `<link>` tags (script outputs these)
2. The `site.webmanifest` template (script outputs this)
3. Instructions to customize the manifest name/colors for their project

## Error Handling

The script handles:
- Missing input file
- Missing dependencies (with installation instructions)
- Invalid file paths

If errors occur, check:
1. Input file exists and is a valid PNG
2. ImageMagick is installed: `brew install imagemagick`
3. User has write permissions in current directory

## Example Interaction

User: "I need favicons for my website from this logo.png"

1. Confirm the file path
2. Run: `bash $SKILL_DIR/generate.sh logo.png`
3. Present the generated files and HTML snippets
4. Guide user to customize the manifest with their app name/colors
