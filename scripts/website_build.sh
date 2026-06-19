#!/usr/bin/env bash
# Statik site guvenlik build (SRI + CSP + allowlist + kapı)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
python3 "$ROOT/scripts/website_i18n_gen_locales.py"
python3 "$ROOT/scripts/website_bundle_i18n.py"
bash "$ROOT/scripts/website_refresh_sri.sh"
bash "$ROOT/scripts/website_security_check.sh"
echo "[OK] website_build"
