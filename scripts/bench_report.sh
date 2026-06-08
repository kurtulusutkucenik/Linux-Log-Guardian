#!/usr/bin/env bash
# Faz 0.5 — throughput + bellek + FP raporu (satis kaniti)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

LOG="${BENCH_LOG:-test_access.log}"
RULES="${BENCH_RULES:-test_rules.conf}"
WORKERS="${BENCH_WORKERS:-$(nproc 2>/dev/null || echo 4)}"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"
REPORT="${BENCH_REPORT:-bench-report.txt}"

if [[ -x ./log-guardian ]]; then
  LG=./log-guardian
elif [[ -x /usr/local/bin/log-guardian ]]; then
  LG=/usr/local/bin/log-guardian
else
  make -j"$(nproc 2>/dev/null || echo 2)" -s log-guardian tester >/dev/null
  LG=./log-guardian
fi
if [[ ! -x ./tester ]]; then
  make -j"$(nproc 2>/dev/null || echo 2)" -s tester >/dev/null 2>&1 || true
fi

{
  echo "=== Log Guardian Benchmark Report ==="
  echo "date: $(date -Iseconds)"
  echo "log: $LOG ($(wc -l < "$LOG" 2>/dev/null || echo 0) lines)"
  echo "rules: $RULES"
  echo "workers: $WORKERS"
  echo ""

  echo "--- analyzer throughput (no-ban, json) ---"
  /usr/bin/time -f 'elapsed_sec %e  maxrss_kb %M' \
    "$LG" "$LOG" --no-tui --json --no-ban --no-db --rules "$RULES" -t "$WORKERS" \
    2>/dev/null | head -12

  CRS_RULES="${BENCH_CRS_RULES:-rules.conf}"
  CRS_TIMEOUT="${BENCH_CRS_TIMEOUT:-120}"
  if [[ -f "$CRS_RULES" ]]; then
    echo ""
    echo "--- analyzer throughput (CRS $CRS_RULES, no-ban, timeout=${CRS_TIMEOUT}s) ---"
    timeout "$CRS_TIMEOUT" /usr/bin/time -f 'elapsed_sec %e  maxrss_kb %M' \
      "$LG" "$LOG" --no-tui --json --no-ban --no-db --rules "$CRS_RULES" -t "$WORKERS" \
      2>/dev/null | head -12 || echo "(CRS bench timeout veya hata — BENCH_CRS_TIMEOUT artir)"
  fi

  if [[ "${PHASE100_FAST:-0}" != "1" && "${BENCH_SKIP_FP:-0}" != "1" ]]; then
    echo ""
    echo "--- false-positive (fp_report) ---"
    BENCH_LOG="$LOG" BENCH_RULES="$RULES" bash scripts/fp_report.sh 2>/dev/null | tail -n 6 || true
    [[ -f fp-report.txt ]] && tail -n 4 fp-report.txt || true
  else
    echo ""
    echo "--- false-positive (fp_report atlandi — PHASE100_FAST/competitive_suite) ---"
    [[ -f fp-report.txt ]] && tail -n 4 fp-report.txt || true
  fi

  echo ""
  echo "--- tester (3s sqli, sonsuz ddos yok) ---"
  TESTER_PORT="${ATTACK_PORT:-80}"
  if [[ -x ./tester ]]; then
    timeout 3 ./tester --mode sqli --host 127.0.0.1 --port "$TESTER_PORT" --threads 1 --rps 20 2>&1 | tail -n 6 \
      || echo "(tester: hedef kapali olabilir — port ${TESTER_PORT}, binary OK)"
  else
    echo "(tester binary yok)"
  fi

  echo ""
  echo "--- operator --status (kisaltilmis) ---"
  STATUS_RULES="rules.conf"
  STATUS_DB="events.db"
  [[ -f /etc/log-guardian/rules.conf ]] && STATUS_RULES="/etc/log-guardian/rules.conf"
  [[ -f /etc/log-guardian/events.db ]] && STATUS_DB="/etc/log-guardian/events.db"
  "$LG" --status --quiet --rules "$STATUS_RULES" --db "$STATUS_DB" 2>/dev/null | head -c 500 || true
  echo ""
} | tee "$REPORT"

echo "[bench_report] yazildi: $REPORT"
