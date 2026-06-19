#!/usr/bin/env bash
# nginx Telegram webhook snippet kurulumu
#   sudo bash scripts/install_nginx_telegram_webhook.sh
#
# NOT: examples/nginx/...conf dosyasini bash ile CALISTIRMAYIN — nginx include eder.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/examples/nginx/snippets/log-guardian-telegram-webhook.conf"
DEST="${NGINX_SNIPPET_DIR:-/etc/nginx/snippets}/log-guardian-telegram-webhook.conf"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "sudo ile calistirin: sudo bash scripts/install_nginx_telegram_webhook.sh" >&2
  exit 1
fi

[[ -f "$SRC" ]] || { echo "FAIL: snippet yok: $SRC" >&2; exit 1; }

install -d "$(dirname "$DEST")"
install -m 644 "$SRC" "$DEST"
echo "[OK] kuruldu: $DEST"

echo ""
echo "HTTPS server {} blogunuza ekleyin:"
echo "  include snippets/log-guardian-telegram-webhook.conf;"
echo ""
echo "webhook.env (ornek):"
echo "  WEBHOOK_TELEGRAM_WEBHOOK_URL=https://YOUR_DOMAIN/telegram/webhook"
echo "  WEBHOOK_TELEGRAM_WEBHOOK_SECRET=uzun-rastgele-dize"
echo ""
echo "Sonra:"
echo "  sudo nginx -t && sudo systemctl reload nginx"
echo "  sudo systemctl restart log-guardian"
echo "  sudo bash scripts/telegram_webhook_register.sh --check"
