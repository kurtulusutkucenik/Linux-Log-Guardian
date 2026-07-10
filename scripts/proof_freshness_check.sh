#!/usr/bin/env bash
# Kanit JSON yas kontrolu — morning gate oncesi bayat rapor uyarisi
#   bash scripts/proof_freshness_check.sh
#   MAX_AGE_H=12 bash scripts/proof_freshness_check.sh
#   STRICT=1 bash scripts/proof_freshness_check.sh   # bayat = exit 1
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
REPORT="${PROOF_FRESHNESS_REPORT:-proof-freshness-report.json}"
MAX_H="${MAX_AGE_H:-24}"
STRICT="${STRICT:-0}"

python3 - "$ROOT" "$REPORT" "$MAX_H" "$STRICT" <<'PY'
import datetime
import json
import os
import sys
from pathlib import Path

root_s, report_path, max_h_s, strict_s = sys.argv[1:5]
root = Path(root_s)
max_h = float(max_h_s)
strict = strict_s == "1"

# id, dosya, max saat (bos = MAX_AGE_H)
checks = [
    ("morning-operator", "morning-operator-gate-report.json", 12),
    ("laptop-core", "laptop-core-gate-report.json", 24),
    ("attack-map", "attack-map-report.json", 12),
    ("telegram-soc", "telegram-soc-gate-report.json", 12),
    ("edge-checklist", "edge-protection-checklist-report.json", 48),
    ("relay-lan", "relay-lan-exposure-report.json", 48),
    ("vps-remote", "vps-remote-status-report.json", 72),
    ("enterprise-e9", "enterprise-e9-verify-report.json", 48),
    ("competitive-proof", "competitive-proof.json", 72),
    ("fp-report", "fp-report.json", 168),
    ("fleet-multi", "fleet-multi-node-report.json", 24),
    ("website-live", "website-live-gate-report.json", 48),
    ("dashboard-login-rl", "dashboard-login-rl-e2e-report.json", 24),
    ("hardening-rollback", "hardening-rollback-gate-report.json", 48),
    ("dashboard-jwt-idle", "dashboard-jwt-idle-gate-report.json", 48),
    ("mtls-cert-expiry", "mtls-cert-expiry-report.json", 168),
]

now = datetime.datetime.now(datetime.timezone.utc)
rows = []
stale = []
missing = []

for cid, rel, cap_h in checks:
    p = root / rel
    limit = cap_h if cap_h else max_h
    row = {"id": cid, "file": rel, "max_age_h": limit, "ok": True}
    if not p.is_file():
        row.update(ok=False, status="missing")
        missing.append(cid)
        rows.append(row)
        continue
    age_h = (now - datetime.datetime.fromtimestamp(p.stat().st_mtime, tz=datetime.timezone.utc)).total_seconds() / 3600.0
    row["age_h"] = round(age_h, 2)
    if age_h > limit:
        row.update(ok=False, status="stale")
        stale.append(cid)
    else:
        row["status"] = "fresh"
    rows.append(row)

pass_ = not stale and (not strict or not missing)
out = {
    "date": now.isoformat(),
    "pass": pass_,
    "max_age_h_default": max_h,
    "stale_ids": stale,
    "missing_ids": missing,
    "checks": rows,
    "script": "scripts/proof_freshness_check.sh",
}
Path(report_path).write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")

for r in rows:
    tag = r["status"].upper()
    age = r.get("age_h", "?")
    print(f"[{tag}] {r['id']} age={age}h max={r['max_age_h']}h")

if stale:
    print(f"[WARN] bayat: {', '.join(stale)} — bash scripts/quick_proof_refresh.sh")
if missing:
    print(f"[WARN] eksik: {', '.join(missing)}")

if pass_:
    print("[OK] proof_freshness_check")
    sys.exit(0)
if strict:
    print("[FAIL] proof_freshness_check — STRICT=1", file=sys.stderr)
    sys.exit(1)
print("[WARN] proof_freshness_check — bayat/eksik (STRICT=0)")
sys.exit(0)
PY
