#!/usr/bin/env bash
# Dashboard ban/unban — host API (8090), relay (18090), Docker container kanıtı
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONF="${LG_RULES:-/etc/log-guardian/rules.conf}"
REPORT="${ROOT}/dashboard-ban-api-report.json"
TEST_IP="${DASHBOARD_BAN_TEST_IP:-203.0.113.248}"
HOST_API="${GUARDIAN_API_HOST:-http://127.0.0.1:8090}"
RELAY_API="${GUARDIAN_RELAY_URL:-http://127.0.0.1:18090}"
DATE_ISO="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

host_ok=0
relay_ok=0
docker_ok=0
ban_path=""
fail_reason=""

if [[ ! -f "$CONF" ]]; then
  echo "[dashboard_ban_smoke] FAIL: $CONF yok" >&2
  exit 1
fi
TOK=$(grep -E '^API_TOKEN=' "$CONF" 2>/dev/null | tail -1 | cut -d= -f2-)
[[ -n "$TOK" ]] || { echo "[dashboard_ban_smoke] FAIL: API_TOKEN yok" >&2; exit 1; }

api_ban_unban() {
  local base="$1"
  local label="$2"
  local ban_out unban_out ban_code unban_code
  ban_out=$(curl -sf -o /tmp/lg-ban.json -w "%{http_code}" -X POST \
    -H "Authorization: Bearer ${TOK}" \
    "${base}/api/v1/ban?ip=${TEST_IP}&reason=dashboard-smoke" 2>/dev/null || echo "000")
  ban_code="${ban_out: -3}"
  if [[ "$ban_code" != "200" ]] || ! grep -q '"success":true' /tmp/lg-ban.json 2>/dev/null; then
    fail_reason="${label} ban HTTP ${ban_code}"
    return 1
  fi
  ban_path=$(grep -o '"path":"[^"]*"' /tmp/lg-ban.json 2>/dev/null | head -1 | cut -d'"' -f4 || echo "")
  unban_out=$(curl -sf -o /tmp/lg-unban.json -w "%{http_code}" -X POST \
    -H "Authorization: Bearer ${TOK}" \
    "${base}/api/v1/unban?ip=${TEST_IP}" 2>/dev/null || echo "000")
  unban_code="${unban_out: -3}"
  if [[ "$unban_code" != "200" ]] || ! grep -q '"success":true' /tmp/lg-unban.json 2>/dev/null; then
    fail_reason="${label} unban HTTP ${unban_code}"
    return 1
  fi
  return 0
}

echo "[1] Host API ${HOST_API} ..."
if api_ban_unban "$HOST_API" "host"; then
  host_ok=1
  echo "[OK] host ban/unban"
else
  echo "[FAIL] host — ${fail_reason}" >&2
fi

echo "[2] Relay ${RELAY_API} ..."
if api_ban_unban "$RELAY_API" "relay"; then
  relay_ok=1
  echo "[OK] relay ban/unban"
else
  echo "[FAIL] relay — ${fail_reason}" >&2
  echo "       ipucu: docker compose -f docker-compose.prod.yml up -d ban-api-relay" >&2
fi

echo "[3] Docker container ..."
if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx 'log-guardian-dashboard'; then
  if docker exec log-guardian-dashboard node -e "
const t=process.env.GUARDIAN_API_TOKEN;
const b=process.env.GUARDIAN_BAN_URL;
const ip='${TEST_IP}';
(async()=>{
  const ban=await fetch(b+'/api/v1/ban?ip='+ip+'&reason=docker-smoke',{method:'POST',headers:{Authorization:'Bearer '+t}});
  const bj=await ban.json();
  if(!ban.ok||bj.success===false) process.exit(2);
  const un=await fetch(b+'/api/v1/unban?ip='+ip,{method:'POST',headers:{Authorization:'Bearer '+t}});
  const uj=await un.json();
  if(!un.ok||uj.success===false) process.exit(3);
})().catch(()=>process.exit(1));
" 2>/dev/null; then
    docker_ok=1
    echo "[OK] docker ban/unban"
  else
    echo "[FAIL] docker container API" >&2
    echo "       bash scripts/sync_dashboard_api_token.sh" >&2
  fi
else
  echo "[SKIP] log-guardian-dashboard calismiyor"
fi

pass=0
[[ "$host_ok" -eq 1 && "$relay_ok" -eq 1 ]] && pass=1

python3 - "$REPORT" <<PY
import json, sys
from datetime import datetime, timezone
data = {
    "date": "${DATE_ISO}",
    "pass": bool(${pass}),
    "test_ip": "${TEST_IP}",
    "host_api": {"ok": bool(${host_ok}), "url": "${HOST_API}"},
    "relay_api": {"ok": bool(${relay_ok}), "url": "${RELAY_API}"},
    "docker_api": {"ok": bool(${docker_ok}), "container": "log-guardian-dashboard"},
    "ban_path": "${ban_path}",
    "fail_reason": "${fail_reason}" if not ${pass} else "",
}
with open(sys.argv[1], "w") as f:
    json.dump(data, f, indent=2)
    f.write("\n")
PY

echo "[report] $REPORT"
if [[ "$pass" -eq 1 ]]; then
  echo "[PASS] dashboard ban API smoke"
  exit 0
fi
echo "[FAIL] dashboard ban API smoke" >&2
exit 1
