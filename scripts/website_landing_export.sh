#!/usr/bin/env bash
# Next.js landing → static export (preview / optional deploy bundle)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LANDING="$ROOT/landing"
OUT="$ROOT/landing/out"

echo "=== website_landing_export ==="
bash "$ROOT/scripts/landing_sync_assets.sh"
cd "$LANDING"
npm run build
[[ -d "$OUT" ]] || { echo "[FAIL] landing/out yok" >&2; exit 1; }
echo "[OK] website_landing_export -> $OUT"
echo ""
echo "  Önizleme (landing/ klasöründeyken):"
echo "    bash scripts/preview.sh"
echo "    veya: cd out && python3 -m http.server 4321 --bind 0.0.0.0"
echo ""
echo "  Önizleme (repo kökünden):"
echo "    cd landing/out && python3 -m http.server 4321 --bind 0.0.0.0"
echo ""
echo "  Routes: /  /testler  /tests  /paketler"
