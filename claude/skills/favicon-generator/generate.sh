#!/bin/bash

# Favicon Generator Script
# Generates a complete set of favicons from a source PNG file

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if input file is provided
if [ $# -eq 0 ]; then
    echo -e "${RED}Error: No input file specified${NC}"
    echo "Usage: $0 <input-png-file>"
    exit 1
fi

INPUT_FILE="$1"
OUTPUT_DIR="favicons"

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo -e "${RED}Error: File '$INPUT_FILE' not found${NC}"
    exit 1
fi

# Check for ImageMagick
if ! command -v convert &> /dev/null; then
    echo -e "${RED}Error: ImageMagick is not installed${NC}"
    echo "Install with: brew install imagemagick"
    exit 1
fi

# Check for oxipng (optional but recommended)
OXIPNG_AVAILABLE=false
if command -v oxipng &> /dev/null; then
    OXIPNG_AVAILABLE=true
else
    echo -e "${YELLOW}Warning: oxipng not found. PNG optimization will be skipped${NC}"
    echo "Install with: brew install oxipng"
fi

# Create output directory
echo -e "${BLUE}Creating output directory: $OUTPUT_DIR${NC}"
mkdir -p "$OUTPUT_DIR"

# Function to generate PNG favicon
generate_png() {
    local size=$1
    local output_name=$2
    echo -e "${GREEN}Generating $output_name (${size}x${size})...${NC}"
    convert "$INPUT_FILE" -resize ${size}x${size} -background none -gravity center -extent ${size}x${size} "$OUTPUT_DIR/$output_name"
}

# Generate PNG favicons
echo -e "\n${BLUE}=== Generating PNG Favicons ===${NC}"
generate_png 16 "favicon-16x16.png"
generate_png 32 "favicon-32x32.png"
generate_png 180 "apple-touch-icon.png"
generate_png 192 "android-chrome-192x192.png"
generate_png 512 "android-chrome-512x512.png"

# Generate multi-size ICO file
echo -e "\n${BLUE}=== Generating favicon.ico ===${NC}"
echo -e "${GREEN}Generating favicon.ico (16x16, 32x32, 48x48)...${NC}"
convert "$INPUT_FILE" -resize 16x16 -background none -gravity center -extent 16x16 \
    \( "$INPUT_FILE" -resize 32x32 -background none -gravity center -extent 32x32 \) \
    \( "$INPUT_FILE" -resize 48x48 -background none -gravity center -extent 48x48 \) \
    "$OUTPUT_DIR/favicon.ico"

# Optimize PNGs with oxipng
if [ "$OXIPNG_AVAILABLE" = true ]; then
    echo -e "\n${BLUE}=== Optimizing PNG files ===${NC}"
    for png in "$OUTPUT_DIR"/*.png; do
        echo -e "${GREEN}Optimizing $(basename "$png")...${NC}"
        oxipng -o 3 -s "$png"
    done
fi

# Print summary
echo -e "\n${BLUE}=== Summary ===${NC}"
echo -e "${GREEN}✓ Successfully generated favicons in '$OUTPUT_DIR/'${NC}"
echo ""
echo "Files created:"
ls -lh "$OUTPUT_DIR" | tail -n +2 | awk '{printf "  %-30s %10s\n", $9, $5}'

echo ""
echo -e "${BLUE}Add these to your HTML <head>:${NC}"
echo '  <link rel="icon" type="image/x-icon" href="/favicons/favicon.ico">'
echo '  <link rel="icon" type="image/png" sizes="16x16" href="/favicons/favicon-16x16.png">'
echo '  <link rel="icon" type="image/png" sizes="32x32" href="/favicons/favicon-32x32.png">'
echo '  <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png">'
echo '  <link rel="manifest" href="/site.webmanifest">'

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
