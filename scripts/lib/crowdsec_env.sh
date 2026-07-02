#!/usr/bin/env bash
# CrowdSec env — /etc/log-guardian/crowdsec.env + operator cache
crowdsec_env_load() {
  if [[ -n "${CROWDSEC_API_KEY:-}" ]]; then
    CROWDSEC_API_KEY="${CROWDSEC_API_KEY//[[:space:]]/}"
    [[ -n "$CROWDSEC_API_KEY" ]] && return 0
  fi
  local root="${LG_ROOT:-}"
  if [[ -z "$root" ]]; then
    local here
    here="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
    root="$here"
  fi
  local cache="${LG_CROWDSEC_CACHE:-$root/.cache/crowdsec-bouncer.env}"
  local f="${LG_CROWDSEC_ENV:-/etc/log-guardian/crowdsec.env}"
  for candidate in "$cache" "$f"; do
    [[ -f "$candidate" ]] || continue
    if [[ -r "$candidate" ]]; then
      set -a
      # shellcheck source=/dev/null
      source "$candidate" 2>/dev/null || { set +a; continue; }
      set +a
      CROWDSEC_API_KEY="${CROWDSEC_API_KEY:-}"
      CROWDSEC_API_KEY="${CROWDSEC_API_KEY//[[:space:]]/}"
      [[ -n "$CROWDSEC_API_KEY" ]] && return 0
    fi
  done
  if [[ -f "$f" ]] && command -v sudo >/dev/null 2>&1; then
    local kv
    while IFS= read -r kv; do
      [[ "$kv" =~ ^[A-Z_][A-Z0-9_]*= ]] || continue
      export "$kv" 2>/dev/null || true
    done < <(sudo grep -E '^[A-Z_][A-Z0-9_]*=' "$f" 2>/dev/null || true)
  fi
  CROWDSEC_API_KEY="${CROWDSEC_API_KEY:-}"
  CROWDSEC_API_KEY="${CROWDSEC_API_KEY//[[:space:]]/}"
  [[ -n "$CROWDSEC_API_KEY" ]] && return 0
  return 1
}
