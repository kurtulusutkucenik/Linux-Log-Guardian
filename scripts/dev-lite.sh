#!/usr/bin/env bash
# Lite mod: daemon yok, log analiz + DB + JSON (gelistirici hizli test)
set -euo pipefail
cd "$(dirname "$0")/.."
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

make -j"$(nproc)" -s log-guardian
rm -f events.db events.db-wal events.db-shm

./log-guardian test_access.log --no-tui --json --no-ban \
  --rules rules.conf --db events.db

echo ""
./log-guardian --status --db events.db
