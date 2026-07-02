#!/usr/bin/env bash
# Mesh etcd canli yaz/oku — docker lab (laptop, VPS gerekmez)
#   bash scripts/mesh_etcd_live_e2e.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
OUT="$ROOT/mesh-etcd-live-report.json"
PORT="${MESH_ETCD_PORT:-12379}"
ENDPOINT="http://127.0.0.1:${PORT}"

fail() { echo "[mesh_etcd_live_e2e] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

echo "=== mesh_etcd_live_e2e ==="

bash "$ROOT/scripts/mesh_etcd_docker_smoke.sh" >/dev/null 2>&1 || fail "etcd docker smoke"

key_b64=$(printf '%s' 'lg/fleet/policy/test' | base64 -w0)
val_b64=$(printf '%s' '{"tenant":"default","version":1}' | base64 -w0)

put_code=$(curl -s -o /tmp/lg-etcd-put.json -w '%{http_code}' --max-time 5 \
  -X POST "${ENDPOINT}/v3/kv/put" \
  -H 'Content-Type: application/json' \
  -d "{\"key\":\"${key_b64}\",\"value\":\"${val_b64}\"}" 2>/dev/null || echo 000)
[[ "$put_code" == "200" ]] || fail "etcd PUT HTTP $put_code"

get_body=$(curl -sf --max-time 5 -X POST "${ENDPOINT}/v3/kv/range" \
  -H 'Content-Type: application/json' \
  -d "{\"key\":\"${key_b64}\"}" 2>/dev/null) || fail "etcd GET"

echo "$get_body" | grep -q "$val_b64" || fail "etcd round-trip degeri eslesmedi"
ok "etcd v3 PUT/GET round-trip"

python3 - "$OUT" "$ENDPOINT" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path
Path(sys.argv[1]).write_text(json.dumps({
    "date": datetime.now(timezone.utc).isoformat(),
    "pass": True,
    "mode": "docker-live-rw",
    "endpoint": sys.argv[2],
    "policy_key": "lg/fleet/policy/test",
    "round_trip": True,
    "script": "scripts/mesh_etcd_live_e2e.sh",
}, indent=2) + "\n", encoding="utf-8")
PY

echo "[OK] mesh_etcd_live_e2e — $ENDPOINT"
echo "[OK] mesh_etcd_live_e2e"
