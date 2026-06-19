#!/usr/bin/env bash
# Canli: saldiri logu -> WAF alarm -> ban -> Telegram (#ban topic)
#   sudo bash scripts/laptop_telegram_live_e2e.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

RULES="${LG_RULES:-/etc/log-guardian/rules.conf}"
WEBHOOK_ENV="${WEBHOOK_ENV_FILE:-/etc/log-guardian/webhook.env}"
ENV_FILE="/etc/log-guardian/env"
LG_BIN="${LG_BIN:-/usr/local/bin/log-guardian}"
ATTACK_IP="203.0.113.211"
CACHE="$ROOT/.cache"
ATTACK_LOG="$CACHE/laptop_live_attack.access"

fail() { echo "[laptop_telegram_live_e2e] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

[[ "$(id -u)" -eq 0 ]] || fail "sudo gerekli"
[[ -x "$LG_BIN" ]] || LG_BIN="$ROOT/log-guardian"
[[ -f "$RULES" ]] || fail "$RULES yok"
[[ -f "$WEBHOOK_ENV" ]] || fail "$WEBHOOK_ENV yok — once: sudo bash scripts/webhook_install_prod.sh"

set -a
# shellcheck disable=SC1090
[[ -f "$ENV_FILE" ]] && source "$ENV_FILE"
source "$WEBHOOK_ENV"
set +a

export WEBHOOK_ENABLED=1 WEBHOOK_DRY_RUN=0
[[ -n "${LOGANALYZER_PASSWORD:-}" ]] || fail "LOGANALYZER_PASSWORD yok ($ENV_FILE)"

mkdir -p "$CACHE"
cat >"$ATTACK_LOG" <<EOF
${ATTACK_IP} - - [10/Jun/2026:13:25:01 +0300] "GET /search?q=1'+UNION+SELECT+null,null HTTP/1.1" 200 100 "-" "laptop_live_e2e"
${ATTACK_IP} - - [10/Jun/2026:13:25:02 +0300] "GET /admin?id=1 OR 1=1-- HTTP/1.1" 404 50 "-" "laptop_live_e2e"
EOF

echo "=== laptop_telegram_live_e2e ==="
echo "  log=$ATTACK_LOG  ip=$ATTACK_IP"
echo "  Telegram: #ban topic bekleniyor (WEBHOOK_TELEGRAM_TOPIC_BAN)"

combined=$("$LG_BIN" "$ATTACK_LOG" --no-tui --json --rules "$RULES" 2>&1) || true
alerts=$(echo "$combined" | grep -o '"alerts_total"[[:space:]]*:[[:space:]]*[0-9]*' | tail -1 | grep -o '[0-9]*$' || echo 0)
[[ "${alerts:-0}" -ge 1 ]] || { echo "$combined" | tail -20 >&2; fail "alarm uretilmedi (CRS_ENABLED=1?)"; }
ok "saldiri logu alerts_total=$alerts"

sleep 2
if curl -sf "http://127.0.0.1:${METRICS_PORT:-9091}/metrics" >/dev/null 2>&1; then
  sent=$(curl -sf "http://127.0.0.1:${METRICS_PORT:-9091}/metrics" \
    | grep -E '^loganalyzer_webhook_sent_total{' | awk '{print $2}' | tail -1)
  fail_n=$(curl -sf "http://127.0.0.1:${METRICS_PORT:-9091}/metrics" \
    | grep -E '^loganalyzer_webhook_fail_total{' | awk '{print $2}' | tail -1)
  ok "metrics webhook_sent=$sent fail=${fail_n:-0}"
fi

echo ""
echo "Telegram kontrol:"
echo "  #ban  — IP ban bildirimi ($ATTACK_IP)"
echo "  #waf  — CRIT alarmlar (bu test WARN olabilir)"
echo "[OK] laptop_telegram_live_e2e — gercek log hatti"
