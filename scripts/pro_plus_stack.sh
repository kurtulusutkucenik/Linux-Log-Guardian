#!/usr/bin/env bash
# Pro Plus = Pro stack (dashboard/Grafana/TLS) + K8s kind/Helm kaniti
#   bash scripts/pro_plus_stack.sh
# Tam canli pod install (agir):
#   K8S_KIND_BUILD=1 K8S_KIND_APPLY=1 bash scripts/pro_plus_stack.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export LOG_GUARDIAN_TIER="${LOG_GUARDIAN_TIER:-pro_plus}"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"
export K8S_KIND_CREATE="${K8S_KIND_CREATE:-1}"
export K8S_KIND_CLUSTER="${K8S_KIND_CLUSTER:-lg}"

echo "=== pro_plus_stack (LOG_GUARDIAN_TIER=$LOG_GUARDIAN_TIER) ==="

echo "[pro_plus_stack] Pro katmani (dashboard + Grafana + TLS)..."
bash "$ROOT/scripts/dashboard_stack.sh"

echo "[pro_plus_stack] Pro Plus katmani (kind + helm)..."
if ! bash "$ROOT/scripts/k8s_kind_e2e.sh"; then
  echo "[pro_plus_stack] UYARI: k8s_kind_e2e tamamlanamadi — kind/helm/kubectl kontrol edin" >&2
  echo "  CLI: bash scripts/install_k8s_cli.sh" >&2
  echo "  Manuel: K8S_KIND_CREATE=1 bash scripts/k8s_kind_e2e.sh" >&2
fi

bash "$ROOT/scripts/pro_plus_status.sh" || true

echo ""
echo "[OK] pro_plus_stack"
echo "  Tier:       Pro Plus (Core + Pro SOC + K8s vitrin)"
echo "  Dashboard:  https://${DOMAIN:-localhost}:${HTTPS_PORT:-8443}/"
echo "  Tier API:   curl -sk https://${DOMAIN:-localhost}:${HTTPS_PORT:-8443}/api/tier | jq ."
echo "  K8s kapat:  bash scripts/pro_plus_down.sh"
echo "  Pro'ya don: LOG_GUARDIAN_TIER=pro bash scripts/tls_proxy_up.sh"
