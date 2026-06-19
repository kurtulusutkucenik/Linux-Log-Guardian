#!/usr/bin/env bash
# Grafana alert → Telegram DM E2E (#30 — LG Ops ayri)
#   bash scripts/grafana_alert_e2e.sh
#   bash scripts/grafana_alert_e2e.sh --check-only   # policy/contact, Telegram yok
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

CHECK_ONLY=0
for arg in "$@"; do
  case "$arg" in
    --check-only) CHECK_ONLY=1 ;;
    -h|--help)
      echo "Kullanim: bash $0 [--check-only]"
      exit 0
      ;;
  esac
done

echo "=== grafana_alert_e2e ==="

if ! curl -sf -u "${GRAFANA_USER:-admin}:${GRAFANA_PASS:-admin}" \
  "${GRAFANA_URL:-http://127.0.0.1:3002}/api/health" >/dev/null 2>&1; then
  echo "[grafana_alert_e2e] Grafana yok — stack baslatiliyor..."
  bash "$ROOT/scripts/grafana_stack.sh"
fi

WH_ENV="/etc/log-guardian/webhook.env"
if [[ -f "$WH_ENV" ]]; then
  if [[ "$CHECK_ONLY" -eq 0 && ! -r "$WH_ENV" && "$(id -u)" -ne 0 ]]; then
    exec sudo bash "$0" "$@"
  fi
  if [[ "$CHECK_ONLY" -eq 1 && ! -r "$WH_ENV" ]]; then
    echo "[grafana_alert_e2e] token atlaniyor (--check-only, webhook.env 600 root)"
  elif [[ -r "$WH_ENV" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$WH_ENV"
    set +a
    export GRAFANA_TELEGRAM_BOT_TOKEN="${GRAFANA_TELEGRAM_BOT_TOKEN:-${LOGANALYZER_TELEGRAM_TOKEN:-}}"
    if [[ -z "${GRAFANA_TELEGRAM_CHAT_ID:-}" ]]; then
      if [[ -n "${LOGANALYZER_TELEGRAM_CHAT_WARN:-}" ]]; then
        GRAFANA_TELEGRAM_CHAT_ID="$LOGANALYZER_TELEGRAM_CHAT_WARN"
      elif [[ -n "${LOGANALYZER_TELEGRAM_CHAT_ID:-}" ]]; then
        GRAFANA_TELEGRAM_CHAT_ID="$LOGANALYZER_TELEGRAM_CHAT_ID"
      fi
    fi
    export GRAFANA_TELEGRAM_CHAT_ID
    export GRAFANA_TELEGRAM_MESSAGE_THREAD_ID="${GRAFANA_TELEGRAM_MESSAGE_THREAD_ID:-${WEBHOOK_TELEGRAM_TOPIC_WARN:-0}}"
    [[ "${GRAFANA_TELEGRAM_MESSAGE_THREAD_ID:-0}" -gt 0 ]] && export GRAFANA_ALLOW_OPS_CHAT=1
  fi
fi

bash "$ROOT/scripts/grafana_telegram_contact.sh" --from-webhook-warn 2>/dev/null || true

export GRAFANA_URL="${GRAFANA_URL:-http://127.0.0.1:3002}"
export GRAFANA_USER="${GRAFANA_USER:-admin}"
export GRAFANA_PASS="${GRAFANA_PASS:-admin}"
[[ "$CHECK_ONLY" -eq 1 ]] && export GRAFANA_ALERT_E2E_SKIP_SEND=1

python3 "$ROOT/scripts/grafana_alert_e2e.py"
