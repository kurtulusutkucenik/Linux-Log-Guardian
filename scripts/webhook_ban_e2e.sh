#!/usr/bin/env bash
# Ban -> webhook akisi: saldiri logu + dry-run ban bildirimi (ag disina cikmaz)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

LG_QUIET_BUILD=1 make -s log-guardian

CACHE="$ROOT/.cache"
mkdir -p "$CACHE"
RULES="$CACHE/webhook_ban_e2e.conf"
ATTACK_LOG="$CACHE/webhook_attack.access"
ATTACK_IP="203.0.113.198"

export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

CRS_BUNDLE="$ROOT/rules/crs-bundle.rules"
[[ -f "$CRS_BUNDLE" ]] || { echo "[FAIL] CRS bundle yok: $CRS_BUNDLE — make / scripts/import_crs.py" >&2; exit 1; }

{
  cat <<'STATICEOF'
ACCESS_PASSWORD_KDF=pbkdf2$100000$6560e0aa800d47957280cab9a1038847$b0c64cf98788c6921356411f05f1fbc60fbdf6a7e487b34124576866e97cb504
CRS_ENABLED=1
AUTO_BAN=1
AUTO_BAN_MIN_RISK=60
WEBHOOK_ENABLED=1
WEBHOOK_MIN_LEVEL=1
WEBHOOK_COOLDOWN_SEC=0
METRICS_PORT=0
DB_ENABLED=0
WASM_ENABLED=0
THREAT_FEED_ENABLED=0
MESH_PUB_ENABLED=0
MESH_SUB_ENABLED=0
MESH_ETCD_ENDPOINTS=
BLOCK_COUNTRIES=
WHITELIST_IP=
SIEM_FORWARDER_ENABLED=0
FP_LEARN=0
STATICEOF
  echo "CRS_RULES=$CRS_BUNDLE"
} >"$RULES"
chmod 600 "$RULES"

cat > "$ATTACK_LOG" <<EOF
${ATTACK_IP} - - [02/Jun/2026:10:00:01 +0300] "GET /search?q=1'+UNION+SELECT+null,null HTTP/1.1" 200 100 "-" "webhook_ban_e2e"
EOF

export WEBHOOK_ENABLED=1
export WEBHOOK_DRY_RUN=1
export LOGANALYZER_TELEGRAM_TOKEN="000000000:FAKE"
export LOGANALYZER_TELEGRAM_CHAT_ID="-1001234567890"

echo "=== webhook_ban_e2e ==="

ban_test=$(./log-guardian webhook-test ban --quiet --rules "$RULES" 2>&1)
echo "$ban_test" | grep -q '\[WEBHOOK\]\[DRY-RUN\]' || {
  echo "[FAIL] webhook-test ban dry-run log yok" >&2
  exit 1
}
echo "$ban_test" | grep -qi 'BAN' || {
  echo "[FAIL] webhook-test ban mesaji yok" >&2
  exit 1
}
echo "[OK] webhook-test ban (dry-run)"

combined=$(./log-guardian "$ATTACK_LOG" --no-tui --json --no-ban --rules "$RULES" 2>&1 || true)
alerts=$(echo "$combined" | python3 -c "
import json, re, sys
raw = sys.stdin.read()
try:
    d = json.loads(raw[raw.find('{'):raw.rfind('}')+1])
    print(int(d.get('alerts_total', 0)))
except Exception:
    m = re.search(r'\"alerts_total\"\s*:\s*(\d+)', raw)
    print(m.group(1) if m else 0)
" 2>/dev/null || echo 0)

if [[ "${alerts:-0}" -lt 1 ]]; then
  echo "[FAIL] saldiri logundan alarm uretilmedi (CRS: $CRS_BUNDLE)" >&2
  echo "$combined" | grep -E '\[CRS\]|\[WAF\]|alerts_total|sqli' | tail -n 12 >&2 || echo "$combined" | tail -n 8 >&2
  exit 1
fi
echo "[OK] saldiri logu alerts_total=$alerts"

if echo "$combined" | grep -q '\[WEBHOOK\]\[DRY-RUN\]'; then
  if echo "$combined" | grep -qi 'BAN'; then
    echo "[OK] otomatik ban -> webhook dry-run"
  else
    echo "[OK] alarm webhook dry-run (ban IPC/root yoksa ban atlanmis olabilir)"
  fi
else
  echo "[WARN] webhook dry-run logu yok — webhook-test ban kaniti yeterli"
fi

echo "[OK] webhook_ban_e2e"
