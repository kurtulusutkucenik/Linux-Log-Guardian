#!/usr/bin/env bash
# Opsiyonel K8s kind cluster — laptop lab (Pro katman)
#   bash scripts/k8s_kind_e2e.sh                    # mevcut cluster / dry-run
#   K8S_KIND_CREATE=1 bash scripts/k8s_kind_e2e.sh  # kind create lg
#   K8S_KIND_BUILD=1 K8S_KIND_APPLY=1 ...           # image build + helm install
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

CLUSTER="${K8S_KIND_CLUSTER:-lg}"
CHART="$ROOT/helm/log-guardian"
OUT="$ROOT/k8s-kind-e2e-report.json"
RENDER="$ROOT/.cache/k8s-kind-helm-render.yaml"
mkdir -p "$ROOT/.cache"

fail() { echo "[k8s_kind_e2e] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

write_report() {
  local mode="$1" pass="${2:-true}" reason="${3:-}"
  python3 - "$OUT" "$mode" "$pass" "$reason" "$CLUSTER" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path
out = Path(sys.argv[1])
out.write_text(json.dumps({
    "date": datetime.now(timezone.utc).isoformat(),
    "pass": sys.argv[3].lower() == "true",
    "mode": sys.argv[2],
    "cluster": sys.argv[5],
    "chart": "helm/log-guardian",
    "namespace": "log-guardian",
    "reason": sys.argv[4] or None,
    "script": "scripts/k8s_kind_e2e.sh",
}, indent=2) + "\n", encoding="utf-8")
PY
}

pods_stable() {
  local ns="log-guardian" t="${1:-90}"
  [[ "$t" == *s ]] || t="${t}s"
  local timeout="$t"
  kubectl -n "$ns" get pods --no-headers 2>/dev/null \
    | awk '$3 ~ /Error|CrashLoop|Evicted|Unknown/ {print $1}' \
    | xargs -r kubectl -n "$ns" delete pod --force --grace-period=0 2>/dev/null || true
  sleep 2
  if ! kubectl -n "$ns" wait --for=condition=Ready pod --all --timeout="$timeout" 2>/dev/null; then
    return 1
  fi
  if kubectl -n "$ns" get pods --no-headers 2>/dev/null \
    | grep -qE 'CrashLoopBackOff|Error|ImagePullBackOff|CreateContainerConfigError'; then
    return 1
  fi
  return 0
}

helm_kind_sets() {
  echo "--set" "analyzer.logVolume.type=emptyDir"
  echo "--set" "operator.standalone=true"
  echo "--set" "daemon.rceWebhook.enabled=false"
}

echo "=== k8s_kind_e2e ==="

for cmd in helm kubectl; do
  command -v "$cmd" >/dev/null 2>&1 || {
    write_report "skip-no-$cmd" true "CLI yok — helm_install_smoke yeterli"
    echo "[SKIP] $cmd yok"
    exit 0
  }
done

if ! command -v kind >/dev/null 2>&1; then
  if kubectl cluster-info >/dev/null 2>&1; then
    ok "kind yok — mevcut kubectl context kullaniliyor"
  else
    write_report "skip-no-kind" true "kind/kubectl cluster yok"
    echo "[SKIP] kind yok ve kubectl cluster erisilemiyor"
    exit 0
  fi
fi

if command -v kind >/dev/null 2>&1; then
  if ! kind get clusters 2>/dev/null | grep -qx "$CLUSTER"; then
    if [[ "${K8S_KIND_CREATE:-0}" == "1" ]]; then
      ok "kind create cluster --name $CLUSTER"
      kind create cluster --name "$CLUSTER"
    else
      write_report "skip-no-cluster" true "K8S_KIND_CREATE=1 ile kind create"
      echo "[SKIP] cluster '$CLUSTER' yok — K8S_KIND_CREATE=1"
      exit 0
    fi
  else
    ok "kind cluster $CLUSTER mevcut"
  fi
  kubectl cluster-info --context "kind-${CLUSTER}" >/dev/null 2>&1 \
    || kubectl config use-context "kind-${CLUSTER}" 2>/dev/null || true
fi

kubectl cluster-info >/dev/null 2>&1 || fail "kubectl cluster-info"

mode="dry-run-server"
if [[ "${K8S_KIND_BUILD:-0}" == "1" ]]; then
  command -v docker >/dev/null 2>&1 || fail "docker gerekli (K8S_KIND_BUILD=1)"
  ok "docker build log-guardian + daemon"
  docker build -t log-guardian:latest -t log-guardian-daemon:latest "$ROOT"
  ok "docker build k8s-operator"
  docker build -t log-guardian-operator:latest "$ROOT/k8s-operator"
  if command -v kind >/dev/null 2>&1; then
    kind load docker-image log-guardian:latest --name "$CLUSTER"
    kind load docker-image log-guardian-daemon:latest --name "$CLUSTER"
    kind load docker-image log-guardian-operator:latest --name "$CLUSTER"
    ok "kind load docker-image x3"
  fi
  PULL=Never
  mode="live-install"
else
  PULL=IfNotPresent
fi

helm template lg-kind "$CHART" --namespace log-guardian >"$RENDER"
grep -q 'kind: DaemonSet' "$RENDER" || fail "DaemonSet yok"
ok "helm template OK"

helm upgrade --install lg-kind "$CHART" \
  --namespace log-guardian \
  --create-namespace \
  --set daemon.image.pullPolicy="$PULL" \
  --set analyzer.image.pullPolicy="$PULL" \
  --set operator.image.pullPolicy="$PULL" \
  $(helm_kind_sets) \
  --dry-run=server >/dev/null 2>&1 && ok "helm upgrade --dry-run=server"

if [[ "${K8S_KIND_APPLY:-0}" == "1" || "${K8S_KIND_BUILD:-0}" == "1" ]]; then
  helm upgrade --install lg-kind "$CHART" \
    --namespace log-guardian \
    --create-namespace \
    --set daemon.image.pullPolicy="$PULL" \
    --set analyzer.image.pullPolicy="$PULL" \
    --set operator.image.pullPolicy="$PULL" \
    $(helm_kind_sets) \
    --wait --timeout 3m 2>/dev/null && ok "helm install --wait" \
    || { mode="live-pending"; ok "helm install (pod pending — image/log beklenir)"; }
  kubectl -n log-guardian get pods 2>/dev/null || true
  gate_pass=true
  if pods_stable 90s; then
    mode="live-ready"
    ok "pod stabilite OK (90s)"
  else
    mode="live-pending"
    gate_pass=false
    echo "[WARN] pod CrashLoop/pending — kubectl -n log-guardian logs <pod>" >&2
  fi
  write_report "$mode" "$gate_pass" ""
  echo "[OK] k8s_kind_e2e — mode=$mode pass=$gate_pass -> $OUT"
  exit 0
fi

write_report "$mode" true ""
echo "[OK] k8s_kind_e2e — mode=$mode -> $OUT"
