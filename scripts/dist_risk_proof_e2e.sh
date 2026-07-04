#!/usr/bin/env bash
# DIST_RISK — /24+UA bonus kaniti (unit test + replay risk farki)
#   bash scripts/dist_risk_proof_e2e.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
REPORT="${ROOT}/dist-risk-proof-report.json"

fail() { echo "[dist_risk_proof_e2e] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

echo "=== dist_risk_proof_e2e ==="

make -s dist-risk-test || fail "dist-risk-test"

grep -q 'loganalyzer_dist_risk_bonus_applied_total' metrics.c \
  || fail "Prometheus dist_risk metrikleri yok"

grep -q 'DIST risk buckets' grafana-dashboard.json \
  || fail "Grafana DIST_RISK paneli yok"

mkdir -p .cache
AUDIT_OFF="$ROOT/.cache/dist_risk_audit_off.jsonl"
AUDIT_ON="$ROOT/.cache/dist_risk_audit_on.jsonl"
LOG="$ROOT/.cache/dist_risk_replay.log"
rm -f "$AUDIT_OFF" "$AUDIT_ON"

UA="DistProofBot/1.0 (distributed)"
TS="02/Jun/2026:10:00:01 +0300"
{
  for i in 10 11 12 13; do
    printf '198.51.100.%d - - [%s] "GET /api?id=1%%27+OR+1%%3D1 HTTP/1.1" 200 100 "-" "%s"\n' "$i" "$TS" "$UA"
  done
  printf '198.51.100.14 - - [%s] "GET /api?id=1%%27+OR+1%%3D1 HTTP/1.1" 200 100 "-" "%s"\n' "$TS" "$UA"
} >"$LOG"

make_rules() {
  local audit="$1" dist="$2"
  cat >"$ROOT/.cache/dist_risk_rules.conf" <<RC
ACCESS_PASSWORD_KDF=pbkdf2\$100000\$6560e0aa800d47957280cab9a1038847\$b0c64cf98788c6921356411f05f1fbc60fbdf6a7e487b34124576866e97cb504
WAF_ENABLED=1
AUTO_BAN=1
AUTO_BAN_MIN_RISK=70
DIST_RISK=${dist}
DIST_RISK_MIN_IPS=3
BAN_POLICY_AUDIT=${audit}
CRS_ENABLED=0
DB_ENABLED=0
WEBHOOK_ENABLED=0
METRICS_PORT=0
RC
  chmod 600 "$ROOT/.cache/dist_risk_rules.conf"
}

make_rules "$AUDIT_OFF" 0
./log-guardian "$LOG" --no-tui --json --no-ban --no-db \
  --rules "$ROOT/.cache/dist_risk_rules.conf" >/dev/null 2>&1 || true

make_rules "$AUDIT_ON" 1
./log-guardian "$LOG" --no-tui --json --no-ban --no-db \
  --rules "$ROOT/.cache/dist_risk_rules.conf" >/dev/null 2>&1 || true

python3 - "$AUDIT_OFF" "$AUDIT_ON" "$REPORT" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path

off_p, on_p, report_p = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])

def last_risk(path):
    if not path.is_file():
        raise SystemExit(f"audit yok: {path}")
    lines = [json.loads(x) for x in path.read_text(encoding="utf-8").splitlines() if x.strip()]
    if not lines:
        raise SystemExit(f"audit bos: {path}")
    row = lines[-1]
    return float(row.get("risk_score", 0)), row.get("decision", "")

risk_off, dec_off = last_risk(off_p)
risk_on, dec_on = last_risk(on_p)
delta = risk_on - risk_off
if delta < 10.0:
    raise SystemExit(f"risk delta yetersiz: off={risk_off} on={risk_on} delta={delta}")

report = {
    "date": datetime.now(timezone.utc).isoformat(),
    "pass": True,
    "risk_off": risk_off,
    "risk_on": risk_on,
    "delta": delta,
    "decision_off": dec_off,
    "decision_on": dec_on,
    "script": "scripts/dist_risk_proof_e2e.sh",
}
report_p.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"risk off={risk_off} on={risk_on} delta={delta:.1f}")
PY

ok "dist_risk_proof_e2e (delta=$(python3 -c "import json; print(json.load(open('$REPORT'))['delta'])"))"
echo "[OK] dist_risk_proof_e2e"
