#!/usr/bin/env bash
# Operator uyari — yalnizca Telegram mesaji (ban/WAF hattina dokunmaz)
#   bash scripts/operator_telegram_notify.sh "Sabah gate: competitive_proof 77/79"
#   TELEGRAM_NOTIFY=0 bash scripts/operator_telegram_notify.sh "..."  # sessiz
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MSG="${1:-}"
[[ -n "$MSG" ]] || exit 0
[[ "${TELEGRAM_NOTIFY:-1}" != "0" ]] || exit 0

ENV_FILE="${WEBHOOK_ENV_FILE:-}"
if [[ -z "$ENV_FILE" ]]; then
  for cand in "$ROOT/.env.webhook.local" /etc/log-guardian/webhook.env; do
    if [[ -r "$cand" ]]; then
      ENV_FILE="$cand"
      break
    fi
    if [[ -f "$cand" ]] && sudo -n test -r "$cand" 2>/dev/null; then
      ENV_FILE="$cand"
      break
    fi
  done
fi

load_env() {
  local f="$1"
  if [[ -r "$f" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$f"
    set +a
    return 0
  fi
  if [[ -f "$f" ]] && sudo -n test -r "$f" 2>/dev/null; then
    while IFS= read -r line; do
      case "$line" in
        LOGANALYZER_TELEGRAM_TOKEN=*|LOGANALYZER_TELEGRAM_CHAT_*=*|LOGANALYZER_TELEGRAM_CHAT_ID=*)
          export "$line"
          ;;
      esac
    done < <(sudo -n grep -E '^(LOGANALYZER_TELEGRAM_TOKEN|LOGANALYZER_TELEGRAM_CHAT_)' "$f" 2>/dev/null || true)
    return 0
  fi
  return 1
}

if [[ -z "${ENV_FILE:-}" ]] || ! load_env "$ENV_FILE"; then
  echo "[operator_telegram_notify] webhook env yok — atlandi" >&2
  exit 0
fi

TOKEN="${LOGANALYZER_TELEGRAM_TOKEN:-}"
CHAT="${LOGANALYZER_TELEGRAM_CHAT_WARN:-${LOGANALYZER_TELEGRAM_CHAT_ID:-}}"
[[ -n "$TOKEN" && -n "$CHAT" ]] || {
  echo "[operator_telegram_notify] token/chat yok — atlandi" >&2
  exit 0
}

TEXT="[Log Guardian ops]
${MSG}"
payload=$(python3 -c 'import json,sys; print(json.dumps({"chat_id": sys.argv[1], "text": sys.argv[2]}))' "$CHAT" "$TEXT")

if curl -sfS -m 20 -X POST \
  "https://api.telegram.org/bot${TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d "$payload" >/dev/null; then
  echo "[OK] operator_telegram_notify -> chat ${CHAT}"
else
  echo "[WARN] operator_telegram_notify FAIL" >&2
  exit 0
fi
