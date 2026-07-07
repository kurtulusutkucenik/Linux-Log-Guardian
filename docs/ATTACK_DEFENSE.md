# Gerçek saldırı savunması — katmanlı stack + tuning

VPS/webhook olmadan yapılabilecekler ve dürüst sınırlar.

## 4 katman (prod stack)

```
[1] CDN (Cloudflare)     ← volumetrik, bot fight  (EDGE_PROTECTION.md)
[2] nginx rate limit     ← ban gelmeden nefes     (log-guardian.conf snippet)
[3] Log Guardian         ← CRS + anomaly + adaptive + ban
[4] kernel ipset/XDP     ← tekrar eden IP drop    (VPS eth0)
```

**Tek başına Log Guardian yetmez** — L3/L4 DDoS için [EDGE_PROTECTION.md](EDGE_PROTECTION.md) ilk sırada.

## Saldırı tipi → durum

| Saldırı | Durum | Not |
|---------|-------|-----|
| URL SQLi / XSS | **İyi** | CRS + `log_guardian` format |
| Java/template RCE | **İyi** | C-WAF: Spring4Shell, OGNL, Text4Shell, Log4Shell (`java_rce`) |
| Confluence / Struts OGNL | **İyi** | C-WAF: WebWork stack, `ognl.OgnlUtil` (`enterprise_ognl`) |
| PHP-CGI / SpEL RCE | **İyi** | C-WAF: CVE-2024-4577 arg injection, Spring SpEL (`modern_rce`) |
| POST body SQLi | **İyi** (format şart) | `$request_body` yoksa görünmez |
| Brute login | **İyi** | `limit_req` + `BRUTE_FORCE_ERR` |
| Slow / low-and-slow | **Orta–İyi** | `ADAPTIVE_THRESHOLD` (ısınma gerekir) |
| Tek IP flood | **Orta** | `DDOS_RPS` + ban; log gecikmesi var |
| Dağıtık botnet | **Zayıf** | IP başına ban; JA3/fleet gelişiyor |
| L3/L4 volumetrik | **Zayıf** | CDN şart |
| Host RCE / shell | **Demo** | lineage var; prod BPF kapalı |

**Mimari gerçek:** Log Guardian **reaktif** — istek önce nginx'e gelir, log'a düşer, analyzer okur, ban gelir. ModSecurity **proaktif** — eşleşince 403. Bu farkı iddia etme; entegrasyon + ban ms ile konumlan.

## P0 komutlar (şimdi)

```bash
# Offline corpus + recall
bash scripts/real_attack_suite.sh

# OWASP/CRS + TR hosting corpus (ayri raporlar)
bash scripts/owasp_corpus_proof.sh
bash scripts/tr_hosting_corpus_proof.sh
bash scripts/extended_proof_pack.sh

# Threat intel sync hizi (offline fixture veya canli Firehol)
THREAT_INTEL_FIXTURE=corpus/fixtures/firehol_sample.netset bash scripts/threat_intel_sync_proof.sh

# Canlı nginx :80 harness (tester + ban_pipeline)
LIVE=1 bash scripts/real_attack_suite.sh
# veya
bash scripts/live_attack_harness.sh
LIVE_ATTACK_QUICK=1 bash scripts/live_attack_harness.sh  # replay atla (~30sn)

# log_guardian format kontrol
bash scripts/check_nginx_log_format.sh
STRICT=1 bash scripts/check_nginx_log_format.sh   # CI

# Karışık bench corpus (300+ satır)
python3 scripts/generate_bench_corpus.py
bash scripts/bench_vs_modsec.sh
```

### Kurulum: log format zorunlu

```bash
sudo bash install.sh
# veya manuel:
sudo cp examples/nginx/snippets/log-guardian.conf /etc/nginx/snippets/
# http {}: include /etc/nginx/snippets/log-guardian.conf;
# site:    access_log /var/log/nginx/access.log log_guardian;
sudo nginx -t && sudo systemctl reload nginx
```

## Tuning (`rules.conf`)

| Anahtar | Varsayılan | Etki |
|---------|------------|------|
| `INCIDENT_MIN_LOG_HITS` | `3` | Tek SQLi vs 3 hit sonra incident/ban |
| `AUTO_BAN_MIN_RISK` | `60` | Tek WARN'da ban vs yüksek riskte ban |
| `BRUTE_FORCE_ERR` | `5` | Login hata eşiği |
| `DDOS_RPS` | `300` | IP başına RPS anomaly |
| `ADAPTIVE_THRESHOLD` | `1` | Low-and-slow (ısınma: `ADAPTIVE_WARMUP_SAMPLES`) |
| `FP_LEARN` | kapalı | 30 gün / 100 sample sonra FP düşer |

**İlk hafta:** Daha agresif ban normal; `FP_LEARN=1` + `FP_TRUST_DAYS=30` prod'da ısıt.

## Tester modları (`:80` hedef)

```bash
./tester --mode sqli      --host 127.0.0.1 --port 80
./tester --mode post_sqli --host 127.0.0.1 --port 80   # $request_body log şart
./tester --mode brute     --host 127.0.0.1 --port 80
./tester --mode ddos      --host 127.0.0.1 --port 80 --rps 80 --threads 4
./tester --mode slow      --host 127.0.0.1 --port 80
```

`REFUSED > 0` veya `live-attack-report.json` → `ban_evidence` = savunma aktif.

### nginx inline consult (T2)

```bash
sudo make install
sudo systemctl restart log-guardian-daemon log-guardian   # install servisi yenilemez!
bash scripts/nginx_inline_consult_quickstart.sh
# veya: NGINX_CONSULT=auto bash scripts/rakip_kanit.sh
# API yoksa: AUTO_RESTART=1 sudo bash scripts/ensure_guardian_api.sh
```

Snippet: `examples/nginx/snippets/log-guardian-inline-consult.conf` — `auth_request` → `:8090/api/v1/consult`

## Öncelik yol haritası

| Tier | Hedef | Durum |
|------|-------|-------|
| T1 | `real_attack_suite` + corpus + rakip kanıt | ✅ |
| T1 | `live_attack_harness` + POST SQLi corpus | ✅ |
| T1 | `bench_mixed` + corpus 1K (30 kategori) | ✅ |
| T2 | JA3/ASN clustering (offline distributed + canlı TLS) | ✅ |
| T2 | nginx inline consult | ✅ API + snippet |
| T2 | Corpus 10K recall | ✅ `corpus_10k_proof.sh` |
| T2 | Kısa stabilite (5 dk soak) | ✅ `soak_short_proof.sh` |
| T2 | OWASP/CRS test corpus | ✅ `owasp_corpus_proof.sh` |
| T2 | Threat intel sync metrik | ✅ `threat_intel_sync_proof.sh` |
| T2 | nginx log_guardian enforce | ✅ `install.sh` + `fix_nginx_log_format.sh` |
| T3 | VPS eth0 + kernel-XDP | ⬜ VPS (XDP laptop’ta kapalı) |
| — | Laptop 72h soak | ✅ `laptop_soak_72h.sh` (Wi‑Fi/kablo) |
| — | Laptop dev gate (VPS/webhook yok) | ✅ `laptop_dev_gate.sh` |
| — | TR hosting runbook | ✅ `HOSTING_RUNBOOK_TR.md` |
| — | OpenAPI strict prod rehberi | ✅ `OPENAPI_STRICT_PROD.md` |
| — | TR corpus 500 + OWASP 200 | ✅ `generate_*_corpus.py` |

Detay: [VS_RAKIPLER.md](VS_RAKIPLER.md) · [REAL_ATTACK.md](REAL_ATTACK.md) · [HOSTING_RUNBOOK_TR.md](HOSTING_RUNBOOK_TR.md)
