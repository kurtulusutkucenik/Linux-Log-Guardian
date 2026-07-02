#!/usr/bin/env bash
# Host -> Docker dashboard canli telemetri (sudo gerektirmez)
#   bash scripts/fleet_telemetry_push.sh
#   INTERVAL=8 bash scripts/fleet_telemetry_keepalive.sh   # arka plan
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

TOKEN="${FLEET_API_KEY:-sk_guardian_fleet_test_token_123}"
AGENT_ID="${AGENT_ID:-node-kurtulus-01}"
METRICS_URL="${METRICS_URL:-http://127.0.0.1:9091/metrics}"

resolve_telemetry_url() {
  if [[ -n "${TELEMETRY_URL:-}" ]]; then
    echo "$TELEMETRY_URL"
    return
  fi
  if curl -sf -o /dev/null --max-time 2 "http://127.0.0.1:3000/api/tier" 2>/dev/null; then
    echo "http://127.0.0.1:3000/api/telemetry"
  elif curl -sfk -o /dev/null --max-time 2 "https://127.0.0.1:8443/api/tier" 2>/dev/null; then
    echo "https://127.0.0.1:8443/api/telemetry"
  else
    echo "http://127.0.0.1:3000/api/telemetry"
  fi
}

TELEMETRY_URL="$(resolve_telemetry_url)"

read_metric() {
  local name="$1"
  curl -sf "$METRICS_URL" 2>/dev/null | awk -v n="$name" '$1 ~ "^"n"\\{" {print $2; exit}'
}

EPS="$(read_metric loganalyzer_eps || echo 0)"
LINES="$(read_metric loganalyzer_lines_total || echo 0)"
ALERTS="$(read_metric loganalyzer_alerts_total || echo 0)"
BANS="$(read_metric loganalyzer_bans_success || echo 0)"
UNIQUE="$(read_metric loganalyzer_unique_ips || echo 0)"

ATTACK_TREE="[]"
DEST="${LG_DASHBOARD_DATA:-$ROOT/.cache/dashboard-live}"
if [[ -f "$DEST/attack_tree.json" ]]; then
  ATTACK_TREE="$(python3 -c "
import json, sys
with open(sys.argv[1]) as f:
    raw = json.load(f)
trees = raw if isinstance(raw, list) else raw.get('trees', [])
print(json.dumps(trees))
" "$DEST/attack_tree.json")"
fi

payload=$(python3 <<PY
import json
print(json.dumps({
    "agent_id": "$AGENT_ID",
    "eps": float("$EPS" or 0),
    "total_lines": int(float("$LINES" or 0)),
    "alerts_total": int(float("$ALERTS" or 0)),
    "rce_detections": 0,
    "unique_ips": int(float("$UNIQUE" or 0)),
    "attack_tree": json.loads('''$ATTACK_TREE'''),
}))
PY
)

curl_target="$TELEMETRY_URL"
curl_resolve="${FLEET_CURL_RESOLVE:-}"

# Caddy prod (DOMAIN=localhost): IP ile baglaninca TLS SNI de localhost olmali (--resolve)
if [[ "$TELEMETRY_URL" =~ ^(https?)://([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)(:([0-9]+))?(/.*)?$ ]]; then
  ip_host="${BASH_REMATCH[2]}"
  port_num="${BASH_REMATCH[4]:-}"
  url_path="${BASH_REMATCH[5]:-/api/telemetry}"
  scheme="${BASH_REMATCH[1]}"
  if [[ -z "$port_num" ]]; then
    port_num=$([[ "$scheme" == https ]] && echo 8443 || echo 8080)
  fi
  curl_resolve="${curl_resolve:-localhost:${port_num}:${ip_host}}"
  curl_target="${scheme}://localhost:${port_num}${url_path}"
fi

curl_args=(-sf -X POST "$curl_target" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$payload")

if [[ -n "${FLEET_TELEMETRY_HOST:-}" ]]; then
  curl_args+=(-H "Host: ${FLEET_TELEMETRY_HOST}")
elif [[ -n "$curl_resolve" ]]; then
  curl_args+=(-H "Host: localhost")
fi

if [[ -n "$curl_resolve" ]]; then
  curl_args+=(--resolve "$curl_resolve")
fi

if [[ "$curl_target" == https://* ]]; then
  curl_args+=(-k)
fi

if ! curl "${curl_args[@]}" | grep -q '"success":true'; then
  echo "[fleet_push] FAIL — dashboard ayakta mi? TELEMETRY_URL=$TELEMETRY_URL" >&2
  if [[ -n "$curl_resolve" ]]; then
    echo "  TLS ipucu: curl -sk --resolve '${curl_resolve}' ${curl_target%/api/telemetry}/api/tier" >&2
  fi
  exit 1
fi

echo "[fleet_push] OK agent=$AGENT_ID eps=$EPS lines=$LINES alerts=$ALERTS -> $TELEMETRY_URL"
