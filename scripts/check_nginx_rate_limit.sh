#!/usr/bin/env bash
# nginx rate limit (lg_general / lg_login) dogrulama — Guardian'a dokunmaz
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STRICT="${STRICT:-0}"

fail() { echo "[check_nginx_rate_limit] FAIL: $*" >&2; exit 1; }
warn() { echo "[check_nginx_rate_limit] WARN: $*" >&2; }

command -v nginx >/dev/null 2>&1 || {
  warn "nginx yok — kontrol atlandi"
  exit 0
}

LIB="$ROOT/scripts/lib/nginx_config_dump.sh"
[[ -f "$LIB" ]] || LIB="$(dirname "$ROOT")/scripts/lib/nginx_config_dump.sh"
# shellcheck source=scripts/lib/nginx_config_dump.sh
source "$LIB"
nginx_t=$(nginx_config_text)
[[ -n "$nginx_t" ]] || fail "nginx yapilandirma okunamadi — sudo bash scripts/check_nginx_rate_limit.sh"

has_zone=0 has_general=0 has_login=0
echo "$nginx_t" | grep -qE 'limit_req_zone[[:space:]]+\$binary_remote_addr[[:space:]]+zone=lg_general' && has_zone=1
echo "$nginx_t" | grep -qE 'limit_req[[:space:]]+zone=lg_general' && has_general=1
echo "$nginx_t" | grep -qE 'limit_req[[:space:]]+zone=lg_login' && has_login=1

echo "=== nginx rate limit kontrol ==="
echo "  limit_req_zone lg_general : $([[ $has_zone -eq 1 ]] && echo OK || echo YOK)"
echo "  limit_req lg_general      : $([[ $has_general -eq 1 ]] && echo OK || echo YOK)"
echo "  limit_req lg_login        : $([[ $has_login -eq 1 ]] && echo OK || echo YOK)"

if [[ $has_zone -eq 1 && $has_general -eq 1 ]]; then
  echo "[OK] nginx rate limit aktif — volumetrik ilk hat"
  exit 0
fi

echo ""
echo "Duzeltme:"
echo "  sudo bash scripts/fix_nginx_log_format.sh   # lg_general zone + snippet"
echo "  veya: examples/nginx/snippets/log-guardian.conf"

[[ "$STRICT" == "1" ]] && fail "nginx rate limit eksik"
exit 1
