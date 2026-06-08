import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { executeGuardianBan } from '@/lib/guardianBanExec';

export const dynamic = 'force-dynamic';

// GET: C Ajanı komutları çekmek için kullanır (Long-Polling veya Periyodik)
// Header'da Bearer <API_KEY> olmak zorundadır.
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    const apiKey = await prisma.apiKey.findUnique({
      where: { key: token },
    });
    if (!apiKey) {
      return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
    }

    // URL'den agentId okunur: /api/fleet/commands?agent_id=xxx
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent_id');

    if (!agentId) {
      return NextResponse.json({ error: 'Missing agent_id' }, { status: 400 });
    }

    // Ajan için olan komutları bul (henüz çalıştırılmamış)
    // Ya hedef doğrudan bu ajan olmalı, ya da tüm ajanları kapsayan (NULL) bir tenant komutu olmalı.
    const commands = await prisma.agentCommand.findMany({
      where: {
        tenantId: apiKey.tenantId,
        executed: false,
        OR: [
          { targetAgentId: agentId },
          { targetAgentId: null }
        ]
      },
      orderBy: { createdAt: 'asc' },
    });

    if (commands.length > 0) {
      await prisma.agentCommand.updateMany({
        where: {
          id: { in: commands.map((c) => c.id) },
          status: 'pending',
        },
        data: { status: 'delivered', executed: false },
      });
    }

    return NextResponse.json({ commands });
  } catch (error) {
    console.error('Fetch commands error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Dashboard'dan yeni komut oluşturmak için kullanılır.
// JWT middleware tarafından doğrulanır, header'da X-User-Tenant ve X-User-Role vardır.
export async function POST(request: Request) {
  try {
    const userRole = request.headers.get('x-user-role');
    const userTenant = request.headers.get('x-user-tenant')
      || request.headers.get('X-User-Tenant');
    if (!userRole) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { commandType, payload, targetAgentId, targetTenantId, reason: banReason } = body;

    if (!commandType || !payload) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Admin istediği tenant'a komut atabilir, normal kullanıcı sadece kendi tenant'ına atabilir
    const finalTenantId = userRole === 'admin' && targetTenantId ? targetTenantId : userTenant;

    const command = await prisma.agentCommand.create({
      data: {
        tenantId: finalTenantId as string,
        targetAgentId: targetAgentId || null,
        commandType,
        payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
      },
    });

    let immediateBan = null as Awaited<ReturnType<typeof executeGuardianBan>> | null;
    if (
      userRole === 'admin' &&
      (commandType === 'BAN_IP' || commandType === 'UNBAN_IP')
    ) {
      const ip = (typeof payload === 'string' ? payload : String(payload)).trim();
      const reason =
        typeof banReason === 'string' && banReason
          ? banReason
          : 'dashboard-fleet';
      immediateBan = await executeGuardianBan({
        ip,
        action: commandType === 'UNBAN_IP' ? 'unban' : 'ban',
        reason,
      });
      if (immediateBan.ok) {
        await prisma.agentCommand.update({
          where: { id: command.id },
          data: { executed: true, status: 'completed' },
        });
      }
    }

    return NextResponse.json({
      success: true,
      command,
      immediateBan,
      message: immediateBan?.ok
        ? immediateBan.message
        : immediateBan
          ? `${commandType} kuyruğa alındı (anında ban: ${immediateBan.message})`
          : `${commandType} kuyruğa alındı`,
    });
  } catch (error) {
    console.error('Create command error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
