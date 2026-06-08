import { readFile } from "fs/promises";
import path from "path";

/** Repo kökündeki JSON artefaktları (dashboard/, proje kökü, /data/lg). */
export async function readRepoJson<T = unknown>(name: string): Promise<T | null> {
  const benchDir = process.env.BENCH_DATA_DIR || "/data/lg";
  const candidates = [
    path.join(benchDir, name),
    path.join(process.cwd(), name),
    path.join(process.cwd(), "..", name),
  ];
  for (const p of candidates) {
    try {
      const raw = await readFile(p, "utf8");
      return JSON.parse(raw) as T;
    } catch {
      /* next */
    }
  }
  return null;
}

export function repoRoot(): string {
  const cwd = process.cwd();
  return cwd.endsWith(`${path.sep}dashboard`) ? path.join(cwd, "..") : cwd;
}
