#!/usr/bin/env bash
# Pro Plus kaynak ozeti — Core / Pro / Pro Plus RAM-disk (ayri hesap)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

CLUSTER="${K8S_KIND_CLUSTER:-lg}"
TIER="${LOG_GUARDIAN_TIER:-pro_plus}"
K8S_JSON="$ROOT/k8s-kind-e2e-report.json"

lg_rss_kb() {
  ps -o rss= -C log-guardian,log-guardian-daemon 2>/dev/null | awk '{s+=$1} END {print s+0}'
}

docker_mb() {
  local name="$1"
  docker stats --no-stream --format '{{.MemUsage}}' "$name" 2>/dev/null | awk -F'/' '{gsub(/MiB|GiB/,"",$1); print $1}' || echo "0"
}

kind_up=0
if command -v kind >/dev/null 2>&1 && kind get clusters 2>/dev/null | grep -qx "$CLUSTER"; then
  kind_up=1
fi

core_rss=$(lg_rss_kb)
core_mb=$(( (core_rss + 512) / 1024 ))

dash_mb=$(docker_mb log-guardian-dashboard)
graf_mb=$(docker_mb grafana-lg)
prom_mb=$(docker_mb prometheus-lg)
caddy_mb=$(docker_mb log-guardian-caddy)
pro_mb=$(python3 - <<PY
d=float("${dash_mb:-0}" or 0)+float("${graf_mb:-0}" or 0)+float("${prom_mb:-0}" or 0)+float("${caddy_mb:-0}" or 0)
print(int(d))
PY
)

kind_mb=0
if [[ "$kind_up" == "1" ]]; then
  kind_mb=$(docker_mb "${CLUSTER}-control-plane" | awk '{print int($1+0)}')
  if [[ "$kind_mb" -lt 100 ]]; then
    kind_mb=1200
  fi
fi

total_mb=$((core_mb + pro_mb + kind_mb))

echo "=== pro_plus_status (LOG_GUARDIAN_TIER=$TIER) ==="
echo "  Core:          ${core_mb} MB RAM  (plan ~120 MB)"
echo "  Pro stack:     ${pro_mb} MB RAM  (plan ~730 MB)"
if [[ "$kind_up" == "1" ]]; then
  echo "  Pro Plus K8s:  ${kind_mb} MB RAM  (plan ~1200 MB)"
else
  echo "  Pro Plus K8s:  kapali (kind cluster yok)"
fi
echo "  Toplam:        ${total_mb} MB RAM"
echo ""
echo "  Disk (plan):  Core ~4 MB | Pro +Docker ~3-5 GB | Pro Plus +kind ~2-3 GB"
if [[ -f "$K8S_JSON" ]]; then
  mode=$(python3 -c "import json; print(json.load(open('$K8S_JSON')).get('mode','?'))" 2>/dev/null || echo "?")
  echo "  K8s rapor:    $K8S_JSON (mode=$mode)"
fi
echo ""
echo "  Ac:  bash scripts/pro_plus_stack.sh"
echo "  Kapat (K8s): bash scripts/pro_plus_down.sh"
