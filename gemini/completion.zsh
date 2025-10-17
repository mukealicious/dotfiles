# Gemini CLI shell completion
if command -v gemini &> /dev/null; then
  eval "$(gemini completion zsh 2>/dev/null)"
fi
