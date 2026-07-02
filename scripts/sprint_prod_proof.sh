#!/usr/bin/env bash
# Sprint prod kaniti — RULES_VERIFY + STIX + VM gate ozeti -> sprint-prod-proof.json
#   bash scripts/sprint_prod_proof.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
ETC="${LG_ETC:-/etc/log-guardian}"
CONF="${ETC}/rules.conf"
OUT="${LG_SPRINT_PROOF:-$ROOT/sprint-prod-proof.json}"

lg_is_vbox_guest() {
  command -v systemd-detect-virt >/dev/null 2>&1 \
    && [[ "$(systemd-detect-virt 2>/dev/null)" == "oracle" ]] && return 0
  grep -qiE 'virtualbox|innotek' /sys/class/dmi/id/product_name 2>/dev/null && return 0
  [[ "${HOSTNAME:-}" == *VirtualBox* ]] && return 0
  return 1
}

rules_verify=0
siem_stix=0
siem_fwd=0
mesh_none=0
block_countries=""
post_fail=1 post_warn=0

[[ -f "$CONF" ]] || { echo "[sprint_prod_proof] WARN: $CONF yok" >&2; }
grep -q '^RULES_VERIFY=1' "$CONF" 2>/dev/null && rules_verify=1
grep -q '^SIEM_FORMAT=stix' "$CONF" 2>/dev/null && siem_stix=1
grep -q '^SIEM_FORWARDER_ENABLED=1' "$CONF" 2>/dev/null && siem_fwd=1
grep -q '^MESH_BACKEND=none' "$CONF" 2>/dev/null && mesh_none=1
block_countries="$(grep '^BLOCK_COUNTRIES=' "$CONF" 2>/dev/null | tail -1 | cut -d= -f2- | tr -d '\r' || true)"

siem_pass=false
siem_fmt="json"
if [[ -f "$ROOT/siem-export-report.json" ]]; then
  siem_pass=$(python3 -c "import json; d=json.load(open('$ROOT/siem-export-report.json')); print('true' if d.get('pass') else 'false')")
  siem_fmt=$(python3 -c "import json; print(json.load(open('$ROOT/siem-export-report.json')).get('format','json'))")
fi

mkdir -p "$ROOT/.cache"
VERIFY_OUT="$ROOT/.cache/sprint_prod_verify.out"
: >"$VERIFY_OUT"

_run_post_install() {
  bash "$ROOT/scripts/post_install_verify.sh"
}

post_fail=1
if [[ "$(id -u)" -eq 0 && -n "${SUDO_USER:-}" && "$SUDO_USER" != root ]] \
    && id "$SUDO_USER" >/dev/null 2>&1; then
  if runuser -u "$SUDO_USER" -- bash -c "bash \"$ROOT/scripts/post_install_verify.sh\"" \
    >"$VERIFY_OUT" 2>&1; then
    post_fail=0
  fi
elif _run_post_install >"$VERIFY_OUT" 2>&1; then
  post_fail=0
fi
post_warn=$(grep -oP 'WARN:\s*\K[0-9]+' "$VERIFY_OUT" 2>/dev/null | tail -1 || echo 0)

vm_gate="unknown"
if lg_is_vbox_guest 2>/dev/null; then
  vm_gate="guest"
elif command -v VBoxManage >/dev/null 2>&1; then
  vm_gate="host"
fi

pass=0
if [[ "$rules_verify" -eq 1 && "$siem_stix" -eq 1 && "$siem_fwd" -eq 1 && "$mesh_none" -eq 1 \
    && "$post_fail" -eq 0 && "$siem_pass" == "true" && "$siem_fmt" == "stix" ]]; then
  pass=1
fi

siem_pass_bool=0
[[ "$siem_pass" == "true" ]] && siem_pass_bool=1

python3 - "$OUT" <<PY
import json, datetime
doc = {
    "date": datetime.date.today().isoformat(),
    "pass": bool($pass),
    "rules_verify": bool($rules_verify),
    "siem_format_stix": bool($siem_stix),
    "siem_forwarder": bool($siem_fwd),
    "mesh_backend_none": bool($mesh_none),
    "block_countries": """${block_countries}""",
    "siem_e2e": {"pass": bool($siem_pass_bool), "format": """$siem_fmt"""},
    "post_install": {"fail": int($post_fail), "warn": int($post_warn)},
    "vm_context": """$vm_gate""",
    "scripts": [
        "scripts/sprint_harden_prod.sh",
        "scripts/siem_export_e2e.sh",
        "scripts/vm_demo_gate.sh",
    ],
}
with open("$OUT", "w", encoding="utf-8") as f:
    json.dump(doc, f, ensure_ascii=False, indent=2)
    f.write("\n")
print(f"[OK] sprint_prod_proof -> $OUT pass={doc['pass']}")
PY
