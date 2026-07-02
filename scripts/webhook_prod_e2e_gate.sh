#!/usr/bin/env bash
# Webhook prod E2E kapisi — sudo ile tam zincir; yoksa hazirlik + mevcut kanit
#   bash scripts/webhook_prod_e2e_gate.sh
#   sudo bash scripts/webhook_prod_e2e_gate.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

ROUTE_REPORT="$ROOT/webhook-route-proof-report.json"
LIVE_REPORT="$ROOT/webhook-telegram-live-report.json"

fail() { echo "[webhook_prod_e2e_gate] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }
warn() { echo "[WARN] $*" >&2; }

if [[ "$(id -u)" -eq 0 ]]; then
  exec bash "$ROOT/scripts/webhook_prod_e2e.sh" "$@"
fi

echo "=== webhook_prod_e2e_gate (prep) ==="

[[ -f /etc/log-guardian/webhook.env ]] || fail "/etc/log-guardian/webhook.env yok — sudo bash scripts/webhook_install_prod.sh"
[[ -f /etc/log-guardian/rules.conf ]] || fail "/etc/log-guardian/rules.conf yok"
[[ -x /usr/local/bin/log-guardian ]] || [[ -x "$ROOT/log-guardian" ]] || fail "log-guardian binary yok"

if bash "$ROOT/scripts/webhook_smoke_test.sh" >/dev/null 2>&1; then
  ok "webhook_smoke_test"
else
  warn "webhook_smoke_test — token/chat kontrol"
fi

full_e2e=0
if [[ -f "$ROUTE_REPORT" ]] && python3 -c "
import json, sys
r = json.load(open(sys.argv[1]))
pe = r.get('prod_e2e') or {}
sys.exit(0 if pe.get('ok') and not pe.get('skipped') else 1)
" "$ROUTE_REPORT" 2>/dev/null; then
  delta=$(python3 -c "import json; print(json.load(open('$ROUTE_REPORT')).get('metrics_delta',0))" 2>/dev/null || echo 0)
  ok "prod zincir kaniti: log→ban→Telegram (metrics_delta=$delta)"
  full_e2e=1
fi

live_ok=0
if [[ -f "$LIVE_REPORT" ]] && python3 -c "
import json, sys
r = json.load(open(sys.argv[1]))
sys.exit(0 if r.get('pass') and r.get('mode') == 'prod' else 1)
" "$LIVE_REPORT" 2>/dev/null; then
  kinds=$(python3 -c "import json; print(','.join(json.load(open('$LIVE_REPORT')).get('kinds',[])))" 2>/dev/null || echo "")
  ok "Telegram live test-all ($kinds)"
  live_ok=1
fi

if [[ "$full_e2e" -eq 1 ]]; then
  echo ""
  echo "Prod webhook zinciri tamam."
  echo "  Yenile: sudo bash scripts/webhook_prod_e2e.sh"
  exit 0
fi

if [[ "$live_ok" -eq 1 ]]; then
  echo ""
  echo "Telegram canli OK; log→ban→Telegram zinciri icin:"
  echo "  sudo bash scripts/webhook_prod_e2e.sh"
  echo "  sudo WEBHOOK_E2E_CLI_TEST=1 bash scripts/webhook_prod_e2e.sh"
  exit 0
fi

echo "[prep] prod kanit yok — once test-all veya tam E2E"
echo "  sudo bash scripts/webhook_install_prod.sh --test-all"
echo "  sudo bash scripts/webhook_prod_e2e.sh"
exit 1
