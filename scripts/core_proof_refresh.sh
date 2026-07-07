#!/usr/bin/env bash
# Haftalık core kanıt paketi — Track A (A1+A2+A3) + competitive-proof + dashboard sync
#   bash scripts/core_proof_refresh.sh
#   SKIP_IPV6=1 bash scripts/core_proof_refresh.sh   # sudo ipv6 atla
#   UI=1 bash scripts/core_proof_refresh.sh          # docker dashboard rebuild
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

echo "=== core_proof_refresh (Track A) ==="

echo "[1/4] nginx_hybrid_proof"
bash "$ROOT/scripts/nginx_hybrid_proof.sh"

echo "[2/4] ban_profile_e2e"
bash "$ROOT/scripts/ban_profile_e2e.sh"

if [[ "${SKIP_IPV6:-0}" != "1" ]]; then
  echo "[3/4] ipv6_ban_e2e"
  ipv6_ok=0
  if [[ "$(id -u)" -eq 0 ]]; then
    bash "$ROOT/scripts/ipv6_ban_e2e.sh" && ipv6_ok=1 || echo "[WARN] ipv6_ban_e2e FAIL" >&2
  elif sudo -n true 2>/dev/null; then
    sudo bash "$ROOT/scripts/ipv6_ban_e2e.sh" && ipv6_ok=1 || echo "[WARN] ipv6_ban_e2e FAIL" >&2
  else
    echo "[WARN] ipv6_ban_e2e — sudo parola gerekli; atlandi (manuel: sudo bash scripts/ipv6_ban_e2e.sh)" >&2
  fi
  [[ "$ipv6_ok" -eq 1 ]] || true
else
  echo "[3/4] ipv6_ban_e2e — SKIP_IPV6=1"
fi

echo "[4/4] quick_proof_refresh"
REFRESH_CORE_PROOF=0 bash "$ROOT/scripts/quick_proof_refresh.sh"

if [[ "${UI:-0}" == "1" ]]; then
  bash "$ROOT/scripts/dashboard_refresh.sh"
fi

echo ""
echo "[OK] core_proof_refresh tamam"
echo "  nginx-hybrid-report.json  ban-profile-e2e-report.json  ipv6-ban-e2e-report.json"
proof_n=$(python3 -c "import json; print(len(json.load(open('$ROOT/competitive-proof.json')).get('validationTests',[])))" 2>/dev/null || echo "?")
echo "  competitive-proof.json  (${proof_n}/${proof_n})"
[[ "${UI:-0}" == "1" ]] || echo "  UI: bash scripts/dashboard_refresh.sh"
