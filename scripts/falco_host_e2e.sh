#!/usr/bin/env bash
# Faz 2.4 — Falco-benzeri host kural sayisi smoke
set -euo pipefail
cd "$(dirname "$0")/.."
make -s log-guardian log-guardian-daemon 2>/dev/null
n=$(grep -c 'INC_SIG_' falco_host_rules.c || true)
test "$n" -ge 20
./log-guardian lineage-stats --demo 2>/dev/null | grep -q '"active_trees":1'
echo "OK — falco_host_e2e ($n sinyal referansi, lineage demo)"
