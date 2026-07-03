<div align="center">

# Linux Log Guardian

**Self-hosted Linux edge security — log analizinden kernel ban'a tek zincir.**

nginx access log → WAF/CRS → ipset/XDP ban · tek C binary · MIT lisanslı

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Linux%20x86__64-green.svg)](docs/CUSTOMER_REQUIREMENTS.md)
[![CI](https://github.com/kurtulusutkucenik/Linux-Log-Guardian/actions/workflows/build.yml/badge.svg)](https://github.com/kurtulusutkucenik/Linux-Log-Guardian/actions/workflows/build.yml)
[![Website](https://img.shields.io/badge/Site-ceniklinuxlogguardian.org-0ea5e9)](https://www.ceniklinuxlogguardian.org)

[Web sitesi](https://www.ceniklinuxlogguardian.org) · [75 test](https://www.ceniklinuxlogguardian.org/testler) · [Sürümler](https://www.ceniklinuxlogguardian.org/paketler) · [Kurulum](docs/QUICKSTART_NGINX.md) · [GitHub](https://github.com/kurtulusutkucenik/Linux-Log-Guardian)

</div>

---

## İçindekiler

- [Ne yapar?](#ne-yapar)
- [Ölçülmüş performans](#ölçülmüş-performans-core)
- [Rakiplerle karşılaştırma](#rakiplerle-karşılaştırma)
- [Diller](#diller-web-sitesi)
- [Hızlı kurulum](#hızlı-kurulum-15-dk)
- [Sürümler](#sürümler)
- [Kanıt paketi](#kanıt-paketi)
- [Dokümantasyon](#dokümantasyon)
- [Geliştirme](#geliştirme)
- [English](#english)

---

## Ne yapar?

Linux Log Guardian, nginx erişim loglarını okur, OWASP CRS/WAF ile değerlendirir ve saldırgan IP'yi **kernel seviyesinde (ipset/XDP)** banlar. Fail2ban + ModSecurity + CrowdSec üçlüsünün yaptığını **tek entegre hat** olarak sunar.

```
nginx log → parser → WAF/CRS (PCRE2) → ban pipeline → ipset/XDP → Prometheus + dashboard
```

| | |
|---|---|
| **Ücretsiz & MIT** | VPS, webhook veya bulut hesabı zorunlu değil |
| **Tek binary** | `log-guardian` + `log-guardian-daemon` — harici servis şart değil |
| **Ölçülebilir kanıt** | Her iddia PDF + JSON + [75 canlı test](https://www.ceniklinuxlogguardian.org/testler) ile doğrulanır |
| **Self-hosted** | Veriniz sunucunuzda kalır; vendor lock-in yok |

**Ne değildir:** Cloudflare veya CrowdStrike yerine geçmez — **origin katmanında** onları tamamlar. ModSecurity'nin inline regex hızında da değiliz; güçlü yan **entegrasyon + ban hızı + şeffaf kanıt**.

> **Prod:** Volumetrik DDoS için önce CDN → nginx `limit_req` → Log Guardian. Bkz. [EDGE_PROTECTION.md](docs/EDGE_PROTECTION.md)
>
> **Güvenlik:** Deneme parolası `DegistirBeni!123` repoda kalır. İnternete açık sunucuda ilk gün: `sudo bash scripts/laptop_harden.sh`. Bkz. [SECURITY.md](SECURITY.md)

---

## Ölçülmüş performans (Core)

Son koşu: `bash scripts/competitive_suite.sh` → `docs/evidence/competitive-proof.json`

| Metrik | Değer | Açıklama |
|--------|-------|----------|
| Olay/saniye (EPS) | **280.373** | Parser + WAF hattı |
| Ban gecikmesi | **20,23 ms** | Medyan, 21 örnek (ipset/XDP) |
| Gerçek saldırı recall | **%100** | 1K + 10K satır corpus, 23 kategori (Spring4Shell/OGNL/Text4Shell + PHP-CGI/SpEL + Confluence dahil) |
| OWASP CRS parity | **%100** | Aynı regex seti (PCRE2 JIT) |
| False positive | **%0,2** ölçüldü | 500 benign satır · hedef <%0,5 |
| 72h soak | **PASS** | 864 örnek, 0 hata |
| Otomatik test | **75** | [Canlı matris](https://www.ceniklinuxlogguardian.org/testler) |

---

## Rakiplerle karşılaştırma

Açık kaynak ve self-hosted araçlarla ölçülmüş kıyas:

| Yetenek | Log Guardian | Fail2ban | CrowdSec | ModSecurity + CRS |
|---------|:---:|:---:|:---:|:---:|
| Log → WAF → kernel ban (tek paket) | Evet | Hayır | Kısmi | Kısmi |
| Gerçek saldırı recall | %100 | — | — | CRS parity %100 |
| Dağıtık / JA3 cluster | %100 (80 IP) | — | Sinyal tabanlı | — |
| nginx inline consult | PASS | — | — | Ayrı modül |
| False positive | %0,2 (500 benign) | Yüksek | Orta | CRS'ye bağlı |
| Ban gecikmesi | ~20 ms | Saniye–dakika | Saniye | Log-only / ayrı |
| Kanıt paketi (PDF + JSON) | Otomatik | Yok | Kısmi | Modül modül |
| Lisans | MIT | GPL | MIT | Apache |

<details>
<summary><b>Rakip notları (genişlet)</b></summary>

**Fail2ban** — Log tabanlı iptables ban; WAF/imza yok. Log Guardian aynı nginx logunda CRS + anomaly + kernel ban verir.

**CrowdSec** — Topluluk sinyali + ayrı bouncer; parçalı mimari. Log Guardian self-hosted tek hat + tenant izolasyonu + SOC paneli sunar.

**ModSecurity / OWASP CRS** — Güçlü inline WAF; ban genelde ayrı (fail2ban/script). Log Guardian aynı CRS regex setini **IPC → XDP/ipset** tek akışta birleştirir.

**Cloudflare / Imperva** — Edge absorb güçlü; maliyet ve vendor lock-in var. Log Guardian origin'de MIT olarak CDN'in **üstüne** konur.

**Dürüst sınır:** ModSecurity inline regex EPS yarışında değiliz (farklı mimari). Fark: entegrasyon + ban hızı + tekrarlanabilir kanıt.

</details>

Detay: [VS_RAKIPLER.md](docs/VS_RAKIPLER.md) · [Site karşılaştırma](https://www.ceniklinuxlogguardian.org/#rakipler)

---

## Diller (web sitesi)

Tanıtım sitesi [**24 dilde**](https://www.ceniklinuxlogguardian.org) yayınlanır. Odak Türk dünyası; global erişim için büyük diller de tam çevrili.

| Grup | Diller |
|------|--------|
| **Türk dilleri (13)** | Türkçe · Azerbaycanca · Kazakça · Özbekçe · Kırgızca · Türkmence · Uygurca · Tatarca · Başkurtça · Çuvaşça · Kırım Tatarcası · Gagavuzca · Yakutça |
| **Uluslararası (11)** | English · Русский · 中文 · 한국어 · 日本語 · Nederlands · العربية · Español · Deutsch · Français · Português |

Kaynak: [`landing/lib/i18n/locales.ts`](landing/lib/i18n/locales.ts)

---

## Hızlı kurulum (~15 dk)

**Gereksinim:** Ubuntu 22.04+ / Debian 12+ · x86_64 · 512 MB+ RAM · nginx access log

```bash
# 1 — Klonla ve kur
git clone https://github.com/kurtulusutkucenik/Linux-Log-Guardian.git
cd Linux-Log-Guardian
sudo bash install.sh

# 2 — nginx log formatı (examples/nginx/snippets/ içinde hazır snippet'ler var)
# log_format log_guardian ... + access_log /var/log/nginx/access.log log_guardian;

# 3 — Devreye al
sudo nginx -t && sudo systemctl reload nginx
sudo bash scripts/ensure_api_security.sh
sudo bash scripts/install_first_run.sh
bash scripts/post_install_verify.sh

sudo systemctl enable --now log-guardian-daemon log-guardian
sudo log-guardian --health
curl -s http://127.0.0.1:9091/metrics | head -20
```

**nginx log formatı:**

```nginx
log_format log_guardian '$remote_addr - $remote_user [$time_local] '
    '"$request" $status $body_bytes_sent '
    '"$http_referer" "$http_user_agent" "$request_body"';
access_log /var/log/nginx/access.log log_guardian;
```

Adım adım: [QUICKSTART_NGINX.md](docs/QUICKSTART_NGINX.md) · Site: [kurulum rehberi](https://www.ceniklinuxlogguardian.org/#kurulum)

<details>
<summary><b>Sorun giderme</b></summary>

| Belirti | Çözüm |
|---------|--------|
| `ACCESS_PASSWORD_KDF tanimli degil` | `sudo bash scripts/fix_analyzer.sh` |
| `:9091` timeout | `systemctl is-active log-guardian` |
| XDP yok (Wi-Fi) | Normal — otomatik `ipset` fallback |

</details>

---

## Sürümler

> **Felsefe:** Koruma **Core'da** — C binary. Üst sürümlerde artan RAM/disk; Docker, Grafana, Prometheus, Caddy ve kind/K8s gibi **sunum araçlarından** gelir, çekirdekten değil.

| Sürüm | İçerik | RAM | Disk |
|-------|--------|-----|------|
| **Core** | Binary + daemon + config/DB | ~110 MB | ~4 MB (temiz) · ~55 MB (dolu DB) |
| **Pro** | Core + dashboard + Grafana + Caddy + Prometheus | ~730 MB (laptop) · ~400 MB (VM) | ~5,3 GB (çoğu Docker) |
| **Pro Plus** | Pro + K8s/Helm (kind) + fleet + opsiyonel Wasm/mesh | ~1,9 GB (hepsi açık) | Pro + ~2–3 GB (kind) |

```bash
sudo systemctl enable --now log-guardian-daemon log-guardian   # Core
bash scripts/dashboard_stack.sh                                 # Pro → :8443
bash scripts/pro_plus_stack.sh                                  # Pro Plus (demo)
bash scripts/pro_plus_down.sh                                   # ~1,2 GB RAM geri
```

Tier rehberleri: [ceniklinuxlogguardian.org/paketler](https://www.ceniklinuxlogguardian.org/paketler)

---

## Kanıt paketi

Tüm performans iddiaları yerelde yeniden üretilebilir — VPS veya internet şart değil:

```bash
bash scripts/rakip_kanit.sh              # PDF + real-attack + ZIP
bash scripts/laptop_dev_gate.sh          # Offline kanıt kapısı
bash scripts/github_release_pack.sh      # release-pack.zip
bash scripts/demo_3min.sh                # 3 dakikalık demo
```

| Çıktı | Açıklama |
|-------|----------|
| [competitive-proof.pdf](docs/evidence/competitive-proof.pdf) | Ölçülebilir kanıt özeti |
| [testler sayfası](https://www.ceniklinuxlogguardian.org/testler) | 75 otomatik test kartı |
| `https://localhost:8443/tests` | Pro dashboard (yerel SOC) |

---

## Dokümantasyon

| Konu | Dosya |
|------|-------|
| 15 dk nginx kurulum | [QUICKSTART_NGINX.md](docs/QUICKSTART_NGINX.md) |
| Laptop / VM operasyon | [LAPTOP_OPS.md](docs/LAPTOP_OPS.md) |
| Edge / CDN katmanı | [EDGE_PROTECTION.md](docs/EDGE_PROTECTION.md) |
| Rakip karşılaştırma | [VS_RAKIPLER.md](docs/VS_RAKIPLER.md) |
| Güvenlik | [SECURITY.md](SECURITY.md) |
| Modül haritası (geliştirici) | [AGENTS.md](AGENTS.md) |
| Marka / isimlendirme | [BRANDING.md](docs/BRANDING.md) |

---

## Geliştirme

```bash
make -j$(nproc)
export LOGANALYZER_PASSWORD='DegistirBeni!123'
./log-guardian --health
bash scripts/competitive_suite.sh
```

| Dizin | İçerik |
|-------|--------|
| `*.c`, `*.h` | Çekirdek — log-guardian motoru |
| [`landing/`](landing/) | Tanıtım sitesi (Next.js, 24 dil) |
| [`dashboard/`](dashboard/) | Pro operatör paneli (`:8443`) |
| `scripts/` | Bench, gate, deploy, kanıt |
| `docs/` | Kurulum, operasyon, kanıt rehberleri |

Site önizleme: `cd landing && npm run dev` → http://localhost:3000

---

## Lisans

[MIT](LICENSE) — Copyright (c) 2026 kurtulusutkucenik · Üçüncü parti: [NOTICE](NOTICE)

---

## English

<div align="center">

**nginx access log → WAF/CRS → kernel ban** — one integrated chain, self-hosted, MIT licensed.

[Website](https://www.ceniklinuxlogguardian.org) · [75 tests](https://www.ceniklinuxlogguardian.org/tests) · [Editions](https://www.ceniklinuxlogguardian.org/paketler) · [Setup](docs/QUICKSTART_NGINX.md)

</div>

Open-source Linux edge security with **measurable proof** (PDF + JSON). Reads nginx logs, evaluates with OWASP CRS/WAF, bans attacker IPs at **kernel level (ipset/XDP)** — complements Cloudflare/CrowdStrike at the origin, does not replace them.

### Performance (Core, measured)

| Metric | Value |
|--------|-------|
| Events/sec (EPS) | **280,373** |
| Ban latency | **20.23 ms** (median, 21 samples) |
| Attack recall | **100%** (1K + 10K corpus, 23 categories incl. Spring4Shell/OGNL + PHP-CGI/SpEL + Confluence) |
| CRS parity | **100%** |
| False positive | **0.2%** measured (500 benign) — target <0.5% |
| 72h soak | **PASS** (864 samples, 0 failures) |
| Automated tests | **75** — [live matrix](https://www.ceniklinuxlogguardian.org/tests) |

### Compare (self-hosted)

| Capability | Log Guardian | Fail2ban | CrowdSec | ModSecurity + CRS |
|------------|:---:|:---:|:---:|:---:|
| Log → WAF → kernel ban | Yes | No | Partial | Partial |
| Attack recall | 100% | — | — | CRS parity 100% |
| False positive | 0.2% (500 benign) | High | Medium | CRS-dependent |
| Ban latency | ~20 ms | Seconds–minutes | Seconds | Log-only |
| Proof pack (PDF + JSON) | Automatic | No | Partial | Per-module |
| License | MIT | GPL | MIT | Apache |

Not faster than ModSecurity inline regex; differentiated by integrated pipeline, ban speed, and reproducible proof. [VS_RAKIPLER.md](docs/VS_RAKIPLER.md)

### Languages

Marketing website in **24 languages** — 13 Turkic + 11 international. Source: [`landing/lib/i18n/locales.ts`](landing/lib/i18n/locales.ts).

### Quick install

```bash
git clone https://github.com/kurtulusutkucenik/Linux-Log-Guardian.git
cd Linux-Log-Guardian
sudo bash install.sh
sudo systemctl enable --now log-guardian-daemon log-guardian
sudo log-guardian --health
```

Full guide: [QUICKSTART_NGINX.md](docs/QUICKSTART_NGINX.md)

### Proof

```bash
bash scripts/rakip_kanit.sh
bash scripts/laptop_dev_gate.sh
```

[MIT](LICENSE) — Copyright (c) 2026 kurtulusutkucenik.
