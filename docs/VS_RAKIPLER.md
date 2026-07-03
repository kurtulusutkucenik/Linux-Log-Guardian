# Rakipler vs Linux Log Guardian

**MIT · Türk topluluk · ücretsiz · ölçülebilir kanıt.** VPS, webhook veya ticari lisans gerekmez.

> Rakiplerin söylemesini istediğimiz cümle: *"Bu ücretsiz Türk projesi log→WAF→kernel ban'ı tek pakette veriyor; bench PDF'i var, engelleyin şu adamı."*

---

## Özet tablo (ölçülmüş)

Son koşu: `STABILITY=1 bash scripts/full_proof_pack.sh` → `competitive-proof.json`

| Metrik | Log Guardian | Fail2ban | CrowdSec | ModSecurity + CRS |
|--------|-------------|----------|----------|-------------------|
| **Log → WAF → kernel ban** | Tek binary + daemon | ❌ (sadece ban) | 🟡 (bouncer ayrı) | 🟡 (WAF ayrı, ban ayrı) |
| **Gerçek saldırı recall** | **%100** (1K + 10K, 19 kategori) | — | — | CRS parity %100 (aynı regex seti) |
| **Dağıtık / JA3 cluster** | **%100** (80 IP) + TLS :443 | — | Sinyal tabanlı | — |
| **nginx inline consult** | **PASS** (`/api/v1/consult`) | — | — | Ayrı modül |
| **False positive** | **%0.2** (500 benign) | Yüksek (regex yok) | Orta | CRS'ye bağlı |
| **Ban gecikmesi** | **~20 ms** (medyan 20,23 ms, ipset/XDP) | Saniye–dakika | Saniye | Log-only / ayrı entegrasyon |
| **Kısa stabilite (5 dk)** | **PASS** (0 failure) | — | — | — |
| **Kanıt paketi (PDF+JSON)** | ✅ otomatik | ❌ | 🟡 kısmi | 🟡 modül modül |
| **Türkçe doküman + MIT** | ✅ | 🟡 | 🟡 | ✅ CRS açık |

**Dürüst sınır:** ModSecurity inline regex EPS yarışında değiliz (bench: CRS replay ~12K EPS vs Guardian tek geçiş ~130 EPS — farklı mimari). Güçlü yan: **entegrasyon + ban hızı + şeffaf kanıt**.

---

## Fail2ban

| | |
|--|--|
| **Ne yapar** | Log satırına göre iptables ban (filtre kuralları) |
| **Eksik** | WAF yok, SQLi/XSS/LFI imzası yok, kernel XDP yok |
| **Bizim fark** | Aynı nginx log'unda CRS + anomaly + **~20 ms** ipset/XDP ban |
| **Kanıt** | `real-attack-report.json` — Fail2ban'ın tek başına yakalayamayacağı 19 kategori |

---

## CrowdSec

| | |
|--|--|
| **Ne yapar** | Topluluk sinyali + bouncer (iptables/nginx) |
| **Eksik** | Parçalı mimari; L7 WAF derinliği sınırlı; bench PDF yok |
| **Bizim fark** | Self-hosted tek hat, tenant izolasyonu, dashboard `/tests`, Prometheus `loganalyzer_*` |
| **Kanıt** | `competitive-proof.pdf` + `tenant-isolation-report.json` |

---

## ModSecurity / OWASP CRS

| | |
|--|--|
| **Ne yapar** | Inline veya reverse-proxy WAF (nginx/apache) |
| **Eksik** | Ban genelde ayrı (fail2ban/script); entegre kernel pipeline yok |
| **Bizim fark** | Aynı CRS regex seti (PCRE2 JIT) + **IPC → XDP/ipset** tek akış |
| **Kanıt** | `crs-parity-report.json` %100 parity + `bench-ban-latency.json` |

---

## Ticari WAF / Cloud (Cloudflare, Imperva…)

| | |
|--|--|
| **Ne yapar** | Edge absorb, managed rules |
| **Eksik** | Maliyet, vendor lock-in, origin log görünürlüğü |
| **Bizim fark** | Origin'de MIT, self-hosted, nginx log'unuzdan kernel ban — [EDGE_PROTECTION.md](EDGE_PROTECTION.md) ile CDN **üstüne** konur |
| **Mesaj** | Yerine geçmez; **origin katmanı** olarak tamamlar |

---

## Tek komut kanıt (VPS yok)

```bash
export LOGANALYZER_PASSWORD='DegistirBeni!123'
STABILITY=1 bash scripts/full_proof_pack.sh
# veya parçalı:
JA3_LIVE=1 NGINX_CONSULT=1 LIVE_ATTACK=1 bash scripts/rakip_kanit.sh
```

Üretir:

- `real-attack-report.json` / `real-attack-report-10k.json` — 1K + 10K recall
- `ja3-cluster-report.json` — dağıtık cluster + TLS live
- `nginx-inline-consult-report.json` — inline WAF consult
- `soak-report.short.json` — 5 dk stabilite (STABILITY=1)
- `competitive-proof.pdf` — kanıt özeti
- `data-room.zip` / `release-pack.zip` — arşiv

Dashboard: `https://localhost:8443/tests` (Docker prod stack)

---

## GitHub / topluluk mesajı (kopyala-yapıştır)

**TR:**  
Linux Log Guardian — nginx log → OWASP CRS → kernel ban, tek paket, MIT. Ölçülmüş: %100 gerçek saldırı recall (1K+10K), %0.2 FP (500 benign), ~20 ms ban (medyan 20,23 ms), 5 dk soak PASS. ModSec'ten hızlı değiliz; entegre hat + kanıt PDF ile farklıyız.

**EN:**  
Linux Log Guardian — nginx log → OWASP CRS → kernel ban in one MIT stack. Measured: 100% real-attack recall (1K+10K), 0.2% FP (500 benign), ~20 ms ban (median 20.23 ms), 5m soak PASS. Not faster than ModSec inline; differentiated by integrated pipeline + public proof.

---

## Sonraki güç çarpanları

**VPS'siz (laptop):**
1. Türkçe video / GIF — `bash scripts/demo_3min.sh` çıktısı
2. Yeni saldırı kategorileri — `scripts/generate_attack_corpus.py`
3. `PHASE100_FAST=1 bash scripts/phase100.sh` — faz kapıları

**VPS gelince:**
1. eth0 + kernel-XDP ON — `sudo log-guardian-daemon --iface eth0`
2. 72h soak — `SOAK_72H=1 bash scripts/sprint_c.sh`
3. Ban hedefi < **50 ms** prod bench

Detay: [SPRINT_GOALS.md](SPRINT_GOALS.md) Sprint C · [BENCHMARK.md](BENCHMARK.md)
