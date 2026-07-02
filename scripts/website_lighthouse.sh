#!/usr/bin/env bash
# Lighthouse baseline — yerel statik site (performans / erişilebilirlik / SEO)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE="${1:-$ROOT/assets/website}"
OUT="${LG_LIGHTHOUSE_OUT:-$ROOT/docs/website-lighthouse.json}"
HOST="${LG_WEBSITE_HOST:-127.0.0.1}"
PORT="${LG_LIGHTHOUSE_PORT:-}"

exec 200>&- 2>/dev/null || true

[[ -d "$SITE" ]] || { echo "[website_lighthouse] FAIL: $SITE yok" >&2; exit 1; }

if ! command -v npx >/dev/null 2>&1; then
  echo "[website_lighthouse] FAIL: npx yok — Node.js kurun" >&2
  exit 1
fi

if [[ -z "$PORT" ]]; then
  PORT="$(python3 - <<'PY'
import socket
s = socket.socket()
s.bind(("127.0.0.1", 0))
print(s.getsockname()[1])
s.close()
PY
)"
fi

URL="http://${HOST}:${PORT}/"
mkdir -p "$(dirname "$OUT")"

echo "=== website_lighthouse ==="
echo "  Site: ${SITE#$ROOT/}"
echo "  URL:  $URL"
echo "  Out:  ${OUT#$ROOT/}"

python3 "$ROOT/scripts/website_secure_server.py" "$SITE" --host "$HOST" --port "$PORT" &
srv_pid=$!
cleanup() {
  kill -TERM "$srv_pid" 2>/dev/null || true
  sleep 0.25
  kill -KILL "$srv_pid" 2>/dev/null || true
}
trap cleanup EXIT

for _ in $(seq 1 40); do
  if curl -fsS -o /dev/null "$URL" 2>/dev/null; then break; fi
  sleep 0.15
done

npx --yes lighthouse "$URL" \
  --only-categories=performance,accessibility,best-practices,seo \
  --chrome-flags="--headless --no-sandbox --disable-gpu" \
  --output=json \
  --output-path="$OUT" \
  --quiet

python3 - <<PY
import json, pathlib
p = pathlib.Path("$OUT")
data = json.loads(p.read_text())
cats = data.get("categories", {})
rows = []
for k in ("performance", "accessibility", "best-practices", "seo"):
    c = cats.get(k, {})
    score = c.get("score")
    if score is not None:
        rows.append(f"  {k:18} {score * 100:.0f}")
print("[OK] website_lighthouse")
for r in rows:
    print(r)
PY
