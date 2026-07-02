"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import axios from "axios";
import { useVisibleInterval } from "@/hooks/useVisibleInterval";

export type BanRow = { ip: string; reason?: string; ts?: number };

type BannedIpsContextValue = {
  /** ipset toplam — hafif count_only poll */
  totalCount: number;
  truncated: boolean;
  source: string;
  dataMode: "live" | "preview";
  preview: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
};

const BannedIpsContext = createContext<BannedIpsContextValue | null>(null);

/** Global: yalnizca sayi (~200 byte). Onizleme panelde ayri yuklenir. */
export function BannedIpsProvider({
  children,
  pollMs = 30000,
}: {
  children: ReactNode;
  pollMs?: number;
}) {
  const [totalCount, setTotalCount] = useState(0);
  const [truncated, setTruncated] = useState(false);
  const [source, setSource] = useState("");
  const [dataMode, setDataMode] = useState<"live" | "preview">("live");
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await axios.get("/api/bans", {
        params: { count_only: 1, bust: Date.now() },
        headers: { "Cache-Control": "no-cache" },
      });
      setTotalCount(res.data.count ?? 0);
      setTruncated(Boolean(res.data.truncated));
      setSource(res.data.source || "");
      setDataMode(res.data.data_mode === "preview" ? "preview" : "live");
      setPreview(Boolean(res.data.preview));
    } catch {
      setTotalCount(0);
      setTruncated(false);
      setDataMode("live");
      setPreview(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useVisibleInterval(refresh, pollMs, pollMs > 0);

  const value = useMemo(
    () => ({ totalCount, truncated, source, dataMode, preview, loading, refresh }),
    [totalCount, truncated, source, dataMode, preview, loading, refresh],
  );

  return (
    <BannedIpsContext.Provider value={value}>{children}</BannedIpsContext.Provider>
  );
}

export function useBannedIps(): BannedIpsContextValue {
  const ctx = useContext(BannedIpsContext);
  if (!ctx) {
    throw new Error("useBannedIps must be used within BannedIpsProvider");
  }
  return ctx;
}

/** Ban onizleme listesi — yalnizca panel/sayfa mount olunca (max 15 IP). */
export function useBanPreview(limit = 15) {
  const { totalCount, truncated: globalTrunc, refresh: refreshCount, preview: globalPreview } =
    useBannedIps();
  const [bans, setBans] = useState<BanRow[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [source, setSource] = useState("");
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await axios.get("/api/bans", {
        params: { limit, offset: 0, bust: Date.now() },
      });
      setBans(res.data.bans || []);
      setTruncated(Boolean(res.data.truncated));
      setSource(res.data.source || "");
      setPreview(Boolean(res.data.preview));
      await refreshCount();
    } catch {
      setBans([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [limit, refreshCount]);

  useVisibleInterval(refresh, 45000, true);

  return {
    bans,
    totalCount,
    truncated: truncated || globalTrunc,
    source,
    preview: preview || globalPreview,
    loading,
    refreshing,
    refresh,
  };
}

/** Attack-tree: Set yerine count yeterli; opsiyonel kucuk onizleme */
export function useBannedIpSet() {
  const { bans } = useBanPreview(50);
  return useMemo(() => new Set(bans.map((b) => b.ip)), [bans]);
}
