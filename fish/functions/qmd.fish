function qmd --description "QMD with per-project index support"
    set -l qmd_config_dir "$PWD/.qmd"
    set -l index_path "$qmd_config_dir/index.sqlite"

    if test -d "$qmd_config_dir"
        printf '\033[2mUsing local qmd index: %s\033[0m\n' "$qmd_config_dir" >&2
        QMD_CONFIG_DIR="$qmd_config_dir" INDEX_PATH="$index_path" command qmd $argv
        return
    end

    command qmd $argv
end
