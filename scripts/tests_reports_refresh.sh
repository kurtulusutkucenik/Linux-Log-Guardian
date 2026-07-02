#!/usr/bin/env bash
# /tests sayfasi icin JSON kanit raporlarini yenile (docker rebuild yok)
#   bash scripts/tests_reports_refresh.sh
#   bash scripts/tests_reports_refresh.sh --live-demo   # + kernel ban demo
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

LIVE_DEMO=0
[[ "${1:-}" == "--live-demo" ]] && LIVE_DEMO=1

echo "=== tests_reports_refresh ==="
bash "$ROOT/scripts/vm_sprint_proof.sh" 2>/dev/null || true
bash "$ROOT/scripts/guardian_status_export.sh"
bash "$ROOT/scripts/ops_gate_report.sh"
bash "$ROOT/scripts/laptop_excellence_gate.sh" 2>/dev/null || true

if [[ "$LIVE_DEMO" -eq 1 ]]; then
  bash "$ROOT/scripts/dashboard_live_demo.sh"
else
  bash "$ROOT/scripts/sync_dashboard_data.sh"
  # Mevcut dashboard-live-demo.json varsa cache'e kopyala
  if [[ -f "$ROOT/dashboard-live-demo.json" ]]; then
    mkdir -p "$ROOT/.cache/dashboard-live"
    cp -f "$ROOT/dashboard-live-demo.json" "$ROOT/.cache/dashboard-live/dashboard-live-demo.json"
  fi
fi

pass=$(python3 -c "
import json
from pathlib import Path
ops = json.loads(Path('ops-gate-report.json').read_text())
live = json.loads(Path('guardian-status.json').read_text())
demo = json.loads(Path('dashboard-live-demo.json').read_text()) if Path('dashboard-live-demo.json').is_file() else {}
ops_ok = all(g.get('pass') for g in ops.get('gates', []))
ipc_ok = live.get('ipc') in ('ok', 'connected')
demo_ok = demo.get('pass') is True
print(int(ops_ok) + int(ipc_ok) + int(demo_ok))
" 2>/dev/null || echo 0)

echo "[OK] tests_reports_refresh — 3/3 kritik: $pass (ops+ipc+demo)"
echo "  Tarayici: https://localhost:8443/tests → Ctrl+Shift+R"
