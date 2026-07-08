#!/usr/bin/env bash
# Tam kanit paketi — 1K + 10K + TLS + consult + live + release ZIP (~30-60 dk)
#   sudo bash scripts/nginx_tls_local_setup.sh   # ilk sefer
#   sudo systemctl restart log-guardian-daemon log-guardian
#   bash scripts/full_proof_pack.sh
#   STABILITY=1 bash scripts/full_proof_pack.sh  # + 5 dk soak
# Laptop 80/80 (hizli): bash scripts/proof_gate_recovery.sh
# IPv6 ag kesintisi: SKIP_IPV6=1 (varsayilan laptop) — sudo bash scripts/ipv6_ban_e2e.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Linux Log Guardian — tam kanit paketi                  ║"
echo "╚══════════════════════════════════════════════════════════╝"

[[ -x ./log-guardian ]] || make -s -j"$(nproc 2>/dev/null || echo 2)" log-guardian

echo ""
echo "── [1/3] Corpus 10K"
bash scripts/corpus_10k_proof.sh

echo ""
echo "── [1b/4] Genisletilmis corpus (OWASP + TR + threat intel)"
bash scripts/extended_proof_pack.sh

echo ""
echo "── [2/4] Rakip kanit (1K + JA3 TLS + consult + live + soak)"
STABILITY="${STABILITY:-0}" JA3_LIVE=1 NGINX_CONSULT=1 LIVE_ATTACK=1 bash scripts/rakip_kanit.sh

echo ""
echo "── [3/4] GitHub release pack"
bash scripts/github_release_pack.sh

if [[ "${STABILITY:-0}" == "1" ]]; then
  echo ""
  echo "── [4/4] Kapi dogrulama"
  SOAK_SHORT_GATE=1 bash scripts/competitive_gate.sh
  REQUIRE_STABILITY=1 bash scripts/release_ready_check.sh
fi

echo ""
echo "[OK] full_proof_pack tamam"
echo "  competitive-proof.pdf  release-pack.zip  data-room.zip"
