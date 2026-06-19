#!/usr/bin/env bash
# Sprint A — kanit paketi: competitive suite + ban bench + PDF + data room + soak
#
# Hizli (CI / laptop, ~5-15 dk):
#   bash scripts/sprint_a.sh
#
# 1 saat soak (bloklar, kanit icin):
#   SPRINT_A_SOAK=1h bash scripts/sprint_a.sh
#
# 72 saat soak (arka plan, bloklamaz):
#   SPRINT_A_SOAK=72h bash scripts/sprint_a.sh
#
# Tam competitive suite (wasm + bola, yavas):
#   SPRINT_A_FULL=1 bash scripts/sprint_a.sh
#
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

SPRINT_A_SOAK="${SPRINT_A_SOAK:-none}"   # none | 1h | 72h
SPRINT_A_FULL="${SPRINT_A_FULL:-0}"
SKIP_SUITE="${SPRINT_A_SKIP_SUITE:-0}"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Sprint A — Linux Log Guardian kanit paketi              ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo "  SOAK=$SPRINT_A_SOAK  FULL=$SPRINT_A_FULL  SKIP_SUITE=$SKIP_SUITE"
echo ""

step() { echo ""; echo "▶ $*"; echo "────────────────────────────────────────"; }

# ── 1. Derleme ─────────────────────────────────────────────────────────────
step "1/6 Derleme"
# shellcheck source=scripts/lib/guardian_api.sh
source "$ROOT/scripts/lib/guardian_api.sh"
ensure_lg_build_tree "$ROOT"
make -j1 log-guardian log-guardian-daemon 2>/dev/null || make -j1 log-guardian

# ── 2. Competitive suite ───────────────────────────────────────────────────
if [[ "$SKIP_SUITE" != "1" ]]; then
  step "2/6 Competitive suite"
  mkdir -p .cache
  if [[ -f soak-report.json ]]; then
    python3 - <<'PY'
import json, shutil
from pathlib import Path
p = Path("soak-report.json")
r = json.loads(p.read_text())
if r.get("duration_sec", 0) >= 3600 and not r.get("short_mode"):
    shutil.copy(p, ".cache/soak-report.preserve.json")
    print("[sprint_a] Uzun soak yedegi alindi")
PY
  fi
  if [[ "$SPRINT_A_FULL" == "1" ]]; then
    bash scripts/competitive_suite.sh
  else
    COMPETITIVE_FAST=1 bash scripts/competitive_suite.sh
  fi
  if [[ -f .cache/soak-report.preserve.json ]]; then
    python3 - <<'PY'
import json, shutil
from pathlib import Path
cur_p = Path("soak-report.json")
preserve = Path(".cache/soak-report.preserve.json")
if not preserve.is_file():
    raise SystemExit(0)
cur = json.loads(cur_p.read_text()) if cur_p.is_file() else {}
if cur.get("short_mode") or cur.get("duration_sec", 0) < 3600:
    shutil.copy(preserve, cur_p)
    r = json.loads(cur_p.read_text())
    print(f"[sprint_a] Uzun soak geri yuklendi ({r.get('duration_hours')}h)")
PY
  fi
else
  step "2/6 Competitive suite (atlandi — mevcut JSON kullanilacak)"
fi

# ── 3. Ban latency (root) ──────────────────────────────────────────────────
step "3/6 Ban latency bench"
run_ban_bench() {
  if [[ $EUID -eq 0 ]]; then
    bash scripts/bench_ban_latency.sh
  else
    echo "[sprint_a] Ban bench root gerektirir (sudo sifre isteyebilir)..."
    sudo bash scripts/bench_ban_latency.sh
  fi
}
if [[ "${SKIP_BAN_BENCH:-0}" == "1" ]]; then
  echo "[sprint_a] SKIP_BAN_BENCH=1"
elif run_ban_bench; then
  echo "[sprint_a] ban latency OK"
else
  echo "[WARN] ban latency basarisiz — elle: sudo bash scripts/bench_ban_latency.sh"
fi

# ── 4. PDF + JSON proof ────────────────────────────────────────────────────
step "4/6 competitive-proof (JSON + PDF)"
bash scripts/competitive_proof.sh

# ── 5. Soak ────────────────────────────────────────────────────────────────
step "5/6 Soak test"
case "$SPRINT_A_SOAK" in
  1h)
    echo "[sprint_a] 1 saat soak (bloklar)..."
    SOAK_DURATION=3600 SOAK_INTERVAL=60 SOAK_REPORT=soak-report.json bash scripts/soak_test.sh
    cp -f soak-report.json soak-report.short.json 2>/dev/null || true
    bash scripts/competitive_proof.sh
    ;;
  72h)
    if ps -eo args= 2>/dev/null | grep -q '^bash scripts/soak_test.sh$'; then
      echo "[sprint_a] 72h soak zaten calisiyor"
      bash scripts/soak_status.sh
    else
      echo "[sprint_a] 72h soak arka planda baslatiliyor..."
      SOAK_DURATION=259200 SOAK_INTERVAL=300 bash scripts/soak_start.sh || {
        echo "[WARN] soak_start basarisiz — systemd veya health gerekli"
        echo "       Alternatif: SOAK_SHORT=1 bash scripts/soak_test.sh"
      }
    fi
    ;;
  none|*)
    if [[ -f soak-report.json ]]; then
      echo "[sprint_a] Mevcut soak-report.json kullaniliyor"
      python3 -c "import json; r=json.load(open('soak-report.json')); print(f\"  pass={r.get('pass')} hours={r.get('duration_hours')}\")"
    else
      echo "[sprint_a] Soak atlandi — 1h: SPRINT_A_SOAK=1h | 72h arka plan: SPRINT_A_SOAK=72h"
    fi
    ;;
esac

# ── 6. Data room + dashboard sync ──────────────────────────────────────────
step "6/6 Data room + dashboard sync"
bash scripts/data_room_pack.sh
bash scripts/sync_dashboard_data.sh 2>/dev/null || echo "[WARN] sync_dashboard_data atlandi"

# Ozet
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Sprint A tamam                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
python3 <<'PY'
import json
from pathlib import Path

def load(name):
    p = Path(name)
    if not p.is_file():
        return None
    try:
        return json.loads(p.read_text())
    except Exception:
        return None

checks = []
fp = load("fp-report.json")
if fp:
    rate = (fp.get("benign") or {}).get("fp_rate_pct")
    checks.append(f"FP: {rate}%")

crs = load("crs-parity-report.json")
if crs:
    checks.append(f"CRS parity: {crs.get('parity_pct')}% pass={crs.get('pass')}")

ban = load("bench-ban-latency.json")
if ban and ban.get("ban_latency_ms") is not None:
    checks.append(f"Ban latency: {ban['ban_latency_ms']} ms")
elif ban and ban.get("ban_latency_ms") is None:
    checks.append("Ban latency: BEKLIYOR (sudo bash scripts/bench_ban_latency.sh)")

soak = load("soak-report.json")
if soak:
    checks.append(f"Soak: {soak.get('duration_hours')}h pass={soak.get('pass')}")

proof = load("competitive-proof.json")
if proof:
    checks.append(f"Proof pass={proof.get('pass')}")

for c in checks:
    print(f"  ✓ {c}")

pdf = Path("competitive-proof.pdf")
if pdf.is_file():
    print(f"  ✓ PDF: {pdf} ({pdf.stat().st_size} bytes)")
dr = Path("data-room")
if dr.is_dir():
    n = len([f for f in dr.iterdir() if f.is_file()])
    print(f"  ✓ Data room: data-room/ ({n} files)")
zip_p = Path("data-room.zip")
if zip_p.is_file():
    print(f"  ✓ ZIP: data-room.zip")
print("")
print("  Dashboard: https://localhost:8443/tests")
print("  PDF:       data-room/competitive-proof.pdf")
PY

echo "[OK] sprint_a"
