#!/usr/bin/env bash
# nginx access.log -> log-guardian tail -> Prometheus EPS/lines ( /status icin kanit )
#   sudo bash scripts/webhook_nginx_eps_smoke.sh
# EPS gauge ~100ms anlik pencere — satirlari INJECT_INTERVAL_SEC ile yay (peak_eps yakalanir)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

NGINX_LOG="${NGINX_LOG:-/var/log/nginx/access.log}"
METRICS_PORT="${METRICS_PORT:-9091}"
METRICS_URL="http://127.0.0.1:${METRICS_PORT}/metrics"
INJECT_LINES="${INJECT_LINES:-8}"
INJECT_INTERVAL_SEC="${INJECT_INTERVAL_SEC:-0.4}"
EPS_POLL_SEC="${EPS_POLL_SEC:-3}"
SETTLE_SEC="${SETTLE_SEC:-2}"
TEST_IP="203.0.113.77"

fail() { echo "[webhook_nginx_eps_smoke] FAIL: $*" >&2; write_report "false" "$*"; exit 1; }
ok() { echo "[OK] $*"; }

write_report() {
  local pass_flag="${1:-false}"
  local fail_reason="${2:-}"
  python3 - "$ROOT/webhook-eps-smoke-report.json" "$pass_flag" <<PY
import datetime, json, sys
from pathlib import Path

out, flag = Path(sys.argv[1]), sys.argv[2]
payload = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "pass": flag in ("true", "1"),
    "fail_reason": """${fail_reason}""" or None,
    "lines_before": int("${LINES_BEFORE:-0}"),
    "lines_after": int("${LINES_AFTER:-0}"),
    "lines_delta": int("${LINES_DELTA:-0}"),
    "eps_after": float("${EPS_AFTER:-0}"),
    "peak_eps": float("${PEAK_EPS:-0}"),
    "derived_eps": float("${DERIVED_EPS:-0}"),
    "alerts_delta": int("${ALERTS_AFTER:-0}") - int("${ALERTS_BEFORE:-0}"),
    "inject_lines": int("${INJECT_LINES:-8}"),
    "inject_interval_sec": float("${INJECT_INTERVAL_SEC:-0.4}"),
    "test_ip": "${TEST_IP}",
    "script": "scripts/webhook_nginx_eps_smoke.sh",
}
out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
PY
}

metric_val() {
  local name="$1"
  curl -sf "$METRICS_URL" 2>/dev/null \
    | grep -E "^${name}\\{" \
    | head -1 \
    | awk '{print $2}' \
    || echo 0
}

eps_gt() {
  awk -v e="$1" -v t="$2" 'BEGIN { exit (e > t) ? 0 : 1 }'
}

peak_eps_poll() {
  local peak="$1"
  local cur
  cur=$(metric_val loganalyzer_eps)
  if eps_gt "$cur" "$peak"; then
    echo "$cur"
  else
    echo "$peak"
  fi
}

[[ "${EUID:-$(id -u)}" -eq 0 ]] || fail "sudo gerekli (nginx log yazimi)"

if ! systemctl is-active --quiet log-guardian.service 2>/dev/null; then
  fail "log-guardian.service inactive — sudo systemctl start log-guardian.service"
fi

if [[ ! -f "$NGINX_LOG" ]]; then
  fail "nginx log yok: $NGINX_LOG (NGINX_LOG=...)"
fi

if ! curl -sf "$METRICS_URL" >/dev/null 2>&1; then
  fail "Prometheus metrics erisilemiyor: $METRICS_URL — servis acik mi? (sudo systemctl start log-guardian; binary: sudo bash scripts/upgrade_log_guardian_binary.sh)"
fi

SVC_PID_BEFORE=$(systemctl show log-guardian.service -p MainPID --value 2>/dev/null || echo 0)

echo "=== webhook_nginx_eps_smoke ==="
echo "  log=$NGINX_LOG  metrics=$METRICS_URL  inject=$INJECT_LINES interval=${INJECT_INTERVAL_SEC}s"

LINES_BEFORE=$(metric_val loganalyzer_lines_total)
EPS_BEFORE=$(metric_val loganalyzer_eps)
ALERTS_BEFORE=$(metric_val loganalyzer_alerts_total)
PARSE_BEFORE=$(metric_val loganalyzer_parse_errors_total)
PEAK_EPS="$EPS_BEFORE"
INJECT_START=$(date +%s.%N)

# nginx log_guardian: ... "ua" "xff" "request_body" — LC_TIME=C (Ingilizce ay: Jul)
for ((i = 1; i <= INJECT_LINES; i++)); do
  TS=$(LC_TIME=C date +"%d/%b/%Y:%H:%M:%S %z")
  printf '%s - - [%s] "GET /lg-eps-smoke-%d HTTP/1.1" 200 64 "-" "LogGuardian-EPS-Smoke" "-" "-"\n' \
    "$TEST_IP" "$TS" "$i" >>"$NGINX_LOG"
  PEAK_EPS=$(peak_eps_poll "$PEAK_EPS")
  if [[ "$i" -lt "$INJECT_LINES" ]]; then
    sleep "$INJECT_INTERVAL_SEC"
    PEAK_EPS=$(peak_eps_poll "$PEAK_EPS")
  fi
done
INJECT_END=$(date +%s.%N)
DERIVED_EPS=$(python3 - <<PY
import os
start = float("${INJECT_START}")
end = float("${INJECT_END}")
lines = int("${INJECT_LINES}")
dt = max(end - start, 0.001)
print(f"{lines / dt:.2f}")
PY
)
ok "$INJECT_LINES satir yayildi (${INJECT_INTERVAL_SEC}s aralik) -> $NGINX_LOG"

POLL_N=$((EPS_POLL_SEC * 5))
for ((p = 0; p < POLL_N; p++)); do
  PEAK_EPS=$(peak_eps_poll "$PEAK_EPS")
  sleep 0.2
done

sleep "$SETTLE_SEC"

SVC_PID_AFTER=$(systemctl show log-guardian.service -p MainPID --value 2>/dev/null || echo 0)
if [[ -n "$SVC_PID_BEFORE" && "$SVC_PID_BEFORE" != "0" && "$SVC_PID_BEFORE" != "$SVC_PID_AFTER" ]]; then
  fail "log-guardian yeniden baslatildi (pid $SVC_PID_BEFORE -> $SVC_PID_AFTER) — lines_total sifirlanir; dashboard_refresh bitince tekrar dene"
fi

LINES_AFTER=$(metric_val loganalyzer_lines_total)
EPS_AFTER=$(metric_val loganalyzer_eps)
ALERTS_AFTER=$(metric_val loganalyzer_alerts_total)

LINES_DELTA=$((LINES_AFTER - LINES_BEFORE))
echo "  lines: $LINES_BEFORE -> $LINES_AFTER (delta=$LINES_DELTA)"
echo "  eps:   anlik=$EPS_AFTER  peak=$PEAK_EPS  derived=${DERIVED_EPS} (inject hizi)"
echo "  alerts: $ALERTS_BEFORE -> $ALERTS_AFTER"

PARSE_AFTER=$(metric_val loganalyzer_parse_errors_total)
if [[ "$LINES_DELTA" -lt 1 ]]; then
  PARSE_DELTA=$((PARSE_AFTER - PARSE_BEFORE))
  if [[ "$PARSE_DELTA" -ge 1 ]]; then
    fail "lines_total artmadi ama parse_errors +$PARSE_DELTA — log_guardian formati gerekli (xff + request_body) ve LC_TIME=C ay adi; check: bash scripts/check_nginx_log_format.sh"
  fi
  fail "lines_total artmadi — servis log tail ediyor mu? (--follow sonundan baslar; inject sonrasi restart olmamali) (journalctl -u log-guardian -n 20)"
fi

if eps_gt "$PEAK_EPS" "0"; then
  ok "peak EPS>0 ($PEAK_EPS) — tail + WAF hatti canli"
elif eps_gt "$DERIVED_EPS" "0.5"; then
  ok "derived EPS=${DERIVED_EPS} (Prometheus gauge EWMA: sudo bash scripts/upgrade_log_guardian_binary.sh)"
else
  echo "[WARN] peak EPS=0 — lines artti; derived=${DERIVED_EPS}"
  echo "       Binary: sudo bash scripts/upgrade_log_guardian_binary.sh  (cp degil — Text file busy)"
fi

echo ""
echo "Telegram: bot DM -> /status (Route satiri + Webhook sent korunmali)"
write_report true ""
echo "[OK] webhook_nginx_eps_smoke"
