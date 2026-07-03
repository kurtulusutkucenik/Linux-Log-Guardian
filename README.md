# Linux Log Guardian

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Linux%20x86__64-green.svg)](docs/CUSTOMER_REQUIREMENTS.md)
[![CI](https://github.com/kurtulusutkucenik/Linux-Log-Guardian/actions/workflows/build.yml/badge.svg)](https://github.com/kurtulusutkucenik/Linux-Log-Guardian/actions/workflows/build.yml)

> **nginx access log → WAF/CRS → kernel ban** — tek zincir, MIT lisanslı açık kaynak.

Ücretsiz. Self-hosted. Rakiplerin “şunu engelleyin” diyeceği türden **ölçülebilir kanıt** (PDF + JSON) — VPS veya webhook şart değil.

> **Prod uyarısı:** L3/L4 volumetrik DDoS’ta Log Guardian tek başına yetmez — önce **CDN** (Cloudflare vb.), sonra nginx `limit_req`, sonra Log Guardian. Katmanlı stack: [docs/EDGE_PROTECTION.md](docs/EDGE_PROTECTION.md) · [docs/ATTACK_DEFENSE.md](docs/ATTACK_DEFENSE.md)

> **Güvenlik:** Self-hosted. **Laptop/deneme:** demo parola `DegistirBeni!123` repoda kalır. **İnternete açık sunucu:** aynı gün `sudo bash scripts/laptop_harden.sh`. Token’ları commit etmeyin. [LAPTOP_OPS.md](docs/LAPTOP_OPS.md) · [SECURITY.md](SECURITY.md)

> **Web sitesi:** [ceniklinuxlogguardian.org](https://ceniklinuxlogguardian.org) — kurulum rehberi, kanıt paketi, indirme. Statik vitrin; dashboard kendi sunucunuzda.

---

## Kurulum rehberi

**Hedef:** nginx access log → WAF/CRS → kernel ban (ipset; VPS’te XDP). İlk kurulum **~15 dakika** (derleme + nginx + servis).

### Kimler için?

| Senaryo | Ağ | Not |
|---------|-----|-----|
| **Laptop / deneme** | Wi‑Fi yeterli | XDP yoksa ipset kullanılır — normal |
| **VPS / prod** | `eth0` veya gerçek NIC | `IFACE=` rules.conf’ta doğru olmalı |
| **Offline kanıt** | İnternet gerekmez | `bash scripts/laptop_dev_gate.sh` |
| **Threat feed / webhook** | **Çıkış interneti gerekir** | Firehol key’siz; AbuseIPDB/OTX opsiyonel |

### Sistem gereksinimleri

| | Minimum | Önerilen |
|--|---------|----------|
| OS | Ubuntu 22.04+ / Debian 12+ **x86_64** | Aynı |
| Kernel | 4.18+ | 5.15+ (eBPF/XDP) |
| RAM | 512 MB | 2 GB+ |
| nginx | Kurulu, access log yazıyor | `log_guardian` formatı (kurulumda otomatik) |
| İnternet | Core için **gerekmez** | Threat feed, Telegram, `docker pull` için **gerekir** |

`install.sh` bağımlılıkları (clang, libbpf, ipset, sqlite, pcre2, …) dağıtıma göre otomatik kurar. Manuel liste: [docs/README_DETAY.md](docs/README_DETAY.md).

### Adım 1 — Repo ve kurulum (~5–10 dk)

```bash
git clone https://github.com/kurtulusutkucenik/Linux-Log-Guardian.git
cd loganalyzer          # ürün adı: Linux Log Guardian; binary: log-guardian
sudo bash install.sh    # derle, /usr/local/bin'e kur, systemd unit'leri yaz
```

Kurulum sonunda yeşil `[ OK ]` satırlarını kontrol edin. nginx `log_guardian` formatı yoksa `install.sh` uyarır; gerekirse adım 2.

### Adım 2 — Nginx log formatı (~3 dk)

Site veya `nginx.conf` içine (snippet: `examples/nginx/snippets/`):

```nginx
log_format log_guardian '$remote_addr - $remote_user [$time_local] '
    '"$request" $status $body_bytes_sent '
    '"$http_referer" "$http_user_agent" "$request_body"';
access_log /var/log/nginx/access.log log_guardian;
```

```bash
sudo nginx -t && sudo systemctl reload nginx
STRICT=1 bash scripts/check_nginx_log_format.sh   # doğrulama
```

### Adım 3 — Güvenlik ve ilk çalıştırma (~2 dk)

**Laptop (demo parola kalır):**

```bash
sudo bash scripts/ensure_api_security.sh      # API :8090 bind + token
sudo bash scripts/install_first_run.sh          # firewall, IPC, FP warmup, özet
bash scripts/post_install_verify.sh             # yeşil/kırmızı matris
```

**İnternete açık sunucu** — parolayı değiştirin:

```bash
sudo env LG_NEW_PASSWORD='KENDI_GUCLU_PAROLAN' bash scripts/install_first_run.sh
bash scripts/laptop_harden_check.sh
```

### Adım 4 — Servisleri başlat (~1 dk)

```bash
sudo systemctl enable --now log-guardian-daemon log-guardian
sudo systemctl status log-guardian-daemon log-guardian --no-pager
```

`/etc/log-guardian/rules.conf` kontrolü:

```bash
sudo grep -E '^(LOG_PATH|IFACE|METRICS_PORT|BAN_TTL)=' /etc/log-guardian/rules.conf
```

| Anahtar | Örnek |
|---------|--------|
| `LOG_PATH` | `/var/log/nginx/access.log` |
| `IFACE` | `eth0` (VPS) veya Wi‑Fi arayüzü |
| `METRICS_PORT` | `9091` |
| `BAN_TTL_SEC` | `600` |

### Adım 5 — Sağlık kontrolü

```bash
sudo log-guardian --health
sudo log-guardian --status
curl -s http://127.0.0.1:9091/metrics | head -20
```

Beklenen: `log-guardian` + `log-guardian-daemon` **active**, `:9091/metrics` satır döner.

### Adım 6 — Opsiyonel katmanlar

| Katman | Ne zaman | Komut | Süre |
|--------|----------|-------|------|
| **Threat intel (Firehol)** | Dış IP listesi, key yok | `sudo bash scripts/install_threat_intel_stack.sh` | ~1–4 dk (ilk) |
| **AbuseIPDB / OTX** | Ücretsiz API key varsa | `sudo nano /etc/log-guardian/threat-feed.env` → `sudo bash scripts/install_threat_feed_live.sh` | ~30 sn–2 dk |
| **Dashboard** | Görsel panel | `bash scripts/dashboard_dev.sh` → http://localhost:3001 | ~2 dk |
| **Telegram / webhook** | Alarm bildirimi | [WEBHOOK_SETUP.md](docs/WEBHOOK_SETUP.md) | — |
| **Inline consult** | İstek gelmeden 403 | `sudo bash scripts/merge_nginx_inline_consult.sh` | ~3 dk |

Threat intel notları:

- `threat-feed.env` **dosyasını `bash` ile çalıştırmayın** — `sudo nano` ile düzenleyin (`chmod 600`, root sahibi).
- Laptop’ta API key **boş bırakılabilir**; Firehol yeterli.
- Detay: [THREAT_INTEL_SETUP.md](docs/THREAT_INTEL_SETUP.md)

```bash
bash scripts/threat_intel_status.sh
bash scripts/threat_feed_live_proof.sh
```

### Adım 7 — Hızlı saldırı testi

```bash
./log-guardian test_access.log --no-tui --json --rules test_rules.conf
sudo log-guardian ban 203.0.113.99 --reason manual-test
sudo log-guardian unban 203.0.113.99
```

### Sorun giderme

| Belirti | Çözüm |
|---------|--------|
| `log-guardian` **failed**, `ACCESS_PASSWORD_KDF tanimli degil` | `sudo bash scripts/fix_analyzer.sh` |
| `curl :9091` timeout | Servis active mi? `systemctl is-active log-guardian` |
| `threat-feed.env` erişim engellendi | `sudo nano /etc/log-guardian/threat-feed.env` (bash değil) |
| `XDP haritasi yok (Wi-Fi)` | Normal — ipset fallback |
| Binary güncelleme | `sudo bash scripts/upgrade_log_guardian_binary.sh` |

### Daha fazla doküman

| Konu | Dosya |
|------|--------|
| 15 dk quickstart | [QUICKSTART_NGINX.md](docs/QUICKSTART_NGINX.md) |
| VPS SSH checklist | [PILOT_SETUP.md](docs/PILOT_SETUP.md) |
| Laptop script matrisi | [LAPTOP_OPS.md](docs/LAPTOP_OPS.md) |
| 7/24 operasyon | [OPERATIONS.md](docs/OPERATIONS.md) |
| Uzun kurulum / bağımlılıklar | [README_DETAY.md](docs/README_DETAY.md) |

---

## Rakipler neden korkar? (ölçülmüş)

| Metrik | Değer | Fail2ban / CrowdSec / ModSec stack |
|--------|-------|-------------------------------------|
| Gerçek saldırı recall | **%100** (1K + **10K** satır, 19 kategori) | Parçalı kurulum, tek PDF yok |
| Dağıtık cluster recall | **%100** (80 IP, aynı UA) | IP başına ban; cluster ayrı |
| JA3 TLS live | **PASS** (`:443` ClientHello + HTTPS swarm) | Ayrı TLS katmanı |
| nginx consult | **PASS** (union/or1/LFI 403, benign 200) | ModSec inline ayrı |
| Canlı harness | **525/525 refused** (:80) | Manuel test, tek rapor yok |
| False positive | **%0.5** (500 benign) | Fail2ban’da WAF yok |
| Ban gecikmesi | **17,85 ms** → ipset | Genelde saniye–dakika |
| CRS parity | **%100** | ModSec ayrı; ban ayrı entegrasyon |
| Kanıt paketi | `competitive-proof.pdf` + `release-pack.zip` | Manuel / dağınık |

**Dürüst sınır:** ModSecurity inline regex hızında değiliz. Güçlü yan: **log→WAF→kernel ban tek paket** + şeffaf bench.

```bash
bash scripts/rakip_kanit.sh                    # offline; nginx aciksa canli harness otomatik
LIVE_ATTACK=0 bash scripts/rakip_kanit.sh      # sadece replay (CI)
LIVE_ATTACK=force bash scripts/rakip_kanit.sh  # canli harness yeniden kos
JA3_LIVE=1 bash scripts/rakip_kanit.sh       # + TLS :443 JA3 (önce nginx_tls_local_setup)
bash scripts/corpus_10k_proof.sh             # ayrı — 10K satır recall (~1-2 dk)
bash scripts/owasp_corpus_proof.sh           # OWASP/CRS tarzı ek corpus
bash scripts/tr_hosting_corpus_proof.sh      # TR hosting tarzı corpus (150 satır)
bash scripts/extended_proof_pack.sh          # OWASP + TR + threat intel
bash scripts/laptop_dev_gate.sh              # VPS/webhook yok — offline kanıt kapısı
bash scripts/phase100_fast_gate.sh           # Faz 0-6 hızlı kapı
sudo bash scripts/nginx_tls_local_setup.sh   # T2 TLS :443 (JA3 live)
bash scripts/t2_tls_proof.sh                 # JA3 TLS kanıtı (daemon restart sonrasi)
bash scripts/soak_short_proof.sh            # 5 dk stabilite (opsiyonel)
STABILITY=1 bash scripts/full_proof_pack.sh  # tam kanıt + soak + release ZIP
bash scripts/release_ready_check.sh          # GitHub release öncesi doğrulama
bash scripts/github_release_pack.sh            # GitHub release ZIP
```

Detay: [docs/VS_RAKIPLER.md](docs/VS_RAKIPLER.md) · Savunma: [docs/ATTACK_DEFENSE.md](docs/ATTACK_DEFENSE.md) · Laptop: [docs/LAPTOP_OPS.md](docs/LAPTOP_OPS.md)

---

## Kanıt paketi

```bash
bash scripts/rakip_kanit.sh                    # rakip kanıtı — PDF + real-attack + ZIP
LIVE_ATTACK=1 bash scripts/rakip_kanit.sh      # nginx :80 canlı harness dahil
bash scripts/github_release_pack.sh              # release-pack.zip + RELEASE_NOTES.md
bash scripts/sprint_a.sh                         # competitive-proof PDF + data-room.zip
bash scripts/phase100.sh                         # Faz 0–6 kapıları
bash scripts/demo_3min.sh                        # 3 dk canlı demo
```

| Çıktı | Ne |
|-------|-----|
| `competitive-proof.pdf` | Ölçülebilir kanıt özeti |
| `release-pack.zip` | GitHub release bundle |
| `http://localhost:3001/tests` | Dashboard test paneli (dev) |
| `real-attack-report.json` | 1000 satır corpus recall (hedef ≥ %85) |
| `ja3-cluster-report.json` | Dağıtık saldırı (80 IP) |
| `live-attack-report.json` | Canlı tester senaryoları |

Detay: [docs/GITHUB_RELEASE.md](docs/GITHUB_RELEASE.md) · [docs/DATA_ROOM.md](docs/DATA_ROOM.md) · [docs/REAL_ATTACK.md](docs/REAL_ATTACK.md) · [docs/JA3_CLUSTERING.md](docs/JA3_CLUSTERING.md)

---

## Sürümler (Core · Pro · Pro Plus)

> **Tek felsefe:** Az kaynak, çok koruma. **Koruma Core'da** — C binary (`log-guardian` + `log-guardian-daemon`).  
> Üst sürümlerde RAM ve disk artışının sorumlusu Log Guardian çekirdeği **değildir**; Docker image'ları, Grafana, Prometheus, Caddy ve (Pro Plus'ta) kind/K8s gibi **sunum ve entegrasyon araçları** bu maliyeti taşır. Core binary hâlâ ~515 KB.

### Performans (Core — ölçülmüş)

| Metrik | Değer |
|--------|-------|
| **EPS** | 280.373 |
| **Ban latency** | 17,85 ms |

### Kaynak kullanımı (ayrı hesap)

| Sürüm | Bileşenler | RAM | Disk |
|-------|------------|-----|------|
| **Core** | Binary + daemon + `/etc/log-guardian` config/DB | **~110 MB** | **~4 MB** (temiz) · **~55 MB** (`events.db` dolu) |
| **Pro** | Core + dashboard + Grafana + Caddy + Prometheus + relay | **~730 MB** (laptop) · **~400 MB** (VM) | **~5,3 GB** (VM, çoğunlukla Docker image) |
| **Pro Plus** | Pro + K8s/Helm kanıtı (kind) + fleet vitrin + opsiyonel Wasm/mesh | **~1,9 GB** (laptop, hepsi açık) | Pro disk + **~2–3 GB** (kind volume) |

### Zincir özeti

| Sürüm | Ne |
|-------|-----|
| **Linux Log Guardian** (Core) | C binary → log → WAF → ban |
| **Linux Log Guardian Pro** | Core + Dashboard + Grafana + Caddy + Prometheus |
| **Linux Log Guardian Pro Plus** | Pro + K8s/Helm kanıtı (kind) + fleet vitrin + opsiyonel Wasm/mesh |

Hepsi bir arada “mega platform” değil — ihtiyacın olan katmanı açarsın. Günlük iş için **Core** veya **Pro** yeter; Pro Plus yalnızca K8s/Helm demosu için.

```bash
# Core (varsayılan)
sudo systemctl enable --now log-guardian-daemon log-guardian

# Pro stack (:8443 SOC)
bash scripts/dashboard_stack.sh                    # LOG_GUARDIAN_TIER=pro

# Pro Plus (K8s vitrin — demo bitince kapat)
bash scripts/pro_plus_stack.sh                     # LOG_GUARDIAN_TIER=pro_plus
bash scripts/pro_plus_down.sh                      # kind kapat (~1,2 GB RAM geri)
bash scripts/pro_plus_status.sh                    # Core / Pro / Pro Plus ayrı ölçüm
curl -sk https://localhost:8443/api/tier | jq .    # tier doğrulama
```

### Pro ve Pro Plus — ne kazandırır?

**Linux Log Guardian Pro** (Core üstüne):

| Avantaj | Ne işe yarar |
|---------|----------------|
| **SOC dashboard** (`:8443`) | Operatör paneli, `/tests` kanıt kartları, attack map, ban yönetimi |
| **Grafana + Prometheus** | Metrik, alert, `$tenant` panelleri |
| **Caddy TLS** | Prod sunum URL'si, JWT korumalı erişim |
| **Fleet + multi-tenant** | Çok sunucu telemetry, komut, uyumluluk raporu |
| **Webhook / Telegram** | Alarm fan-out, operatör ack/undo |

**Linux Log Guardian Pro Plus** (Pro üstüne — *en kapsamlı sürüm*):

| Avantaj | Ne işe yarar |
|---------|----------------|
| **K8s / Helm kanıtı** | `helm install log-guardian` — cluster'da da çalışır demosu |
| **kind + operator** | Admission webhook, DaemonSet, live-ready pod kanıtı |
| **Fleet vitrin** | Multi-node filo sunumu |
| **Wasm / mesh (opsiyonel)** | İmzalı plugin marketplace, etcd mesh — Enterprise yolu |

Koruma seviyesi **Core ile aynı** kalır; Pro ve Pro Plus **görünürlük ve entegrasyon kanıtı** ekler.

### RAM ve disk artışı — sorumluluk sınırı

| Katman | Log Guardian sorumluluğu | Üçüncü parti araçlar (bizim dışımızda) |
|--------|--------------------------|------------------------------------------|
| **Core** | `log-guardian` + daemon + config/DB (**~110 MB RAM**, **~4–55 MB disk**) | — |
| **Pro** | Aynı Core binary; ek koruma **yok** | Docker image'ları, Node.js dashboard, Grafana, Prometheus, Caddy |
| **Pro Plus** | Yine aynı Core; ek koruma **yok** | kind/K8s node, Helm chart pod'ları, operator, opsiyonel Wasm/mesh stack |

> **Özet:** Sürüm büyüdükçe artan RAM ve disk **Log Guardian C çekirdeğinden kaynaklanmaz**. Core binary ~515 KB ve ~110 MB RAM'de kalır. Fazlalık, SOC ve demo için seçtiğin **harici araçların** (Docker, Grafana, kind vb.) kapladığı alandır — bunları kapatınca veya sadece Core çalıştırınca maliyet düşer.

```bash
bash scripts/pro_plus_status.sh    # Core / Pro / Pro Plus RAM ayrı ölçüm
bash scripts/pro_plus_down.sh      # K8s vitrin kapat → ~1,2 GB RAM geri
```

### Diğer modüller (opsiyonel)

| Modül | Ne | Doküman |
|-------|-----|---------|
| **Threat intel** | Firehol (key yok) + opsiyonel AbuseIPDB/OTX | [THREAT_INTEL_SETUP](docs/THREAT_INTEL_SETUP.md) |
| **XDR / Wasm / Copilot** | Enterprise vitrin katmanları | [SCOPE_COVERAGE](docs/SCOPE_COVERAGE.md) |

İlk temas: [QUICKSTART_15MIN](docs/QUICKSTART_15MIN.md) · Docker SOC: [QUICKSTART_DOCKER](docs/QUICKSTART_DOCKER.md) · Yol haritası: [ROADMAP_FREE](docs/ROADMAP_FREE.md)

---

## Geliştirme

```bash
make -j$(nproc)
export LOGANALYZER_PASSWORD='DegistirBeni!123'
./log-guardian --health
bash scripts/competitive_suite.sh
```

Modül haritası: [AGENTS.md](AGENTS.md) · Uzun kurulum rehberi: [docs/README_DETAY.md](docs/README_DETAY.md)

---

## Lisans

[MIT](LICENSE) — Copyright (c) 2026 kurtulusutkucenik. Üçüncü parti: [NOTICE](NOTICE).

---

---

# English

# Linux Log Guardian

> **nginx access log → WAF/CRS → kernel ban** — one integrated chain, self-hosted, MIT licensed.

An open-source, Linux-native edge security project (MIT). It does not replace Cloudflare or CrowdStrike; it complements your stack with a **measurable** path from nginx logs to kernel-level bans.

---

## Why competitors worry (measured)

| Metric | Value | Typical Fail2ban / CrowdSec / ModSec stack |
|--------|-------|---------------------------------------------|
| Real attack recall | **100%** (1000 lines, 19 categories, incl. POST SQLi) | Fragmented setup, no single PDF |
| Distributed cluster | **100%** (80 IPs, same UA) | Per-IP ban; cluster separate |
| Live harness | **525/525 refused** (:80) | Manual tests, no single report |
| False positive | **0.5%** (500 benign lines) | No WAF on fail2ban |
| Ban latency | **17.85 ms** → ipset | Usually seconds–minutes |
| CRS parity | **100%** | ModSec separate; ban separate integration |
| Proof package | `competitive-proof.pdf` + `release-pack.zip` | Manual / scattered |

**Honest limit:** Not faster than inline ModSecurity on regex EPS. Strength: **log→WAF→kernel ban in one MIT package** + public proof.

```bash
bash scripts/rakip_kanit.sh                    # offline — PDF + ZIP
LIVE_ATTACK=1 bash scripts/rakip_kanit.sh      # + live nginx harness
bash scripts/github_release_pack.sh            # GitHub release ZIP
```

Details: [docs/VS_RAKIPLER.md](docs/VS_RAKIPLER.md)

---

## Installation guide

**Goal:** nginx access log → WAF/CRS → kernel ban. First setup **~15 minutes**.

| Scenario | Network | Notes |
|----------|---------|-------|
| Laptop / trial | Wi‑Fi OK | No XDP → ipset fallback is normal |
| VPS / prod | Real NIC (`eth0`) | Set `IFACE=` in `rules.conf` |
| Offline proof | No internet | `bash scripts/laptop_dev_gate.sh` |
| Threat feed / webhooks | **Egress internet required** | Firehol needs no API key |

**Requirements:** Ubuntu 22.04+ / Debian 12+ x86_64 · 512 MB+ RAM · nginx with access log · `install.sh` installs build deps automatically.

```bash
git clone https://github.com/kurtulusutkucenik/Linux-Log-Guardian.git
cd loganalyzer
sudo bash install.sh

# nginx log_format log_guardian — see examples/nginx/snippets/
sudo nginx -t && sudo systemctl reload nginx

sudo bash scripts/ensure_api_security.sh
sudo bash scripts/install_first_run.sh          # laptop; use LG_NEW_PASSWORD on public servers
bash scripts/post_install_verify.sh

sudo systemctl enable --now log-guardian-daemon log-guardian
sudo log-guardian --health
curl -s http://127.0.0.1:9091/metrics | head
```

**Optional:** threat intel `sudo bash scripts/install_threat_intel_stack.sh` · dashboard `bash scripts/dashboard_stack.sh` · [THREAT_INTEL_SETUP.md](docs/THREAT_INTEL_SETUP.md) · [WEBHOOK_SETUP.md](docs/WEBHOOK_SETUP.md)

**Troubleshooting:** `ACCESS_PASSWORD_KDF` missing → `sudo bash scripts/fix_analyzer.sh` · edit API keys with `sudo nano /etc/log-guardian/threat-feed.env` (do not `bash` the file).

Full docs: [QUICKSTART_NGINX.md](docs/QUICKSTART_NGINX.md) · [PILOT_SETUP.md](docs/PILOT_SETUP.md) · [LAPTOP_OPS.md](docs/LAPTOP_OPS.md)

---

## Proof package

```bash
bash scripts/rakip_kanit.sh                    # competitor proof — PDF + ZIP
LIVE_ATTACK=1 bash scripts/rakip_kanit.sh      # incl. live nginx harness
bash scripts/github_release_pack.sh              # release-pack.zip
bash scripts/sprint_a.sh                         # competitive-proof PDF + data-room.zip
bash scripts/phase100.sh                         # Phase 0–6 gates
bash scripts/demo_3min.sh                        # 3-minute live demo
```

| Artifact | Purpose |
|----------|---------|
| `competitive-proof.pdf` | Measurable evidence summary |
| `release-pack.zip` | GitHub release bundle |
| `http://localhost:3001/tests` | Dashboard test panel (dev) |
| `real-attack-report.json` | 500-line corpus recall (target ≥ 85%) |
| `ja3-cluster-report.json` | Distributed attack (80 IPs) |
| `live-attack-report.json` | Live tester scenarios |

Details: [docs/GITHUB_RELEASE.md](docs/GITHUB_RELEASE.md) · [docs/DATA_ROOM.md](docs/DATA_ROOM.md) · [docs/REAL_ATTACK.md](docs/REAL_ATTACK.md)

---

## Editions (Core · Pro · Pro Plus)

> **One philosophy:** Low resource footprint, high protection. **Protection lives in Core** — the C binary (`log-guardian` + `log-guardian-daemon`).  
> RAM and disk growth in upper tiers is **not** from the Log Guardian core (~515 KB binary). It comes from **presentation and integration tooling**: Docker images, Grafana, Prometheus, Caddy, and (Pro Plus) kind/K8s.

### Performance (Core — measured)

| Metric | Value |
|--------|-------|
| **EPS** | 280,373 |
| **Ban latency** | 17.85 ms |

### Resource usage (separate accounting)

| Edition | Components | RAM | Disk |
|---------|------------|-----|------|
| **Core** | Binary + daemon + `/etc/log-guardian` config/DB | **~110 MB** | **~4 MB** (clean) · **~55 MB** (full `events.db`) |
| **Pro** | Core + dashboard + Grafana + Caddy + Prometheus + relays | **~730 MB** (laptop) · **~400 MB** (VM) | **~5.3 GB** (VM, mostly Docker images) |
| **Pro Plus** | Pro + K8s/Helm proof (kind) + fleet demo + optional Wasm/mesh | **~1.9 GB** (laptop, all open) | Pro disk + **~2–3 GB** (kind volume) |

### Chain summary

| Edition | What |
|---------|------|
| **Linux Log Guardian** (Core) | C binary → log → WAF → ban |
| **Linux Log Guardian Pro** | Core + Dashboard + Grafana + Caddy + Prometheus |
| **Linux Log Guardian Pro Plus** | Pro + K8s/Helm proof (kind) + fleet demo + optional Wasm/mesh |

Not an all-in-one mega platform — enable the layer you need. Daily work: **Core** or **Pro**. Pro Plus is for K8s/Helm demos only.

```bash
# Core (default)
sudo systemctl enable --now log-guardian-daemon log-guardian

# Pro stack (:8443 SOC)
bash scripts/dashboard_stack.sh                    # LOG_GUARDIAN_TIER=pro

# Pro Plus (K8s demo — shut down after)
bash scripts/pro_plus_stack.sh                     # LOG_GUARDIAN_TIER=pro_plus
bash scripts/pro_plus_down.sh                      # stop kind (~1.2 GB RAM back)
bash scripts/pro_plus_status.sh                    # per-tier RAM breakdown
curl -sk https://localhost:8443/api/tier | jq .
```

### Pro and Pro Plus — what you gain

**Linux Log Guardian Pro** (on top of Core):

| Benefit | Purpose |
|---------|---------|
| **SOC dashboard** (`:8443`) | Operator UI, `/tests` proof cards, attack map, ban management |
| **Grafana + Prometheus** | Metrics, alerts, `$tenant` panels |
| **Caddy TLS** | Production demo URL, JWT-protected access |
| **Fleet + multi-tenant** | Multi-host telemetry, commands, compliance export |
| **Webhook / Telegram** | Alert fan-out, operator ack/undo |

**Linux Log Guardian Pro Plus** (on top of Pro — *full edition*):

| Benefit | Purpose |
|---------|---------|
| **K8s / Helm proof** | `helm install log-guardian` — runs on cluster demo |
| **kind + operator** | Admission webhook, DaemonSet, live-ready pod proof |
| **Fleet showcase** | Multi-node fleet presentation |
| **Wasm / mesh (optional)** | Signed plugin marketplace, etcd mesh — Enterprise path |

Protection level **stays the same as Core**; Pro and Pro Plus add **visibility and integration proof**.

### RAM and disk growth — responsibility boundary

| Layer | Log Guardian responsibility | Third-party tooling (outside our core) |
|-------|----------------------------|----------------------------------------|
| **Core** | `log-guardian` + daemon + config/DB (**~110 MB RAM**, **~4–55 MB disk**) | — |
| **Pro** | Same Core binary; **no extra protection** | Docker images, Node.js dashboard, Grafana, Prometheus, Caddy |
| **Pro Plus** | Same Core again; **no extra protection** | kind/K8s node, Helm chart pods, operator, optional Wasm/mesh stack |

> **Summary:** Higher-tier RAM and disk use is **not caused by the Log Guardian C core**. The Core binary stays ~515 KB and ~110 MB RAM. The overhead comes from **external tools** you enable for SOC and demos (Docker, Grafana, kind, etc.) — shut them down or run Core-only to reduce cost.

```bash
bash scripts/pro_plus_status.sh    # per-tier RAM breakdown
bash scripts/pro_plus_down.sh      # stop K8s demo → ~1.2 GB RAM back
```

### Other modules (optional)

| Module | What | Docs |
|--------|------|------|
| **Threat intel** | Firehol (no key) + optional AbuseIPDB/OTX | [THREAT_INTEL_SETUP](docs/THREAT_INTEL_SETUP.md) |
| **XDR / Wasm / Copilot** | Enterprise demo layers | [SCOPE_COVERAGE](docs/SCOPE_COVERAGE.md) |

Start here: [QUICKSTART_15MIN](docs/QUICKSTART_15MIN.md) · Docker SOC: [QUICKSTART_DOCKER](docs/QUICKSTART_DOCKER.md) · Roadmap: [ROADMAP_FREE](docs/ROADMAP_FREE.md)

---

## Development

```bash
make -j$(nproc)
export LOGANALYZER_PASSWORD='DegistirBeni!123'
./log-guardian --health
bash scripts/competitive_suite.sh
```

Module map: [AGENTS.md](AGENTS.md) · Extended setup guide: [docs/README_DETAY.md](docs/README_DETAY.md)

---

## License

[MIT](LICENSE) — Copyright (c) 2026 kurtulusutkucenik. Third-party notices: [NOTICE](NOTICE).
