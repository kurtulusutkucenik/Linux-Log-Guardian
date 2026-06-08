#!/usr/bin/env bash
# Takili kalan tester / saldiri scriptlerini temizle
# Not: Cursor agent sandbox (AppArmor cursor_sandbox) altindaki process'lere
# normal/sudo kill yetmez — asagidaki "sandbox" adimlarina bakin.
set -euo pipefail

MITIGATE_NGINX="${STOP_TRAFFIC_MITIGATE:-0}"

sandbox_pids() {
  local pid prof
  for pid in "$@"; do
    [[ -r "/proc/$pid/attr/apparmor/current" ]] || continue
    prof=$(cat "/proc/$pid/attr/apparmor/current" 2>/dev/null || true)
    [[ "$prof" == *cursor_sandbox* ]] && echo "$pid"
  done
}

list_tester_pids() {
  pgrep -f './tester --mode' 2>/dev/null || true
}

kill_pids() {
  local sig=$1
  shift
  local pid
  for pid in "$@"; do
    kill "-$sig" "$pid" 2>/dev/null || true
  done
}

mitigate_nginx() {
  command -v systemctl >/dev/null 2>&1 || return 0
  if systemctl is-active nginx &>/dev/null; then
    echo "[mitigate] nginx durduruluyor (tester log uretmesin)..."
    sudo systemctl stop nginx
    echo "[mitigate] nginx stopped — temizlik sonrasi: sudo systemctl start nginx"
  fi
}

print_sandbox_help() {
  local pids=("$@")
  echo ""
  echo "[WARN] Cursor sandbox (AppArmor cursor_sandbox) — kill/pkill/sudo kill YETMEZ"
  echo "  PIDs: ${pids[*]}"
  echo ""
  echo "  Cozum A (en kolay): Cursor IDE'yi kapat/ac"
  echo ""
  echo "  Cozum B (AppArmor — sifre gerekir):"
  if command -v aa-complain >/dev/null 2>&1; then
    echo "    sudo aa-complain cursor_sandbox"
    echo "    sudo kill -9 ${pids[*]}"
    echo "    sudo aa-enforce cursor_sandbox"
  fi
  if [[ -f /etc/apparmor.d/cursor-sandbox ]]; then
    echo "    # aa-complain yetmezse (Brave profil hatasi vb.):"
    echo "    sudo apparmor_parser -R /etc/apparmor.d/cursor-sandbox"
    echo "    sudo kill -9 ${pids[*]}"
    echo "    sudo apparmor_parser -r /etc/apparmor.d/cursor-sandbox"
  fi
  echo ""
  echo "  Cozum C (metrikleri hemen durdur, tester arka planda kalabilir):"
  echo "    STOP_TRAFFIC_MITIGATE=1 bash scripts/stop_traffic.sh"
  echo "    # veya: sudo systemctl stop nginx"
}

echo "=== stop_traffic ==="
mapfile -t PIDS < <(list_tester_pids)
BEFORE=${#PIDS[@]}

if [[ ${#PIDS[@]} -gt 0 ]]; then
  kill_pids TERM "${PIDS[@]}"
  sleep 1
  kill_pids KILL "${PIDS[@]}"
fi
pkill -TERM -f './tester --mode' 2>/dev/null || true
sleep 1
pkill -KILL -f './tester --mode' 2>/dev/null || true
pkill -f 'nginx_attack_test.sh' 2>/dev/null || true
pkill -f 'metrics_demo.sh' 2>/dev/null || true

mapfile -t LEFT < <(list_tester_pids)
AFTER=${#LEFT[@]}
echo "tester: ${BEFORE} -> ${AFTER}"

if [[ "$AFTER" -eq 0 ]]; then
  echo "[OK] traffic durduruldu"
  exit 0
fi

mapfile -t SANDBOX < <(sandbox_pids "${LEFT[@]}")
if [[ ${#SANDBOX[@]} -gt 0 ]]; then
  if [[ "$MITIGATE_NGINX" == "1" ]]; then
    mitigate_nginx
    echo "[OK] nginx durduruldu — Grafana EPS duser (orphan tester kalabilir)"
    print_sandbox_help "${LEFT[@]}"
    exit 0
  fi
  print_sandbox_help "${LEFT[@]}"
  exit 1
fi

echo "[WARN] hala tester var (sandbox disi):"
pgrep -af './tester' || true
echo "  sudo kill -9 ${LEFT[*]}"
exit 1
