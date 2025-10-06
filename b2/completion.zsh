# Enable B2 CLI command completion if available
# B2 CLI provides built-in completion support

# Check if b2 command exists and has completion support
if command -v b2 &> /dev/null; then
  # B2 CLI uses argcomplete for Python, check if it's available
  if python3 -c "import argcomplete" 2>/dev/null; then
    # Register b2 for completion
    eval "$(register-python-argcomplete b2 2>/dev/null)"
  fi
fi