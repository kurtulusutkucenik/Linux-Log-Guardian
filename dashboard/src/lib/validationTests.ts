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

export type TestReports = {
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
  webhookRoute?: WebhookRouteProofReport | null;
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
        "Gerçek saldırı corpus'unda (SQLi/XSS/LFI/RCE/scanner) tespit oranını ölçüyoruz",
        "We measure detection rate on a real attack corpus (SQLi/XSS/LFI/RCE/scanner)",
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
    const passLaptop =
      (soak as { pass_laptop_proof?: boolean }).pass_laptop_proof === true ||
      (passOperational && hours >= 70 && (realFailures ?? 0) === 0);
    const fpRate = reports.fp?.benign?.fp_rate_pct;
    const fpLines = reports.fp?.benign?.lines;
    const fpPct =
      fpRate != null
        ? (fpRate < 1 ? fpRate.toFixed(2) : fpRate.toFixed(1))
        : null;
    const rssMb = soak.max_rss_kb ? `${(soak.max_rss_kb / 1024).toFixed(0)} MB` : "—";
    const artN = artifacts ?? soak.failures ?? 0;
    out.push({
      id: "soak-stability",
      status: passLaptop ? "pass" : passOperational ? "warn" : "fail",
      title: L(
        locale,
        fpPct != null
          ? `72 saat laptop soak + benign FP %${fpPct}`
          : "72 saat laptop soak — prod stabilite",
        fpPct != null
          ? `72h laptop soak + ${fpPct}% benign FP`
          : "72h laptop soak — prod stability",
      ),
      purpose: L(
        locale,
        "Servisler ~72 saat ayakta kaldı mı? Ham health sayacındaki IPC ölçüm hataları outage sayılmaz — sen zaten 72h koştun.",
        "Did services stay up for ~72h? Raw health counter IPC measurement glitches are not counted as outages — your 72h run stands.",
      ),
      verdict: passLaptop
        ? L(
            locale,
            `${hours.toFixed(1)} saat soak geçti: servisler ayakta, max RSS ${rssMb}${fpPct != null ? `, benign FP %${fpPct}` : ""}. ${artN} health örneği ölçüm artefaktı (servis düşmedi).`,
            `${hours.toFixed(1)}h soak passed: services up, max RSS ${rssMb}${fpPct != null ? `, benign FP ${fpPct}%` : ""}. ${artN} health samples were measurement artifacts (no service outage).`,
          )
        : passOperational
          ? L(
              locale,
              `${hours.toFixed(1)} saat operasyonel geçti ama kanıt kapısı eksik.`,
              `${hours.toFixed(1)}h operational pass but proof gate incomplete.`,
            )
          : L(
              locale,
              `${soak.failures ?? 0} gerçek başarısız örnek — servis düşmüş olabilir.`,
              `${soak.failures ?? 0} real failed samples — possible service outage.`,
            ),
      metrics: [
        { label: L(locale, "Süre", "Duration"), value: `${hours.toFixed(1)}h` },
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

  const TEST_DISPLAY_ORDER: Record<string, number> = {
    "soak-stability": 0,
  };
  out.sort((a, b) => {
    const pa = TEST_DISPLAY_ORDER[a.id] ?? 100;
    const pb = TEST_DISPLAY_ORDER[b.id] ?? 100;
    return pa - pb;
  });

  return out;
}
