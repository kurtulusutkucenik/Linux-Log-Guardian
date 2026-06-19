#!/usr/bin/env bash
# Webhook gelistirme — yerel mock listener, gercek URL gerekmez
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

LG_QUIET_BUILD=1 make -s log-guardian

PORT="${WEBHOOK_MOCK_PORT:-19876}"
CACHE="$ROOT/.cache"
mkdir -p "$CACHE"
LOG="$CACHE/webhook_dev.log"
: > "$LOG"

python3 - "$PORT" "$LOG" <<'PY' &
import json, sys
from http.server import BaseHTTPRequestHandler, HTTPServer

port = int(sys.argv[1])
log_path = sys.argv[2]

class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_POST(self):
        n = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(n).decode("utf-8", "replace") if n else ""
        row = {"path": self.path, "body": body}
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"ok")

HTTPServer(("127.0.0.1", port), H).serve_forever()
PY
MOCK_PID=$!
trap 'kill "$MOCK_PID" 2>/dev/null || true' EXIT

for _ in $(seq 1 30); do
  curl -sf "http://127.0.0.1:${PORT}/ping" -X POST -d '{}' >/dev/null 2>&1 && break
  sleep 0.1
done

BASE="http://127.0.0.1:${PORT}"
export WEBHOOK_ENABLED=1
export WEBHOOK_DRY_RUN=0
export WEBHOOK_TELEGRAM_API_BASE="${BASE}/telegram"
export LOGANALYZER_TELEGRAM_TOKEN="dev:token"
export LOGANALYZER_TELEGRAM_CHAT_ID="-1001"
export LOGANALYZER_GENERIC_WEBHOOK_URL="${BASE}/generic"

RULES="$CACHE/webhook_dev.conf"
cat > "$RULES" <<EOF
WEBHOOK_ENABLED=1
WEBHOOK_MIN_LEVEL=2
WEBHOOK_COOLDOWN_SEC=60
METRICS_PORT=0
DB_ENABLED=0
WASM_ENABLED=0
AUTO_BAN=0
EOF
chmod 600 "$RULES"

fail() { echo "[webhook_dev] FAIL: $*" >&2; exit 1; }

run_kind() {
  local kind=$1
  local out
  out=$(./log-guardian webhook-test "$kind" --quiet --rules "$RULES" 2>/dev/null) || {
    echo "$out" >&2
    fail "webhook-test $kind"
  }
  echo "$out" | grep -q '"ok":' || fail "ok alani yok ($kind)"
  echo "$out" | grep -q '"fail":0' || fail "fail>0 ($kind): $out"
  echo "  [$kind] $out"
}

echo "=== webhook_dev (mock ${BASE}) ==="
for k in alert ban trap; do
  run_kind "$k"
  sleep 0.2
done

LINES=$(wc -l < "$LOG" | tr -d ' ')
[[ "$LINES" -ge 6 ]] || fail "mock POST sayisi dusuk ($LINES, beklenen >=6)"

echo "[OK] webhook_dev — $LINES POST alindi"
echo "--- son kayitlar ---"
tail -3 "$LOG" | while read -r line; do
  python3 -c "import json,sys; r=json.loads(sys.argv[1]); print(r['path'], r['body'][:80]+'...')" "$line" 2>/dev/null || echo "$line"
done
