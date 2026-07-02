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

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
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
      return { kind: "live-demo", ips, api: demo.api };
    }
  }

  const flag = await readJsonFile<{ mode?: string }>(
    path.join(dataDir, "bans-preview-mode.json"),
  );
  if (flag?.mode === "proof") return { kind: "proof" };

  return { kind: "live" };
}
