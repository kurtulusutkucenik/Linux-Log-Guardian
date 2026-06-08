// dashboard/src/app/api/copilot/action/route.ts — AI Auto-Remediation (Feature 2)
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { executeGuardianBan } from '@/lib/guardianBanExec';

export const dynamic = 'force-dynamic';

type ActionType = 'BAN_IP' | 'UNBAN_IP' | 'PUSH_WAF_RULE' | 'PUSH_THREAT_FEED' |
                  'PUSH_CONFIG' | 'UPDATE_THRESHOLD' | 'PUSH_SCHEMA' | 'PUSH_WASM_PLUGIN';

interface CopilotAction {
  action: ActionType;
  params: Record<string, string | number | boolean>;
  reason: string;
}

export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get('x-user-tenant') || '';
    const userRole  = request.headers.get('x-user-role') || '';

    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: {
      action: CopilotAction;
      targetAgentId?: string;
      executeNow?: boolean;
    } = await request.json();
    const { action, targetAgentId, executeNow } = body;

    if (!action?.action) {
      return NextResponse.json({ error: 'action.action required' }, { status: 400 });
    }

    // Auto-remediation güvenlik kısıtlaması: sadece admin
    if (userRole !== 'admin' &&
        ['BAN_IP','PUSH_WAF_RULE','PUSH_THREAT_FEED','PUSH_SCHEMA','PUSH_WASM_PLUGIN']
          .includes(action.action)) {
      return NextResponse.json(
        { error: 'Admin role required for remediation actions' },
        { status: 403 }
      );
    }

    // Payload oluştur
    let payload = '';
    switch (action.action) {
      case 'BAN_IP':
        payload = String(action.params.ip || '');
        break;
      case 'UNBAN_IP':
        payload = String(action.params.ip || '');
        break;
      case 'PUSH_WAF_RULE':
        payload = `SET ${action.params.key} ${action.params.value}`;
        break;
      case 'PUSH_THREAT_FEED':
        payload = String(action.params.ips || '');
        break;
      case 'UPDATE_THRESHOLD':
        payload = `SET ${action.params.metric} ${action.params.value}`;
        break;
      case 'PUSH_CONFIG':
        payload = String(action.params.config || '');
        break;
      case 'PUSH_SCHEMA':
        payload = String(action.params.schemaPath || '');
        break;
      case 'PUSH_WASM_PLUGIN':
        payload = String(action.params.pluginPath || '');
        break;
      default:
        return NextResponse.json({ error: 'Unknown action type' }, { status: 400 });
    }

    if (!payload) {
      return NextResponse.json({ error: 'Empty payload for action' }, { status: 400 });
    }

    // AgentCommand olarak kaydet
    const command = await prisma.agentCommand.create({
      data: {
        tenantId,
        targetAgentId: targetAgentId || null,
        commandType: action.action,
        payload,
        executed: false,
      },
    });

    const targetDesc = targetAgentId
      ? `Agent ${targetAgentId}`
      : 'Tüm filo';

    let executedNow = false;
    let executionError: string | null = null;

    if (executeNow && (action.action === 'BAN_IP' || action.action === 'UNBAN_IP')) {
      const banResult = await executeGuardianBan({
        ip: payload,
        action: action.action === 'UNBAN_IP' ? 'unban' : 'ban',
        reason: action.reason || 'copilot-ban',
      });
      if (banResult.ok) {
        executedNow = true;
      } else {
        executionError = banResult.message;
      }
    }

    return NextResponse.json({
      success: true,
      commandId: command.id,
      action: action.action,
      payload,
      target: targetDesc,
      reason: action.reason,
      executedNow,
      executionError,
      message: executedNow
        ? `✅ ${action.action} uygulandi: ${payload} (filo kuyrugu + aninda ban)`
        : `✅ Komut kuyruğa alındı: ${action.action} → ${targetDesc}`,
      enqueuedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Copilot action error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET: Son auto-remediation aksiyonlarını listele
export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get('x-user-tenant') || '';
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const commands = await prisma.agentCommand.findMany({
      where: {
        tenantId,
        commandType: {
          in: ['BAN_IP','UNBAN_IP','PUSH_WAF_RULE','PUSH_THREAT_FEED',
               'PUSH_CONFIG','PUSH_SCHEMA','PUSH_WASM_PLUGIN','UPDATE_THRESHOLD'],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ actions: commands, total: commands.length });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
