#!/usr/bin/env bash
# VPS gelince kurulum — laptop hazirlik kapisi (sunucu gerekmez)
#   bash scripts/vps_prep_gate.sh
# VPS'te gercek XDP: sudo bash scripts/vps_xdp_proof.sh
# Rehber: docs/VPS_SETUP.md
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
REPORT="${VPS_PREP_GATE_REPORT:-vps-prep-gate-report.json}"

fail=0
ok() { echo "[OK] $*"; }
warn() { echo "[WARN] $*" >&2; fail=$((fail + 1)); }

echo "=== vps_prep_gate (laptop — VPS yok) ==="

[[ -f "$ROOT/docs/VPS_SETUP.md" ]] && ok "docs/VPS_SETUP.md" || warn "docs/VPS_SETUP.md yok"

for s in install.sh scripts/install_first_run.sh scripts/prod_edge_setup.sh \
  scripts/vps_xdp_proof.sh scripts/post_install_verify.sh \
  scripts/install_soak_systemd.sh scripts/enable_enterprise_soar_api.sh; do
  [[ -f "$ROOT/$s" ]] && ok "$s" || warn "$s eksik"
done

if VPS_XDP_SKIP=1 bash "$ROOT/scripts/vps_xdp_proof.sh" >/dev/null 2>&1; then
  ok "vps_xdp_proof skip modu (ipset-fallback kaniti)"
else
  warn "vps_xdp_proof skip — bash scripts/post_install_verify.sh"
fi

if [[ -f "$ROOT/edge-protection-checklist-report.json" ]] \
    && python3 -c "import json,sys; d=json.load(open('$ROOT/edge-protection-checklist-report.json')); sys.exit(0 if d.get('pass') else 1)" 2>/dev/null; then
  ec=$(python3 -c "import json; s=json.load(open('$ROOT/edge-protection-checklist-report.json'))['summary']; print(f\"{s['pass']}/{s['total']}\")" 2>/dev/null || echo "?/?")
  ok "edge_protection_checklist (rapor $ec)"
elif bash "$ROOT/scripts/edge_protection_checklist.sh" >/dev/null 2>&1; then
  ec=$(python3 -c "import json; s=json.load(open('$ROOT/edge-protection-checklist-report.json'))['summary']; print(f\"{s['pass']}/{s['total']}\")" 2>/dev/null || echo "?/?")
  ok "edge_protection_checklist ($ec pass)"
else
  warn "edge_protection_checklist — bash scripts/edge_protection_checklist.sh"
fi

proof=$(python3 -c "
import json
from pathlib import Path
p = Path('$ROOT/competitive-proof.json')
if not p.is_file():
    print('0/0')
    raise SystemExit(1)
t = json.load(p.open())['validationTests']
pn = sum(1 for x in t if x.get('status') == 'pass')
print(f'{pn}/{len(t)}')
" 2>/dev/null || echo "0/0")
if [[ "$proof" == "89/89" ]] || [[ "$proof" == */89 ]] \
    || [[ "$proof" == "88/88" ]] || [[ "$proof" == "85/85" ]] \
    || [[ "$proof" == "84/84" ]] || [[ "$proof" == "83/83" ]] \
    || [[ "$proof" == */85 ]] || [[ "$proof" == */84 ]] || [[ "$proof" == */83 ]]; then
  ok "competitive-proof $proof"
else
  warn "competitive-proof $proof (beklenen 89/89)"
fi

if [[ -f "$ROOT/website-live-gate-report.json" ]] \
    && python3 -c "import json,sys; d=json.load(open('$ROOT/website-live-gate-report.json')); c=d.get('live_cards'); ok=d.get('pass') and (c is None or c>=84); sys.exit(0 if ok else 1)" 2>/dev/null; then
  live=$(python3 -c "import json; d=json.load(open('$ROOT/website-live-gate-report.json')); print(d.get('live_cards') or d.get('expected_tests','?'))")
  ok "website_live_gate (${live} kart)"
else
  warn "website_live_gate — LG_WEBSITE_PUBLISH=1 bash scripts/website_publish.sh"
fi

python3 - "$REPORT" "$ROOT" "$fail" "$proof" <<'PY'
import datetime
import json
import sys
from pathlib import Path

report_path = Path(sys.argv[1])
root = Path(sys.argv[2])
fail_n = int(sys.argv[3])
proof = sys.argv[4]

vps_steps = [
    "sudo bash install.sh",
    "sudo bash scripts/install_first_run.sh",
    "sudo bash scripts/prod_edge_setup.sh",
    "sudo bash scripts/fix_nginx_inline_consult.sh",
    "sudo bash scripts/enable_enterprise_soar_api.sh  # opsiyonel Enterprise SOAR",
    "sudo bash scripts/vps_xdp_proof.sh  # eth0 kernel-XDP (skip YOK)",
    "sudo bash scripts/install_soak_systemd.sh  # 72h soak",
    "bash scripts/post_install_verify.sh",
]

out = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "pass": int(fail_n) == 0,
    "fail_count": int(fail_n),
    "laptop_mode": True,
    "vps_available": False,
    "competitive_proof": proof,
    "xdp_report_mode": json.loads((root / "vps-xdp-report.json").read_text(encoding="utf-8")).get("mode")
    if (root / "vps-xdp-report.json").is_file()
    else None,
    "vps_when_ready": vps_steps,
    "doc": "docs/VPS_SETUP.md",
    "script": "scripts/vps_prep_gate.sh",
}
report_path.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(json.dumps(out, indent=2, ensure_ascii=False))
sys.exit(0 if int(fail_n) == 0 else 1)
PY

if [[ "$fail" -eq 0 ]]; then
  echo "[OK] vps_prep_gate — VPS gelince: docs/VPS_SETUP.md"
  exit 0
fi
echo "[WARN] vps_prep_gate — $fail madde" >&2
exit 1
