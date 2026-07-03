#!/usr/bin/env bash
# Opsiyonel laptop polish — fleet temizligi, site parity, dashboard sync
#   bash scripts/optional_polish_refresh.sh
#   bash scripts/optional_polish_refresh.sh --fp-trust   # warmup -> prod (sudo yalniz FP adiminda)
#   SKIP_WEBSITE=1 bash scripts/optional_polish_refresh.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

FP_TRUST="${FP_TRUST:-0}"
for arg in "$@"; do
  case "$arg" in
    --fp-trust) FP_TRUST=1 ;;
  esac
done

echo "=== optional_polish_refresh ==="

echo "[1/5] Fleet stale prune (STALE_HOURS=${STALE_HOURS:-1})"
STALE_HOURS="${STALE_HOURS:-1}" bash "$ROOT/scripts/fleet_prune_stale.sh" \
  || echo "[WARN] fleet_prune_stale atlandi"

echo "[2/5] Fleet pending komut temizligi"
bash "$ROOT/scripts/fleet_prune_pending_commands.sh" \
  || echo "[WARN] fleet_prune_pending_commands atlandi (dashboard container?)"

if [[ "$FP_TRUST" == "1" ]]; then
  echo "[3/5] FP trust prod kurulumu"
  fp_src=""
  best_n=0
  for c in "$ROOT/data/fp-trust.lst" "$ROOT/data/fp-trust-warmup.lst"; do
    [[ -f "$c" ]] || continue
    n=$(wc -l <"$c" | tr -d ' ')
    if [[ "$n" -gt "$best_n" ]]; then
      fp_src="$c"
      best_n="$n"
    fi
  done
  if [[ -n "$fp_src" ]]; then
    echo "[optional_polish] log-guardian durduruluyor (bos havuz diske yazmasin)..."
    sudo systemctl stop log-guardian 2>/dev/null || true
    sudo bash "$ROOT/scripts/install_fp_trust_prod.sh" "$fp_src"
    echo "[optional_polish] log-guardian baslatiliyor..."
    sudo systemctl start log-guardian
    sleep 1
    dest="/etc/log-guardian/data/fp-trust.lst"
    lines=$(sudo wc -l <"$dest" 2>/dev/null | tr -d ' ' || echo 0)
    echo "[OK] FP trust prod — $dest ($lines satir)"
  else
    echo "[WARN] fp-trust store yok — once: bash scripts/fp_learn_warmup.sh"
  fi
else
  echo "[3/5] FP trust atlandi (--fp-trust ile acilir)"
fi

if [[ "${SKIP_WEBSITE:-0}" != "1" ]]; then
  echo "[4/5] Kanit JSON + landing test parity"
  python3 "$ROOT/scripts/competitive_proof_build.py" -o "$ROOT/competitive-proof.json"
  bash "$ROOT/scripts/website_preview_gate.sh" >/dev/null 2>&1 || echo "[WARN] website_preview_gate — landing parity"
else
  echo "[4/5] Site sync atlandi (SKIP_WEBSITE=1)"
  python3 "$ROOT/scripts/competitive_proof_build.py" -o "$ROOT/competitive-proof.json"
fi

echo "[5/5] Dashboard data sync"
bash "$ROOT/scripts/sync_dashboard_data.sh" 2>/dev/null \
  || echo "[WARN] sync_dashboard_data — docker stack ayakta mi?"

n="$(python3 -c "import json; d=json.load(open('competitive-proof.json')); t=d['validationTests']; p=sum(1 for x in t if x.get('status')=='pass'); print(f'{p}/{len(t)} pass')" 2>/dev/null || echo "?")"
echo ""
echo "[OK] optional_polish_refresh tamam — validationTests $n"
echo "  Dashboard: https://localhost:8443/tests  (Ctrl+Shift+R)"
echo "  UI kodu degistiyse: bash scripts/dashboard_refresh.sh"
