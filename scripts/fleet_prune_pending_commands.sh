#!/usr/bin/env bash
# Takili fleet komutlari (delivered ama executed degil) temizle
#   bash scripts/fleet_prune_pending_commands.sh
set -euo pipefail

if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -qx 'log-guardian-dashboard'; then
  echo "[fleet_prune_cmds] dashboard container yok" >&2
  exit 1
fi

docker exec log-guardian-dashboard node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const stuck = await p.agentCommand.findMany({
    where: { executed: false, status: { in: ['delivered', 'pending'] } },
  });
  let n = 0;
  for (const c of stuck) {
    await p.agentCommand.update({
      where: { id: c.id },
      data: { executed: true, status: 'failed', executedAt: new Date() },
    });
    console.log('  iptal:', c.commandType, c.payload.slice(0, 40));
    n++;
  }
  console.log('[fleet_prune_cmds] ' + n + ' komut kapatildi');
  await p.\$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
"
