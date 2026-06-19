#!/usr/bin/env bash
# Telegram setWebhook / getWebhookInfo — prod dogrulama
#   sudo bash scripts/telegram_webhook_register.sh --check
#   sudo bash scripts/telegram_webhook_register.sh --register
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

pick_env_file() {
  local f
  if [[ -n "${WEBHOOK_ENV_FILE:-}" && -f "${WEBHOOK_ENV_FILE}" ]]; then
    echo "${WEBHOOK_ENV_FILE}"
    return 0
  fi
  for f in "/etc/log-guardian/webhook.env" "$ROOT/.env.webhook.local"; do
    if [[ -f "$f" ]]; then
      echo "$f"
      return 0
    fi
  done
  return 1
}

ENV_FILE="$(pick_env_file)" || {
  echo "FAIL: webhook env yok (/etc/log-guardian/webhook.env veya .env.webhook.local)" >&2
  exit 1
}

# Prod dosyasi genelde 600 root — normal kullanici okuyamaz
if [[ ! -r "$ENV_FILE" && "$(id -u)" -ne 0 ]]; then
  echo "[INFO] $ENV_FILE okunamiyor (600 root) — sudo ile yeniden calistiriliyor..."
  exec sudo env WEBHOOK_ENV_FILE="$ENV_FILE" bash "$0" "$@"
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

TOKEN="${LOGANALYZER_TELEGRAM_TOKEN:-}"
API="${WEBHOOK_TELEGRAM_API_BASE:-https://api.telegram.org}"
WH_URL="${WEBHOOK_TELEGRAM_WEBHOOK_URL:-}"
WH_SECRET="${WEBHOOK_TELEGRAM_WEBHOOK_SECRET:-}"
# Laptop tunnel: WEBHOOK_TELEGRAM_WEBHOOK_URL_OVERRIDE=https://....trycloudflare.com/telegram/webhook
[[ -n "${WEBHOOK_TELEGRAM_WEBHOOK_URL_OVERRIDE:-}" ]] && WH_URL="$WEBHOOK_TELEGRAM_WEBHOOK_URL_OVERRIDE"

if [[ -z "$TOKEN" ]]; then
  echo "FAIL: LOGANALYZER_TELEGRAM_TOKEN bos ($ENV_FILE)" >&2
  exit 1
fi

mode="${1:---check}"

echo "=== telegram_webhook_register ($mode) ==="
echo "env: $ENV_FILE"

info=$(curl -sS -m 20 "${API}/bot${TOKEN}/getWebhookInfo")
registered_url=$(echo "$info" | python3 -c "
import json,sys
d=json.load(sys.stdin)
if not d.get('ok'):
    print('getWebhookInfo FAIL:', d.get('description'), file=sys.stderr); sys.exit(1)
r=d.get('result') or {}
url=r.get('url') or ''
print('url:', url or '(bos — long-poll / Bot: POLL)', file=sys.stderr)
print('pending:', r.get('pending_update_count', 0), file=sys.stderr)
if r.get('last_error_message'):
    print('last_error:', r.get('last_error_message'), file=sys.stderr)
print(url)
")

if [[ "$mode" == "--check" ]]; then
  if [[ -z "$registered_url" ]]; then
    echo ""
    echo "Not: Telegram webhook URL kayitli degil — long-poll (Bot: POLL)."
    if [[ -z "${WEBHOOK_TELEGRAM_WEBHOOK_URL:-}" ]]; then
      echo "  Prod: webhook.env WEBHOOK_TELEGRAM_WEBHOOK_URL + nginx"
      echo "  Laptop: bash scripts/telegram_webhook_tunnel_dev.sh --register"
    fi
  elif [[ -z "${WEBHOOK_TELEGRAM_WEBHOOK_URL:-}" && -n "${WEBHOOK_TELEGRAM_WEBHOOK_URL_OVERRIDE:-}" ]]; then
    echo ""
    echo "Not: URL tunnel override ile kayitli (webhook.env WEBHOOK_TELEGRAM_WEBHOOK_URL bos — normal laptop modu)."
  fi
  exit 0
fi

if [[ "$mode" != "--register" ]]; then
  echo "Kullanim: sudo bash $0 [--check|--register]" >&2
  exit 1
fi

if [[ -z "$WH_URL" ]]; then
  echo "FAIL: WEBHOOK_TELEGRAM_WEBHOOK_URL bos ($ENV_FILE)" >&2
  exit 1
fi

payload=$(WH_URL="$WH_URL" WH_SECRET="$WH_SECRET" python3 - <<'PY'
import json, os
url = os.environ["WH_URL"]
sec = os.environ.get("WH_SECRET") or ""
body = {
    "url": url,
    "allowed_updates": ["message", "callback_query"],
    "drop_pending_updates": False,
}
if sec:
    body["secret_token"] = sec
print(json.dumps(body))
PY
)

reg=$(curl -sS -m 20 -X POST "${API}/bot${TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "$payload")
echo "$reg" | python3 -c "
import json,sys
d=json.load(sys.stdin)
if d.get('ok'):
    print('setWebhook OK')
else:
    print('setWebhook FAIL:', d.get('description')); sys.exit(1)
"

echo ""
echo "Sonra log-guardian restart (API + otomatik setWebhook):"
echo "  sudo systemctl restart log-guardian"
echo "Bot /status → Bot: WEBHOOK"
