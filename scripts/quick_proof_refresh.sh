#!/usr/bin/env bash
# Hizli kanit tazeleme (~2-5 dk) — local_proof_refresh kisa yolu (E2E suite yok)
#   bash scripts/quick_proof_refresh.sh
#   QUICK_PROOF=1 bash scripts/dashboard_refresh.sh  # refresh sonunda otomatik
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

echo "=== quick_proof_refresh (E2E suite atlandi) ==="

if [[ -f /etc/log-guardian/webhook.env ]] && ! [[ -r /etc/log-guardian/webhook.env ]] \
    && command -v sudo >/dev/null 2>&1; then
  sudo bash "$ROOT/scripts/guardian_status_export.sh" \
    || bash "$ROOT/scripts/guardian_status_export.sh"
else
  bash "$ROOT/scripts/guardian_status_export.sh"
fi

bash "$ROOT/scripts/competitive_proof.sh"
bash "$ROOT/scripts/sync_dashboard_data.sh" 2>/dev/null \
  || echo "[WARN] sync_dashboard_data — docker stack ayakta mi?" >&2

n="$(python3 -c "
import json
from pathlib import Path
p = Path('competitive-proof.json')
if not p.is_file():
    print('?')
else:
    t = json.loads(p.read_text(encoding='utf-8')).get('validationTests') or []
    p = sum(1 for x in t if x.get('status') == 'pass')
    print(f'{p}/{len(t)} pass')
" 2>/dev/null || echo "?")"

echo ""
echo "[OK] quick_proof_refresh tamam — validationTests $n"
echo "  competitive-proof.pdf  competitive-proof.json"
echo "  Tam suite: bash scripts/local_proof_refresh.sh (~15 dk)"
