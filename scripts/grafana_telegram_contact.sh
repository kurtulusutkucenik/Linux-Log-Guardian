#!/usr/bin/env bash
# Grafana Telegram contact point — LG Ops grubundan AYRI (#30)
#   bash scripts/grafana_telegram_contact.sh --from-webhook-warn
#   bash scripts/grafana_telegram_contact.sh --from-webhook-warn --test
#
# Manuel:
#   cp deploy/grafana.telegram.env.example .env.grafana.telegram.local
#   bash scripts/grafana_telegram_contact.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

FROM_WARN=0
DO_TEST=0
for arg in "$@"; do
  case "$arg" in
    --from-webhook-warn) FROM_WARN=1 ;;
    --test) DO_TEST=1 ;;
    -h|--help)
      echo "Kullanim: bash $0 [--from-webhook-warn] [--test]"
      echo "  --from-webhook-warn  webhook.env: TOKEN + CHAT_WARN (DM) veya CHAT_ID + TOPIC_WARN (forum)"
      exit 0
      ;;
  esac
done

if [[ "$FROM_WARN" -eq 1 ]]; then
  WH_ENV="/etc/log-guardian/webhook.env"
  if [[ ! -f "$WH_ENV" ]]; then
    echo "[grafana_telegram_contact] FAIL: $WH_ENV yok" >&2
    exit 1
  fi
  if [[ ! -r "$WH_ENV" ]]; then
    exec sudo env GRAFANA_CONTACT_TEST="$DO_TEST" bash "$0" --from-webhook-warn "$([[ "$DO_TEST" -eq 1 ]] && echo --test)"
  fi
  set -a
  # shellcheck disable=SC1090
  source "$WH_ENV"
  set +a
  export GRAFANA_TELEGRAM_BOT_TOKEN="${GRAFANA_TELEGRAM_BOT_TOKEN:-${LOGANALYZER_TELEGRAM_TOKEN:-}}"
  # DM (CHAT_WARN) veya tek supergroup (CHAT_ID) + opsiyonel forum topic
  if [[ -z "${GRAFANA_TELEGRAM_CHAT_ID:-}" ]]; then
    if [[ -n "${LOGANALYZER_TELEGRAM_CHAT_WARN:-}" ]]; then
      GRAFANA_TELEGRAM_CHAT_ID="$LOGANALYZER_TELEGRAM_CHAT_WARN"
    elif [[ -n "${LOGANALYZER_TELEGRAM_CHAT_ID:-}" ]]; then
      GRAFANA_TELEGRAM_CHAT_ID="$LOGANALYZER_TELEGRAM_CHAT_ID"
    fi
  fi
  export GRAFANA_TELEGRAM_CHAT_ID
  export GRAFANA_TELEGRAM_MESSAGE_THREAD_ID="${GRAFANA_TELEGRAM_MESSAGE_THREAD_ID:-${WEBHOOK_TELEGRAM_TOPIC_WARN:-0}}"
  if [[ "${GRAFANA_TELEGRAM_MESSAGE_THREAD_ID:-0}" -gt 0 ]]; then
    export GRAFANA_ALLOW_OPS_CHAT=1
    echo "[grafana_telegram_contact] Ops grubu #warn topic=${GRAFANA_TELEGRAM_MESSAGE_THREAD_ID} → Grafana contact"
  else
    echo "[grafana_telegram_contact] webhook WARN DM → Grafana contact (CRIT/Ops kanali kullanilmaz)"
  fi
fi

ENV_LOCAL="$ROOT/.env.grafana.telegram.local"
if [[ -f "$ENV_LOCAL" && "$FROM_WARN" -eq 0 ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_LOCAL"
  set +a
fi

export GRAFANA_URL="${GRAFANA_URL:-http://127.0.0.1:3002}"
export GRAFANA_USER="${GRAFANA_USER:-admin}"
export GRAFANA_PASS="${GRAFANA_PASS:-admin}"
export GRAFANA_CONTACT_TEST="$DO_TEST"

python3 "$ROOT/scripts/grafana_contact_provision.py"

if [[ "$DO_TEST" -eq 1 && -n "${GRAFANA_TELEGRAM_BOT_TOKEN:-}" && -n "${GRAFANA_TELEGRAM_CHAT_ID:-}" ]]; then
  if [[ "${GRAFANA_TELEGRAM_MESSAGE_THREAD_ID:-0}" -gt 0 ]]; then
    msg="✅ Grafana contact OK — #warn (topic ${GRAFANA_TELEGRAM_MESSAGE_THREAD_ID}) — Log Guardian metrik alarmlari buraya (#waf/#ban ayri kalir)"
  else
    msg="✅ Grafana contact OK — operator DM — Log Guardian metrik alarmlari buraya (#waf/#ban LG Ops'ta kalir)"
  fi
  tg_args=(
    --data-urlencode "chat_id=${GRAFANA_TELEGRAM_CHAT_ID}"
    --data-urlencode "text=${msg}"
    --data-urlencode "disable_web_page_preview=true"
  )
  if [[ "${GRAFANA_TELEGRAM_MESSAGE_THREAD_ID:-0}" -gt 0 ]]; then
    tg_args+=(--data-urlencode "message_thread_id=${GRAFANA_TELEGRAM_MESSAGE_THREAD_ID}")
  fi
  resp=$(curl -sS -m 15 \
    "https://api.telegram.org/bot${GRAFANA_TELEGRAM_BOT_TOKEN}/sendMessage" \
    "${tg_args[@]}")
  if echo "$resp" | python3 -c "import json,sys; d=json.load(sys.stdin); sys.exit(0 if d.get('ok') else 1)"; then
    if [[ "${GRAFANA_TELEGRAM_MESSAGE_THREAD_ID:-0}" -gt 0 ]]; then
      echo "[OK] Telegram test mesaji gonderildi (Ops #warn topic=${GRAFANA_TELEGRAM_MESSAGE_THREAD_ID})"
      echo "  Sonraki: bash scripts/grafana_alert_e2e.sh  (gercek FIRING formati)"
    else
      echo "[OK] Telegram test mesaji gonderildi (DM — Ops grubu degil)"
      echo "  Sonraki: bash scripts/grafana_alert_e2e.sh"
    fi
  else
    echo "[WARN] Telegram test basarisiz: $resp" >&2
    exit 1
  fi
fi
