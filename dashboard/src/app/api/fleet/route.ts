import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { buildVpsFleetShadow, readVpsRemoteStatus } from '@/lib/vpsFleetShadow';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const now = new Date().getTime();
    const url = new URL(request.url);
    const staleHours = parseFloat(url.searchParams.get('stale_hours') || '0');

    const whereClause = (tenantId && tenantId !== '*') ? { tenantId } : {};

    const agents = await prisma.telemetry.findMany({
      where: whereClause,
      include: { tenant: true },
    });

    const enrichedFleet = agents
      .map(agent => {
      const lastMs = new Date(agent.lastSeen).getTime();
      const isOnline = (now - lastMs) < 15000;
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
        _lastMs: lastMs,
        _isOnline: isOnline,
      };
    })
      .filter(agent => {
        if (staleHours <= 0) return true;
        if (agent._isOnline) return true;
        return (now - agent._lastMs) < staleHours * 3600 * 1000;
      })
      .map(({ _lastMs: _a, _isOnline: _b, ...rest }) => rest);

    const vpsRemote = await readVpsRemoteStatus();
    const shadow = buildVpsFleetShadow(vpsRemote);
    let fleetOut = enrichedFleet;
    if (shadow && !enrichedFleet.some((a) => a.agent_id === shadow.agent_id)) {
      fleetOut = [...enrichedFleet, shadow];
    }

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

    const pendingCommands = await prisma.agentCommand.count({
      where: { executed: false, status: { in: ['delivered', 'pending'] } },
    });

    return NextResponse.json({
      fleet:        fleetOut,
      remote_shadow: shadow
        ? {
            agent_id: shadow.agent_id,
            host: shadow.host,
            hostname: shadow.hostname,
            xdp_mode: shadow.xdp_mode,
            soak_proof_72h: shadow.soak_proof_72h,
          }
        : null,
      tenant_id:    tenantId || '*',
      tenant_count: tenants.length,
      tenants,
      pending_commands: pendingCommands,
    });
  } catch (error) {
    console.error('Fleet query error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
