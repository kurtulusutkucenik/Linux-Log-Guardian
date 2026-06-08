import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    // Basic Auth Check
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];

    // DB'den API Key'i bul
    const apiKey = await prisma.apiKey.findUnique({
      where: { key: token },
      include: { tenant: true },
    });

    if (!apiKey) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API Key' }, { status: 401 });
    }

    const data = await request.json();

    if (!data.agent_id) {
      return NextResponse.json({ error: 'Missing agent_id' }, { status: 400 });
    }

    // Ajanın telemetry verilerini güncelle (veya oluştur)
    // tenant_id artık isteğe değil, API Key'e bağlı! Bu güvenlik için şart.
    const telemetry = await prisma.telemetry.upsert({
      where: {
        agentId_tenantId: {
          agentId: data.agent_id,
          tenantId: apiKey.tenantId,
        }
      },
      update: {
        eps:            data.eps            || 0,
        totalLines:     data.total_lines    || 0,
        alertsTotal:    data.alerts_total   || 0,
        rceDetections:  data.rce_detections || 0,
        tarpitActive:   data.tarpit_active  || 0,
        tarpitTrapped:  data.tarpit_trapped || 0,
        meshPeers:      data.mesh_peers     || 0,
        uniqueIps:      data.unique_ips     || 0,
        tlsDecrypted:   data.tls_decrypted  || 0,
        etcdPeers:      data.etcd_peers     || 0,
        attackTreeJson: typeof data.attack_tree === 'string'
          ? data.attack_tree
          : JSON.stringify(data.attack_tree ?? []),
        incidentsActive:     data.incidents_active     ?? 0,
        incidentsCorrelated: data.incidents_correlated ?? 0,
        lastSeen:       new Date(),
      },
      create: {
        agentId:        data.agent_id,
        tenantId:       apiKey.tenantId,
        eps:            data.eps            || 0,
        totalLines:     data.total_lines    || 0,
        alertsTotal:    data.alerts_total   || 0,
        rceDetections:  data.rce_detections || 0,
        tarpitActive:   data.tarpit_active  || 0,
        tarpitTrapped:  data.tarpit_trapped || 0,
        meshPeers:      data.mesh_peers     || 0,
        uniqueIps:      data.unique_ips     || 0,
        tlsDecrypted:   data.tls_decrypted  || 0,
        etcdPeers:      data.etcd_peers     || 0,
        attackTreeJson: typeof data.attack_tree === 'string'
          ? data.attack_tree
          : JSON.stringify(data.attack_tree ?? []),
        incidentsActive:     data.incidents_active     ?? 0,
        incidentsCorrelated: data.incidents_correlated ?? 0,
      }
    });

    return NextResponse.json({
      success:   true,
      tenant_id: apiKey.tenantId,
      timestamp: telemetry.lastSeen,
    });
  } catch (error) {
    console.error('Telemetry ingestion error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
