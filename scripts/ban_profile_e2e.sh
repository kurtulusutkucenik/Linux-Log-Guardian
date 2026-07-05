#!/usr/bin/env bash
# AUTO_BAN_PROFILE + consult cache + threat intel offline — statik kanit
#   bash scripts/ban_profile_e2e.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
REPORT="${BAN_PROFILE_E2E_REPORT:-ban-profile-e2e-report.json}"

fail=0
checks=()
ok() { echo "[OK] $*"; checks+=("$*"); }
bad() { echo "[FAIL] $*"; checks+=("FAIL: $*"); fail=$((fail + 1)); }

echo "=== ban_profile_e2e ==="

grep -q 'apply_auto_ban_profile' main.c \
  && ok "AUTO_BAN_PROFILE preset (main.c)" \
  || bad "AUTO_BAN_PROFILE preset yok"

grep -q 'AUTO_BAN_PROFILE' rules.conf \
  && ok "rules.conf AUTO_BAN_PROFILE yorumu" \
  || bad "rules.conf profil anahtari yok"

grep -q 'CONSULT_CACHE_TTL' rules.conf \
  && ok "CONSULT_CACHE_TTL rules.conf" \
  || bad "CONSULT_CACHE_TTL yok"

grep -q 'consult_cache_store' api_server.c \
  && ok "consult cache (api_server.c)" \
  || bad "consult cache yok"

grep -q 'use_offline_list' threat_intel.sh \
  && ok "threat intel offline fallback" \
  || bad "offline fallback yok"

grep -q 'GEOIP_CACHE_DIR' threat_intel.sh \
  && ok "GeoIP zone cache" \
  || bad "GeoIP cache yok"

python3 - "$REPORT" "$fail" "${checks[@]}" <<'PY'
import json, datetime, sys
from pathlib import Path
report = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "script": "scripts/ban_profile_e2e.sh",
    "pass": int(sys.argv[2]) == 0,
    "checks": list(sys.argv[3:]),
}
Path(sys.argv[1]).write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
PY

[[ "$fail" -eq 0 ]] || exit 1
echo "[OK] ban_profile_e2e tamam -> $REPORT"
