#!/usr/bin/env bash
# Host'taki benchmark + lineage ciktilarini Docker dashboard'un gorebilecegi yere kopyalar.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="${LG_DASHBOARD_DATA:-$ROOT/.cache/dashboard-live}"
TOKEN="${FLEET_API_KEY:-sk_guardian_fleet_test_token_123}"
AGENT_ID="${AGENT_ID:-node-kurtulus-01}"
TELEMETRY_URL="${TELEMETRY_URL:-http://127.0.0.1:3000/api/telemetry}"

mkdir -p "$DEST"

copy_if() {
  local f="$1"
  if [[ -f "$ROOT/$f" ]]; then
    cp -f "$ROOT/$f" "$DEST/$(basename "$f")"
    echo "[sync] $f -> $DEST/$(basename "$f")"
  fi
}

for f in bench-vs-modsec.json fp-report.json bench-ban-latency.json guardian-status.json \
  crs-parity-report.json tenant-isolation-report.json competitive-proof.json compliance-report.json \
  soak-report.json competitive-proof.pdf real-attack-report.json live-attack-report.json ja3-cluster-report.json \
  ja3-cluster-ban-live.json \
  fp-cluster-trust-report.json \
  lineage-live-report.json \
  nginx-inline-consult-report.json real-attack-report-10k.json \
  owasp-corpus-report.json tr-hosting-corpus-report.json threat-intel-sync-report.json; do
  copy_if "$f"
done

if [[ -f "$ROOT/.cache/lineage_live/attack_tree.json" ]]; then
  cp -f "$ROOT/.cache/lineage_live/attack_tree.json" "$DEST/attack_tree.json"
  echo "[sync] attack_tree.json (lineage_live)"
elif [[ -f /run/log-guardian/attack_tree.json ]]; then
  cp -f /run/log-guardian/attack_tree.json "$DEST/attack_tree.json"
  echo "[sync] attack_tree.json (daemon)"
fi

if [[ -f /run/log-guardian/active_bans.json ]]; then
  bash "$ROOT/scripts/repair_active_bans_json.sh" /run/log-guardian/active_bans.json 2>/dev/null || true
  cp -f /run/log-guardian/active_bans.json "$DEST/active_bans.json"
  echo "[sync] active_bans.json (daemon ipset)"
elif command -v curl >/dev/null 2>&1; then
  bans_json=$(curl -sf "http://127.0.0.1:8090/api/v1/bans" 2>/dev/null || true)
  if [[ -n "$bans_json" ]] && echo "$bans_json" | grep -q '"ips"'; then
    echo "$bans_json" > "$DEST/active_bans.json"
    echo "[sync] active_bans.json (8090 API)"
  fi
fi

if [[ -f "$ROOT/bench-ban-latency.json" ]]; then
  cp -f "$ROOT/bench-ban-latency.json" "$DEST/bench-ban-latency.json"
  echo "[sync] bench-ban-latency.json"
fi

if [[ -f "$DEST/attack_tree.json" ]] && command -v curl >/dev/null 2>&1; then
  export DEST AGENT_ID TELEMETRY_URL TOKEN
  payload=$(python3 <<'PY'
import json, os, sys
dest = os.environ["DEST"]
agent = os.environ["AGENT_ID"]
with open(os.path.join(dest, "attack_tree.json")) as f:
    raw = json.load(f)
trees = raw if isinstance(raw, list) else raw.get("trees", [])
print(json.dumps({
    "agent_id": agent,
    "eps": 42.0,
    "alerts_total": 3,
    "rce_detections": 1,
    "attack_tree": trees,
}))
PY
)
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$TELEMETRY_URL" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload" 2>/dev/null || echo "000")
  echo "[sync] telemetry attack_tree push HTTP $code (agent=$AGENT_ID)"
fi

echo "[sync] OK — dashboard volume: $DEST"
echo "       bash scripts/dashboard_refresh.sh   # sync + docker build (yeni test kartlari)"
echo "       veya: docker compose -f docker-compose.prod.yml up -d --build dashboard"
