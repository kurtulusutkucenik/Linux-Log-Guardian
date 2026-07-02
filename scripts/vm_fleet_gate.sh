#!/usr/bin/env bash
# Sprint AL — VM filo keepalive kapisi (host node-kurtulus-01 + VM node-vm-02 ONLINE)
#   bash scripts/vm_fleet_gate.sh
# VM icinde keepalive: bash scripts/vm_fleet_agent_setup.sh --install-user-service
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REPORT="${VM_FLEET_GATE_REPORT:-vm-fleet-gate-report.json}"
HOST_AGENT="${FLEET_HOST_AGENT:-node-kurtulus-01}"
VM_AGENT="${FLEET_VM_AGENT:-node-vm-02}"
ADMIN_PASS="${DASHBOARD_ADMIN_PASSWORD:-DegistirBeni!123}"
COOKIE_JAR="$(mktemp)"
trap 'rm -f "$COOKIE_JAR"' EXIT

if [[ -f "$ROOT/.env" ]]; then
  # shellcheck disable=SC1090
  set -a && source "$ROOT/.env" && set +a
  ADMIN_PASS="${DASHBOARD_ADMIN_PASSWORD:-$ADMIN_PASS}"
fi

fail() {
  python3 -c "
import json, datetime
from pathlib import Path
Path('$REPORT').write_text(json.dumps({
  'date': datetime.datetime.now(datetime.timezone.utc).isoformat(),
  'pass': False,
  'fail_reason': '''$*''',
  'host_agent': '$HOST_AGENT',
  'vm_agent': '$VM_AGENT',
  'script': 'scripts/vm_fleet_gate.sh',
}, indent=2)+'\n', encoding='utf-8')
"
  echo "[vm_fleet_gate] FAIL: $*" >&2
  exit 1
}

resolve_dash_url() {
  if [[ -n "${DASH_URL:-}" ]]; then
    echo "$DASH_URL"
    return
  fi
  if curl -sfk -o /dev/null --max-time 2 \
      --resolve 'localhost:8443:127.0.0.1' "https://localhost:8443/api/tier" 2>/dev/null; then
    echo "https://localhost:8443"
  elif curl -sf -o /dev/null --max-time 2 "http://127.0.0.1:3000/api/tier" 2>/dev/null; then
    echo "http://127.0.0.1:3000"
  else
    fail "dashboard yok — docker compose -f docker-compose.prod.yml up -d"
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

echo "=== vm_fleet_gate (Sprint AL) ==="

OPS_DOC="$ROOT/docs/LAPTOP_OPS.md"
[[ -f "$OPS_DOC" ]] || fail "docs/LAPTOP_OPS.md yok"

login_code=""
for _attempt in 1 2 3 4 5; do
  login_code=$(dash_curl -s -o /dev/null -w '%{http_code}' -c "$COOKIE_JAR" \
    -X POST "${DASH_URL}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"admin\",\"password\":\"${ADMIN_PASS}\"}")
  [[ "$login_code" == "200" ]] && break
  [[ "$login_code" == "429" ]] && sleep 2 && continue
  break
done
[[ "$login_code" == "200" ]] || fail "dashboard login HTTP $login_code"

fleet_json=$(dash_curl -sf -b "$COOKIE_JAR" "${DASH_URL}/api/fleet") \
  || fail "/api/fleet erisilemedi"

host_keepalive=0
if systemctl --user is-active log-guardian-fleet-keepalive.service &>/dev/null; then
  host_keepalive=1
elif [[ -f "$ROOT/.cache/fleet-keepalive.pid" ]] && kill -0 "$(cat "$ROOT/.cache/fleet-keepalive.pid")" 2>/dev/null; then
  host_keepalive=1
fi

python3 - "$REPORT" "$OPS_DOC" "$fleet_json" "$DASH_URL" "$HOST_AGENT" "$VM_AGENT" "$host_keepalive" <<'PY'
import json, datetime, sys
from pathlib import Path

report_path, ops_path, fleet_raw, dash_url, host_id, vm_id = sys.argv[1:7]
host_keepalive = int(sys.argv[7])
ops = Path(ops_path).read_text(encoding="utf-8")
fleet_data = json.loads(fleet_raw)
agents = fleet_data.get("fleet") or []

def agent_status(agent_id: str) -> str:
    for a in agents:
        aid = a.get("agent_id") or a.get("agentId") or a.get("id")
        if aid == agent_id:
            return str(a.get("status") or "Unknown")
    return "Missing"

host_st = agent_status(host_id)
vm_st = agent_status(vm_id)
online = sum(1 for a in agents if a.get("status") == "Online")

doc_tokens = [
    "node-vm-02",
    "vm_fleet_agent_setup.sh",
    "host_fleet_agent_setup.sh",
    "log-guardian-fleet-keepalive",
]
doc_ok = all(t in ops for t in doc_tokens)

reasons = []
if host_st != "Online":
    reasons.append(f"host_agent={host_id}:{host_st}")
if vm_st != "Online":
    reasons.append(f"vm_agent={vm_id}:{vm_st}")
if not doc_ok:
    missing = [t for t in doc_tokens if t not in ops]
    reasons.append("laptop_ops:" + ",".join(missing))

ok = len(reasons) == 0
out = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "pass": ok,
    "dash_url": dash_url,
    "host_agent": host_id,
    "vm_agent": vm_id,
    "host_status": host_st,
    "vm_status": vm_st,
    "online_count": online,
    "agent_count": len(agents),
    "host_keepalive_active": bool(host_keepalive),
    "laptop_ops_doc_ok": doc_ok,
    "script": "scripts/vm_fleet_gate.sh",
}
if not ok:
    out["fail_reason"] = "; ".join(reasons)
Path(report_path).write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
print(json.dumps(out, indent=2))
if not ok:
    sys.exit(1)
PY

echo "[OK] vm_fleet_gate — ${HOST_AGENT}=Online ${VM_AGENT}=Online → ${DASH_URL}/fleet"
echo "  VM keepalive: bash scripts/vm_fleet_agent_setup.sh --install-user-service"
