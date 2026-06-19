#!/usr/bin/env bash
# Webhook env -> yerel rules snippet (.cache/ — Git disi)
#
# Oncelik (token tekrar yazma):
#   1. WEBHOOK_ENV_FILE
#   2. /etc/log-guardian/webhook.env  (prod — systemd drop-in)
#   3. .env.webhook.local             (laptop override)
#
#   bash scripts/webhook_apply_local.sh
#   bash scripts/webhook_apply_local.sh --test alert
#
# Token yok / ag istemiyorum: bash scripts/webhook_apply_local.sh --dev
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

OUT="${WEBHOOK_RULES_OUT:-$ROOT/.cache/webhook.local.rules.conf}"
SNIPPET="$ROOT/.cache/webhook.local.env"
DEV_MODE=0
[[ "${1:-}" == "--dev" ]] && DEV_MODE=1 && shift

fail() { echo "[webhook_apply_local] FAIL: $*" >&2; exit 1; }

env_has_channel() {
  local f="$1"
  [[ -f "$f" && -r "$f" ]] || return 1
  if grep -qE '^LOGANALYZER_GENERIC_WEBHOOK_URL=.+' "$f" 2>/dev/null; then
    return 0
  fi
  grep -qE '^LOGANALYZER_TELEGRAM_TOKEN=.+' "$f" 2>/dev/null || return 1
  if grep -qE '^WEBHOOK_TELEGRAM_ROUTE=1' "$f" 2>/dev/null; then
    grep -qE '^LOGANALYZER_TELEGRAM_CHAT_CRIT=.+' "$f" 2>/dev/null \
      && grep -qE '^LOGANALYZER_TELEGRAM_CHAT_WARN=.+' "$f" 2>/dev/null
  else
    grep -qE '^LOGANALYZER_TELEGRAM_CHAT_ID=.+' "$f" 2>/dev/null \
      || grep -qE '^LOGANALYZER_TELEGRAM_CHAT_IDS=.+' "$f" 2>/dev/null
  fi
}

pick_env_file() {
  if [[ -n "${WEBHOOK_ENV_FILE:-}" && -f "${WEBHOOK_ENV_FILE}" ]]; then
    echo "${WEBHOOK_ENV_FILE}"
    return 0
  fi
  local prod="/etc/log-guardian/webhook.env"
  local local_env="$ROOT/.env.webhook.local"
  if [[ -f "$prod" ]]; then
    if [[ -r "$prod" ]] && env_has_channel "$prod"; then
      echo "$prod"
      return 0
    fi
    if [[ ! -r "$prod" ]]; then
      echo "$prod"
      return 0
    fi
    if [[ -f "$local_env" ]] && env_has_channel "$local_env"; then
      echo "[webhook_apply_local] $prod token yok — .env.webhook.local kullaniliyor" >&2
      echo "$local_env"
      return 0
    fi
    echo "$prod"
    return 0
  fi
  if [[ -f "$local_env" ]]; then
    echo "$local_env"
    return 0
  fi
  return 1
}

ENV_FILE="$(pick_env_file)" || ENV_FILE="$ROOT/.env.webhook.local"
PROD_ENV=0
[[ "$ENV_FILE" == "/etc/log-guardian/webhook.env" ]] && PROD_ENV=1

if [[ "$DEV_MODE" -eq 0 && "$PROD_ENV" -eq 1 && ! -r "$ENV_FILE" ]]; then
  echo "[webhook_apply_local] $ENV_FILE okunamiyor (600) — sudo ile yeniden calistiriliyor..."
  exec sudo env WEBHOOK_ENV_FILE="$ENV_FILE" bash "$0" "$@"
fi

if [[ "$DEV_MODE" -eq 1 ]]; then
  if [[ ! -f "$ENV_FILE" ]]; then
    cp "$ROOT/deploy/webhook.local.env.example" "$ENV_FILE"
  fi
  export WEBHOOK_DRY_RUN=1
  export LOGANALYZER_TELEGRAM_TOKEN="${LOGANALYZER_TELEGRAM_TOKEN:-000000000:FAKE}"
  export LOGANALYZER_TELEGRAM_CHAT_ID="${LOGANALYZER_TELEGRAM_CHAT_ID:--1001234567890}"
  # Gecici env — .env dosyasina token yazmadan devam
  TMP_DEV="$(mktemp)"
  trap 'rm -f "$TMP_DEV"' EXIT
  {
    grep -v '^[[:space:]]*#' "$ENV_FILE" | grep -v '^[[:space:]]*$' || true
    echo "WEBHOOK_DRY_RUN=1"
    echo "LOGANALYZER_TELEGRAM_TOKEN=$LOGANALYZER_TELEGRAM_TOKEN"
    echo "LOGANALYZER_TELEGRAM_CHAT_ID=$LOGANALYZER_TELEGRAM_CHAT_ID"
  } >"$TMP_DEV"
  ENV_FILE="$TMP_DEV"
  echo "[webhook_apply_local] --dev: FAKE token + DRY_RUN (ag gonderimi yok)"
fi

[[ -f "$ENV_FILE" ]] || fail "Webhook env yok — prod: sudo bash scripts/webhook_install_prod.sh
  veya: cp deploy/webhook.local.env.example .env.webhook.local
  dry-run: bash scripts/webhook_apply_local.sh --dev"

mkdir -p "$(dirname "$OUT")"
chmod 700 "$(dirname "$OUT")" 2>/dev/null || true

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

if [[ "$PROD_ENV" -eq 1 ]]; then
  echo "[webhook_apply_local] prod env: $ENV_FILE ( .env.webhook.local gerekmez )"
else
  grep -v '^[[:space:]]*#' "$ENV_FILE" | grep -v '^[[:space:]]*$' >"$SNIPPET"
  chmod 600 "$SNIPPET"
fi

cat >"$OUT" <<EOF
# Uretildi: webhook_apply_local.sh — GIT'E EKLEME
WEBHOOK_ENABLED=${WEBHOOK_ENABLED:-1}
WEBHOOK_MIN_LEVEL=${WEBHOOK_MIN_LEVEL:-2}
WEBHOOK_COOLDOWN_SEC=${WEBHOOK_COOLDOWN_SEC:-60}
METRICS_PORT=0
DB_ENABLED=0
AUTO_BAN=0
EOF
chmod 600 "$OUT"

channels=0
if [[ "${WEBHOOK_TELEGRAM_ROUTE:-0}" == "1" ]]; then
  if [[ -n "${LOGANALYZER_TELEGRAM_TOKEN:-}" && -n "${LOGANALYZER_TELEGRAM_CHAT_CRIT:-}" && -n "${LOGANALYZER_TELEGRAM_CHAT_WARN:-}" ]]; then
    channels=$((channels + 1)) && echo "  Telegram (route CRIT/WARN): OK"
  fi
else
  [[ -n "${LOGANALYZER_TELEGRAM_TOKEN:-}" && -n "${LOGANALYZER_TELEGRAM_CHAT_ID:-}" ]] \
    && channels=$((channels + 1)) && echo "  Telegram: OK"
fi
[[ -n "${LOGANALYZER_GENERIC_WEBHOOK_URL:-}" ]] && channels=$((channels + 1)) && echo "  Generic: OK"

if [[ "$channels" -lt 1 ]]; then
  fail "En az bir kanal yapilandirilmamis ($ENV_FILE)

  Gercek Telegram icin .env.webhook.local icinde su satirlari acip doldurun:
    LOGANALYZER_TELEGRAM_TOKEN=123456789:ABC...
    LOGANALYZER_TELEGRAM_CHAT_ID=-1001234567890
  Sonra: sudo bash scripts/webhook_install_prod.sh --test-all

  Token yok / ag istemiyorum: bash scripts/webhook_apply_local.sh --dev --test alert"
fi

echo "=== webhook_apply_local ==="
echo "  env=$ENV_FILE"
echo "  rules=$OUT"
echo "  kanal=$channels  DRY_RUN=${WEBHOOK_DRY_RUN:-0}"

if [[ "${1:-}" == "--test" ]]; then
  LG_QUIET_BUILD=1 make -s log-guardian
  kind="${2:-alert}"
  export WEBHOOK_ENABLED WEBHOOK_MIN_LEVEL WEBHOOK_COOLDOWN_SEC
  export LOGANALYZER_TELEGRAM_TOKEN LOGANALYZER_TELEGRAM_CHAT_ID
  export LOGANALYZER_TELEGRAM_CHAT_CRIT LOGANALYZER_TELEGRAM_CHAT_WARN
  export WEBHOOK_TELEGRAM_ROUTE
  export LOGANALYZER_GENERIC_WEBHOOK_URL
  export WEBHOOK_DRY_RUN="${WEBHOOK_DRY_RUN:-0}"
  ./log-guardian webhook-test "$kind" --quiet --rules "$OUT"
  echo "[OK] webhook-test $kind"
fi

echo ""
echo "Prod kurulum (systemd + rules.conf — sudo):"
echo "  sudo bash scripts/webhook_install_prod.sh"
echo "  sudo bash scripts/webhook_install_prod.sh --test-all"
echo ""
echo "GitHub oncesi: rm -f .env.webhook.local $SNIPPET  (veya bos birak)"
