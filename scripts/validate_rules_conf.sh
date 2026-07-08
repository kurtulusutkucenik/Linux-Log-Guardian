#!/usr/bin/env bash
# rules.conf dry-run dogrulama — kurulum hatasi erken yakala
#   bash scripts/validate_rules_conf.sh
#   LG_RULES=/etc/log-guardian/rules.conf bash scripts/validate_rules_conf.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=scripts/lib/rules_conf_read.sh
source "$ROOT/scripts/lib/rules_conf_read.sh"

CONF=$(lg_rules_conf_path)
REPORT="${VALIDATE_RULES_REPORT:-validate-rules-conf-report.json}"
fail=0
warn=0
notes=()

bad() { notes+=("fail:$1"); echo "[FAIL] $1"; fail=$((fail + 1)); }
warn_msg() { notes+=("warn:$1"); echo "[WARN] $1"; warn=$((warn + 1)); }
ok() { echo "[OK] $1"; }

echo "=== validate_rules_conf ==="
echo "  conf=$CONF"

[[ -f "$CONF" ]] || bad "rules.conf yok: $CONF"

if [[ -f "$CONF" ]]; then
  api_bind=$(lg_rules_kv API_BIND)
  api_tok=$(lg_rules_kv API_TOKEN)
  iface=$(lg_rules_kv IFACE)

  if [[ -z "$api_bind" ]]; then
    warn_msg "API_BIND yok — varsayilan 127.0.0.1"
  elif [[ "$api_bind" != "127.0.0.1" && "$api_bind" != "localhost" ]]; then
    warn_msg "API_BIND=$api_bind — internet-facing icin 127.0.0.1 onerilir"
  else
    ok "API_BIND loopback"
  fi

  if [[ -z "$api_tok" ]]; then
    bad "API_TOKEN yok — sudo bash scripts/ensure_api_security.sh"
  else
    ok "API_TOKEN mevcut"
  fi

  mut=$(lg_rules_kv API_MUTATION_TOKEN)
  if [[ -n "$mut" && "$mut" != "$api_tok" ]]; then
    ok "API_MUTATION_TOKEN split modu"
  fi

  if [[ -z "$iface" ]]; then
    warn_msg "IFACE yok — daemon NIC otomatik tespit"
  else
    ok "IFACE=$iface"
  fi

  if grep -qE '^TRUST_XFF=1' "$CONF" 2>/dev/null && ! grep -qE '^TRUST_PROXY_CIDRS=' "$CONF" 2>/dev/null; then
    warn_msg "TRUST_XFF=1 ama TRUST_PROXY_CIDRS yok"
  fi
fi

if command -v log-guardian >/dev/null 2>&1; then
  health_ok=0
  if log-guardian --health --quiet 2>/dev/null | grep -q '"ok"'; then
    health_ok=1
    ok "log-guardian --health"
  else
    api_port=$(lg_rules_kv API_PORT)
    api_port="${api_port:-8090}"
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 \
      "http://127.0.0.1:${api_port}/api/v1/metrics" 2>/dev/null || echo 000)
    if [[ "$code" == "200" || "$code" == "403" ]]; then
      health_ok=1
      ok "API :${api_port} ayakta (IPC health atlandi)"
    fi
  fi
  if [[ "$health_ok" -eq 0 ]]; then
    warn_msg "log-guardian --health basarisiz veya servis kapali"
  fi
fi

python3 - "$REPORT" "$fail" "$warn" "${notes[@]}" <<'PY'
import datetime, json, sys
from pathlib import Path
report, fail, warn = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
notes = sys.argv[4:]
Path(report).write_text(json.dumps({
  "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
  "pass": fail == 0,
  "fail": fail,
  "warn": warn,
  "notes": notes,
  "script": "scripts/validate_rules_conf.sh",
}, indent=2) + "\n", encoding="utf-8")
PY

if [[ "$fail" -gt 0 ]]; then
  echo "[FAIL] validate_rules_conf — $fail hata" >&2
  exit 1
fi
echo "[OK] validate_rules_conf — warn=$warn"
exit 0
