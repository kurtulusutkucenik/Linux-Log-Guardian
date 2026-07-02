#!/usr/bin/env bash
# Sprint AI — Laptop HOST VM hazirlik kapisi (sync oncesi kanit)
#   bash scripts/vm_host_prep_gate.sh
# VM icinde: vm_sync_from_host.sh → vm_build_binary.sh → vm_demo_gate.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REPORT="${VM_HOST_PREP_GATE_REPORT:-vm-host-prep-gate-report.json}"

# shellcheck source=scripts/lib/vm_paths.sh
source "$ROOT/scripts/lib/vm_paths.sh"

lg_is_vbox_guest() {
  command -v systemd-detect-virt >/dev/null 2>&1 \
    && [[ "$(systemd-detect-virt 2>/dev/null)" == "oracle" ]] && return 0
  grep -qiE 'virtualbox|innotek' /sys/class/dmi/id/product_name 2>/dev/null && return 0
  [[ "${HOSTNAME:-}" == *VirtualBox* ]] && return 0
  return 1
}

fail() {
  python3 -c "
import json, datetime
from pathlib import Path
Path('$REPORT').write_text(json.dumps({
  'date': datetime.datetime.now(datetime.timezone.utc).isoformat(),
  'pass': False,
  'fail_reason': '''$*''',
  'script': 'scripts/vm_host_prep_gate.sh',
}, indent=2)+'\n', encoding='utf-8')
"
  echo "[vm_host_prep_gate] FAIL: $*" >&2
  exit 1
}

echo "=== vm_host_prep_gate (Sprint AI) ==="

ctx="host"
if lg_is_vbox_guest 2>/dev/null; then
  ctx="vm-guest"
  echo "[WARN] VM guest icindesin — host prep icin laptop'ta calistir" >&2
fi
command -v VBoxManage >/dev/null 2>&1 && [[ "$ctx" == "host" ]] && ctx="host-vbox"

REQUIRED=(
  scripts/vm_sync_from_host.sh
  scripts/vm_host_refresh.sh
  scripts/vm_build_binary.sh
  scripts/vm_demo_gate.sh
  scripts/vm_refresh_from_host.sh
  scripts/vm_sprint_proof.sh
  docs/ENTERPRISE_ESCALATION.md
)
for s in "${REQUIRED[@]}"; do
  [[ -f "$ROOT/$s" ]] || fail "eksik: $s"
done

bash "$ROOT/scripts/vm_sprint_proof.sh" >/dev/null 2>&1 || true

vbox_vm=""
vbox_share=0
if command -v VBoxManage >/dev/null 2>&1; then
  vbox_vm="${LG_VM_NAME:-ubuntu 24.04}"
  if VBoxManage showvminfo "$vbox_vm" 2>/dev/null | grep -q "Host path: '$ROOT'"; then
    vbox_share=1
  fi
fi

post_fail=1
post_warn=0
if bash "$ROOT/scripts/post_install_verify.sh" >/tmp/vm_host_prep_verify.out 2>&1; then
  post_fail=0
fi
post_warn=$(grep -oP 'WARN:\s*\K[0-9]+' /tmp/vm_host_prep_verify.out 2>/dev/null | tail -1 || echo 0)

python3 - "$REPORT" "$ROOT" "$ctx" "$post_fail" "$post_warn" "$vbox_share" "$vbox_vm" <<'PY'
import json, datetime, sys
from pathlib import Path

report_path, root_s, ctx = sys.argv[1], sys.argv[2], sys.argv[3]
post_fail, post_warn = int(sys.argv[4]), int(sys.argv[5])
vbox_share = int(sys.argv[6])
vbox_vm = sys.argv[7]
root = Path(root_s)

proof_path = root / "competitive-proof.json"
proof = json.loads(proof_path.read_text(encoding="utf-8")) if proof_path.is_file() else {}
tests = proof.get("validationTests") or []
test_n = len(tests)
test_pass = sum(1 for t in tests if t.get("status") == "pass")

vm_sprint = {}
for p in (root / "vm-sprint-proof.json", root / ".cache" / "vm-sprint-proof.json"):
    if p.is_file():
        vm_sprint = json.loads(p.read_text(encoding="utf-8"))
        break

reasons = []
if post_fail != 0:
    reasons.append(f"post_install_fail={post_fail}")
if test_n < 64:
    reasons.append(f"proof_tests={test_n}")
if test_pass < test_n:
    reasons.append(f"proof_pass={test_pass}/{test_n}")
if ctx == "host-vbox" and vbox_share == 0:
    reasons.append("vbox_share_missing")

ok = len(reasons) == 0
out = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "pass": ok,
    "context": ctx,
    "post_install_fail": post_fail,
    "post_install_warn": post_warn,
    "proof_tests": test_n,
    "proof_pass": test_pass,
    "vm_sprint_pass": vm_sprint.get("pass"),
    "vbox_vm": vbox_vm or None,
    "vbox_share_ok": bool(vbox_share),
    "script": "scripts/vm_host_prep_gate.sh",
}
if not ok:
    out["fail_reason"] = "; ".join(reasons)
Path(report_path).write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
print(json.dumps(out, indent=2))
if not ok:
    sys.exit(1)
PY

echo "[OK] vm_host_prep_gate — ctx=$ctx proof=$(python3 -c "import json; d=json.load(open('$REPORT')); print(f\"{d['proof_pass']}/{d['proof_tests']}\")")"
echo "  VM: sudo bash scripts/vm_sync_from_host.sh  (veya /mnt/lg/scripts/vm_refresh_from_host.sh)"
echo "       sudo bash scripts/vm_build_binary.sh && sudo bash scripts/vm_demo_gate.sh"
