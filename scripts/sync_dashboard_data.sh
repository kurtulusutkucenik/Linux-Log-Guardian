#!/usr/bin/env bash
# Host'taki benchmark + lineage ciktilarini Docker dashboard'un gorebilecegi yere kopyalar.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="${LG_DASHBOARD_DATA:-$ROOT/.cache/dashboard-live}"
TOKEN="${FLEET_API_KEY:-sk_guardian_fleet_test_token_123}"
AGENT_ID="${AGENT_ID:-node-kurtulus-01}"
TELEMETRY_URL="${TELEMETRY_URL:-http://127.0.0.1:3000/api/telemetry}"
GUARDIAN_API_PORT="${GUARDIAN_API_PORT:-8090}"

# shellcheck source=scripts/lib/guardian_api.sh
source "$ROOT/scripts/lib/guardian_api.sh" 2>/dev/null || true

mkdir -p "$DEST"

# /tests live-pipeline karti — eski ipc:fail onlenir
if [[ -x "$ROOT/scripts/guardian_status_export.sh" ]]; then
  bash "$ROOT/scripts/guardian_status_export.sh" 2>/dev/null || true
fi

# CrowdSec kanit raporu — dashboard sync'te dry-run (50 canli ban / rate-limit onlenir)
# Canli kanit: CROWDSEC_LIVE_SYNC=1 bash scripts/sync_dashboard_data.sh
if [[ -x "$ROOT/scripts/crowdsec_bouncer_e2e.sh" ]]; then
  if [[ "${CROWDSEC_LIVE_SYNC:-0}" == "1" ]]; then
    LIVE_API=1 bash "$ROOT/scripts/crowdsec_bouncer_e2e.sh" 2>/dev/null \
      || bash "$ROOT/scripts/crowdsec_bouncer_e2e.sh" 2>/dev/null || true
  else
    LIVE_API=0 bash "$ROOT/scripts/crowdsec_bouncer_e2e.sh" 2>/dev/null || true
  fi
fi

if [[ -x "$ROOT/scripts/taxii_feed_e2e.sh" ]]; then
  LIVE_API=0 bash "$ROOT/scripts/taxii_feed_e2e.sh" 2>/dev/null || true
fi

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
  ja3-cluster-ban-live.json dashboard-ban-api-report.json webhook-route-proof-report.json webhook-telegram-live-report.json webhook-telegram-ack-live-report.json telegram-operator-undo-e2e-report.json telegram-soc-gate-report.json bans-telegram-ops-report.json edge-protection-gate-report.json edge-protection-checklist-report.json grafana-parity-gate-report.json website-preview-gate-report.json enterprise-escalation-gate-report.json enterprise-e9-verify-report.json vm-host-prep-gate-report.json docs-consistency-gate-report.json vm-fleet-gate-report.json laptop-excellence-gate-report.json website-live-gate-report.json release-ready-gate-report.json demo-rehearsal-gate-report.json presentation-ship-gate-report.json demo-video-gate-report.json github-ship-gate-report.json laptop-core-gate-report.json morning-operator-gate-report.json \
  fleet-multi-node-report.json fleet-command-sign-report.json fleet-prune-cmds-report.json dashboard-tests-live-report.json grafana-provision-report.json attack-map-report.json \
  proof-replay-webhook-ban.json dashboard-live-demo.json wasm-status.json \
  auth-log-report.json journald-ingest-report.json siem-export-report.json crowdsec-bouncer-report.json \
  honeypot-feed-report.json l7-probe-prod-report.json \
  helm-install-smoke-report.json k8s-admission-report.json k8s-kind-e2e-report.json mesh-etcd-docker-report.json mesh-etcd-live-report.json \
  vps-xdp-report.json marketplace-sig-report.json marketplace-signed-api-report.json compliance-export-report.json \
  mesh-etcd-report.json copilot-ollama-report.json arm64-build-report.json \
  fp-cluster-trust-report.json \
  lineage-live-report.json \
  nginx-inline-consult-report.json nginx-hybrid-report.json real-attack-report-10k.json \
  owasp-corpus-report.json tr-hosting-corpus-report.json customer-corpus-report.json \
  threat-intel-sync-report.json threat-intel-prod-report.json taxii-feed-report.json \
  parser-fuzz-report.json ban-policy-audit-report.json ban-profile-e2e-report.json \
  dist-risk-proof-report.json lineage-incident-report.json intel-ban-db-report.json \
  eps-architecture-report.json \
  prod-stack-e2e-report.json phase100-fast-gate-report.json vm-sprint-proof.json; do
  copy_if "$f"
done

if [[ -f "$ROOT/rules/marketplace/manifest.json" ]]; then
  cp -f "$ROOT/rules/marketplace/manifest.json" "$DEST/marketplace-manifest.json"
  echo "[sync] marketplace-manifest.json -> $DEST/marketplace-manifest.json"
fi

if [[ -f "$ROOT/.cache/lineage_live/attack_tree.json" ]]; then
  cp -f "$ROOT/.cache/lineage_live/attack_tree.json" "$DEST/attack_tree.json"
  echo "[sync] attack_tree.json (lineage_live)"
elif [[ -f /run/log-guardian/attack_tree.json ]]; then
  cp -f /run/log-guardian/attack_tree.json "$DEST/attack_tree.json"
  echo "[sync] attack_tree.json (daemon)"
fi

refresh_daemon_active_bans() {
  local json="/run/log-guardian/active_bans.json"
  [[ -f "$json" ]] || return 0
  [[ "${LG_SYNC_NO_SUDO:-0}" == "1" ]] && return 0
  if [[ -w "$json" ]]; then
    FORCE_IPSET_REFRESH=1 bash "$ROOT/scripts/repair_active_bans_json.sh" "$json" 2>/dev/null || true
  elif command -v sudo >/dev/null 2>&1; then
    sudo -n FORCE_IPSET_REFRESH=1 bash "$ROOT/scripts/repair_active_bans_json.sh" "$json" 2>/dev/null || true
  fi
}

fetch_api_bans_json() {
  local tok api_port bans_json curl_args=(-sf --max-time 5)
  tok=$(read_lg_api_token 2>/dev/null || true)
  api_port=$(read_lg_api_port 2>/dev/null || echo "$GUARDIAN_API_PORT")
  if [[ -n "$tok" ]]; then
    curl_args+=(-H "Authorization: Bearer ${tok}")
  fi
  bans_json=$(curl "${curl_args[@]}" "http://127.0.0.1:${api_port}/api/v1/bans" 2>/dev/null || true)
  if [[ -n "$bans_json" ]] && echo "$bans_json" | grep -q '"ips"'; then
    echo "$bans_json"
  fi
}

sync_active_bans_to_cache() {
  local daemon_count=0 api_count=0 bans_json api_port
  api_port=$(read_lg_api_port 2>/dev/null || echo "$GUARDIAN_API_PORT")

  if [[ "${LG_FORCE_EMPTY_BANS:-0}" == "1" ]]; then
    rm -f "$DEST/active_bans.json"
    echo "[sync] active_bans.json (cleanup — bos, proof onizleme)"
    return 0
  fi

  if [[ -f /run/log-guardian/active_bans.json ]]; then
    refresh_daemon_active_bans
    daemon_count=$(python3 -c "
import json
try:
    d=json.load(open('/run/log-guardian/active_bans.json'))
    print(int(d.get('total_count') or len(d.get('ips') or [])))
except Exception:
    print(0)
" 2>/dev/null || echo 0)
    if [[ "${daemon_count:-0}" -gt 0 ]]; then
      cp -f /run/log-guardian/active_bans.json "$DEST/active_bans.json"
      echo "[sync] active_bans.json (daemon ipset, count=$daemon_count)"
      return 0
    fi
  fi

  bans_json=$(fetch_api_bans_json || true)
  if [[ -n "$bans_json" ]]; then
    api_count=$(echo "$bans_json" | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('ips') or []))" 2>/dev/null || echo 0)
    if [[ "${api_count:-0}" -gt 0 ]]; then
      echo "$bans_json" > "$DEST/active_bans.json"
      echo "[sync] active_bans.json (${api_port} API, count=$api_count)"
      return 0
    fi
  fi

  rm -f "$DEST/active_bans.json"
  echo "[sync] active_bans.json (bos — cache temizlendi, proof onizleme)"
}

sync_active_bans_to_cache

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
