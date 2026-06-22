#!/usr/bin/env bash
# Telefon videosu — Telegram KRİTİK WAF + IP BANLANDI (gerçek webhook, sudo)
#   sudo bash scripts/telegram_video_alert.sh
# Önce Telegram açık; sonra bu komut; 5–10 sn içinde 2 bildirim gelir.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ $EUID -ne 0 ]]; then
  echo "[telegram_video] sudo gerekli (ipset + /etc/log-guardian)" >&2
  echo "  sudo bash scripts/telegram_video_alert.sh" >&2
  exit 1
fi

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Telegram video — WAF alarm + kernel ban                 ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "  📱 Telegram uygulamasını açın (bildirimler açık)"
echo "  Beklenen: KRİTİK ALARM (WAF) + IP BANLANDI"
echo "  Test IP: 203.0.113.198 (RFC5737 — gercek ban degil, demo)"
echo ""

exec bash "$ROOT/scripts/webhook_prod_e2e.sh"
