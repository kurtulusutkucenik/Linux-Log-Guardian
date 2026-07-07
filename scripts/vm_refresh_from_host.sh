#!/usr/bin/env bash
# VM tek komut: host paylasimindan sync + binary + telegram poll kapat + demo gate
#   sudo mount -t vboxsf lg /mnt/lg    # gerekirse
#   sudo bash /mnt/lg/scripts/vm_refresh_from_host.sh
#
# Yerel klon sonrasi: sudo bash ~/Linux-Log-Guardian/scripts/vm_refresh_from_host.sh
set -euo pipefail

SHARE="${LG_VM_SYNC_SRC:-/mnt/lg}"
# Host paylasimi (/mnt/lg) varsa oncelik — yerel klon eski kalmasin
if [[ -z "${LG_VM_SYNC_SRC:-}" && -d /mnt/lg/scripts ]]; then
  SHARE="/mnt/lg"
elif [[ -f "${BASH_SOURCE[0]}" && ! -d "$SHARE/scripts" ]]; then
  SHARE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  [[ -d "$SHARE_ROOT/scripts" ]] && SHARE="$SHARE_ROOT"
fi

# shellcheck source=scripts/lib/vm_paths.sh
source "$SHARE/scripts/lib/vm_paths.sh"
REAL_USER="$(lg_vm_real_user)"
DEST="$(lg_vm_dest_dir)"

if [[ ! -d "$SHARE/scripts" ]]; then
  echo "[vm_refresh] FAIL: host paylasimi yok ($SHARE)" >&2
  echo "  VM icinde: sudo mount -t vboxsf lg /mnt/lg" >&2
  echo "  Sonra: sudo bash /mnt/lg/scripts/vm_refresh_from_host.sh" >&2
  exit 1
fi

echo "=== vm_refresh_from_host ==="
if [[ "$SHARE" == /mnt/lg* ]]; then
  echo "  kaynak: $SHARE (host paylasimi — guncel kod)"
else
  echo "  kaynak: $SHARE (yerel klon — host icin: sudo mount -t vboxsf lg /mnt/lg)"
fi
echo "  hedef:  $DEST (kullanici: $REAL_USER)"
echo ""

export LG_VM_SYNC_SRC="$SHARE"
export LG_VM_SYNC_DEST="$DEST"
export LG_VM_USER="$REAL_USER"
bash "$SHARE/scripts/vm_sync_from_host.sh"

cd "$DEST"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "[vm_refresh] binary/demo icin sudo..." >&2
  exec sudo env \
    LG_VM_SYNC_SRC="$SHARE" \
    LG_VM_SYNC_DEST="$DEST" \
    LG_VM_USER="$REAL_USER" \
    bash "$SHARE/scripts/vm_refresh_from_host.sh"
fi

bash scripts/vm_build_binary.sh
bash scripts/vm_disable_telegram_poll.sh
if [[ -n "$REAL_USER" && "$REAL_USER" != root ]]; then
  chown -R "$REAL_USER:$REAL_USER" "$DEST" 2>/dev/null || true
  # Dashboard /tests auth + journald kapilari (fixture otomatik)
  sudo -u "$REAL_USER" bash "$DEST/scripts/ops_gate_report.sh"
  sudo -u "$REAL_USER" bash "$DEST/scripts/sync_dashboard_data.sh" 2>/dev/null || true
fi
bash scripts/vm_demo_gate.sh

if [[ -n "$REAL_USER" && "$REAL_USER" != root ]]; then
  echo ""
  echo "[vm_refresh] analyzer stack (VM :9091 metrik)..."
  bash scripts/vm_analyzer_stack.sh 2>/dev/null || true
fi

if [[ -n "$REAL_USER" && "$REAL_USER" != root ]]; then
  echo ""
  echo "[vm_refresh] fleet agent (host :8443)..."
  if sudo -u "$REAL_USER" bash "$DEST/scripts/vm_fleet_agent_setup.sh" --install-user-service; then
    echo "[OK] vm_fleet_agent_setup"
  else
    echo "[WARN] vm_fleet_agent — host stack kapali veya ag yok (normal offline demo)" >&2
  fi
fi

echo ""
echo "=== vm_refresh ozet ==="
python3 - "$DEST" <<'PY'
import json, sys
from pathlib import Path
dest = Path(sys.argv[1])
gate_fail = 0
gate_warn = 0
ops = dest / "ops-gate-report.json"
if ops.is_file():
    data = json.loads(ops.read_text(encoding="utf-8"))
    gates = data.get("gates") or []
    gate_fail = sum(1 for g in gates if g.get("pass") is not True)
    gate_warn = sum(int(g.get("warn") or 0) for g in gates)
    print(f"  ops_gate: {len(gates) - gate_fail}/{len(gates)} pass")
    for g in gates:
        if g.get("id") == "post-install-verify":
            print(f"  post_install: FAIL={g.get('fail', 0)} WARN={g.get('warn', 0)}")
            break
else:
    print("  ops_gate: (rapor yok — bash scripts/ops_gate_report.sh)")
preview = dest / "website-preview-gate-report.json"
if preview.is_file():
    r = json.loads(preview.read_text(encoding="utf-8"))
    if r.get("pass") is True:
        sf = int(r.get("site_fail") or 0)
        shown = int(r.get("site_pass_all") or r.get("site_tests") or 0)
        if sf > 0:
            shown = int(r.get("site_pass_all") or r.get("site_pass") or 0)
        exp = int(r.get("expected_tests") or 0)
        print(f"  website_preview: {shown}/{exp} pass")
    else:
        gate_fail += 1
        print(f"  website_preview: FAIL ({r.get('fail_reason', '?')})")
print(f"  FAIL: {gate_fail}   WARN: {gate_warn}")
if gate_fail == 0:
    print("[OK] vm_refresh_from_host — sunuma hazir (FAIL=0)")
else:
    print("[WARN] vm_refresh_from_host — FAIL>0; bash scripts/vm_demo_gate.sh --verify-only")
PY
echo ""
echo "[OK] vm_refresh_from_host — VM guncel"
if deb="$(ls -1t "$DEST"/dist/log-guardian_*.deb 2>/dev/null | head -1)"; then
  echo "  .deb kurulum (opsiyonel): sudo bash scripts/vm_install_deb.sh"
  echo "    -> $(basename "$deb")"
else
  echo "  .deb yok — HOST: bash scripts/build_deb.sh, sonra tekrar vm_refresh"
fi
echo "  Telegram inline butonlar: laptop/host'ta (VM poll kapali — normal)"
echo "  VM webhook gonderimi: acik (WEBHOOK_ENABLED=1, BOT poll=0)"
echo "  Dashboard /tests: bash scripts/dashboard_refresh.sh && Ctrl+Shift+R :8443/tests"
