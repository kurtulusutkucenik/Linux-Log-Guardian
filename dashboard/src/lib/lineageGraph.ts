export type LineageEvent = {
  type: string;
  pid: number;
  ppid?: number;
  comm: string;
  detail: string;
  ts: number;
};

export type AttackTree = {
  pid: number;
  comm: string;
  risk: number;
  agentId?: string;
  events?: LineageEvent[];
  firstSeen?: number;
  lastSeen?: number;
};

export type GraphNode = {
  data: {
    id: string;
    label: string;
    kind: "process" | "event";
    pid?: number;
    risk?: number;
    eventType?: string;
  };
};

export type GraphEdge = {
  data: {
    id: string;
    source: string;
    target: string;
    label: string;
    detail?: string;
    eventType?: string;
  };
};

export type LineageGraphElements = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

const EVENT_COLORS: Record<string, string> = {
  FILE_READ: "#60a5fa",
  EXEC_SHELL: "#f87171",
  NET_CONNECT: "#c084fc",
  FILE_WRITE: "#fb923c",
  NET_RECV: "#22d3ee",
};

export function eventColor(type: string): string {
  return EVENT_COLORS[type] ?? "#94a3b8";
}

/** Attack tree → Cytoscape elements (process nodes + labeled edges) */
export function treeToGraph(tree: AttackTree, treeKey = "0"): LineageGraphElements {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const procNodes = new Map<number, string>();
  const commByPid = new Map<number, string>();

  commByPid.set(tree.pid, tree.comm);

  function ensureProcess(pid: number, comm: string, isRoot = false): string {
    const known = procNodes.get(pid);
    if (known) return known;
    const id = `p-${treeKey}-${pid}`;
    procNodes.set(pid, id);
    commByPid.set(pid, comm);
    nodes.push({
      data: {
        id,
        label: `${comm}\nPID ${pid}`,
        kind: "process",
        pid,
        risk: isRoot ? tree.risk : undefined,
      },
    });
    return id;
  }

  ensureProcess(tree.pid, tree.comm, true);

  const events = tree.events ?? [];
  let prevPid = tree.pid;

  events.forEach((ev, idx) => {
    commByPid.set(ev.pid, ev.comm);
    const target = ensureProcess(ev.pid, ev.comm, ev.pid === tree.pid);
    const parentPid =
      ev.ppid != null && ev.ppid > 0 ? ev.ppid : idx === 0 ? tree.pid : prevPid;
    const parentComm = commByPid.get(parentPid) ?? tree.comm;
    const source = ensureProcess(parentPid, parentComm, parentPid === tree.pid);

    edges.push({
      data: {
        id: `e-${treeKey}-${idx}`,
        source,
        target,
        label: ev.type.replace(/_/g, " "),
        detail: ev.detail,
        eventType: ev.type,
      },
    });
    prevPid = ev.pid;
  });

  return { nodes, edges };
}

export function treesToGraph(trees: AttackTree[]): LineageGraphElements {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  trees.forEach((t, i) => {
    const g = treeToGraph(t, String(i));
    nodes.push(...g.nodes);
    edges.push(...g.edges);
  });
  return { nodes, edges };
}

export function riskClass(risk: number): "high" | "medium" | "low" {
  if (risk >= 85) return "high";
  if (risk >= 60) return "medium";
  return "low";
}
