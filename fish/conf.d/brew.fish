# Homebrew
if test -d /opt/homebrew/bin
    fish_add_path --move /opt/homebrew/bin /opt/homebrew/sbin
    fish_add_path --move /opt/homebrew/opt/postgresql@17/bin
    set -gx HOMEBREW_PREFIX /opt/homebrew
    set -gx HOMEBREW_CELLAR /opt/homebrew/Cellar
    set -gx HOMEBREW_REPOSITORY /opt/homebrew
    set -gx INFOPATH /opt/homebrew/share/info $INFOPATH
else if test -d /usr/local/bin
    fish_add_path --move /usr/local/bin /usr/local/sbin
    fish_add_path --move /usr/local/opt/postgresql@17/bin
    set -gx HOMEBREW_PREFIX /usr/local
    set -gx HOMEBREW_CELLAR /usr/local/Cellar
    set -gx HOMEBREW_REPOSITORY /usr/local
    set -gx INFOPATH /usr/local/share/info $INFOPATH
end
