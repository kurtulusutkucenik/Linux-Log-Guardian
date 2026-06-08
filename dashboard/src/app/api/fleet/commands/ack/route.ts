import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/* Agent (Bearer token) komut sonucunu bildirir */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    const apiKey = await prisma.apiKey.findUnique({ where: { key: token } });
    if (!apiKey) {
      return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, detail, agent_id: agentId } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const cmd = await prisma.agentCommand.findFirst({
      where: { id, tenantId: apiKey.tenantId },
    });
    if (!cmd) {
      return NextResponse.json({ error: 'Command not found' }, { status: 404 });
    }

    const st =
      status === 'failed' ? 'failed' : status === 'delivered' ? 'delivered' : 'executed';

    await prisma.agentCommand.update({
      where: { id },
      data: {
        status: st,
        executed: st === 'executed' || st === 'failed',
        executedAt: new Date(),
        payload:
          detail && typeof detail === 'string'
            ? `${cmd.payload} | ack:${agentId ?? '?'}:${detail}`
            : cmd.payload,
      },
    });

    return NextResponse.json({ success: true, id, status: st });
  } catch (error) {
    console.error('Command ack error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
