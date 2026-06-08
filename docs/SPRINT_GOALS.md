# Sprint hedefleri — Linux Log Guardian

**Açık kaynak · Türk topluluk · ölçülebilir kanıt.** Her sprint bitince `[x]` işaretle.

Son güncelleme: 2026-06-08

---

## Sprint A — Kanıt paketi ✅ (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| A1 | Competitive suite (FAST) | `bash scripts/sprint_a.sh` | ✅ |
| A2 | Ban latency bench | `sudo bash scripts/bench_ban_latency.sh` (sprint_a otomatik sudo) | ✅ |
| A3 | competitive-proof.pdf | `data-room/competitive-proof.pdf` | ✅ |
| A4 | Kanıt paketi ZIP | `data-room.zip` | ✅ |
| A5 | Dashboard test paneli | `/tests` + PDF link | ✅ |
| A6 | ipset dolu fix | bench otomatik flush | ✅ |

**Devam (A opsiyonel):**
- [x] `SPRINT_A_SOAK=1h bash scripts/sprint_a.sh` — 1 saat soak
- [ ] `SPRINT_A_SOAK=72h bash scripts/sprint_a.sh` — 72h arka plan soak

---

## Sprint B — Canlı demo & webhook ✅ (tamamlandı)

| # | Hedef | Ne yapılacak | Durum |
|---|--------|--------------|-------|
| B1 | Webhook dry-run | `bash scripts/webhook_smoke_test.sh` | ✅ |
| B2 | Ban → webhook akışı | `bash scripts/webhook_ban_e2e.sh` | ✅ |
| B3 | 3 dk demo script | `bash scripts/demo_3min.sh` | ✅ |
| B4 | ipset maxelem / prune | `threat_intel.sh` dynamic rezerv 12K + DB restore | ✅ |
| B5 | Ban bench | medyan 16 ms, dashboard **Geçti** | ✅ |
| B6 | Sunucu kurulum checklist | `docs/PILOT_SETUP.md` SSH adımları | ✅ |
| B7 | nginx log format | `install.sh` sonunda `log_guardian` uyarısı | ✅ |
| B8 | NOTICE / LICENSE | `/usr/local/share/doc/log-guardian/` | ✅ |

```bash
bash scripts/sprint_b.sh
sudo bash scripts/ipset_prune_policy_test.sh
bash scripts/demo_3min.sh
```

---

## Sprint C — Prod / topluluk sunucusu (laptop tamam; VPS eth0 bekliyor)

| # | Hedef | Ne yapılacak | Durum |
|---|--------|--------------|-------|
| C0 | Sprint C script | `bash scripts/sprint_c.sh` | ✅ |
| C1 | VPS + eth0 | `sudo log-guardian-daemon --iface eth0` | ⬜ VPS |
| C2 | XDP açık demo | `--status` → xdp=ON | ⬜ VPS |
| C3 | TLS :8443 demo | `docker-compose.prod.yml` | 🟡 laptop |
| C4 | Ban latency prod | VPS'te bench → prod hedef **<50 ms** | 🟡 laptop <75ms |
| C5 | 72h soak VPS | `SOAK_72H=1 bash scripts/sprint_c.sh` | ⬜ VPS |
| C6 | VPS soak systemd | `sudo bash scripts/install_soak_systemd.sh` | ✅ |

```bash
bash scripts/sprint_c.sh
sudo BENCH_TARGET_MS=50 bash scripts/bench_ban_latency.sh
SOAK_72H=1 bash scripts/sprint_c.sh
```

---

## Sprint D — Açık kaynak yayın

| # | Hedef | Ne yapılacak | Durum |
|---|--------|--------------|-------|
| D1 | README TR + EN | `README.md` + `docs/README_DETAY.md` | ✅ |
| D2 | GitHub public | SECURITY.md (katkı şablonu yok — solo proje) | ✅ |
| D3 | VPS prod kanıt | eth0 + kernel-xdp + 72h soak raporu | ⬜ |
| D4 | Topluluk demo | `demo_3min.sh` + competitive-proof PDF | ✅ |
| D5 | Rakip karşılaştırma | BENCHMARK.md güncel, dürüst EPS mesajı | ✅ |
| D6 | Gerçek saldırı corpus | `real_attack_suite.sh` + competitive-proof | ✅ |
| D7 | Rakip kanıt vitrin | `rakip_kanit.sh` + [VS_RAKIPLER.md](VS_RAKIPLER.md) | ✅ |
| D8 | P0 saldırı savunması | `live_attack_harness`, POST SQLi, `bench_mixed` 500 satır | ✅ |
| D9 | Dağıtık saldırı / JA3 kanıt | `ja3_cluster_proof.sh` + dashboard + data-room | ✅ |
| D10 | GitHub release vitrin | `github_release_pack.sh` + README + `release.yml` | ✅ |
| D11 | Corpus 500 + nginx consult | `generate_attack_corpus.py` + `/api/v1/consult` | ✅ |
| D12 | Corpus 1K + NoSQL WAF | `REAL_ATTACK_CORPUS_LINES=1000`, `waf_rules.c` nosql | ✅ |
| D13 | T2 TLS local proof | `t2_tls_proof.sh` + `check_nginx_tls_443.sh` | ✅ |
| D14 | Corpus 10K proof | `corpus_10k_proof.sh` + dinamik replay timeout | ✅ |
| D15 | Kısa soak gate | `soak_short_proof.sh` (5 dk, VPS yok) | ✅ |
| D16 | nginx log_guardian enforce | `install.sh` otomatik `fix_nginx_log_format` | ✅ |
| D17 | OWASP/CRS test corpus | `owasp_corpus_proof.sh` (54 satır, 11 kategori) | ✅ |
| D18 | Threat intel sync metrik | `threat_intel_sync_proof.sh` + fixture | ✅ |
| D19 | TR hosting corpus | `tr_hosting_corpus_proof.sh` (150 satır) | ✅ |
| D20 | Extended proof pack | `extended_proof_pack.sh` → data-room | ✅ |
| D21 | phase100 fast gate | `phase100_fast_gate.sh` | 🟡 |
| D22 | Laptop dev gate | `laptop_dev_gate.sh` (VPS/webhook yok) | ✅ |
| D23 | TR hosting runbook | `HOSTING_RUNBOOK_TR.md` | ✅ |
| D24 | Incident timeline UI | dashboard `IncidentsPanel` detay modal | ✅ |
| D25 | Corpus genişletme | TR 500 + OWASP 200 satır | ✅ |
| D26 | OpenAPI strict prod | `OPENAPI_STRICT_PROD.md` | ✅ |
| D27 | FP learn warmup UI | dashboard `FpMetricsPanel` | ✅ |

```bash
bash scripts/laptop_dev_gate.sh
bash scripts/sprint_a.sh
bash scripts/real_attack_suite.sh
bash scripts/ja3_cluster_proof.sh
bash scripts/demo_3min.sh
bash scripts/phase100.sh
```

Detay: [REAL_ATTACK.md](REAL_ATTACK.md)

---

## Hızlı komutlar

```bash
bash scripts/sprint_a.sh
sudo bash scripts/bench_ban_latency.sh
bash scripts/competitive_proof.sh
bash scripts/sync_dashboard_data.sh
docker compose -f docker-compose.prod.yml up -d --build
./log-guardian --health
bash scripts/sprint_c.sh
bash scripts/demo_3min.sh
```

---

## Linkler

| Ne | URL |
|----|-----|
| Dashboard | https://localhost:8443/ |
| Testler | https://localhost:8443/tests |
| PDF | https://localhost:8443/api/data-room/competitive-proof.pdf |
| Grafana | http://127.0.0.1:3002 |

---

## Notlar

- **Ban hedefi:** Laptop IPC → **<75 ms**. Prod VPS → **<50 ms**.
- **Core mesajı:** ModSec hız yarışı değil — log→WAF→kernel ban + ölçülebilir kanıt.
- **Lisans:** MIT — ticari satış paketi yok; solo geliştirme.

İlgili: [DATA_ROOM.md](DATA_ROOM.md) · [SCOPE_COVERAGE.md](SCOPE_COVERAGE.md) · [QUICKSTART_NGINX.md](QUICKSTART_NGINX.md)
