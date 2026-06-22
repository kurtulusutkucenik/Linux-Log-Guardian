#!/usr/bin/env bash
# E2E / eski demo ajanlarini dashboard DB'den temizle (0/3 offline gorunumu)
#   bash scripts/fleet_prune_stale_agents.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -qx 'log-guardian-dashboard'; then
  echo "[fleet_prune] dashboard container yok — atlandi" >&2
  exit 0
fi

KEEP="${KEEP_AGENT:-node-kurtulus-01}"
MAX_AGE_SEC="${MAX_AGE_SEC:-3600}"

docker exec log-guardian-dashboard node -e "
const {PrismaClient}=require('@prisma/client');
const p=new PrismaClient();
const keep=process.env.KEEP||'$KEEP';
const maxAge=parseInt(process.env.MAX_AGE_SEC||'$MAX_AGE_SEC',10);
const now=Date.now();
(async()=>{
  const all=await p.telemetry.findMany();
  let n=0;
  for(const a of all){
    const age=(now-new Date(a.lastSeen).getTime())/1000;
    const stale=a.agentId.startsWith('e2e-')||age>maxAge;
    if(stale && a.agentId!==keep){
      await p.telemetry.delete({where:{agentId_tenantId:{agentId:a.agentId,tenantId:a.tenantId}}});
      console.log('[prune]', a.agentId, Math.round(age)+'s');
      n++;
    }
  }
  console.log('[fleet_prune] silinen:', n, 'kalan:', all.length-n);
  await p.\$disconnect();
})().catch(e=>{console.error(e);process.exit(1);});
"
