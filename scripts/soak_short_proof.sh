#!/usr/bin/env bash
# Kisa stabilite kaniti (5 dk) — VPS gerekmez
#   bash scripts/soak_short_proof.sh
#   sudo bash scripts/soak_short_proof.sh   # servis/IPC onarimi icin
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

preflight() {
  if command -v systemctl >/dev/null 2>&1; then
    if ! systemctl is-active --quiet log-guardian 2>/dev/null; then
      echo "[soak_short_proof] log-guardian inactive — once: sudo bash scripts/fix_analyzer.sh" >&2
      exit 1
    fi
    if ! systemctl is-active --quiet log-guardian-daemon 2>/dev/null; then
      echo "[soak_short_proof] WARN: daemon inactive — SOAK_LAPTOP_RELAX (analyzer+metrics)" >&2
    fi
  fi
  if ! curl -sf --max-time 2 http://127.0.0.1:9091/metrics >/dev/null 2>&1; then
    echo "[soak_short_proof] :9091/metrics yok — sudo bash scripts/fix_analyzer.sh" >&2
    exit 1
  fi
}

preflight

echo "=== soak_short_proof ==="
echo "  SOAK_SHORT=1 — 5 dk / 30s aralik  grace=30s  laptop_relax=1"

SOAK_SHORT=1 SOAK_GRACE_SEC=30 SOAK_LAPTOP_RELAX=1 bash scripts/soak_test.sh

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
        print(f"[soak_short_proof] FAIL — {name} failures={d.get('failures')} reasons={d.get('fail_reasons')}")
raise SystemExit("soak raporu PASS degil")
PY

bash scripts/sync_dashboard_data.sh 2>/dev/null || true
echo "[OK] soak_short_proof -> soak-report.short.json"
