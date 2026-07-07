import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { executeGuardianBan } from '@/lib/guardianBanExec';
import { invalidateAllBansCache } from '@/lib/bansCache';
import { validateFleetCommand } from '@/lib/fleetCommandValidate';
import {
  createSignedFleetCommand,
  verifyFleetCommandSignature,
} from '@/lib/fleetCommandSign';

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
        status: 'pending',
        OR: [
          { targetAgentId: agentId },
          { targetAgentId: null }
        ]
      },
      orderBy: { createdAt: 'asc' },
    });

    const deliverable = commands.filter((cmd) => verifyFleetCommandSignature(cmd));

    if (deliverable.length > 0) {
      await prisma.agentCommand.updateMany({
        where: {
          id: { in: deliverable.map((c) => c.id) },
          status: 'pending',
        },
        data: { status: 'delivered' },
      });
    }

    return NextResponse.json({ commands: deliverable });
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

    const validationErr = validateFleetCommand(body);
    if (validationErr) {
      return NextResponse.json({ error: validationErr }, { status: 400 });
    }

    if (!commandType || !payload) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Admin istediği tenant'a komut atabilir, normal kullanıcı sadece kendi tenant'ına atabilir
    const finalTenantId = userRole === 'admin' && targetTenantId ? targetTenantId : userTenant;

    const command = await createSignedFleetCommand(prisma, {
      tenantId: finalTenantId as string,
      targetAgentId: targetAgentId || null,
      commandType,
      payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
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
        invalidateAllBansCache();
        await prisma.agentCommand.update({
          where: { id: command.id },
          data: { executed: true, status: 'completed' },
        });
      }
    }

    const executedNow =
      immediateBan != null &&
      (commandType === 'BAN_IP' || commandType === 'UNBAN_IP');

    return NextResponse.json({
      success: executedNow ? immediateBan!.ok : true,
      command,
      immediateBan,
      message: immediateBan?.ok
        ? immediateBan.message
        : immediateBan
          ? immediateBan.message
          : `${commandType} kuyruğa alındı`,
    });
  } catch (error) {
    console.error('Create command error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
