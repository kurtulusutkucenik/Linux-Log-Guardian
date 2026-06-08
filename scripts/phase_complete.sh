#!/usr/bin/env bash
# 5 faz tamamlama kapisi — test oncesi son kontrol
set -euo pipefail
cd "$(dirname "$0")/.."
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

python3 scripts/generate_crs_bundle.py
bash scripts/phase_gate.sh
bash scripts/phase100.sh
echo ""
echo "Faz 0-5: %100 — docs/PERSONAL_TEST.md"
