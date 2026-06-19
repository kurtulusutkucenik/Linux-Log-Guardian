#!/usr/bin/env bash
# nginx access.log -> log-guardian tail -> Prometheus EPS/lines ( /status icin kanit )
#   sudo bash scripts/webhook_nginx_eps_smoke.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

NGINX_LOG="${NGINX_LOG:-/var/log/nginx/access.log}"
METRICS_PORT="${METRICS_PORT:-9091}"
METRICS_URL="http://127.0.0.1:${METRICS_PORT}/metrics"
INJECT_LINES="${INJECT_LINES:-8}"
WAIT_SEC="${WAIT_SEC:-15}"
TEST_IP="203.0.113.77"

fail() { echo "[webhook_nginx_eps_smoke] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

metric_val() {
  local name="$1"
  curl -sf "$METRICS_URL" 2>/dev/null \
    | grep -E "^${name}\\{" \
    | head -1 \
    | awk '{print $2}' \
    || echo 0
}

[[ "${EUID:-$(id -u)}" -eq 0 ]] || fail "sudo gerekli (nginx log yazimi)"

if ! systemctl is-active --quiet log-guardian.service 2>/dev/null; then
  fail "log-guardian.service inactive — sudo systemctl start log-guardian.service"
fi

if [[ ! -f "$NGINX_LOG" ]]; then
  fail "nginx log yok: $NGINX_LOG (NGINX_LOG=...)"
fi

if ! curl -sf "$METRICS_URL" >/dev/null 2>&1; then
  fail "Prometheus metrics erisilemiyor: $METRICS_URL (METRICS_PORT rules.conf?)"
fi

echo "=== webhook_nginx_eps_smoke ==="
echo "  log=$NGINX_LOG  metrics=$METRICS_URL  inject=$INJECT_LINES"

LINES_BEFORE=$(metric_val loganalyzer_lines_total)
EPS_BEFORE=$(metric_val loganalyzer_eps)
ALERTS_BEFORE=$(metric_val loganalyzer_alerts_total)
PARSE_BEFORE=$(metric_val loganalyzer_parse_errors_total)

# nginx log_guardian: ... "ua" "xff" "request_body" — LC_TIME=C (Ingilizce ay: Jun)
TS=$(LC_TIME=C date +"%d/%b/%Y:%H:%M:%S %z")
TMP=$(mktemp)
for ((i = 1; i <= INJECT_LINES; i++)); do
  printf '%s - - [%s] "GET /lg-eps-smoke-%d HTTP/1.1" 200 64 "-" "LogGuardian-EPS-Smoke" "-" "-"\n' \
    "$TEST_IP" "$TS" "$i" >>"$TMP"
done
cat "$TMP" >>"$NGINX_LOG"
rm -f "$TMP"
ok "$INJECT_LINES satir eklendi -> $NGINX_LOG"

sleep "$WAIT_SEC"

LINES_AFTER=$(metric_val loganalyzer_lines_total)
EPS_AFTER=$(metric_val loganalyzer_eps)
ALERTS_AFTER=$(metric_val loganalyzer_alerts_total)

LINES_DELTA=$((LINES_AFTER - LINES_BEFORE))
echo "  lines: $LINES_BEFORE -> $LINES_AFTER (delta=$LINES_DELTA)"
echo "  eps:   $EPS_BEFORE -> $EPS_AFTER"
echo "  alerts: $ALERTS_BEFORE -> $ALERTS_AFTER"

PARSE_AFTER=$(metric_val loganalyzer_parse_errors_total)
if [[ "$LINES_DELTA" -lt 1 ]]; then
  PARSE_DELTA=$((PARSE_AFTER - PARSE_BEFORE))
  if [[ "$PARSE_DELTA" -ge 1 ]]; then
    fail "lines_total artmadi ama parse_errors +$PARSE_DELTA — log_guardian formati gerekli (xff + request_body) ve LC_TIME=C ay adi; check: bash scripts/check_nginx_log_format.sh"
  fi
  fail "lines_total artmadi — servis log tail ediyor mu? (journalctl -u log-guardian -n 20)"
fi

if awk -v e="$EPS_AFTER" 'BEGIN { exit (e > 0) ? 0 : 1 }'; then
  ok "EPS>0 ($EPS_AFTER) — Telegram /status EPS satiri da dolmali"
else
  echo "[WARN] EPS hala 0 — batch penceresi bekleniyor olabilir; lines artti, tail OK"
  echo "       30sn sonra tekrar: curl -s $METRICS_URL | grep loganalyzer_eps"
fi

echo ""
echo "Telegram: bot DM -> /status (Route satiri + Webhook sent korunmali)"
echo "[OK] webhook_nginx_eps_smoke"
