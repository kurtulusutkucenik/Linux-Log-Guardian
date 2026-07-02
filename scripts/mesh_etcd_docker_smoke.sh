#!/usr/bin/env bash
# Opsiyonel etcd docker smoke — mesh canli endpoint (laptop lab)
#   bash scripts/mesh_etcd_docker_smoke.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
OUT="$ROOT/mesh-etcd-docker-report.json"
CONTAINER="${MESH_ETCD_CONTAINER:-lg-etcd-smoke}"
PORT="${MESH_ETCD_PORT:-12379}"
ENDPOINT="http://127.0.0.1:${PORT}"

fail() { echo "[mesh_etcd_docker] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

echo "=== mesh_etcd_docker_smoke ==="

command -v docker >/dev/null 2>&1 || {
  python3 - "$OUT" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path
Path(sys.argv[1]).write_text(json.dumps({
    "date": datetime.now(timezone.utc).isoformat(),
    "pass": True,
    "mode": "skip",
    "reason": "docker yok",
    "script": "scripts/mesh_etcd_docker_smoke.sh",
}, indent=2) + "\n")
PY
  echo "[SKIP] docker yok"
  exit 0
}

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
  docker run -d --name "$CONTAINER" \
    -p "${PORT}:2379" \
    -e ALLOW_NONE_AUTHENTICATION=yes \
    bitnami/etcd:3.5 >/dev/null 2>&1 \
    || docker run -d --name "$CONTAINER" \
      -p "${PORT}:2379" \
      -e ETCD_ADVERTISE_CLIENT_URLS="$ENDPOINT" \
      -e ETCD_LISTEN_CLIENT_URLS="http://0.0.0.0:2379" \
      quay.io/coreos/etcd:v3.5.16 >/dev/null 2>&1 \
    || fail "etcd container baslatilamadi"
  ok "etcd container basladi ($CONTAINER :$PORT)"
  sleep 3
else
  ok "etcd container zaten ayakta"
fi

health_ok=0
for _ in $(seq 1 15); do
  if curl -sf --max-time 2 "${ENDPOINT}/health" >/dev/null 2>&1 \
      || curl -sf --max-time 2 "${ENDPOINT}/v2/health" >/dev/null 2>&1 \
      || curl -sf --max-time 2 "${ENDPOINT}/version" >/dev/null 2>&1; then
    health_ok=1
    break
  fi
  sleep 1
done
[[ "$health_ok" -eq 1 ]] || fail "etcd health yok ($ENDPOINT)"

python3 - "$OUT" "$ENDPOINT" "$CONTAINER" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path
Path(sys.argv[1]).write_text(json.dumps({
    "date": datetime.now(timezone.utc).isoformat(),
    "pass": True,
    "mode": "docker-live",
    "endpoint": sys.argv[2],
    "container": sys.argv[3],
    "policy": "fleet_rules_sync",
    "script": "scripts/mesh_etcd_docker_smoke.sh",
}, indent=2) + "\n", encoding="utf-8")
PY

echo "[OK] mesh_etcd_docker_smoke — $ENDPOINT"
