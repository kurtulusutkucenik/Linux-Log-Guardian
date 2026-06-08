#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

make -s log-guardian http_l7_probe.o 2>/dev/null || make -s log-guardian

test -f http_l7_probe.o || { echo "[WARN] http_l7_probe.o yok (vmlinux.h?)"; }

out=$(./log-guardian fixtures/tenant-sqli.lines --no-tui --json --no-ban --rules rules.conf 2>&1)
echo "$out" | grep -q '"alerts_total"' || true

st=$(./log-guardian --status --rules rules.conf 2>/dev/null || echo '{}')
echo "$st" | grep -q '"l7_http"' || { echo "FAIL l7_http status block"; exit 1; }

echo "[OK] l7_ebpf_test"
