// src/app/api/tenants/route.ts — Phase 6: Aktif tenant listesi (DB tabanlı)
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const userRole = request.headers.get('x-user-role');
    const userTenant = request.headers.get('x-user-tenant');
    const isAdmin = userRole === 'admin';

    // Normal kullanıcı sadece kendi tenant'ını görebilir.
    const whereClause = isAdmin ? {} : { tenantId: userTenant as string };

    const allAgents = await prisma.telemetry.findMany({
      where: whereClause
    });
    const now = new Date().getTime();

    // Group by tenant
    const tenantMap = new Map<string, any[]>();
    for (const agent of allAgents) {
      if (!tenantMap.has(agent.tenantId)) {
        tenantMap.set(agent.tenantId, []);
      }
      tenantMap.get(agent.tenantId)!.push(agent);
    }

    const enriched = Array.from(tenantMap.entries()).map(([tenantId, agents]) => {
      const online = agents.filter(
        a => now - new Date(a.lastSeen).getTime() < 15000
      ).length;
      
      const totalEps     = agents.reduce((s, a) => s + a.eps, 0);
      const totalRce     = agents.reduce((s, a) => s + a.rceDetections, 0);
      const totalTarpit  = agents.reduce((s, a) => s + a.tarpitActive, 0);
      const totalTlsDec  = agents.reduce((s, a) => s + (a.tlsDecrypted || 0), 0);
      const totalEtcdPeers = agents.reduce((s, a) => s + (a.etcdPeers || 0), 0);

      return {
        tenant_id:    tenantId,
        agent_count:  agents.length,
        online_agents: online,
        total_eps:    totalEps,
        total_rce:    totalRce,
        total_tarpit: totalTarpit,
        tls_decrypted: totalTlsDec,
        etcd_peers:   totalEtcdPeers,
      };
    });

    return NextResponse.json({ tenants: enriched });
  } catch (error) {
    console.error('Tenants query error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
