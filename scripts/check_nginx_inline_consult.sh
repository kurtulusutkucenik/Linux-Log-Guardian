#!/usr/bin/env bash
# nginx inline consult + API_PORT dogrulama
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STRICT="${STRICT:-0}"

fail() { echo "[check_nginx_inline_consult] FAIL: $*" >&2; exit 1; }
warn() { echo "[check_nginx_inline_consult] WARN: $*" >&2; }

read_api_port() {
  local f="$1"
  local p=""
  if [[ -f "$f" ]]; then
    if [[ -r "$f" ]]; then
      p=$(grep -E '^API_PORT=' "$f" 2>/dev/null | tail -1 | cut -d= -f2 | tr -d ' \r' || true)
    elif command -v sudo >/dev/null 2>&1; then
      p=$(sudo grep -E '^API_PORT=' "$f" 2>/dev/null | tail -1 | cut -d= -f2 | tr -d ' \r' || true)
    fi
    if [[ -n "$p" && "$p" =~ ^[0-9]+$ ]]; then
      echo "$p"
      return 0
    fi
  fi
  return 1
}

API_PORT="${GUARDIAN_API_PORT:-}"
if [[ -z "$API_PORT" ]]; then
  API_PORT=$(read_api_port /etc/log-guardian/rules.conf 2>/dev/null || true)
fi
if [[ -z "$API_PORT" ]]; then
  API_PORT=$(read_api_port "$ROOT/rules.conf" 2>/dev/null || true)
fi
API_PORT="${API_PORT:-8090}"

api_port_ok=0
if [[ -f /etc/log-guardian/rules.conf ]]; then
  if grep -qE "^API_PORT=${API_PORT}" /etc/log-guardian/rules.conf 2>/dev/null \
      || sudo grep -qE "^API_PORT=${API_PORT}" /etc/log-guardian/rules.conf 2>/dev/null; then
    api_port_ok=1
  fi
elif [[ -f "$ROOT/rules.conf" ]] && grep -qE "^API_PORT=${API_PORT}" "$ROOT/rules.conf"; then
  api_port_ok=1
fi

has_consult_loc=0 has_auth=0 has_snippet=0 token_ok=1
nginx_t=""
if command -v nginx >/dev/null 2>&1; then
  LIB="$ROOT/scripts/lib/nginx_config_dump.sh"
  [[ -f "$LIB" ]] || LIB="$(dirname "$ROOT")/scripts/lib/nginx_config_dump.sh"
  # shellcheck source=scripts/lib/nginx_config_dump.sh
  source "$LIB"
  nginx_t=$(nginx_config_text)
  if [[ -n "$nginx_t" ]]; then
    echo "$nginx_t" | grep -qE 'location[[:space:]]*=[[:space:]]*/_lg_consult' && has_consult_loc=1
    echo "$nginx_t" | grep -qE 'auth_request[[:space:]]+/_lg_consult' && has_auth=1
    echo "$nginx_t" | grep -q 'log-guardian-inline-consult' && has_snippet=1
    echo "$nginx_t" | grep -q '__LG_API_TOKEN__' && token_ok=0
  fi
fi

echo "=== nginx inline consult kontrol ==="
echo "  API_PORT=${API_PORT} rules.conf : $([[ $api_port_ok -eq 1 ]] && echo OK || echo YOK)"
echo "  snippet /_lg_consult       : $([[ $has_consult_loc -eq 1 ]] && echo OK || echo YOK)"
echo "  auth_request /_lg_consult  : $([[ $has_auth -eq 1 ]] && echo OK || echo YOK)"
echo "  inline-consult include     : $([[ $has_snippet -eq 1 ]] && echo OK || echo YOK)"
echo "  consult API token          : $([[ $token_ok -eq 1 ]] && echo OK || echo PLACEHOLDER)"

if [[ $token_ok -eq 0 ]]; then
  echo ""
  echo "  nginx snippet __LG_API_TOKEN__ — tum istekler 403:"
  echo "    sudo bash scripts/fix_nginx_inline_consult.sh"
fi

if [[ $api_port_ok -eq 1 && $has_consult_loc -eq 1 && $has_auth -eq 1 && $token_ok -eq 1 ]]; then
  echo "[OK] inline consult prod default tam"
  exit 0
fi

echo ""
echo "Duzeltme (otomatik):"
echo "  sudo bash scripts/fix_nginx_inline_consult.sh"

[[ "$STRICT" == "1" ]] && fail "inline consult eksik"
exit 1
