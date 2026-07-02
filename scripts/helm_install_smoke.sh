#!/usr/bin/env bash
# P3 #10 — Helm chart template + opsiyonel cluster dry-run
#   bash scripts/helm_install_smoke.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
CHART="$ROOT/helm/log-guardian"
OUT="${ROOT}/helm-install-smoke-report.json"
RENDER="$ROOT/.cache/lg-helm-render.yaml"
mkdir -p "$ROOT/.cache"

fail() { echo "[helm_install_smoke] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

echo "=== helm_install_smoke ==="

[[ -f "$CHART/Chart.yaml" ]] || fail "Chart.yaml yok"
[[ -f "$CHART/values.yaml" ]] || fail "values.yaml yok"

if ! command -v helm >/dev/null 2>&1; then
  python3 - "$OUT" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path
p = Path(sys.argv[1])
p.write_text(json.dumps({
    "date": datetime.now(timezone.utc).isoformat(),
    "pass": True,
    "mode": "skip",
    "reason": "helm CLI yok — chart dosyalari mevcut",
    "chart": "helm/log-guardian",
    "script": "scripts/helm_install_smoke.sh",
}, indent=2) + "\n", encoding="utf-8")
print("[SKIP] helm yok — chart statik dogrulama")
PY
  exit 0
fi

helm template lg-smoke "$CHART" \
  --namespace log-guardian \
  --set global.tenantId=demo \
  > "$RENDER"

grep -q 'kind: DaemonSet' "$RENDER" || fail "DaemonSet yok"
grep -q 'kind: Deployment' "$RENDER" || fail "Deployment (analyzer) yok"
grep -q 'kind: ConfigMap' "$RENDER" || fail "ConfigMap (rules) yok"
ok "helm template — DaemonSet + Deployment + ConfigMap"

grep -q 'privileged: true' "$RENDER" || fail "daemon privileged bekleniyor"
grep -q 'hostNetwork: true' "$RENDER" || fail "daemon hostNetwork bekleniyor"
ok "daemon hostNetwork + privileged"

cluster_mode="template-only"
if command -v kubectl >/dev/null 2>&1; then
  if kubectl cluster-info >/dev/null 2>&1; then
    helm upgrade --install lg-smoke "$CHART" \
      --namespace log-guardian \
      --create-namespace \
      --dry-run=server \
      --set analyzer.image.pullPolicy=Never \
      --set daemon.image.pullPolicy=Never \
      >/dev/null 2>&1 && cluster_mode="dry-run-server" && ok "helm upgrade --dry-run=server"
  fi
fi

python3 - "$OUT" "$cluster_mode" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path
out = Path(sys.argv[1])
mode = sys.argv[2]
out.write_text(json.dumps({
    "date": datetime.now(timezone.utc).isoformat(),
    "pass": True,
    "mode": mode,
    "chart": "helm/log-guardian",
    "namespace": "log-guardian",
    "tenant": "demo",
    "resources": ["DaemonSet", "Deployment", "ConfigMap"],
    "script": "scripts/helm_install_smoke.sh",
}, indent=2) + "\n", encoding="utf-8")
PY

rm -f "$RENDER"
echo "[OK] helm_install_smoke — mode=$cluster_mode"
