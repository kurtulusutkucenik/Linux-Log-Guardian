#!/usr/bin/env bash
# Laptop 72 saat soak — VPS yok, sunucu mantigi testi
#   bash scripts/laptop_soak_72h.sh          # on kontrol + komutlar
#   bash scripts/laptop_soak_72h.sh --start  # arka planda baslat (nohup)
#   SOAK_1H=1 bash scripts/laptop_soak_72h.sh --start   # once 1 saat dene
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

LOG="${SOAK_LOG:-$ROOT/soak-72h.log}"
PIDFILE="${SOAK_PIDFILE:-$ROOT/.cache/soak-72h.pid}"
mkdir -p "$(dirname "$PIDFILE")"

preflight() {
  local ok=1
  echo "=== laptop_soak preflight ==="
  systemctl is-active log-guardian >/dev/null 2>&1 \
    && echo "[OK] log-guardian active" || { echo "[FAIL] log-guardian inactive"; ok=0; }
  systemctl is-active log-guardian-daemon >/dev/null 2>&1 \
    && echo "[OK] log-guardian-daemon active" || echo "[WARN] daemon inactive (XDP kapali olabilir)"
  curl -sf --max-time 3 http://127.0.0.1:9091/metrics >/dev/null 2>&1 \
    && echo "[OK] metrics :9091" || { echo "[FAIL] metrics yok"; ok=0; }

  # Arka plan soak: sudo'suz health
  local health_bin=/usr/local/bin/log-guardian
  local health_ok=0
  if [[ -x "$health_bin" ]] && "$health_bin" --health --db /etc/log-guardian/events.db >/dev/null 2>&1; then
    health_ok=1
  elif getent group log-guardian >/dev/null 2>&1 \
      && sg log-guardian -c "exec $health_bin --health --db /etc/log-guardian/events.db" >/dev/null 2>&1; then
    health_ok=1
  elif sudo -n "$health_bin" --health --db /etc/log-guardian/events.db >/dev/null 2>&1; then
    health_ok=1
  fi
  if [[ "$health_ok" -eq 1 ]]; then
    echo "[OK] --health (sudo'suz)"
  else
    echo "[FAIL] --health sudo'suz calismiyor" >&2
    echo "  sudo bash scripts/fix_ipc_perms.sh" >&2
    echo "  sudo usermod -aG log-guardian \$USER   # yeni shell" >&2
    ok=0
  fi

  if [[ "$ok" -eq 0 ]]; then
    echo "[FAIL] once: sudo systemctl start log-guardian log-guardian-daemon" >&2
    exit 1
  fi
  echo ""
  echo "Laptop ipuclari:"
  echo "  - Guc/plan: uyku KAPALI (Settings > Power)"
  echo "  - Wi-Fi sabit veya kablo"
  echo "  - disk boslugu: df -h /"
  echo "  - rapor: soak-report.json"
}

if [[ "${1:-}" != "--start" ]]; then
  preflight
  echo ""
  echo "[OK] On kontrol tamam — mevcut 72h raporu icin:"
  echo "  bash scripts/soak_recompute_report.sh"
  echo ""
  echo "Yeni soak baslatmak icin (genelde gerekmez):"
  echo "  bash scripts/laptop_soak_72h.sh --start"
  echo ""
  echo "Once 1 saat deneme:"
  echo "  SOAK_1H=1 bash scripts/laptop_soak_72h.sh --start"
  echo ""
  echo "Izleme:"
  echo "  tail -f $LOG"
  echo "  cat soak-report.json | python3 -m json.tool | tail -30"
  exit 0
fi

preflight

if [[ -f "$PIDFILE" ]] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
  pid=$(cat "$PIDFILE")
  elapsed=$(ps -p "$pid" -o etime= 2>/dev/null | tr -d ' ' || echo "?")
  echo "[OK] soak zaten calisiyor — pid=$pid elapsed=$elapsed"
  echo "  Izleme: tail -f $LOG"
  echo "  Durum:  bash scripts/soak_status.sh"
  exit 0
fi

DUR="72 saat"
[[ "${SOAK_1H:-0}" == "1" ]] && DUR="1 saat"

if [[ "${SOAK_1H:-0}" == "1" ]]; then
  echo "[laptop_soak] *** 1 SAAT (SOAK_1H=1) — 72 saat DEGIL; VPS'te 72h ayri ***"
else
  echo "[laptop_soak] *** 72 SAAT — laptop'ta once SOAK_1H=1 onerilir ***"
fi
echo "[laptop_soak] $DUR basliyor — log: $LOG"
LABEL="72h"
[[ "${SOAK_1H:-0}" == "1" ]] && LABEL="1h"
nohup env SOAK_1H="${SOAK_1H:-0}" SOAK_BACKGROUND=1 SOAK_PIDFILE="$PIDFILE" \
  SOAK_GRACE_SEC="${SOAK_GRACE_SEC:-120}" \
  bash "$ROOT/scripts/soak_test.sh" >>"$LOG" 2>&1 &
echo $! >"$PIDFILE"
bash "$ROOT/scripts/soak_active_lock.sh" write "$(cat "$PIDFILE")" "$LABEL"
echo "[OK] pid=$(cat "$PIDFILE") — tail -f $LOG"
echo "[OK] soak kilidi aktif — upgrade/restart YAPMAYIN (bash scripts/soak_status.sh)"
