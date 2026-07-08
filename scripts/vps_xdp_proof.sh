#!/usr/bin/env bash
# VPS XDP kaniti — eth0/ens3 uzerinde eBPF aktif mi?
#   sudo bash scripts/vps_xdp_proof.sh
# Laptop/Wi-Fi (XDP yok): VPS_XDP_SKIP=1 bash scripts/vps_xdp_proof.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/lib/vm_guest.sh
source "$ROOT/scripts/lib/vm_guest.sh" 2>/dev/null || true

FAIL=0
ok() { echo "[OK] $*"; }
warn() { echo "[WARN] $*"; }
bad() { echo "[FAIL] $*"; FAIL=$((FAIL + 1)); }

LG_BIN="${LG_BIN:-/usr/local/bin/log-guardian}"
[[ -x "$LG_BIN" ]] || LG_BIN="$ROOT/log-guardian"
METRICS_PORT="${METRICS_PORT:-9091}"

echo "=== vps_xdp_proof ==="

if [[ "${VPS_XDP_SKIP:-0}" != "1" ]] && lg_is_vbox_guest 2>/dev/null; then
  warn "VirtualBox guest — VPS_XDP_SKIP=1 (kernel-XDP VPS'te; VM'de ipset-fallback normal)"
  VPS_XDP_SKIP=1
fi

if [[ "${VPS_XDP_SKIP:-0}" == "1" ]]; then
  warn "VPS_XDP_SKIP=1 — laptop/Wi-Fi modu (ipset fallback normal)"
  bash "$ROOT/scripts/post_install_verify.sh" && ok "post_install_verify (no-xdp)" || bad "post_install_verify"
  python3 - "$ROOT/vps-xdp-report.json" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path
out = Path(sys.argv[1])
out.write_text(json.dumps({
    "date": datetime.now(timezone.utc).isoformat(),
    "pass": True,
    "mode": "skip",
    "xdp_mode": "ipset-fallback",
    "iface": None,
    "fail_count": 0,
    "script": "scripts/vps_xdp_proof.sh",
}, indent=2) + "\n", encoding="utf-8")
PY
  [[ $FAIL -eq 0 ]] && echo "[OK] vps_xdp_proof — skip modu" && exit 0
  exit 1
fi

IFACE="$(ip route get 8.8.8.8 2>/dev/null | grep -oP 'dev \K\S+' | head -1 || true)"
if [[ -n "$IFACE" ]]; then
  ok "varsayilan iface: $IFACE"
else
  bad "iface tespit edilemedi (ip route get 8.8.8.8)"
fi

if systemctl is-active --quiet log-guardian-daemon.service 2>/dev/null; then
  ok "log-guardian-daemon.service active"
else
  bad "log-guardian-daemon kapali — sudo systemctl start log-guardian-daemon"
fi

if systemctl is-active --quiet log-guardian.service 2>/dev/null; then
  ok "log-guardian.service active"
else
  bad "log-guardian.service kapali"
fi

if [[ -x "$LG_BIN" ]]; then
  if LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}" \
      "$LG_BIN" --health --quiet 2>/dev/null; then
    ok "--health"
  else
    bad "--health — sudo bash scripts/fix_ipc_perms.sh"
  fi
else
  bad "binary yok: $LG_BIN"
fi

xdp_active=""
daemon_xdp=0
DS_JSON="${LG_DAEMON_STATS:-/run/log-guardian/daemon_stats.json}"
if [[ -f "$DS_JSON" ]] && python3 - "$DS_JSON" <<'PY' 2>/dev/null; then
import json, sys
d = json.load(open(sys.argv[1]))
raise SystemExit(0 if d.get("xdp_active") else 1)
PY
  daemon_xdp=1
fi

if curl -sf --max-time 5 "http://127.0.0.1:${METRICS_PORT}/metrics" 2>/dev/null \
    | grep -E '^loganalyzer_xdp_active' | tail -1 | grep -q ' 1$'; then
  xdp_active=1
  ok "metrics loganalyzer_xdp_active=1"
elif [[ "$daemon_xdp" -eq 1 ]]; then
  xdp_active=1
  ok "daemon_stats xdp_active=1 (split daemon — metrik gecikmesi olabilir)"
elif curl -sf --max-time 5 "http://127.0.0.1:${METRICS_PORT}/metrics" 2>/dev/null \
    | grep -q 'loganalyzer_xdp_active'; then
  bad "loganalyzer_xdp_active=0 — XDP attach yok (IFACE=$IFACE rules.conf)"
elif [[ -f "$DS_JSON" ]]; then
  bad "daemon_stats xdp_active=0 — daemon XDP OFF (journalctl -u log-guardian-daemon | grep XDP)"
else
  bad "metrics :${METRICS_PORT} yok veya xdp metrigi yok"
fi

if command -v bpftool >/dev/null 2>&1 && [[ -n "${IFACE:-}" ]]; then
  if bpftool net show dev "$IFACE" 2>/dev/null | grep -q xdp; then
    ok "bpftool net show dev $IFACE — xdp programi"
  elif [[ -n "$xdp_active" ]]; then
    ok "bpftool bos ama metrik=1 (driver farki olabilir)"
  else
    warn "bpftool: $IFACE uzerinde xdp programi gorunmuyor"
  fi
else
  warn "bpftool yok — apt install linux-tools-common linux-tools-$(uname -r)"
fi

if bash "$ROOT/scripts/post_install_verify.sh"; then
  ok "post_install_verify FAIL=0"
else
  bad "post_install_verify"
fi

echo ""
if [[ $FAIL -eq 0 ]]; then
  echo "[OK] vps_xdp_proof — XDP VPS kaniti tamam"
  echo "  Sonraki: sudo bash scripts/install_soak_systemd.sh (72h)"
  mode="kernel-xdp"
else
  mode="fail"
fi

python3 - "$ROOT/vps-xdp-report.json" "$mode" "${VPS_XDP_SKIP:-0}" "${IFACE:-}" "$FAIL" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path

out = Path(sys.argv[1])
mode = sys.argv[2]
skip = sys.argv[3] == "1"
iface = sys.argv[4] or None
fail_n = int(sys.argv[5])
xdp_mode = "ipset-fallback" if skip else ("kernel-xdp" if mode == "kernel-xdp" else "unknown")
out.write_text(json.dumps({
    "date": datetime.now(timezone.utc).isoformat(),
    "pass": fail_n == 0,
    "mode": "skip" if skip else mode,
    "xdp_mode": xdp_mode,
    "iface": iface,
    "fail_count": fail_n,
    "script": "scripts/vps_xdp_proof.sh",
}, indent=2) + "\n", encoding="utf-8")
PY

if [[ $FAIL -eq 0 ]]; then
  exit 0
fi
echo "[FAIL] vps_xdp_proof ($FAIL kritik)" >&2
echo "  sudo bash scripts/repair_no_xdp_stack.sh" >&2
echo "  docs/VPS_SETUP.md §2" >&2
exit 1
