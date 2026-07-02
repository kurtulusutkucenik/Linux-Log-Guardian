#!/usr/bin/env bash
# Ek filo node kaydi (dashboard /fleet — telemetry push)
#   bash scripts/fleet_register_node.sh node-laptop-02
#   bash scripts/fleet_register_node.sh   # varsayilan: node-kurtulus-02
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AGENT_ID="${1:-node-kurtulus-02}"
export AGENT_ID
export FLEET_API_KEY="${FLEET_API_KEY:-sk_guardian_fleet_test_token_123}"

if [[ -z "${TELEMETRY_URL:-}" ]]; then
  if curl -sf -o /dev/null --max-time 2 "http://127.0.0.1:3000/api/tier" 2>/dev/null; then
    export TELEMETRY_URL="http://127.0.0.1:3000/api/telemetry"
  elif curl -sfk -o /dev/null --max-time 2 "https://127.0.0.1:8443/api/tier" 2>/dev/null; then
    export TELEMETRY_URL="https://127.0.0.1:8443/api/telemetry"
  else
    export TELEMETRY_URL="http://127.0.0.1:3000/api/telemetry"
  fi
fi

echo "=== fleet_register_node ($AGENT_ID) ==="
echo "  TELEMETRY_URL=${TELEMETRY_URL}"
if [[ "$TELEMETRY_URL" == *HOST_IP* ]]; then
  echo "[fleet_register_node] FAIL: HOST_IP placeholder — gercek IP yazin" >&2
  echo "  Host'ta: ip -4 route get 1.1.1.1 | awk '{print \$7; exit}'" >&2
  echo "  NAT VM:  TELEMETRY_URL=https://10.0.2.2:8443/api/telemetry" >&2
  echo "  Bridge:  TELEMETRY_URL=https://192.168.x.x:8443/api/telemetry" >&2
  exit 1
fi
bash "$ROOT/scripts/fleet_telemetry_push.sh"
echo "[OK] Filoda görünmesi için: https://localhost:8443/fleet (Ctrl+Shift+R)"
echo "  VM curl test: curl -sk --resolve 'localhost:8443:HOST_IP' https://localhost:8443/api/tier"
