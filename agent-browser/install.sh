#!/bin/sh
#
# Install agent-browser Chromium dependency
#
# agent-browser requires Chromium for headless browser automation.
# This runs after the bun package is installed.

set -e

if ! command -v agent-browser >/dev/null 2>&1; then
  echo "  agent-browser not installed, skipping Chromium setup"
  exit 0
fi

echo "  Installing agent-browser Chromium..."
agent-browser install
echo "  agent-browser Chromium installed"
