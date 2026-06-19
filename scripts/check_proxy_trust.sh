#!/usr/bin/env bash
# nginx + rules.conf XFF / reverse-proxy teshisi
#   bash scripts/check_proxy_trust.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONF="${LG_RULES:-/etc/log-guardian/rules.conf}"
[[ -f "$CONF" ]] || CONF="$ROOT/rules.conf"

trust_xff="0"
if grep -qE '^TRUST_XFF=1' "$CONF" 2>/dev/null; then
  trust_xff="1"
fi

cf_realip=0 proxy_pass=0 xff_in_log=0
if command -v nginx >/dev/null 2>&1; then
  nginx -T 2>/dev/null | grep -q 'real_ip_header' && cf_realip=1 || true
  nginx -T 2>/dev/null | grep -q 'proxy_pass' && proxy_pass=1 || true
  nginx -T 2>/dev/null | grep -q 'http_x_forwarded_for' && xff_in_log=1 || true
fi

echo "=== check_proxy_trust ==="
echo "  rules.conf       : $CONF"
echo "  TRUST_XFF        : $trust_xff"
echo "  nginx real_ip    : $cf_realip"
echo "  nginx proxy_pass : $proxy_pass"
echo "  log has XFF fld  : $xff_in_log"
echo ""

if [[ "$cf_realip" -eq 1 ]]; then
  echo "[OK] Cloudflare/real_ip kullaniliyor — TRUST_XFF=0 yeterli (\$remote_addr gercek IP)"
  exit 0
fi

if [[ "$proxy_pass" -eq 1 && "$trust_xff" -eq 0 ]]; then
  echo "[OK] nginx dogrudan istemci goruyor (proxy_pass arka uca) — TRUST_XFF=0 dogru"
  echo "     Ornek log: curl -H 'X-Forwarded-For: 1.2.3.4' http://127.0.0.1/ — parser XFF'yi yok sayar"
  exit 0
fi

if [[ "$trust_xff" -eq 1 ]]; then
  cidrs=$(grep -E '^TRUST_PROXY_CIDRS=' "$CONF" 2>/dev/null | tail -1 | cut -d= -f2- || true)
  if [[ -n "$cidrs" ]]; then
    echo "[OK] TRUST_XFF=1 + TRUST_PROXY_CIDRS ayarli"
    echo "     $cidrs"
    exit 0
  fi
  echo "[WARN] TRUST_XFF=1 ama TRUST_PROXY_CIDRS yok — examples/rules/proxy-trust.conf ekleyin"
  exit 1
fi

echo "[OK] Varsayilan guvenli mod (TRUST_XFF=0)"
exit 0
