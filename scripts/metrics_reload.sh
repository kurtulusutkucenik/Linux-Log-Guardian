#!/usr/bin/env bash
# Yeni SOC metrikleri — derle, /usr/local'a kur, servisleri yeniden baslat
#   bash scripts/metrics_reload.sh
#   SKIP_INSTALL=1 bash scripts/metrics_reload.sh   # sadece restart (binary zaten kurulu)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail() { echo "[metrics_reload] FAIL: $*" >&2; exit 1; }

echo "=== metrics_reload ==="

if [[ "${SKIP_INSTALL:-0}" != "1" ]]; then
  echo "── [1/3] Derleme"
  make -j"$(nproc 2>/dev/null || echo 2)" log-guardian log-guardian-daemon 2>/dev/null || make -j"$(nproc 2>/dev/null || echo 2)"

  echo "── [2/3] Kurulum (/usr/local/bin — systemd bu yolu kullanir)"
  if [[ "$(id -u)" -eq 0 ]]; then
    make install
  else
    sudo make install
  fi
else
  echo "[SKIP] make install — SKIP_INSTALL=1"
fi

echo "── [3/3] Servisler"
if command -v systemctl >/dev/null 2>&1; then
  if [[ "$(id -u)" -eq 0 ]]; then
    systemctl restart log-guardian-daemon log-guardian 2>/dev/null || systemctl restart log-guardian 2>/dev/null || true
  else
    sudo systemctl restart log-guardian-daemon log-guardian 2>/dev/null || sudo systemctl restart log-guardian 2>/dev/null || true
  fi
  sleep 2
else
  echo "[WARN] systemctl yok — ./log-guardian ile manuel calistirin"
fi

bash "$ROOT/scripts/grafana_metrics_smoke.sh"

echo "[OK] metrics_reload tamam"
echo ""
echo "Grafana (opsiyonel): bash scripts/grafana_stack.sh  → http://127.0.0.1:3002"
echo "  Not: docker-compose.prod.yml icinde grafana servisi yok"
