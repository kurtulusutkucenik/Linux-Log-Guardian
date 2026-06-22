#!/usr/bin/env bash
# API fail-closed — tokensiz read/write 403; token ile erisim
#   bash scripts/api_fail_closed_test.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

PORT="${GUARDIAN_API_PORT:-8090}"
BASE="http://127.0.0.1:${PORT}"
CONF="${LG_RULES:-/etc/log-guardian/rules.conf}"

code() {
  curl -s -o /dev/null -w '%{http_code}' --max-time 2 "$@" 2>/dev/null || echo 000
}

if ! curl -s --max-time 2 "${BASE}/api/v1/metrics" >/dev/null 2>&1; then
  echo "[api_fail_closed] FAIL: API yanit vermiyor — systemctl start log-guardian" >&2
  echo ""
  echo "=== ozet ==="
  echo "  FAIL: 1   WARN: 0"
  exit 1
fi

fail=0
check_403() {
  local name="$1"
  shift
  local c
  c=$(code "$@")
  if [[ "$c" == "403" ]]; then
    echo "[OK] $name tokensiz 403"
  else
    echo "[FAIL] $name code=$c (403 beklenir — sudo bash scripts/upgrade_log_guardian_binary.sh)" >&2
    fail=1
  fi
}

check_403 "POST /ban" -X POST "${BASE}/api/v1/ban?ip=203.0.113.254"
check_403 "GET /consult" "${BASE}/api/v1/consult?path=/test&method=GET&ip=203.0.113.1"
check_403 "GET /metrics" "${BASE}/api/v1/metrics"
check_403 "GET /bans" "${BASE}/api/v1/bans"
check_403 "GET /top10" "${BASE}/api/v1/top10"

metric_val() {
  curl -sf --max-time 2 http://127.0.0.1:9091/metrics 2>/dev/null \
    | grep "^${1}" | head -1 | awk '{print $2}' || echo 0
}

if curl -sf --max-time 2 http://127.0.0.1:9091/metrics 2>/dev/null | grep -q loganalyzer_api_auth_fail_total; then
  before_req=$(metric_val "loganalyzer_api_requests_total")
  before_fail=$(metric_val "loganalyzer_api_auth_fail_total")
  c=$(code "${BASE}/api/v1/metrics")
  sleep 1
  after_req=$(metric_val "loganalyzer_api_requests_total")
  after_fail=$(metric_val "loganalyzer_api_auth_fail_total")
  if [[ "$c" == "403" && "$after_req" -gt "$before_req" && "$after_fail" -gt "$before_fail" ]]; then
    echo "[OK] Prometheus api_auth_fail metrik artisi (403 sonrasi)"
  else
    echo "[WARN] api metrik sayaci — code=$c req ${before_req}->${after_req} fail ${before_fail}->${after_fail}" >&2
  fi
else
  echo "[WARN] loganalyzer_api_* metrik yok — sudo make install && restart" >&2
fi

tok=$(grep -E '^API_TOKEN=' "$CONF" 2>/dev/null | tail -1 | cut -d= -f2- || true)
if [[ -n "$tok" ]]; then
  auth=(-H "Authorization: Bearer $tok")
  mcode=$(code "${auth[@]}" "${BASE}/api/v1/metrics")
  [[ "$mcode" == "200" ]] && echo "[OK] GET /metrics token ile 200" \
    || { echo "[FAIL] metrics token code=$mcode" >&2; fail=1; }
  bcode=$(code "${auth[@]}" -X POST "${BASE}/api/v1/ban?ip=203.0.113.253")
  [[ "$bcode" == "200" || "$bcode" == "502" ]] \
    && echo "[OK] POST /ban token ile $bcode" \
    || { echo "[FAIL] ban token code=$bcode" >&2; fail=1; }
fi

[[ "$fail" -eq 0 ]] && {
  echo ""
  echo "=== ozet ==="
  echo "  FAIL: 0   WARN: 0"
  echo "[OK] api_fail_closed_test"
  exit 0
}
echo ""
echo "=== ozet ==="
echo "  FAIL: $fail   WARN: 0"
exit 1
