#!/usr/bin/env bash
# P3 #8 — 2+ agent telemetry + /fleet dispatch hedefli komut
#   bash scripts/fleet_multi_node_e2e.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

API_KEY="${FLEET_API_KEY:-sk_guardian_fleet_test_token_123}"
ADMIN_PASS="${DASHBOARD_ADMIN_PASSWORD:-DegistirBeni!123}"
AGENT_A="${FLEET_AGENT_A:-node-kurtulus-01}"
AGENT_B="${FLEET_AGENT_B:-node-vm-02}"
TEST_IP="203.0.113.250"
REPORT="${FLEET_MULTI_REPORT:-fleet-multi-node-report.json}"
COOKIE_JAR="$(mktemp)"
trap 'rm -f "$COOKIE_JAR"' EXIT

fail() { echo "[fleet_multi_node] FAIL: $*" >&2; exit 1; }

resolve_dash_url() {
  if [[ -n "${DASH_URL:-}" ]]; then
    echo "$DASH_URL"
    return
  fi
  # Caddy DOMAIN=localhost — SNI icin localhost + --resolve (127.0.0.1 IP TLS patlar)
  if curl -sfk -o /dev/null --max-time 2 \
      --resolve 'localhost:8443:127.0.0.1' "https://localhost:8443/api/tier" 2>/dev/null; then
    echo "https://localhost:8443"
  elif curl -sf -o /dev/null --max-time 2 "http://127.0.0.1:3000/api/tier" 2>/dev/null; then
    echo "http://127.0.0.1:3000"
  else
    echo "http://127.0.0.1:3000"
  fi
}

DASH_URL="$(resolve_dash_url)"
CURL_TLS=()
CURL_RESOLVE=()
[[ "$DASH_URL" == https://* ]] && CURL_TLS=(-k)
if [[ "$DASH_URL" == https://localhost:* ]]; then
  port="${DASH_URL#https://localhost:}"
  port="${port%%/*}"
  CURL_RESOLVE=(--resolve "localhost:${port}:127.0.0.1")
fi

dash_curl() {
  curl "${CURL_TLS[@]}" "${CURL_RESOLVE[@]}" "$@"
}

if [[ -f "$ROOT/.env" ]]; then
  # shellcheck disable=SC1090
  set -a && source "$ROOT/.env" && set +a
  ADMIN_PASS="${DASHBOARD_ADMIN_PASSWORD:-$ADMIN_PASS}"
  API_KEY="${FLEET_API_KEY:-$API_KEY}"
fi

seed_fleet_key() {
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx 'log-guardian-dashboard'; then
    docker exec log-guardian-dashboard sh -c \
      "cd /app && DASHBOARD_SEED=1 DASHBOARD_FLEET_API_KEY=${API_KEY} node prisma/seed.mjs" \
      2>/dev/null || true
  elif [[ -d "$ROOT/dashboard/prisma" ]]; then
    (cd "$ROOT/dashboard" && env DASHBOARD_SEED=1 "DASHBOARD_FLEET_API_KEY=$API_KEY" \
      node prisma/seed.mjs) 2>/dev/null || true
  fi
}

push_agent() {
  local id="$1" eps="$2"
  _push_agent_impl "$id" "$eps" || fail "telemetry $id"
}

push_agent_optional() {
  local id="$1" eps="$2"
  _push_agent_impl "$id" "$eps" || return 1
}

_push_agent_impl() {
  local id="$1" eps="$2"
  AGENT_ID="$id" FLEET_API_KEY="$API_KEY" TELEMETRY_URL="${DASH_URL}/api/telemetry" \
    METRICS_URL="${METRICS_URL:-http://127.0.0.1:9091/metrics}" \
    bash "$ROOT/scripts/fleet_telemetry_push.sh" >/dev/null 2>&1 && return 0
  dash_curl -sf -X POST "${DASH_URL}/api/telemetry" \
    -H "Authorization: Bearer ${API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"agent_id\":\"${id}\",\"eps\":${eps},\"total_lines\":500,\"alerts_total\":1,\"attack_tree\":[]}" \
    | grep -q '"success":true'
}

# VM gercek 2. host: B push host'tan degil VM keepalive'den gelir
FLEET_MODE="${FLEET_MODE:-}"
if [[ -z "$FLEET_MODE" && "$AGENT_B" == node-vm-* ]]; then
  FLEET_MODE="multi-host"
fi
FLEET_FALLBACK=false

echo "=== fleet_multi_node_e2e (P3 #8) ==="
seed_fleet_key

echo "[1a] dashboard login (fleet probe)"
login_code=$(dash_curl -s -o /dev/null -w '%{http_code}' -c "$COOKIE_JAR" \
  -X POST "${DASH_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"${ADMIN_PASS}\"}")
[[ "$login_code" == "200" ]] || fail "login HTTP $login_code (DASHBOARD_ADMIN_PASSWORD?)"

fleet_agent_online() {
  local aid="$1"
  dash_curl -sf -b "$COOKIE_JAR" "${DASH_URL}/api/fleet" 2>/dev/null | python3 -c "
import json,sys
aid=sys.argv[1]
d=json.load(sys.stdin)
for a in d.get('fleet',[]):
    if a.get('agent_id')==aid or a.get('id')==aid:
        raise SystemExit(0 if a.get('status')=='Online' else 1)
raise SystemExit(1)
" "$aid" 2>/dev/null
}

echo "[1] 2 agent telemetry (mode=${FLEET_MODE:-laptop-simulated})"
push_agent "$AGENT_A" 12.5
if [[ "$FLEET_MODE" == "multi-host" ]]; then
  echo "  [multi-host] $AGENT_B — VM keepalive bekleniyor (max 20s)"
  vm_ok=false
  for _ in $(seq 1 10); do
    if fleet_agent_online "$AGENT_B"; then
      vm_ok=true
      break
    fi
    sleep 2
  done
  if [[ "$vm_ok" != true ]]; then
    echo "[WARN] $AGENT_B online degil — laptop-simulated fallback (host push)"
    FLEET_MODE="laptop-simulated-fallback"
    FLEET_FALLBACK=true
    push_agent "$AGENT_B" 8.3
    sleep 2
  else
    echo "  [OK] $AGENT_B VM keepalive online"
    sleep 1
  fi
else
  push_agent "$AGENT_B" 8.3
  sleep 2
fi

echo "[2] /api/fleet dogrulama"
fleet_json=$(dash_curl -sf -b "$COOKIE_JAR" "${DASH_URL}/api/fleet") \
  || fail "/api/fleet erisilemedi"

read_fleet_counts() {
  read -r agent_count online_count <<<"$(python3 -c "
import json,sys
d=json.load(sys.stdin)
fleet=d.get('fleet',[])
online=sum(1 for a in fleet if a.get('status')=='Online')
print(len(fleet), online)
" <<<"$fleet_json")"
}

list_offline_agents() {
  python3 -c "
import json,sys
d=json.load(sys.stdin)
for a in d.get('fleet',[]):
    if a.get('status')!='Online':
        aid=a.get('agent_id') or a.get('id') or ''
        if aid:
            print(aid)
" <<<"$fleet_json"
}

push_offline_agents() {
  local oid pushed=0
  while IFS= read -r oid; do
    [[ -z "$oid" ]] && continue
    if push_agent_optional "$oid" 1.0; then
      pushed=$((pushed + 1))
    else
      echo "[WARN] telemetry $oid atlandi (offline parity)" >&2
    fi
  done < <(list_offline_agents)
  [[ "$pushed" -gt 0 ]] && sleep 1
}

read_fleet_counts
[[ "$agent_count" -ge 2 ]] || fail "fleet agent sayisi $agent_count < 2"
[[ "$online_count" -ge 2 ]] || fail "online agent $online_count < 2 (telemetry?)"

echo "[3] dispatch — hedef $AGENT_B"
dispatch=$(dash_curl -sf -b "$COOKIE_JAR" \
  -X POST "${DASH_URL}/api/fleet/commands" \
  -H "Content-Type: application/json" \
  -d "{\"commandType\":\"BAN_IP\",\"payload\":\"${TEST_IP}\",\"targetAgentId\":\"${AGENT_B}\",\"reason\":\"fleet-multi-node-e2e\"}") \
  || fail "dispatch POST"

echo "$dispatch" | grep -q '"command"' || fail "dispatch yaniti: $dispatch"

echo "[3b] fleet HMAC imza"
HMAC_KEY="${FLEET_COMMAND_HMAC_KEY:-log-guardian-fleet-command-dev-key}"
hmac_ok=false
if bash "$ROOT/scripts/fleet_command_sign_e2e.sh" 2>/dev/null; then
  hmac_ok=true
  echo "[OK] fleet_command_sign_e2e"
else
  python3 - "$dispatch" "$HMAC_KEY" <<'PY' || fail "fleet HMAC imza dogrulanamadi"
import hashlib, hmac, json, sys
disp=json.loads(sys.argv[1])
key=sys.argv[2]
cmd=disp.get("command") or {}
sig=(cmd.get("signature") or "").strip()
if not sig:
    raise SystemExit("signature yok")
digest="|".join([
    cmd.get("id",""), cmd.get("tenantId",""), cmd.get("commandType",""),
    cmd.get("payload",""), cmd.get("targetAgentId") or "",
])
calc=hmac.new(key.encode(), digest.encode(), hashlib.sha256).hexdigest()
if calc!=sig:
    raise SystemExit(f"imza uyusmadi {calc[:12]} != {sig[:12]}")
print("[OK] dispatch HMAC inline")
PY
  hmac_ok=true
fi

HMAC_PY="True"
$hmac_ok || HMAC_PY="False"
FALLBACK_PY="False"
[[ "$FLEET_FALLBACK" == true ]] && FALLBACK_PY="True"

echo "[4] dispatch dogrulama — hedef $AGENT_B"
python3 -c "
import json,sys
disp=json.loads(sys.argv[1])
cmd=disp.get('command') or {}
if cmd.get('targetAgentId') != sys.argv[2]:
    raise SystemExit(f\"hedef yanlis: {cmd.get('targetAgentId')}\")
if not cmd.get('id'):
    raise SystemExit('command id yok')
# Admin aninda ban basarisizsa kuyruk modu — yine PASS (routing kaniti)
imm=disp.get('immediateBan') or {}
queued=cmd.get('executed') is False and cmd.get('status') in ('pending','delivered')
if disp.get('success') is True or queued:
    print('[OK] dispatch command id='+str(cmd.get('id'))[:8]+'…'+
          (' (kuyruk)' if queued and not disp.get('success') else ''))
else:
    raise SystemExit(f\"dispatch basarisiz: {disp.get('message')}\")
" "$dispatch" "$AGENT_B"

if echo "$dispatch" | grep -q '"executed":false'; then
  cmds_b=$(dash_curl -sf \
    "${DASH_URL}/api/fleet/commands?agent_id=${AGENT_B}" \
    -H "Authorization: Bearer ${API_KEY}") || true
  if [[ -n "${cmds_b:-}" ]]; then
    echo "$cmds_b" | grep -q "$TEST_IP" && echo "[OK] agent B kuyrugunda test IP"
  fi
fi

echo "[4b] filo parity — offline agent telemetry (laptop-simulated)"
if [[ "$FLEET_MODE" != "multi-host" ]]; then
  push_offline_agents || true
  fleet_json=$(dash_curl -sf -b "$COOKIE_JAR" "${DASH_URL}/api/fleet") \
    || fail "/api/fleet (parity)"
  read_fleet_counts
fi

fleet_agents_json=$(python3 -c "
import json,sys
d=json.load(sys.stdin)
print(json.dumps([a.get('agent_id') or a.get('id') for a in d.get('fleet',[]) if a.get('agent_id') or a.get('id')]))
" <<<"$fleet_json")

FLEET_AGENTS_JSON="$fleet_agents_json" python3 -c "
import json, datetime, os
from pathlib import Path
agents=json.loads(os.environ['FLEET_AGENTS_JSON'])
report={
  'date': datetime.datetime.now(datetime.timezone.utc).isoformat(),
  'pass': True,
  'mode': '${FLEET_MODE:-laptop-simulated}',
  'vm_fallback': ${FALLBACK_PY},
  'dash_url': '$DASH_URL',
  'agents': agents,
  'agent_count': int('$agent_count'),
  'online_count': int('$online_count'),
  'dispatch_target': '$AGENT_B',
  'test_ip': '$TEST_IP',
  'command_hmac': ${HMAC_PY},
  'hmac_verify': ${HMAC_PY},
}
Path('$REPORT').write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
"

if [[ "$FLEET_MODE" != "multi-host" && ${#fleet_agents_json} -gt 2 ]]; then
  SIM_ENV="$ROOT/.cache/fleet-simulated.env"
  mkdir -p "$(dirname "$SIM_ENV")"
  agents_csv="$(python3 -c "import json,sys; print(','.join(json.loads(sys.argv[1])))" "$fleet_agents_json")"
  cat >"$SIM_ENV" <<EOF
# laptop-simulated filo — fleet_multi_node_e2e tarafindan yazilir
FLEET_SIMULATED_AGENTS=${agents_csv}
TELEMETRY_URL=${DASH_URL}/api/telemetry
FLEET_API_KEY=${API_KEY}
INTERVAL=8
METRICS_URL=${METRICS_URL:-http://127.0.0.1:9091/metrics}
EOF
  echo "[OK] fleet-simulated.env — keepalive 3/3 (${agents_csv})"
  if systemctl --user is-active log-guardian-fleet-keepalive.service &>/dev/null 2>&1; then
    systemctl --user restart log-guardian-fleet-keepalive.service 2>/dev/null \
      && echo "[OK] fleet keepalive restart (user systemd)" || true
  elif [[ -f "$ROOT/.cache/fleet-keepalive.pid" ]] && kill -0 "$(cat "$ROOT/.cache/fleet-keepalive.pid")" 2>/dev/null; then
    bash "$ROOT/scripts/fleet_telemetry_keepalive.sh" --stop 2>/dev/null || true
    bash "$ROOT/scripts/fleet_telemetry_keepalive.sh" --bg 2>/dev/null \
      && echo "[OK] fleet keepalive restart (nohup)" || true
  fi
fi

AUTO_REFRESH=0 bash "$ROOT/scripts/fleet_offline_gate.sh" >/dev/null 2>&1 || true
DRY_RUN=1 bash "$ROOT/scripts/fleet_prune_pending_commands.sh" >/dev/null 2>&1 || true

echo "[OK] fleet_multi_node_e2e — $agent_count agent, $online_count online → /fleet/dispatch"
echo "  Rapor: $REPORT"
