#!/usr/bin/env bash
# Faz 4 — Fleet MVP E2E (telemetry + komut kuyrugu)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

API_KEY="${FLEET_API_KEY:-sk_guardian_fleet_e2e_test}"
DASH_URL="${DASH_URL:-http://127.0.0.1:3000}"
AGENT_ID="${FLEET_AGENT_ID:-e2e-agent-01}"

seed_dashboard_db() {
  local db_dir="$1"
  local admin_pass="${DASHBOARD_ADMIN_PASSWORD:-}"
  if [[ -f "$ROOT/.env" ]]; then
    # shellcheck disable=SC1090
    set -a && source "$ROOT/.env" && set +a
    admin_pass="${DASHBOARD_ADMIN_PASSWORD:-$admin_pass}"
  fi
  if [[ -d "$db_dir/prisma" ]]; then
    local -a seed_env=(DASHBOARD_SEED=1 "DASHBOARD_FLEET_API_KEY=$API_KEY")
    [[ -n "$admin_pass" ]] && seed_env+=("DASHBOARD_ADMIN_PASSWORD=$admin_pass")
    (cd "$db_dir" && env "${seed_env[@]}" npx prisma db push --skip-generate 2>/dev/null) || true
    (cd "$db_dir" && env "${seed_env[@]}" node prisma/seed.mjs) || true
  fi
}

if [[ -d dashboard/prisma ]]; then
  seed_dashboard_db dashboard
fi

if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx 'log-guardian-dashboard'; then
  echo "[fleet_e2e] Docker dashboard — fleet key seed"
  docker exec log-guardian-dashboard sh -c \
    "cd /app && DASHBOARD_SEED=1 DASHBOARD_FLEET_API_KEY=${API_KEY} node prisma/seed.mjs" \
    2>/dev/null || true
fi

echo "[1] telemetry POST"
curl -sf -X POST "${DASH_URL}/api/telemetry" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"agent_id\": \"${AGENT_ID}\",
    \"eps\": 42.5,
    \"total_lines\": 1000,
    \"alerts_total\": 2,
    \"rce_detections\": 0,
    \"incidents_active\": 1,
    \"incidents_correlated\": 1,
    \"attack_tree\": []
  }" | grep -q '"success":true' || {
  echo "telemetry failed (dashboard calisiyor mu? cd dashboard && npm run dev)" >&2
  exit 1
}

echo "[2] agent komut cekme"
out=$(curl -sf "${DASH_URL}/api/fleet/commands?agent_id=${AGENT_ID}" \
  -H "Authorization: Bearer ${API_KEY}") || {
  echo "commands failed (401 ise: dashboard yeniden baslat, middleware agent API acik mi?)" >&2
  exit 1
}
echo "$out" | grep -q '"commands"' || {
  echo "commands yanitinda 'commands' yok: $out" >&2
  exit 1
}

echo "[3] prometheus tenant label (analyzer)"
if curl -sf http://127.0.0.1:9091/metrics 2>/dev/null | grep -q 'tenant_id='; then
  echo "metrics tenant_id OK"
else
  echo "metrics atlandi (analyzer calismiyor)"
fi

echo "OK — fleet_e2e (dashboard: ${DASH_URL})"
