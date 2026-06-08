#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export MARKETPLACE_SIGN_KEY="${MARKETPLACE_SIGN_KEY:-log-guardian-marketplace-dev-key}"

python3 scripts/marketplace_sign.py core-detection --update-catalog
python3 scripts/marketplace_sign.py sigma-web --update-catalog

python3 scripts/marketplace_install.py core-detection
python3 scripts/marketplace_install.py sigma-web

test -f rules/installed-marketplace/core-detection/rules.waf
test -f rules/installed-marketplace/sigma-web/sigma.rules

python3 - <<'PY'
import json
from pathlib import Path
cat = json.loads(Path("rules/marketplace/manifest.json").read_text())
assert len(cat["packages"]) >= 2
for p in cat["packages"]:
    assert p.get("sha256"), p["id"]
    assert p.get("signature"), p["id"]
print("[OK] marketplace_test")
PY
