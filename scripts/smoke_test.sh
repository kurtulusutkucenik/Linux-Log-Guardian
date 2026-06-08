#!/usr/bin/env bash
# smoke_test.sh — hizli isleyis kontrolu
set -euo pipefail
cd "$(dirname "$0")/.."
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

make -j"$(nproc)" -s

echo "[1] lineage-stats --demo"
./log-guardian lineage-stats --demo 2>/dev/null | grep -q '"active_trees":1'
test -r ./attack_tree.json

echo "[2] crs-stats (test_rules)"
./log-guardian crs-stats --rules test_rules.conf 2>/dev/null | grep -q '"pcre_total"'

echo "[3] JSON analiz"
out=$(./log-guardian test_access.log --no-tui --json --no-ban --no-db --pool-mb 32 --rules test_rules.conf 2>/dev/null)
echo "$out" | grep -q '"total_lines"'

echo "[4] schema 2 satir"
out=$(timeout 60 ./log-guardian test_schema_access.log --no-tui --json --no-ban --no-db \
  --pool-mb 32 --rules smoke_schema.conf 2>/dev/null) || {
  echo "[4] timeout veya hata — smoke_schema.conf kontrol" >&2
  exit 1
}
echo "$out" | grep -q '"total_lines": 2'

echo "[4b] openapi strict unknown endpoint"
out=$(timeout 60 ./log-guardian test_schema_strict.log --no-tui --json --no-ban --no-db \
  --rules smoke_schema.conf 2>/dev/null) || {
  echo "[4b] timeout veya hata" >&2
  exit 1
}
echo "$out" | grep -q '"alerts_total"'

echo "[5] incident-sim"
./log-guardian incident-sim 2>/dev/null | grep -q '"incident_id":"INC-'

echo "[6] ban --rules test_rules (IPC veya skip, root ipset yok)"
./log-guardian ban 203.0.113.99 --rules test_rules.conf --reason smoke 2>/dev/null || true

echo "OK — smoke_test gecti"
