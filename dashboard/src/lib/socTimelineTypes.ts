export type SocTimelineKind = "incident" | "ban" | "lineage" | "waf" | "ack";

export type SocTimelineEntry = {
  id: string;
  kind: SocTimelineKind;
  ts: number;
  title: string;
  detail: string;
  ip?: string;
  risk?: number;
  href?: string;
};

export type SocTimelineResponse = {
  entries: SocTimelineEntry[];
  sources: {
    incidents: string;
    bans: string;
    lineage: string;
    status?: string;
  };
  data_mode?: "live" | "live_partial" | "preview" | "none";
  preview_allowed?: boolean;
};
