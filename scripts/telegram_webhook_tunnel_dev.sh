#!/usr/bin/env bash
# Laptop setWebhook — cloudflared quick tunnel (VPS/nginx yok)
#   bash scripts/telegram_webhook_tunnel_dev.sh          # tunnel baslat, URL yazdir
#   bash scripts/telegram_webhook_tunnel_dev.sh --register   # + Telegram setWebhook
#   bash scripts/telegram_webhook_tunnel_dev.sh --check      # API + tunnel + getWebhookInfo
#   bash scripts/telegram_webhook_tunnel_dev.sh --stop       # tunnel durdur + deleteWebhook
#
# Gereksinim: cloudflared (apt install cloudflared), log-guardian API :8090, WEBHOOK_TELEGRAM_BOT=1
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

CACHE="$ROOT/.cache"
LOG="$CACHE/cloudflared-telegram.log"
PIDFILE="$CACHE/cloudflared-telegram.pid"
API_PORT="${GUARDIAN_API_PORT:-8090}"

fail() { echo "[telegram_webhook_tunnel_dev] FAIL: $*" >&2; exit 1; }

find_cloudflared() {
  if command -v cloudflared >/dev/null 2>&1; then
    command -v cloudflared
    return 0
  fi
  if [[ -x "$ROOT/.cache/bin/cloudflared" ]]; then
    echo "$ROOT/.cache/bin/cloudflared"
    return 0
  fi
  if [[ -x /usr/local/bin/cloudflared ]]; then
    echo /usr/local/bin/cloudflared
    return 0
  fi
  return 1
}

read_api_port() {
  local f="$1"
  [[ -f "$f" ]] || return 1
  local p
  p=$(grep -E '^API_PORT=' "$f" 2>/dev/null | tail -1 | cut -d= -f2 | tr -d ' \r')
  [[ -n "$p" && "$p" =~ ^[0-9]+$ ]] || return 1
  echo "$p"
}

if p=$(read_api_port /etc/log-guardian/rules.conf 2>/dev/null); then
  API_PORT="$p"
elif p=$(read_api_port "$ROOT/rules.conf" 2>/dev/null); then
  API_PORT="$p"
fi

tunnel_running() {
  [[ -f "$PIDFILE" ]] || return 1
  local pid
  pid=$(cat "$PIDFILE" 2>/dev/null) || return 1
  kill -0 "$pid" 2>/dev/null
}

tunnel_url() {
  [[ -f "$LOG" ]] || return 1
  # api.trycloudflare.com = cloudflared API; hata satirindan yanlis eslesme olmasin
  local u
  u=$(grep -oE 'https://[[:alnum:]-]+\.trycloudflare\.com' "$LOG" 2>/dev/null \
    | grep -vE '://api\.trycloudflare\.com$' | tail -1)
  [[ -n "$u" ]] || return 1
  if grep -qE 'failed to request quick Tunnel|context deadline exceeded' "$LOG" 2>/dev/null \
     && ! grep -q 'Your quick Tunnel has been created' "$LOG" 2>/dev/null; then
    return 1
  fi
  echo "$u"
}

stop_tunnel() {
  if tunnel_running; then
    kill "$(cat "$PIDFILE")" 2>/dev/null || true
    sleep 1
  fi
  rm -f "$PIDFILE"
  echo "[telegram_webhook_tunnel_dev] tunnel durduruldu"
}

preflight_trycloudflare() {
  if curl -sf --max-time 12 -o /dev/null https://api.trycloudflare.com/ 2>/dev/null; then
    return 0
  fi
  if curl -sf --max-time 12 -o /dev/null -X POST \
      -H 'Content-Type: application/json' \
      -d '{}' https://api.trycloudflare.com/tunnel 2>/dev/null; then
    return 0
  fi
  echo "[telegram_webhook_tunnel_dev] UYARI: api.trycloudflare.com erisilemiyor (timeout)." >&2
  echo "  Muhtemel: ISP/firewall, DNS veya ag kisitlamasi (Turkiye'de sik)." >&2
  echo "  Cozum A — POLL modu (tunnel gerekmez, alarmlar calisir):" >&2
  echo "    bash scripts/telegram_webhook_tunnel_dev.sh --stop   # zaten POLL" >&2
  echo "    sudo systemctl restart log-guardian   # WEBHOOK_TELEGRAM_BOT=1" >&2
  echo "  Cozum B — farkli ag: mobil hotspot / VPN (AB) sonra --register" >&2
  echo "  Cozum C — prod: VPS uzerinde kalici HTTPS webhook (docs/WEBHOOK_SETUP.md)" >&2
  return 1
}

start_tunnel() {
  mkdir -p "$CACHE"
  if tunnel_running; then
    local u
    u=$(tunnel_url || true)
    if [[ -n "$u" ]]; then
      echo "$u"
      return 0
    fi
    stop_tunnel
  fi

  local cf
  cf=$(find_cloudflared) || {
    echo "[telegram_webhook_tunnel_dev] cloudflared yok — kuruluyor..."
    bash "$ROOT/scripts/install_cloudflared.sh" || fail "cloudflared kurulamadi — bash scripts/install_cloudflared.sh"
    cf=$(find_cloudflared) || fail "cloudflared bulunamadi"
  }

  local attempt u=""
  for attempt in 1 2 3; do
    : >"$LOG"
    "$cf" tunnel --url "http://127.0.0.1:${API_PORT}" >>"$LOG" 2>&1 &
    echo $! >"$PIDFILE"
    u=""
    for _ in $(seq 1 60); do
      u=$(tunnel_url || true)
      [[ -n "$u" ]] && break
      if ! kill -0 "$(cat "$PIDFILE" 2>/dev/null)" 2>/dev/null; then
        break
      fi
      sleep 1
    done
    if [[ -n "$u" ]]; then
      echo "$u"
      return 0
    fi
    stop_tunnel
    [[ "$attempt" -lt 3 ]] && echo "[telegram_webhook_tunnel_dev] tunnel deneme $attempt basarisiz — tekrar..." >&2
    sleep 2
  done
  fail "tunnel URL alinamadi (ag/cloudflared?) — cat $LOG"
}

unregister_webhook() {
  local env_file="/etc/log-guardian/webhook.env"
  [[ -f "$env_file" ]] || fail "$env_file yok"
  if [[ ! -r "$env_file" ]]; then
    sudo env WEBHOOK_ENV_FILE="$env_file" bash "$ROOT/scripts/telegram_webhook_tunnel_dev.sh" --stop
    return
  fi
  set -a
  # shellcheck disable=SC1090
  source "$env_file"
  set +a
  [[ -n "${LOGANALYZER_TELEGRAM_TOKEN:-}" ]] || fail "token bos"
  curl -sS -m 20 -X POST \
    "https://api.telegram.org/bot${LOGANALYZER_TELEGRAM_TOKEN}/deleteWebhook" \
    -H "Content-Type: application/json" \
    -d '{"drop_pending_updates":false}' \
    | python3 -c "
import json,sys
d=json.load(sys.stdin)
print('deleteWebhook OK' if d.get('ok') else 'deleteWebhook FAIL: '+str(d.get('description')))
sys.exit(0 if d.get('ok') else 1)
"
  echo "[telegram_webhook_tunnel_dev] long-poll moduna donuldu (Bot: POLL)"
}

check_status() {
  local api_ok=0 tunnel_ok=0 wh_ok=0 u wh_out

  if curl -sf --max-time 3 "http://127.0.0.1:${API_PORT}/api/v1/metrics" >/dev/null 2>&1; then
    api_ok=1
    echo "[OK] API :${API_PORT}"
  else
    echo "[FAIL] API :${API_PORT} yanit vermiyor"
  fi

  if tunnel_running; then
    u=$(tunnel_url || true)
    if [[ -n "$u" ]]; then
      tunnel_ok=1
      echo "[OK] tunnel: $u (pid $(cat "$PIDFILE"))"
    else
      echo "[WARN] tunnel pid var ama URL log'da yok — cat $LOG"
    fi
  else
    echo "[INFO] tunnel calismiyor"
  fi

  ENV_FILE="/etc/log-guardian/webhook.env"
  if [[ -f "$ENV_FILE" ]]; then
    if [[ -r "$ENV_FILE" ]]; then
      wh_out=$(bash "$ROOT/scripts/telegram_webhook_register.sh" --check 2>&1) || true
    else
      wh_out=$(sudo env WEBHOOK_ENV_FILE="$ENV_FILE" bash "$ROOT/scripts/telegram_webhook_register.sh" --check 2>&1) || true
    fi
    echo "$wh_out" | sed 's/^/[webhook] /'
    if echo "$wh_out" | grep -qE 'url: https://'; then
      wh_ok=1
    fi
  else
    echo "[WARN] $ENV_FILE yok"
  fi

  echo ""
  if [[ "$api_ok" -eq 1 && "$tunnel_ok" -eq 1 && "$wh_ok" -eq 1 ]]; then
    echo "[OK] tunnel + setWebhook hazir — bot DM: /status → Bot: WEBHOOK"
    return 0
  fi
  echo "[INFO] eksik adim var — register: bash $0 --register"
  if [[ "$api_ok" -eq 1 && "$wh_ok" -eq 0 && "$tunnel_ok" -eq 0 ]]; then
    echo "[INFO] POLL modu aktif olabilir — Telegram alarmlari tunnel olmadan da gelir (Bot: POLL)"
  fi
  return 1
}

mode="${1:---start}"

case "$mode" in
  --stop)
    stop_tunnel
    unregister_webhook 2>/dev/null || echo "[INFO] deleteWebhook atlandi (webhook.env okunamadi)"
    exit 0
    ;;
  --check)
    check_status
    exit $?
    ;;
  --register|--start)
    ;;
  *)
    echo "Kullanim: bash $0 [--start|--register|--check|--stop]" >&2
    exit 1
    ;;
esac

echo "[telegram_webhook_tunnel_dev] API :${API_PORT} kontrol..."
if ! curl -sf --max-time 3 "http://127.0.0.1:${API_PORT}/api/v1/metrics" >/dev/null 2>&1; then
  echo "[telegram_webhook_tunnel_dev] API yanit vermiyor — onarim deneniyor..."
  if [[ "$(id -u)" -eq 0 ]]; then
    AUTO_RESTART=1 AUTO_FIX=1 bash "$ROOT/scripts/ensure_guardian_api.sh" \
      || fail "API ayakta degil — sudo bash scripts/fix_analyzer.sh"
  else
    sudo env AUTO_RESTART=1 AUTO_FIX=1 bash "$ROOT/scripts/ensure_guardian_api.sh" \
      || fail "API ayakta degil — sudo bash scripts/fix_analyzer.sh"
  fi
fi

preflight_trycloudflare || fail "cloudflared quick tunnel agdan ulasilamiyor — yukaridaki POLL alternatifini kullanin"

BASE_URL=$(start_tunnel)
WH_URL="${BASE_URL}/telegram/webhook"
echo "[telegram_webhook_tunnel_dev] tunnel: $WH_URL"
echo "  log: $LOG"
echo "  pid: $(cat "$PIDFILE")"

if [[ "$mode" == "--start" ]]; then
  echo ""
  echo "Sonraki: bash scripts/telegram_webhook_tunnel_dev.sh --register"
  echo "Durdur:  bash scripts/telegram_webhook_tunnel_dev.sh --stop"
  exit 0
fi

export WEBHOOK_TELEGRAM_WEBHOOK_URL_OVERRIDE="$WH_URL"
ENV_FILE="/etc/log-guardian/webhook.env"
[[ -f "$ENV_FILE" ]] || fail "$ENV_FILE yok"
if [[ ! -r "$ENV_FILE" && "$(id -u)" -ne 0 ]]; then
  sudo env WEBHOOK_ENV_FILE="$ENV_FILE" \
    WEBHOOK_TELEGRAM_WEBHOOK_URL_OVERRIDE="$WH_URL" \
    bash "$ROOT/scripts/telegram_webhook_register.sh" --register
else
  env WEBHOOK_ENV_FILE="$ENV_FILE" \
    WEBHOOK_TELEGRAM_WEBHOOK_URL_OVERRIDE="$WH_URL" \
    bash "$ROOT/scripts/telegram_webhook_register.sh" --register
fi

echo ""
echo "[OK] setWebhook kayitli — bot DM: /status → Bot: WEBHOOK beklenir"
echo "  Tunnel kapaninca: bash scripts/telegram_webhook_tunnel_dev.sh --stop"
