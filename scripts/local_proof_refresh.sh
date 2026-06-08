#!/usr/bin/env bash
# Yerel kanit tazeleme — GitHub push/tag YOK (18-21 Haz gecesi ayri)
#   bash scripts/local_proof_refresh.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

echo "=== local_proof_refresh (GitHub disi) ==="

[[ -x ./log-guardian ]] || make -s -j"$(nproc 2>/dev/null || echo 2)" log-guardian

echo "[1] Hizli E2E raporlari"
bash scripts/lineage_live_e2e.sh
bash scripts/fp_cluster_trust_e2e.sh

echo "[2] competitive-proof JSON + PDF"
bash scripts/competitive_proof.sh

echo "[3] data-room + release-pack ZIP (yerel)"
bash scripts/data_room_pack.sh
bash scripts/github_release_pack.sh

echo "[4] Dashboard sync"
bash scripts/sync_dashboard_data.sh

echo "[5] Yerel hazirlik kapisi"
bash scripts/release_ready_check.sh

echo ""
echo "[OK] local_proof_refresh tamam"
echo "  competitive-proof.pdf  data-room.zip  release-pack.zip"
echo "  Dashboard: bash scripts/dashboard_refresh.sh  (UI kodu degistiyse)"
echo "  GitHub: 18-21 Haz — gh release create ... (simdilik YAPMA)"
