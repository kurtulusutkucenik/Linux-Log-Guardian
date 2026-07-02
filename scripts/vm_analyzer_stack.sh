#!/usr/bin/env bash
# VM: log-guardian analyzer + :9091 metrik (fleet push icin METRICS_URL)
#   sudo bash scripts/vm_analyzer_stack.sh
set -euo pipefail
[[ "$(id -u)" -eq 0 ]] || { echo "[vm_analyzer_stack] sudo gerekli" >&2; exit 1; }

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PREFIX="${LG_PREFIX:-/usr/local}"

if [[ -x "$ROOT/scripts/vm_install_runtime_deps.sh" ]]; then
  bash "$ROOT/scripts/vm_install_runtime_deps.sh"
fi

if [[ ! -x "$PREFIX/bin/log-guardian" ]]; then
  echo "[vm_analyzer_stack] WARN: $PREFIX/bin/log-guardian yok — once vm_build_binary veya vm_install_deb" >&2
  exit 0
fi

for svc in log-guardian-daemon log-guardian; do
  if systemctl list-unit-files "$svc.service" 2>/dev/null | grep -q "$svc.service"; then
    systemctl enable "$svc.service" 2>/dev/null || true
    if ! systemctl is-active --quiet "$svc.service" 2>/dev/null; then
      systemctl start "$svc.service" 2>/dev/null || true
    fi
  fi
done

sleep 2
if curl -sf --max-time 3 http://127.0.0.1:9091/metrics | grep -q loganalyzer_lines_total; then
  echo "[OK] vm_analyzer_stack — metrics :9091"
else
  echo "[WARN] vm_analyzer_stack — :9091 henuz hazir (nginx log / servis?)" >&2
fi
