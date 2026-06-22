// dashboard/src/app/api/attack-tree/route.ts — eBPF Attack Tree (live-first)
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { readFile } from 'fs/promises';
import path from 'path';
import os from 'os';
import { treeToGraph, treesToGraph, type AttackTree } from '@/lib/lineageGraph';
import { guardianApiAuthHeaders } from '@/lib/guardianApiAuth';
import { guardianApiBase } from '@/lib/guardianApiBase';

export const dynamic = 'force-dynamic';

export type LineageSource =
  | 'telemetry'
  | 'guardian_api'
  | 'daemon_file'
  | 'demo'
  | 'empty';

export type LineageDataMode = 'live' | 'preview' | 'none';

interface AttackTreeNode {
  pid: number;
  comm: string;
  risk: number;
  agentId?: string;
  events?: unknown[];
  firstSeen?: number;
  lastSeen?: number;
}

function allowDemoFallback(request: Request): boolean {
  if (process.env.LINEAGE_ALLOW_DEMO === '1') return true;
  const { searchParams } = new URL(request.url);
  return searchParams.get('allow_demo') === '1' || searchParams.get('preview') === '1';
}

async function fetchFromAnalyzerApi(): Promise<AttackTreeNode[] | null> {
  const base = guardianApiBase();
  try {
    const res = await fetch(`${base}/api/v1/attack-tree`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(2000),
      headers: guardianApiAuthHeaders(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data.trees)) return data.trees as AttackTreeNode[];
    return null;
  } catch {
    return null;
  }
}

type LocalTreeResult = { trees: AttackTreeNode[]; source: 'daemon_file' | 'demo' };

function isDemoTreePath(treePath: string): boolean {
  const base = path.basename(treePath);
  return base === 'lineage-demo.json' || base.includes('demo');
}

async function readLocalAttackTreeFile(
  permitDemo: boolean,
): Promise<LocalTreeResult | null> {
  const liveCandidates = [
    process.env.ATTACK_TREE_PATH,
    "/data/lg/attack_tree.json",
    "/run/log-guardian/attack_tree.json",
    '/var/lib/log-guardian/attack_tree.json',
    path.join(process.cwd(), 'attack_tree.json'),
    path.join(process.cwd(), '..', 'attack_tree.json'),
    path.join(process.cwd(), '..', 'corpus', 'lineage_live_snapshot.json'),
    path.join(process.cwd(), 'corpus', 'lineage_live_snapshot.json'),
    path.join(os.homedir(), '.local/share/log-guardian/attack_tree.json'),
  ].filter(Boolean) as string[];

  const demoCandidates = permitDemo
    ? [
        path.join(process.cwd(), '..', 'rules', 'lineage-demo.json'),
        path.join(process.cwd(), 'rules', 'lineage-demo.json'),
      ]
    : [];

  for (const treePath of [...liveCandidates, ...demoCandidates]) {
    try {
      const raw = await readFile(treePath, 'utf8');
      const parsed = JSON.parse(raw);
      let trees: AttackTreeNode[] | null = null;
      if (Array.isArray(parsed)) trees = parsed as AttackTreeNode[];
      else if (parsed?.trees && Array.isArray(parsed.trees)) trees = parsed.trees;
      if (trees && trees.length > 0) {
        const isDemo = isDemoTreePath(treePath);
        if (isDemo && !permitDemo) continue;
        return {
          trees,
          source: isDemo ? 'demo' : 'daemon_file',
        };
      }
    } catch {
      /* try next path */
    }
  }
  return null;
}

function mergeAgentTrees(agents: { agentId: string; attackTreeJson: string }[]): AttackTreeNode[] {
  const out: AttackTreeNode[] = [];
  for (const a of agents) {
    try {
      const trees = JSON.parse(a.attackTreeJson || '[]');
      if (!Array.isArray(trees)) continue;
      for (const t of trees) {
        out.push({ ...t, agentId: a.agentId });
      }
    } catch {
      /* skip malformed */
    }
  }
  return out;
}

function toDataMode(source: LineageSource): LineageDataMode {
  if (source === 'demo') return 'preview';
  if (source === 'empty') return 'none';
  return 'live';
}

type GuardianProbes = {
  ipc?: string;
  lineage_probe?: boolean;
  l7_probe?: boolean;
  l7_ebpf_hits?: number;
};

async function readGuardianProbes(): Promise<GuardianProbes | null> {
  const candidates = [
    path.join(process.cwd(), 'guardian-status.json'),
    path.join(process.cwd(), '..', 'guardian-status.json'),
  ];
  for (const p of candidates) {
    try {
      const raw = await readFile(p, 'utf8');
      const d = JSON.parse(raw) as {
        ipc?: string;
        daemon?: { lineage_probe?: boolean; l7_probe?: boolean };
        l7_http?: { ebpf_hits?: number; probe_active?: boolean | string };
      };
      const active =
        d.l7_http?.probe_active === true || d.l7_http?.probe_active === 'true';
      return {
        ipc: d.ipc,
        lineage_probe: d.daemon?.lineage_probe,
        l7_probe: d.daemon?.l7_probe ?? active,
        l7_ebpf_hits: d.l7_http?.ebpf_hits,
      };
    } catch {
      /* next */
    }
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent_id') || '*';
    const minRisk = parseFloat(searchParams.get('min_risk') || '0');
    const permitDemo = allowDemoFallback(request);

    let trees: AttackTreeNode[] = [];
    let source: LineageSource = 'empty';

    const agents = await prisma.telemetry.findMany({
      where: agentId !== '*' ? { agentId } : undefined,
      select: { agentId: true, attackTreeJson: true },
      orderBy: { lastSeen: 'desc' },
      take: 32,
    });

    if (agents.length > 0) {
      trees = mergeAgentTrees(agents);
      source = 'telemetry';
    }

    if (trees.length === 0) {
      const apiTrees = await fetchFromAnalyzerApi();
      if (apiTrees && apiTrees.length > 0) {
        trees = apiTrees;
        source = 'guardian_api';
      }
    }
    if (trees.length === 0) {
      const local = await readLocalAttackTreeFile(permitDemo);
      if (local) {
        trees = local.trees;
        source = local.source;
      }
    }

    const filtered = trees.filter((t) => (t.risk ?? 0) >= minRisk) as AttackTree[];
    const graph = treesToGraph(filtered);
    const dataMode = toDataMode(source);
    const live = dataMode === 'live';
    const probes = await readGuardianProbes();

    let setup_hint: string | undefined;
    if (source === 'empty') {
      setup_hint =
        'sudo ./log-guardian-daemon --iface eth0  # eBPF → /run/log-guardian/attack_tree.json';
    } else if (probes && probes.ipc === 'ok' && !probes.lineage_probe) {
      setup_hint =
        'Daemon IPC OK; lineage_probe kapali — BPF objeleri (lineage_probe.o) kontrol edin.';
    }

    return NextResponse.json({
      trees: filtered,
      total: filtered.length,
      high_risk: filtered.filter((t) => (t.risk ?? 0) >= 85).length,
      graph,
      source,
      data_mode: dataMode,
      live,
      preview_only: source === 'demo',
      probes,
      setup_hint,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Attack tree error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
