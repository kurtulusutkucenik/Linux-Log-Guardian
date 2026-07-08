#!/usr/bin/env bash
# Takili fleet komutlari (delivered/pending, executed=false) — yas esigi sonrasi kapat
#   bash scripts/fleet_prune_pending_commands.sh
#   DRY_RUN=1 bash scripts/fleet_prune_pending_commands.sh
#   STALE_HOURS=48 bash scripts/fleet_prune_pending_commands.sh   # varsayilan 48h
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DRY_RUN="${DRY_RUN:-0}"
STALE_HOURS="${STALE_HOURS:-48}"
REPORT="${FLEET_PRUNE_CMDS_REPORT:-fleet-prune-cmds-report.json}"

if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -qx 'log-guardian-dashboard'; then
  echo "[fleet_prune_cmds] dashboard container yok" >&2
  exit 1
fi

SUMMARY=$(docker exec -e DRY_RUN="$DRY_RUN" -e STALE_HOURS="$STALE_HOURS" log-guardian-dashboard node -e "
const { PrismaClient } = require('@prisma/client');
const dry = process.env.DRY_RUN === '1';
const hours = parseFloat(process.env.STALE_HOURS || '48');
const cutoff = new Date(Date.now() - hours * 3600 * 1000);
const p = new PrismaClient();
(async () => {
  const allStuck = await p.agentCommand.findMany({
    where: { executed: false, status: { in: ['delivered', 'pending'] } },
    orderBy: { createdAt: 'asc' },
  });
  const stuck = allStuck.filter((c) => new Date(c.createdAt) < cutoff);
  const young = allStuck.filter((c) => new Date(c.createdAt) >= cutoff);
  const groups = new Map();
  for (const c of stuck) {
    const key = c.commandType + ' ' + c.payload.slice(0, 48);
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  const youngItems = young.slice(0, 8).map((c) => {
    const ageH = Math.max(0, (Date.now() - new Date(c.createdAt).getTime()) / 3600000);
    return {
      type: c.commandType,
      status: c.status,
      target: c.targetAgentId || '*',
      age_h: Math.round(ageH * 10) / 10,
      payload: c.payload.slice(0, 64),
    };
  });
  let n = 0;
  for (const c of stuck) {
    if (!dry) {
      await p.agentCommand.update({
        where: { id: c.id },
        data: { executed: true, status: 'failed', executedAt: new Date() },
      });
    }
    n++;
  }
  for (const [k, cnt] of groups) {
    console.error('  ' + (dry ? 'dry-run' : 'iptal') + ': ' + k + (cnt > 1 ? ' x' + cnt : ''));
  }
  for (const item of youngItems) {
    console.error(
      '  bekleyen: ' + item.type + ' -> ' + item.target +
      ' (' + item.status + ', ' + item.age_h + 'h) ' + item.payload
    );
  }
  const out = {
    closed: n,
    dry_run: dry,
    stale_hours: hours,
    pending_young: young.length,
    pending_total: allStuck.length,
    pending_young_items: youngItems,
    groups: Object.fromEntries(groups),
  };
  console.log(JSON.stringify(out));
  await p.\$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
")

python3 - "$ROOT" "$REPORT" "$DRY_RUN" "$STALE_HOURS" "$SUMMARY" <<'PY'
import datetime
import json
import sys
from pathlib import Path

root, report_path = Path(sys.argv[1]), Path(sys.argv[2])
dry_run = sys.argv[3] == "1"
stale_h = float(sys.argv[4])
summary = json.loads(sys.argv[5])

out = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "pass": True,
    "closed": int(summary.get("closed") or 0),
    "dry_run": dry_run,
    "stale_hours": stale_h,
    "pending_young": int(summary.get("pending_young") or 0),
    "pending_total": int(summary.get("pending_total") or 0),
    "pending_young_items": summary.get("pending_young_items") or [],
    "groups": summary.get("groups") or {},
    "script": "scripts/fleet_prune_pending_commands.sh",
}
report_path.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(json.dumps(out, indent=2, ensure_ascii=False))
PY

closed=$(python3 -c "import json,sys; print(json.loads(sys.argv[1]).get('closed',0))" "$SUMMARY")
if [[ "$DRY_RUN" == "1" ]]; then
  echo "[fleet_prune_cmds] ${closed} komut (dry-run) >${STALE_HOURS}h — rapor: $REPORT"
else
  echo "[fleet_prune_cmds] ${closed} komut >${STALE_HOURS}h kapatildi — rapor: $REPORT"
fi
