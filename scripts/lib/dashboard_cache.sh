#!/usr/bin/env bash
# Dashboard bans API in-memory cache temizligi (live_demo / cleanup sonrasi anlik UI)
# shellcheck shell=bash
[[ -n "${LG_DASHBOARD_CACHE_SH:-}" ]] && return 0
LG_DASHBOARD_CACHE_SH=1

_lg_dc_root="${LG_ROOT:-}"
if [[ -z "$_lg_dc_root" ]]; then
  _lg_dc_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fi

invalidate_dashboard_bans_cache() {
  local tok key base
  tok=$(bash -c "source '$_lg_dc_root/scripts/lib/guardian_api.sh' 2>/dev/null && read_lg_api_token" 2>/dev/null || true)
  key="${DASHBOARD_CACHE_BUST_KEY:-${tok:-}}"
  [[ -n "$key" ]] || return 0
  for base in "${DASHBOARD_CACHE_BUST_URL:-http://127.0.0.1:3000}" "https://127.0.0.1:8443"; do
    if curl -sfk -X POST -H "Authorization: Bearer ${key}" \
      "${base}/api/internal/bans-invalidate" >/dev/null 2>&1; then
      echo "[dashboard_cache] bans cache invalidated ($base)"
      return 0
    fi
  done
  return 0
}
