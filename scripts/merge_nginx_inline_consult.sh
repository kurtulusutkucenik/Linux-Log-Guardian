#!/usr/bin/env bash
# /etc/log-guardian/rules.conf — API consult port (inline nginx WAF)
#   sudo bash scripts/merge_nginx_inline_consult.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONF="${LG_RULES:-/etc/log-guardian/rules.conf}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "sudo ile calistirin: sudo bash scripts/merge_nginx_inline_consult.sh" >&2
  exit 1
fi

if [[ ! -f "$CONF" ]]; then
  install -d /etc/log-guardian
  install -m 600 "$ROOT/rules.conf" "$CONF"
  echo "[OK] rules.conf kuruldu: $CONF"
fi

changed=0
if grep -qE '^API_PORT=' "$CONF" 2>/dev/null; then
  if ! grep -qE '^API_PORT=8090' "$CONF"; then
    sed -i 's/^API_PORT=.*/API_PORT=8090/' "$CONF"
    changed=1
    echo "[OK] API_PORT=8090 olarak guncellendi"
  fi
else
  echo "API_PORT=8090" >>"$CONF"
  changed=1
  echo "[OK] API_PORT=8090 eklendi"
fi

if [[ "$changed" -eq 1 ]]; then
  echo "[INFO] systemctl restart log-guardian"
else
  echo "[OK] API consult port zaten tanimli (8090)"
fi

SNIP="$ROOT/examples/nginx/snippets/log-guardian-inline-consult.conf"
SITE="$ROOT/examples/nginx/log-guardian-inline-site.conf"
echo ""
echo "nginx snippet:"
echo "  include $SNIP;"
echo "  veya tam ornek: $SITE"
