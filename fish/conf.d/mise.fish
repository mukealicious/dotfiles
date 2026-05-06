# mise is activated from config.fish after base PATH setup.
# Fish loads conf.d before config.fish; activating here would let later
# fish_add_path calls move Bun/Homebrew ahead of mise-managed runtimes.
