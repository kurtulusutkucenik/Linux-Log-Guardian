#!/usr/bin/env bash
# ipset prune policy smoke — static + opsiyonel root ipset testi
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

IPSET="log_analyzer_block_v4"
IPSET_MAXELEM=65536
RESERVE="${THREAT_INTEL_DYNAMIC_RESERVE:-12000}"
CEILING=$((IPSET_MAXELEM - RESERVE))
DEFAULT_MAX=$((IPSET_MAXELEM - RESERVE))

# ── Static: threat_intel.sh politika sabitleri (root gerekmez) ───────
grep -q 'THREAT_INTEL_DYNAMIC_RESERVE="${THREAT_INTEL_DYNAMIC_RESERVE:-12000}"' \
  "$ROOT/threat_intel.sh" || {
  echo "[FAIL] threat_intel.sh THREAT_INTEL_DYNAMIC_RESERVE bulunamadi"
  exit 1
}
grep -q 'THREAT_INTEL_MAX_APPLY="${THREAT_INTEL_MAX_APPLY:-$((IPSET_MAXELEM - THREAT_INTEL_DYNAMIC_RESERVE))}"' \
  "$ROOT/threat_intel.sh" || {
  echo "[FAIL] threat_intel.sh varsayilan THREAT_INTEL_MAX_APPLY bulunamadi"
  exit 1
}
grep -q 'ipset_prune_before_threat_intel' "$ROOT/threat_intel.sh" || {
  echo "[FAIL] threat_intel.sh ipset_prune_before_threat_intel yok"
  exit 1
}
if [[ "$DEFAULT_MAX" -ne 53536 ]]; then
  echo "[FAIL] varsayilan max=$DEFAULT_MAX (53536 bekleniyordu)"
  exit 1
fi
echo "[OK] ipset prune policy (static) — rezerv=$RESERVE, default_max=$DEFAULT_MAX"

# ── Dynamic: ipset simulasyonu (root) ────────────────────────────────
if ! command -v ipset >/dev/null 2>&1; then
  echo "[SKIP] ipset yok — dynamic test atlandi"
  exit 0
fi
if [[ $EUID -ne 0 ]]; then
  echo "[SKIP] dynamic ipset testi — sudo bash scripts/ipset_prune_policy_test.sh"
  exit 0
fi

cleanup() {
  ipset destroy "$IPSET" 2>/dev/null || true
  rm -f "${DB:-}"
}
trap cleanup EXIT

if ! ipset create "$IPSET" hash:ip family inet maxelem "$IPSET_MAXELEM" -exist 2>/dev/null; then
  echo "[SKIP] ipset create izni yok — static test yeterli"
  exit 0
fi

for i in $(seq 1 "$CEILING"); do
  ipset add "$IPSET" "10.99.$((i / 256)).$((i % 256))" -exist 2>/dev/null || true
done

count=$(ipset list "$IPSET" | grep -cE '^[0-9]' || true)
if [[ "$count" -lt "$((CEILING - 10))" ]]; then
  echo "[FAIL] test ipset doldurulamadi ($count/$CEILING)"
  exit 1
fi

DB=$(mktemp /tmp/lg-prune-test.XXXXXX.db)
sqlite3 "$DB" "CREATE TABLE ban_events (id INTEGER PRIMARY KEY, ts INTEGER, ip TEXT, action TEXT, reason TEXT);"
sqlite3 "$DB" "INSERT INTO ban_events (ts,ip,action,reason) VALUES (1,'203.0.113.50','ban','waf-sqli');"

ipset flush "$IPSET" 2>/dev/null || true
restored=0
while IFS= read -r ip; do
  [[ -z "$ip" ]] && continue
  ipset add "$IPSET" "$ip" -exist 2>/dev/null && restored=$((restored + 1))
done < <(sqlite3 -noheader "$DB" \
  "SELECT ip FROM ban_events WHERE action='ban' AND ip != 'system' \
   AND reason NOT LIKE 'threat-intel%' GROUP BY ip ORDER BY MAX(ts) DESC \
   LIMIT $RESERVE;")

if [[ "$restored" -lt 1 ]]; then
  echo "[FAIL] dynamic ban restore basarisiz"
  exit 1
fi

if ! ipset test "$IPSET" 203.0.113.50 2>/dev/null; then
  echo "[FAIL] 203.0.113.50 ipset'te yok"
  exit 1
fi

after=$(ipset list "$IPSET" | grep -cE '^[0-9]' || true)
if [[ "$after" -gt "$RESERVE" ]]; then
  echo "[FAIL] prune sonrasi hala cok dolu ($after > rezerv $RESERVE)"
  exit 1
fi

echo "[OK] ipset prune policy (dynamic) — ceiling=$CEILING, restored=$restored"
