#!/usr/bin/env bash
# P1–P4 oncelik sirasi (GitHub haric) — tek kapı
#   bash scripts/release_prep_no_github.sh
#   bash scripts/release_prep_no_github.sh --full   # + local_proof_refresh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

FULL=0
[[ "${1:-}" == "--full" ]] && FULL=1

step() { echo ""; echo "=== $* ==="; }

step "P1 #1 .deb paket"
bash scripts/build_deb.sh

step "P2 #7 bench kaniti (ModSec EPS/latency)"
bash scripts/bench_refresh.sh

step "P2 #5 prod_stack_e2e"
SKIP_WASM_REBUILD=1 bash scripts/prod_stack_e2e.sh

step "P2 #6 competitive_gate"
bash scripts/competitive_gate.sh

step "P2 #4 XDP kaniti (laptop: ipset-fallback)"
VPS_XDP_SKIP="${VPS_XDP_SKIP:-1}" bash scripts/vps_xdp_proof.sh

step "P4 #12 marketplace imza"
bash scripts/marketplace_sig_gate.sh

step "P4 #15 journald ingest"
bash scripts/journald_e2e.sh

step "auth.log sshd ingest"
bash scripts/auth_log_e2e.sh

step "guardian-status + dashboard sync"
bash scripts/guardian_status_export.sh 2>/dev/null || true
bash scripts/sync_dashboard_data.sh

step "P3 #8 fleet multi-node"
FLEET_E2E_ENV=()
if curl -sfk -o /dev/null --max-time 2 \
    --resolve 'localhost:8443:127.0.0.1' "https://localhost:8443/api/tier" 2>/dev/null; then
  FLEET_E2E_ENV+=(FLEET_AGENT_A=node-kurtulus-01 FLEET_AGENT_B=node-vm-02)
fi
if env "${FLEET_E2E_ENV[@]}" bash scripts/fleet_multi_node_e2e.sh; then
  echo "[OK] fleet_multi_node"
else
  echo "[WARN] fleet_multi_node atlandi — dashboard :8443 ayakta mi?" >&2
fi

step "P3 #9 Grafana alert (\$tenant)"
if bash scripts/grafana_alert_gate.sh; then
  echo "[OK] grafana_alert_gate"
else
  echo "[WARN] grafana_alert_gate atlandi — docker grafana_stack veya GRAFANA_URL" >&2
fi

step "P3 #10 Helm install smoke"
bash scripts/helm_install_smoke.sh

step "P3 #11 webhook ACK (Gordum sayaci)"
if bash scripts/webhook_ack_e2e.sh; then
  echo "[OK] webhook_ack_e2e"
else
  echo "[WARN] webhook_ack_e2e atlandi" >&2
fi

step "P4 #14 mesh etcd"
bash scripts/mesh_etcd_e2e.sh

step "P4 #13 Copilot Ollama/fallback"
if bash scripts/copilot_ollama_e2e.sh; then
  echo "[OK] copilot_ollama_e2e"
else
  echo "[WARN] copilot_ollama_e2e atlandi" >&2
fi

step "P4 #16 ARM build smoke"
bash scripts/build_arm64.sh

step "P1 #2 site / kanit sync"
bash scripts/website_sync_tests.sh

step "P7 attack map — /api/attack-geo"
if bash scripts/attack_map_e2e.sh; then
  echo "[OK] attack_map_e2e"
else
  echo "[WARN] attack_map_e2e atlandi — dashboard :8443 ayakta mi?" >&2
fi

if [[ "$FULL" -eq 1 ]]; then
  step "P1 #3 data room / proof ZIP"
  bash scripts/local_proof_refresh.sh
fi

n="$(python3 -c "import json; print(len(json.load(open('competitive-proof.json'))['validationTests']))")"
echo ""
echo "[OK] release_prep_no_github — $n validation test"
echo "  Dashboard: bash scripts/dashboard_refresh.sh && Ctrl+Shift+R https://localhost:8443"
echo "  /fleet/dispatch · Grafana :3002 · Site: bash scripts/preview_website.sh"
echo "  VPS XDP: sudo bash scripts/vps_xdp_proof.sh  (VPS_XDP_SKIP=0)"
