"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, LayoutDashboard } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

const DEFAULT_EMBED =
  process.env.NEXT_PUBLIC_GRAFANA_EMBED_URL ||
  "http://127.0.0.1:3002/d/log-guardian-01/linux-log-guardian?orgId=1&refresh=15s&kiosk&theme=dark&var-tenant=default";

/** Grafana dashboard embed — yalnizca gorunur olunca yuklenir (performans). */
export function GrafanaEmbedPanel() {
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setShow(true);
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const base = DEFAULT_EMBED.split("/d/")[0];

  return (
    <div ref={ref} className="glass-panel p-4 border border-primary/20">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
          <LayoutDashboard className="w-5 h-5 text-primary" />
          {t("grafanaEmbedTitle")}
        </h2>
        <a
          href={DEFAULT_EMBED.replace("&kiosk", "")}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          {t("grafanaEmbedOpen")} <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <p className="text-xs text-white/40 mb-3">{t("grafanaEmbedHint")}</p>
      <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40 min-h-[420px]">
        {show ? (
          <iframe
            title="Grafana Log Guardian"
            src={DEFAULT_EMBED}
            className="w-full h-[480px] md:h-[560px] border-0"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="h-[420px] flex items-center justify-center text-white/30 text-sm">
            {t("grafanaEmbedLoading")}
          </div>
        )}
      </div>
      <p className="text-[10px] text-white/30 mt-2 font-mono">{base}</p>
    </div>
  );
}
