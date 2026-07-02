#!/usr/bin/env bash
# Ops alert kanit paketi — Grafana DM + webhook P2 + (opsiyonel) prod Telegram
#   bash scripts/ops_alert_e2e.sh
#   SKIP_WEBHOOK_PROD=1 bash scripts/ops_alert_e2e.sh
#   GRAFANA_ONLY=1 bash scripts/ops_alert_e2e.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail=0
ok() { echo "[OK] $*"; }
bad() { echo "[FAIL] $*"; fail=$((fail + 1)); }

echo "=== ops_alert_e2e ==="

if [[ "${GRAFANA_ONLY:-0}" != "1" ]]; then
  echo "--- webhook P2 (dry-run) ---"
  if bash "$ROOT/scripts/webhook_route_proof.sh"; then
    ok "webhook_route_proof"
  else
    bad "webhook_route_proof"
  fi
fi

if [[ "${WEBHOOK_ONLY:-0}" != "1" ]]; then
  echo "--- Grafana alert → Telegram ---"
  if bash "$ROOT/scripts/grafana_alert_e2e.sh"; then
    ok "grafana_alert_e2e"
  else
    bad "grafana_alert_e2e (stack: bash scripts/grafana_stack.sh)"
  fi
fi

if [[ "${SKIP_WEBHOOK_PROD:-0}" != "1" && -f /etc/log-guardian/webhook.env ]]; then
  echo "--- webhook prod (Telegram canli) ---"
  if [[ "$(id -u)" -ne 0 ]]; then
    if sudo bash "$ROOT/scripts/webhook_prod_e2e.sh"; then
      ok "webhook_prod_e2e"
    else
      bad "webhook_prod_e2e"
    fi
  elif bash "$ROOT/scripts/webhook_prod_e2e.sh"; then
    ok "webhook_prod_e2e"
  else
    bad "webhook_prod_e2e"
  fi
else
  echo "[INFO] webhook_prod_e2e SKIP (SKIP_WEBHOOK_PROD=1 veya webhook.env yok)"
fi

echo ""
if [[ "$fail" -eq 0 ]]; then
  echo "[OK] ops_alert_e2e"
  exit 0
fi
echo "[FAIL] ops_alert_e2e — $fail madde" >&2
exit 1
