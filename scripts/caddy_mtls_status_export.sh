#!/usr/bin/env bash
# Caddy SOAR mTLS + ban relay durumu — dashboard /bans paneli
#   bash scripts/caddy_mtls_status_export.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

OUT="${CADDY_MTLS_STATUS_JSON:-caddy-mtls-status.json}"
STAMP="${ROOT}/deploy/mtls.d/.enabled"
SNIP="${ROOT}/deploy/mtls.d/10-mtls-api.caddy"
BAN_MTLS="${ROOT}/ban-api-mtls-report.json"
DASH_BAN="${ROOT}/dashboard-ban-api-report.json"
STRICT_ENV="/etc/log-guardian/env"

python3 - "$OUT" "$STAMP" "$SNIP" "$BAN_MTLS" "$DASH_BAN" "$STRICT_ENV" <<'PY'
import datetime
import json
import sys
from pathlib import Path

out_p, stamp_p, snip_p, ban_mtls_p, dash_ban_p, strict_env_p = (Path(a) for a in sys.argv[1:7])

enabled = stamp_p.is_file() and snip_p.is_file()
enabled_at = stamp_p.read_text(encoding="utf-8").strip() if enabled and stamp_p.is_file() else None

mtls_strict = False
if strict_env_p.is_file():
    for line in strict_env_p.read_text(encoding="utf-8", errors="replace").splitlines():
        if line.startswith("GUARDIAN_API_MTLS_STRICT="):
            mtls_strict = line.split("=", 1)[1].strip().lower() in ("1", "true", "yes")
            break

ban_mtls = {}
if ban_mtls_p.is_file():
    try:
        ban_mtls = json.loads(ban_mtls_p.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        ban_mtls = {}

dash_ban = {}
if dash_ban_p.is_file():
    try:
        dash_ban = json.loads(dash_ban_p.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        dash_ban = {}

out = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "enabled": enabled,
    "enabled_at": enabled_at,
    "soar_url": "https://localhost:9443",
    "dashboard_url": "https://localhost:8443",
    "relay_url": "http://ban-api-relay:18090",
    "metrics_relay_url": "http://metrics-relay:19091/metrics",
    "host_api_bridge": "host-api-bridge (docker0 :18091/:19092)",
    "host_api_url": "http://127.0.0.1:8090",
    "caddy_mtls_verify": ban_mtls.get("caddy_mtls_verify"),
    "caddy_skipped": ban_mtls.get("caddy_skipped"),
    "mtls_verify": ban_mtls.get("mtls_verify"),
    "mtls_strict": mtls_strict,
    "relay_ok": (dash_ban.get("relay_api") or {}).get("ok"),
    "host_ok": (dash_ban.get("host_api") or {}).get("ok"),
    "docker_ok": (dash_ban.get("docker_api") or {}).get("ok"),
    "metrics_ok": (dash_ban.get("metrics_api") or {}).get("ok"),
    "host_api_bridge_ok": (dash_ban.get("host_api_bridge") or {}).get("ok"),
    "dashboard_ban_pass": dash_ban.get("pass"),
    "script": "scripts/caddy_mtls_status_export.sh",
}
out_p.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
print(f"[OK] caddy_mtls_status_export -> {out_p} enabled={enabled}")
PY
