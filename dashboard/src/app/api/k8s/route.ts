import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface K8sKillEvent {
  id: string;
  timestamp: string;
  pid: number;
  container_id: string;
  workload_name: string;
  parent_comm: string;
  exec_filename: string;
  argv1: string;
}

// In-memory ring buffer for the last 100 kills
const killLog: K8sKillEvent[] = [];
const MAX_LOG_SIZE = 100;

export async function GET() {
  return NextResponse.json({
    totalKills: killLog.length, // This should ideally be aggregated from fleet DB if persisted
    recentKills: killLog
  });
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    const newEvent: K8sKillEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date(Number(data.timestamp_ns) / 1000000).toISOString(),
      pid: data.pid,
      container_id: data.container_id,
      workload_name: data.workload_name,
      parent_comm: data.parent_comm,
      exec_filename: data.exec_filename,
      argv1: data.argv1,
    };

    killLog.unshift(newEvent);
    if (killLog.length > MAX_LOG_SIZE) {
      killLog.pop();
    }

    // Forward the payload to the actual Go K8s Operator if running locally?
    // Actually, in the architecture, Guardian C engine can either send to this dashboard
    // OR directly to K8s Operator.
    // If it sends to Operator, Operator could forward to Dashboard.
    // Let's just assume Guardian sends to Dashboard for telemetry, and Operator for action.
    // Or Guardian sends to Operator, and Operator forwards to Dashboard.
    // For now, this endpoint accepts logs to display on the dashboard.

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Failed to parse k8s kill event:', error);
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }
}
