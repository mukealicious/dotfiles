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

# Lazy load nvm if you use it (currently using asdf)
# nvm() {
#   unset -f nvm
#   export NVM_DIR="$HOME/.nvm"
#   [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
#   nvm "$@"
# }