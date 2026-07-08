#!/usr/bin/env bash
# Dashboard login rate limit — prod'da unknown/XFF bypass yok
#   bash scripts/dashboard_login_rate_limit_e2e.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BASE="${DASHBOARD_LOGIN_RL_E2E_URL:-http://127.0.0.1:3000}"
REPORT="${DASHBOARD_LOGIN_RL_E2E_REPORT:-dashboard-login-rl-e2e-report.json}"
PROBE_IP="203.0.113.${DASHBOARD_LOGIN_RL_PROBE_OCTET:-88}"
MAX="${DASHBOARD_LOGIN_RL_MAX:-10}"
CURL_TLS=()
[[ "$BASE" == https://* ]] && CURL_TLS=(-k)

code() {
  curl "${CURL_TLS[@]}" -s -o /dev/null -w '%{http_code}' --max-time 8 \
    -H "Content-Type: application/json" \
    -H "X-Forwarded-For: ${PROBE_IP}" \
    -X POST "${BASE}/api/auth/login" \
    -d '{"username":"rl_probe","password":"wrong"}' 2>/dev/null || echo 000
}

fail_reason=""
pass=true

echo "=== dashboard_login_rate_limit_e2e ==="
echo "  url=$BASE probe_ip=$PROBE_IP max=$MAX"

init=$(curl "${CURL_TLS[@]}" -s -o /dev/null -w '%{http_code}' --max-time 5 "${BASE}/api/tier" 2>/dev/null || echo 000)
if [[ "$init" == "000" ]]; then
  fail_reason="dashboard yanit vermiyor ($BASE)"
  pass=false
fi

if [[ "$pass" == true ]]; then
  last=""
  for i in $(seq 1 $((MAX + 2))); do
    last=$(code)
    [[ "$last" == "401" || "$last" == "429" ]] || {
      fail_reason="deneme $i beklenmeyen kod=$last"
      pass=false
      break
    }
    [[ "$last" == "429" ]] && break
  done
  if [[ "$pass" == true && "$last" != "429" ]]; then
    fail_reason="${MAX} basarisiz denemeden sonra 429 gelmedi (son=$last)"
    pass=false
  elif [[ "$pass" == true ]]; then
    echo "[OK] ${MAX}+ basarisiz deneme -> 429"
  fi
fi

python3 - "$REPORT" "$pass" "$fail_reason" "$PROBE_IP" "$MAX" <<'PY'
import json, datetime, sys
from pathlib import Path

report = Path(sys.argv[1])
passed = sys.argv[2] == "true"
doc = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "pass": passed,
    "fail_reason": sys.argv[3] or None,
    "probe_ip": sys.argv[4],
    "max_attempts": int(sys.argv[5]),
    "script": "scripts/dashboard_login_rate_limit_e2e.sh",
}
report.write_text(json.dumps(doc, indent=2) + "\n", encoding="utf-8")
PY

if [[ "$pass" == true ]]; then
  echo "[OK] dashboard_login_rate_limit_e2e"
  exit 0
fi
echo "[FAIL] dashboard_login_rate_limit_e2e — $fail_reason" >&2
exit 1
