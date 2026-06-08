#!/usr/bin/env bash
# Prod Telegram route: nginx saldiri logu + webhook-test paketi
#   sudo bash scripts/webhook_prod_e2e.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

WEBHOOK_ENV="${WEBHOOK_ENV:-/etc/log-guardian/webhook.env}"
RULES="${LG_RULES:-/etc/log-guardian/rules.conf}"
LG_BIN="${LG_BIN:-/usr/local/bin/log-guardian}"
METRICS_FILE="${LOGANALYZER_WEBHOOK_METRICS_FILE:-/var/lib/log-guardian/webhook.metrics}"
ATTACK_IP="203.0.113.198"
CACHE="$ROOT/.cache"
ATTACK_LOG="$CACHE/webhook_prod_attack.access"

fail() { echo "[webhook_prod_e2e] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

[[ -x "$LG_BIN" ]] || LG_BIN="$ROOT/log-guardian"
[[ -f "$WEBHOOK_ENV" ]] || fail "$WEBHOOK_ENV yok"
[[ -f "$RULES" ]] || fail "$RULES yok"

metrics_sent() {
  grep -E '^sent=' "$METRICS_FILE" 2>/dev/null | cut -d= -f2 || echo 0
}

echo "=== webhook_prod_e2e ==="

if ! systemctl is-active --quiet log-guardian.service 2>/dev/null; then
  echo "[WARN] log-guardian.service inactive"
fi

set -a
# shellcheck disable=SC1090
source "$WEBHOOK_ENV"
set +a

[[ "${WEBHOOK_TELEGRAM_ROUTE:-0}" == "1" ]] \
  || fail "WEBHOOK_TELEGRAM_ROUTE=1 degil — once route acin"
[[ -n "${LOGANALYZER_TELEGRAM_CHAT_CRIT:-}" && -n "${LOGANALYZER_TELEGRAM_CHAT_WARN:-}" ]] \
  || fail "CRIT/WARN chat_id eksik"

SENT_BEFORE=$(metrics_sent)
mkdir -p "$CACHE"
cat >"$ATTACK_LOG" <<EOF
${ATTACK_IP} - - [09/Jun/2026:01:15:01 +0300] "GET /search?q=1'+UNION+SELECT+null HTTP/1.1" 200 100 "-" "webhook_prod_e2e"
${ATTACK_IP} - - [09/Jun/2026:01:15:02 +0300] "GET /admin?id=1 OR 1=1 HTTP/1.1" 404 50 "-" "webhook_prod_e2e"
${ATTACK_IP} - - [09/Jun/2026:01:15:03 +0300] "GET /api?x=<script>alert(1)</script> HTTP/1.1" 403 80 "-" "webhook_prod_e2e"
EOF

export WEBHOOK_ENABLED=1 WEBHOOK_DRY_RUN=0
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

echo "[1/3] saldiri logu isleniyor: $ATTACK_LOG"
combined=$("$LG_BIN" "$ATTACK_LOG" --no-tui --json --rules "$RULES" 2>&1 || true)
alerts=$(echo "$combined" | grep -o '"alerts_total"[[:space:]]*:[[:space:]]*[0-9]*' | tail -1 | grep -o '[0-9]*$' || echo 0)
[[ "${alerts:-0}" -ge 1 ]] || fail "alarm uretilmedi: $combined"
ok "saldiri logu alerts_total=$alerts"

echo "[2/3] route webhook-test (alert→DM, ban/trap→kanal)"
for k in alert ban trap; do
  out=$("$LG_BIN" webhook-test "$k" --quiet --rules "$RULES" 2>&1) || fail "webhook-test $k"
  echo "$out" | grep -q '"fail":0' || fail "webhook-test $k fail>0: $out"
  echo "$out" | grep -qE '"ok":1[,}]' || fail "webhook-test $k ok:1 bekleniyordu (route?): $out"
  ok "webhook-test $k ok:1"
  sleep 1
done

if [[ "${WEBHOOK_TELEGRAM_BATCH_SEC:-0}" -gt 0 ]]; then
  out=$("$LG_BIN" webhook-test batch --quiet --rules "$RULES" 2>&1) || fail "webhook-test batch"
  echo "$out" | grep -q '"fail":0' || fail "batch fail>0: $out"
  ok "webhook-test batch (DM ozet)"
fi

SENT_AFTER=$(metrics_sent)
DELTA=$((SENT_AFTER - SENT_BEFORE))
[[ "$DELTA" -ge 1 ]] || fail "webhook.metrics sent artmadi ($SENT_BEFORE -> $SENT_AFTER)"
ok "webhook.metrics sent +$DELTA ($SENT_BEFORE -> $SENT_AFTER)"

if command -v curl >/dev/null && curl -sf "http://127.0.0.1:${METRICS_PORT:-9091}/metrics" >/dev/null 2>&1; then
  route=$(curl -sf "http://127.0.0.1:${METRICS_PORT:-9091}/metrics" \
    | grep -E '^loganalyzer_webhook_telegram_route{' | awk '{print $2}')
  batch=$(curl -sf "http://127.0.0.1:${METRICS_PORT:-9091}/metrics" \
    | grep -E '^loganalyzer_webhook_telegram_batch_sec{' | awk '{print $2}')
  ok "Prometheus route=$route batch_sec=${batch:-0}"
fi

echo ""
echo "Telegram kontrol:"
echo "  DM    — WARN + batch ozet"
echo "  Kanal — ban + tuzak (alert gelmemeli)"
echo "[OK] webhook_prod_e2e"
