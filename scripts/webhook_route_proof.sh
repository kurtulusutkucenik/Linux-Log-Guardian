#!/usr/bin/env bash
# Telegram route + batch kanıtı (dry-run; opsiyonel prod E2E)
#   bash scripts/webhook_route_proof.sh
#   sudo WEBHOOK_PROD=1 bash scripts/webhook_route_proof.sh
#   bash scripts/webhook_route_proof.sh --prod
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

for arg in "$@"; do
  [[ "$arg" == "--prod" ]] && export WEBHOOK_PROD=1
done

REPORT="${ROOT}/webhook-route-proof-report.json"
DATE_ISO="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
LG_BIN="${LG_BIN:-$ROOT/log-guardian}"
[[ -x "$LG_BIN" ]] || LG_BIN="/usr/local/bin/log-guardian"
[[ -x "$LG_BIN" ]] || { echo "[webhook_route_proof] log-guardian yok — make" >&2; exit 1; }

CACHE="$ROOT/.cache"
mkdir -p "$CACHE"
RULES="$CACHE/webhook_route_proof.conf"

dry_ok=0
batch_ok=0
prod_ok=0
route_on=0
batch_sec=0
fail_reason=""
mode="dry-run"

cat >"$RULES" <<'EOF'
WEBHOOK_ENABLED=1
WEBHOOK_MIN_LEVEL=1
WEBHOOK_TELEGRAM_ROUTE=1
WEBHOOK_TELEGRAM_BATCH_SEC=10
METRICS_PORT=0
DB_ENABLED=0
EOF

export WEBHOOK_DRY_RUN=1
export WEBHOOK_ENABLED=1
export WEBHOOK_TELEGRAM_ROUTE=1
export WEBHOOK_TELEGRAM_BATCH_SEC=10
export LOGANALYZER_TELEGRAM_TOKEN="000000000:FAKE"
export LOGANALYZER_TELEGRAM_CHAT_CRIT="-1001111111111"
export LOGANALYZER_TELEGRAM_CHAT_WARN="-1002222222222"

# /etc/log-guardian/webhook.env genelde 600 — sudo ile oku, source etme
load_prod_webhook_meta() {
  local envf="/etc/log-guardian/webhook.env"
  [[ -f "$envf" ]] || return 0
  local route batch
  if [[ -r "$envf" ]]; then
    route=$(grep -E '^WEBHOOK_TELEGRAM_ROUTE=' "$envf" 2>/dev/null | tail -1 | cut -d= -f2- || true)
    batch=$(grep -E '^WEBHOOK_TELEGRAM_BATCH_SEC=' "$envf" 2>/dev/null | tail -1 | cut -d= -f2- || true)
  elif command -v sudo >/dev/null 2>&1; then
    route=$(sudo grep -E '^WEBHOOK_TELEGRAM_ROUTE=' "$envf" 2>/dev/null | tail -1 | cut -d= -f2- || true)
    batch=$(sudo grep -E '^WEBHOOK_TELEGRAM_BATCH_SEC=' "$envf" 2>/dev/null | tail -1 | cut -d= -f2- || true)
  else
    return 0
  fi
  batch_sec="${batch:-0}"
  [[ "${route:-0}" == "1" ]] && route_on=1 || route_on=0
}

run_test() {
  local kind="$1"
  local out json ok fail
  out=$("$LG_BIN" webhook-test "$kind" --quiet --rules "$RULES" 2>&1) || {
    echo "[webhook_route_proof] $kind stderr: $out" >&2
    return 1
  }
  json=$(echo "$out" | grep '^{' | tail -1)
  [[ -n "$json" ]] || return 1
  fail=$(echo "$json" | grep -o '"fail":[0-9]*' | grep -o '[0-9]*$' || echo 1)
  ok=$(echo "$json" | grep -o '"ok":[0-9]*' | grep -o '[0-9]*$' || echo 0)
  [[ "$fail" -eq 0 && "$ok" -ge 1 ]]
}

echo "[1] dry-run route (alert/ban/trap)..."
route_on=1
batch_sec=10
for k in alert ban trap; do
  run_test "$k" || { fail_reason="dry-run $k"; break; }
done
[[ -z "$fail_reason" ]] && dry_ok=1 && echo "[OK] dry-run route"

echo "[2] dry-run batch (10s)..."
if run_test batch; then
  batch_ok=1
  echo "[OK] dry-run batch"
else
  fail_reason="${fail_reason:-dry-run batch}"
fi

if [[ "${WEBHOOK_PROD:-0}" == "1" ]] && [[ -f /etc/log-guardian/webhook.env ]]; then
  echo "[3] prod E2E (webhook_prod_e2e)..."
  mode="prod"
  load_prod_webhook_meta
  if sudo bash "$ROOT/scripts/webhook_prod_e2e.sh"; then
    prod_ok=1
    load_prod_webhook_meta
  else
    fail_reason="prod E2E fail"
    load_prod_webhook_meta
  fi
else
  echo "[3] prod E2E SKIP (sudo WEBHOOK_PROD=1 veya --prod; /etc/log-guardian/webhook.env gerekir)"
fi

pass=0
if [[ "$mode" == "prod" ]]; then
  [[ "$dry_ok" -eq 1 && "$batch_ok" -eq 1 && "$prod_ok" -eq 1 ]] && pass=1
else
  [[ "$dry_ok" -eq 1 && "$batch_ok" -eq 1 ]] && pass=1
fi

python3 - "$REPORT" <<PY
import json, sys
data = {
    "date": "${DATE_ISO}",
    "pass": bool(${pass}),
    "mode": "${mode}",
    "route_enabled": bool(${route_on}),
    "batch_sec": int(${batch_sec}),
    "dry_run": {"ok": bool(${dry_ok})},
    "batch": {"ok": bool(${batch_ok})},
    "prod_e2e": {"ok": bool(${prod_ok}), "skipped": "${mode}" != "prod"},
    "fail_reason": "${fail_reason}" if not ${pass} else "",
}
with open(sys.argv[1], "w") as f:
    json.dump(data, f, indent=2)
    f.write("\n")
PY

echo "[report] $REPORT"
if [[ "$pass" -eq 1 ]]; then
  echo "[PASS] webhook route proof ($mode)"
  exit 0
fi
echo "[FAIL] webhook route proof — ${fail_reason}" >&2
exit 1
