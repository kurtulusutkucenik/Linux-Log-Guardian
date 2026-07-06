import { readFile } from "fs/promises";
import path from "path";

export type BansDisplayMode =
  | { kind: "proof" }
  | { kind: "live-demo"; ips: string[]; api?: string }
  | { kind: "live" };

type LiveDemoReport = {
  pass?: boolean;
  bans_applied?: number;
  note?: string;
  ips?: string[];
  api?: string;
};

type ActiveBansFile = {
  ips?: string[];
  total_count?: number;
  source?: string;
};

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Demo rehearsal IP'leri disinda canli ipset ban varsa /bans + nav badge live moda gecer. */
export function ipsetLiveOverridesDemo(demoIps: string[], active: ActiveBansFile): boolean {
  const source = active.source || "ipset";
  if (source !== "ipset") return false;
  const liveIps = active.ips ?? [];
  const total = active.total_count ?? liveIps.length;
  if (total <= 0) return false;
  if (total > demoIps.length) return true;
  const demoSet = new Set(demoIps);
  return liveIps.some((ip) => !demoSet.has(ip));
}

/** Laptop operator: CLEANUP → proof; live demo → yalnizca demo IP'leri (22k ipset degil). */
export async function resolveBansDisplayMode(
  dataDir: string,
): Promise<BansDisplayMode> {
  const demo = await readJsonFile<LiveDemoReport>(
    path.join(dataDir, "dashboard-live-demo.json"),
  );
  if (demo) {
    const note = String(demo.note ?? "");
    if (note.includes("CLEANUP") || (demo.pass !== true && (demo.bans_applied ?? 0) === 0)) {
      return { kind: "proof" };
    }
    const ips = (demo.ips ?? []).filter((ip) => ip.includes("."));
    if (demo.pass === true && ips.length > 0) {
      const active = await readJsonFile<ActiveBansFile>(
        path.join(dataDir, "active_bans.json"),
      );
      if (active && ipsetLiveOverridesDemo(ips, active)) {
        return { kind: "live" };
      }
      return { kind: "live-demo", ips, api: demo.api };
    }
  }

  const flag = await readJsonFile<{ mode?: string }>(
    path.join(dataDir, "bans-preview-mode.json"),
  );
  if (flag?.mode === "proof") return { kind: "proof" };

  return { kind: "live" };
}
