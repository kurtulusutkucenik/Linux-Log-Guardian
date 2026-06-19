#!/usr/bin/env bash
# Eski website onizleme sunucularini kapat (8765/8767)
set -euo pipefail

ports=(8765 8767)
found=0

sandbox_pids=()

for port in "${ports[@]}"; do
  mapfile -t pids < <(fuser "${port}/tcp" 2>/dev/null | tr ' ' '\n' | sort -u)
  for pid in "${pids[@]}"; do
    [[ -z "$pid" || ! "$pid" =~ ^[0-9]+$ ]] && continue
    found=1
    owner="$(ps -o user= -p "$pid" 2>/dev/null | xargs || true)"
    cmd="$(ps -o cmd= -p "$pid" 2>/dev/null | xargs || true)"
    aa="$(cat "/proc/${pid}/attr/current" 2>/dev/null || true)"
    echo "[website_kill_ports] port ${port} pid ${pid} (${owner:-?})"
    echo "  cmd: ${cmd}"
    if [[ "$aa" == *cursor_sandbox* ]]; then
      sandbox_pids+=("$pid")
      echo "  [INFO] Cursor agent sandbox (AppArmor) — normal kill calismaz"
      continue
    fi
    if kill "$pid" 2>/dev/null; then
      echo "  [OK] durduruldu"
    elif kill -9 "$pid" 2>/dev/null; then
      echo "  [OK] durduruldu (SIGKILL)"
    elif [[ "${owner:-}" == "root" ]]; then
      echo "  [WARN] root process — interaktif terminalde:"
      echo "    sudo kill -9 ${pid}"
    else
      echo "  [FAIL] kill reddedildi (pid ${pid})"
    fi
  done
done

if [[ ${#sandbox_pids[@]} -gt 0 ]]; then
  echo ""
  echo "[website_kill_ports] Cursor sandbox sureci (${sandbox_pids[*]})"
  echo "  Bu process Cursor agent tarafindan baslatildi; dis terminalden kill engellenir."
  echo "  Zararsiz (yalnizca 127.0.0.1). Preview :8765, smoke dinamik port kullanir."
  echo "  Kapatmak icin: Cursor IDE yeniden baslat veya bu oturumu kapat."
  echo "  Yoksayabilirsin — site calismasini etkilemez."
fi

if [[ $found -eq 0 ]]; then
  echo "[OK] website_kill_ports — ${ports[*]} bos"
fi
