#!/usr/bin/env bash
# scripts/bench.sh — Faz 0.5: log-guardian throughput ölçümü
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

LOG="${BENCH_LOG:-test_access.log}"
RULES="${BENCH_RULES:-test_rules.conf}"
WORKERS="${BENCH_WORKERS:-$(nproc 2>/dev/null || echo 4)}"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

if [[ ! -f "$LOG" ]]; then
    echo "[bench] Log dosyasi yok: $LOG" >&2
    exit 1
fi

make -j"$(nproc 2>/dev/null || echo 2)" log-guardian >/dev/null

echo "[bench] log=$LOG rules=$RULES workers=$WORKERS"
/usr/bin/time -f '[bench] elapsed %e sec  maxrss %M KB' \
    ./log-guardian "$LOG" --no-tui --json --no-ban --rules "$RULES" -t "$WORKERS" \
    2>/dev/null | tail -n 5
