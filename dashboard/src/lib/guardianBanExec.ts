import { execFile } from "child_process";
import { promisify } from "util";
import { IPV4_RE } from "./banUtils";
import { guardianApiBase } from "./guardianApiBase";

const execFileAsync = promisify(execFile);

export { IPV4_RE } from "./banUtils";
export type BanAction = "ban" | "unban";

export type GuardianBanResult = {
  ok: boolean;
  via: "analyzer_api" | "cli" | "queued_only";
  ip: string;
  action: BanAction;
  message: string;
  detail?: string;
};

export async function executeGuardianBan(opts: {
  ip: string;
  action?: BanAction;
  reason?: string;
}): Promise<GuardianBanResult> {
  const ip = opts.ip.trim();
  const action = opts.action ?? "ban";
  const reason = opts.reason ?? "dashboard-ban";

  if (!IPV4_RE.test(ip)) {
    return {
      ok: false,
      via: "queued_only",
      ip,
      action,
      message: "Geçersiz IPv4",
    };
  }

  const apiBase = guardianApiBase();
  if (apiBase) {
    const apiToken = process.env.GUARDIAN_API_TOKEN?.trim();
    if (!apiToken) {
      return {
        ok: false,
        via: "analyzer_api",
        ip,
        action,
        message:
          "GUARDIAN_API_TOKEN eksik — bash scripts/sync_dashboard_api_token.sh",
      };
    }
    try {
      const path = action === "unban" ? "/api/v1/unban" : "/api/v1/ban";
      const url = `${apiBase}${path}?ip=${encodeURIComponent(ip)}&reason=${encodeURIComponent(reason)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiToken}` },
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });
      const body = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
        path?: string;
      };
      if (res.ok && body.success !== false) {
        return {
          ok: true,
          via: "analyzer_api",
          ip,
          action,
          message:
            action === "unban"
              ? `${ip} engeli kaldırıldı (kernel)`
              : `${ip} kernel seviyesinde engellendi`,
          detail: body.path,
        };
      }
      return {
        ok: false,
        via: "analyzer_api",
        ip,
        action,
        message: body.error || `Analyzer API HTTP ${res.status}`,
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      /* CLI fallback below */
      if (!process.env.GUARDIAN_BIN) {
        return {
          ok: false,
          via: "analyzer_api",
          ip,
          action,
          message: `Analyzer API erişilemedi: ${msg}`,
        };
      }
    }
  }

  const bin = process.env.GUARDIAN_BIN || "log-guardian";
  const rules = process.env.GUARDIAN_RULES || "/etc/log-guardian/rules.conf";
  const args =
    action === "unban"
      ? ["unban", ip, "--rules", rules]
      : ["ban", ip, "--reason", reason, "--rules", rules];

  try {
    const { stdout, stderr } = await execFileAsync(bin, args, {
      timeout: 15_000,
      env: { ...process.env },
    });
    const out = (stdout || stderr || "").trim();
    const ok = /\[OK\]/i.test(out) || out.length === 0;
    return {
      ok,
      via: "cli",
      ip,
      action,
      message: ok
        ? action === "unban"
          ? `${ip} unban (CLI)`
          : `${ip} ban (CLI)`
        : out || "CLI ban başarısız",
      detail: out,
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      via: "cli",
      ip,
      action,
      message: msg,
    };
  }
}
