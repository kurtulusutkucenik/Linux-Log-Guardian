#!/usr/bin/env bash
# Enterprise SOAR ban API — rapor sentezi (sudo gerekmez)
#   bash scripts/enterprise_soar_gate.sh
#   REQUIRE_SOAR=1 bash scripts/enterprise_soar_gate.sh   # SOAR kapali = FAIL
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
REPORT="${ENTERPRISE_SOAR_GATE_REPORT:-enterprise-soar-gate-report.json}"

bash "$ROOT/scripts/caddy_mtls_status_export.sh" >/dev/null 2>&1 || true

python3 - "$REPORT" "$ROOT" <<'PY'
import datetime
import json
import os
import sys
from pathlib import Path

report_path, root = Path(sys.argv[1]), Path(sys.argv[2])

def load(name: str) -> dict:
    p = root / name
    if not p.is_file():
        return {}
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}

status = load("caddy-mtls-status.json")
dash = load("dashboard-ban-api-report.json")
mtls = load("ban-api-mtls-report.json")
caddy = load("caddy-api-mtls-report.json")
audit = load("api-mutation-audit-e2e-report.json")

enabled = status.get("enabled") is True
strict = status.get("mtls_strict") is True
dash_ok = dash.get("pass") is True
caddy_ok = mtls.get("caddy_mtls_verify") is True or caddy.get("pass") is True
lab_ok = mtls.get("mtls_verify") is True or mtls.get("pass") is True
mutation_ok = mtls.get("mutation_ok") is not False
audit_ok = audit.get("pass") is True

require_soar = os.environ.get("REQUIRE_SOAR", "0") == "1"
require_strict = os.environ.get("REQUIRE_STRICT", "0") == "1"

reasons = []
mode = "enterprise" if enabled else "community"

if not enabled:
    if require_soar:
        reasons.append("soar_disabled")
else:
    if not dash_ok:
        reasons.append("dashboard_ban_smoke")
    if not caddy_ok:
        reasons.append("caddy_mtls")
    if not lab_ok:
        reasons.append("mtls_lab")
    if not mutation_ok:
        reasons.append("mutation_token")
    if enabled and not audit_ok:
        reasons.append("mutation_audit")
    if require_strict and not strict:
        reasons.append("mtls_strict_off")

ok = len(reasons) == 0
out = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "pass": ok,
    "mode": mode,
    "soar_enabled": enabled,
    "mtls_strict": strict,
    "dashboard_ban_ok": dash_ok,
    "caddy_mtls_ok": caddy_ok if enabled else None,
    "mtls_lab_ok": lab_ok,
    "mutation_ok": mutation_ok,
    "audit_ok": audit_ok if enabled else None,
    "soar_url": status.get("soar_url"),
    "relay_url": status.get("relay_url"),
    "enable_cmd": "sudo bash scripts/enable_enterprise_soar_api.sh",
    "disable_cmd": "sudo bash scripts/disable_enterprise_soar_api.sh",
    "script": "scripts/enterprise_soar_gate.sh",
}
if not ok:
    out["fail_reason"] = "; ".join(reasons)
report_path.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
print(json.dumps(out, indent=2))
sys.exit(0 if ok else 1)
PY
