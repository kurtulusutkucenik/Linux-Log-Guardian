#!/usr/bin/env bash
# Faz 4.2 — MULTI_TENANT_DB + TENANT_ID ayri DB yolu
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"
make -s log-guardian

rm -f events-musteri1.db
# rules dosyasi repo kokunde olmali (mktemp /tmp -> DB /tmp/events-*.db olur)
tmp="$ROOT/.rules-multitenant-test.conf"
grep -v '^MULTI_TENANT_DB=' rules.conf | grep -v '^TENANT_ID=' > "$tmp"
echo 'MULTI_TENANT_DB=1' >> "$tmp"
echo 'TENANT_ID=musteri1' >> "$tmp"
echo 'DB_ENABLED=1' >> "$tmp"
chmod 600 "$tmp"

LOG="${TENANT_E2E_LOG:-fixtures/tenant-access.lines}"
test -f "$LOG" || LOG=test_access.log
test -f "$LOG" || { echo "log yok: $LOG" >&2; exit 1; }

out=$(./log-guardian "$LOG" --no-tui --json --no-ban --rules "$tmp" 2>&1)
echo "$out" | grep -qE '"db_active":\s*true|"db_path":\s*"events-musteri1\.db"' || {
  echo "$out" | tail -5 >&2
  rm -f "$tmp"
  exit 1
}

test -f events-musteri1.db || { echo "events-musteri1.db olusmadi (cwd: $(pwd))" >&2; rm -f "$tmp"; exit 1; }
rm -f "$tmp" events-musteri1.db
echo "OK — multitenant_e2e"
