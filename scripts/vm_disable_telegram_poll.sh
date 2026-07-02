#!/usr/bin/env bash
# VM: laptop ile ayni bot token poll catismasini onle (inline butonlar host'ta calisir)
#   sudo bash scripts/vm_disable_telegram_poll.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RULES="${LG_RULES:-/etc/log-guardian/rules.conf}"

[[ "$(id -u)" -eq 0 ]] || { echo "[vm_disable_telegram_poll] sudo gerekli" >&2; exit 1; }
[[ -f "$RULES" ]] || { echo "[vm_disable_telegram_poll] FAIL: $RULES yok" >&2; exit 1; }

upsert() {
  local k="$1" v="$2"
  if grep -q "^${k}=" "$RULES" 2>/dev/null; then
    sed -i "s|^${k}=.*|${k}=${v}|" "$RULES"
  else
    echo "${k}=${v}" >>"$RULES"
  fi
}

# Yalnizca inbound poll kapat — outbound webhook (alarm gonderimi) VM'de kalabilir
upsert WEBHOOK_TELEGRAM_BOT 0
# Eski surum WEBHOOK_ENABLED=0 yapmisti — geri ac
if grep -q '^WEBHOOK_ENABLED=0' "$RULES" 2>/dev/null; then
  upsert WEBHOOK_ENABLED 1
fi

if [[ -f /etc/log-guardian/webhook.env ]]; then
  if grep -q '^WEBHOOK_TELEGRAM_BOT=' /etc/log-guardian/webhook.env 2>/dev/null; then
    sed -i 's/^WEBHOOK_TELEGRAM_BOT=.*/WEBHOOK_TELEGRAM_BOT=0/' /etc/log-guardian/webhook.env
  else
    echo 'WEBHOOK_TELEGRAM_BOT=0' >>/etc/log-guardian/webhook.env
  fi
  if grep -q '^WEBHOOK_ENABLED=0' /etc/log-guardian/webhook.env 2>/dev/null; then
    sed -i 's/^WEBHOOK_ENABLED=0/WEBHOOK_ENABLED=1/' /etc/log-guardian/webhook.env
  fi
fi

systemctl restart log-guardian.service 2>/dev/null || true
echo "[OK] VM Telegram poll kapali — inline butonlar laptop/host'ta calisir"
echo "  WEBHOOK_TELEGRAM_BOT=0 ($RULES)"
echo "  Not: WEBHOOK_ENABLED dokunulmadi (VM alarm gonderimi acik kalir)"
