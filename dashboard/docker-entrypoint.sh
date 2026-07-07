#!/bin/sh
set -e
cd /app

mkdir -p /app/prisma /home/nextjs
chown -R nextjs:nodejs /app/prisma /home/nextjs 2>/dev/null || true

# Named volume /app/prisma eski schema tutabilir — image'daki guncel schema ile senkron
if [ -f /app/prisma-schema/schema.prisma ]; then
  cp /app/prisma-schema/schema.prisma /app/prisma/schema.prisma
fi

if [ -x ./node_modules/.bin/prisma ] || [ -f ./node_modules/prisma/build/index.js ]; then
  ./node_modules/.bin/prisma db push --skip-generate 2>/dev/null || \
    node ./node_modules/prisma/build/index.js db push --skip-generate 2>/dev/null || \
    echo "[entrypoint] prisma db push atlandi"
  chown -R nextjs:nodejs /app/prisma 2>/dev/null || true
fi

if [ "${DASHBOARD_SEED:-0}" = "1" ] && [ -f /app/prisma/seed.mjs ]; then
  export HOME=/home/nextjs
  su nextjs -s /bin/sh -c 'cd /app && node prisma/seed.mjs' || true
fi

exec su nextjs -s /bin/sh -c 'cd /app && exec node server.js'
