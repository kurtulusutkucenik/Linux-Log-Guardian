#!/usr/bin/env bash
# CRS parity kapisi — Guardian vs CRS_REGEX corpus
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

python3 scripts/generate_crs_bundle.py 2>/dev/null || true

MIN_RECALL="${CRS_MIN_RECALL:-0.85}"
MIN_PARITY="${CRS_MIN_PARITY:-0.80}"

python3 scripts/crs_parity_bench.py \
  --min-recall "$MIN_RECALL" \
  --min-parity "$MIN_PARITY" \
  -o crs-parity-report.json

echo "[OK] crs_parity_test"
