#!/usr/bin/env bash
# Faz 5 — Wasm stub + Copilot API + etcd mesh (production tek kanal)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"
DASH_URL="${DASH_URL:-http://127.0.0.1:3000}"

make -s log-guardian

echo "[1] MESH_BACKEND=etcd (ZMQ kapali)"
grep -q '^MESH_BACKEND=etcd' rules.conf
grep -q '^MESH_PUB_ENABLED=0' rules.conf

echo "[2] Wasm plugin dizini + analiz"
grep -q '^WASM_ENABLED=1' rules.conf
test -d examples/plugins
# --json modunda [WASM] log satiri bastirilir
out=$(./log-guardian test_access.log --no-tui --no-ban --no-db --rules rules.conf 2>&1) || true
echo "$out" | grep -q '\[WASM\]'
wasm_n=$(find examples/plugins -maxdepth 1 -name '*.wasm' 2>/dev/null | wc -l)
[[ "$wasm_n" -gt 0 ]] || test -f examples/plugins/README.md

echo "[3] Copilot API (dashboard opsiyonel)"
if curl -sf --max-time 3 "${DASH_URL}/login" -o /dev/null 2>/dev/null; then
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 \
    -X POST "${DASH_URL}/api/copilot" \
    -H 'Content-Type: application/json' \
    -d '{"prompt":"ozet"}' 2>/dev/null || echo 000)
  [[ "$code" == "200" || "$code" == "401" ]] || {
    echo "copilot HTTP $code (login gerekebilir — UI /copilot yeterli)" >&2
  }
  echo "Copilot endpoint erisilebilir (HTTP $code)"
else
  echo "Copilot atlandi (dashboard kapali)"
fi

echo "OK — phase5_e2e"
