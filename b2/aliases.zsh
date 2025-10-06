# Backblaze B2 CLI aliases
# Only including actually useful shortcuts

# Quick auth (saves typing 'account authorize')
alias b2auth='b2 account authorize'

# List buckets (shorter than 'b2 bucket list')
alias b2l='b2 bucket list'

# Upload/download shortcuts with better defaults
alias b2up='b2 file upload'
alias b2dl='b2 file download'

# Sync with common options
alias b2s='b2 sync'
alias b2sd='b2 sync --dryRun'  # dry run to preview changes