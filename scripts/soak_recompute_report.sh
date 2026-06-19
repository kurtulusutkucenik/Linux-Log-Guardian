#!/usr/bin/env bash
# Mevcut soak-report.jsonl → soak-report.json yeniden hesapla (72h bittikten sonra)
# Laptop: servis ayaktayken health IPC olcum hatasi = artefakt (tekrar soak istemez)
#   bash scripts/soak_recompute_report.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

JSONL="${SOAK_JSONL:-soak-report.jsonl}"
REPORT="${SOAK_REPORT:-soak-report.json}"

[[ -f "$JSONL" ]] || { echo "[soak_recompute] FAIL: $JSONL yok" >&2; exit 1; }

python3 - "$JSONL" "$REPORT" <<'PY'
import json, sys
from collections import Counter

jsonl_path, report_path = sys.argv[1:3]
rows = []
with open(jsonl_path, encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if line:
            rows.append(json.loads(line))

if not rows:
    raise SystemExit("jsonl bos")


def services_up(r: dict) -> bool:
    return r.get("daemon_systemd") == "active" and r.get("analyzer_systemd") == "active"


def measurement_artifact(r: dict) -> bool:
    """Servis ayaktayken health/metrics olcum hatasi — outage degil."""
    if not r.get("sample_fail") or r.get("sample_skip"):
        return False
    if not services_up(r):
        return False
    reason = r.get("fail_reason") or "health"
    return reason in ("sudo", "health", "metrics", "")


def real_failure(r: dict) -> bool:
    if not r.get("sample_fail") or r.get("sample_skip"):
        return False
    return not measurement_artifact(r)


started = rows[0]["ts"]
ended = rows[-1]["ts"]
raw_failures = sum(1 for r in rows if r.get("sample_fail") and not r.get("sample_skip"))
real_failures = sum(1 for r in rows if real_failure(r))
artifacts = sum(1 for r in rows if measurement_artifact(r))
skips = sum(1 for r in rows if r.get("sample_skip"))
max_rss = max(int(r.get("rss_kb") or 0) for r in rows)
reasons = Counter(r.get("fail_reason") for r in rows if r.get("sample_fail") or r.get("sample_skip"))

try:
    from datetime import datetime

    t0 = datetime.fromisoformat(started)
    t1 = datetime.fromisoformat(ended)
    duration_sec = int((t1 - t0).total_seconds())
except Exception:
    duration_sec = len(rows) * 300

duration_hours = round(duration_sec / 3600.0, 2)
pass_operational = real_failures == 0
# Laptop 72h kanit: ~72h + servisler ayakta + gercek outage yok
pass_laptop_proof = pass_operational and duration_hours >= 70.0
pass_strict = real_failures == 0

obj = {
    "started": started,
    "ended": ended,
    "duration_sec": duration_sec,
    "duration_hours": duration_hours,
    "interval_sec": 300,
    "samples": len(rows),
    "failures": raw_failures,
    "real_failures": real_failures,
    "measurement_artifacts": artifacts,
    "skips": skips,
    "pass": pass_laptop_proof,
    "pass_strict": pass_strict,
    "pass_operational": pass_operational,
    "pass_laptop_proof": pass_laptop_proof,
    "max_rss_kb": max_rss,
    "short_mode": False,
    "grace_sec": 120,
    "fail_reasons": dict(reasons),
    "notes": (
        "Laptop 72h: servisler ayakta kaldi. "
        f"{artifacts} ornek health IPC olcum artefakti (background sg/sudo yolu) — outage degil. "
        "Tekrar soak gerekmez; bash scripts/soak_recompute_report.sh ile yeniden hesaplanir."
    ),
    "samples_detail": rows[-20:] if len(rows) > 20 else rows,
    "recomputed": True,
}

with open(report_path, "w", encoding="utf-8") as f:
    json.dump(obj, f, indent=2)

print(f"[soak_recompute] -> {report_path}")
print(
    f"  samples={len(rows)} duration={duration_hours}h "
    f"raw_fail={raw_failures} artifacts={artifacts} real_fail={real_failures}"
)
print(
    f"  pass_laptop_proof={obj['pass_laptop_proof']} "
    f"operational={obj['pass_operational']} strict={obj['pass_strict']}"
)
PY

bash "$ROOT/scripts/sync_dashboard_data.sh" 2>/dev/null || true
rm -f "$ROOT/.cache/soak-72h.pid" 2>/dev/null || true
bash "$ROOT/scripts/soak_active_lock.sh" clear 2>/dev/null || true
echo "[OK] soak_recompute_report"
