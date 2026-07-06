export type TestStatus = "pass" | "fail" | "pending" | "warn";

export type ValidationTestResult = {
  id: string;
  status: TestStatus;
  title: string;
  purpose: string;
  verdict: string;
  metrics: { label: string; value: string }[];
  date?: string;
  script: string;
};

type Locale = "tr" | "en";

type CrsReport = {
  date?: string;
  pass?: boolean;
  guardian?: { attack_recall_pct?: number; benign_fp_pct?: number };
  parity_pct?: number;
  attacks_total?: number;
};

type FpReport = {
  date?: string;
  benign?: { lines?: number; alerts?: number; fp_rate_pct?: number };
  target_fp_pct?: number;
};

type SoakReport = {
  started?: string;
  ended?: string;
  pass?: boolean;
  pass_strict?: boolean;
  pass_operational?: boolean;
  duration_hours?: number;
  failures?: number;
  samples?: number;
  max_rss_kb?: number;
  fail_reasons?: Record<string, number>;
  notes?: string;
};

type IsolationReport = {
  generated_at?: string;
  pass?: boolean;
  checks_passed?: number;
  checks_total?: number;
  tenant?: { id?: string };
};

type BenchReport = {
  date?: string;
  lines?: number;
  log_guardian?: { eps?: number; latency_us_per_line?: number };
  modsecurity?: { eps?: number; latency_us_per_line?: number; note?: string };
  comparison?: { same_log_corpus?: boolean };
};

type BanReport = {
  date?: string;
  ban_latency_ms?: number | null;
  target_ms?: number;
  prod_target_ms?: number;
  pass?: boolean;
  ipset_confirmed?: boolean;
  p90_ms?: number;
  note?: string;
};

type LiveReport = {
  generated_at?: string;
  ipc?: string;
  ban_pipeline?: { ipc?: number; xdp?: number; ipset?: number; failed?: number };
  metrics?: { eps?: number; reachable?: boolean };
  daemon?: { xdp_active?: boolean } | null;
};

type RealAttackReport = {
  date?: string;
  pass?: boolean;
  attack_recall_pct?: number;
  target_recall_pct?: number;
  lines_total?: number;
  alerts_total?: number;
  categories?: Record<string, { lines?: number; alerts?: number; recall_pct?: number; pass?: boolean }>;
  live?: { enabled?: boolean; pass?: boolean };
};

type LiveAttackReport = {
  generated_at?: string;
  pass?: boolean;
  summary?: {
    sent_total?: number;
    refused_total?: number;
    ban_evidence?: boolean;
  };
  scenarios?: { name?: string; sent?: number; refused?: number }[];
};

type Ja3ClusterReport = {
  date?: string;
  pass?: boolean;
  category?: string;
  unique_ips?: number;
  lines_total?: number;
  alerts_total?: number;
  recall_pct?: number;
  target_recall_pct?: number;
  same_ua?: string;
  live?: {
    enabled?: boolean;
    tls_ready?: boolean;
    pass?: boolean;
    ja3_test?: { sent?: boolean; metrics_delta_c2?: number };
    https_swarm?: { ok?: number; sent?: number };
  };
};

type Ja3ClusterBanLiveReport = {
  date?: string;
  pass?: boolean;
  mode?: string;
  ip_block?: string;
  ban_pipeline_delta?: number;
  alerts_delta?: number;
  ja3_cluster_flush_this_run?: boolean;
  lines_injected?: number;
};

type FpClusterTrustReport = {
  date?: string;
  pass?: boolean;
  trusted_ip?: string;
  attack_block?: string;
  trusted_cluster_banned?: boolean;
  ja3_cluster_flush?: boolean;
  attack_ja3_cluster_bans?: number;
};

type LineageLiveReport = {
  date?: string;
  pass?: boolean;
  active_trees?: number;
  max_risk?: number;
  chain_risk?: number;
  event_types?: string[];
  event_count?: number;
  comm?: string;
  export?: string;
  resolver_source?: string;
  demo_pid?: number;
};

type NginxConsultReport = {
  date?: string;
  pass?: boolean;
  api_port?: number;
  endpoint?: string;
  tests?: Record<string, { http_code?: number; expect?: number }>;
  nginx_snippet?: string;
};

type NginxHybridReport = {
  date?: string;
  pass?: boolean;
  mode?: string;
  checks?: {
    log_replay_alerts?: number;
    edge_sqli_blocked?: { http_code?: number };
  };
  note?: string;
};

type BanProfileE2eReport = {
  date?: string;
  pass?: boolean;
  checks?: string[];
};

type Ipv6BanE2eReport = {
  date?: string;
  pass?: boolean;
  test_ip?: string;
  ban_via?: string;
  ban_path?: string;
  ipset_v6?: string;
};

type CorpusReport = {
  date?: string;
  pass?: boolean;
  lines_total?: number;
  alerts_total?: number;
  attack_recall_pct?: number;
  target_recall_pct?: number;
};

type ThreatIntelSyncReport = {
  date?: string;
  pass?: boolean;
  duration_sec?: number;
  ipset_delta?: number;
  ioc_lines?: number;
  sync_ok?: boolean;
};

type WebhookRouteProofReport = {
  date?: string;
  pass?: boolean;
  mode?: string;
  route_enabled?: boolean;
  batch_sec?: number;
  dry_run?: { ok?: boolean };
  batch?: { ok?: boolean };
  prod_e2e?: { ok?: boolean; skipped?: boolean };
  metrics_delta?: number;
  alerts_total?: number;
  fail_reason?: string;
};

type WebhookTelegramLiveReport = {
  date?: string;
  pass?: boolean;
  mode?: string;
  route?: boolean;
  batch_sec?: number;
  mirror_warn?: boolean;
  kinds?: string[];
};

type WebhookTelegramAckLiveReport = {
  date?: string;
  pass?: boolean;
  ack_before?: number;
  ack_after?: number;
  unacked_before?: number;
  unacked_after?: number;
  test_ip?: string;
  ack_key?: string;
  metrics_ack_24h?: number | null;
  fail_reason?: string;
};

type TelegramOperatorUndoE2eReport = {
  date?: string;
  pass?: boolean;
  ip?: string;
  mode?: string;
  fail_reason?: string;
  script?: string;
};

type DashboardBanApiReport = {
  date?: string;
  pass?: boolean;
  test_ip?: string;
  host_api?: { ok?: boolean; url?: string };
  relay_api?: { ok?: boolean; url?: string };
  docker_api?: { ok?: boolean; container?: string };
  ban_path?: string;
  fail_reason?: string;
};

type DashboardLiveDemoReport = {
  date?: string;
  pass?: boolean;
  bans_applied?: number;
  bans_failed?: number;
  active_bans_synced?: number;
  api?: string;
  ips?: string[];
  note?: string;
};

type AttackMapReport = {
  date?: string;
  pass?: boolean;
  dash_url?: string;
  markers?: number;
  total_ips?: number;
  data_source?: string;
  geo_lookup?: boolean;
  bans_source?: string;
  ack_markers?: number;
  ban_markers?: number;
  incident_markers?: number;
  fail_reason?: string;
};

type TelegramSocGateReport = {
  date?: string;
  pass?: boolean;
  soc_entries?: number;
  soc_ack?: number;
  soc_ban?: number;
  map_markers?: number;
  map_ack?: number;
  map_ban?: number;
  bans_acks?: number;
  status_acks?: number;
  prod_e2e_ok?: boolean;
  undo_e2e_ok?: boolean;
  data_mode?: string;
  fail_reason?: string;
  script?: string;
};

type BansTelegramOpsReport = {
  date?: string;
  pass?: boolean;
  acks_count?: number;
  test_ip?: string;
  test_ip_ack?: boolean;
  test_ip_operator?: string;
  test_ip_banned?: boolean;
  bans_search_count?: number;
  fail_reason?: string;
  script?: string;
};

type EdgeProtectionGateReport = {
  date?: string;
  pass?: boolean;
  ipc?: string;
  xdp_mode?: string;
  xdp_active?: boolean;
  default_nic?: string;
  wifi_nic?: boolean;
  nginx_log_format?: boolean;
  nginx_snippets?: boolean;
  nginx_live?: boolean;
  whitelist_count?: number;
  ipset_entries?: number;
  bans_active?: number;
  threat_intel_legacy_rows?: number;
  threat_intel_summary_rows?: number;
  fail_reason?: string;
  script?: string;
};

type GrafanaParityGateReport = {
  date?: string;
  pass?: boolean;
  panel_metrics?: number;
  dashboard_metrics?: number;
  missing_in_dashboard?: string[];
  missing_in_panels?: string[];
  fail_reason?: string;
  script?: string;
};

type WebsitePreviewGateReport = {
  date?: string;
  pass?: boolean;
  expected_tests?: number;
  site_tests?: number;
  site_pass?: number;
  site_fail?: number;
  has_grafana_parity?: boolean;
  has_edge_gate?: boolean;
  fail_reason?: string;
  script?: string;
};

type EnterpriseEscalationGateReport = {
  date?: string;
  pass?: boolean;
  doc_sections?: number;
  support_linked?: boolean;
  operator_scripts?: number;
  live_gates_ok?: number;
  live_gates_total?: number;
  fail_reason?: string;
  script?: string;
};

type VmHostPrepGateReport = {
  date?: string;
  pass?: boolean;
  context?: string;
  post_install_fail?: number;
  post_install_warn?: number;
  proof_tests?: number;
  proof_pass?: number;
  vm_sprint_pass?: boolean;
  vbox_share_ok?: boolean;
  fail_reason?: string;
  script?: string;
};

type DocsConsistencyGateReport = {
  date?: string;
  pass?: boolean;
  checks_ok?: number;
  checks_fail?: number;
  proof_tests?: number;
  proof_pass?: number;
  hosting_8b?: boolean;
  escalation_hosting_link?: boolean;
  support_64_kart?: boolean;
  fail_reason?: string;
  script?: string;
};

type VmFleetGateReport = {
  date?: string;
  pass?: boolean;
  skipped?: boolean;
  skip_reason?: string;
  dash_url?: string;
  host_agent?: string;
  vm_agent?: string;
  host_status?: string;
  vm_status?: string;
  online_count?: number;
  agent_count?: number;
  host_keepalive_active?: boolean;
  laptop_ops_doc_ok?: boolean;
  fail_reason?: string;
  script?: string;
};

type LaptopExcellenceGateReport = {
  date?: string;
  pass?: boolean;
  ok?: number;
  warn?: number;
  fail?: number;
  full_mode?: boolean;
  proof_tests?: number;
  proof_pass?: number;
  script?: string;
};

type WebsiteLiveGateReport = {
  date?: string;
  pass?: boolean;
  domain?: string;
  expected_tests?: number;
  live_cards?: number;
  css_ok?: boolean;
  js_ok?: boolean;
  sri_ok?: boolean;
  dash_url?: string;
  fail_reason?: string;
  script?: string;
};

type ReleaseReadyGateReport = {
  date?: string;
  pass?: boolean;
  release_ready_ok?: boolean;
  docs_consistency_ok?: boolean;
  website_live_ok?: boolean | null;
  website_live_skipped?: boolean;
  vm_fleet_ok?: boolean | null;
  vm_fleet_skipped?: boolean;
  proof_tests?: number;
  proof_pass?: number;
  artifacts?: {
    competitive_proof_pdf?: boolean;
    data_room_zip?: boolean;
    release_pack_zip?: boolean;
  };
  fail_reason?: string;
  script?: string;
};

type DemoRehearsalGateReport = {
  date?: string;
  pass?: boolean;
  demo_3min_ok?: boolean;
  dashboard_ok?: boolean;
  website_live_ok?: boolean | null;
  website_live_skipped?: boolean;
  security_closure_ok?: boolean | null;
  webhook_ok?: boolean | null;
  full_mode?: boolean;
  proof_tests?: number;
  proof_pass?: number;
  pdf_ok?: boolean;
  dash_url?: string;
  site_url?: string;
  fail_reason?: string;
  script?: string;
};

type PresentationShipGateReport = {
  date?: string;
  pass?: boolean;
  demo_rehearsal_ok?: boolean;
  release_ready_ok?: boolean;
  demo_3min_ok?: boolean;
  dashboard_ok?: boolean;
  website_live_ok?: boolean | null;
  docs_consistency_ok?: boolean;
  artifacts_ok?: boolean;
  artifacts_count?: string;
  proof_tests?: number;
  proof_pass?: number;
  dash_url?: string;
  site_url?: string;
  fail_reason?: string;
  script?: string;
};

type DemoVideoGateReport = {
  date?: string;
  pass?: boolean;
  demo_video_script_ok?: boolean;
  pdf_ok?: boolean;
  dashboard_ok?: boolean;
  presentation_ship_ok?: boolean;
  siem_export_ok?: boolean | null;
  siem_skipped?: boolean;
  webhook_ok?: boolean | null;
  webhook_skipped?: boolean;
  telegram_soc_ok?: boolean;
  proof_tests?: number;
  proof_pass?: number;
  site_url?: string;
  dash_url?: string;
  video_script?: string;
  fail_reason?: string;
  script?: string;
};

type GithubShipGateReport = {
  date?: string;
  pass?: boolean;
  presentation_ship_ok?: boolean;
  security_closure_ok?: boolean | null;
  security_closure_skipped?: boolean;
  secret_scan_ok?: boolean;
  website_live_ok?: boolean | null;
  vm_fleet_ok?: boolean | null;
  proof_tests?: number;
  proof_pass?: number;
  dash_url?: string;
  site_url?: string;
  fail_reason?: string;
  script?: string;
};

type LaptopCoreGateReport = {
  date?: string;
  pass?: boolean;
  health_ok?: boolean;
  edge_protection_ok?: boolean | null;
  edge_skipped?: boolean;
  telegram_soc_ok?: boolean;
  ban_ops_ok?: boolean;
  dashboard_ok?: boolean;
  xdp_mode?: string;
  ipc?: string;
  proof_tests?: number;
  proof_pass?: number;
  dash_url?: string;
  fail_reason?: string;
  script?: string;
};

type MorningOperatorGateReport = {
  date?: string;
  pass?: boolean;
  laptop_core_ok?: boolean;
  laptop_core_refreshed?: boolean;
  presentation_ship_ok?: boolean;
  dashboard_ok?: boolean;
  proof_tests?: number;
  proof_pass?: number;
  dash_url?: string;
  fail_reason?: string;
  script?: string;
};

type AuthLogReport = {
  date?: string;
  pass?: boolean;
  total_lines?: number;
  parse_errors?: number;
  unique_ips?: number;
  alerts_total?: number;
};

type SiemExportReport = {
  date?: string;
  pass?: boolean;
  alert_seen?: boolean;
  ban_seen?: boolean;
  port?: number;
  attack_ip?: string;
};

type CrowdsecBouncerReport = {
  date?: string;
  pass?: boolean;
  mode?: string;
  decisions_synced?: number;
  live_api_ok?: boolean;
  live_lapi_ok?: boolean;
  api_base?: string;
};

type TaxiiFeedReport = {
  date?: string;
  pass?: boolean;
  mode?: string;
  iocs_synced?: number;
  skipped_low_confidence?: number;
  min_confidence?: number;
  live_api_ok?: boolean;
  api_base?: string;
  fixture?: string;
};

type ParserFuzzReport = {
  date?: string;
  pass?: boolean;
  mode?: string;
  parse_runs?: number;
  mutations?: number;
  corpus_lines?: number;
  binary?: string;
};

type BanPolicyAuditReport = {
  date?: string;
  pass?: boolean;
  audit_lines?: number;
  last_decision?: string;
  last_risk?: number;
  audit_path?: string;
  openapi_strict_checked?: boolean;
};

type DistRiskProofReport = {
  date?: string;
  pass?: boolean;
  risk_off?: number;
  risk_on?: number;
  delta?: number;
  decision_off?: string;
  decision_on?: string;
  script?: string;
};

type LineageIncidentReport = {
  date?: string;
  pass?: boolean;
  mode?: string;
  incident_id?: string;
  ip?: string;
  active_incidents?: number;
  correlated_total?: number;
  signals?: string[];
  note?: string;
};

type HoneypotFeedReport = {
  date?: string;
  pass?: boolean;
  mode?: string;
  honey_traps_total?: number;
  lfi_traps_total?: number;
  c2_traps_total?: number;
  note?: string;
};

type L7ProbeProdReport = {
  date?: string;
  pass?: boolean;
  mode?: string;
  ipc?: string;
  l7_probe_active?: boolean;
  execve_probe?: boolean;
  l7_http_hits?: number;
  xdp_mode?: string;
  note?: string;
};

type OpsGateEntry = {
  id: string;
  pass?: boolean;
  fail?: number;
  warn?: number;
  title?: string;
  titleEn?: string;
  purpose?: string;
  purposeEn?: string;
  verdict?: string;
  verdictEn?: string;
  metrics?: { label: string; value: string }[];
  script?: string;
};

type OpsGateReport = {
  date?: string;
  pass?: boolean;
  gates?: OpsGateEntry[];
};

type WasmStatusReport = {
  mode?: string;
  pass?: boolean;
  plugins_native?: number;
  alerts_on_sqli?: number;
  plugin_bytes?: number;
  plugin_path?: string;
};

type FleetMultiNodeReport = {
  date?: string;
  pass?: boolean;
  mode?: string;
  dash_url?: string;
  agents?: string[];
  agent_count?: number;
  online_count?: number;
  dispatch_target?: string;
  test_ip?: string;
  fail_reason?: string;
};

type GrafanaProvisionReport = {
  date?: string;
  pass?: boolean;
  grafana_url?: string;
  dashboard_uid?: string;
  tenant_variable?: boolean;
  alert_rules?: number;
  alert_rules_with_tenant?: number;
  fail_reason?: string;
};

type CopilotOllamaReport = {
  date?: string;
  pass?: boolean;
  ollama_reachable?: boolean;
  reply_source?: string;
  fallback_ok?: boolean;
  dash_url?: string;
  mode?: string;
  reason?: string;
};

type MarketplaceSignedApiReport = {
  date?: string;
  pass?: boolean;
  mode?: string;
  tier?: string;
  packages_signed?: number;
  verify_ok?: boolean;
  dash_url?: string;
  script?: string;
};

type VpsXdpReport = {
  date?: string;
  pass?: boolean;
  mode?: string;
  xdp_mode?: string;
  iface?: string | null;
  fail_count?: number;
  script?: string;
};

type Arm64BuildReport = {
  date?: string;
  pass?: boolean;
  mode?: string;
  host_arch?: string;
  target_arch?: string;
  file?: string;
  note?: string;
  script?: string;
};

type ProdStackE2eReport = {
  date?: string;
  pass?: boolean;
  wasm_mode?: string;
  wasm_plugins_native?: number;
  lineage_risk?: number;
  lineage_resolver?: string;
  l7_probe_active?: boolean;
  ipc?: string;
  xdp_mode?: string;
  lineage_probe?: boolean;
  script?: string;
};

type Phase100FastGateReport = {
  date?: string;
  pass?: boolean;
  mode?: string;
  phases?: string;
  script?: string;
};

type ComplianceExportReport = {
  date?: string;
  pass?: boolean;
  mode?: string;
  tier?: string;
  controls?: number;
  json_ok?: boolean;
  pdf_ok?: boolean;
  script?: string;
};

type K8sAdmissionReport = {
  date?: string;
  pass?: boolean;
  mode?: string;
  deny_label?: string;
  reason?: string;
  script?: string;
};

type K8sKindE2eReport = {
  date?: string;
  pass?: boolean;
  mode?: string;
  cluster?: string;
  namespace?: string;
  reason?: string;
  script?: string;
};

type MeshEtcdDockerReport = {
  date?: string;
  pass?: boolean;
  mode?: string;
  script?: string;
};

type MeshEtcdLiveReport = {
  date?: string;
  pass?: boolean;
  mode?: string;
  endpoint?: string;
  policy_key?: string;
  round_trip?: boolean;
  script?: string;
};

function arm64BinaryVerified(mode?: string, file?: string): boolean {
  if (!mode || mode === "dry-run" || mode === "skip") return false;
  if (!file) return mode.startsWith("native");
  return /aarch64|ARM/i.test(file);
}

export type TestReports = {
  opsGates?: OpsGateReport | null;
  crs?: CrsReport | null;
  fp?: FpReport | null;
  realAttack?: RealAttackReport | null;
  realAttack10k?: RealAttackReport | null;
  liveAttack?: LiveAttackReport | null;
  ja3Cluster?: Ja3ClusterReport | null;
  ja3ClusterBanLive?: Ja3ClusterBanLiveReport | null;
  fpClusterTrust?: FpClusterTrustReport | null;
  lineageLive?: LineageLiveReport | null;
  nginxConsult?: NginxConsultReport | null;
  nginxHybrid?: NginxHybridReport | null;
  banProfileE2e?: BanProfileE2eReport | null;
  ipv6BanE2e?: Ipv6BanE2eReport | null;
  owaspCorpus?: CorpusReport | null;
  trHostingCorpus?: CorpusReport | null;
  threatIntelSync?: ThreatIntelSyncReport | null;
  soak?: SoakReport | null;
  soakShort?: SoakReport | null;
  isolation?: IsolationReport | null;
  bench?: BenchReport | null;
  ban?: BanReport | null;
  live?: LiveReport | null;
  dashboardBanApi?: DashboardBanApiReport | null;
  dashboardLiveDemo?: DashboardLiveDemoReport | null;
  attackMap?: AttackMapReport | null;
  webhookRoute?: WebhookRouteProofReport | null;
  webhookTelegramLive?: WebhookTelegramLiveReport | null;
  webhookTelegramAckLive?: WebhookTelegramAckLiveReport | null;
  telegramOperatorUndoE2e?: TelegramOperatorUndoE2eReport | null;
  telegramSocGate?: TelegramSocGateReport | null;
  bansTelegramOps?: BansTelegramOpsReport | null;
  edgeProtectionGate?: EdgeProtectionGateReport | null;
  grafanaParityGate?: GrafanaParityGateReport | null;
  websitePreviewGate?: WebsitePreviewGateReport | null;
  enterpriseEscalationGate?: EnterpriseEscalationGateReport | null;
  vmHostPrepGate?: VmHostPrepGateReport | null;
  docsConsistencyGate?: DocsConsistencyGateReport | null;
  vmFleetGate?: VmFleetGateReport | null;
  laptopExcellenceGate?: LaptopExcellenceGateReport | null;
  websiteLiveGate?: WebsiteLiveGateReport | null;
  releaseReadyGate?: ReleaseReadyGateReport | null;
  demoRehearsalGate?: DemoRehearsalGateReport | null;
  presentationShipGate?: PresentationShipGateReport | null;
  demoVideoGate?: DemoVideoGateReport | null;
  githubShipGate?: GithubShipGateReport | null;
  laptopCoreGate?: LaptopCoreGateReport | null;
  morningOperatorGate?: MorningOperatorGateReport | null;
  authLog?: AuthLogReport | null;
  siemExport?: SiemExportReport | null;
  crowdsecBouncer?: CrowdsecBouncerReport | null;
  taxiiFeed?: TaxiiFeedReport | null;
  parserFuzz?: ParserFuzzReport | null;
  banPolicyAudit?: BanPolicyAuditReport | null;
  distRiskProof?: DistRiskProofReport | null;
  lineageIncident?: LineageIncidentReport | null;
  honeypotFeed?: HoneypotFeedReport | null;
  l7ProbeProd?: L7ProbeProdReport | null;
  wasm?: WasmStatusReport | null;
  fleetMultiNode?: FleetMultiNodeReport | null;
  grafanaProvision?: GrafanaProvisionReport | null;
  copilotOllama?: CopilotOllamaReport | null;
  marketplaceSignedApi?: MarketplaceSignedApiReport | null;
  vpsXdp?: VpsXdpReport | null;
  arm64Build?: Arm64BuildReport | null;
  prodStack?: ProdStackE2eReport | null;
  phase100Fast?: Phase100FastGateReport | null;
  complianceExport?: ComplianceExportReport | null;
  k8sAdmission?: K8sAdmissionReport | null;
  k8sKind?: K8sKindE2eReport | null;
  meshEtcdDocker?: MeshEtcdDockerReport | null;
  meshEtcdLive?: MeshEtcdLiveReport | null;
};

function L(locale: Locale, tr: string, en: string): string {
  return locale === "tr" ? tr : en;
}

function fmtDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function evaluateValidationTests(
  reports: TestReports,
  locale: Locale = "tr",
): ValidationTestResult[] {
  const out: ValidationTestResult[] = [];

  const ops = reports.opsGates;
  if (ops?.gates?.length) {
    for (const gate of ops.gates) {
      const pass = gate.pass === true;
      const warnN = gate.warn ?? 0;
      out.push({
        id: gate.id,
        /* pass=true → green (competitive-proof ile ayni); WARN metrikte kalir */
        status: pass ? "pass" : "fail",
        title: L(locale, gate.title ?? gate.id, gate.titleEn ?? gate.title ?? gate.id),
        purpose: L(locale, gate.purpose ?? "", gate.purposeEn ?? gate.purpose ?? ""),
        verdict: L(
          locale,
          gate.verdict ?? (pass ? (warnN > 0 ? "GECTI (WARN bilgi)" : "GECTI") : "FAIL"),
          gate.verdictEn ?? gate.verdict ?? (pass ? (warnN > 0 ? "PASS (WARN info)" : "PASS") : "FAIL"),
        ),
        metrics: gate.metrics ?? [
          { label: "FAIL", value: String(gate.fail ?? 0) },
          { label: "WARN", value: String(warnN) },
        ],
        date: fmtDate(ops.date),
        script: gate.script ?? "scripts/ops_gate_report.sh",
      });
    }
  }

  const crs = reports.crs;
  if (crs) {
    const recall = crs.guardian?.attack_recall_pct ?? 0;
    const parity = crs.parity_pct ?? 0;
    const pass = crs.pass === true;
    out.push({
      id: "crs-parity",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "OWASP CRS ile aynı saldırı satırlarında tespit paritesini ölçüyoruz",
        "We measure detection parity against OWASP CRS on the same attack lines",
      ),
      purpose: L(
        locale,
        "Kural setimizin bilinen saldırı örneklerini kaçırmadığını kanıtlar.",
        "Proves our rule set does not miss known attack samples.",
      ),
      verdict: pass
        ? L(
            locale,
            `${crs.attacks_total ?? "—"} saldırı satırının tamamında uyarı üretildi; CRS ile %${parity.toFixed(0)} parite.`,
            `Alerts on all ${crs.attacks_total ?? "—"} attack lines; ${parity.toFixed(0)}% parity with CRS.`,
          )
        : L(
            locale,
            `Saldırı recall %${recall.toFixed(1)} — hedefin altında; kural seti gözden geçirilmeli.`,
            `Attack recall ${recall.toFixed(1)}% — below target; review rule set.`,
          ),
      metrics: [
        { label: L(locale, "Recall", "Recall"), value: `${recall.toFixed(1)}%` },
        { label: L(locale, "Parite", "Parity"), value: `${parity.toFixed(1)}%` },
      ],
      date: fmtDate(crs.date),
      script: "scripts/crs_parity_e2e.sh",
    });
  }

  const real = reports.realAttack;
  if (real) {
    const recall = real.attack_recall_pct ?? 0;
    const target = real.target_recall_pct ?? 85;
    const pass = real.pass === true;
    const cats = real.categories ?? {};
    const failedCats = Object.entries(cats)
      .filter(([, c]) => c.pass === false)
      .map(([k]) => k);
    out.push({
      id: "real-attack",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "Gerçek saldırı corpus'unda (26 kategori: SQLi, RFI, GraphQL, shellcmd, …) tespit oranını ölçüyoruz",
        "We measure detection on a 26-category real attack corpus (SQLi, RFI, GraphQL, shellcmd, …)",
      ),
      purpose: L(
        locale,
        "CRS dışı, güncel payload örneklerinde kural setinin recall'unu kanıtlar.",
        "Proves rule-set recall on current payloads beyond CRS parity alone.",
      ),
      verdict: pass
        ? L(
            locale,
            `${real.lines_total ?? "—"} satırda ortalama recall %${recall.toFixed(1)} — hedef >=%${target}.`,
            `${real.lines_total ?? "—"} lines at ${recall.toFixed(1)}% average recall — target >=${target}%.`,
          )
        : L(
            locale,
            `Recall %${recall.toFixed(1)} — hedef >=%${target} altında${failedCats.length ? ` (${failedCats.join(", ")})` : ""}.`,
            `Recall ${recall.toFixed(1)}% — below ${target}% target${failedCats.length ? ` (${failedCats.join(", ")})` : ""}.`,
          ),
      metrics: [
        { label: L(locale, "Recall", "Recall"), value: `${recall.toFixed(1)}%` },
        { label: L(locale, "Kategori", "Categories"), value: String(Object.keys(cats).length) },
        { label: L(locale, "Satır", "Lines"), value: String(real.lines_total ?? 0) },
        { label: L(locale, "Uyarı", "Alerts"), value: String(real.alerts_total ?? 0) },
      ],
      date: fmtDate(real.date),
      script: "scripts/real_attack_suite.sh",
    });
  }

  const real10k = reports.realAttack10k;
  if (real10k) {
    const recall = real10k.attack_recall_pct ?? 0;
    const target = real10k.target_recall_pct ?? 85;
    const pass = real10k.pass === true;
    out.push({
      id: "real-attack-10k",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "Genişletilmiş 10K saldırı corpus'unda recall ölçüyoruz",
        "We measure recall on an expanded 10K attack corpus",
      ),
      purpose: L(
        locale,
        "1K'nin ötesinde ölçeklenebilir tespit kanıtı — 19 kategori, dinamik varyant.",
        "Scalable detection proof beyond 1K — 19 categories, dynamic variants.",
      ),
      verdict: pass
        ? L(
            locale,
            `${real10k.lines_total ?? "—"} satırda %${recall.toFixed(1)} recall — hedef >=%${target}.`,
            `${real10k.lines_total ?? "—"} lines at ${recall.toFixed(1)}% recall — target >=${target}%.`,
          )
        : L(
            locale,
            `10K recall %${recall.toFixed(1)} — scripts/corpus_10k_proof.sh`,
            `10K recall ${recall.toFixed(1)}% — scripts/corpus_10k_proof.sh`,
          ),
      metrics: [
        { label: L(locale, "Recall", "Recall"), value: `${recall.toFixed(1)}%` },
        { label: L(locale, "Satır", "Lines"), value: String(real10k.lines_total ?? 0) },
      ],
      date: fmtDate(real10k.date),
      script: "scripts/corpus_10k_proof.sh",
    });
  }

  const liveAtk = reports.liveAttack;
  if (liveAtk) {
    const summ = liveAtk.summary ?? {};
    const sent = summ.sent_total ?? 0;
    const refused = summ.refused_total ?? 0;
    const pass = liveAtk.pass === true;
    out.push({
      id: "live-attack",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "Canlı nginx :80 saldırı harness'inde tester + ban kanıtını ölçüyoruz",
        "We measure live nginx :80 attack harness with tester + ban evidence",
      ),
      purpose: L(
        locale,
        "SQLi/POST/brute/ddos/slow senaryolarının gerçek nginx üzerinde reddedildiğini kanıtlar.",
        "Proves SQLi/POST/brute/ddos/slow scenarios are refused on real nginx.",
      ),
      verdict: pass
        ? L(
            locale,
            `${sent} istek gönderildi, ${refused} reddedildi${summ.ban_evidence ? " — ban kanıtı var" : ""}.`,
            `${sent} requests sent, ${refused} refused${summ.ban_evidence ? " — ban evidence present" : ""}.`,
          )
        : L(
            locale,
            "Canlı harness başarısız veya nginx kapalı — scripts/live_attack_harness.sh",
            "Live harness failed or nginx down — scripts/live_attack_harness.sh",
          ),
      metrics: [
        { label: L(locale, "Gönderilen", "Sent"), value: String(sent) },
        { label: L(locale, "Reddedilen", "Refused"), value: String(refused) },
      ],
      date: fmtDate(liveAtk.generated_at),
      script: "scripts/live_attack_harness.sh",
    });
  }

  const owasp = reports.owaspCorpus;
  if (owasp) {
    const recall = owasp.attack_recall_pct ?? 0;
    const pass = owasp.pass === true;
    out.push({
      id: "owasp-corpus",
      status: pass ? "pass" : "fail",
      title: L(locale, "OWASP/CRS tarzı test corpus recall", "OWASP/CRS-style test corpus recall"),
      purpose: L(
        locale,
        "OWASP WSTG ve CRS yaygın pattern'leriyle ek saldırı kapsamı doğrular.",
        "Validates extra attack coverage with common OWASP WSTG and CRS patterns.",
      ),
      verdict: pass
        ? L(locale, `%${recall.toFixed(1)} recall — ${owasp.lines_total ?? 0} satır.`, `${recall.toFixed(1)}% recall — ${owasp.lines_total ?? 0} lines.`)
        : L(locale, "OWASP corpus recall düşük — scripts/owasp_corpus_proof.sh", "Low OWASP corpus recall — scripts/owasp_corpus_proof.sh"),
      metrics: [{ label: L(locale, "Recall", "Recall"), value: `${recall.toFixed(1)}%` }],
      date: fmtDate(owasp.date),
      script: "scripts/owasp_corpus_proof.sh",
    });
  }

  const trHost = reports.trHostingCorpus;
  if (trHost) {
    const recall = trHost.attack_recall_pct ?? 0;
    const pass = trHost.pass === true;
    out.push({
      id: "tr-hosting-corpus",
      status: pass ? "pass" : "fail",
      title: L(locale, "TR hosting tarzı corpus recall", "TR hosting-style corpus recall"),
      purpose: L(
        locale,
        "Türkçe path ve anonymized IP ile hosting senaryosu recall kanıtı.",
        "Hosting scenario recall proof with Turkish paths and anonymized IPs.",
      ),
      verdict: pass
        ? L(locale, `%${recall.toFixed(1)} recall — ${trHost.lines_total ?? 0} satır.`, `${recall.toFixed(1)}% recall — ${trHost.lines_total ?? 0} lines.`)
        : L(locale, "TR hosting corpus FAIL — scripts/tr_hosting_corpus_proof.sh", "TR hosting corpus FAIL"),
      metrics: [{ label: L(locale, "Recall", "Recall"), value: `${recall.toFixed(1)}%` }],
      date: fmtDate(trHost.date),
      script: "scripts/tr_hosting_corpus_proof.sh",
    });
  }

  const ti = reports.threatIntelSync;
  if (ti) {
    const pass = ti.pass === true;
    out.push({
      id: "threat-intel-sync",
      status: pass ? "pass" : "fail",
      title: L(locale, "Threat intel sync hızı ve ipset etkisi", "Threat intel sync speed and ipset impact"),
      purpose: L(
        locale,
        "Firehol/GeoIP beslemesinin dakikalar içinde ipset'e yansımasını ölçer.",
        "Measures Firehol/GeoIP feed reflection into ipset within minutes.",
      ),
      verdict: pass
        ? L(
            locale,
            `${ti.duration_sec ?? 0}s sync, ipset_delta=${ti.ioc_lines ?? ti.ipset_delta ?? 0}.`,
            `${ti.duration_sec ?? 0}s sync, ipset_delta=${ti.ioc_lines ?? ti.ipset_delta ?? 0}.`,
          )
        : L(locale, "Threat intel sync FAIL — scripts/threat_intel_sync_proof.sh", "Threat intel sync FAIL"),
      metrics: [
        { label: L(locale, "Süre", "Duration"), value: `${ti.duration_sec ?? 0}s` },
        { label: "ipset Δ", value: String(ti.ipset_delta ?? 0) },
      ],
      date: fmtDate(ti.date),
      script: "scripts/threat_intel_sync_proof.sh",
    });
  }

  const consult = reports.nginxConsult;
  if (consult) {
    const tests = consult.tests ?? {};
    const union = tests.sqli_union?.http_code;
    const or1 = tests.sqli_or?.http_code;
    const benign = tests.benign_health?.http_code;
    const lfi = tests.lfi_attack?.http_code;
    const pass = consult.pass === true;
    out.push({
      id: "nginx-consult",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "nginx inline consult API (auth_request öncesi WAF+CRS)",
        "nginx inline consult API (WAF+CRS before auth_request)",
      ),
      purpose: L(
        locale,
        "ModSecurity inline alternatifi: istek nginx'e ulaşmadan consult ile 403/200 kararı.",
        "ModSecurity inline alternative: 403/200 decision via consult before request reaches upstream.",
      ),
      verdict: pass
        ? L(
            locale,
            `union=${union} or1=${or1} benign=${benign} lfi=${lfi} — hepsi beklenen kod.`,
            `union=${union} or1=${or1} benign=${benign} lfi=${lfi} — all expected codes.`,
          )
        : L(
            locale,
            "Consult API basarisiz — sudo systemctl restart log-guardian + sync_etc_rules",
            "Consult API failed — sudo systemctl restart log-guardian + sync_etc_rules",
          ),
      metrics: [
        { label: "UNION", value: String(union ?? "—") },
        { label: "OR 1=1", value: String(or1 ?? "—") },
        { label: L(locale, "Sağlık", "Health"), value: String(benign ?? "—") },
        { label: "LFI", value: String(lfi ?? "—") },
      ],
      date: fmtDate(consult.date),
      script: "scripts/nginx_inline_consult_proof.sh",
    });
  }

  const hybrid = reports.nginxHybrid;
  if (hybrid) {
    const pass = hybrid.pass === true;
    const sqli = hybrid.checks?.edge_sqli_blocked?.http_code;
    const replay = hybrid.checks?.log_replay_alerts ?? 0;
    out.push({
      id: "nginx-hybrid",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "nginx hibrit — inline consult + log replay",
        "nginx hybrid — inline consult + log replay",
      ),
      purpose: L(
        locale,
        "ModSec/Fail2ban farkı: auth_request WAF + access_log tek zincir kanıtı.",
        "ModSec/Fail2ban gap: auth_request WAF + access_log single-chain proof.",
      ),
      verdict: pass
        ? L(
            locale,
            `mode=${hybrid.mode ?? "inline+log"}; edge_sqli=${sqli ?? "—"}; replay_alerts=${replay}.`,
            `mode=${hybrid.mode ?? "inline+log"}; edge_sqli=${sqli ?? "—"}; replay_alerts=${replay}.`,
          )
        : L(
            locale,
            "nginx_hybrid_proof FAIL — bash scripts/nginx_hybrid_proof.sh",
            "nginx_hybrid_proof FAIL — bash scripts/nginx_hybrid_proof.sh",
          ),
      metrics: [
        { label: "edge_sqli", value: String(sqli ?? "—") },
        { label: "replay", value: String(replay) },
      ],
      date: fmtDate(hybrid.date),
      script: "scripts/nginx_hybrid_proof.sh",
    });
  }

  const banProf = reports.banProfileE2e;
  if (banProf) {
    const pass = banProf.pass === true;
    const nchk = banProf.checks?.length ?? 0;
    out.push({
      id: "ban-profile-e2e",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "AUTO_BAN profil + consult cache + threat intel offline",
        "AUTO_BAN profile + consult cache + threat intel offline",
      ),
      purpose: L(
        locale,
        "AUTO_BAN_PROFILE preset, consult cache, threat intel offline fallback.",
        "AUTO_BAN_PROFILE preset, consult cache, threat intel offline fallback.",
      ),
      verdict: pass
        ? L(
            locale,
            `${nchk} statik kontrol PASS (AUTO_BAN_PROFILE, CONSULT_CACHE, GeoIP).`,
            `${nchk} static checks PASS (AUTO_BAN_PROFILE, CONSULT_CACHE, GeoIP).`,
          )
        : L(locale, "ban_profile_e2e FAIL", "ban_profile_e2e FAIL"),
      metrics: [{ label: L(locale, "kontrol", "checks"), value: String(nchk) }],
      date: fmtDate(banProf.date),
      script: "scripts/ban_profile_e2e.sh",
    });
  }

  const ipv6 = reports.ipv6BanE2e;
  if (ipv6) {
    const pass = ipv6.pass === true;
    out.push({
      id: "ipv6-ban-e2e",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "IPv6 ban — ipset v6 + API/CLI",
        "IPv6 ban — ipset v6 + API/CLI",
      ),
      purpose: L(
        locale,
        "RFC 3849 doc prefix — v4-only rakiplere karşı ipset v6 kanıtı.",
        "RFC 3849 doc prefix — ipset v6 proof vs v4-only rivals.",
      ),
      verdict: pass
        ? L(
            locale,
            `via=${ipv6.ban_via ?? "—"}; path=${ipv6.ban_path ?? "—"}; ip=${ipv6.test_ip ?? "—"}.`,
            `via=${ipv6.ban_via ?? "—"}; path=${ipv6.ban_path ?? "—"}; ip=${ipv6.test_ip ?? "—"}.`,
          )
        : L(
            locale,
            "ipv6_ban_e2e FAIL — sudo bash scripts/ipv6_ban_e2e.sh",
            "ipv6_ban_e2e FAIL — sudo bash scripts/ipv6_ban_e2e.sh",
          ),
      metrics: [
        { label: "via", value: ipv6.ban_via ?? "—" },
        { label: "path", value: ipv6.ban_path ?? "—" },
      ],
      date: fmtDate(ipv6.date),
      script: "scripts/ipv6_ban_e2e.sh",
    });
  }

  const ja3 = reports.ja3Cluster;
  if (ja3) {
    const recall = ja3.recall_pct ?? 0;
    const target = ja3.target_recall_pct ?? 85;
    const pass = ja3.pass === true;
    out.push({
      id: "ja3-cluster",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "Dağıtık saldırıda (aynı UA, farklı IP) cluster recall ölçüyoruz",
        "We measure cluster recall on distributed attacks (same UA, different IPs)",
      ),
      purpose: L(
        locale,
        "IP başına ban'ın ötesinde scanner UA + çoklu IP senaryosunda tespit oranını kanıtlar.",
        "Proves detection beyond per-IP ban on scanner UA + multi-IP scenarios.",
      ),
      verdict: (() => {
        const live = ja3.live;
        const liveBit =
          live?.enabled && live.tls_ready
            ? L(
                locale,
                ` — TLS :443 canlı (ja3_sent=${live.ja3_test?.sent ? "evet" : "hayır"}, delta_c2=${live.ja3_test?.metrics_delta_c2 ?? 0}).`,
                ` — live TLS :443 (ja3_sent=${live.ja3_test?.sent ? "yes" : "no"}, delta_c2=${live.ja3_test?.metrics_delta_c2 ?? 0}).`,
              )
            : "";
        if (pass) {
          return L(
            locale,
            `${ja3.unique_ips ?? "—"} farklı IP, recall %${recall.toFixed(1)} — hedef >=%${target}.${liveBit}`,
            `${ja3.unique_ips ?? "—"} unique IPs at ${recall.toFixed(1)}% recall — target >=${target}%.${liveBit}`,
          );
        }
        return L(
          locale,
          `Recall %${recall.toFixed(1)} — hedef >=%${target} altında.`,
          `Recall ${recall.toFixed(1)}% — below ${target}% target.`,
        );
      })(),
      metrics: [
        { label: L(locale, "Recall", "Recall"), value: `${recall.toFixed(1)}%` },
        { label: "IP", value: String(ja3.unique_ips ?? 0) },
        { label: L(locale, "UA", "UA"), value: ja3.same_ua ?? "—" },
        ...(ja3.live?.enabled
          ? [
              {
                label: "TLS",
                value: ja3.live.tls_ready ? (locale === "tr" ? "açık" : "up") : (locale === "tr" ? "kapalı" : "down"),
              },
            ]
          : []),
      ],
      date: fmtDate(ja3.date),
      script: "scripts/ja3_cluster_proof.sh",
    });
  }

  const ja3Live = reports.ja3ClusterBanLive;
  if (ja3Live) {
    const delta = ja3Live.ban_pipeline_delta ?? 0;
    const pass = ja3Live.pass === true;
    out.push({
      id: "ja3-cluster-ban-live",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "Canlı nginx log → JA3/UA cluster → ban_pipeline kanıtı",
        "Live nginx log → JA3/UA cluster → ban_pipeline proof",
      ),
      purpose: L(
        locale,
        "Dağıtık saldırıda aynı scanner UA ile gelen IP'lerin canlı ingest sonrası ban hattına girdiğini ölçer.",
        "Measures that same-scanner-UA distributed IPs enter the ban pipeline after live ingest.",
      ),
      verdict: pass
        ? L(
            locale,
            `${ja3Live.mode ?? "live"} — ban_pipeline +${delta}, blok ${ja3Live.ip_block ?? "—"}${ja3Live.ja3_cluster_flush_this_run ? " — cluster flush" : ""}.`,
            `${ja3Live.mode ?? "live"} — ban_pipeline +${delta}, block ${ja3Live.ip_block ?? "—"}${ja3Live.ja3_cluster_flush_this_run ? " — cluster flush" : ""}.`,
          )
        : L(
            locale,
            `Canlı cluster ban geçmedi — delta=${delta}. sudo bash scripts/ja3_cluster_ban_live.sh`,
            `Live cluster ban failed — delta=${delta}. sudo bash scripts/ja3_cluster_ban_live.sh`,
          ),
      metrics: [
        { label: "Δ ban", value: String(delta) },
        { label: L(locale, "Mod", "Mode"), value: ja3Live.mode ?? "—" },
        {
          label: "flush",
          value: ja3Live.ja3_cluster_flush_this_run ? (locale === "tr" ? "evet" : "yes") : (locale === "tr" ? "hayır" : "no"),
        },
      ],
      date: fmtDate(ja3Live.date),
      script: "scripts/ja3_cluster_ban_live.sh",
    });
  }

  const fpCluster = reports.fpClusterTrust;
  if (fpCluster) {
    const pass = fpCluster.pass === true;
    out.push({
      id: "fp-cluster-trust",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "FP learn — güvenilir IP cluster ban dışında mı?",
        "FP learn — are trusted IPs excluded from cluster ban?",
      ),
      purpose: L(
        locale,
        "Öğrenilmiş güvenilir IP'nin JA3/UA cluster flush listesine girmemesini kanıtlar (tekil SQLi WAF ayrı).",
        "Proves learned trusted IPs are not included in JA3/UA cluster flush (per-IP SQLi WAF is separate).",
      ),
      verdict: pass
        ? L(
            locale,
            `${fpCluster.trusted_ip ?? "—"} cluster ban almadı; flush=${fpCluster.ja3_cluster_flush ? "evet" : "hayır"}.`,
            `${fpCluster.trusted_ip ?? "—"} not cluster-banned; flush=${fpCluster.ja3_cluster_flush ? "yes" : "no"}.`,
          )
        : L(
            locale,
            "Güvenilir IP cluster ban yedi — FP_TRUST veya cluster eşiği kontrol edin.",
            "Trusted IP received cluster ban — check FP_TRUST or cluster thresholds.",
          ),
      metrics: [
        {
          label: L(locale, "Güvenilir IP", "Trusted IP"),
          value: fpCluster.trusted_ip ?? "—",
        },
        {
          label: "cluster ban",
          value: fpCluster.trusted_cluster_banned
            ? locale === "tr"
              ? "evet"
              : "yes"
            : locale === "tr"
              ? "hayır"
              : "no",
        },
        {
          label: "flush",
          value: fpCluster.ja3_cluster_flush ? (locale === "tr" ? "evet" : "yes") : (locale === "tr" ? "hayır" : "no"),
        },
      ],
      date: fmtDate(fpCluster.date),
      script: "scripts/fp_cluster_trust_e2e.sh",
    });
  }

  const lineageLive = reports.lineageLive;
  if (lineageLive) {
    const pass = lineageLive.pass === true;
    const types = (lineageLive.event_types ?? []).join(" · ");
    const risk = lineageLive.chain_risk ?? lineageLive.max_risk ?? 0;
    out.push({
      id: "lineage-live",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "eBPF lineage — openat · execve · connect zinciri",
        "eBPF lineage — openat · execve · connect chain",
      ),
      purpose: L(
        locale,
        "Daemon attack_tree.json formatında canlı olay zincirini doğrular; demo dosyası üretim yolunun önüne geçmez.",
        "Validates live event chain in daemon attack_tree.json format; demo file does not override production path.",
      ),
      verdict: pass
        ? L(
            locale,
            `${lineageLive.comm ?? "proc"} risk ${risk.toFixed(1)} — ${lineageLive.event_count ?? 0} olay (${types}); kaynak=${lineageLive.resolver_source ?? "daemon_file"}.`,
            `${lineageLive.comm ?? "proc"} risk ${risk.toFixed(1)} — ${lineageLive.event_count ?? 0} events (${types}); source=${lineageLive.resolver_source ?? "daemon_file"}.`,
          )
        : L(
            locale,
            "Lineage zinciri geçmedi — bash scripts/lineage_live_e2e.sh",
            "Lineage chain failed — bash scripts/lineage_live_e2e.sh",
          ),
      metrics: [
        { label: L(locale, "Risk", "Risk"), value: risk.toFixed(1) },
        { label: L(locale, "Olay", "Events"), value: String(lineageLive.event_count ?? 0) },
        {
          label: L(locale, "Ağaç", "Trees"),
          value: String(lineageLive.active_trees ?? 0),
        },
        {
          label: L(locale, "Kaynak", "Source"),
          value: lineageLive.resolver_source ?? "—",
        },
      ],
      date: fmtDate(lineageLive.date),
      script: "scripts/lineage_live_e2e.sh",
    });
  }

  const fp = reports.fp;
  if (fp) {
    const rate = fp.benign?.fp_rate_pct ?? 0;
    const target = fp.target_fp_pct ?? 5;
    const lines = fp.benign?.lines ?? 0;
    const pass = rate < target;
    out.push({
      id: "fp-rate",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "Temiz (benign) trafikte yanlış alarm oranını sayıyoruz",
        "We count false-positive rate on clean (benign) traffic",
      ),
      purpose: L(
        locale,
        "Gerçek kullanıcı trafiğini gereksiz yere engellemediğimizi gösterir.",
        "Shows we do not block legitimate user traffic unnecessarily.",
      ),
      verdict: pass
        ? L(
            locale,
            `${lines} benign satırda %${rate.toFixed(2)} yanlış alarm — hedef <%${target} altında.`,
            `${lines} benign lines at ${rate.toFixed(2)}% FP — under ${target}% target.`,
          )
        : L(
            locale,
            `Yanlış alarm %${rate.toFixed(2)} — hedef <%${target} aşıldı; eşik veya kurallar ayarlanmalı.`,
            `False positive ${rate.toFixed(2)}% — exceeds ${target}% target; tune thresholds or rules.`,
          ),
      metrics: [
        { label: L(locale, "FP oranı", "FP rate"), value: `${rate.toFixed(2)}%` },
        { label: L(locale, "Benign satır", "Benign lines"), value: String(lines) },
      ],
      date: fmtDate(fp.date),
      script: "scripts/fp_benign_test.sh",
    });
  }

  const soakShort = reports.soakShort;
  if (soakShort) {
    const pass = soakShort.pass === true;
    const sec = (soakShort as { duration_sec?: number }).duration_sec ?? 300;
    const min = Math.round(sec / 60);
    out.push({
      id: "soak-short-gate",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "5 dakikalık stabilite kapısı (VPS gerekmez)",
        "5-minute stability gate (no VPS required)",
      ),
      purpose: L(
        locale,
        "Daemon ve analizörün kısa süreli prod benzeri yükte ayakta kaldığını doğrular.",
        "Confirms daemon and analyzer stay up during a short production-like window.",
      ),
      verdict: pass
        ? L(
            locale,
            `${min} dk soak: ${soakShort.samples ?? 0} örnek, ${soakShort.failures ?? 0} hata — PASS.`,
            `${min}m soak: ${soakShort.samples ?? 0} samples, ${soakShort.failures ?? 0} failures — PASS.`,
          )
        : L(
            locale,
            `${soakShort.failures ?? 0} başarısız örnek — sağlık veya metrik erişimi koptu.`,
            `${soakShort.failures ?? 0} failed samples — health or metrics access lost.`,
          ),
      metrics: [
        { label: L(locale, "Süre", "Duration"), value: `${min} dk` },
        {
          label: L(locale, "Max RSS", "Max RSS"),
          value: soakShort.max_rss_kb ? `${(soakShort.max_rss_kb / 1024).toFixed(0)} MB` : "—",
        },
      ],
      date: fmtDate(soakShort.ended ?? soakShort.started),
      script: "scripts/soak_short_proof.sh",
    });
  }

  const soak = reports.soak;
  if (soak && !(soak as { short_mode?: boolean }).short_mode) {
    const hours = soak.duration_hours ?? (soak as { duration_sec?: number }).duration_sec
      ? ((soak as { duration_sec?: number }).duration_sec ?? 0) / 3600
      : 0;
    const passOperational = soak.pass_operational ?? false;
    const realFailures = (soak as { real_failures?: number }).real_failures;
    const artifacts = (soak as { measurement_artifacts?: number }).measurement_artifacts;
    const passProd =
      (soak as { pass_laptop_proof?: boolean }).pass_laptop_proof === true ||
      (passOperational && hours >= 70 && (realFailures ?? soak.failures ?? 0) === 0);
    const fpRate = reports.fp?.benign?.fp_rate_pct;
    const fpPct =
      fpRate != null
        ? (fpRate < 1 ? fpRate.toFixed(2) : fpRate.toFixed(1))
        : null;
    const rssMb = soak.max_rss_kb ? `${(soak.max_rss_kb / 1024).toFixed(0)} MB` : "—";
    const sampleN = soak.samples ?? 0;
    const failN = realFailures ?? soak.failures ?? 0;
    const artN = artifacts ?? 0;
    out.push({
      id: "soak-stability",
      status: passProd ? "pass" : passOperational ? "warn" : "fail",
      title: L(
        locale,
        fpPct != null
          ? `72 saat VPS/VM soak + benign FP %${fpPct}`
          : "72 saat VPS/VM soak — prod stabilite",
        fpPct != null
          ? `72h VPS/VM soak + ${fpPct}% benign FP`
          : "72h VPS/VM soak — prod stability",
      ),
      purpose: L(
        locale,
        "Servisler ~72 saat ayakta kaldı mı? (VM/VPS systemd soak — 864 örnek, 300s aralık.)",
        "Did services stay up for ~72h? (VM/VPS systemd soak — 864 samples, 300s interval.)",
      ),
      verdict: passProd
        ? L(
            locale,
            `${hours.toFixed(1)} saat soak geçti: ${sampleN} örnek, ${failN} hata — servisler ayakta, max RSS ${rssMb}${fpPct != null ? `, benign FP %${fpPct}` : ""}.`,
            `${hours.toFixed(1)}h soak passed: ${sampleN} samples, ${failN} failures — services up, max RSS ${rssMb}${fpPct != null ? `, benign FP ${fpPct}%` : ""}.`,
          )
        : passOperational
          ? L(
              locale,
              `${hours.toFixed(1)} saat operasyonel geçti ama 72h kanıt kapısı eksik (<70h).`,
              `${hours.toFixed(1)}h operational pass but 72h proof gate incomplete (<70h).`,
            )
          : L(
              locale,
              `${failN} başarısız örnek — servis düşmüş olabilir.`,
              `${failN} failed samples — possible service outage.`,
            ),
      metrics: [
        { label: L(locale, "Süre", "Duration"), value: `${hours.toFixed(1)}h` },
        { label: L(locale, "Örnek", "Samples"), value: String(sampleN) },
        { label: L(locale, "Hata", "Failures"), value: String(failN) },
        { label: L(locale, "Max RSS", "Max RSS"), value: rssMb },
        ...(artN > 0
          ? [{ label: L(locale, "Ölçüm artefaktı", "Meas. artifacts"), value: String(artN) }]
          : []),
        ...(fpPct != null
          ? [{ label: L(locale, "Benign FP", "Benign FP"), value: `${fpPct}%` }]
          : []),
      ],
      date: fmtDate(soak.ended ?? soak.started),
      script: "scripts/soak_recompute_report.sh",
    });
  }

  const iso = reports.isolation;
  if (iso) {
    const pass = iso.pass === true;
    out.push({
      id: "tenant-isolation",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "Multi-tenant ortamda kiracı verilerinin birbirinden izole olduğunu kontrol ediyoruz",
        "We verify tenant data stays isolated in multi-tenant deployments",
      ),
      purpose: L(
        locale,
        "Her müşterinin ban, audit ve FP verisinin ayrı tutulduğunu kanıtlar.",
        "Proves each customer's ban, audit, and FP data is kept separate.",
      ),
      verdict: pass
        ? L(
            locale,
            `Kiracı «${iso.tenant?.id ?? "—"}»: ${iso.checks_passed}/${iso.checks_total} izolasyon kontrolü geçti.`,
            `Tenant «${iso.tenant?.id ?? "—"}»: ${iso.checks_passed}/${iso.checks_total} isolation checks passed.`,
          )
        : L(
            locale,
            `İzolasyon eksik — ${iso.checks_passed}/${iso.checks_total} kontrol geçti.`,
            `Isolation gap — only ${iso.checks_passed}/${iso.checks_total} checks passed.`,
          ),
      metrics: [
        {
          label: L(locale, "Kontroller", "Checks"),
          value: `${iso.checks_passed ?? 0}/${iso.checks_total ?? 0}`,
        },
      ],
      date: fmtDate(iso.generated_at),
      script: "scripts/tenant_isolation_test.sh",
    });
  }

  const bench = reports.bench;
  if (bench) {
    const gEps = bench.log_guardian?.eps ?? 0;
    const mEps = bench.modsecurity?.eps ?? 0;
    const gLat = bench.log_guardian?.latency_us_per_line ?? 0;
    out.push({
      id: "bench-eps",
      status: "pass",
      title: L(
        locale,
        "Aynı log corpus üzerinde işleme hızını ölçülebilir şekilde karşılaştırıyoruz",
        "We compare processing speed on the same log corpus with measurable numbers",
      ),
      purpose: L(
        locale,
        "Tek geçiş log→WAF mimarisinin throughput'unu şeffaf raporlar; CRS regex replay ile aynı satırlar.",
        "Transparent throughput report for log→WAF pipeline; same lines vs CRS regex replay.",
      ),
      verdict: L(
        locale,
        `Guardian ${gEps} EPS (tek geçiş, ${bench.lines ?? "—"} satır); CRS replay ${mEps} EPS — farklı mimari, aynı corpus.`,
        `Guardian ${gEps} EPS (single pass, ${bench.lines ?? "—"} lines); CRS replay ${mEps} EPS — different architecture, same corpus.`,
      ),
      metrics: [
        { label: "Guardian EPS", value: String(gEps) },
        { label: "CRS replay EPS", value: String(mEps) },
        {
          label: L(locale, "Satır gecikmesi", "Per-line latency"),
          value: `${(gLat / 1000).toFixed(2)} ms`,
        },
      ],
      date: fmtDate(bench.date),
      script: "scripts/competitive_suite.sh",
    });
  }

  const ban = reports.ban;
  if (ban && ban.ban_latency_ms != null) {
    const ms = ban.ban_latency_ms;
    const target = ban.target_ms ?? 75;
    const prodTarget = ban.prod_target_ms ?? 50;
    const pass = ban.pass === true || ms <= target;
    const prodOk = ms <= prodTarget;
    out.push({
      id: "ban-latency",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "Tehdit tespitinden kernel ban'a kadar geçen süreyi ölçüyoruz",
        "We measure time from threat detection to kernel ban",
      ),
      purpose: L(
        locale,
        "Ban'ın saniyeler değil milisaniyeler içinde devreye girdiğini gösterir.",
        "Shows bans engage in milliseconds, not seconds.",
      ),
      verdict: pass
        ? L(
            locale,
            `Medyan ban gecikmesi ${ms.toFixed(1)} ms — hedef <${target} ms${ban.ipset_confirmed ? ", ipset doğrulandı" : ""}${prodOk ? "" : ` (prod hedef <${prodTarget} ms — VPS'te ölçülecek)`}.`,
            `Median ban latency ${ms.toFixed(1)} ms — under ${target} ms target${ban.ipset_confirmed ? ", ipset confirmed" : ""}${prodOk ? "" : ` (prod target <${prodTarget} ms — measure on VPS)`}.`,
          )
        : L(
            locale,
            `Ban gecikmesi ${ms.toFixed(1)} ms — hedef <${target} ms aşıldı.`,
            `Ban latency ${ms.toFixed(1)} ms — exceeds ${target} ms target.`,
          ),
      metrics: [
        { label: L(locale, "Medyan", "Median"), value: `${ms.toFixed(1)} ms` },
        ...((ban.p90_ms != null)
          ? [{ label: "P90", value: `${ban.p90_ms.toFixed(1)} ms` }]
          : []),
      ],
      date: fmtDate(ban.date),
      script: "scripts/bench_ban_latency.sh",
    });
  } else if (ban?.note) {
    out.push({
      id: "ban-latency",
      status: "pending",
      title: L(
        locale,
        "Tehdit tespitinden kernel ban'a kadar geçen süreyi ölçüyoruz",
        "We measure time from threat detection to kernel ban",
      ),
      purpose: L(
        locale,
        "Ban'ın saniyeler değil milisaniyeler içinde devreye girdiğini gösterir.",
        "Shows bans engage in milliseconds, not seconds.",
      ),
      verdict: L(locale, "Henüz çalıştırılmadı — root ile bench script gerekli.", "Not run yet — bench script requires root."),
      metrics: [],
      script: "scripts/bench_ban_latency.sh",
    });
  }

  const live = reports.live;
  if (live) {
    const bp = live.ban_pipeline;
    const ipcOk = live.ipc === "ok" || live.ipc === "connected";
    const pass = ipcOk && (bp?.failed ?? 0) === 0;
    out.push({
      id: "live-pipeline",
      status: pass ? "pass" : live ? "fail" : "pending",
      title: L(
        locale,
        "Canlı ortamda ban hattının (IPC → XDP/ipset) çalıştığını doğruluyoruz",
        "We verify the live ban pipeline (IPC → XDP/ipset) is operational",
      ),
      purpose: L(
        locale,
        "Log analizörü ile kernel katmanının gerçekten konuştuğunu kanıtlar.",
        "Proves log analyzer and kernel layer are actually connected.",
      ),
      verdict: pass
        ? L(
            locale,
            `IPC ${live.ipc ?? "—"}; ${bp?.ipc ?? 0} IPC ban, ${bp?.xdp ?? 0} XDP, ${bp?.ipset ?? 0} ipset — hata yok.`,
            `IPC ${live.ipc ?? "—"}; ${bp?.ipc ?? 0} IPC bans, ${bp?.xdp ?? 0} XDP, ${bp?.ipset ?? 0} ipset — no failures.`,
          )
        : L(
            locale,
            `Ban hattında sorun — IPC: ${live.ipc ?? "?"}, başarısız: ${bp?.failed ?? "?"}.`,
            `Ban pipeline issue — IPC: ${live.ipc ?? "?"}, failed: ${bp?.failed ?? "?"}.`,
          ),
      metrics: [
        { label: "EPS", value: live.metrics?.eps != null ? String(live.metrics.eps) : "—" },
        {
          label: "XDP",
          value: live.daemon?.xdp_active ? "ON" : "OFF",
        },
      ],
      date: fmtDate(live.generated_at),
      script: "scripts/competitive_suite.sh",
    });
  }

  const whRoute = reports.webhookRoute;
  if (whRoute) {
    const pass = whRoute.pass === true;
    out.push({
      id: "webhook-route-proof",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "Telegram route + batch — #waf/#ban yönlendirme",
        "Telegram route + batch — #waf/#ban routing",
      ),
      purpose: L(
        locale,
        "WARN→DM, CRIT/ban→kanal ve opsiyonel batch özetinin doğru hedefe gittiğini kanıtlar.",
        "Proves WARN→DM, CRIT/ban→channel and optional batch summary routing.",
      ),
      verdict: pass
        ? L(
            locale,
            `Mod ${whRoute.mode ?? "—"}; route ${whRoute.route_enabled ? "ON" : "OFF"}, batch ${whRoute.batch_sec ?? 0}s${whRoute.prod_e2e?.ok ? " — prod E2E OK" : ""}.`,
            `Mode ${whRoute.mode ?? "—"}; route ${whRoute.route_enabled ? "ON" : "OFF"}, batch ${whRoute.batch_sec ?? 0}s${whRoute.prod_e2e?.ok ? " — prod E2E OK" : ""}.`,
          )
        : L(
            locale,
            whRoute.fail_reason || "bash scripts/webhook_route_proof.sh",
            whRoute.fail_reason || "bash scripts/webhook_route_proof.sh",
          ),
      metrics: [
        { label: "mode", value: whRoute.mode ?? "—" },
        { label: "route", value: whRoute.route_enabled ? "ON" : "OFF" },
        { label: "batch", value: String(whRoute.batch_sec ?? 0) },
        {
          label: "prod",
          value: whRoute.prod_e2e?.skipped
            ? "skip"
            : whRoute.prod_e2e?.ok
              ? "OK"
              : "—",
        },
      ],
      date: fmtDate(whRoute.date),
      script: "scripts/webhook_route_proof.sh",
    });
  }

  const tgLive = reports.webhookTelegramLive;
  if (tgLive) {
    const pass = tgLive.pass === true;
    out.push({
      id: "webhook-telegram-live",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "Telegram prod — canlı alert/ban/trap/batch",
        "Telegram prod — live alert/ban/trap/batch",
      ),
      purpose: L(
        locale,
        "Gerçek bot token ile CRIT/WARN route + batch özetinin Telegram’a gittiğini kanıtlar.",
        "Proves real bot token delivers CRIT/WARN route + batch summary to Telegram.",
      ),
      verdict: pass
        ? L(
            locale,
            `mod ${tgLive.mode ?? "prod"}; route ${tgLive.route ? "ON" : "OFF"}, batch ${tgLive.batch_sec ?? 0}s — ${(tgLive.kinds ?? []).join(", ")}.`,
            `mode ${tgLive.mode ?? "prod"}; route ${tgLive.route ? "ON" : "OFF"}, batch ${tgLive.batch_sec ?? 0}s — ${(tgLive.kinds ?? []).join(", ")}.`,
          )
        : L(
            locale,
            "sudo bash scripts/webhook_install_prod.sh --test-all",
            "sudo bash scripts/webhook_install_prod.sh --test-all",
          ),
      metrics: [
        { label: "route", value: tgLive.route ? "ON" : "OFF" },
        { label: "batch", value: String(tgLive.batch_sec ?? 0) },
        {
          label: "kinds",
          value: tgLive.kinds?.length ? tgLive.kinds.join(",") : "—",
        },
      ],
      date: fmtDate(tgLive.date),
      script: "scripts/webhook_install_prod.sh --test-all",
    });
  }

  const tgAck = reports.webhookTelegramAckLive;
  if (tgAck) {
    const pass = tgAck.pass === true;
    out.push({
      id: "webhook-telegram-ack-live",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "Telegram Gördüm — DB ack sayacı (24h)",
        "Telegram Ack — DB counter (24h)",
      ),
      purpose: L(
        locale,
        "Inline Gördüm onayının events.db telegram_acks tablosuna yazıldığını ve guardian-status/metrics sayacını artırdığını kanıtlar.",
        "Proves inline Ack writes to events.db telegram_acks and bumps guardian-status/metrics counters.",
      ),
      verdict: pass
        ? L(
            locale,
            `ack ${tgAck.ack_before ?? 0}→${tgAck.ack_after ?? 0}; unacked ${tgAck.unacked_before ?? 0}→${tgAck.unacked_after ?? 0} (key ${tgAck.ack_key ?? tgAck.test_ip ?? "—"}).`,
            `ack ${tgAck.ack_before ?? 0}→${tgAck.ack_after ?? 0}; unacked ${tgAck.unacked_before ?? 0}→${tgAck.unacked_after ?? 0} (key ${tgAck.ack_key ?? tgAck.test_ip ?? "—"}).`,
          )
        : L(
            locale,
            tgAck.fail_reason ?? "bash scripts/webhook_ack_e2e.sh",
            tgAck.fail_reason ?? "bash scripts/webhook_ack_e2e.sh",
          ),
      metrics: [
        { label: "ack", value: `${tgAck.ack_before ?? 0}→${tgAck.ack_after ?? 0}` },
        { label: "unacked", value: `${tgAck.unacked_before ?? 0}→${tgAck.unacked_after ?? 0}` },
        {
          label: "prom",
          value: tgAck.metrics_ack_24h != null ? String(tgAck.metrics_ack_24h) : "—",
        },
      ],
      date: fmtDate(tgAck.date),
      script: "scripts/webhook_ack_e2e.sh",
    });
  }

  const tgUndo = reports.telegramOperatorUndoE2e;
  if (tgUndo) {
    const pass = tgUndo.pass === true;
    out.push({
      id: "telegram-operator-undo-e2e",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "Telegram operatör undo — SIGUSR2 (WL/Sessiz)",
        "Telegram operator undo — SIGUSR2 (WL/mute)",
      ),
      purpose: L(
        locale,
        "WL / Sessiz / Unban yanlış tıklamalarını poll kesmeden geri alır; journal [TELEGRAM_UNDO] kanıtı.",
        "Reverts mistaken WL / mute / unban without interrupting poll; journal [TELEGRAM_UNDO] proof.",
      ),
      verdict: pass
        ? L(
            locale,
            `SIGUSR2 · ${tgUndo.mode ?? "sigusr2"} · IP ${tgUndo.ip ?? "—"}.`,
            `SIGUSR2 · ${tgUndo.mode ?? "sigusr2"} · IP ${tgUndo.ip ?? "—"}.`,
          )
        : L(
            locale,
            tgUndo.fail_reason ?? "bash scripts/telegram_operator_undo_e2e.sh",
            tgUndo.fail_reason ?? "bash scripts/telegram_operator_undo_e2e.sh",
          ),
      metrics: [
        { label: "mode", value: tgUndo.mode ?? "—" },
        { label: "ip", value: tgUndo.ip ?? "—" },
        { label: "pass", value: pass ? "OK" : "FAIL" },
      ],
      date: fmtDate(tgUndo.date),
      script: "scripts/telegram_operator_undo_e2e.sh",
    });
  }

  const tgSoc = reports.telegramSocGate;
  if (tgSoc) {
    const pass = tgSoc.pass === true;
    out.push({
      id: "telegram-soc-gate",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "Telegram SOC — timeline + harita + webhook",
        "Telegram SOC — timeline + map + webhook",
      ),
      purpose: L(
        locale,
        "Üç operatör yüzeyinin aynı anda canlı kanıt ürettiğini doğrular: SOC timeline, attack map, Webhook panel.",
        "Proves three operator surfaces emit live evidence together: SOC timeline, attack map, webhook panel.",
      ),
      verdict: pass
        ? L(
            locale,
            `SOC ${tgSoc.soc_entries ?? 0} (ack ${tgSoc.soc_ack ?? 0}) · harita ${tgSoc.map_markers ?? 0} · bans ack ${tgSoc.bans_acks ?? 0} · webhook ${tgSoc.prod_e2e_ok ? "prod" : ""}${tgSoc.undo_e2e_ok ? " undo" : ""}.`,
            `SOC ${tgSoc.soc_entries ?? 0} (ack ${tgSoc.soc_ack ?? 0}) · map ${tgSoc.map_markers ?? 0} · bans ack ${tgSoc.bans_acks ?? 0} · webhook ${tgSoc.prod_e2e_ok ? "prod" : ""}${tgSoc.undo_e2e_ok ? " undo" : ""}.`,
          )
        : L(
            locale,
            tgSoc.fail_reason ?? "bash scripts/telegram_soc_gate.sh",
            tgSoc.fail_reason ?? "bash scripts/telegram_soc_gate.sh",
          ),
      metrics: [
        { label: "soc", value: String(tgSoc.soc_entries ?? 0) },
        { label: "map", value: String(tgSoc.map_markers ?? 0) },
        { label: "bans", value: String(tgSoc.bans_acks ?? 0) },
        {
          label: "webhook",
          value: tgSoc.prod_e2e_ok || tgSoc.undo_e2e_ok ? "OK" : "—",
        },
      ],
      date: fmtDate(tgSoc.date),
      script: "scripts/telegram_soc_gate.sh",
    });
  }

  const bansTg = reports.bansTelegramOps;
  if (bansTg) {
    const pass = bansTg.pass === true;
    out.push({
      id: "bans-telegram-ops",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "Bans + Telegram ack — operatör paneli API",
        "Bans + Telegram ack — operator panel API",
      ),
      purpose: L(
        locale,
        "/api/telegram-acks ve /bans?search= ile operatör panelinin canlı veri aldığını kanıtlar.",
        "Proves operator panel gets live data via /api/telegram-acks and /bans?search=.",
      ),
      verdict: pass
        ? L(
            locale,
            `IP ${bansTg.test_ip ?? "—"} · ack ${bansTg.test_ip_ack ? "evet" : "hayır"}${bansTg.test_ip_operator ? ` (${bansTg.test_ip_operator})` : ""} · ban arama ${bansTg.test_ip_banned ? "hit" : "yok"}.`,
            `IP ${bansTg.test_ip ?? "—"} · ack ${bansTg.test_ip_ack ? "yes" : "no"}${bansTg.test_ip_operator ? ` (${bansTg.test_ip_operator})` : ""} · ban search ${bansTg.test_ip_banned ? "hit" : "miss"}.`,
          )
        : L(
            locale,
            bansTg.fail_reason ?? "bash scripts/bans_telegram_ops_e2e.sh",
            bansTg.fail_reason ?? "bash scripts/bans_telegram_ops_e2e.sh",
          ),
      metrics: [
        { label: "acks", value: String(bansTg.acks_count ?? 0) },
        {
          label: "ban",
          value: bansTg.test_ip_banned ? "hit" : "—",
        },
        {
          label: "operator",
          value: bansTg.test_ip_operator ?? "—",
        },
      ],
      date: fmtDate(bansTg.date),
      script: "scripts/bans_telegram_ops_e2e.sh",
    });
  }

  const edgeGate = reports.edgeProtectionGate;
  if (edgeGate) {
    const pass = edgeGate.pass === true;
    const nginxOk = edgeGate.nginx_log_format || edgeGate.nginx_snippets;
    out.push({
      id: "edge-protection-gate",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "Edge koruma — nginx + XDP/ipset + threat intel",
        "Edge protection — nginx + XDP/ipset + threat intel",
      ),
      purpose: L(
        locale,
        "CDN öncesi origin katmanı: nginx log formatı, ipset/XDP ban yolu ve threat-intel özet DB.",
        "Pre-CDN origin layer: nginx log format, ipset/XDP ban path, and threat-intel summary DB.",
      ),
      verdict: pass
        ? L(
            locale,
            `IPC ${edgeGate.ipc ?? "—"} · ${edgeGate.xdp_mode ?? "—"} · nginx ${nginxOk ? "OK" : "—"} · ipset ${edgeGate.ipset_entries ?? 0} · WL ${edgeGate.whitelist_count ?? 0}.`,
            `IPC ${edgeGate.ipc ?? "—"} · ${edgeGate.xdp_mode ?? "—"} · nginx ${nginxOk ? "OK" : "—"} · ipset ${edgeGate.ipset_entries ?? 0} · WL ${edgeGate.whitelist_count ?? 0}.`,
          )
        : L(
            locale,
            edgeGate.fail_reason ?? "bash scripts/edge_protection_gate.sh",
            edgeGate.fail_reason ?? "bash scripts/edge_protection_gate.sh",
          ),
      metrics: [
        { label: "ipc", value: edgeGate.ipc ?? "—" },
        { label: "xdp", value: edgeGate.xdp_mode ?? "—" },
        { label: "ipset", value: String(edgeGate.ipset_entries ?? 0) },
      ],
      date: fmtDate(edgeGate.date),
      script: "scripts/edge_protection_gate.sh",
    });
  }

  const grafanaParity = reports.grafanaParityGate;
  if (grafanaParity) {
    const pass = grafanaParity.pass === true;
    out.push({
      id: "grafana-parity-gate",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "Grafana parity — dashboard mini panel ↔ JSON",
        "Grafana parity — dashboard mini panels ↔ JSON",
      ),
      purpose: L(
        locale,
        "grafanaPanels.ts metrikleri grafana-dashboard.json ile aynı kümede mi doğrular.",
        "Verifies grafanaPanels.ts metrics match grafana-dashboard.json.",
      ),
      verdict: pass
        ? L(
            locale,
            `Panel ${grafanaParity.panel_metrics ?? 0} · dashboard ${grafanaParity.dashboard_metrics ?? 0} metrik eşleşti.`,
            `Panel ${grafanaParity.panel_metrics ?? 0} · dashboard ${grafanaParity.dashboard_metrics ?? 0} metrics matched.`,
          )
        : L(
            locale,
            grafanaParity.fail_reason ?? "bash scripts/grafana_parity_gate.sh",
            grafanaParity.fail_reason ?? "bash scripts/grafana_parity_gate.sh",
          ),
      metrics: [
        { label: "panel", value: String(grafanaParity.panel_metrics ?? 0) },
        { label: "dash", value: String(grafanaParity.dashboard_metrics ?? 0) },
      ],
      date: fmtDate(grafanaParity.date),
      script: "scripts/grafana_parity_gate.sh",
    });
  }

  const webPreview = reports.websitePreviewGate;
  if (webPreview) {
    const pass = webPreview.pass === true;
    out.push({
      id: "website-preview-gate",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "Site preview — landing test parity",
        "Site preview — landing test parity",
      ),
      purpose: L(
        locale,
        "landing/lib/tests.ts ile competitive-proof parity (yerel test-kart) doğrular.",
        "Verifies landing/lib/tests.ts parity with competitive-proof (local test cards).",
      ),
      verdict: pass
        ? L(
            locale,
            `Site ${webPreview.site_fail === 0 ? webPreview.site_tests ?? 0 : webPreview.site_pass ?? 0}/${webPreview.expected_tests ?? 0} parity · grafana ${webPreview.has_grafana_parity ? "evet" : "hayır"} · edge ${webPreview.has_edge_gate ? "evet" : "hayır"}.`,
            `Site ${webPreview.site_fail === 0 ? webPreview.site_tests ?? 0 : webPreview.site_pass ?? 0}/${webPreview.expected_tests ?? 0} parity · grafana ${webPreview.has_grafana_parity ? "yes" : "no"} · edge ${webPreview.has_edge_gate ? "yes" : "no"}.`,
          )
        : L(
            locale,
            webPreview.fail_reason ?? "bash scripts/website_preview_gate.sh",
            webPreview.fail_reason ?? "bash scripts/website_preview_gate.sh",
          ),
      metrics: [
        { label: "site", value: String(webPreview.site_tests ?? 0) },
        { label: "proof", value: String(webPreview.expected_tests ?? 0) },
      ],
      date: fmtDate(webPreview.date),
      script: "scripts/website_preview_gate.sh",
    });
  }

  const escGate = reports.enterpriseEscalationGate;
  if (escGate) {
    const pass = escGate.pass === true;
    out.push({
      id: "enterprise-escalation-gate",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "Enterprise escalation — operatör playbook",
        "Enterprise escalation — operator playbook",
      ),
      purpose: L(
        locale,
        "P1–P4 runbook + Telegram/edge operatör kapılarının canlı geçtiğini doğrular.",
        "Verifies P1–P4 runbook and live Telegram/edge operator gates.",
      ),
      verdict: pass
        ? L(
            locale,
            `Dok ${escGate.doc_sections ?? 0} bölüm · canlı kapı ${escGate.live_gates_ok ?? 0}/${escGate.live_gates_total ?? 0}.`,
            `Doc ${escGate.doc_sections ?? 0} sections · live gates ${escGate.live_gates_ok ?? 0}/${escGate.live_gates_total ?? 0}.`,
          )
        : L(
            locale,
            escGate.fail_reason ?? "bash scripts/enterprise_escalation_gate.sh",
            escGate.fail_reason ?? "bash scripts/enterprise_escalation_gate.sh",
          ),
      metrics: [
        { label: "doc", value: String(escGate.doc_sections ?? 0) },
        { label: "gates", value: `${escGate.live_gates_ok ?? 0}/${escGate.live_gates_total ?? 0}` },
      ],
      date: fmtDate(escGate.date),
      script: "scripts/enterprise_escalation_gate.sh",
    });
  }

  const vmPrep = reports.vmHostPrepGate;
  if (vmPrep) {
    const pass = vmPrep.pass === true;
    out.push({
      id: "vm-host-prep-gate",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "VM host prep — sync öncesi kanıt",
        "VM host prep — pre-sync evidence",
      ),
      purpose: L(
        locale,
        "Laptop HOST'ta vm_sync öncesi post_install + 64 test kanıtını doğrular.",
        "Verifies post_install + 64-test proof on laptop HOST before vm_sync.",
      ),
      verdict: pass
        ? L(
            locale,
            `ctx ${vmPrep.context ?? "—"} · proof ${vmPrep.proof_pass ?? 0}/${vmPrep.proof_tests ?? 0} · post_install FAIL=${vmPrep.post_install_fail ?? 0}.`,
            `ctx ${vmPrep.context ?? "—"} · proof ${vmPrep.proof_pass ?? 0}/${vmPrep.proof_tests ?? 0} · post_install FAIL=${vmPrep.post_install_fail ?? 0}.`,
          )
        : L(
            locale,
            vmPrep.fail_reason ?? "bash scripts/vm_host_prep_gate.sh",
            vmPrep.fail_reason ?? "bash scripts/vm_host_prep_gate.sh",
          ),
      metrics: [
        { label: "proof", value: `${vmPrep.proof_pass ?? 0}/${vmPrep.proof_tests ?? 0}` },
        { label: "ctx", value: vmPrep.context ?? "—" },
      ],
      date: fmtDate(vmPrep.date),
      script: "scripts/vm_host_prep_gate.sh",
    });
  }

  const docsCons = reports.docsConsistencyGate;
  if (docsCons) {
    const pass = docsCons.pass === true;
    out.push({
      id: "docs-consistency-gate",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "Docs consistency — 64 test + HOSTING §8b",
        "Docs consistency — 64 test + HOSTING §8b",
      ),
      purpose: L(
        locale,
        "Doküman vitrin tutarlılığı: 64 test sayısı, Telegram cross-link, script matrisi.",
        "Doc vitrine consistency: 64-test count, Telegram cross-link, script matrix.",
      ),
      verdict: pass
        ? L(
            locale,
            `checks OK=${docsCons.checks_ok ?? 0} · proof ${docsCons.proof_pass ?? 0}/${docsCons.proof_tests ?? 0} · §8b=${docsCons.hosting_8b ? "evet" : "hayır"}.`,
            `checks OK=${docsCons.checks_ok ?? 0} · proof ${docsCons.proof_pass ?? 0}/${docsCons.proof_tests ?? 0} · §8b=${docsCons.hosting_8b ? "yes" : "no"}.`,
          )
        : L(
            locale,
            docsCons.fail_reason ?? "bash scripts/docs_consistency_gate.sh",
            docsCons.fail_reason ?? "bash scripts/docs_consistency_gate.sh",
          ),
      metrics: [
        { label: "checks", value: String(docsCons.checks_ok ?? 0) },
        { label: "proof", value: `${docsCons.proof_pass ?? 0}/${docsCons.proof_tests ?? 0}` },
      ],
      date: fmtDate(docsCons.date),
      script: "scripts/docs_consistency_gate.sh",
    });
  }

  const vmFleet = reports.vmFleetGate;
  if (vmFleet) {
    const skipped = vmFleet.skipped === true;
    const pass = vmFleet.pass === true || skipped;
    const vmLabel = skipped ? "skip" : (vmFleet.vm_status ?? "—");
    out.push({
      id: "vm-fleet-gate",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "VM fleet keepalive — host + node-vm-02",
        "VM fleet keepalive — host + node-vm-02",
      ),
      purpose: L(
        locale,
        "LAPTOP_OPS filo dokümantasyonu ve iki düğümün /fleet üzerinde Online olduğunu doğrular.",
        "Verifies LAPTOP_OPS fleet docs and both nodes Online on /fleet.",
      ),
      verdict: pass
        ? L(
            locale,
            skipped
              ? `Rutin laptop (SKIP_FLEET) — ${vmFleet.host_agent ?? "host"}=${vmFleet.host_status ?? "—"} · tam filo: WITH_FLEET=1.`
              : `${vmFleet.host_agent ?? "host"}=${vmFleet.host_status ?? "—"} · ${vmFleet.vm_agent ?? "vm"}=${vmFleet.vm_status ?? "—"} · online=${vmFleet.online_count ?? 0}.`,
            skipped
              ? `Laptop routine (SKIP_FLEET) — ${vmFleet.host_agent ?? "host"}=${vmFleet.host_status ?? "—"} · full fleet: WITH_FLEET=1.`
              : `${vmFleet.host_agent ?? "host"}=${vmFleet.host_status ?? "—"} · ${vmFleet.vm_agent ?? "vm"}=${vmFleet.vm_status ?? "—"} · online=${vmFleet.online_count ?? 0}.`,
          )
        : L(
            locale,
            vmFleet.fail_reason ?? "bash scripts/vm_fleet_gate.sh",
            vmFleet.fail_reason ?? "bash scripts/vm_fleet_gate.sh",
          ),
      metrics: [
        { label: "host", value: vmFleet.host_status ?? "—" },
        { label: "vm", value: vmLabel },
      ],
      date: fmtDate(vmFleet.date),
      script: "scripts/vm_fleet_gate.sh",
    });
  }

  const laptopExc = reports.laptopExcellenceGate;
  if (laptopExc) {
    const pass = laptopExc.pass === true;
    out.push({
      id: "laptop-excellence-gate",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "Laptop excellence — demo hazırlık kapısı",
        "Laptop excellence — demo readiness gate",
      ),
      purpose: L(
        locale,
        "Servis, :8443, filo, kanıt zincirini tek kapıda özetler (VPS gerekmez).",
        "Summarizes services, :8443, fleet, and proof chain in one gate (no VPS).",
      ),
      verdict: pass
        ? L(
            locale,
            `OK=${laptopExc.ok ?? 0} WARN=${laptopExc.warn ?? 0} · proof ${laptopExc.proof_pass ?? 0}/${laptopExc.proof_tests ?? 0}.`,
            `OK=${laptopExc.ok ?? 0} WARN=${laptopExc.warn ?? 0} · proof ${laptopExc.proof_pass ?? 0}/${laptopExc.proof_tests ?? 0}.`,
          )
        : L(
            locale,
            `FAIL=${laptopExc.fail ?? 0} — bash scripts/laptop_excellence_gate.sh`,
            `FAIL=${laptopExc.fail ?? 0} — bash scripts/laptop_excellence_gate.sh`,
          ),
      metrics: [
        { label: "OK", value: String(laptopExc.ok ?? 0) },
        { label: "FAIL", value: String(laptopExc.fail ?? 0) },
      ],
      date: fmtDate(laptopExc.date),
      script: "scripts/laptop_excellence_gate.sh",
    });
  }

  const liveSite = reports.websiteLiveGate;
  if (liveSite) {
    const pass = liveSite.pass === true;
    out.push({
      id: "website-live-gate",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "Website live — canlı site /tests parity",
        "Website live — production /tests parity",
      ),
      purpose: L(
        locale,
        "ceniklinuxlogguardian.org üzerinde SRI + test kart sayısı competitive-proof ile uyumlu mu.",
        "Production domain SRI + test card count matches competitive-proof.",
      ),
      verdict: pass
        ? L(
            locale,
            `${liveSite.domain ?? "—"} · ${liveSite.live_cards ?? 0}/${liveSite.expected_tests ?? 0} kart · CSS=${liveSite.css_ok ? "evet" : "hayır"}.`,
            `${liveSite.domain ?? "—"} · ${liveSite.live_cards ?? 0}/${liveSite.expected_tests ?? 0} cards · CSS=${liveSite.css_ok ? "yes" : "no"}.`,
          )
        : L(
            locale,
            liveSite.fail_reason ?? "bash scripts/website_live_gate.sh",
            liveSite.fail_reason ?? "bash scripts/website_live_gate.sh",
          ),
      metrics: [
        { label: "live", value: `${liveSite.live_cards ?? 0}/${liveSite.expected_tests ?? 0}` },
        { label: "domain", value: (liveSite.domain ?? "—").slice(0, 20) },
      ],
      date: fmtDate(liveSite.date),
      script: "scripts/website_live_gate.sh",
    });
  }

  const releaseReady = reports.releaseReadyGate;
  if (releaseReady) {
    const pass = releaseReady.pass === true;
    const arts = releaseReady.artifacts;
    const artOk =
      arts?.competitive_proof_pdf && arts?.data_room_zip && arts?.release_pack_zip;
    out.push({
      id: "release-ready-gate",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "Release ready — GitHub öncesi zincir kapısı",
        "Release ready — pre-GitHub release chain gate",
      ),
      purpose: L(
        locale,
        "ZIP/PDF artefakt, docs tutarlılığı, canlı site ve filo — tek kapıda.",
        "ZIP/PDF artifacts, docs consistency, live site and fleet — one gate.",
      ),
      verdict: pass
        ? L(
            locale,
            `release=${releaseReady.release_ready_ok ? "evet" : "hayır"} · docs=${releaseReady.docs_consistency_ok ? "evet" : "hayır"} · proof ${releaseReady.proof_pass ?? 0}/${releaseReady.proof_tests ?? 0}.`,
            `release=${releaseReady.release_ready_ok ? "yes" : "no"} · docs=${releaseReady.docs_consistency_ok ? "yes" : "no"} · proof ${releaseReady.proof_pass ?? 0}/${releaseReady.proof_tests ?? 0}.`,
          )
        : L(
            locale,
            releaseReady.fail_reason ?? "bash scripts/release_ready_gate.sh",
            releaseReady.fail_reason ?? "bash scripts/release_ready_gate.sh",
          ),
      metrics: [
        { label: "artefakt", value: artOk ? "3/3" : "eksik" },
        { label: "proof", value: `${releaseReady.proof_pass ?? 0}/${releaseReady.proof_tests ?? 0}` },
      ],
      date: fmtDate(releaseReady.date),
      script: "scripts/release_ready_gate.sh",
    });
  }

  const demoGate = reports.demoRehearsalGate;
  if (demoGate) {
    const pass = demoGate.pass === true;
    out.push({
      id: "demo-rehearsal-gate",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "Demo rehearsal — 08:00 sunum kapısı",
        "Demo rehearsal — presentation readiness gate",
      ),
      purpose: L(
        locale,
        "demo_3min + :8443/tests + kanıt PDF + canlı site — tek kapıda sunum hazırlığı.",
        "demo_3min + :8443/tests + proof PDF + live site — one presentation gate.",
      ),
      verdict: pass
        ? L(
            locale,
            `demo_3min=${demoGate.demo_3min_ok ? "evet" : "hayır"} · dash=${demoGate.dashboard_ok ? "evet" : "hayır"} · proof ${demoGate.proof_pass ?? 0}/${demoGate.proof_tests ?? 0}.`,
            `demo_3min=${demoGate.demo_3min_ok ? "yes" : "no"} · dash=${demoGate.dashboard_ok ? "yes" : "no"} · proof ${demoGate.proof_pass ?? 0}/${demoGate.proof_tests ?? 0}.`,
          )
        : L(
            locale,
            demoGate.fail_reason ?? "bash scripts/demo_rehearsal_gate.sh",
            demoGate.fail_reason ?? "bash scripts/demo_rehearsal_gate.sh",
          ),
      metrics: [
        { label: "PDF", value: demoGate.pdf_ok ? "evet" : "hayır" },
        { label: "live", value: demoGate.website_live_ok === true ? "evet" : demoGate.website_live_skipped ? "skip" : "hayır" },
      ],
      date: fmtDate(demoGate.date),
      script: "scripts/demo_rehearsal_gate.sh",
    });
  }

  const shipGate = reports.presentationShipGate;
  if (shipGate) {
    const pass = shipGate.pass === true;
    out.push({
      id: "presentation-ship-gate",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "Presentation ship — sunum + GitHub zinciri",
        "Presentation ship — demo + release chain",
      ),
      purpose: L(
        locale,
        "demo_rehearsal + release_ready — tek komutta sunum ve ship hazırlığı.",
        "demo_rehearsal + release_ready — one-command presentation and ship readiness.",
      ),
      verdict: pass
        ? L(
            locale,
            `demo=${shipGate.demo_rehearsal_ok ? "evet" : "hayır"} · release=${shipGate.release_ready_ok ? "evet" : "hayır"} · artefakt ${shipGate.artifacts_count ?? "—"} · proof ${shipGate.proof_pass ?? 0}/${shipGate.proof_tests ?? 0}.`,
            `demo=${shipGate.demo_rehearsal_ok ? "yes" : "no"} · release=${shipGate.release_ready_ok ? "yes" : "no"} · artefakt ${shipGate.artifacts_count ?? "—"} · proof ${shipGate.proof_pass ?? 0}/${shipGate.proof_tests ?? 0}.`,
          )
        : L(
            locale,
            shipGate.fail_reason ?? "bash scripts/presentation_ship_gate.sh",
            shipGate.fail_reason ?? "bash scripts/presentation_ship_gate.sh",
          ),
      metrics: [
        { label: "artefakt", value: shipGate.artifacts_count ?? "—" },
        { label: "proof", value: `${shipGate.proof_pass ?? 0}/${shipGate.proof_tests ?? 0}` },
      ],
      date: fmtDate(shipGate.date),
      script: "scripts/presentation_ship_gate.sh",
    });
  }

  const videoGate = reports.demoVideoGate;
  if (videoGate) {
    const pass = videoGate.pass === true;
    const siemVal = videoGate.siem_skipped
      ? "skip"
      : videoGate.siem_export_ok
        ? "evet"
        : "hayır";
    const siemValEn = videoGate.siem_skipped
      ? "skip"
      : videoGate.siem_export_ok
        ? "yes"
        : "no";
    out.push({
      id: "demo-video-gate",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "Demo video — 04:00 kayıt hazırlık kapısı",
        "Demo video — 04:00 recording readiness gate",
      ),
      purpose: L(
        locale,
        "demo_video + SIEM + PDF + presentation_ship — interaktif kayıt öncesi otomatik doğrulama.",
        "demo_video + SIEM + PDF + presentation_ship — automated pre-recording checks.",
      ),
      verdict: pass
        ? L(
            locale,
            `PDF=${videoGate.pdf_ok ? "evet" : "hayır"} · ship=${videoGate.presentation_ship_ok ? "evet" : "hayır"} · SIEM=${siemVal} · SOC=${videoGate.telegram_soc_ok ? "evet" : "hayır"}.`,
            `PDF=${videoGate.pdf_ok ? "yes" : "no"} · ship=${videoGate.presentation_ship_ok ? "yes" : "no"} · SIEM=${siemValEn} · SOC=${videoGate.telegram_soc_ok ? "yes" : "no"}.`,
          )
        : L(
            locale,
            videoGate.fail_reason ?? "bash scripts/demo_video_gate.sh",
            videoGate.fail_reason ?? "bash scripts/demo_video_gate.sh",
          ),
      metrics: [
        { label: "SIEM", value: siemVal },
        { label: "PDF", value: videoGate.pdf_ok ? "evet" : "hayır" },
      ],
      date: fmtDate(videoGate.date),
      script: "scripts/demo_video_gate.sh",
    });
  }

  const githubShip = reports.githubShipGate;
  if (githubShip) {
    const pass = githubShip.pass === true;
    const closureVal = githubShip.security_closure_skipped
      ? "skip"
      : githubShip.security_closure_ok
        ? "evet"
        : "hayır";
    const closureValEn = githubShip.security_closure_skipped
      ? "skip"
      : githubShip.security_closure_ok
        ? "yes"
        : "no";
    out.push({
      id: "github-ship-gate",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "GitHub ship — push öncesi tam kapı",
        "GitHub ship — full pre-push gate",
      ),
      purpose: L(
        locale,
        "presentation_ship + security_closure + secret scan — git push hazırlığı.",
        "presentation_ship + security_closure + secret scan — git push readiness.",
      ),
      verdict: pass
        ? L(
            locale,
            `ship=${githubShip.presentation_ship_ok ? "evet" : "hayır"} · closure=${closureVal} · secret=${githubShip.secret_scan_ok ? "evet" : "hayır"} · proof ${githubShip.proof_pass ?? 0}/${githubShip.proof_tests ?? 0}.`,
            `ship=${githubShip.presentation_ship_ok ? "yes" : "no"} · closure=${closureValEn} · secret=${githubShip.secret_scan_ok ? "yes" : "no"} · proof ${githubShip.proof_pass ?? 0}/${githubShip.proof_tests ?? 0}.`,
          )
        : L(
            locale,
            githubShip.fail_reason ?? "bash scripts/github_ship_gate.sh",
            githubShip.fail_reason ?? "bash scripts/github_ship_gate.sh",
          ),
      metrics: [
        { label: "closure", value: closureVal },
        { label: "proof", value: `${githubShip.proof_pass ?? 0}/${githubShip.proof_tests ?? 0}` },
      ],
      date: fmtDate(githubShip.date),
      script: "scripts/github_ship_gate.sh",
    });
  }

  const laptopCore = reports.laptopCoreGate;
  if (laptopCore) {
    const pass = laptopCore.pass === true;
    const edgeVal = laptopCore.edge_skipped
      ? "skip"
      : laptopCore.edge_protection_ok
        ? "evet"
        : "hayır";
    const edgeValEn = laptopCore.edge_skipped
      ? "skip"
      : laptopCore.edge_protection_ok
        ? "yes"
        : "no";
    out.push({
      id: "laptop-core-gate",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "Laptop Core — edge + SOC + ban operatörü",
        "Laptop Core — edge + SOC + ban operator",
      ),
      purpose: L(
        locale,
        "Core vaadi: nginx→WAF→ban — edge koruma, Telegram SOC ve ban API tek kapıda.",
        "Core promise: nginx→WAF→ban — edge, Telegram SOC and ban API in one gate.",
      ),
      verdict: pass
        ? L(
            locale,
            `edge=${edgeVal} · soc=${laptopCore.telegram_soc_ok ? "evet" : "hayır"} · ban=${laptopCore.ban_ops_ok ? "evet" : "hayır"} · xdp=${laptopCore.xdp_mode ?? "—"}.`,
            `edge=${edgeValEn} · soc=${laptopCore.telegram_soc_ok ? "yes" : "no"} · ban=${laptopCore.ban_ops_ok ? "yes" : "no"} · xdp=${laptopCore.xdp_mode ?? "—"}.`,
          )
        : L(
            locale,
            laptopCore.fail_reason ?? "bash scripts/laptop_core_gate.sh",
            laptopCore.fail_reason ?? "bash scripts/laptop_core_gate.sh",
          ),
      metrics: [
        { label: "xdp", value: laptopCore.xdp_mode ?? "—" },
        { label: "proof", value: `${laptopCore.proof_pass ?? 0}/${laptopCore.proof_tests ?? 0}` },
      ],
      date: fmtDate(laptopCore.date),
      script: "scripts/laptop_core_gate.sh",
    });
  }

  const morningOp = reports.morningOperatorGate;
  if (morningOp) {
    const pass = morningOp.pass === true;
    const coreMode = morningOp.laptop_core_refreshed
      ? L(locale, "yenilendi", "refreshed")
      : L(locale, "rapor", "report");
    out.push({
      id: "morning-operator-gate",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "Morning operator — sabah hazırlık (hızlı)",
        "Morning operator — fast morning readiness",
      ),
      purpose: L(
        locale,
        "Rapor öncelikli sabah kapısı — demo_3min koşmaz, mevcut gate'leri bozmaz.",
        "Report-first morning gate — no demo_3min, non-destructive.",
      ),
      verdict: pass
        ? L(
            locale,
            `core=${morningOp.laptop_core_ok ? "evet" : "hayır"}(${coreMode}) · ship=${morningOp.presentation_ship_ok ? "evet" : "hayır"} · proof ${morningOp.proof_pass ?? 0}/${morningOp.proof_tests ?? 0}.`,
            `core=${morningOp.laptop_core_ok ? "yes" : "no"}(${coreMode}) · ship=${morningOp.presentation_ship_ok ? "yes" : "no"} · proof ${morningOp.proof_pass ?? 0}/${morningOp.proof_tests ?? 0}.`,
          )
        : L(
            locale,
            morningOp.fail_reason ?? "bash scripts/morning_operator_gate.sh",
            morningOp.fail_reason ?? "bash scripts/morning_operator_gate.sh",
          ),
      metrics: [
        { label: "core", value: coreMode },
        { label: "proof", value: `${morningOp.proof_pass ?? 0}/${morningOp.proof_tests ?? 0}` },
      ],
      date: fmtDate(morningOp.date),
      script: "scripts/morning_operator_gate.sh",
    });
  }

  const dashBan = reports.dashboardBanApi;
  if (dashBan) {
    const pass = dashBan.pass === true;
    out.push({
      id: "dashboard-ban-api",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "Dashboard ban/unban — API + Docker relay (18090)",
        "Dashboard ban/unban — API + Docker relay (18090)",
      ),
      purpose: L(
        locale,
        "Operatörün /bans sayfasından kernel ban ve engel kaldırma yolunun canlı çalıştığını kanıtlar.",
        "Proves operators can ban and unban from /bans via the live kernel path.",
      ),
      verdict: pass
        ? L(
            locale,
            `Host ${dashBan.host_api?.ok ? "OK" : "—"}, relay ${dashBan.relay_api?.ok ? "OK" : "—"}, Docker ${dashBan.docker_api?.ok ? "OK" : "skip"} — ${dashBan.test_ip ?? "—"}.`,
            `Host ${dashBan.host_api?.ok ? "OK" : "—"}, relay ${dashBan.relay_api?.ok ? "OK" : "—"}, Docker ${dashBan.docker_api?.ok ? "OK" : "skip"} — ${dashBan.test_ip ?? "—"}.`,
          )
        : L(
            locale,
            dashBan.fail_reason || "Smoke başarısız — bash scripts/dashboard_ban_smoke.sh",
            dashBan.fail_reason || "Smoke failed — bash scripts/dashboard_ban_smoke.sh",
          ),
      metrics: [
        { label: "host", value: dashBan.host_api?.ok ? "OK" : "FAIL" },
        { label: "relay", value: dashBan.relay_api?.ok ? "OK" : "FAIL" },
        {
          label: "docker",
          value: dashBan.docker_api?.ok ? "OK" : dashBan.docker_api?.ok === false ? "FAIL" : "—",
        },
        { label: "path", value: dashBan.ban_path || "—" },
      ],
      date: fmtDate(dashBan.date),
      script: "scripts/dashboard_ban_smoke.sh",
    });
  }

  const liveDemo = reports.dashboardLiveDemo;
  if (liveDemo) {
    const cleanedUp = (liveDemo.note ?? "").includes("CLEANUP");
    const applied = liveDemo.bans_applied ?? 0;
    const synced = liveDemo.active_bans_synced ?? 0;
    const pass = liveDemo.pass === true || (applied > 0 && synced > 0);
    out.push({
      id: "dashboard-live-demo",
      status: pass ? "pass" : cleanedUp ? "warn" : "fail",
      title: L(
        locale,
        "Dashboard Live demo — harita + /bans ipset",
        "Dashboard live demo — map + /bans ipset",
      ),
      purpose: L(
        locale,
        "Operatör sunumunda 4 gerçek kernel ban → harita LIVE + /bans unban (proof yerine).",
        "Operator demo: 4 real kernel bans → LIVE map + /bans unban (not proof preview).",
      ),
      verdict: pass
        ? L(
            locale,
            `${applied} ban uygulandı, ${synced} sync — ${liveDemo.api ?? "8090"}. CLEANUP=1 ile geri alınır.`,
            `${applied} bans applied, ${synced} synced — ${liveDemo.api ?? "8090"}. Revert with CLEANUP=1.`,
          )
        : cleanedUp
          ? L(
              locale,
              "CLEANUP sonrası proof modu — bash scripts/dashboard_live_demo.sh ile tekrar live.",
              "After CLEANUP in proof mode — re-run bash scripts/dashboard_live_demo.sh for live.",
            )
          : L(
            locale,
            `Ban/sync başarısız — applied ${applied}, failed ${liveDemo.bans_failed ?? 0}.`,
            `Ban/sync failed — applied ${applied}, failed ${liveDemo.bans_failed ?? 0}.`,
          ),
      metrics: [
        { label: "applied", value: String(applied) },
        { label: "synced", value: String(synced) },
        { label: "api", value: liveDemo.api?.replace(/^https?:\/\//, "") ?? "—" },
        {
          label: "IPs",
          value: liveDemo.ips?.length ? liveDemo.ips.slice(0, 4).join(", ") : "—",
        },
      ],
      date: fmtDate(liveDemo.date),
      script: "scripts/dashboard_live_demo.sh",
    });
  }

  const attackMap = reports.attackMap;
  if (attackMap) {
    const pass = attackMap.pass === true;
    out.push({
      id: "attack-map",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "Attack map — geo marker + canlı ban",
        "Attack map — geo markers + live bans",
      ),
      purpose: L(
        locale,
        "Ana sayfa küre haritasında /api/attack-geo ile ban IP konumlarını kanıtlar.",
        "Proves banned IP locations on the home globe via /api/attack-geo.",
      ),
      verdict: pass
        ? L(
            locale,
            `${attackMap.markers ?? 0} marker, kaynak=${attackMap.data_source ?? "—"}; ack=${attackMap.ack_markers ?? 0} ban=${attackMap.ban_markers ?? 0}.`,
            `${attackMap.markers ?? 0} markers, source=${attackMap.data_source ?? "—"}; ack=${attackMap.ack_markers ?? 0} ban=${attackMap.ban_markers ?? 0}.`,
          )
        : L(
            locale,
            attackMap.fail_reason ?? "bash scripts/attack_map_e2e.sh",
            attackMap.fail_reason ?? "bash scripts/attack_map_e2e.sh",
          ),
      metrics: [
        { label: "markers", value: String(attackMap.markers ?? 0) },
        { label: "ack", value: String(attackMap.ack_markers ?? 0) },
        { label: "ban", value: String(attackMap.ban_markers ?? 0) },
      ],
      date: fmtDate(attackMap.date),
      script: "scripts/attack_map_e2e.sh",
    });
  }

  const siem = reports.siemExport;
  if (siem) {
    const pass = siem.pass === true;
    out.push({
      id: "siem-export",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "SIEM forwarder — alert + ban JSON (:5044)",
        "SIEM forwarder — alert + ban JSON (:5044)",
      ),
      purpose: L(
        locale,
        "Splunk/Elastic/Vector hedeflerine event_type JSON akışını kanıtlar.",
        "Proves event_type JSON stream to Splunk/Elastic/Vector targets.",
      ),
      verdict: pass
        ? L(
            locale,
            `alert ${siem.alert_seen ? "yes" : "no"}, ban ${siem.ban_seen ? "yes" : "no"}, port ${siem.port ?? 5044}.`,
            `alert ${siem.alert_seen ? "yes" : "no"}, ban ${siem.ban_seen ? "yes" : "no"}, port ${siem.port ?? 5044}.`,
          )
        : L(locale, "siem_export_e2e FAIL", "siem_export_e2e FAIL"),
      metrics: [
        { label: "alert", value: siem.alert_seen ? "yes" : "no" },
        { label: "ban", value: siem.ban_seen ? "yes" : "no" },
        { label: "port", value: String(siem.port ?? 5044) },
      ],
      date: fmtDate(siem.date),
      script: "scripts/siem_export_e2e.sh",
    });
  }

  const wasm = reports.wasm;
  if (wasm) {
    const nativeOk = wasm.mode === "native" && wasm.pass === true;
    out.push({
      id: "wasm-native",
      status: nativeOk ? "pass" : wasm.pass === false ? "fail" : "warn",
      title: L(
        locale,
        "Wasm native — block-sqli plugin smoke",
        "Wasm native — block-sqli plugin smoke",
      ),
      purpose: L(
        locale,
        "Wasmtime C API ile derlenmiş plugin'in SQLi logunda alert ürettiğini kanıtlar.",
        "Proves compiled Wasmtime plugin alerts on SQLi in log replay.",
      ),
      verdict: nativeOk
        ? L(
            locale,
            `mode ${wasm.mode}; ${wasm.plugins_native ?? 0} native plugin, ${wasm.alerts_on_sqli ?? 0} alert, ${wasm.plugin_bytes ?? 0} B.`,
            `mode ${wasm.mode}; ${wasm.plugins_native ?? 0} native plugins, ${wasm.alerts_on_sqli ?? 0} alerts, ${wasm.plugin_bytes ?? 0} B.`,
          )
        : L(
            locale,
            `Wasm stub veya gate FAIL — bash scripts/wasm_gate.sh`,
            `Wasm stub or gate FAIL — bash scripts/wasm_gate.sh`,
          ),
      metrics: [
        { label: "mode", value: wasm.mode ?? "—" },
        { label: "plugins", value: String(wasm.plugins_native ?? 0) },
        { label: "alerts", value: String(wasm.alerts_on_sqli ?? 0) },
        { label: "bytes", value: String(wasm.plugin_bytes ?? 0) },
      ],
      script: "scripts/wasm_gate.sh",
    });
  }

  const fleetMulti = reports.fleetMultiNode;
  if (fleetMulti) {
    const pass = fleetMulti.pass === true;
    const fleetMode = fleetMulti.mode as string | undefined;
    const modeHint =
      fleetMode === "multi-host"
        ? L(locale, " (VM+host)", " (VM+host)")
        : fleetMode === "laptop-simulated"
          ? L(locale, " (laptop sim)", " (laptop sim)")
          : "";
    out.push({
      id: "fleet-multi-node",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "Fleet multi-node — 2+ agent + dispatch",
        "Fleet multi-node — 2+ agents + dispatch",
      ),
      purpose: L(
        locale,
        "2+ telemetry agent ve /fleet/dispatch hedefli komut yolunu kanıtlar.",
        "Proves 2+ telemetry agents and targeted /fleet/dispatch routing.",
      ),
      verdict: pass
        ? L(
            locale,
            `${fleetMulti.agent_count ?? 0} agent, ${fleetMulti.online_count ?? 0} online; dispatch→${fleetMulti.dispatch_target ?? "—"}${modeHint}.`,
            `${fleetMulti.agent_count ?? 0} agents, ${fleetMulti.online_count ?? 0} online; dispatch→${fleetMulti.dispatch_target ?? "—"}${modeHint}.`,
          )
        : L(
            locale,
            fleetMulti.fail_reason ?? "bash scripts/fleet_multi_node_e2e.sh",
            fleetMulti.fail_reason ?? "bash scripts/fleet_multi_node_e2e.sh",
          ),
      metrics: [
        { label: L(locale, "agent", "agents"), value: String(fleetMulti.agent_count ?? 0) },
        { label: "online", value: String(fleetMulti.online_count ?? 0) },
        { label: "target", value: fleetMulti.dispatch_target ?? "—" },
        ...(fleetMode ? [{ label: "mode", value: fleetMode }] : []),
      ],
      date: fmtDate(fleetMulti.date),
      script: "scripts/fleet_multi_node_e2e.sh",
    });
  }

  const grafanaProv = reports.grafanaProvision;
  if (grafanaProv) {
    const pass = grafanaProv.pass === true;
    out.push({
      id: "grafana-alerts",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "Grafana — dashboard $tenant + alert kuralları",
        "Grafana — dashboard $tenant + alert rules",
      ),
      purpose: L(
        locale,
        "Prometheus tenant değişkeni ve Grafana alert provisioning kanıtı.",
        "Proves Prometheus tenant variable and Grafana alert provisioning.",
      ),
      verdict: pass
        ? L(
            locale,
            `uid ${grafanaProv.dashboard_uid ?? "log-guardian-01"}; ${grafanaProv.alert_rules ?? 0} alert (${grafanaProv.alert_rules_with_tenant ?? 0} tenant_id).`,
            `uid ${grafanaProv.dashboard_uid ?? "log-guardian-01"}; ${grafanaProv.alert_rules ?? 0} alerts (${grafanaProv.alert_rules_with_tenant ?? 0} tenant_id).`,
          )
        : L(
            locale,
            grafanaProv.fail_reason ?? "bash scripts/grafana_alert_gate.sh",
            grafanaProv.fail_reason ?? "bash scripts/grafana_alert_gate.sh",
          ),
      metrics: [
        { label: "dashboard", value: grafanaProv.dashboard_uid ?? "—" },
        { label: "alerts", value: String(grafanaProv.alert_rules ?? 0) },
        { label: "tenant", value: grafanaProv.tenant_variable ? "yes" : "no" },
      ],
      date: fmtDate(grafanaProv.date),
      script: "scripts/grafana_alert_gate.sh",
    });
  }

  const copilotOllama = reports.copilotOllama;
  if (copilotOllama) {
    const pass = copilotOllama.pass === true;
    const ollama = copilotOllama.ollama_reachable === true;
    const skipped = copilotOllama.mode === "skip";
    const status: ValidationTestResult["status"] = !pass
      ? "fail"
      : skipped
        ? "warn"
        : ollama
          ? "pass"
          : "warn";
    out.push({
      id: "copilot-ollama",
      status,
      title: L(
        locale,
        "Copilot — Ollama opsiyonel + fallback",
        "Copilot — optional Ollama + fallback",
      ),
      purpose: L(
        locale,
        "Copilot LLM (Ollama) isteğe bağlı; yoksa kural tabanlı fallback yanıt verir.",
        "Copilot LLM (Ollama) is optional; rule-based fallback when absent.",
      ),
      verdict: pass
        ? L(
            locale,
            `ollama=${ollama ? "evet" : "hayır"}; kaynak=${copilotOllama.reply_source ?? "—"}.`,
            `ollama=${ollama ? "yes" : "no"}; source=${copilotOllama.reply_source ?? "—"}.`,
          )
        : L(
            locale,
            copilotOllama.reason ?? "bash scripts/copilot_ollama_e2e.sh",
            copilotOllama.reason ?? "bash scripts/copilot_ollama_e2e.sh",
          ),
      metrics: [
        { label: "ollama", value: ollama ? "yes" : "no" },
        { label: L(locale, "kaynak", "source"), value: copilotOllama.reply_source ?? "—" },
      ],
      date: fmtDate(copilotOllama.date),
      script: "scripts/copilot_ollama_e2e.sh",
    });
  }

  const mktApi = reports.marketplaceSignedApi;
  if (mktApi) {
    const pass = mktApi.pass === true;
    const mode = mktApi.mode ?? "—";
    const status: ValidationTestResult["status"] = !pass
      ? "fail"
      : mode === "enterprise-live" && !mktApi.verify_ok
        ? "warn"
        : "pass";
    out.push({
      id: "marketplace-signed-api",
      status,
      title: L(
        locale,
        "Marketplace — imzali API (Enterprise tier)",
        "Marketplace — signed API (Enterprise tier)",
      ),
      purpose: L(
        locale,
        "Enterprise /api/marketplace/signed — imza dogrulama; Pro/Community 403.",
        "Enterprise /api/marketplace/signed — signature verify; Pro/Community get 403.",
      ),
      verdict: pass
        ? L(
            locale,
            `mode=${mode}; tier=${mktApi.tier ?? "—"}; imzali=${mktApi.packages_signed ?? 0}.`,
            `mode=${mode}; tier=${mktApi.tier ?? "—"}; signed=${mktApi.packages_signed ?? 0}.`,
          )
        : L(locale, "marketplace_signed_api FAIL", "marketplace_signed_api FAIL"),
      metrics: [
        { label: "mode", value: mode },
        { label: "tier", value: mktApi.tier ?? "—" },
      ],
      date: fmtDate(mktApi.date),
      script: "scripts/marketplace_signed_api_e2e.sh",
    });
  }

  const complianceExport = reports.complianceExport;
  if (complianceExport) {
    const pass = complianceExport.pass === true;
    const mode = complianceExport.mode ?? "—";
    const status: ValidationTestResult["status"] = !pass
      ? "fail"
      : mode === "pro-live" && complianceExport.pdf_ok && complianceExport.json_ok
        ? "pass"
        : mode === "tier_gate" || mode === "skip"
          ? "warn"
          : "pass";
    out.push({
      id: "compliance-export",
      status,
      title: L(
        locale,
        "Compliance — JSON/PDF export (Pro tier)",
        "Compliance — JSON/PDF export (Pro tier)",
      ),
      purpose: L(
        locale,
        "/api/reports/export — Pro tier PDF; Community 403.",
        "/api/reports/export — Pro tier PDF; Community gets 403.",
      ),
      verdict: pass
        ? L(
            locale,
            `mode=${mode}; tier=${complianceExport.tier ?? "—"}; kontrol=${complianceExport.controls ?? 0}; pdf=${complianceExport.pdf_ok ? "OK" : "—"}.`,
            `mode=${mode}; tier=${complianceExport.tier ?? "—"}; controls=${complianceExport.controls ?? 0}; pdf=${complianceExport.pdf_ok ? "OK" : "—"}.`,
          )
        : L(locale, "compliance_export FAIL", "compliance_export FAIL"),
      metrics: [
        { label: "mode", value: mode },
        { label: "tier", value: complianceExport.tier ?? "—" },
      ],
      date: fmtDate(complianceExport.date),
      script: "scripts/compliance_export_e2e.sh",
    });
  }

  const vpsXdp = reports.vpsXdp;
  if (vpsXdp) {
    const ok = vpsXdp.pass === true;
    const mode = vpsXdp.mode ?? "unknown";
    const status: ValidationTestResult["status"] =
      ok && (mode === "kernel-xdp" || mode === "skip") ? "pass" : ok ? "warn" : "fail";
    out.push({
      id: "vps-xdp-kernel",
      status,
      title: L(
        locale,
        "VPS XDP — kernel-xdp (laptop: ipset-fallback)",
        "VPS XDP — kernel-xdp (laptop: ipset-fallback)",
      ),
      purpose: L(
        locale,
        "Gerçek NIC/VPS'te eBPF XDP; laptop/VM'de ipset-fallback bilinçli.",
        "eBPF XDP on real NIC/VPS; laptop/VM ipset-fallback is expected.",
      ),
      verdict: ok
        ? L(
            locale,
            mode === "skip"
              ? `xdp_mode=${vpsXdp.xdp_mode ?? "—"}; laptop/VM — VPS kaniti atlandi (beklenen).`
              : `xdp_mode=${vpsXdp.xdp_mode ?? "—"}; iface=${vpsXdp.iface ?? "—"}.`,
            mode === "skip"
              ? `xdp_mode=${vpsXdp.xdp_mode ?? "—"}; laptop/VM — VPS proof skipped (expected).`
              : `xdp_mode=${vpsXdp.xdp_mode ?? "—"}; iface=${vpsXdp.iface ?? "—"}.`,
          )
        : L(
            locale,
            `vps_xdp_proof FAIL (${vpsXdp.fail_count ?? 0}).`,
            `vps_xdp_proof FAIL (${vpsXdp.fail_count ?? 0}).`,
          ),
      metrics: [
        { label: "mode", value: vpsXdp.xdp_mode ?? "—" },
        { label: "iface", value: vpsXdp.iface ?? "—" },
      ],
      date: fmtDate(vpsXdp.date),
      script: "scripts/vps_xdp_proof.sh",
    });
  }

  const arm64 = reports.arm64Build;
  if (arm64) {
    const ok = arm64.pass === true;
    const mode = arm64.mode ?? "—";
    const verified = arm64BinaryVerified(mode, arm64.file);
    const status: ValidationTestResult["status"] = !ok
      ? "fail"
      : verified
        ? "pass"
        : "warn";
    out.push({
      id: "arm64-build",
      status,
      title: L(locale, "ARM64 build — cross / dry-run", "ARM64 build — cross / dry-run"),
      purpose: L(
        locale,
        "aarch64 hedef derleme matrisi; laptop'ta dry-run WARN kabul.",
        "aarch64 build matrix; dry-run WARN on laptop is OK.",
      ),
      verdict: ok
        ? L(
            locale,
            `mode=${mode}; host=${arm64.host_arch ?? "—"} → ${arm64.target_arch ?? "aarch64"}.`,
            `mode=${mode}; host=${arm64.host_arch ?? "—"} → ${arm64.target_arch ?? "aarch64"}.`,
          )
        : L(locale, "build_arm64 FAIL", "build_arm64 FAIL"),
      metrics: [
        { label: "mode", value: mode },
        { label: L(locale, "host", "host"), value: arm64.host_arch ?? "—" },
      ],
      date: fmtDate(arm64.date),
      script: "scripts/build_arm64.sh",
    });
  }

  const prodStack = reports.prodStack;
  if (prodStack) {
    const ok = prodStack.pass === true;
    out.push({
      id: "prod-stack-e2e",
      status: ok ? "pass" : "fail",
      title: L(
        locale,
        "Prod stack — Wasm native + lineage + L7",
        "Prod stack — Wasm native + lineage + L7",
      ),
      purpose: L(
        locale,
        "Stub→prod zinciri: native Wasm plugin, canli lineage, L7 probe.",
        "Stub→prod chain: native Wasm plugin, live lineage, L7 probe.",
      ),
      verdict: ok
        ? L(
            locale,
            `wasm=${prodStack.wasm_mode ?? "—"}; lineage=${prodStack.lineage_risk ?? "—"}; L7=${prodStack.l7_probe_active ? "aktif" : "kapali"}; ipc=${prodStack.ipc ?? "—"}.`,
            `wasm=${prodStack.wasm_mode ?? "—"}; lineage=${prodStack.lineage_risk ?? "—"}; L7=${prodStack.l7_probe_active ? "active" : "off"}; ipc=${prodStack.ipc ?? "—"}.`,
          )
        : L(locale, "prod_stack_e2e FAIL", "prod_stack_e2e FAIL"),
      metrics: [
        { label: "wasm", value: prodStack.wasm_mode ?? "—" },
        { label: "L7", value: prodStack.l7_probe_active ? "yes" : "no" },
        { label: "xdp", value: prodStack.xdp_mode ?? "—" },
      ],
      date: fmtDate(prodStack.date),
      script: "scripts/prod_stack_e2e.sh",
    });
  }

  const phase100Fast = reports.phase100Fast;
  if (phase100Fast) {
    const ok = phase100Fast.pass === true;
    out.push({
      id: "phase100-fast-gate",
      status: ok ? "pass" : "fail",
      title: L(locale, "Faz 0–6 hizli kapisi", "Phase 0–6 fast gate"),
      purpose: L(
        locale,
        "PHASE100_FAST=1 — bench/soak kisaltilmis regresyon paketi.",
        "PHASE100_FAST=1 — shortened bench/soak regression bundle.",
      ),
      verdict: ok
        ? L(locale, `mode=${phase100Fast.mode ?? "fast"}; faz=${phase100Fast.phases ?? "0-6"}.`, `mode=${phase100Fast.mode ?? "fast"}; phases=${phase100Fast.phases ?? "0-6"}.`)
        : L(locale, "phase100_fast_gate FAIL", "phase100_fast_gate FAIL"),
      metrics: [
        { label: "mode", value: phase100Fast.mode ?? "fast" },
        { label: L(locale, "faz", "phases"), value: phase100Fast.phases ?? "0-6" },
      ],
      date: fmtDate(phase100Fast.date),
      script: "scripts/phase100_fast_gate.sh",
    });
  }

  const honeypot = reports.honeypotFeed;
  if (honeypot) {
    const pass = honeypot.pass === true;
    out.push({
      id: "honeypot-feed",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "Honeypot / deception — trap metrikleri",
        "Honeypot / deception — trap metrics",
      ),
      purpose: L(
        locale,
        "trap_watcher + tarpit deception hattının Prometheus sayaçlarını kanıtlar.",
        "Proves trap_watcher + tarpit deception path via Prometheus counters.",
      ),
      verdict: pass
        ? L(
            locale,
            `mod ${honeypot.mode ?? "—"}; honey=${honeypot.honey_traps_total ?? 0}, lfi=${honeypot.lfi_traps_total ?? 0}, c2=${honeypot.c2_traps_total ?? 0}.`,
            `mode ${honeypot.mode ?? "—"}; honey=${honeypot.honey_traps_total ?? 0}, lfi=${honeypot.lfi_traps_total ?? 0}, c2=${honeypot.c2_traps_total ?? 0}.`,
          )
        : L(locale, "honeypot_feed_e2e FAIL", "honeypot_feed_e2e FAIL"),
      metrics: [
        { label: L(locale, "mod", "mode"), value: honeypot.mode ?? "—" },
        { label: "honey", value: String(honeypot.honey_traps_total ?? 0) },
        { label: "lfi", value: String(honeypot.lfi_traps_total ?? 0) },
        { label: "c2", value: String(honeypot.c2_traps_total ?? 0) },
      ],
      date: fmtDate(honeypot.date),
      script: "scripts/honeypot_feed_e2e.sh",
    });
  }

  const l7Probe = reports.l7ProbeProd;
  if (l7Probe) {
    const pass = l7Probe.pass === true;
    const live = l7Probe.ipc === "ok" && l7Probe.l7_probe_active === true;
    const status: ValidationTestResult["status"] =
      pass && live ? "pass" : pass ? "warn" : "fail";
    out.push({
      id: "l7-probe-prod",
      status,
      title: L(
        locale,
        "L7 eBPF HTTP probe — prod hazırlık",
        "L7 eBPF HTTP probe — prod readiness",
      ),
      purpose: L(
        locale,
        "Daemon IPC + http_l7_probe.o ile L7 telemetry ve execve lineage kanıtı.",
        "Proves daemon IPC + http_l7_probe.o L7 telemetry and execve lineage.",
      ),
      verdict: pass
        ? live
          ? L(
              locale,
              `IPC ok; l7_probe ON; hits=${l7Probe.l7_http_hits ?? 0}; xdp=${l7Probe.xdp_mode ?? "—"}.`,
              `IPC ok; l7_probe ON; hits=${l7Probe.l7_http_hits ?? 0}; xdp=${l7Probe.xdp_mode ?? "—"}.`,
            )
          : L(
              locale,
              `mod ${l7Probe.mode ?? "—"}; IPC=${l7Probe.ipc ?? "—"}; probe ${l7Probe.l7_probe_active ? "ON" : "OFF"} (laptop/VPS NIC beklenir).`,
              `mode ${l7Probe.mode ?? "—"}; IPC=${l7Probe.ipc ?? "—"}; probe ${l7Probe.l7_probe_active ? "ON" : "OFF"} (laptop/VPS NIC expected).`,
            )
        : L(locale, "l7_probe_prod_e2e FAIL", "l7_probe_prod_e2e FAIL"),
      metrics: [
        { label: "IPC", value: l7Probe.ipc ?? "—" },
        { label: "l7_probe", value: l7Probe.l7_probe_active ? "ON" : "OFF" },
        { label: "hits", value: String(l7Probe.l7_http_hits ?? 0) },
        { label: "xdp", value: l7Probe.xdp_mode ?? "—" },
      ],
      date: fmtDate(l7Probe.date),
      script: "scripts/l7_probe_prod_e2e.sh",
    });
  }

  const crowdsec = reports.crowdsecBouncer;
  if (crowdsec) {
    const pass = crowdsec.pass === true;
    out.push({
      id: "crowdsec-bouncer",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "CrowdSec LAPI → log-guardian ban API",
        "CrowdSec LAPI → log-guardian ban API",
      ),
      purpose: L(
        locale,
        "Dağıtık IP / botnet kararlarının kernel ban hattına aktarılmasını kanıtlar.",
        "Proves distributed IP/botnet decisions reach the kernel ban path.",
      ),
      verdict: pass
        ? L(
            locale,
            `mod ${crowdsec.mode ?? "—"}; ${crowdsec.decisions_synced ?? 0} karar; ban API ${crowdsec.live_api_ok ? "OK" : "dry-run"}; LAPI ${crowdsec.live_lapi_ok ? "OK" : "dry-run"}.`,
            `mode ${crowdsec.mode ?? "—"}; ${crowdsec.decisions_synced ?? 0} decisions; ban API ${crowdsec.live_api_ok ? "OK" : "dry-run"}; LAPI ${crowdsec.live_lapi_ok ? "OK" : "dry-run"}.`,
          )
        : L(locale, "crowdsec_bouncer_e2e FAIL", "crowdsec_bouncer_e2e FAIL"),
      metrics: [
        { label: L(locale, "mod", "mode"), value: crowdsec.mode ?? "—" },
        { label: L(locale, "karar", "decisions"), value: String(crowdsec.decisions_synced ?? 0) },
        {
          label: "ban API",
          value: crowdsec.live_api_ok ? "OK" : "dry-run",
        },
        {
          label: "LAPI",
          value: crowdsec.live_lapi_ok ? "OK" : "dry-run",
        },
      ],
      date: fmtDate(crowdsec.date),
      script: "scripts/crowdsec_bouncer_e2e.sh",
    });
  }

  const taxii = reports.taxiiFeed;
  if (taxii) {
    const pass = taxii.pass === true;
    out.push({
      id: "taxii-feed",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "TAXII/STIX IOC → ban API (confidence gate)",
        "TAXII/STIX IOC → ban API (confidence gate)",
      ),
      purpose: L(
        locale,
        "STIX 2.1 göstergelerini confidence eşiği ile süzer; düşük güven IOC'leri banlamaz.",
        "Filters STIX 2.1 indicators by confidence; skips low-trust IOCs from ban path.",
      ),
      verdict: pass
        ? L(
            locale,
            `${taxii.mode ?? "dry-run"}; ${taxii.iocs_synced ?? 0} IOC (≥${taxii.min_confidence ?? 70}); atlanan=${taxii.skipped_low_confidence ?? 0}.`,
            `${taxii.mode ?? "dry-run"}; ${taxii.iocs_synced ?? 0} IOC (≥${taxii.min_confidence ?? 70}); skipped=${taxii.skipped_low_confidence ?? 0}.`,
          )
        : L(locale, "taxii_feed_e2e FAIL", "taxii_feed_e2e FAIL"),
      metrics: [
        { label: L(locale, "mod", "mode"), value: taxii.mode ?? "dry-run" },
        { label: "IOC", value: String(taxii.iocs_synced ?? 0) },
        { label: L(locale, "min conf", "min conf"), value: String(taxii.min_confidence ?? 70) },
        {
          label: L(locale, "atlanan", "skipped"),
          value: String(taxii.skipped_low_confidence ?? 0),
        },
      ],
      date: fmtDate(taxii.date),
      script: "scripts/taxii_feed_e2e.sh",
    });
  }

  const parserFuzz = reports.parserFuzz;
  if (parserFuzz) {
    const pass = parserFuzz.pass === true;
    out.push({
      id: "parser-fuzz",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "Parser fuzz — malformed corpus + mutasyon",
        "Parser fuzz — malformed corpus + mutation",
      ),
      purpose: L(
        locale,
        "Deterministik bozuk log satırlarında crash/UB yok; nginx/auth parse güvenilirliği.",
        "No crash/UB on deterministic malformed log lines; nginx/auth parse reliability.",
      ),
      verdict: pass
        ? L(
            locale,
            `${parserFuzz.parse_runs ?? 0} parse; corpus=${parserFuzz.corpus_lines ?? 0}; mutasyon=${parserFuzz.mutations ?? 0}.`,
            `${parserFuzz.parse_runs ?? 0} parses; corpus=${parserFuzz.corpus_lines ?? 0}; mutations=${parserFuzz.mutations ?? 0}.`,
          )
        : L(locale, "parser_fuzz_e2e FAIL", "parser_fuzz_e2e FAIL"),
      metrics: [
        { label: L(locale, "çalıştırma", "runs"), value: String(parserFuzz.parse_runs ?? 0) },
        { label: "corpus", value: String(parserFuzz.corpus_lines ?? 0) },
        { label: L(locale, "mutasyon", "mutations"), value: String(parserFuzz.mutations ?? 0) },
      ],
      date: fmtDate(parserFuzz.date),
      script: "scripts/parser_fuzz_e2e.sh",
    });
  }

  const banAudit = reports.banPolicyAudit;
  if (banAudit) {
    const pass = banAudit.pass === true;
    out.push({
      id: "ban-policy-audit",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "Ban policy audit + OPENAPI_STRICT",
        "Ban policy audit + OPENAPI_STRICT",
      ),
      purpose: L(
        locale,
        "Ban/unban karar izi JSONL + şema; prod API şema doğrulaması açık.",
        "Ban/unban decision trail JSONL + schema; prod API schema validation on.",
      ),
      verdict: pass
        ? L(
            locale,
            `karar=${banAudit.last_decision ?? "—"}; risk=${banAudit.last_risk ?? "—"}; OPENAPI_STRICT=${banAudit.openapi_strict_checked ? "1" : "0"}.`,
            `decision=${banAudit.last_decision ?? "—"}; risk=${banAudit.last_risk ?? "—"}; OPENAPI_STRICT=${banAudit.openapi_strict_checked ? "1" : "0"}.`,
          )
        : L(locale, "ban_policy_audit_e2e FAIL", "ban_policy_audit_e2e FAIL"),
      metrics: [
        { label: L(locale, "satır", "lines"), value: String(banAudit.audit_lines ?? 0) },
        { label: L(locale, "karar", "decision"), value: banAudit.last_decision ?? "—" },
        {
          label: "OPENAPI_STRICT",
          value: banAudit.openapi_strict_checked ? "1" : "0",
        },
      ],
      date: fmtDate(banAudit.date),
      script: "scripts/ban_policy_audit_e2e.sh",
    });
  }

  const distRisk = reports.distRiskProof;
  if (distRisk) {
    const pass = distRisk.pass === true;
    out.push({
      id: "dist-risk-proof",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "DIST_RISK — dağıtık saldırı skoru kanıtı",
        "DIST_RISK — distributed attack score proof",
      ),
      purpose: L(
        locale,
        "/24 + UA fingerprint korelasyonu ban risk bonusu; kapalı/açık replay delta ≥10.",
        "/24 + UA fingerprint correlation ban risk bonus; off/on replay delta ≥10.",
      ),
      verdict: pass
        ? L(
            locale,
            `risk off=${distRisk.risk_off ?? "—"} on=${distRisk.risk_on ?? "—"}; delta=${distRisk.delta ?? "—"}.`,
            `risk off=${distRisk.risk_off ?? "—"} on=${distRisk.risk_on ?? "—"}; delta=${distRisk.delta ?? "—"}.`,
          )
        : L(locale, "dist_risk_proof_e2e FAIL", "dist_risk_proof_e2e FAIL"),
      metrics: [
        { label: L(locale, "delta", "delta"), value: String(distRisk.delta ?? "—") },
        { label: L(locale, "kapalı", "off"), value: String(distRisk.risk_off ?? "—") },
        { label: L(locale, "açık", "on"), value: String(distRisk.risk_on ?? "—") },
      ],
      date: fmtDate(distRisk.date),
      script: "scripts/dist_risk_proof_e2e.sh",
    });
  }

  const lineageInc = reports.lineageIncident;
  if (lineageInc) {
    const pass = lineageInc.pass === true;
    out.push({
      id: "lineage-incident",
      status: pass ? "pass" : "fail",
      title: L(
        locale,
        "Lineage → incident otomatik (tek senaryo)",
        "Lineage → auto incident (single scenario)",
      ),
      purpose: L(
        locale,
        "LOG_SQLI + EBPF_EXECVE sinyallerinden INC-* korelasyonu; tek otomatik incident kanıtı.",
        "INC-* correlation from LOG_SQLI + EBPF_EXECVE signals; single auto-incident proof.",
      ),
      verdict: pass
        ? L(
            locale,
            `${lineageInc.incident_id ?? "—"}; aktif=${lineageInc.active_incidents ?? 0}; sinyal=${(lineageInc.signals ?? []).join("+") || "—"}.`,
            `${lineageInc.incident_id ?? "—"}; active=${lineageInc.active_incidents ?? 0}; signals=${(lineageInc.signals ?? []).join("+") || "—"}.`,
          )
        : L(locale, "lineage_incident_e2e FAIL", "lineage_incident_e2e FAIL"),
      metrics: [
        { label: "INC", value: lineageInc.incident_id ?? "—" },
        { label: "IP", value: lineageInc.ip ?? "—" },
        {
          label: L(locale, "aktif", "active"),
          value: String(lineageInc.active_incidents ?? 0),
        },
      ],
      date: fmtDate(lineageInc.date),
      script: "scripts/lineage_incident_e2e.sh",
    });
  }

  const k8sAdm = reports.k8sAdmission;
  if (k8sAdm) {
    const mode = k8sAdm.mode ?? "standalone";
    const ok = k8sAdm.pass === true;
    const status: TestStatus =
      !ok ? "fail" : mode === "skip" ? "warn" : "pass";
    out.push({
      id: "k8s-admission",
      status,
      title: L(
        locale,
        "K8s admission webhook — deny label + allow",
        "K8s admission webhook — deny label + allow",
      ),
      purpose: L(
        locale,
        "Operator admission: security.log-guardian.io/deny pod reddi.",
        "Operator admission rejects pods with deny security label.",
      ),
      verdict: ok
        ? L(
            locale,
            `mode=${mode}; deny label=${k8sAdm.deny_label ?? "—"}.`,
            `mode=${mode}; deny label=${k8sAdm.deny_label ?? "—"}.`,
          )
        : L(locale, "k8s_admission_test FAIL", "k8s_admission_test FAIL"),
      metrics: [{ label: "mode", value: mode }],
      date: fmtDate(k8sAdm.date),
      script: k8sAdm.script ?? "scripts/k8s_admission_test.sh",
    });
  }

  const k8sKind = reports.k8sKind;
  if (k8sKind) {
    const mode = k8sKind.mode ?? "skip";
    const ok = k8sKind.pass === true;
    const skipModes = new Set(["skip", "skip-no-kind", "skip-no-cluster", "skip-no-helm", "skip-no-kubectl"]);
    const status: TestStatus = !ok
      ? "fail"
      : skipModes.has(mode)
        ? "warn"
        : "pass";
    out.push({
      id: "k8s-kind-e2e",
      status,
      title: L(
        locale,
        "K8s kind cluster — helm dry-run / live",
        "K8s kind cluster — helm dry-run / live",
      ),
      purpose: L(
        locale,
        "Opsiyonel Pro: kind + helm/log-guardian canlı veya dry-run kanıtı.",
        "Optional Pro: kind cluster + helm chart live or dry-run proof.",
      ),
      verdict: ok
        ? L(
            locale,
            `cluster=${k8sKind.cluster ?? "—"}; mode=${mode}.`,
            `cluster=${k8sKind.cluster ?? "—"}; mode=${mode}.`,
          )
        : L(locale, "k8s_kind_e2e FAIL", "k8s_kind_e2e FAIL"),
      metrics: [
        { label: "mode", value: mode },
        { label: L(locale, "cluster", "cluster"), value: k8sKind.cluster ?? "—" },
      ],
      date: fmtDate(k8sKind.date),
      script: k8sKind.script ?? "scripts/k8s_kind_e2e.sh",
    });
  }

  const meshDocker = reports.meshEtcdDocker;
  if (meshDocker) {
    const mode = meshDocker.mode ?? "skip";
    const ok = meshDocker.pass === true;
    const status: TestStatus = !ok
      ? "fail"
      : mode === "docker-live"
        ? "pass"
        : "warn";
    out.push({
      id: "mesh-etcd-docker",
      status,
      title: L(
        locale,
        "Mesh etcd — Docker smoke",
        "Mesh etcd — Docker smoke",
      ),
      purpose: L(
        locale,
        "etcd mesh backend docker-compose smoke (opsiyonel filo).",
        "etcd mesh backend docker-compose smoke (optional fleet).",
      ),
      verdict: L(
        locale,
        `mode=${mode}.`,
        `mode=${mode}.`,
      ),
      metrics: [{ label: "mode", value: mode }],
      date: fmtDate(meshDocker.date),
      script: meshDocker.script ?? "scripts/mesh_etcd_docker_smoke.sh",
    });
  }

  const meshLive = reports.meshEtcdLive;
  if (meshLive) {
    const ok = meshLive.pass === true;
    const mode = meshLive.mode ?? "—";
    out.push({
      id: "mesh-etcd-live",
      status: ok ? "pass" : "fail",
      title: L(
        locale,
        "Mesh etcd — canlı PUT/GET",
        "Mesh etcd — live PUT/GET",
      ),
      purpose: L(
        locale,
        "Docker etcd v3 round-trip; filo politika anahtarı yazma/okuma kanıtı.",
        "Docker etcd v3 round-trip; fleet policy key read/write proof.",
      ),
      verdict: ok
        ? L(
            locale,
            `mode=${mode}; key=${meshLive.policy_key ?? "—"}; round_trip=${meshLive.round_trip ? "1" : "0"}.`,
            `mode=${mode}; key=${meshLive.policy_key ?? "—"}; round_trip=${meshLive.round_trip ? "1" : "0"}.`,
          )
        : L(locale, "mesh_etcd_live_e2e FAIL", "mesh_etcd_live_e2e FAIL"),
      metrics: [
        { label: "mode", value: mode },
        { label: "endpoint", value: meshLive.endpoint ?? "—" },
      ],
      date: fmtDate(meshLive.date),
      script: meshLive.script ?? "scripts/mesh_etcd_live_e2e.sh",
    });
  }

  const TEST_DISPLAY_ORDER: Record<string, number> = {
    "post-install-verify": 1,
    "local-security-audit": 2,
    "api-fail-closed": 3,
    "auth-log-ingest": 4,
    "journald-ingest": 5,
    "helm-install-smoke": 5.2,
    "k8s-admission": 5.3,
    "k8s-kind-e2e": 5.4,
    "mesh-etcd-docker": 5.5,
    "mesh-etcd-live": 5.55,
    "siem-export": 6,
    "honeypot-feed": 6.5,
    "crowdsec-bouncer": 7,
    "taxii-feed": 7.2,
    "parser-fuzz": 7.25,
    "ban-policy-audit": 7.27,
    "lineage-incident": 7.28,
    "l7-probe-prod": 7.5,
    "wasm-native": 8,
    "attack-map": 8,
    "fleet-multi-node": 9,
    "grafana-alerts": 10,
    "copilot-ollama": 11,
    "marketplace-signed-api": 12,
    "compliance-export": 13,
    "vps-xdp-kernel": 14,
    "arm64-build": 15,
    "prod-stack-e2e": 16,
    "phase100-fast-gate": 17,
    "vm-demo-gate": 18,
    "soak-stability": 19,
  };
  out.sort((a, b) => {
    const pa = TEST_DISPLAY_ORDER[a.id] ?? 50;
    const pb = TEST_DISPLAY_ORDER[b.id] ?? 50;
    if (pa !== pb) return pa - pb;
    return a.id.localeCompare(b.id);
  });

  return out;
}
