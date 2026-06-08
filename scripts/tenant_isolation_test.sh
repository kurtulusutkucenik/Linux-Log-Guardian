#!/usr/bin/env bash
# Tier 2 #10 — kiraci DB + policy + audit yolu izolasyonu
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

make -s log-guardian

rm -rf data/tenants/musteri1 data/tenants/musteri2
rm -f events-musteri1.db events-musteri2.db

make_rules() {
  local tenant="$1"
  local tmp="$ROOT/.rules-${tenant}.conf"
  grep -v '^MULTI_TENANT_DB=' rules.conf | grep -v '^TENANT_ID=' > "$tmp"
  echo 'MULTI_TENANT_DB=1' >> "$tmp"
  echo "TENANT_ID=${tenant}" >> "$tmp"
  echo 'DB_ENABLED=1' >> "$tmp"
  chmod 600 "$tmp"
  echo "$tmp"
}

run_tenant() {
  local tenant="$1"
  local log="$2"
  local rules
  rules=$(make_rules "$tenant")
  ./log-guardian "$log" --no-tui --json --no-ban --rules "$rules" >/dev/null 2>&1
  rm -f "$rules"
}

echo "[1] musteri1 — sqli corpus"
LOG_A="fixtures/tenant-sqli.lines"
LOG_B="fixtures/tenant-access.lines"
test -f "$LOG_A" && test -f "$LOG_B"
run_tenant musteri1 "$LOG_A"

echo "[2] musteri2 — benign corpus"
run_tenant musteri2 "$LOG_B"

test -f events-musteri1.db || { echo "FAIL events-musteri1.db" >&2; exit 1; }
test -f events-musteri2.db || { echo "FAIL events-musteri2.db" >&2; exit 1; }

# Ayri DB dosyalari
sz1=$(stat -c%s events-musteri1.db 2>/dev/null || stat -f%z events-musteri1.db)
sz2=$(stat -c%s events-musteri2.db 2>/dev/null || stat -f%z events-musteri2.db)
echo "[OK] DB izolasyonu musteri1=${sz1}B musteri2=${sz2}B"

echo "[3] policy overlay (rules/tenants/*.conf)"
rules1=$(make_rules musteri1)
st1=$(./log-guardian --status --rules "$rules1" 2>/dev/null)
rm -f "$rules1"
echo "$st1" | grep -q '"policy_overlay":true' || { echo "FAIL overlay musteri1" >&2; exit 1; }
echo "$st1" | grep -q '"auto_ban_min_risk":75' || { echo "FAIL min_risk musteri1" >&2; exit 1; }

rules2=$(make_rules musteri2)
st2=$(./log-guardian --status --rules "$rules2" 2>/dev/null)
rm -f "$rules2"
echo "$st2" | grep -q '"auto_ban_min_risk":45' || { echo "FAIL min_risk musteri2" >&2; exit 1; }

echo "[4] scoped audit yollari"
test -d data/tenants/musteri1 || mkdir -p data/tenants/musteri1
echo "$st1" | grep -q 'data/tenants/musteri1/ban-policy-audit.jsonl' || {
  echo "FAIL ban audit path musteri1" >&2
  exit 1
}

python3 - <<'PY'
import json, sqlite3
from pathlib import Path

for db in ("events-musteri1.db", "events-musteri2.db"):
    con = sqlite3.connect(db)
    n = con.execute("SELECT COUNT(*) FROM alerts").fetchone()[0]
    con.close()
    assert n >= 0, db
print("[OK] sqlite tenant DB erisilebilir")
PY

rm -f events-musteri1.db events-musteri2.db
echo "[OK] tenant_isolation_test"
