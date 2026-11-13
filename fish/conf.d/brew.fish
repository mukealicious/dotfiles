# Homebrew. `brew shellenv` owns the prefix, PATH, MANPATH, and INFOPATH setup.
# Its fish output uses `fish_add_path --global --path`, so PATH changes stay in
# this shell instead of a universal variable that other sessions inherit.
for brew_bin in /opt/homebrew/bin/brew /usr/local/bin/brew
    if test -x $brew_bin
        $brew_bin shellenv fish | source
        fish_add_path --global --move --path (dirname (dirname $brew_bin))/opt/postgresql@17/bin
        break
    end
end
