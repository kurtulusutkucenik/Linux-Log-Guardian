#!/usr/bin/env bash
# Kisa stabilite kaniti (5 dk) — VPS gerekmez
#   bash scripts/soak_short_proof.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

echo "=== soak_short_proof ==="
echo "  SOAK_SHORT=1 — 5 dk / 30s aralik"

SOAK_SHORT=1 bash scripts/soak_test.sh

python3 - <<'PY'
import json
from pathlib import Path

for name in ("soak-report.short.json", "soak-report.json"):
    p = Path(name)
    if p.is_file():
        d = json.loads(p.read_text())
        if d.get("pass") is True:
            print(f"[soak_short_proof] PASS — {name} duration={d.get('duration_sec')}s failures={d.get('failures', 0)}")
            raise SystemExit(0)
raise SystemExit("soak raporu PASS degil")
PY

bash scripts/sync_dashboard_data.sh 2>/dev/null || true
echo "[OK] soak_short_proof -> soak-report.short.json"
