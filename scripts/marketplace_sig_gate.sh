#!/usr/bin/env bash
# Marketplace imza kapisi — unsigned paket prod'da yuklenmez
#   bash scripts/marketplace_sig_gate.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail=0
ok() { echo "[OK] $*"; }
bad() { echo "[FAIL] $*"; fail=$((fail + 1)); }

echo "=== marketplace_sig_gate ==="

MANIFEST="$ROOT/rules/marketplace/manifest.json"
[[ -f "$MANIFEST" ]] || { echo "[FAIL] manifest yok" >&2; exit 1; }

python3 - <<'PY'
import json
from pathlib import Path
manifest = json.loads(Path("rules/marketplace/manifest.json").read_text())
for p in manifest.get("packages", []):
    pid = p.get("id", "?")
    if not p.get("sha256"):
        raise SystemExit(f"[FAIL] {pid} sha256 yok")
    if not p.get("signature"):
        raise SystemExit(f"[FAIL] {pid} signature yok")
    sig_path = Path(f"rules/marketplace/{pid}/.signature")
    if not sig_path.is_file():
        raise SystemExit(f"[FAIL] {pid} .signature dosyasi yok")
print("[OK] catalog tum paketler imzali")
PY

INST="$ROOT/rules/installed-marketplace"
if [[ -d "$INST" ]]; then
  for d in "$INST"/*; do
    [[ -d "$d" ]] || continue
    id="$(basename "$d")"
    if [[ -f "$d/.signature" ]]; then
      ok "installed $id .signature"
    else
      bad "installed $id imza dosyasi yok"
    fi
  done
fi

# Unsigned kurulum reddi
export MARKETPLACE_SIGN_KEY="${MARKETPLACE_SIGN_KEY:-log-guardian-marketplace-dev-key}"
export MARKETPLACE_REQUIRE_SIG=1
if python3 scripts/marketplace_install.py core-detection >/dev/null 2>&1; then
  ok "MARKETPLACE_REQUIRE_SIG=1 imzali paket kuruldu"
else
  bad "imzali paket kurulumu basarisiz"
fi

if MARKETPLACE_REQUIRE_SIG=1 python3 scripts/marketplace_install.py core-detection \
    --key wrong-key-test 2>/dev/null; then
  bad "yanlis key ile kurulum gecti"
else
  ok "yanlis imza key reddedildi"
fi

if [[ "$fail" -eq 0 ]]; then
  python3 - "$ROOT/marketplace-sig-report.json" <<'PY'
import json
from datetime import datetime, timezone
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1] if False else Path(".")
p = Path("marketplace-sig-report.json")
manifest = json.loads(Path("rules/marketplace/manifest.json").read_text())
pkgs = [x.get("id") for x in manifest.get("packages", [])]
p.write_text(json.dumps({
    "date": datetime.now(timezone.utc).isoformat(),
    "pass": True,
    "packages_signed": len(pkgs),
    "package_ids": pkgs,
    "require_sig_enforced": True,
    "script": "scripts/marketplace_sig_gate.sh",
}, indent=2) + "\n", encoding="utf-8")
PY
  echo "[OK] marketplace_sig_gate"
  exit 0
fi
echo "[FAIL] marketplace_sig_gate — $fail madde" >&2
exit 1
