# Linux Log Guardian

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Linux%20x86__64-green.svg)](docs/CUSTOMER_REQUIREMENTS.md)
[![CI](https://github.com/kurtulusutkucenik/loganalyzer/actions/workflows/build.yml/badge.svg)](https://github.com/kurtulusutkucenik/loganalyzer/actions/workflows/build.yml)

> **nginx access log → WAF/CRS → kernel ban** — tek zincir, MIT lisanslı açık kaynak.

Ücretsiz. Self-hosted. Rakiplerin “şunu engelleyin” diyeceği türden **ölçülebilir kanıt** (PDF + JSON) — VPS veya webhook şart değil.

> **Prod uyarısı:** L3/L4 volumetrik DDoS’ta Log Guardian tek başına yetmez — önce **CDN** (Cloudflare vb.), sonra nginx `limit_req`, sonra Log Guardian. Katmanlı stack: [docs/EDGE_PROTECTION.md](docs/EDGE_PROTECTION.md) · [docs/ATTACK_DEFENSE.md](docs/ATTACK_DEFENSE.md)

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
| Ban gecikmesi | **~17 ms** → ipset | Genelde saniye–dakika |
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

Detay: [docs/VS_RAKIPLER.md](docs/VS_RAKIPLER.md) · Savunma: [docs/ATTACK_DEFENSE.md](docs/ATTACK_DEFENSE.md)

---

## 15 dakikada Core

```bash
git clone https://github.com/kurtulusutkucenik/loganalyzer.git
cd loganalyzer
sudo bash install.sh
sudo systemctl enable --now log-guardian-daemon log-guardian
sudo log-guardian --health
```

Detay: [docs/QUICKSTART_NGINX.md](docs/QUICKSTART_NGINX.md) · Sunucu SSH: [docs/PILOT_SETUP.md](docs/PILOT_SETUP.md)

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
| `https://localhost:8443/tests` | Dashboard test paneli (Docker) |
| `real-attack-report.json` | 1000 satır corpus recall (hedef ≥ %85) |
| `ja3-cluster-report.json` | Dağıtık saldırı (80 IP) |
| `live-attack-report.json` | Canlı tester senaryoları |

Detay: [docs/GITHUB_RELEASE.md](docs/GITHUB_RELEASE.md) · [docs/DATA_ROOM.md](docs/DATA_ROOM.md) · [docs/REAL_ATTACK.md](docs/REAL_ATTACK.md) · [docs/JA3_CLUSTERING.md](docs/JA3_CLUSTERING.md)

---

## Katmanlar

| Katman | Ne | Doküman |
|--------|-----|---------|
| **Core** | nginx log → WAF → ipset/XDP ban | [QUICKSTART_NGINX](docs/QUICKSTART_NGINX.md) |
| **Pro** | eBPF daemon, dashboard, Grafana, fleet | [QUICKSTART_DOCKER](docs/QUICKSTART_DOCKER.md) |
| **Opsiyonel** | XDR, Wasm, Copilot | [SCOPE_COVERAGE](docs/SCOPE_COVERAGE.md) |

İlk temas her zaman **Core** (15 dk). Geniş katmanlar isteğe bağlıdır — [BRANDING.md](docs/BRANDING.md).

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
| Ban latency | **~17 ms** → ipset | Usually seconds–minutes |
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

## Core in 15 minutes

```bash
git clone https://github.com/kurtulusutkucenik/loganalyzer.git
cd loganalyzer
sudo bash install.sh
sudo systemctl enable --now log-guardian-daemon log-guardian
sudo log-guardian --health
```

Details: [docs/QUICKSTART_NGINX.md](docs/QUICKSTART_NGINX.md) · Remote server: [docs/PILOT_SETUP.md](docs/PILOT_SETUP.md)

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
| `https://localhost:8443/tests` | Dashboard test panel (Docker) |
| `real-attack-report.json` | 500-line corpus recall (target ≥ 85%) |
| `ja3-cluster-report.json` | Distributed attack (80 IPs) |
| `live-attack-report.json` | Live tester scenarios |

Details: [docs/GITHUB_RELEASE.md](docs/GITHUB_RELEASE.md) · [docs/DATA_ROOM.md](docs/DATA_ROOM.md) · [docs/REAL_ATTACK.md](docs/REAL_ATTACK.md)

---

## Layers

| Layer | What | Docs |
|-------|------|------|
| **Core** | nginx log → WAF → ipset/XDP ban | [QUICKSTART_NGINX](docs/QUICKSTART_NGINX.md) |
| **Pro** | eBPF daemon, dashboard, Grafana, fleet | [QUICKSTART_DOCKER](docs/QUICKSTART_DOCKER.md) |
| **Optional** | XDR, Wasm, Copilot | [SCOPE_COVERAGE](docs/SCOPE_COVERAGE.md) |

Always lead with **Core** (15 min). Broader layers are optional — [BRANDING.md](docs/BRANDING.md).

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
