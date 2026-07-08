#!/usr/bin/env bash
# mTLS sertifika sure kontrolu — Plan B2 (SOAR lab / prod)
#   bash scripts/mtls_cert_expiry_check.sh
#   WARN_DAYS=14 bash scripts/mtls_cert_expiry_check.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
REPORT="${MTLS_CERT_EXPIRY_REPORT:-mtls-cert-expiry-report.json}"
WARN_DAYS="${WARN_DAYS:-14}"
MTLS_DIR="${LG_MTLS_DIR:-$ROOT/deploy/mtls}"

bash "$ROOT/scripts/caddy_mtls_status_export.sh" >/dev/null 2>&1 || true

certs=()
[[ -f "$MTLS_DIR/client.crt" ]] && certs+=("client:$MTLS_DIR/client.crt")
[[ -f "$MTLS_DIR/server.crt" ]] && certs+=("server:$MTLS_DIR/server.crt")
[[ -f "$MTLS_DIR/ca.crt" ]] && certs+=("ca:$MTLS_DIR/ca.crt")

python3 - "$REPORT" "$WARN_DAYS" "${certs[@]}" <<'PY'
import datetime, json, subprocess, sys
from pathlib import Path

report_path = Path(sys.argv[1])
warn_days = int(sys.argv[2])
entries = []
pass_ = True
min_days = None

for spec in sys.argv[3:]:
    label, path = spec.split(":", 1)
    try:
        out = subprocess.check_output(
            ["openssl", "x509", "-enddate", "-noout", "-in", path],
            text=True,
        )
        end_raw = out.split("=", 1)[1].strip()
        days_s = subprocess.check_output(
            [sys.executable, "-c",
             "import datetime,sys; raw=sys.argv[1]; "
             "dt=datetime.datetime.strptime(raw,'%b %d %H:%M:%S %Y %Z').replace(tzinfo=datetime.timezone.utc); "
             "print(int((dt-datetime.datetime.now(datetime.timezone.utc)).total_seconds()/86400))",
             end_raw],
            text=True,
        ).strip()
        days = int(days_s)
    except (subprocess.CalledProcessError, ValueError, OSError):
        entries.append({"id": label, "path": path, "ok": False, "error": "parse_fail"})
        continue
    ok = days > warn_days
    if not ok:
        pass_ = False
    if min_days is None or days < min_days:
        min_days = days
    entries.append({
        "id": label, "path": path, "days_left": days,
        "ok": ok, "warn_days": warn_days,
    })

out = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "pass": pass_ if entries else True,
    "skipped": not entries,
    "warn_days": warn_days,
    "min_days_left": min_days,
    "certs": entries,
    "script": "scripts/mtls_cert_expiry_check.sh",
    "doc": "docs/MTLS_ROTATION_RUNBOOK.md",
}
report_path.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
print(json.dumps(out, indent=2))
if not entries:
    print("[SKIP] mtls_cert_expiry_check — sertifika yok (SOAR kapali)")
    sys.exit(0)
if pass_:
    print(f"[OK] mtls_cert_expiry_check — min {min_days} gun")
    sys.exit(0)
print(f"[WARN] mtls_cert_expiry_check — min {min_days} gun (<={warn_days})", file=sys.stderr)
sys.exit(0)
PY
