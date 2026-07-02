#!/usr/bin/env bash
# Telegram inline buton (Gordum/Sessiz/WL/Unban) teshis
#   bash scripts/telegram_inline_button_check.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail=0
ok() { echo "  [OK] $*"; }
warn() { echo "  [WARN] $*"; }
bad() { echo "  [FAIL] $*"; fail=$((fail + 1)); }

pick_env() {
  for f in "/etc/log-guardian/webhook.env" "$ROOT/.env.webhook.local"; do
    [[ -f "$f" ]] || continue
    if [[ -r "$f" ]]; then
      echo "$f"
      return 0
    fi
  done
  return 1
}

echo "=== telegram_inline_button_check ==="

ENV_FILE="$(pick_env)" || { bad "webhook env yok"; exit 1; }
echo "env: $ENV_FILE"
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

TOKEN="${LOGANALYZER_TELEGRAM_TOKEN:-}"
[[ -n "$TOKEN" ]] || { bad "LOGANALYZER_TELEGRAM_TOKEN bos"; exit 1; }

echo "--- getWebhookInfo ---"
wh=$(curl -sS -m 15 "https://api.telegram.org/bot${TOKEN}/getWebhookInfo" || true)
wh_url=$(echo "$wh" | python3 -c "import json,sys; d=json.load(sys.stdin); print((d.get('result') or {}).get('url') or '')" 2>/dev/null || true)
if [[ -n "$wh_url" ]]; then
  warn "setWebhook aktif: $wh_url"
  echo "       Inbound butonlar HTTPS webhook gerektirir (nginx/tunnel -> :8090/telegram/webhook)"
else
  ok "setWebhook bos — POLL modu (nginx gerekmez)"
fi

echo "--- log-guardian poll ---"
if systemctl is-active --quiet log-guardian.service 2>/dev/null; then
  ok "log-guardian.service active"
  if journalctl -u log-guardian.service -b --no-pager 2>/dev/null \
      | grep -qE 'long-poll acik|webhook modu'; then
    ok "journal: telegram bot modu kayitli"
  else
    warn "journal'da telegram bot satiri yok —: sudo systemctl restart log-guardian"
  fi
else
  warn "log-guardian.service kapali — butonlar calismaz"
fi

echo "--- getUpdates catisma (409) ---"
upd=$(curl -sS -m 8 "https://api.telegram.org/bot${TOKEN}/getUpdates?limit=1&timeout=1" || true)
if echo "$upd" | grep -q '"error_code":409'; then
  ok "409 Conflict — baska bir log-guardian poll aktif (normal, servis dinliyor)"
elif echo "$upd" | python3 -c "import json,sys; d=json.load(sys.stdin); sys.exit(0 if d.get('ok') else 1)" 2>/dev/null; then
  warn "getUpdates bos/ok — servis poll calismiyor olabilir"
else
  warn "getUpdates beklenmedik cevap"
fi

echo "--- coklu instance ---"
n=$(pgrep -c log-guardian 2>/dev/null || echo 0)
if [[ "$n" -le 2 ]]; then
  ok "log-guardian proses sayisi: $n"
else
  bad "birden fazla log-guardian ($n) — VM+laptop ayni token poll catismasi"
  echo "       VM icinde: sudo bash scripts/vm_disable_telegram_poll.sh"
fi

if hostname 2>/dev/null | grep -qi virtualbox; then
  warn "VirtualBox VM — Telegram poll burada kapali olmali (host laptop ops)"
  grep -q '^WEBHOOK_TELEGRAM_BOT=0' /etc/log-guardian/rules.conf 2>/dev/null \
    && ok "VM: WEBHOOK_TELEGRAM_BOT=0" \
    || bad "VM: sudo bash scripts/vm_disable_telegram_poll.sh"
fi

echo "--- nginx (opsiyonel) ---"
if command -v nginx >/dev/null 2>&1; then
  ok "nginx kurulu (webhook modu icin)"
else
  ok "nginx yok — POLL modunda sorun degil"
fi

echo ""
echo "Buton testi:"
echo "  1) Telegram kanalda butona bas (Gordum / Sessiz / WL / Unban / Sesi ac)"
echo "  2) journalctl -u log-guardian -f | grep TELEGRAM"
echo "  3) WL/Sessiz geri al: bash scripts/telegram_operator_undo.sh <IP>"

if [[ "$fail" -eq 0 ]]; then
  echo "[OK] telegram_inline_button_check"
  exit 0
fi
echo "[FAIL] telegram_inline_button_check — $fail madde" >&2
exit 1
