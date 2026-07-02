#!/usr/bin/env bash
# VM yol yardimcilari — sudo iken $HOME=/root tuzagi
# shellcheck shell=bash
[[ -n "${LG_VM_PATHS_SH:-}" ]] && return 0
LG_VM_PATHS_SH=1

lg_vm_real_user() {
  if [[ -n "${LG_VM_USER:-}" ]]; then
    echo "$LG_VM_USER"
    return 0
  fi
  if [[ -n "${SUDO_USER:-}" && "${SUDO_USER}" != root ]]; then
    echo "$SUDO_USER"
    return 0
  fi
  if [[ "$(id -u)" -ne 0 ]]; then
    echo "${USER:-}"
    return 0
  fi
  echo "kurtulus"
}

lg_vm_dest_dir() {
  if [[ -n "${LG_VM_SYNC_DEST:-}" ]]; then
    echo "$LG_VM_SYNC_DEST"
    return 0
  fi
  local u home
  u="$(lg_vm_real_user)"
  if [[ -n "$u" ]] && home="$(getent passwd "$u" 2>/dev/null | cut -d: -f6)" && [[ -n "$home" ]]; then
    echo "${home}/Linux-Log-Guardian"
  else
    echo "${HOME}/Linux-Log-Guardian"
  fi
}

lg_vm_resolve_repo_root() {
  local hint="${1:-}"
  local dest
  dest="$(lg_vm_dest_dir)"
  if [[ -f "$dest/scripts/post_install_verify.sh" ]]; then
    echo "$dest"
    return 0
  fi
  if [[ -n "$hint" && -f "$hint/scripts/post_install_verify.sh" ]]; then
    (cd "$hint" && pwd)
    return 0
  fi
  echo "$dest"
}
