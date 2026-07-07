"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, MessageSquare, RefreshCw } from "lucide-react";
import { webhookSetupDocHref } from "@/lib/gateTestDocs";
import { useLanguage } from "./LanguageProvider";

type WebhookOps = {
  data_mode?: "live" | "proof" | "unknown";
  telegram_enabled?: boolean;
  telegram_route?: boolean;
  batch_sec?: number;
  batch_active?: boolean;
  queue_depth?: number;
  ack_24h?: number;
  unacked_24h?: number;
  quiet_active?: boolean;
  dry_run?: boolean;
  proof_pass?: boolean;
  proof_mode?: string | null;
  prod_e2e_ok?: boolean;
  prod_e2e_at?: string | null;
  prod_e2e_metrics_delta?: number | null;
  prod_e2e_alerts?: number | null;
  undo_e2e_ok?: boolean;
  undo_e2e_at?: string | null;
  undo_e2e_ip?: string | null;
  undo_e2e_mode?: string | null;
  webhook_sent?: number;
  webhook_fail?: number;
  webhook_drops?: number;
};

export function WebhookOpsPanel() {
  const { t } = useLanguage();
  const [data, setData] = useState<WebhookOps | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/webhook-ops", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      setData((await res.json()) as WebhookOps);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const ms = data?.data_mode === "live" ? 5000 : 15000;
    const id = setInterval(load, ms);
    return () => clearInterval(id);
  }, [load, data?.data_mode]);

  if (loading) {
    return <div className="glass-panel h-28 animate-pulse" />;
  }

  const batchSec = data?.batch_sec ?? 0;
  const routeOn = data?.telegram_route;

  return (
    <div className="glass-panel p-5 border border-violet-500/15" id="webhook-ops">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-violet-300">
          <Bell className="w-5 h-5" />
          {t("webhookOpsTitle")}
        </h2>
        <div className="flex items-center gap-2">
          {data?.data_mode === "live" && (
            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-300 bg-emerald-500/10">
              {t("attackMapLive")}
            </span>
          )}
          {data?.proof_pass && data.data_mode !== "live" && (
            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border border-amber-500/30 text-amber-300 bg-amber-500/10">
              {t("webhookOpsProof")}
            </span>
          )}
          <Link href="/tests" className="text-xs text-violet-400/70 hover:text-violet-300 hover:underline">
            {t("testsViewAll")} →
          </Link>
          <button
            type="button"
            onClick={() => void load()}
            className="text-xs px-2 py-1 rounded border border-white/10 text-white/60 hover:text-white"
          >
            <RefreshCw className="w-3 h-3 inline" />
          </button>
        </div>
      </div>

      <p className="text-xs text-white/45 mb-4">{t("webhookOpsSubtitle")}</p>

      {data?.prod_e2e_ok && (
        <div className="mb-4 rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-200/90">
          {t("webhookOpsProdE2eOk")}
          {data.prod_e2e_metrics_delta != null && (
            <span className="text-white/50">
              {" "}
              · Δ{data.prod_e2e_metrics_delta} msg
              {data.prod_e2e_alerts != null ? ` · ${data.prod_e2e_alerts} alarm` : ""}
              {data.prod_e2e_at ? ` · ${data.prod_e2e_at.slice(0, 16).replace("T", " ")}` : ""}
            </span>
          )}
        </div>
      )}

      {data?.undo_e2e_ok && (
        <div className="mb-4 rounded-lg border border-cyan-500/25 bg-cyan-500/5 px-3 py-2 text-xs text-cyan-200/90">
          {t("webhookOpsUndoE2eOk")}
          <span className="text-white/50">
            {" "}
            · {data.undo_e2e_mode ?? "SIGUSR2"}
            {data.undo_e2e_ip ? ` · ${data.undo_e2e_ip}` : ""}
            {data.undo_e2e_at ? ` · ${data.undo_e2e_at.slice(0, 16).replace("T", " ")}` : ""}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] uppercase tracking-wide text-white/35 mb-1">{t("webhookOpsRoute")}</p>
          <p className={`text-lg font-bold ${routeOn ? "text-emerald-400" : "text-white/40"}`}>
            {routeOn ? "ON" : "OFF"}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] uppercase tracking-wide text-white/35 mb-1 flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {t("webhookOpsBatch")}
          </p>
          <p className="text-lg font-bold text-violet-300">
            {batchSec > 0 ? `${batchSec}s` : t("webhookOpsBatchOff")}
          </p>
          {batchSec > 0 && (
            <p className="text-[10px] text-white/35 mt-1">{t("webhookOpsBatchHint")}</p>
          )}
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] uppercase tracking-wide text-white/35 mb-1">{t("webhookOpsAck")}</p>
          <p className="text-lg font-bold text-cyan-300">
            {data?.ack_24h ?? 0}
            <span className="text-sm font-normal text-white/40"> / {data?.unacked_24h ?? 0}</span>
          </p>
          <p className="text-[10px] text-white/35 mt-1">{t("webhookOpsAckHint")}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] uppercase tracking-wide text-white/35 mb-1">{t("webhookOpsQueue")}</p>
          <p className="text-lg font-bold text-white/80">{data?.queue_depth ?? 0}</p>
          {data?.quiet_active && (
            <p className="text-[10px] text-amber-400/80 mt-1">{t("webhookOpsQuiet")}</p>
          )}
          {data?.dry_run && (
            <p className="text-[10px] text-amber-400/60 mt-1">DRY-RUN</p>
          )}
        </div>
      </div>

      {(data?.webhook_sent ?? 0) > 0 ||
      (data?.webhook_fail ?? 0) > 0 ||
      (data?.webhook_drops ?? 0) > 0 ? (
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-white/35">{t("webhookOpsSent")}</p>
            <p className="text-sm font-semibold text-emerald-300">{data?.webhook_sent ?? 0}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-white/35">{t("webhookOpsFail")}</p>
            <p className="text-sm font-semibold text-rose-300">{data?.webhook_fail ?? 0}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-white/35">{t("webhookOpsDrops")}</p>
            <p
              className={`text-sm font-semibold ${
                (data?.webhook_drops ?? 0) > 1000 ? "text-amber-300" : "text-white/80"
              }`}
              title={(data?.webhook_drops ?? 0) > 1000 ? t("webhookOpsDropsHint") : undefined}
            >
              {(data?.webhook_drops ?? 0).toLocaleString()}
            </p>
            {(data?.webhook_drops ?? 0) > 0 && (
              <p className="text-[10px] text-amber-300/80 mt-1 leading-snug">
                {t("webhookOpsDropsRunbook")}{" "}
                <a
                  href={webhookSetupDocHref()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-400/80 hover:text-violet-300 hover:underline"
                >
                  {t("webhookOpsDropsDocLink")}
                </a>
                {" · "}
                <Link
                  href="/tests#test-webhook-route-proof"
                  className="text-violet-400/80 hover:text-violet-300 hover:underline"
                >
                  {t("webhookOpsDropsTestLink")}
                </Link>
              </p>
            )}
          </div>
        </div>
      ) : null}

      <p className="text-[10px] text-white/30 mt-3 flex flex-wrap gap-x-2 gap-y-1">
        <Link href="/#soc-ack" className="text-violet-400/70 hover:text-violet-300 hover:underline">
          {t("socKindAck")}
        </Link>
        <span className="text-white/20">·</span>
        <Link href="/bans" className="text-violet-400/70 hover:text-violet-300 hover:underline">
          {t("navBans")}
        </Link>
        <span className="text-white/20">·</span>
        <Link href="/tests?q=telegram" className="text-violet-400/70 hover:text-violet-300 hover:underline">
          {t("testsViewAll")}
        </Link>
      </p>
    </div>
  );
}
