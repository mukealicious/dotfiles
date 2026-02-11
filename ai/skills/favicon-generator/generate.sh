#!/bin/bash

# Favicon Generator Script
# Generates a complete set of favicons from a source PNG or SVG file

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default values
OUTPUT_DIR="favicons"
GENERATE_MANIFEST=false
INPUT_FILE=""

# Show help
show_help() {
    echo "Usage: $0 <input-file.png|svg> [options]"
    echo ""
    echo "Generate a complete set of optimized favicons from a source image."
    echo ""
    echo "Options:"
    echo "  --output-dir <path>  Output directory (default: ./favicons)"
    echo "  --manifest           Generate site.webmanifest file"
    echo "  --help               Show this help message"
    echo ""
    echo "Outputs (2025 best practices):"
    echo "  favicon.ico (16,32,48px multi-size)"
    echo "  favicon.svg (if SVG input - for modern browsers)"
    echo "  apple-touch-icon.png (180px)"
    echo "  android-chrome-192x192.png, android-chrome-512x512.png"
    exit 0
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --help)
            show_help
            ;;
        --output-dir)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --manifest)
            GENERATE_MANIFEST=true
            shift
            ;;
        -*)
            echo -e "${RED}Error: Unknown option $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
        *)
            if [ -z "$INPUT_FILE" ]; then
                INPUT_FILE="$1"
            else
                echo -e "${RED}Error: Multiple input files specified${NC}"
                exit 1
            fi
            shift
            ;;
    esac
done

# Check if input file is provided
if [ -z "$INPUT_FILE" ]; then
    echo -e "${RED}Error: No input file specified${NC}"
    echo "Usage: $0 <input-file.png|svg> [options]"
    echo "Use --help for more information"
    exit 1
fi

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo -e "${RED}Error: File '$INPUT_FILE' not found${NC}"
    exit 1
fi

# Check for ImageMagick (prefer magick for v7+, fallback to convert)
MAGICK_CMD="magick"
if ! command -v magick &> /dev/null; then
    if command -v convert &> /dev/null; then
        MAGICK_CMD="convert"
    else
        echo -e "${RED}Error: ImageMagick is not installed${NC}"
        echo "Install with: brew install imagemagick"
        exit 1
    fi
fi

# Check for oxipng (optional)
OXIPNG_AVAILABLE=false
if command -v oxipng &> /dev/null; then
    OXIPNG_AVAILABLE=true
else
    echo -e "${YELLOW}Note: oxipng not found, PNG optimization will be skipped${NC}"
    echo "Install with: brew install oxipng"
fi

# Handle SVG input - convert to temporary PNG first, preserve SVG for output
TEMP_PNG=""
WORKING_FILE="$INPUT_FILE"
IS_SVG_INPUT=false
INPUT_LOWER=$(echo "$INPUT_FILE" | tr '[:upper:]' '[:lower:]')
if [[ "$INPUT_LOWER" == *.svg ]]; then
    IS_SVG_INPUT=true
    echo -e "${BLUE}Converting SVG to PNG...${NC}"
    TEMP_PNG=$(mktemp /tmp/favicon-source-XXXXXX.png)
    $MAGICK_CMD -background none -density 512 "$INPUT_FILE" -resize 512x512 "$TEMP_PNG"
    WORKING_FILE="$TEMP_PNG"
fi

# Cleanup function
cleanup() {
    if [ -n "$TEMP_PNG" ] && [ -f "$TEMP_PNG" ]; then
        rm -f "$TEMP_PNG"
    fi
}
trap cleanup EXIT

# Create output directory
echo -e "${BLUE}Creating output directory: $OUTPUT_DIR${NC}"
mkdir -p "$OUTPUT_DIR"

# Generate PNG favicon
generate_png() {
    local size=$1
    local output_name=$2
    echo -e "${GREEN}Generating $output_name (${size}x${size})...${NC}"
    $MAGICK_CMD "$WORKING_FILE" -resize ${size}x${size} -background none -gravity center -extent ${size}x${size} "$OUTPUT_DIR/$output_name"
}

# Copy SVG to output if input was SVG (modern browsers prefer SVG)
if [ "$IS_SVG_INPUT" = true ]; then
    echo -e "\n${BLUE}=== Copying SVG Favicon ===${NC}"
    echo -e "${GREEN}Copying favicon.svg...${NC}"
    cp "$INPUT_FILE" "$OUTPUT_DIR/favicon.svg"
fi

# Generate PNG favicons (minimal set per 2025 best practices)
echo -e "\n${BLUE}=== Generating PNG Favicons ===${NC}"
generate_png 180 "apple-touch-icon.png"
generate_png 192 "android-chrome-192x192.png"
generate_png 512 "android-chrome-512x512.png"

# Generate multi-size ICO file
echo -e "\n${BLUE}=== Generating favicon.ico ===${NC}"
echo -e "${GREEN}Generating favicon.ico (16x16, 32x32, 48x48)...${NC}"
$MAGICK_CMD "$WORKING_FILE" -resize 16x16 -background none -gravity center -extent 16x16 \
    \( "$WORKING_FILE" -resize 32x32 -background none -gravity center -extent 32x32 \) \
    \( "$WORKING_FILE" -resize 48x48 -background none -gravity center -extent 48x48 \) \
    "$OUTPUT_DIR/favicon.ico"

# Optimize PNGs with oxipng
if [ "$OXIPNG_AVAILABLE" = true ]; then
    echo -e "\n${BLUE}=== Optimizing PNG files ===${NC}"
    for png in "$OUTPUT_DIR"/*.png; do
        echo -e "${GREEN}Optimizing $(basename "$png")...${NC}"
        oxipng -o 3 -s "$png"
    done
fi

# Generate manifest file if requested
if [ "$GENERATE_MANIFEST" = true ]; then
    echo -e "\n${BLUE}=== Generating site.webmanifest ===${NC}"
    cat > "$OUTPUT_DIR/site.webmanifest" << 'MANIFEST'
{
  "name": "Your App Name",
  "short_name": "ShortName",
  "icons": [
    {
      "src": "/favicons/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/favicons/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "#ffffff",
  "background_color": "#ffffff",
  "display": "standalone"
}
MANIFEST
    echo -e "${GREEN}Created site.webmanifest${NC}"
fi

# Print summary
echo -e "\n${BLUE}=== Summary ===${NC}"
echo -e "${GREEN}✓ Successfully generated favicons in '$OUTPUT_DIR/'${NC}"
echo ""
echo "Files created:"
ls -lh "$OUTPUT_DIR" | tail -n +2 | awk '{printf "  %-30s %10s\n", $9, $5}'

echo ""
echo -e "${BLUE}Add these to your HTML <head>:${NC}"
echo '  <!-- ICO for legacy browsers (sizes attr fixes Chrome bug) -->'
echo '  <link rel="icon" href="/favicons/favicon.ico" sizes="32x32">'
if [ "$IS_SVG_INPUT" = true ]; then
    echo '  <!-- SVG for modern browsers (scalable, supports dark mode) -->'
    echo '  <link rel="icon" href="/favicons/favicon.svg" type="image/svg+xml">'
fi
echo '  <!-- Apple Touch Icon -->'
echo '  <link rel="apple-touch-icon" href="/favicons/apple-touch-icon.png">'
echo '  <!-- Web App Manifest -->'
echo '  <link rel="manifest" href="/site.webmanifest">'

if [ "$GENERATE_MANIFEST" = false ]; then
    echo ""
    echo -e "${BLUE}Create a site.webmanifest file:${NC}"
    echo '{'
    echo '  "name": "Your App Name",'
    echo '  "short_name": "ShortName",'
    echo '  "icons": ['
    echo '    {'
    echo '      "src": "/favicons/android-chrome-192x192.png",'
    echo '      "sizes": "192x192",'
    echo '      "type": "image/png"'
    echo '    },'
    echo '    {'
    echo '      "src": "/favicons/android-chrome-512x512.png",'
    echo '      "sizes": "512x512",'
    echo '      "type": "image/png"'
    echo '    }'
    echo '  ],'
    echo '  "theme_color": "#ffffff",'
    echo '  "background_color": "#ffffff",'
    echo '  "display": "standalone"'
    echo '}'
fi
