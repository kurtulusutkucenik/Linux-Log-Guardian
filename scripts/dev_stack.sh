#!/usr/bin/env bash
# Laptop yerel stack — health + opsiyonel Grafana (soak'a dokunmaz)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

WITH_GRAFANA=0
WITH_DASHBOARD=0
for arg in "$@"; do
  case "$arg" in
    --grafana) WITH_GRAFANA=1 ;;
    --dashboard) WITH_DASHBOARD=1 ;;
    --all) WITH_GRAFANA=1; WITH_DASHBOARD=1 ;;
    -h|--help)
      cat <<EOF
Kullanim: bash scripts/dev_stack.sh [--grafana] [--dashboard] [--all]

  (varsayilan) health + ops_smoke
  --grafana    Grafana + Prometheus + provision
  --dashboard  TLS dashboard (tls_proxy_up)
  --all        hepsi

Not: Calisan soak testine dokunulmaz.
EOF
      exit 0
      ;;
  esac
done

echo "=== dev_stack ==="
bash "$ROOT/scripts/ops_smoke.sh"

if [[ "$WITH_DASHBOARD" -eq 1 ]]; then
  export JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32)}"
  bash "$ROOT/scripts/tls_proxy_up.sh"
  bash "$ROOT/scripts/tls_proxy_test.sh"
fi

if [[ "$WITH_GRAFANA" -eq 1 ]]; then
  bash "$ROOT/scripts/grafana_stack.sh"
  bash "$ROOT/scripts/grafana_smoke_test.sh"
  echo "  Ornek metrik: bash scripts/metrics_demo.sh"
fi

echo "[OK] dev_stack"
