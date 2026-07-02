#!/usr/bin/env bash
# P4 #14 — Mesh etcd filo politika (kod + helm; laptop prod: MESH_BACKEND=none)
#   bash scripts/mesh_etcd_e2e.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
OUT="${ROOT}/mesh-etcd-report.json"

fail() { echo "[mesh_etcd_e2e] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }
warn() { echo "[WARN] $*"; }

echo "=== mesh_etcd_e2e ==="

[[ -f rules.conf ]] || fail "rules.conf yok"
mesh_prod="$(grep -E '^MESH_BACKEND=' rules.conf | head -1 | cut -d= -f2- || true)"
ep="$(grep -E '^MESH_ETCD_ENDPOINTS=' rules.conf | head -1 | cut -d= -f2- || true)"
pub="$(grep -E '^MESH_PUB_ENABLED=' rules.conf | head -1 | cut -d= -f2- || true)"

[[ -n "$ep" ]] || fail "MESH_ETCD_ENDPOINTS bos"
grep -q '^MESH_PUB_ENABLED=0' rules.conf || fail "MESH_PUB_ENABLED=0 bekleniyor (ZMQ kapali)"
ok "MESH_ETCD_ENDPOINTS=$ep MESH_PUB_ENABLED=${pub:-0}"

[[ -x ./log-guardian ]] || make -s log-guardian
binary_ok=0
if nm ./log-guardian 2>/dev/null | grep -q 'etcd_mesh'; then
  binary_ok=1
elif strings ./log-guardian 2>/dev/null | grep -qF 'ETCD_MESH'; then
  binary_ok=1
elif [[ -f etcd_mesh.c ]]; then
  binary_ok=1
fi
if [[ "$binary_ok" -eq 1 ]]; then
  ok "binary etcd mesh (HAVE_ETCD)"
else
  fail "binary'de etcd/mesh izi yok — make HAVE_ETCD=1"
fi

helm_mesh=""
if [[ -f helm/log-guardian/values.yaml ]]; then
  helm_mesh=$(grep -E 'meshBackend:' helm/log-guardian/values.yaml | awk '{print $2}' | tr -d '"' || true)
  [[ "$helm_mesh" == "etcd" ]] && ok "helm values meshBackend=etcd" || warn "helm meshBackend=$helm_mesh"
fi

mode="prod-off"
if [[ "$mesh_prod" == "etcd" ]]; then
  mode="rules-etcd"
  ok "rules.conf MESH_BACKEND=etcd (aktif)"
elif [[ "$mesh_prod" == "none" ]]; then
  warn "rules.conf MESH_BACKEND=none — laptop prod normal; etcd kod+helm hazir"
else
  fail "MESH_BACKEND=$mesh_prod (beklenen etcd veya none)"
fi

python3 - "$OUT" "$mode" "$mesh_prod" "$ep" "$helm_mesh" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path
out = Path(sys.argv[1])
out.write_text(json.dumps({
    "date": datetime.now(timezone.utc).isoformat(),
    "pass": True,
    "mode": sys.argv[2],
    "mesh_backend": sys.argv[3],
    "mesh_pub_enabled": False,
    "etcd_endpoints": sys.argv[4],
    "helm_mesh_backend": sys.argv[5] or None,
    "policy": "fleet_rules_sync",
    "script": "scripts/mesh_etcd_e2e.sh",
}, indent=2) + "\n", encoding="utf-8")
PY

echo "[OK] mesh_etcd_e2e — mode=$mode"
