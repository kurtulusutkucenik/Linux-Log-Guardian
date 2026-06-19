#!/usr/bin/env bash
# API :8090 guvenligi — parolaya DOKUNMAZ (demo DegistirBeni!123 kalir)
#   sudo bash scripts/ensure_api_security.sh
# API_TOKEN uretir, API_BIND=127.0.0.1 yapar, dashboard token senkronlar.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONF="${LG_RULES:-/etc/log-guardian/rules.conf}"

[[ "$(id -u)" -eq 0 ]] || { echo "[ensure_api_security] sudo gerekli" >&2; exit 1; }
[[ -f "$CONF" ]] || { echo "[ensure_api_security] $CONF yok — sudo bash install.sh" >&2; exit 1; }

ensure_kv() {
  local key="$1" val="$2" file="$3"
  if grep -q "^${key}=" "$file" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$file"
  else
    echo "${key}=${val}" >> "$file"
  fi
}

echo "=== ensure_api_security ==="

bind=$(grep -E '^API_BIND=' "$CONF" 2>/dev/null | tail -1 | cut -d= -f2 || echo "")
if [[ "$bind" != "127.0.0.1" ]]; then
  ensure_kv "API_BIND" "127.0.0.1" "$CONF"
  echo "[OK] API_BIND=127.0.0.1 (onceki: ${bind:-yok})"
else
  echo "[OK] API_BIND=127.0.0.1"
fi

if [[ "${API_SKIP_TOKEN:-0}" != "1" ]]; then
  if ! grep -qE '^API_TOKEN=.+' "$CONF" 2>/dev/null; then
    tok="$(openssl rand -hex 32)"
    echo "API_TOKEN=${tok}" >> "$CONF"
    echo "[OK] API_TOKEN uretildi"
  else
    echo "[OK] API_TOKEN mevcut"
  fi
else
  grep -qE '^API_TOKEN=.+' "$CONF" 2>/dev/null \
    && echo "[OK] API_TOKEN mevcut (korundu)" \
    || echo "[WARN] API_TOKEN yok — API_SKIP_TOKEN atlandi" >&2
fi

# shellcheck source=scripts/firewall_api_bind.sh
source "$ROOT/scripts/firewall_api_bind.sh"
if fw_method=$(lg_firewall_api_bind_install 2>/dev/null); then
  echo "[OK] firewall 8090 ($fw_method)"
else
  echo "[WARN] firewall atlandi — API_BIND=127.0.0.1 yedek" >&2
fi

bash "$ROOT/scripts/fix_rules_conf_perms.sh"

if [[ -x "$ROOT/scripts/sync_service_password.sh" ]]; then
  bash "$ROOT/scripts/sync_service_password.sh" || true
fi

systemctl reset-failed log-guardian 2>/dev/null || true
systemctl restart log-guardian log-guardian-daemon 2>/dev/null || systemctl restart log-guardian 2>/dev/null || true
sleep 2

tok=$(grep -E '^API_TOKEN=' "$CONF" 2>/dev/null | tail -1 | cut -d= -f2-)
echo ""
echo "=== API_TOKEN (dashboard / curl) ==="
echo "  rules.conf: $CONF"
echo "  Bearer: $tok"
echo ""
echo "  Dashboard senkron:"
echo "    bash scripts/sync_dashboard_api_token.sh"
echo "  curl ornegi:"
echo "    curl -H \"Authorization: Bearer $tok\" -X POST \"http://127.0.0.1:8090/api/v1/ban?ip=203.0.113.254\""

if docker ps --format '{{.Names}}' 2>/dev/null | grep -q log-guardian-dashboard; then
  bash "$ROOT/scripts/sync_dashboard_api_token.sh" 2>/dev/null || true
fi

if command -v nginx >/dev/null 2>&1; then
  tok=$(grep -E '^API_TOKEN=' "$CONF" 2>/dev/null | tail -1 | cut -d= -f2- || true)
  if [[ -n "$tok" ]]; then
    bash "$ROOT/scripts/lib/sync_nginx_consult_token.sh" "$tok"
    nginx -t 2>/dev/null && systemctl reload nginx 2>/dev/null || true
  fi
fi

echo ""
echo "  Token yenileme: sudo bash scripts/rotate_api_token.sh"
