#!/usr/bin/env bash
# Fleet: agent offline → telemetry resume → Online
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

API_KEY="${FLEET_API_KEY:-sk_guardian_fleet_e2e_test}"
DASH_URL="${DASH_URL:-http://127.0.0.1:3000}"
AGENT_ID="${FLEET_AGENT_ID:-e2e-reconnect-01}"
ADMIN_PASS="${DASHBOARD_ADMIN_PASSWORD:-ChangeMeOnFirstLogin!}"
COOKIE_JAR="$(mktemp)"
trap 'rm -f "$COOKIE_JAR"' EXIT

fail() { echo "[fleet_reconnect_e2e] FAIL: $*" >&2; exit 1; }

post_telemetry() {
  curl -sf -X POST "${DASH_URL}/api/telemetry" \
    -H "Authorization: Bearer ${API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"agent_id\":\"${AGENT_ID}\",\"eps\":11.0,\"total_lines\":100,\"alerts_total\":0,\"attack_tree\":[]}"
}

fleet_status() {
  curl -sf -b "$COOKIE_JAR" "${DASH_URL}/api/fleet" 2>/dev/null \
    | python3 -c "
import json,sys
d=json.load(sys.stdin)
for a in d.get('fleet',[]):
    if a.get('agent_id')=='${AGENT_ID}':
        print(a.get('status','?'))
        raise SystemExit(0)
print('missing')
"
}

bash scripts/fleet_e2e.sh >/dev/null 2>&1 || fail "fleet_e2e onkosul (dashboard ayakta mi?)"

curl -sf -c "$COOKIE_JAR" -X POST "${DASH_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"${ADMIN_PASS}\"}" >/dev/null \
  || fail "dashboard login (admin sifresi / DASHBOARD_ADMIN_PASSWORD)"

echo "[1] telemetry — Online"
post_telemetry >/dev/null
sleep 1
st=$(fleet_status)
[[ "$st" == "Online" ]] || fail "beklenen Online, got=$st"

echo "[2] 20s telemetry yok — Offline"
sleep 20
st=$(fleet_status)
[[ "$st" == "Offline" ]] || fail "beklenen Offline, got=$st"

echo "[3] telemetry resume — Online"
post_telemetry >/dev/null
sleep 2
st=$(fleet_status)
[[ "$st" == "Online" ]] || fail "reconnect basarisiz, got=$st"

echo "[OK] fleet_reconnect_e2e"
