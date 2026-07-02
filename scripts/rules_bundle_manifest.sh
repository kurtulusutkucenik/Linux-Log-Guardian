#!/usr/bin/env bash
# CRS bundle SHA256 manifest — RULES_VERIFY=1 icin
#   bash scripts/rules_bundle_manifest.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RULES="${LG_CRS_RULES:-$ROOT/rules/crs-bundle.rules}"
OUT="${LG_RULES_MANIFEST:-$ROOT/rules/crs-bundle.manifest.json}"
[[ -f "$RULES" ]] || { echo "[rules_bundle_manifest] FAIL: $RULES yok" >&2; exit 1; }
hash=$(sha256sum "$RULES" | awk '{print $1}')
rel="rules/$(basename "$RULES")"
python3 - <<PY
import json
from pathlib import Path
data = {"files": {"$rel": "$hash"}}
Path("$OUT").write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
print(f"[OK] rules manifest -> $OUT ($rel)")
PY
