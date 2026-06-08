#!/usr/bin/env bash
# Dashboard prod build smoke (Dockerfile standalone)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/dashboard"

fail() { echo "[dashboard_prod_smoke] FAIL: $*" >&2; exit 1; }

echo "=== dashboard_prod_smoke ==="

if ! command -v npm >/dev/null 2>&1; then
  echo "[WARN] npm yok — atlandi"
  exit 0
fi

export JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32 2>/dev/null || echo test_jwt_secret_min_32_chars_ok)}"

# devDependencies (@tailwindcss/postcss) — NODE_ENV=production npm ci bunlari atlar
npm ci --silent 2>/dev/null || npm install --silent
npx prisma generate
NODE_ENV=production npm run build 2>&1 | tail -8

test -d .next/standalone || fail ".next/standalone yok — next.config output standalone?"
test -f .next/standalone/server.js || fail "server.js yok"

echo "[OK] dashboard prod build (standalone)"
