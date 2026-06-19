#!/usr/bin/env bash
# Webhook gercek HTTP POST — yerel mock listener (ag disina cikmaz)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

LG_QUIET_BUILD=1 make -s log-guardian

PORT="${WEBHOOK_MOCK_PORT:-19876}"
CACHE="$ROOT/.cache"
mkdir -p "$CACHE"
LOG="$CACHE/webhook_mock.log"
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
        with open(log_path, "a") as f:
            f.write(body + "\n")
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"ok")

HTTPServer(("127.0.0.1", port), H).serve_forever()
PY
MOCK_PID=$!
trap 'kill "$MOCK_PID" 2>/dev/null || true' EXIT

for _ in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:${PORT}/" -X POST -d '{}' >/dev/null 2>&1; then
    break
  fi
  sleep 0.1
done

export WEBHOOK_ENABLED=1
export WEBHOOK_DRY_RUN=0
unset LOGANALYZER_TELEGRAM_TOKEN LOGANALYZER_TELEGRAM_CHAT_ID \
      WEBHOOK_TELEGRAM_API_BASE || true
export LOGANALYZER_GENERIC_WEBHOOK_URL="http://127.0.0.1:${PORT}/hook"

RULES="$CACHE/webhook_post_e2e.conf"
cat > "$RULES" <<EOF
WEBHOOK_ENABLED=1
WEBHOOK_MIN_LEVEL=1
METRICS_PORT=0
DB_ENABLED=0
WASM_ENABLED=0
AUTO_BAN=0
EOF
chmod 600 "$RULES"

out=$(./log-guardian webhook-test alert --quiet --rules "$RULES" 2>/dev/null)
echo "$out" | grep -q '"sent":true' || { echo "[FAIL] webhook-test: $out" >&2; exit 1; }
echo "$out" | grep -q '"dry_run":false' || { echo "[FAIL] dry_run hala true" >&2; exit 1; }
echo "$out" | grep -q '"destinations":1' || { echo "[FAIL] destinations: $out" >&2; exit 1; }
echo "$out" | grep -q '"fail":0' || { echo "[FAIL] fail>0: $out" >&2; exit 1; }

sleep 0.3
if [[ ! -s "$LOG" ]]; then
  echo "[FAIL] mock listener POST almadi" >&2
  exit 1
fi

echo "[OK] webhook_post_e2e — mock log:"
tail -n 1 "$LOG"
echo "$out"
