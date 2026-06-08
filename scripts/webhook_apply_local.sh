#!/usr/bin/env bash
# .env.webhook.local -> yerel rules snippet (GitHub disi, .cache/ altinda)
#   cp deploy/webhook.local.env.example .env.webhook.local
#   # URL/token doldur
#   bash scripts/webhook_apply_local.sh
#   bash scripts/webhook_apply_local.sh --test alert
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${WEBHOOK_ENV_FILE:-$ROOT/.env.webhook.local}"
OUT="${WEBHOOK_RULES_OUT:-$ROOT/.cache/webhook.local.rules.conf}"
SNIPPET="$ROOT/.cache/webhook.local.env"

fail() { echo "[webhook_apply_local] FAIL: $*" >&2; exit 1; }

[[ -f "$ENV_FILE" ]] || fail "$ENV_FILE yok — cp deploy/webhook.local.env.example .env.webhook.local"

mkdir -p "$(dirname "$OUT")"
chmod 700 "$(dirname "$OUT")" 2>/dev/null || true

# Hassas degerleri ayri env dosyasina (rules.conf icine token yazma tercih: env)
grep -v '^[[:space:]]*#' "$ENV_FILE" | grep -v '^[[:space:]]*$' >"$SNIPPET"
chmod 600 "$SNIPPET"

set -a
# shellcheck disable=SC1090
source "$SNIPPET"
set +a

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
[[ -n "${LOGANALYZER_DISCORD_WEBHOOK_URL:-}" ]] && channels=$((channels + 1)) && echo "  Discord: OK"
[[ -n "${LOGANALYZER_TELEGRAM_TOKEN:-}" && -n "${LOGANALYZER_TELEGRAM_CHAT_ID:-}" ]] && channels=$((channels + 1)) && echo "  Telegram: OK"
[[ -n "${LOGANALYZER_SLACK_WEBHOOK_URL:-}" ]] && channels=$((channels + 1)) && echo "  Slack: OK"
[[ -n "${LOGANALYZER_GENERIC_WEBHOOK_URL:-}" ]] && channels=$((channels + 1)) && echo "  Generic: OK"

[[ "$channels" -ge 1 ]] || fail "En az bir webhook URL/token doldurun ($ENV_FILE)"

echo "=== webhook_apply_local ==="
echo "  env=$SNIPPET"
echo "  rules=$OUT"
echo "  kanal=$channels  DRY_RUN=${WEBHOOK_DRY_RUN:-0}"

if [[ "${1:-}" == "--test" ]]; then
  LG_QUIET_BUILD=1 make -s log-guardian
  kind="${2:-alert}"
  export WEBHOOK_ENABLED WEBHOOK_MIN_LEVEL WEBHOOK_COOLDOWN_SEC
  export LOGANALYZER_DISCORD_WEBHOOK_URL LOGANALYZER_SLACK_WEBHOOK_URL
  export LOGANALYZER_TELEGRAM_TOKEN LOGANALYZER_TELEGRAM_CHAT_ID
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
