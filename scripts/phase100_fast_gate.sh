#!/usr/bin/env bash
# Faz 0-6 hizli kapisi (bench/soak kisaltilmis)
#   PHASE100_FAST=1 bash scripts/phase100_fast_gate.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"
export PHASE100_FAST=1
export LG_QUIET_BUILD=1
export PHASE0_BENCH_TIMEOUT="${PHASE0_BENCH_TIMEOUT:-90}"
export BENCH_CRS_TIMEOUT="${BENCH_CRS_TIMEOUT:-90}"
export COMPETITIVE_FAST=1

echo "=== phase100_fast_gate ==="
echo "  PHASE100_FAST=1 — bench/soak kisaltildi (~10-20 dk)"
LOG="$(mktemp /tmp/phase100_fast.XXXXXX.log)"
trap 'rm -f "$LOG"' EXIT

if bash scripts/phase100.sh >"$LOG" 2>&1; then
  tail -15 "$LOG"
  OUT="${ROOT}/phase100-fast-gate-report.json"
  python3 - "$OUT" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path
Path(sys.argv[1]).write_text(json.dumps({
    "date": datetime.now(timezone.utc).isoformat(),
    "pass": True,
    "mode": "fast",
    "phases": "0-6",
    "script": "scripts/phase100_fast_gate.sh",
}, indent=2) + "\n", encoding="utf-8")
PY
  echo "[OK] report -> phase100-fast-gate-report.json"
  echo "[OK] phase100_fast_gate PASS"
  exit 0
fi

echo "[FAIL] phase100_fast_gate" >&2
grep -E 'FAIL|>> Faz' "$LOG" | tail -20 >&2
tail -30 "$LOG" >&2
exit 1
