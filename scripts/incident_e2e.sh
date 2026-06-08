#!/usr/bin/env bash
# Faz 2.3 — INCIDENT_ID korelasyon smoke
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

make -j"$(nproc 2>/dev/null || echo 2)" -s log-guardian

echo "[1] incident-sim (SQLi + execve)"
out=$(./log-guardian incident-sim 2>/dev/null)
echo "$out" | grep -q '"incident_id":"INC-'

echo "[2] strict log → SQLi signal"
rm -f events.db
./log-guardian test_schema_strict.log --no-tui --json --no-ban --rules rules.conf \
  --db events.db 2>/dev/null | grep -q '"alerts_total": 1'

echo "[3] host execve → ayni IP'ye INCIDENT"
./log-guardian incident-sim 2>/dev/null | grep -q '10.0.0.99'

echo "[4] INCIDENT_MIN_LOG_HITS (3 satir, tek process)"
rm -f events.db
./log-guardian test_incident_3hits.log --no-tui --json --no-ban \
  --rules rules.conf --db events.db 2>/dev/null >/dev/null
./log-guardian --status --db events.db 2>/dev/null | grep -q '"incident_id":"INC-'

echo "OK — incident_e2e"
