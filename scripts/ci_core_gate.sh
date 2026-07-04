#!/usr/bin/env bash
# GitHub Actions build job — offline core kanit (tam competitive_suite degil).
# Tam 76-test paketi: release workflow (competitive_suite + rakip_kanit).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"
export COMPETITIVE_FAST="${COMPETITIVE_FAST:-1}"
export LIVE="${LIVE:-0}"
export LG_SYNC_NO_SUDO="${LG_SYNC_NO_SUDO:-1}"
export LG_SKIP_DASHBOARD_SYNC="${LG_SKIP_DASHBOARD_SYNC:-1}"
export WASMTIME_ROOT="${WASMTIME_ROOT:-$ROOT/vendor/wasmtime}"
export LD_LIBRARY_PATH="${WASMTIME_ROOT}/lib:${LD_LIBRARY_PATH:-}"
export BENCH_RULES="${BENCH_RULES:-rules.conf}"
export FP_RULES="${FP_RULES:-rules.conf}"

echo "=== ci_core_gate ==="
test -x ./log-guardian || { echo "[ci_core_gate] FAIL: log-guardian yok" >&2; exit 1; }
echo "[ci_core_gate] binary OK ($(wc -c < log-guardian) bytes)"

python3 scripts/generate_benign_corpus.py
python3 scripts/generate_bench_corpus.py
python3 scripts/generate_attack_corpus.py

echo "--- bench vs CRS ---"
bash scripts/bench_vs_modsec.sh

echo "--- false positive ---"
bash scripts/fp_report.sh

echo "--- real attack replay ---"
bash scripts/real_attack_suite.sh

echo "--- lineage live ---"
bash scripts/lineage_live_e2e.sh

echo "--- competitive merge gate ---"
bash scripts/competitive_gate.sh

echo "[OK] ci_core_gate"
