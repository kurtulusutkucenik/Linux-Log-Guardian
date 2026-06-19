#!/usr/bin/env bash
# nginx log_guardian format dogrulama — POST SQLi icin $request_body sart
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STRICT="${STRICT:-0}"

fail() { echo "[check_nginx_log_format] FAIL: $*" >&2; exit 1; }
warn() { echo "[check_nginx_log_format] WARN: $*" >&2; }

command -v nginx >/dev/null 2>&1 || {
  warn "nginx yok — kontrol atlandi"
  exit 0
}

LIB="$ROOT/scripts/lib/nginx_config_dump.sh"
[[ -f "$LIB" ]] || LIB="$(dirname "$ROOT")/scripts/lib/nginx_config_dump.sh"
# shellcheck source=scripts/lib/nginx_config_dump.sh
source "$LIB"
nginx_t=$(nginx_config_text)
[[ -n "$nginx_t" ]] || fail "nginx yapilandirma okunamadi — sudo bash scripts/check_nginx_log_format.sh"

has_format=0 has_access=0 has_body=0
echo "$nginx_t" | grep -qE 'log_format[[:space:]]+log_guardian' && has_format=1
echo "$nginx_t" | grep -qE 'access_log[[:space:]]+[^;[:space:]]+[[:space:]]+log_guardian' && has_access=1
if [[ $has_format -eq 1 ]]; then
  echo "$nginx_t" | awk '/log_format[[:space:]]+log_guardian/,/;/' | grep -q 'request_body' && has_body=1
fi

echo "=== nginx log_guardian kontrol ==="
echo "  log_format log_guardian : $([[ $has_format -eq 1 ]] && echo OK || echo YOK)"
echo "  access_log log_guardian : $([[ $has_access -eq 1 ]] && echo OK || echo YOK)"
echo "  \$request_body alani    : $([[ $has_body -eq 1 ]] && echo OK || echo YOK)"

if [[ $has_format -eq 1 && $has_access -eq 1 && $has_body -eq 1 ]]; then
  echo "[OK] log_guardian format tam — POST SQLi gorunur"
  exit 0
fi

echo ""
echo "Duzeltme (otomatik):"
echo "  sudo bash scripts/fix_nginx_log_format.sh"

[[ "$STRICT" == "1" ]] && fail "log_guardian format eksik"
exit 1
