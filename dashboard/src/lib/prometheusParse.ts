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
  dist_risk_buckets_active: number;
  dist_risk_bonus_applied_total: number;
  dist_risk_enabled: number;
  threat_total_iocs: number;
  fp_trusted_ips: number;
  ban_pipeline_ipset: number;
  ban_pipeline_ipc: number;
  ban_pipeline_xdp: number;
  ban_pipeline_failed: number;
  threat_last_sync_ts: number;
  threat_last_applied: number;
  threat_last_failed: number;
  fp_learn_enabled: number;
  fp_suppressed_total: number;
  api_requests_total: number;
  api_auth_fail_total: number;
  api_rate_limited_total: number;
  webhook_sent_total: number;
  webhook_fail_total: number;
  webhook_queue_drops_total: number;
  telegram_ack_24h: number;
  telegram_unacked_24h: number;
  webhook_quiet_hours: number;
  webhook_quiet_active: number;
  webhook_telegram_route: number;
  webhook_telegram_batch_sec: number;
  webhook_queue_depth: number;
  http_4xx: number;
  http_5xx: number;
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
    dist_risk_buckets_active: num("loganalyzer_dist_risk_buckets_active"),
    dist_risk_bonus_applied_total: num("loganalyzer_dist_risk_bonus_applied_total"),
    dist_risk_enabled: num("loganalyzer_dist_risk_enabled"),
    threat_total_iocs: num("loganalyzer_threat_total_iocs"),
    fp_trusted_ips: num("loganalyzer_fp_trusted_ips"),
    ban_pipeline_ipset: num("loganalyzer_ban_pipeline_ipset"),
    ban_pipeline_ipc: num("loganalyzer_ban_pipeline_ipc"),
    ban_pipeline_xdp: num("loganalyzer_ban_pipeline_xdp"),
    ban_pipeline_failed: num("loganalyzer_ban_pipeline_failed"),
    threat_last_sync_ts: num("loganalyzer_threat_last_sync_ts"),
    threat_last_applied: num("loganalyzer_threat_last_applied"),
    threat_last_failed: num("loganalyzer_threat_last_failed"),
    fp_learn_enabled: num("loganalyzer_fp_learn_enabled"),
    fp_suppressed_total: num("loganalyzer_fp_suppressed_total"),
    api_requests_total: num("loganalyzer_api_requests_total"),
    api_auth_fail_total: num("loganalyzer_api_auth_fail_total"),
    api_rate_limited_total: num("loganalyzer_api_rate_limited_total"),
    webhook_sent_total: num("loganalyzer_webhook_sent_total"),
    webhook_fail_total: num("loganalyzer_webhook_fail_total"),
    webhook_queue_drops_total: num("loganalyzer_webhook_queue_drops_total"),
    telegram_ack_24h: num("loganalyzer_telegram_ack_24h"),
    telegram_unacked_24h: num("loganalyzer_telegram_unacked_24h"),
    webhook_quiet_hours: num("loganalyzer_webhook_quiet_hours"),
    webhook_quiet_active: num("loganalyzer_webhook_quiet_active"),
    webhook_telegram_route: num("loganalyzer_webhook_telegram_route"),
    webhook_telegram_batch_sec: num("loganalyzer_webhook_telegram_batch_sec"),
    webhook_queue_depth: num("loganalyzer_webhook_queue_depth"),
    http_4xx:
      parsePrometheusGauge(body, "loganalyzer_http_status_total", "code", "4xx") ?? 0,
    http_5xx:
      parsePrometheusGauge(body, "loganalyzer_http_status_total", "code", "5xx") ?? 0,
    reachable: body.includes("loganalyzer_eps"),
    ts: Date.now(),
  };
}
