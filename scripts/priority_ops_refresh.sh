#!/usr/bin/env bash
# Oncelik sirasi: Telegram prod test → FP raporu → status sync → (opsiyonel) dashboard rebuild
#   bash scripts/priority_ops_refresh.sh
#   sudo bash scripts/priority_ops_refresh.sh          # + Telegram --test-all
#   sudo bash scripts/priority_ops_refresh.sh --full   # + dashboard_refresh.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

FULL=0
SKIP_TELEGRAM=0
for arg in "$@"; do
  case "$arg" in
    --full) FULL=1 ;;
    --skip-telegram) SKIP_TELEGRAM=1 ;;
  esac
done

ok() { echo "[OK] $*"; }
warn() { echo "[WARN] $*" >&2; }

echo "=== priority_ops_refresh ==="
echo "  1) Telegram prod --test-all (sudo)"
echo "  2) FP benign corpus (fp_rate < 5%)"
echo "  3) guardian-status + dashboard cache sync"
echo ""

# --- 1) Telegram canli ---
if [[ "$SKIP_TELEGRAM" -eq 0 ]]; then
  if [[ "$(id -u)" -eq 0 ]]; then
    if [[ -f /etc/log-guardian/webhook.env ]]; then
      echo "[1/3] Telegram prod test..."
      if bash "$ROOT/scripts/webhook_install_prod.sh" --test-all; then
        ok "webhook-telegram-live-report.json"
      else
        warn "Telegram --test-all FAIL — kanal/bot token kontrol"
        exit 1
      fi
    else
      warn "[1/3] atlandi — /etc/log-guardian/webhook.env yok"
    fi
  else
    if sudo -n true 2>/dev/null && [[ -f /etc/log-guardian/webhook.env ]]; then
      echo "[1/3] Telegram prod test (sudo)..."
      sudo bash "$ROOT/scripts/webhook_install_prod.sh" --test-all
      ok "webhook-telegram-live-report.json"
    else
      warn "[1/3] Telegram atlandi — calistir: sudo bash scripts/webhook_install_prod.sh --test-all"
    fi
  fi
else
  echo "[1/3] Telegram atlandi (--skip-telegram)"
fi

# --- 2) FP ---
echo "[2/3] FP report..."
bash "$ROOT/scripts/fp_report.sh" | tail -5
fp=$(python3 -c "import json; d=json.load(open('fp-report.json')); print(d['benign']['fp_rate_pct'])" 2>/dev/null || echo "?")
ok "fp_rate=${fp}% (hedef <5%)"

# --- 3) Sync ---
echo "[3/3] status + cache..."
bash "$ROOT/scripts/guardian_status_export.sh"
bash "$ROOT/scripts/sync_dashboard_data.sh"

if [[ "$FULL" -eq 1 ]]; then
  bash "$ROOT/scripts/dashboard_refresh.sh"
else
  echo "  UI rebuild gerekirse: bash scripts/dashboard_refresh.sh"
fi

echo ""
echo "[OK] priority_ops_refresh tamam"
echo "  Tarayici: https://localhost:8443/tests → Ctrl+Shift+R"
echo "  VM/VPS (oncelik 3): vm_sync_from_host.sh → vm_build_binary.sh → vm_demo_gate.sh"
