# Rekabet konumu — dürüst durum tablosu

**Linux Log Guardian** ModSecurity/CrowdSec ile aynı kategoride değil; **log → WAF → kernel ban** hattı. Bu belge kanıt paketinin ne iddia ettiğini ve etmediğini ayırır.

**Son güncelleme:** 2026-06-19 · Kanıt: `bash scripts/sprint_a.sh` · `competitive-proof.json` · VPS 72h soak (VM)

---

## Konum (iddia etmiyoruz)

| Rakip iddiası | Biz |
|---------------|-----|
| Inline ModSec (~12K EPS replay) | Log-tailing mimari; bench ~6.5K EPS (1500 satır) |
| Her saldırıda anında kernel drop | Önce log + WAF; ban IPC/ipset |
| CrowdSec bouncer uyumu | Yok (P2) |
| 72h VPS soak demo | ✅ VM kanıtı (`72.0h`, `failures=0/864`) — laptop `docs/evidence/` henüz 1h ise VM raporunu kopyala |

---

## Kanıtlı güçlü yanlar

| Metrik | Durum | Kanıt |
|--------|-------|-------|
| Ban ~17 ms | ✅ | `bench-ban-latency.json` → 16.92 ms |
| FP %0.5 hedef | ✅ (daha iyi) | Bu koşuda %0.2 (500 benign) |
| CRS parite %100 | ✅ | 121 pattern, test corpus |
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
| 6 | Inline + log hibrit | 🟡 API kanıtı; prod default değil |
| 7 | Threat intel hızı | ✅ | Firehol+API ipset; `threat_feed_live_proof` pass |
| 8 | FP_LEARN ısınması | ✅ `fp_learn_warmup.sh` overlay (WAF kapalı replay) |

---

## P2 — Uzun vade

| # | Madde | Durum |
|---|-------|-------|
| 9 | VPS eth0 + kernel-XDP | ⏸️ ertelendi (sunucu yok) |
| 10 | L7 eBPF probe prod | ❌ |
| 11 | CrowdSec bouncer | ❌ |
| 12 | Honeypot feed | ❌ |

---

## Tier roadmap

| Tier | Madde | Durum |
|------|-------|-------|
| T1 | `real_attack_suite.sh` | ✅ offline ağırlıklı |
| T1 | 10K corpus | ✅ sentetik genişletme |
| T1 | VPS 72h soak | ✅ VM (`72.0h`, `0/864`) — `docs/evidence/` sync için scp |
| T1 | README EDGE_PROTECTION | ✅ |
| T2 | Tek zincir dashboard SOC | 🟡 kısmi |
| T2 | JA3 + ASN cluster | 🟡 JA3 var |
| T2 | Incident timeline UI | 🟡 demo/sim |
| T2 | TR operatör runbook | ✅ `HOSTING_RUNBOOK_TR.md` |
| T3 | Inline consult sub-ms prod | ✅ API + nginx auth_request (`nginx-hybrid-report.json`) |
| T3 | OpenAPI strict prod | 🟡 doküman |
| T3 | Adaptive FP dashboard | 🟡 EMA kodda |

---

## Sonraki geliştirme önceliği

1. **VPS soak / P2** — 72h prod edge + satın alma (laptop sprint + EPS/corpus tamam)

**P1-6 tamam (2026-06-09):** inline+log hibrit — `nginx-hybrid-report.json`  
**P1-7 tamam (2026-06-09):** `enable_threat_intel_prod.sh` → timer + TTL + fixture/live sync; kanıt: `threat-intel-prod-report.json`

İlgili: [DATA_ROOM.md](DATA_ROOM.md) · [SCOPE_COVERAGE.md](SCOPE_COVERAGE.md) · [EDGE_PROTECTION.md](EDGE_PROTECTION.md)
