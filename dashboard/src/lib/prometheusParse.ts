/** Minimal Prometheus text exposition parser (gauge/counter tek satır). */
export function parsePrometheusGauge(
  body: string,
  metric: string,
  labelKey?: string,
  labelValue?: string,
): number | null {
  const lines = body.split("\n");
  for (const line of lines) {
    if (!line.startsWith(metric)) continue;
    if (line.startsWith("#")) continue;
    if (labelKey && labelValue) {
      if (!line.includes(`${labelKey}="${labelValue}"`)) continue;
    }
    const m = line.match(/\}\s+([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\s*$/);
    if (m) return parseFloat(m[1]);
    const bare = line.match(new RegExp(`^${metric}\\s+([+-]?\\d+(?:\\.\\d+)?)`));
    if (bare) return parseFloat(bare[1]);
  }
  return null;
}

export type LiveMetricsSnapshot = {
  eps: number;
  lines_total: number;
  alerts_total: number;
  bans_success: number;
  bans_failed: number;
  unique_ips: number;
  parse_errors: number;
  xdp_active: number;
  ja3_clusters_active: number;
  ja3_cluster_bans_total: number;
  threat_total_iocs: number;
  fp_trusted_ips: number;
  ban_pipeline_ipset: number;
  ban_pipeline_failed: number;
  reachable: boolean;
  ts: number;
};

export function parseGuardianMetrics(body: string): LiveMetricsSnapshot {
  const tenant = process.env.METRICS_TENANT || "default";
  const num = (m: string) =>
    parsePrometheusGauge(body, m, "tenant_id", tenant) ??
    parsePrometheusGauge(body, m) ??
    0;
  return {
    eps: num("loganalyzer_eps"),
    lines_total: num("loganalyzer_lines_total"),
    alerts_total: num("loganalyzer_alerts_total"),
    bans_success: num("loganalyzer_bans_success"),
    bans_failed: num("loganalyzer_bans_fail"),
    unique_ips: num("loganalyzer_unique_ips"),
    parse_errors: num("loganalyzer_parse_errors_total"),
    xdp_active: num("loganalyzer_xdp_active"),
    ja3_clusters_active: num("loganalyzer_ja3_clusters_active"),
    ja3_cluster_bans_total: num("loganalyzer_ja3_cluster_bans_total"),
    threat_total_iocs: num("loganalyzer_threat_total_iocs"),
    fp_trusted_ips: num("loganalyzer_fp_trusted_ips"),
    ban_pipeline_ipset: num("loganalyzer_ban_pipeline_ipset"),
    ban_pipeline_failed: num("loganalyzer_ban_pipeline_failed"),
    reachable: body.includes("loganalyzer_eps"),
    ts: Date.now(),
  };
}
