# Rekabet konumu — dürüst durum tablosu

**Linux Log Guardian** ModSecurity/CrowdSec ile aynı kategoride değil; **log → WAF → kernel ban** hattı. Bu belge kanıt paketinin ne iddia ettiğini ve etmediğini ayırır.

**Son güncelleme:** 2026-07-08 · Kanıt: `bash scripts/proof_gate_recovery.sh` · laptop + canlı `/tests` **89 kart** · corpus **31 kategori**

---

## Konum (iddia etmiyoruz)

| Rakip iddiası | Biz |
|---------------|-----|
| Inline ModSec (~12K EPS replay) | Log-tailing mimari; bench ~6.5K EPS (1500 satır) |
| Her saldırıda anında kernel drop | Önce log + WAF; ban IPC/ipset |
| CrowdSec bouncer uyumu | ✅ laptop LAPI `:8081` + ban API (`crowdsec_bouncer_e2e.sh`, `live_lapi_ok`) |
| STIX/TAXII IOC pull | ✅ community fixture + confidence gate (`taxii_feed_e2e.sh`); canlı URL opsiyonel |
| 72h VPS soak demo | ✅ VM kanıtı (`72.0h`, `failures=0/864`) — laptop `docs/evidence/` henüz 1h ise VM raporunu kopyala |

---

## Kanıtlı güçlü yanlar

| Metrik | Durum | Kanıt |
|--------|-------|-------|
| Ban ~17 ms | ✅ | `bench-ban-latency.json` → 16.92 ms |
| FP %0.5 hedef | ✅ (daha iyi) | Bu koşuda %0.2 (500 benign) |
| CRS parite %100 | ✅ | 121 pattern, test corpus |
| C-WAF modern RCE (CRS kapalı) | ✅ | `java_rce` · `modern_rce` · `enterprise_ognl` · `rfi` · `graphql_abuse` · `shellcmd` · `path_traversal_variant` · `jwt_alg_confusion` · `api_bola` · `oauth_abuse` — 30 kategori corpus %100 |
| ban_policy + incident | ✅ kod | Prod tune ayrı |
| Adaptive threshold | ✅ kod | Isınma gerekir |
| Telegram ops (#1–32) | ✅ laptop | `WEBHOOK_SETUP.md` — setWebhook tunnel, Grafana DM #30 |
| Grafana contact ayrı | ✅ | `grafana_alert_e2e.sh` — Ops `-100…` değil |

---

## Kanıtlı zayıf yanlar

| Zayıf yan | Güncel durum |
|-----------|--------------|
| EPS vs CRS inline replay | ✅ dürüst bench `eps-architecture-report.json` (≥1500 satır, mimari mesaj) |
| `ban_evidence` harness | ✅ RFC5737 replay (`203.0.113.77`) — `ban_evidence_kernel` + `ban_evidence_waf`; localhost canlı ban beklenmez |
| XDP kapalı (laptop) | Doğru; VPS `eth0` gerekir |
| FP_LEARN ısınmamış | Laptop overlay ile isinir; prod `trusted_ips` 30 gün |
| Corpus 10K sentetik | ✅ `customer_10k` — `customer_anonymized` log_guardian expanded (honeypot degil) |
| Threat intel prod | ✅ timer + `INTEL_BAN_DB_TTL_DAYS=7` + ipset `hash:net` (`threat-intel-prod-report.json`) |

---

## Ops / Telegram (bu sprint)

| Madde | Durum | Not |
|-------|-------|-----|
| setWebhook HTTPS | ✅ laptop | `telegram_webhook_tunnel_dev.sh --register` |
| Webhook fail metrik | ✅ | `webhook-metrics-reset` / `webhook_metrics_reset.sh` |
| Grafana #30 ayrı contact | ✅ | DM; LG Ops grubu değil |
| Grafana alert E2E | ✅ | `grafana_alert_e2e.sh` |

---

## P0 — Hemen

| # | Madde | Durum |
|---|-------|-------|
| 1 | Gerçek nginx :80 harness + ban kanıtı | ✅ `live_attack_harness.sh` — `ban_evidence: true` (RFC5737 replay + ipset/DB) |
| 2 | `log_guardian` format zorunluluğu | ✅ `enforce_nginx_log_format.sh` — install + `install_steps.sh 3-install` gate |
| 3 | Canlı saldırı corpus | ✅ `customer_anonymized.access` — log_guardian + POST body, %100 recall |
| 4 | `INCIDENT_MIN_LOG_HITS` tune | ✅ `HOSTING_RUNBOOK_TR.md` prod matrisi + `rules.conf` default `3` |

---

## P1 — Orta vade

| # | Madde | Durum |
|---|-------|-------|
| 5 | JA3/UA cluster prod | ✅ `ja3_cluster_ban_live.sh` — `pipe_delta=7` `ja3_bans_delta=3` (RFC5737) |
| 6 | Inline + log hibrit | ✅ | `nginx-hybrid-report.json` + `auth_request` snippet; prod default hâlâ log-tailing |
| 7 | Threat intel hızı | ✅ | Firehol+API ipset; `threat_feed_live_proof` pass |
| 8 | FP_LEARN ısınması | ✅ `fp_learn_warmup.sh` overlay (WAF kapalı replay) |

---

## P2 — Uzun vade

| # | Madde | Durum |
|---|-------|-------|
| 9 | VPS eth0 + kernel-XDP | ⏸️ ertelendi (sunucu yok) · laptop `vps-xdp-kernel` ⚠ |
| 10 | L7 eBPF probe prod | ✅ laptop | `l7_probe_prod_e2e.sh` — IPC ok, ipset-fallback |
| 11 | CrowdSec bouncer | ✅ laptop | LAPI `:8081` + ban API; `live_lapi_ok` |
| 12 | Honeypot / deception feed | ✅ | `honeypot_feed_e2e.sh` — prometheus counter |

---

## Tier roadmap

| Tier | Madde | Durum |
|------|-------|-------|
| T1 | `real_attack_suite.sh` | ✅ offline ağırlıklı |
| T1 | 10K corpus | ✅ sentetik genişletme |
| T1 | VPS 72h soak | ✅ VM (`72.0h`, `0/864`) — `docs/evidence/` sync için scp |
| T1 | README EDGE_PROTECTION | ✅ |
| T2 | Tek zincir dashboard SOC | ✅ | SOC timeline + attack map + lineage live-first |
| T2 | JA3 + ASN cluster | ✅ JA3 live | `ja3_cluster_ban_live.sh` |
| T2 | Incident timeline UI | ✅ | live badge; snapshot prod kapalı |
| T2 | TR operatör runbook | ✅ `HOSTING_RUNBOOK_TR.md` |
| T3 | Inline consult sub-ms prod | ✅ API + nginx auth_request (`nginx-hybrid-report.json`) |
| T3 | OpenAPI strict prod | ✅ | `ban_policy_audit_e2e.sh` + `OPENAPI_STRICT_PROD.md` |
| T3 | Adaptive FP dashboard | ✅ | `FpMetricsPanel` + `fp_learn_warmup.sh` |

---

## Sonraki geliştirme önceliği (2026-06-29)

**72h soak laptop ✅** · **Canlı site 89 test ✅** · **Dashboard 89/89 ✅** · **Filo host+VM ONLINE ✅** · **k8s admission docker-standalone ✅** · **local_proof PASS ✅** · **Sprint O kapalı ✅**

**Git / GitHub / VPS** bilinçli ertelendi.

| # | Madde | Neden | Durum |
|---|--------|--------|--------|
| 1 | Fleet stale prune | OFFLINE gürültü | ✅ |
| 2 | VM keepalive + demo gate | reboot-safe filo | ✅ |
| 3 | Kanıt + excellence gate | 57 test, 0 FAIL | ✅ |
| 4 | VPS kernel-XDP | Tek ⚠ kart (sunucu gelince) | ⏸️ |
| 5 | GitHub push / release | kullanıcı onayı | ⏸️ |

**Tamamlanan (2026-06-29):** prod **57 test** · SRI live · Sprint O/P/S/W/X · VM demo gate FAIL=0 · `laptop_excellence_gate` 0 FAIL

**P1-6 tamam (2026-06-09):** inline+log hibrit — `nginx-hybrid-report.json`  
**P1-7 tamam (2026-06-09):** `enable_threat_intel_prod.sh` → timer + TTL + fixture/live sync; kanıt: `threat-intel-prod-report.json`  
**P2 laptop tamam (2026-06-28):** L7 + CrowdSec + honeypot + attack map `/tests` yeşil

İlgili: [DATA_ROOM.md](DATA_ROOM.md) · [SCOPE_COVERAGE.md](SCOPE_COVERAGE.md) · [EDGE_PROTECTION.md](EDGE_PROTECTION.md)
