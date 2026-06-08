#!/bin/sh
set -e
cd /app

mkdir -p /app/prisma /home/nextjs
chown -R nextjs:nodejs /app/prisma /home/nextjs 2>/dev/null || true

if [ -x ./node_modules/.bin/prisma ] && [ ! -f /app/prisma/dev.db ]; then
  ./node_modules/.bin/prisma db push --skip-generate 2>/dev/null || \
    echo "[entrypoint] prisma db push atlandi (mevcut DB veya wasm eksik)"
  chown -R nextjs:nodejs /app/prisma 2>/dev/null || true
fi

if [ "${DASHBOARD_SEED:-0}" = "1" ] && [ -f /app/prisma/seed.mjs ]; then
  export HOME=/home/nextjs
  su nextjs -s /bin/sh -c 'cd /app && node prisma/seed.mjs' || true
fi

exec su nextjs -s /bin/sh -c 'cd /app && exec node server.js'
