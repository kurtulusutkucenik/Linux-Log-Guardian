#!/usr/bin/env bash
# Pro Plus K8s vitrinini kapatir — Pro stack (dashboard) ayakta kalir
#   bash scripts/pro_plus_down.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

CLUSTER="${K8S_KIND_CLUSTER:-lg}"

echo "=== pro_plus_down ==="

if command -v kind >/dev/null 2>&1 && kind get clusters 2>/dev/null | grep -qx "$CLUSTER"; then
  echo "[pro_plus_down] kind delete cluster --name $CLUSTER"
  kind delete cluster --name "$CLUSTER"
  ok=1
else
  echo "[pro_plus_down] kind cluster '$CLUSTER' yok — atlaniyor"
  ok=0
fi

if docker ps -a --format '{{.Names}}' 2>/dev/null | grep -qx "${CLUSTER}-control-plane"; then
  echo "[pro_plus_down] docker rm -f ${CLUSTER}-control-plane"
  docker rm -f "${CLUSTER}-control-plane" 2>/dev/null || true
  ok=1
fi

echo ""
if [[ "$ok" == "1" ]]; then
  echo "[OK] pro_plus_down — K8s vitrin kapali (~1.2 GB RAM geri)"
else
  echo "[OK] pro_plus_down — zaten kapali"
fi
echo "  Pro stack hala acik: docker ps | grep log-guardian"
echo "  Tier Pro: LOG_GUARDIAN_TIER=pro bash scripts/tls_proxy_up.sh"
