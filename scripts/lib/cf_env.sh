#!/usr/bin/env bash
# Cloudflare API token (opsiyonel) — repoya yazilmaz
#   ~/.config/log-guardian/cloudflare.env:
#     LG_CF_API_TOKEN=...
#     LG_CF_ZONE_ID=...   # opsiyonel (zone adindan bulunur)
#   source scripts/lib/cf_env.sh
set -euo pipefail

lg_cf_env_load() {
  local f
  for f in \
    "${LG_CF_ENV_FILE:-}" \
    "${HOME}/.config/log-guardian/cloudflare.env" \
    "$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." 2>/dev/null && pwd)/.env" \
    ; do
    [[ -n "$f" && -r "$f" ]] || continue
    set -a
    # shellcheck disable=SC1090
    source "$f"
    set +a
    if [[ -z "${LG_CF_API_TOKEN:-${CLOUDFLARE_API_TOKEN:-}}" ]] \
        && grep -qE '^LG_CF_API_TOKEN=' "$f" 2>/dev/null; then
      echo "[cf_env] WARN: $f var ama LG_CF_API_TOKEN bos — scripts/cloudflare.env.example" >&2
    fi
    return 0
  done
  return 0
}

lg_cf_env_load
