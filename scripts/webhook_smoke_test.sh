#!/usr/bin/env bash
# Webhook yapilandirma smoke — ag gondermez (WEBHOOK_DRY_RUN=1)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

make -s log-guardian

CACHE="$ROOT/.cache"
mkdir -p "$CACHE"
RULES="$CACHE/webhook_smoke.conf"
cat > "$RULES" <<EOF
WEBHOOK_ENABLED=1
WEBHOOK_MIN_LEVEL=2
METRICS_PORT=0
EOF

unset LOGANALYZER_GENERIC_WEBHOOK_URL WEBHOOK_TELEGRAM_API_BASE || true
export WEBHOOK_DRY_RUN=1
export LOGANALYZER_DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/000000000000000000/FAKE_TOKEN"
export LOGANALYZER_SLACK_WEBHOOK_URL="https://hooks.slack.com/services/T00/B00/FAKE"
export LOGANALYZER_TELEGRAM_TOKEN="000000000:FAKE"
export LOGANALYZER_TELEGRAM_CHAT_ID="-1001234567890"

out=$(./log-guardian --status --rules "$RULES" 2>/dev/null)
echo "$out" | grep -q '"enabled":true' || { echo "[webhook_smoke] enabled=false"; exit 1; }
echo "$out" | grep -q '"notifications"' || { echo "[webhook_smoke] notifications yok"; exit 1; }
echo "$out" | grep -q '"discord":true' || { echo "[webhook_smoke] discord flag"; exit 1; }
echo "$out" | grep -q '"slack":true' || { echo "[webhook_smoke] slack flag"; exit 1; }
echo "$out" | grep -q '"telegram":true' || { echo "[webhook_smoke] telegram flag"; exit 1; }
echo "$out" | grep -q '"dry_run":true' || { echo "[webhook_smoke] dry_run flag"; exit 1; }
echo "$out" | grep -q '"destinations":3' || { echo "[webhook_smoke] destinations=3 bekleniyordu"; exit 1; }

dry=$(./log-guardian webhook-test alert --quiet --rules "$RULES" 2>&1)
echo "$dry" | grep -q '\[WEBHOOK\]\[DRY-RUN\]' || { echo "[webhook_smoke] dry-run log yok"; exit 1; }
echo "$dry" | grep -q 'body:' || { echo "[webhook_smoke] dry-run body onizleme yok"; exit 1; }

test_out=$(./log-guardian webhook-test alert --quiet --rules "$RULES" 2>/dev/null)
echo "$test_out" | grep -q '"ok":' || { echo "[webhook_smoke] webhook-test ok alani"; exit 1; }

bash "$ROOT/scripts/webhook_post_e2e.sh"

echo "[webhook_smoke] OK — gercek URL: docs/WEBHOOK_SETUP.md"
