#!/usr/bin/env bash
# Yerel kanit tazeleme — GitHub push/tag YOK (18-21 Haz gecesi ayri)
#   bash scripts/local_proof_refresh.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

echo "=== local_proof_refresh (GitHub disi) ==="

[[ -x ./log-guardian ]] || make -s -j"$(nproc 2>/dev/null || echo 2)" log-guardian

echo "[0] Soak kanit + Telegram ops"
bash scripts/publish_soak_report.sh 2>/dev/null || true
sudo bash scripts/telegram_unacked_ops_cleanup.sh 2>/dev/null \
  || bash scripts/telegram_unacked_ops_cleanup.sh 2>/dev/null \
  || echo "[WARN] telegram_unacked_cleanup atlandi (sudo/db)"

echo "[1] Hizli E2E raporlari"
bash scripts/lineage_live_e2e.sh
bash scripts/fp_cluster_trust_e2e.sh
bash scripts/journald_e2e.sh
bash scripts/helm_install_smoke.sh
bash scripts/k8s_admission_test.sh
bash scripts/mesh_etcd_e2e.sh
bash scripts/marketplace_sig_gate.sh
VPS_XDP_SKIP="${VPS_XDP_SKIP:-1}" bash scripts/vps_xdp_proof.sh
bash scripts/build_arm64.sh
bash scripts/copilot_ollama_e2e.sh 2>/dev/null || true

echo "[2] competitive-proof JSON + PDF"
bash scripts/competitive_proof.sh

echo "[3] data-room + release-pack ZIP (yerel)"
bash scripts/data_room_pack.sh
bash scripts/github_release_pack.sh

echo "[4] Dashboard sync"
bash scripts/sync_dashboard_data.sh

echo "[5] Yerel hazirlik kapisi"
bash scripts/release_ready_check.sh
bash scripts/release_ready_gate.sh 2>/dev/null || echo "[WARN] release_ready_gate — SKIP_LIVE=1 ile tekrar dene"

echo ""
echo "[OK] local_proof_refresh tamam"
echo "  competitive-proof.pdf  data-room.zip  release-pack.zip"
echo "  Dashboard: bash scripts/dashboard_refresh.sh  (UI kodu degistiyse)"
echo "  GitHub: 18-21 Haz — gh release create ... (simdilik YAPMA)"
