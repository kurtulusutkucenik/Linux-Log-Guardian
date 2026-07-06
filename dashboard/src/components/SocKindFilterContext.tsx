"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** Shared filter for SOC timeline + attack map (subset applies per panel). */
export type SocKindFilter = "all" | "incident" | "ban" | "lineage" | "waf" | "ack";

const HASH_KINDS = new Set<SocKindFilter>([
  "all",
  "incident",
  "ban",
  "lineage",
  "waf",
  "ack",
]);

function parseHashFilter(): SocKindFilter | null {
  if (typeof window === "undefined") return null;
  const h = window.location.hash.replace(/^#/, "");
  if (h === "soc-timeline" || h === "soc-all") return "all";
  const m = h.match(/^soc-(.+)$/);
  if (m && HASH_KINDS.has(m[1] as SocKindFilter)) return m[1] as SocKindFilter;
  return null;
}

function hashForFilter(filter: SocKindFilter): string {
  return filter === "all" ? "#soc-timeline" : `#soc-${filter}`;
}

export function scrollToSocTimeline(behavior: ScrollBehavior = "smooth") {
  document.getElementById("soc-timeline")?.scrollIntoView({ behavior, block: "start" });
}

export function scrollToAttackMap(behavior: ScrollBehavior = "smooth") {
  document.getElementById("attack-world-map")?.scrollIntoView({ behavior, block: "start" });
}

export function scrollToWebhookOps(behavior: ScrollBehavior = "smooth") {
  document.getElementById("webhook-ops")?.scrollIntoView({ behavior, block: "start" });
}

export function scrollToEdgeProtection(behavior: ScrollBehavior = "smooth") {
  document.getElementById("edge-protection")?.scrollIntoView({ behavior, block: "start" });
}

type SetKindFilterOpts = { scroll?: boolean };

type SocKindFilterContextValue = {
  kindFilter: SocKindFilter;
  setKindFilter: (filter: SocKindFilter, opts?: SetKindFilterOpts) => void;
};

const SocKindFilterContext = createContext<SocKindFilterContextValue | null>(null);

export function SocKindFilterProvider({ children }: { children: ReactNode }) {
  const [kindFilter, setKindFilterState] = useState<SocKindFilter>("all");

  useEffect(() => {
    const applyHash = (scroll: boolean) => {
      const h = window.location.hash.replace(/^#/, "");
      if (h === "attack-world-map") {
        if (scroll) window.setTimeout(() => scrollToAttackMap("auto"), 150);
        return;
      }
      const f = parseHashFilter();
      if (!f) return;
      setKindFilterState(f);
      if (scroll && f !== "all") {
        window.setTimeout(() => scrollToSocTimeline("auto"), 150);
      }
    };
    applyHash(true);
    const onHash = () => applyHash(true);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const setKindFilter = useCallback((filter: SocKindFilter, opts?: SetKindFilterOpts) => {
    setKindFilterState(filter);
    const next = hashForFilter(filter);
    const path = `${window.location.pathname}${window.location.search}${next}`;
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== path) {
      history.replaceState(null, "", path);
    }
    if (opts?.scroll) scrollToSocTimeline();
  }, []);

  const value = useMemo(() => ({ kindFilter, setKindFilter }), [kindFilter, setKindFilter]);
  return (
    <SocKindFilterContext.Provider value={value}>{children}</SocKindFilterContext.Provider>
  );
}

export function useSocKindFilter(): SocKindFilterContextValue {
  const ctx = useContext(SocKindFilterContext);
  if (!ctx) {
    return {
      kindFilter: "all",
      setKindFilter: () => {},
    };
  }
  return ctx;
}
