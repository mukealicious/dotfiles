# Lazy load expensive commands to improve shell startup time

# Lazy load pyenv - only initialize when python/pip is called
pyenv() {
  unset -f pyenv
  eval "$(command pyenv init -)"
  eval "$(command pyenv virtualenv-init -)"
  pyenv "$@"
}

python() {
  unset -f python
  eval "$(command pyenv init -)"
  eval "$(command pyenv virtualenv-init -)"
  python "$@"
}

pip() {
  unset -f pip
  eval "$(command pyenv init -)"
  eval "$(command pyenv virtualenv-init -)"
  pip "$@"
}

# Lazy load asdf for node/npm
_asdf_load() {
  unset -f _asdf_load node npm npx asdf
  . /opt/homebrew/opt/asdf/libexec/asdf.sh
}
node() { _asdf_load && node "$@" }
npm() { _asdf_load && npm "$@" }
npx() { _asdf_load && npx "$@" }
asdf() { _asdf_load && asdf "$@" }

# Lazy load rbenv
_rbenv_load() {
  unset -f ruby gem bundle rbenv
  eval "$(command rbenv init -)"
}
ruby() { _rbenv_load; ruby "$@" }
gem() { _rbenv_load; gem "$@" }
bundle() { _rbenv_load; bundle "$@" }
rbenv() { _rbenv_load; rbenv "$@" }