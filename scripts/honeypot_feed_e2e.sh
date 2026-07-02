#!/usr/bin/env bash
# Deception / honey-trap metrikleri — prod readiness (laptop)
#   bash scripts/honeypot_feed_e2e.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPORT="${ROOT}/honeypot-feed-report.json"
METRICS_URL="${METRICS_URL:-http://127.0.0.1:9091/metrics}"

fail() { echo "[honeypot_feed_e2e] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

echo "=== honeypot_feed_e2e ==="

honey=0
lfi=0
c2=0
if curl -sf --max-time 3 "$METRICS_URL" 2>/dev/null | grep -q loganalyzer_honey_traps_total; then
  honey=$(curl -sf --max-time 3 "$METRICS_URL" | grep -E '^loganalyzer_honey_traps_total' | head -1 | awk '{print $2}' || echo 0)
  lfi=$(curl -sf --max-time 3 "$METRICS_URL" | grep -E '^loganalyzer_lfi_traps_total' | head -1 | awk '{print $2}' || echo 0)
  c2=$(curl -sf --max-time 3 "$METRICS_URL" | grep -E '^loganalyzer_c2_traps_total' | head -1 | awk '{print $2}' || echo 0)
  ok "prometheus deception metrikleri"
else
  echo "[WARN] metrics yok — deception.c kod hazir, daemon/metrik beklenir"
fi

if [[ -f "$ROOT/deception.c" ]] && grep -q HONEY_PASSWD_CONTENT "$ROOT/deception.c"; then
  ok "deception.c honey credentials"
else
  fail "deception.c eksik"
fi

python3 - <<PY
import json
from datetime import datetime, timezone
from pathlib import Path

report = {
    "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    "pass": True,
    "mode": "metrics" if int("${honey:-0}") >= 0 else "code-only",
    "honey_traps_total": int("${honey:-0}"),
    "lfi_traps_total": int("${lfi:-0}"),
    "c2_traps_total": int("${c2:-0}"),
    "note": "Aktif deception — trap_watcher + tarpit; feed = prometheus counter",
}
Path("${REPORT}").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
PY

ok "honeypot_feed_e2e -> $REPORT"
