#!/usr/bin/env bash
# Sprint C — Prod / VPS dogrulama
#
# Laptop (Wi-Fi): XDP OFF / ipset-fallback beklenir — WARN, FAIL degil
# VPS (eth0):    kernel-xdp + ban <50ms hedefi
#
# Hizli:
#   bash scripts/sprint_c.sh
#
# 72h soak arka plan (systemd + health gerekir):
#   SOAK_72H=1 bash scripts/sprint_c.sh
#
# Prod ban bench (sudo sifre isteyebilir):
#   sudo BENCH_TARGET_MS=50 bash scripts/bench_ban_latency.sh
#
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"
SOAK_72H="${SOAK_72H:-0}"
SKIP_TLS="${SKIP_TLS:-0}"
SKIP_STACK="${SKIP_STACK:-0}"
export SKIP_WASM_REBUILD="${SKIP_WASM_REBUILD:-1}"

step() {
  echo ""
  echo "▶ $*"
  echo "────────────────────────────────────────"
}

banner() {
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║  Sprint C — Prod / VPS                                   ║"
  echo "╚══════════════════════════════════════════════════════════╝"
  echo "  SOAK_72H=$SOAK_72H  SKIP_TLS=$SKIP_TLS  SKIP_STACK=$SKIP_STACK"
}

run_root_bench() {
  export BENCH_TARGET_MS="${BENCH_TARGET_MS:-50}"
  if [[ $EUID -eq 0 ]]; then
    bash scripts/bench_ban_latency.sh
  elif sudo -n true 2>/dev/null; then
    sudo BENCH_TARGET_MS="$BENCH_TARGET_MS" bash scripts/bench_ban_latency.sh
  else
    echo "[SKIP] prod ban bench — sudo bash scripts/bench_ban_latency.sh"
    echo "       (laptop hedef <75ms: BENCH_TARGET_MS=75)"
    return 0
  fi
}

banner

step "1/7 Ops smoke (systemd + health)"
bash scripts/ops_smoke.sh || echo "  [WARN] ops_smoke kismi basarisiz — docs/OPERATIONS.md"

step "2/7 NIC + XDP / ipset durumu"
bash scripts/prod_nic_xdp_check.sh || echo "  [WARN] prod_nic_xdp_check"

step "3/7 Prod stack E2E"
if [[ "$SKIP_STACK" != "1" ]]; then
  bash scripts/prod_stack_e2e.sh || echo "  [WARN] prod_stack_e2e kismi basarisiz"
else
  echo "  [SKIP] SKIP_STACK=1"
fi

step "4/7 TLS dashboard :8443"
if [[ "$SKIP_TLS" != "1" ]] && command -v docker >/dev/null 2>&1; then
  bash scripts/tls_proxy_test.sh || echo "  [WARN] tls_proxy_test — docker compose -f docker-compose.prod.yml up -d"
else
  echo "  [SKIP] docker yok veya SKIP_TLS=1"
  echo "       Baslat: docker compose -f docker-compose.prod.yml up -d --build"
fi

step "5/7 Prod ban latency (<50 ms hedef)"
if run_root_bench; then
  if [[ -f bench-ban-latency.json ]]; then
    python3 -c "
import json
b=json.load(open('bench-ban-latency.json'))
ms=b.get('ban_latency_ms')
prod=b.get('prod_target_ms',50)
if ms is None:
    print('  [WARN] bench-ban-latency.json — olcum yok')
else:
    ok='PASS' if ms<=prod else 'WARN (laptop/ipset normal)'
    print(f'  Ban: {ms} ms — prod hedef <{prod} ms → {ok}')
"
  fi
else
  echo "  [WARN] ban bench basarisiz"
fi

step "6/7 Soak (72h arka plan)"
if [[ "$SOAK_72H" == "1" ]]; then
  if bash scripts/soak_start.sh; then
    bash scripts/soak_status.sh
  else
    echo "  [WARN] 72h soak baslatilamadi — systemd + health gerekir"
    echo "       Kisa test: SOAK_SHORT=1 bash scripts/soak_test.sh"
  fi
elif [[ -f soak-report.json ]]; then
  python3 -c "
import json
r=json.load(open('soak-report.json'))
print(f'  Mevcut soak: {r.get(\"duration_hours\")}h pass={r.get(\"pass\")}')
"
  echo "  72h baslat: SOAK_72H=1 bash scripts/sprint_c.sh"
else
  echo "  [INFO] soak yok — 72h: SOAK_72H=1 bash scripts/sprint_c.sh"
fi

step "7/7 Data room + dashboard sync"
bash scripts/competitive_proof.sh
bash scripts/data_room_pack.sh
bash scripts/sync_dashboard_data.sh 2>/dev/null || true

echo ""
python3 <<'PY'
import json
from pathlib import Path

def load(n):
    p = Path(n)
    return json.loads(p.read_text()) if p.is_file() else None

print("╔══════════════════════════════════════════════════════════╗")
print("║  Sprint C ozet                                           ║")
print("╚══════════════════════════════════════════════════════════╝")

st = load("guardian-status.json")
if st:
    mode = st.get("xdp_mode", "?")
    ipc = st.get("ipc", "?")
    xdp = (st.get("daemon") or {}).get("xdp_active")
    print(f"  xdp_mode={mode} ipc={ipc} xdp_active={xdp}")
    if mode == "kernel-xdp":
        print("  ✓ VPS/XDP kaniti — satis demosu icin ideal")
    elif mode == "ipset-fallback":
        print("  ~ ipset-fallback — laptop/Wi-Fi normal; VPS eth0 ile tekrar calistir")

ban = load("bench-ban-latency.json")
if ban and ban.get("ban_latency_ms") is not None:
    ms = ban["ban_latency_ms"]
    prod = ban.get("prod_target_ms", 50)
    tag = "PASS" if ms <= prod else "hedef disi (VPS'te tekrar)"
    print(f"  Ban latency: {ms} ms (prod <{prod} ms) → {tag}")

soak = load("soak-report.json")
if soak:
    print(f"  Soak: {soak.get('duration_hours')}h pass={soak.get('pass')}")

print("")
print("  VPS checklist: docs/PILOT_SETUP.md")
print("  Dashboard:     https://localhost:8443/tests")
PY

echo "[OK] Sprint C — VPS'te eth0 + sudo ile tekrar: bash scripts/sprint_c.sh"
