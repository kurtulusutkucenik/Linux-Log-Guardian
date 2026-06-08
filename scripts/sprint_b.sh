#!/usr/bin/env bash
# Sprint B — webhook + canli demo
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

step() {
  echo ""
  echo "▶ $*"
  echo "────────────────────────────────────────"
}

banner() {
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║  Sprint B — Webhook & demo                               ║"
  echo "╚══════════════════════════════════════════════════════════╝"
}

banner

step "1/5 Webhook smoke (dry-run + mock HTTP)"
bash scripts/webhook_smoke_test.sh

step "2/5 Ban -> webhook akisi"
bash scripts/webhook_ban_e2e.sh

step "3/5 ipset prune policy"
if [[ $EUID -eq 0 ]]; then
  bash scripts/ipset_prune_policy_test.sh
elif sudo -n true 2>/dev/null; then
  sudo bash scripts/ipset_prune_policy_test.sh
else
  bash scripts/ipset_prune_policy_test.sh
fi

step "4/5 Kanit PDF + dashboard sync"
bash scripts/competitive_proof.sh
bash scripts/data_room_pack.sh
bash scripts/sync_dashboard_data.sh 2>/dev/null || true

step "5/5 Demo (opsiyonel)"
if [[ "${SKIP_DEMO:-0}" != "1" ]]; then
  bash scripts/demo_3min.sh || echo "  [WARN] demo_3min kismi basarisiz — Sprint B kanit paketi tamam"
else
  echo "  Atlandi — tam demo: bash scripts/demo_3min.sh"
fi

echo ""
echo "[OK] Sprint B tamam — docs/WEBHOOK_SETUP.md · docs/PILOT_SETUP.md · SPRINT_GOALS B1-B5"
echo "     Gercek Slack/Discord: WEBHOOK_DRY_RUN=0 + URL'leri rules.conf'a yazin"
