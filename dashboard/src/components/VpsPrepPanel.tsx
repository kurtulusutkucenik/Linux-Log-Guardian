"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardCopy, Cloud, RefreshCw, Server } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

type VpsPrepStatus = {
  at?: string | null;
  pass?: boolean;
  laptop_mode?: boolean;
  vps_available?: boolean;
  competitive_proof?: string | null;
  xdp_mode?: string | null;
  steps?: string[];
  doc?: string;
  remote?: {
    pass?: boolean;
    reachable?: boolean;
    host_up?: boolean;
    ssh_ok?: boolean;
    auth_error?: boolean;
    connection_error?: boolean;
    at?: string | null;
    host?: string | null;
    port?: number;
    hostname?: string | null;
    remote_root?: string | null;
    xdp_mode?: string | null;
    soak_active?: boolean;
    soak_mode?: string | null;
    soak_elapsed?: string | null;
    soak_progress?: number | null;
    soak_proof_72h?: number | null;
    soak_synced?: boolean;
    soak_failures?: string | null;
    eps?: number | null;
    excerpt?: string | null;
    hint?: string | null;
  } | null;
  setup?: {
    gate?: string;
    doc?: string;
    xdp?: string;
    remote?: string;
    remote_host?: string;
    ssh_copy_id?: string;
  };
};

export function VpsPrepPanel() {
  const { t } = useLanguage();
  const [data, setData] = useState<VpsPrepStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const gateCmd = data?.setup?.gate ?? "bash scripts/vps_prep_gate.sh";
  const remoteCmd =
    data?.setup?.remote ??
    "QUIET=1 source .cache/vps-production.env && bash scripts/vps_remote_status.sh";
  const sshCopyCmd =
    data?.setup?.ssh_copy_id ??
    (data?.remote?.host ? `ssh-copy-id ${data.remote.host}` : "ssh-copy-id root@HOST");
  const remote = data?.remote;

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vps-prep-status", { cache: "no-store" });
      if (!res.ok) return;
      setData((await res.json()) as VpsPrepStatus);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const pass = data?.pass === true;
  const handsOff =
    Boolean(remote?.ssh_ok) && (remote?.soak_proof_72h ?? 0) >= 72;

  return (
    <div className="rounded-lg border border-sky-500/25 bg-sky-500/5 px-4 py-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Cloud className="w-4 h-4 text-sky-300" />
        <h3 className="text-sm font-semibold text-sky-200">
          {t(handsOff ? "vpsPrepTitleLive" : "vpsPrepTitle")}
        </h3>
        <Link
          href="https://github.com/ceniklinux/log-guardian/blob/main/docs/VPS_SETUP.md"
          className="text-xs text-sky-300/80 hover:text-sky-200 underline-offset-2 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("vpsPrepDocLink")}
        </Link>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border border-white/10 text-white/50 hover:text-white/80 disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          {t("vpsPrepRefresh")}
        </button>
      </div>
      <p className="text-xs text-white/45">
        {t(handsOff ? "vpsPrepDescLive" : "vpsPrepDesc")}
      </p>
      <div className="flex flex-wrap gap-2">
        <span
          className={`text-xs font-mono px-2 py-1 rounded-md border ${
            pass
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-amber-500/10 border-amber-500/30 text-amber-200"
          }`}
        >
          gate: {pass ? "OK" : "WARN"}
        </span>
        <span className="text-xs font-mono px-2 py-1 rounded-md border bg-white/5 border-white/10 text-white/50">
          {data?.laptop_mode !== false && !remote?.ssh_ok ? "laptop" : "vps"} · proof{" "}
          {data?.competitive_proof ?? "—"}
        </span>
        {data?.xdp_mode && (
          <span className="text-xs font-mono px-2 py-1 rounded-md border bg-white/5 border-white/10 text-white/40">
            xdp: {data.xdp_mode}
          </span>
        )}
        {remote?.soak_active && remote.soak_mode !== "72h" && (remote.soak_proof_72h ?? 0) < 72 && (
          <span
            className="text-xs font-mono px-2 py-1 rounded-md border bg-white/5 border-white/10 text-white/45"
            title={remote.soak_elapsed ? `elapsed ${remote.soak_elapsed}` : undefined}
          >
            {t("vpsPrepSoakWatch")}: {remote.soak_mode ?? "?"}
            {remote.soak_progress != null ? ` · ${remote.soak_progress}%` : ""}
          </span>
        )}
        {(remote?.soak_proof_72h ?? 0) >= 72 && (
          <span className="text-xs font-mono px-2 py-1 rounded-md border bg-emerald-500/10 border-emerald-500/30 text-emerald-300">
            72h {t("vpsPrepSoakProof")}
          </span>
        )}
        {remote?.ssh_ok && typeof remote.eps === "number" && (
          <span className="text-xs font-mono px-2 py-1 rounded-md border bg-white/5 border-white/10 text-white/40">
            eps: {remote.eps}
          </span>
        )}
        {remote && (
          <span
            className={`text-xs font-mono px-2 py-1 rounded-md border ${
              remote.ssh_ok || remote.reachable
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : remote.auth_error || remote.host_up
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
                  : "bg-white/5 border-white/10 text-white/40"
            }`}
            title={remote.hint ?? remote.excerpt ?? undefined}
          >
            {t("vpsPrepRemote")}:{" "}
            {remote.ssh_ok || remote.reachable
              ? "SSH OK"
              : remote.auth_error
                ? t("vpsPrepRemoteAuthFail")
                : remote.host_up
                  ? t("vpsPrepRemoteHostUp")
                  : "—"}
            {remote.host ? ` · ${remote.host}` : ""}
          </span>
        )}
      </div>
      {remote?.auth_error && (
        <p className="text-xs text-amber-200/90">{t("vpsPrepRemoteAuthHint")}</p>
      )}
      {(remote?.soak_proof_72h ?? 0) >= 72 && (
        <p className="text-xs text-emerald-300/80">{t("vpsPrepHandsOff")}</p>
      )}
      {remote?.ssh_ok && (remote.hostname || remote.remote_root) && (
        <p className="text-[11px] text-white/40 font-mono">
          {remote.hostname ? `${remote.hostname}` : ""}
          {remote.remote_root && remote.remote_root !== "/root"
            ? ` · ${remote.remote_root}`
            : remote.remote_root === "/root"
              ? " · repo: /root/Linux-Log-Guardian"
              : ""}
        </p>
      )}
      {remote?.excerpt && !remote.auth_error && !remote.ssh_ok && (
        <p className="text-[11px] text-white/40 font-mono truncate" title={remote.excerpt}>
          {remote.excerpt}
        </p>
      )}
      {data?.steps && data.steps.length > 0 && (
        <ul className="text-[11px] text-white/40 font-mono space-y-1 list-disc list-inside">
          {data.steps.slice(0, 4).map((s) => (
            <li key={s} className="truncate">
              {s}
            </li>
          ))}
          {data.steps.length > 4 && (
            <li className="text-white/30">+{data.steps.length - 4} …</li>
          )}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <code className="text-[11px] text-white/50 font-mono bg-black/30 px-2 py-1 rounded border border-white/10">
          {gateCmd}
        </code>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(gateCmd);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              /* ignore */
            }
          }}
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-sky-500/15 border border-sky-500/30 text-sky-200 hover:bg-sky-500/25"
        >
          <ClipboardCopy className="w-3.5 h-3.5" />
          {copied ? t("vpsPrepCopied") : t("vpsPrepCopyGate")}
        </button>
        <span className="text-xs text-white/35 flex items-center gap-1">
          <Server className="w-3.5 h-3.5" />
          {remote?.ssh_ok || remote?.reachable
            ? t("vpsPrepRemoteLive")
            : remote?.auth_error
              ? t("vpsPrepRemoteNeedKey")
              : t("vpsPrepPaused")}
        </span>
      </div>
      {remote?.auth_error && (
        <div className="flex flex-wrap items-center gap-2">
          <code className="text-[11px] text-white/50 font-mono bg-black/30 px-2 py-1 rounded border border-amber-500/25">
            {sshCopyCmd}
          </code>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(sshCopyCmd);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch {
                /* ignore */
              }
            }}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-200 hover:bg-amber-500/25"
          >
            <ClipboardCopy className="w-3.5 h-3.5" />
            {copied ? t("vpsPrepCopied") : t("vpsPrepCopySshKey")}
          </button>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <code className="text-[11px] text-white/45 font-mono bg-black/20 px-2 py-1 rounded border border-white/10">
          {remoteCmd}
        </code>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(remoteCmd);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              /* ignore */
            }
          }}
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-white/5 border border-white/10 text-white/50 hover:text-white/80"
        >
          <ClipboardCopy className="w-3.5 h-3.5" />
          {copied ? t("vpsPrepCopied") : t("vpsPrepCopyRemote")}
        </button>
        <span className="text-xs text-white/35">{t("vpsPrepRemoteHint")}</span>
      </div>
    </div>
  );
}
