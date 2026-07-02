#!/usr/bin/env bash
# Statik site guvenlik build (SRI + CSP + allowlist + kapı)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
python3 "$ROOT/scripts/website_i18n_gen_locales.py"
python3 "$ROOT/scripts/website_bundle_i18n.py"
python3 "$ROOT/scripts/website_embed_tests.py"
python3 "$ROOT/scripts/website_gen_screenshots.py"
# website-preview-gate bootstrap: embed sonrasi parity + proof tazele
if [[ -f "$ROOT/competitive-proof.json" ]] && bash "$ROOT/scripts/website_preview_gate.sh" >/dev/null 2>&1; then
  python3 "$ROOT/scripts/competitive_proof_build.py" -o "$ROOT/competitive-proof.json" >/dev/null 2>&1 || true
  python3 "$ROOT/scripts/website_embed_tests.py" >/dev/null 2>&1 || true
fi
bash "$ROOT/scripts/website_refresh_sri.sh"
bash "$ROOT/scripts/website_security_check.sh"
echo "[OK] website_build"
