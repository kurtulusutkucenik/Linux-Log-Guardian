#!/usr/bin/env bash
# nginx log_guardian — kontrol, root ise otomatik fix (install gate)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

STRICT_EXIT="${STRICT_EXIT:-0}"
enforce="${NGINX_ENFORCE_LOG_FORMAT:-1}"

command -v nginx >/dev/null 2>&1 || exit 0
[[ "$enforce" == "1" ]] || exit 0

if bash "$ROOT/scripts/check_nginx_log_format.sh" 2>/dev/null; then
  echo "[enforce_nginx_log_format] OK — log_guardian tam"
  exit 0
fi

if [[ "$(id -u)" -ne 0 ]]; then
  echo "[enforce_nginx_log_format] FAIL: eksik — sudo bash scripts/fix_nginx_log_format.sh" >&2
  [[ "$STRICT_EXIT" == "1" ]] && exit 1
  exit 1
fi

echo "[enforce_nginx_log_format] eksik — otomatik duzeltme..." >&2
if bash "$ROOT/scripts/fix_nginx_log_format.sh"; then
  echo "[enforce_nginx_log_format] OK — otomatik kuruldu"
  exit 0
fi

echo "[enforce_nginx_log_format] FAIL: otomatik kurulum basarisiz" >&2
echo "  manuel: sudo bash scripts/fix_nginx_log_format.sh" >&2
echo "  rehber: docs/QUICKSTART_NGINX.md" >&2
[[ "$STRICT_EXIT" == "1" ]] && exit 1
exit 1
