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
  soak-report.json soak-report.short.json ops-gate-report.json competitive-proof.pdf real-attack-report.json live-attack-report.json ja3-cluster-report.json \
  ja3-cluster-ban-live.json dashboard-ban-api-report.json webhook-route-proof-report.json \
  auth-log-report.json siem-export-report.json crowdsec-bouncer-report.json \
  fp-cluster-trust-report.json \
  lineage-live-report.json \
  nginx-inline-consult-report.json nginx-hybrid-report.json real-attack-report-10k.json \
  owasp-corpus-report.json tr-hosting-corpus-report.json customer-corpus-report.json \
  threat-intel-sync-report.json threat-intel-prod-report.json eps-architecture-report.json; do
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
if [[ -f "$ROOT/ipv6-ban-e2e-report.json" ]]; then
  cp -f "$ROOT/ipv6-ban-e2e-report.json" "$DEST/ipv6-ban-e2e-report.json"
  echo "[sync] ipv6-ban-e2e-report.json"
fi

if [[ -f "$DEST/attack_tree.json" ]] && command -v curl >/dev/null 2>&1; then
  if bash "$ROOT/scripts/fleet_telemetry_push.sh" 2>/dev/null; then
    echo "[sync] telemetry push OK (agent=$AGENT_ID)"
  elif curl -sf -o /dev/null --max-time 2 "http://127.0.0.1:3000/api/tier" 2>/dev/null \
     || curl -sfk -o /dev/null --max-time 2 "https://127.0.0.1:8443/api/tier" 2>/dev/null; then
    echo "[sync] telemetry push FAIL — bash scripts/fleet_telemetry_push.sh"
  else
    echo "[sync] telemetry SKIP — dashboard ayakta degil (docker compose -f docker-compose.prod.yml up -d dashboard)"
  fi
fi

echo "[sync] OK — dashboard volume: $DEST"
echo "       bash scripts/dashboard_refresh.sh   # sync + docker build (yeni test kartlari)"
echo "       veya: docker compose -f docker-compose.prod.yml up -d --build dashboard"
