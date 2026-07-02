"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "./LanguageProvider";

type Incident = {
  incident_id: string;
  ip: string;
  risk_score: number;
  suggested_action?: string;
  primary_signal?: string;
  log_hits?: number;
  signals?: number;
  first_ts?: number;
  last_ts?: number;
};

type IncidentDetail = Incident & {
  ebpf_chain?: string[];
  log_hits_detail?: { count?: number };
};

const SIGNAL_BITS: { bit: number; label: string }[] = [
  { bit: 1, label: "log_sqli" },
  { bit: 2, label: "log_waf" },
  { bit: 4, label: "log_brute" },
  { bit: 8, label: "ebpf_execve" },
  { bit: 16, label: "ebpf_lineage" },
  { bit: 32, label: "ebpf_outbound" },
];

function decodeSignals(n?: number): string[] {
  if (!n) return [];
  return SIGNAL_BITS.filter((s) => n & s.bit).map((s) => s.label);
}

function fmtTs(ts?: number): string {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleString();
}

export function IncidentsPanel() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [source, setSource] = useState<string>("");
  const [selected, setSelected] = useState<IncidentDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const openDetail = useCallback(async (inc: Incident) => {
    setLoadingDetail(true);
    setSelected({ ...inc });
    try {
      const r = await axios.get("/api/incidents", {
        params: { id: inc.incident_id },
      });
      const one = r.data.incident ?? r.data.incidents?.[0];
      if (one) setSelected(one);
    } catch {
      /* liste verisi yeterli */
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const openDetailById = useCallback(
    async (incidentId: string) => {
      setLoadingDetail(true);
      try {
        const r = await axios.get("/api/incidents", {
          params: { id: incidentId },
        });
        const one = r.data.incident ?? r.data.incidents?.[0];
        if (one) {
          setSelected(one);
          setLoadingDetail(false);
          return;
        }
      } catch {
        /* fallback stub */
      }
      setSelected({
        incident_id: incidentId,
        ip: "—",
        risk_score: 0,
      });
      setLoadingDetail(false);
    },
    [],
  );

  useEffect(() => {
    axios
      .get("/api/incidents")
      .then((r) => {
        setIncidents(r.data.incidents ?? []);
        setSource(r.data.source ?? "");
      })
      .catch(() => setIncidents([]));
  }, []);

  useEffect(() => {
    const deep = searchParams.get("incident");
    if (!deep) return;
    void openDetailById(deep);
  }, [searchParams, openDetailById]);


  const sourceLabel =
    source === "guardian_api"
      ? t("incidentsLive")
      : source === "snapshot"
        ? t("incidentsSnapshot")
        : source || t("incidentsEmptySource");

  const detailSignals = decodeSignals(selected?.signals);
  const ebpfSignals = detailSignals.filter((s) => s.startsWith("ebpf_"));
  const logSignals = detailSignals.filter((s) => s.startsWith("log_"));

  return (
    <>
      <div className="glass-panel p-4 border-l-4 border-l-amber-500/40">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50">
            {t("incidentsTitle")}
          </h3>
          <span
            className={`text-[10px] px-2 py-0.5 rounded border ${
              source === "guardian_api"
                ? "border-emerald-500/30 text-emerald-300 bg-emerald-500/10"
                : source === "snapshot"
                  ? "border-amber-500/30 text-amber-300 bg-amber-500/10"
                  : "border-white/15 text-white/40"
            }`}
          >
            {sourceLabel}
          </span>
        </div>
        {incidents.length === 0 ? (
          <p className="text-sm text-white/45">{t("incidentsEmpty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/40 text-left text-xs uppercase">
                  <th className="pb-2 pr-4">ID</th>
                  <th className="pb-2 pr-4">IP</th>
                  <th className="pb-2 pr-4">{t("incidentsRisk")}</th>
                  <th className="pb-2 pr-4">{t("copilotSuggested")}</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {incidents.slice(0, 8).map((inc) => (
                  <tr key={inc.incident_id} className="border-t border-white/5">
                    <td className="py-2 pr-4 font-mono text-xs">{inc.incident_id}</td>
                    <td className="py-2 pr-4 font-mono">{inc.ip}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={
                          inc.risk_score >= 85
                            ? "text-danger font-bold"
                            : inc.risk_score >= 50
                              ? "text-warning"
                              : "text-white/70"
                        }
                      >
                        {inc.risk_score.toFixed(0)}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-primary/90 text-xs">
                      {inc.suggested_action ?? "—"}
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => openDetail(inc)}
                        className="text-xs text-primary/80 hover:text-primary underline"
                      >
                        {t("incidentsDetail")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelected(null)}
          onKeyDown={(e) => e.key === "Escape" && setSelected(null)}
        >
          <div
            className="glass-panel max-w-lg w-full p-5 border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-mono text-sm text-primary">{selected.incident_id}</p>
                <p className="text-white/60 text-sm mt-1">{selected.ip}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-white/40 hover:text-white text-sm"
              >
                {t("incidentsClose")}
              </button>
            </div>

            {loadingDetail ? (
              <p className="text-white/45 text-sm animate-pulse">…</p>
            ) : (
              <>
                <h4 className="text-xs uppercase tracking-wider text-white/45 mb-2">
                  {t("incidentsTimeline")}
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div>
                    <p className="text-white/40 text-xs">{t("incidentsFirstSeen")}</p>
                    <p>{fmtTs(selected.first_ts)}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs">{t("incidentsLastSeen")}</p>
                    <p>{fmtTs(selected.last_ts)}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs">{t("incidentsLogHits")}</p>
                    <p>{selected.log_hits ?? selected.log_hits_detail?.count ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs">{t("incidentsRisk")}</p>
                    <p className="font-bold">{selected.risk_score?.toFixed(0) ?? "—"}</p>
                  </div>
                </div>

                <h4 className="text-xs uppercase tracking-wider text-white/45 mb-2">
                  {t("incidentsSignals")}
                </h4>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(detailSignals.length ? detailSignals : [selected.primary_signal ?? "unknown"])
                    .filter(Boolean)
                    .map((sig) => (
                      <span
                        key={sig}
                        className={`text-xs px-2 py-0.5 rounded ${
                          sig.startsWith("ebpf_")
                            ? "bg-purple-500/20 text-purple-200"
                            : "bg-amber-500/20 text-amber-200"
                        }`}
                      >
                        {sig}
                      </span>
                    ))}
                </div>

                <div className="h-2 rounded-full bg-white/10 overflow-hidden flex">
                  {logSignals.length > 0 && (
                    <div
                      className="bg-amber-500/70 h-full"
                      style={{ width: `${Math.min(100, logSignals.length * 25)}%` }}
                      title="log"
                    />
                  )}
                  {ebpfSignals.length > 0 && (
                    <div
                      className="bg-purple-500/70 h-full"
                      style={{ width: `${Math.min(100, ebpfSignals.length * 25)}%` }}
                      title="eBPF"
                    />
                  )}
                </div>
                <p className="text-xs text-white/35 mt-2">
                  {selected.suggested_action ?? "MONITOR"}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
