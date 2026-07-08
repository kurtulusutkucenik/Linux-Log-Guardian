#!/usr/bin/env bash
# Dashboard ban/unban — host API (8090), relay (18090), Docker container kanıtı
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=scripts/lib/guardian_api.sh
source "$ROOT/scripts/lib/guardian_api.sh"
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
MUT_TOK=$(grep -E '^API_MUTATION_TOKEN=' "$CONF" 2>/dev/null | tail -1 | cut -d= -f2- || true)
POST_TOK="${MUT_TOK:-$TOK}"
[[ -n "$TOK" ]] || { echo "[dashboard_ban_smoke] FAIL: API_TOKEN yok" >&2; exit 1; }
[[ -n "$POST_TOK" ]] || { echo "[dashboard_ban_smoke] FAIL: ban token yok" >&2; exit 1; }

api_ban_unban() {
  local base="$1"
  local label="$2"
  local ban_out unban_out ban_code unban_code
  local tmp_ban tmp_unban
  tmp_ban="$(mktemp /tmp/lg-ban.XXXXXX)"
  tmp_unban="$(mktemp /tmp/lg-unban.XXXXXX)"
  ban_out=$(curl -s -o "$tmp_ban" -w "%{http_code}" --max-time 5 -X POST \
    -H "Authorization: Bearer ${POST_TOK}" \
    "${base}/api/v1/ban?ip=${TEST_IP}&reason=dashboard-smoke" 2>/dev/null || echo "000")
  ban_code="${ban_out: -3}"
  if [[ "$ban_code" != "200" && "$ban_code" != "409" ]] || ! grep -q '"success":true' "$tmp_ban" 2>/dev/null; then
    fail_reason="${label} ban HTTP ${ban_code}"
    rm -f "$tmp_ban" "$tmp_unban"
    return 1
  fi
  ban_path=$(grep -o '"path":"[^"]*"' "$tmp_ban" 2>/dev/null | head -1 | cut -d'"' -f4 || echo "")
  unban_out=$(curl -s -o "$tmp_unban" -w "%{http_code}" --max-time 5 -X POST \
    -H "Authorization: Bearer ${POST_TOK}" \
    "${base}/api/v1/unban?ip=${TEST_IP}" 2>/dev/null || echo "000")
  unban_code="${unban_out: -3}"
  if [[ "$unban_code" != "200" ]] || ! grep -q '"success":true' "$tmp_unban" 2>/dev/null; then
    fail_reason="${label} unban HTTP ${unban_code}"
    rm -f "$tmp_ban" "$tmp_unban"
    return 1
  fi
  rm -f "$tmp_ban" "$tmp_unban"
  return 0
}

api_ban_unban_retry() {
  local base="$1" label="$2" attempt
  for attempt in 1 2 3 4 5; do
    if api_ban_unban "$base" "$label"; then
      return 0
    fi
    [[ "$attempt" -lt 5 ]] && sleep 2
  done
  return 1
}

if ! wait_lg_ban_ready 45; then
  echo "[dashboard_ban_smoke] WARN: POST /ban henuz hazir — retry ile devam" >&2
fi
wait_lg_relay_ready 25 || true

echo "[1] Host API ${HOST_API} ..."
if api_ban_unban_retry "$HOST_API" "host"; then
  host_ok=1
  echo "[OK] host ban/unban"
else
  echo "[FAIL] host — ${fail_reason}" >&2
fi

echo "[2] Relay ${RELAY_API} ..."
if api_ban_unban_retry "$RELAY_API" "relay"; then
  relay_ok=1
  echo "[OK] relay ban/unban"
else
  echo "[FAIL] relay — ${fail_reason}" >&2
  echo "       ipucu: docker compose -f docker-compose.prod.yml up -d ban-api-relay" >&2
fi

echo "[3] Docker container ..."
if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx 'log-guardian-dashboard'; then
  if docker exec log-guardian-dashboard node -e "
const t=process.env.GUARDIAN_API_MUTATION_TOKEN||process.env.GUARDIAN_API_TOKEN;
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
  bash "$ROOT/scripts/caddy_mtls_status_export.sh" 2>/dev/null || true
  echo "[PASS] dashboard ban API smoke"
  exit 0
fi
echo "[FAIL] dashboard ban API smoke" >&2
exit 1
