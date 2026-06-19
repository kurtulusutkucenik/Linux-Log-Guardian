#!/usr/bin/env bash
# Log Guardian API yardimcilari — token, port, derleme on kontrol
# shellcheck shell=bash
[[ -n "${LG_GUARDIAN_API_SH:-}" ]] && return 0
LG_GUARDIAN_API_SH=1

_lg_root="${LG_ROOT:-}"
if [[ -z "$_lg_root" ]]; then
  _lg_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fi

read_lg_api_port() {
  local f p
  for f in "${LG_RULES:-/etc/log-guardian/rules.conf}" "$_lg_root/rules.conf"; do
    [[ -f "$f" ]] || continue
    p=$(grep -E '^API_PORT=' "$f" 2>/dev/null | tail -1 | cut -d= -f2 | tr -d ' \r')
    if [[ -n "$p" && "$p" =~ ^[0-9]+$ ]]; then
      echo "$p"
      return 0
    fi
  done
  echo "${GUARDIAN_API_PORT:-8090}"
}

read_lg_api_token() {
  local f tok
  for f in "${LG_RULES:-/etc/log-guardian/rules.conf}" "$_lg_root/rules.conf"; do
    [[ -f "$f" ]] || continue
    tok=$(grep -E '^API_TOKEN=' "$f" 2>/dev/null | tail -1 | cut -d= -f2- | tr -d '\r')
    if [[ -n "$tok" ]]; then
      echo "$tok"
      return 0
    fi
  done
  return 1
}

# curl -H "Authorization: Bearer ..." icin dizi: API_AUTH=(-H "Authorization: Bearer $tok")
lg_api_auth_curl() {
  local tok
  tok=$(read_lg_api_token 2>/dev/null || true)
  if [[ -n "$tok" ]]; then
    printf '%s\n' "-H" "Authorization: Bearer $tok"
  fi
}

load_lg_replay_password() {
  export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"
  if [[ -f /etc/log-guardian/env ]] && [[ -r /etc/log-guardian/env ]]; then
    local pw
    pw=$(grep -E '^LOGANALYZER_PASSWORD=' /etc/log-guardian/env 2>/dev/null | tail -1 | cut -d= -f2- | tr -d '\r')
    [[ -n "$pw" ]] && export LOGANALYZER_PASSWORD="$pw"
  fi
}

needs_sudo_lg_replay() {
  [[ -f /etc/log-guardian/rules.conf ]] || return 1
  grep -qE '^ACCESS_PASSWORD_KDF=pbkdf2\$100000\$6560e0aa800d47957280cab9a1038847\$' \
    /etc/log-guardian/rules.conf 2>/dev/null
}

# Prod KDF varsa script'i sudo ile yeniden calistir: ensure_sudo_lg_replay "$0" "$@"
ensure_sudo_lg_replay() {
  local script="${1:?}"
  shift
  if [[ -f /etc/log-guardian/rules.conf ]] && [[ "$(id -u)" -ne 0 ]]; then
    if ! needs_sudo_lg_replay; then
      echo "[INFO] ozel ACCESS_PASSWORD_KDF — sudo ile replay"
      exec sudo -E LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-}" bash "$script" "$@"
    fi
  fi
}

# nobody/docker .o sahipligi — make clean
ensure_lg_build_tree() {
  local root="${1:-$_lg_root}"
  [[ -d "$root" ]] || return 0
  local probe
  probe=$(find "$root" -maxdepth 1 -name '*.o' -print -quit 2>/dev/null || true)
  [[ -n "$probe" ]] || return 0
  if ! touch "$probe" 2>/dev/null; then
    echo "[build] .o yazilamaz (sahiplik?) — make clean" >&2
    make -C "$root" clean
  fi
}
