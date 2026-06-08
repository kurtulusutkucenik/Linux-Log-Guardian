#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

bash scripts/tenant_isolation_test.sh

make -s log-guardian 2>/dev/null || true
tmp="$ROOT/.rules-export-tenant.conf"
grep -v '^MULTI_TENANT_DB=' rules.conf | grep -v '^TENANT_ID=' > "$tmp"
echo 'MULTI_TENANT_DB=1' >> "$tmp"
echo 'TENANT_ID=musteri1' >> "$tmp"
./log-guardian --status --rules "$tmp" > .cache/tenant-status-snapshot.json 2>/dev/null || echo '{}' > .cache/tenant-status-snapshot.json
rm -f "$tmp"
mkdir -p .cache

python3 scripts/tenant_isolation_report.py -i .cache/tenant-status-snapshot.json -o tenant-isolation-report.json
