/** Grafana log-guardian-01 panel sorgulari — grafana-dashboard.json ile ayni. */
export type PanelSeries = { key: string; legend: string; expr: string };

export type GrafanaStatPanel = {
  id: string;
  title: string;
  expr: string;
};

export type GrafanaTsPanel = {
  id: string;
  title: string;
  series: PanelSeries[];
};

export function tenantExpr(expr: string, tenant: string): string {
  return expr.replace(/\$tenant/g, tenant);
}

export const GRAFANA_STAT_PANELS: GrafanaStatPanel[] = [
  { id: "lines", title: "Log Lines Processed", expr: 'loganalyzer_lines_total{tenant_id="$tenant"}' },
  { id: "ban_ok", title: "Ban Success", expr: 'loganalyzer_bans_success{tenant_id="$tenant"}' },
  { id: "ban_fail", title: "Ban Fail", expr: 'loganalyzer_bans_fail{tenant_id="$tenant"}' },
  { id: "parse_err", title: "Parse Errors", expr: 'loganalyzer_parse_errors_total{tenant_id="$tenant"}' },
  { id: "eps", title: "Events Per Second", expr: 'loganalyzer_eps{tenant_id="$tenant"}' },
  { id: "xdp", title: "XDP Active", expr: 'loganalyzer_xdp_active{tenant_id="$tenant"}' },
  { id: "unique_ips", title: "Unique IPs", expr: 'loganalyzer_unique_ips{tenant_id="$tenant"}' },
  { id: "ringbuf", title: "Ringbuf Drops", expr: 'loganalyzer_ringbuf_drops_total{tenant_id="$tenant"}' },
];

export const GRAFANA_TS_PANELS: GrafanaTsPanel[] = [
  {
    id: "eps_ts",
    title: "EPS (gauge)",
    series: [{ key: "eps", legend: "EPS", expr: 'loganalyzer_eps{tenant_id="$tenant"}' }],
  },
  {
    id: "http_status",
    title: "HTTP 4xx / 5xx",
    series: [
      { key: "4xx", legend: "4xx", expr: 'loganalyzer_http_status_total{tenant_id="$tenant",code="4xx"}' },
      { key: "5xx", legend: "5xx", expr: 'loganalyzer_http_status_total{tenant_id="$tenant",code="5xx"}' },
    ],
  },
  {
    id: "alert_rate",
    title: "Alert rate",
    series: [
      {
        key: "alerts_s",
        legend: "alerts/s",
        expr: 'rate(loganalyzer_alerts_total{tenant_id="$tenant"}[1m])',
      },
    ],
  },
  {
    id: "ban_rate",
    title: "Ban success vs fail (rate)",
    series: [
      { key: "success", legend: "success", expr: 'rate(loganalyzer_bans_success{tenant_id="$tenant"}[5m])' },
      { key: "fail", legend: "fail", expr: 'rate(loganalyzer_bans_fail{tenant_id="$tenant"}[5m])' },
    ],
  },
  {
    id: "parse_rate",
    title: "Parse errors (rate)",
    series: [
      {
        key: "parse_s",
        legend: "parse errors/s",
        expr: 'rate(loganalyzer_parse_errors_total{tenant_id="$tenant"}[5m])',
      },
    ],
  },
];

export const GRAFANA_TABLE_METRICS: { id: string; label: string; expr: string }[] = [
  { id: "lines", label: "lines_total", expr: 'loganalyzer_lines_total{tenant_id="$tenant"}' },
  { id: "alerts", label: "alerts_total", expr: 'loganalyzer_alerts_total{tenant_id="$tenant"}' },
  { id: "eps", label: "eps", expr: 'loganalyzer_eps{tenant_id="$tenant"}' },
  { id: "ban_ok", label: "bans_success", expr: 'loganalyzer_bans_success{tenant_id="$tenant"}' },
  { id: "ban_fail", label: "bans_fail", expr: 'loganalyzer_bans_fail{tenant_id="$tenant"}' },
  { id: "ips", label: "unique_ips", expr: 'loganalyzer_unique_ips{tenant_id="$tenant"}' },
  { id: "xdp", label: "xdp_active", expr: 'loganalyzer_xdp_active{tenant_id="$tenant"}' },
  { id: "ja3_clusters", label: "ja3_clusters_active", expr: 'loganalyzer_ja3_clusters_active{tenant_id="$tenant"}' },
  { id: "ja3_bans", label: "ja3_cluster_bans", expr: 'loganalyzer_ja3_cluster_bans_total{tenant_id="$tenant"}' },
  { id: "threat_iocs", label: "threat_iocs", expr: 'loganalyzer_threat_total_iocs{tenant_id="$tenant"}' },
  { id: "fp_trusted", label: "fp_trusted_ips", expr: 'loganalyzer_fp_trusted_ips{tenant_id="$tenant"}' },
  { id: "bp_ipset", label: "ban_pipeline_ipset", expr: 'loganalyzer_ban_pipeline_ipset{tenant_id="$tenant"}' },
];

/** Grafana row: Telegram operator (Ack) */
export const GRAFANA_TELEGRAM_STAT_PANELS: GrafanaStatPanel[] = [
  { id: "tg_ack", title: "Telegram Ack (24h)", expr: 'loganalyzer_telegram_ack_24h{tenant_id="$tenant"}' },
  { id: "tg_unacked", title: "Telegram Unacked (24h)", expr: 'loganalyzer_telegram_unacked_24h{tenant_id="$tenant"}' },
  { id: "quiet_hours", title: "Quiet hours", expr: 'loganalyzer_webhook_quiet_hours{tenant_id="$tenant"}' },
  { id: "quiet_active", title: "Quiet active now", expr: 'loganalyzer_webhook_quiet_active{tenant_id="$tenant"}' },
];

/** Grafana row: Threat intel + FP + ban pipeline + JA3 cluster */
export const GRAFANA_SOC_STAT_PANELS: GrafanaStatPanel[] = [
  { id: "ja3_clusters", title: "JA3 cluster buckets", expr: 'loganalyzer_ja3_clusters_active{tenant_id="$tenant"}' },
  { id: "ja3_bans", title: "JA3 cluster bans", expr: 'loganalyzer_ja3_cluster_bans_total{tenant_id="$tenant"}' },
  { id: "threat_iocs", title: "Threat IOCs", expr: 'loganalyzer_threat_total_iocs{tenant_id="$tenant"}' },
  { id: "fp_trusted", title: "FP trusted IPs", expr: 'loganalyzer_fp_trusted_ips{tenant_id="$tenant"}' },
  { id: "bp_ipset", title: "Ban path ipset", expr: 'loganalyzer_ban_pipeline_ipset{tenant_id="$tenant"}' },
  { id: "bp_failed", title: "Ban pipeline fail", expr: 'loganalyzer_ban_pipeline_failed{tenant_id="$tenant"}' },
];

export const GRAFANA_SOC_TS_PANELS: GrafanaTsPanel[] = [
  {
    id: "ban_pipeline_rate",
    title: "Ban pipeline paths (rate)",
    series: [
      { key: "ipc", legend: "ipc", expr: 'rate(loganalyzer_ban_pipeline_ipc{tenant_id="$tenant"}[5m])' },
      { key: "xdp", legend: "xdp", expr: 'rate(loganalyzer_ban_pipeline_xdp{tenant_id="$tenant"}[5m])' },
      { key: "ipset", legend: "ipset", expr: 'rate(loganalyzer_ban_pipeline_ipset{tenant_id="$tenant"}[5m])' },
      { key: "ja3", legend: "ja3_cluster", expr: 'rate(loganalyzer_ja3_cluster_bans_total{tenant_id="$tenant"}[5m])' },
    ],
  },
];

export const GRAFANA_DASH_UID = "log-guardian-01";

export function grafanaDashboardUrl(tenant = "default"): string {
  const base =
    process.env.NEXT_PUBLIC_GRAFANA_EMBED_URL?.split("/d/")[0] ||
    "http://127.0.0.1:3002";
  return `${base}/d/${GRAFANA_DASH_UID}/linux-log-guardian-e28094-operations?orgId=1&from=now-1h&to=now&var-tenant=${encodeURIComponent(tenant)}&refresh=10s`;
}
