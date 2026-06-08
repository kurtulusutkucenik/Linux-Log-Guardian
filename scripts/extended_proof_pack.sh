#!/usr/bin/env bash
# OWASP + TR hosting + threat intel fixture kanitlari (hizli, VPS yok)
#   bash scripts/extended_proof_pack.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Linux Log Guardian — genisletilmis kanit paketi        ║"
echo "╚══════════════════════════════════════════════════════════╝"

[[ -x ./log-guardian ]] || make -s -j"$(nproc 2>/dev/null || echo 2)" log-guardian

echo ""
echo "── [1/3] OWASP/CRS corpus"
bash scripts/owasp_corpus_proof.sh

echo ""
echo "── [2/3] TR hosting corpus"
bash scripts/tr_hosting_corpus_proof.sh

echo ""
echo "── [3/3] Threat intel sync"
THREAT_INTEL_FIXTURE="${THREAT_INTEL_FIXTURE:-corpus/fixtures/firehol_sample.netset}" \
  bash scripts/threat_intel_sync_proof.sh

bash scripts/competitive_proof.sh 2>/dev/null || true
bash scripts/data_room_pack.sh 2>/dev/null || true
bash scripts/sync_dashboard_data.sh 2>/dev/null || true

echo ""
echo "[OK] extended_proof_pack tamam"
echo "  owasp-corpus-report.json  tr-hosting-corpus-report.json  threat-intel-sync-report.json"
