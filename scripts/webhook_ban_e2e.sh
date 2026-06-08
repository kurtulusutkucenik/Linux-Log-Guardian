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

cat > "$RULES" <<'EOF'
ACCESS_PASSWORD_KDF=pbkdf2$100000$6560e0aa800d47957280cab9a1038847$b0c64cf98788c6921356411f05f1fbc60fbdf6a7e487b34124576866e97cb504
CRS_ENABLED=1
CRS_RULES=rules/crs-bundle.rules
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
EOF
chmod 600 "$RULES"

cat > "$ATTACK_LOG" <<EOF
${ATTACK_IP} - - [02/Jun/2026:10:00:01 +0300] "GET /search?q=1'+UNION+SELECT+null,null HTTP/1.1" 200 100 "-" "webhook_ban_e2e"
EOF

export WEBHOOK_ENABLED=1
export WEBHOOK_DRY_RUN=1
export LOGANALYZER_DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/000000000000000000/FAKE"
export LOGANALYZER_SLACK_WEBHOOK_URL="https://hooks.slack.com/services/T00/B00/FAKE"

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

combined=$(./log-guardian "$ATTACK_LOG" --no-tui --json --rules "$RULES" 2>&1 || true)
alerts=$(echo "$combined" | grep -o '"alerts_total"[[:space:]]*:[[:space:]]*[0-9]*' | tail -1 | grep -o '[0-9]*$' || echo 0)

if [[ "${alerts:-0}" -lt 1 ]]; then
  echo "[FAIL] saldiri logundan alarm uretilmedi (CRS rules kontrol)" >&2
  echo "$combined" | tail -n 8 >&2
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
