#!/usr/bin/env bash
# Eski OFFLINE filo kayitlarini DB'den temizle (demo gurultusu)
#   bash scripts/fleet_prune_stale.sh              # 48h+ gorulmeyen sil
#   STALE_HOURS=1 bash scripts/fleet_prune_stale.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STALE_HOURS="${STALE_HOURS:-48}"

prune_sqlite() {
  local db="$1"
  python3 <<PY
import sqlite3, datetime
db = "$db"
hours = float("$STALE_HOURS")
cutoff = datetime.datetime.utcnow() - datetime.timedelta(hours=hours)
conn = sqlite3.connect(db)
cur = conn.cursor()
cur.execute("SELECT agentId, tenantId, lastSeen FROM Telemetry")
deleted = 0
for agent_id, tenant_id, last_seen in cur.fetchall():
    try:
        ls = datetime.datetime.fromisoformat(str(last_seen).replace("Z", ""))
    except Exception:
        continue
    if ls < cutoff:
        cur.execute(
            "DELETE FROM Telemetry WHERE agentId=? AND tenantId=?",
            (agent_id, tenant_id),
        )
        deleted += 1
        print(f"  silindi: {agent_id} (last={last_seen})")
conn.commit()
conn.close()
print(f"[fleet_prune] {deleted} kayit silindi (>{hours}h)")
PY
}

if docker ps --format '{{.Names}}' 2>/dev/null | grep -q log-guardian-dashboard; then
  docker exec log-guardian-dashboard node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const hours = $STALE_HOURS;
const cutoff = Date.now() - hours * 3600 * 1000;
(async () => {
  const rows = await p.telemetry.findMany();
  let n = 0;
  for (const r of rows) {
    if (new Date(r.lastSeen).getTime() < cutoff) {
      await p.telemetry.delete({ where: { id: r.id } });
      console.log('  silindi:', r.agentId);
      n++;
    }
  }
  console.log('[fleet_prune] ' + n + ' kayit silindi (>' + hours + 'h)');
  await p.\$disconnect();
})().catch(e => { console.error(e); process.exit(1); });
" && exit 0
fi

for db in "$ROOT/dashboard/prisma/dev.db" "$ROOT/dashboard/prisma/prod.db"; do
  if [[ -f "$db" ]]; then
    prune_sqlite "$db"
    exit 0
  fi
done

echo "[fleet_prune] dashboard DB bulunamadi — docker stack ayakta mi?" >&2
exit 1
