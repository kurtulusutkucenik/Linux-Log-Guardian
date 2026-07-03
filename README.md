# Linux Log Guardian

**Web sitesi:** [ceniklinuxlogguardian.org](https://www.ceniklinuxlogguardian.org) · [75 otomatik test](https://www.ceniklinuxlogguardian.org/testler) · [Core / Pro / Pro Plus](https://www.ceniklinuxlogguardian.org/paketler)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Linux%20x86__64-green.svg)](docs/CUSTOMER_REQUIREMENTS.md)
[![CI](https://github.com/kurtulusutkucenik/Linux-Log-Guardian/actions/workflows/build.yml/badge.svg)](https://github.com/kurtulusutkucenik/Linux-Log-Guardian/actions/workflows/build.yml)
[![Website](https://img.shields.io/badge/Site-ceniklinuxlogguardian.org-0ea5e9)](https://www.ceniklinuxlogguardian.org)

> **nginx access log → WAF/CRS → kernel ban** — tek zincir, MIT lisanslı, self-hosted.
>
> Ücretsiz. Ölçülebilir kanıt (PDF + JSON). VPS veya webhook şart değil.

| | |
|---|---|
| **Site** | [ceniklinuxlogguardian.org](https://www.ceniklinuxlogguardian.org) — kurulum, tier rehberi, kanıt |
| **Testler** | [ceniklinuxlogguardian.org/testler](https://www.ceniklinuxlogguardian.org/testler) — 75 otomatik doğrulama |
| **GitHub** | [kurtulusutkucenik/Linux-Log-Guardian](https://github.com/kurtulusutkucenik/Linux-Log-Guardian) |
| **Kurulum** | ~15 dk — [QUICKSTART_NGINX.md](docs/QUICKSTART_NGINX.md) |

> **Prod uyarısı:** L3/L4 volumetrik DDoS'ta tek başına yetmez — önce **CDN** (Cloudflare vb.), sonra nginx `limit_req`, sonra Log Guardian. [EDGE_PROTECTION.md](docs/EDGE_PROTECTION.md)
>
> **Güvenlik:** Laptop/deneme parolası `DegistirBeni!123` repoda kalır. İnternete açık sunucuda aynı gün `sudo bash scripts/laptop_harden.sh`. [LAPTOP_OPS.md](docs/LAPTOP_OPS.md) · [SECURITY.md](SECURITY.md)

---

## Ne yapar?

Linux Log Guardian, nginx erişim loglarını okur, OWASP CRS/WAF ile değerlendirir ve saldırgan IP'yi **ipset/XDP ile kernel seviyesinde** banlar. Fail2ban + ModSecurity + ayrı entegrasyon yerine **tek C binary zinciri**.

```
nginx log → parser → WAF/CRS (PCRE2) → ban pipeline → ipset/XDP → metrik + dashboard
```

**Dürüst sınır:** ModSecurity inline regex hızında değiliz. Güçlü yan: log→WAF→kernel ban **tek paket** + şeffaf bench + [ölçülebilir kanıt](https://www.ceniklinuxlogguardian.org/testler).

---

## Ölçülmüş performans (Core)

| Metrik | Değer |
|--------|-------|
| **EPS** | 280.373 |
| **Ban latency** | 20,23 ms (medyan, 21 örnek) |
| **Gerçek saldırı recall** | %100 (1K + 10K satır corpus) |
| **CRS parity** | %100 |
| **False positive** | %0,5 (500 benign) |
| **Otomatik test** | **75** — [canlı matris](https://www.ceniklinuxlogguardian.org/testler) |

Detay: [VS_RAKIPLER.md](docs/VS_RAKIPLER.md) · site üzerinde [rakip karşılaştırma](https://www.ceniklinuxlogguardian.org/#rakipler)

---

## Sürümler

> **Tek felsefe:** Az kaynak, çok koruma. **Koruma Core'da** — C binary (`log-guardian` + `log-guardian-daemon`).  
> Üst sürümlerde artan RAM/disk **Log Guardian çekirdeğinden değil**; Docker, Grafana, Prometheus, Caddy ve (Pro Plus'ta) kind/K8s gibi **sunum araçlarından** kaynaklanır.

| Sürüm | Ne | RAM | Disk |
|-------|-----|-----|------|
| **Core** | Binary + daemon + config/DB | ~110 MB | ~4 MB (temiz) · ~55 MB (dolu DB) |
| **Pro** | Core + dashboard + Grafana + Caddy + Prometheus | ~730 MB (laptop) · ~400 MB (VM) | ~5,3 GB (VM, çoğunlukla Docker) |
| **Pro Plus** | Pro + K8s/Helm kanıtı (kind) + fleet + opsiyonel Wasm/mesh | ~1,9 GB (hepsi açık) | Pro + ~2–3 GB (kind) |

| Sürüm | Zincir |
|-------|--------|
| **Core** | C binary → log → WAF → ban |
| **Pro** | Core + Dashboard + Grafana + Caddy + Prometheus |
| **Pro Plus** | Pro + K8s/Helm (kind) + fleet vitrin + opsiyonel Wasm/mesh |

Tier kurulum rehberleri: [ceniklinuxlogguardian.org/paketler](https://www.ceniklinuxlogguardian.org/paketler)

```bash
# Core (varsayılan)
sudo systemctl enable --now log-guardian-daemon log-guardian

# Pro (:8443 SOC)
bash scripts/dashboard_stack.sh

# Pro Plus (demo bitince kapat)
bash scripts/pro_plus_stack.sh
bash scripts/pro_plus_down.sh      # ~1,2 GB RAM geri
bash scripts/pro_plus_status.sh    # tier başına RAM ölçümü
```

---

## Hızlı kurulum (~15 dk)

**Gereksinim:** Ubuntu 22.04+ / Debian 12+ x86_64 · 512 MB+ RAM · nginx access log

```bash
git clone https://github.com/kurtulusutkucenik/Linux-Log-Guardian.git
cd Linux-Log-Guardian
sudo bash install.sh
```

**nginx log formatı** (`examples/nginx/snippets/`):

```nginx
log_format log_guardian '$remote_addr - $remote_user [$time_local] '
    '"$request" $status $body_bytes_sent '
    '"$http_referer" "$http_user_agent" "$request_body"';
access_log /var/log/nginx/access.log log_guardian;
```

```bash
sudo nginx -t && sudo systemctl reload nginx
sudo bash scripts/ensure_api_security.sh
sudo bash scripts/install_first_run.sh
bash scripts/post_install_verify.sh

sudo systemctl enable --now log-guardian-daemon log-guardian
sudo log-guardian --health
curl -s http://127.0.0.1:9091/metrics | head -20
```

Adım adım: [QUICKSTART_NGINX.md](docs/QUICKSTART_NGINX.md) · site: [kurulum bölümü](https://www.ceniklinuxlogguardian.org/#kurulum)

### Sorun giderme

| Belirti | Çözüm |
|---------|--------|
| `ACCESS_PASSWORD_KDF tanimli degil` | `sudo bash scripts/fix_analyzer.sh` |
| `:9091` timeout | `systemctl is-active log-guardian` |
| XDP yok (Wi‑Fi) | Normal — ipset fallback |

---

## Kanıt paketi

```bash
bash scripts/rakip_kanit.sh              # PDF + real-attack + ZIP
bash scripts/laptop_dev_gate.sh          # offline kanıt (VPS yok)
bash scripts/github_release_pack.sh      # release-pack.zip
bash scripts/demo_3min.sh                # 3 dk demo
```

| Çıktı | Ne |
|-------|-----|
| [competitive-proof.pdf](docs/evidence/competitive-proof.pdf) | Ölçülebilir kanıt özeti |
| [testler sayfası](https://www.ceniklinuxlogguardian.org/testler) | 75 otomatik test kartı |
| `https://localhost:8443/tests` | Pro dashboard (yerel SOC) |

---

## Repo yapısı

| Dizin | Ne |
|-------|-----|
| `*.c`, `*.h` | **Çekirdek** — log-guardian motoru (asıl ürün) |
| [`landing/`](landing/) | Tanıtım sitesi → [ceniklinuxlogguardian.org](https://www.ceniklinuxlogguardian.org) |
| [`dashboard/`](dashboard/) | Pro operatör paneli (`:8443`) |
| `scripts/` | Bench, gate, deploy, kanıt üretimi |
| `docs/` | Kurulum, operasyon, kanıt rehberleri |

Tek marketing sitesi: `landing/` (Next.js). Eski statik `assets/website/` pipeline emekliye ayrıldı.

---

## Geliştirme

```bash
make -j$(nproc)
export LOGANALYZER_PASSWORD='DegistirBeni!123'
./log-guardian --health
bash scripts/competitive_suite.sh
```

Site yerel önizleme: `cd landing && npm run dev` → http://localhost:3000

Modül haritası: [AGENTS.md](AGENTS.md) · Operasyon: [LAPTOP_OPS.md](docs/LAPTOP_OPS.md)

---

## Lisans

[MIT](LICENSE) — Copyright (c) 2026 kurtulusutkucenik. Üçüncü parti: [NOTICE](NOTICE).

---

# English

**Website:** [ceniklinuxlogguardian.org](https://www.ceniklinuxlogguardian.org) · [75 automated tests](https://www.ceniklinuxlogguardian.org/tests) · [Editions](https://www.ceniklinuxlogguardian.org/paketler)

> **nginx access log → WAF/CRS → kernel ban** — one integrated chain, self-hosted, MIT licensed.

Open-source Linux edge security with **measurable proof** (PDF + JSON). Not a Cloudflare/CrowdStrike replacement — it complements your stack.

### Performance (Core, measured)

| Metric | Value |
|--------|-------|
| EPS | 280,373 |
| Ban latency | 20.23 ms (median, 21 samples) |
| Attack recall | 100% |
| Automated tests | **75** — [live matrix](https://www.ceniklinuxlogguardian.org/tests) |

### Editions

| Edition | What |
|---------|------|
| **Core** | C binary → log → WAF → ban (~110 MB RAM) |
| **Pro** | Core + dashboard + Grafana + Caddy + Prometheus |
| **Pro Plus** | Pro + K8s/Helm proof (kind) + fleet + optional Wasm/mesh |

RAM/disk growth in upper tiers comes from **third-party tooling** (Docker, Grafana, kind), not the C core.

### Quick install

```bash
git clone https://github.com/kurtulusutkucenik/Linux-Log-Guardian.git
cd Linux-Log-Guardian
sudo bash install.sh
sudo systemctl enable --now log-guardian-daemon log-guardian
sudo log-guardian --health
```

Full guide: [QUICKSTART_NGINX.md](docs/QUICKSTART_NGINX.md) · Website: [setup section](https://www.ceniklinuxlogguardian.org/#kurulum)

### Proof

```bash
bash scripts/rakip_kanit.sh
bash scripts/laptop_dev_gate.sh
```

[MIT](LICENSE) — Copyright (c) 2026 kurtulusutkucenik.
