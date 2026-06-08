import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Phase 6: Artık DB'den çekiliyor.
    const tenantId = request.headers.get('x-tenant-id');
    const now = new Date().getTime();

    // Tenant filtresi var mı?
    const whereClause = (tenantId && tenantId !== '*') ? { tenantId } : {};

    const agents = await prisma.telemetry.findMany({
      where: whereClause,
      include: { tenant: true }, // tenant bilgisini de çekiyoruz
    });

    const enrichedFleet = agents.map(agent => {
      const isOnline = (now - new Date(agent.lastSeen).getTime()) < 15000;
      let attack_trees = 0;
      try {
        const trees = JSON.parse(agent.attackTreeJson || '[]');
        attack_trees = Array.isArray(trees) ? trees.length : 0;
      } catch { /* ignore */ }
      return {
        agent_id: agent.agentId,
        tenant_id: agent.tenantId,
        tenant_name: agent.tenant?.name ?? agent.tenantId,
        eps: agent.eps,
        total_lines: agent.totalLines,
        alerts_total: agent.alertsTotal,
        rce_detections: agent.rceDetections,
        tarpit_active: agent.tarpitActive,
        tarpit_trapped: agent.tarpitTrapped,
        mesh_peers: agent.meshPeers,
        unique_ips: agent.uniqueIps,
        tls_decrypted: agent.tlsDecrypted,
        etcd_peers: agent.etcdPeers,
        incidents_active: agent.incidentsActive,
        incidents_correlated: agent.incidentsCorrelated,
        attack_trees,
        last_seen: agent.lastSeen,
        status: isOnline ? 'Online' : 'Offline',
      };
    });

    // Tenants için group by (Aktif tenantlar)
    const activeTenants = await prisma.telemetry.groupBy({
      by: ['tenantId'],
      _count: {
        agentId: true,
      },
    });

    const tenants = activeTenants.map(t => ({
      tenant_id: t.tenantId,
      agent_count: t._count.agentId,
    }));

    return NextResponse.json({
      fleet:        enrichedFleet,
      tenant_id:    tenantId || '*',
      tenant_count: tenants.length,
      tenants,
    });
  } catch (error) {
    console.error('Fleet query error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
