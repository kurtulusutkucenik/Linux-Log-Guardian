# Müşteri kurulum gereksinimleri

**Linux Log Guardian** yalnızca **Linux sunucu / VM** (x86_64) üzerinde çalışır.

**Algı yönetimi:** Ürün "her şeyi yapan platform" değil — **Core** (log→ban) zorunlu; eBPF daemon, dashboard, fleet, Wasm ve LLM Copilot aşağıdaki tablolarda **önerilen / isteğe bağlı** katmanlardır. Katmanlar: [BRANDING.md](BRANDING.md).

## Zorunlu (çekirdek ürün)

| Gereksinim | Açıklama |
|------------|----------|
| **Linux x86_64** | Kernel 5.x+ (eBPF/XDP için 5.8+ önerilir) |
| **Derleme** | `gcc`, `make`, `libsqlite3`, `libpcre2` |
| **Yapılandırma** | `rules.conf` + erişim log yolu (`ACCESS_LOG` veya `-f`) |

**Kazanımlar (Ollama / bulut API olmadan):**

- Yüksek hızlı log analizi (WAF + CRS uyumlu kurallar)
- IPC → XDP → ipset ban hattı
- SQLite olay veritabanı + TUI
- BOLA/IDOR + OpenAPI strict (şema açıkken)
- Kural tabanlı **Copilot** (filo + lineage + RAG fallback)

```bash
make -j$(nproc)
./log-guardian /var/log/nginx/access.log --rules rules.conf
```

## Önerilen (tam güvenlik + topluluk demosu)

| Gereksinim | Açıklama |
|------------|----------|
| **eBPF daemon** | `sudo ./log-guardian-daemon --iface eth0` — RCE, lineage, L7 HTTP probe |
| **Dashboard** | Node 20+, `cd dashboard && npm i && npm run dev` |
| **Prometheus** | `METRICS_PORT=9091` — Grafana panelleri |

**Kazanımlar:**

- Canlı **attack tree** (openat / execve / connect) — demo değil, `data_mode: live`
- L7 HTTP metodu görünürlüğü (`--status` → `l7_http`)
- Fleet / multi-tenant (SaaS modunda)
- Tek tık ban önerisi (Copilot + dashboard)

## İsteğe bağlı

| Bileşen | Ne zaman? | Kazanım |
|---------|-----------|---------|
| **Ollama + `llama3.2:3b`** | Doğal dil Copilot istenirse | Yerel LLM; API key yok → `docs/COPILOT_LLM.md` |
| **Wasmtime + native plugin** | Marketplace / hot-plug WAF | Dosya adı stub’ı değil, gerçek `.wasm` → `docs/BUILD_WASM.md` |
| **Telegram** | Alarm bildirimi | `docs/WEBHOOK_SETUP.md`, `WEBHOOK_DRY_RUN=1` test |
| **Grafana** | SOC görselleştirme | `docs/GRAFANA_SETUP.md`, `scripts/grafana_provision.sh` |
| **AbuseIPDB / OTX** | Threat feed | `rules.conf` threat feed blokları |
| **CrowdSec LAPI** | Topluluk sinyali + ek ban | `docs/CROWDSEC_INTEGRATION.md` · timer `log-guardian-crowdsec-bouncer` |

**Ollama zorunlu değil.** Kurulu değilse Copilot kural tabanlı modda çalışır.

## Minimum donanım (rehber)

| Profil | CPU | RAM | Disk |
|--------|-----|-----|------|
| Tek sunucu / PoC | 2 vCPU | 2 GB | 2 GB + log |
| Daemon + dashboard | 4 vCPU | 4 GB | 5 GB |
| Fleet + wasm native | 4+ vCPU | 8 GB | 10 GB |

## Doğrulama (müşteri veya CI)

```bash
bash scripts/competitive_suite.sh   # bench, FP, lineage, wasm, BOLA
bash scripts/l7_prod_e2e.sh         # --status → guardian-status.json
curl -s http://127.0.0.1:8080/api/v1/attack-tree | jq .data_mode
```

## Paketler

Katman haritası: [BRANDING.md](BRANDING.md) · Kanıt paketi: [DATA_ROOM.md](DATA_ROOM.md).
