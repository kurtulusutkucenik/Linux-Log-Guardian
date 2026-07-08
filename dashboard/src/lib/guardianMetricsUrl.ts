/** Docker prod: metrics-relay:19091 → host-api-bridge → 127.0.0.1:9091 */
export function guardianMetricsUrl(): string {
  return (
    process.env.GUARDIAN_METRICS_URL ||
    process.env.PROMETHEUS_METRICS_URL ||
    "http://metrics-relay:19091/metrics"
  );
}
