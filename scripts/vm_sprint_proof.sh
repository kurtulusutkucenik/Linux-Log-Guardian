#!/usr/bin/env bash
# VM/laptop sprint kaniti — demo gate + threat intel kapilari -> vm-sprint-proof.json
#   bash scripts/vm_sprint_proof.sh
# VM icinde: sudo bash /mnt/lg/scripts/vm_refresh_from_host.sh sonrasi
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
CACHE="$ROOT/.cache"
mkdir -p "$CACHE"
OUT="${LG_VM_SPRINT_PROOF:-$CACHE/vm-sprint-proof.json}"
# Eski kok kanit (host sync root sahiplik) — yazilabilir degilse .cache kullan
if [[ -e "$ROOT/vm-sprint-proof.json" && ! -w "$ROOT/vm-sprint-proof.json" ]]; then
  OUT="$CACHE/vm-sprint-proof.json"
fi

# shellcheck source=scripts/lib/vm_paths.sh
source "$ROOT/scripts/lib/vm_paths.sh"

lg_is_vbox_guest() {
  command -v systemd-detect-virt >/dev/null 2>&1 \
    && [[ "$(systemd-detect-virt 2>/dev/null)" == "oracle" ]] && return 0
  grep -qiE 'virtualbox|innotek' /sys/class/dmi/id/product_name 2>/dev/null && return 0
  [[ "${HOSTNAME:-}" == *VirtualBox* ]] && return 0
  return 1
}

ctx="host"
lg_is_vbox_guest 2>/dev/null && ctx="vm-guest"
command -v VBoxManage >/dev/null 2>&1 && [[ "$ctx" == "host" ]] && ctx="host-vbox"

post_fail=1 post_warn=0
taxii_pass=false crowdsec_pass=false harden_hint=false

if bash "$ROOT/scripts/post_install_verify.sh" >/tmp/vm_sprint_verify.out 2>&1; then
  post_fail=0
fi
post_warn=$(grep -oP 'WARN:\s*\K[0-9]+' /tmp/vm_sprint_verify.out 2>/dev/null | tail -1 || echo 0)

bash "$ROOT/scripts/taxii_feed_e2e.sh" >/dev/null 2>&1 && taxii_pass=true
bash "$ROOT/scripts/crowdsec_bouncer_e2e.sh" >/dev/null 2>&1 && crowdsec_pass=true
[[ -x "$ROOT/scripts/sprint_harden_gate.sh" ]] && harden_hint=true

pass=0
if [[ "$post_fail" -eq 0 && "$taxii_pass" == true && "$crowdsec_pass" == true ]]; then
  pass=1
fi

python3 - "$OUT" <<PY
import json, datetime
doc = {
    "date": datetime.date.today().isoformat(),
    "pass": bool($pass),
    "context": """$ctx""",
    "post_install": {"fail": int($post_fail), "warn": int($post_warn)},
    "taxii_feed_e2e": bool("$taxii_pass" == "true"),
    "crowdsec_bouncer_e2e": bool("$crowdsec_pass" == "true"),
    "sprint_harden_gate_available": bool("$harden_hint" == "true"),
    "note": "VPS yerine VM — XDP demo kapali, ipset fallback normal",
    "scripts": [
    "scripts/vm_host_prep_gate.sh",
        "scripts/docs_consistency_gate.sh",
        "scripts/vm_fleet_gate.sh",
        "scripts/vm_demo_gate.sh",
        "scripts/vm_refresh_from_host.sh",
        "scripts/taxii_feed_e2e.sh",
        "scripts/crowdsec_bouncer_e2e.sh",
    ],
}
with open("$OUT", "w", encoding="utf-8") as f:
    json.dump(doc, f, ensure_ascii=False, indent=2)
    f.write("\n")
print(f"[OK] vm_sprint_proof -> $OUT pass={doc['pass']} context={doc['context']}")
PY

# Dashboard / evidence sync (kok yazilabilir degilse .cache kalir)
if [[ -w "$ROOT" ]]; then
  cp -f "$OUT" "$ROOT/vm-sprint-proof.json" 2>/dev/null || true
fi
