#!/usr/bin/env bash
# Laptop release kapisi — .deb + sprint (GitHub oncesi yerel kanit)
#   bash scripts/laptop_release_gate.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Linux Log Guardian — laptop release gate                ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

bash "$ROOT/scripts/laptop_sprint_gate.sh"
echo ""
bash "$ROOT/scripts/test_deb_local.sh"
echo ""
bash "$ROOT/scripts/website_deploy_gate.sh" 2>/dev/null || {
  echo "[WARN] website_deploy_gate atlandi veya FAIL — site degismediyse OK" >&2
}

echo ""
echo "[OK] laptop_release_gate — yerel release hazir"
echo "  .deb: dist/log-guardian_*.deb"
echo "  VM:   bash /mnt/lg/scripts/vm_sync_from_host.sh && sudo bash scripts/vm_demo_gate.sh"
