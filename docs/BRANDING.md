# Marka ve isimlendirme rehberi

Bu belge depo genelinde tutarlı dış iletişim ve teknik isimlendirme için referanstır.

## Resmi kimlik

| Katman | Kullan | Örnek |
|--------|--------|-------|
| **Ürün adı** | Linux Log Guardian | README, PDF, Grafana, topluluk |
| **Kısa ad** | Log Guardian | Dokümantasyon, alert, günlük konuşma |
| **Teknik paket** | `log-guardian` | npm, systemd, Docker image |
| **Ana binary** | `log-guardian`, `log-guardian-daemon` | CLI, kurulum |
| **Klasör (önerilen)** | `Linux Log Guardian` | Masaüstü / geliştirme dizini |
| **Repo (geçiş)** | `log-guardian` hedef; mevcut `loganalyzer` alias | GitHub clone URL |

**Neden "Linux":** Ürün yalnızca Linux x86_64 üzerinde çalışır (eBPF/XDP). İsim platformu açıkça belirtir.

**Tek cümle (pazarlama):** Self-hosted Linux edge security — log analizinden kernel ban'a tek zincir.

**Tek cümle (teknik):** nginx access log → WAF/CRS → IPC → XDP/ipset ban.

## Logo (tek kaynak)

| Dosya | Kullanım |
|-------|----------|
| `dashboard/public/logo.png` | Nav, login, PDF viewer, tüm UI |
| `dashboard/public/favicon.ico` | Sekme ikonu (türetilmiş) |
| `assets/pdf-brand.png` | competitive-proof PDF header |

Kaynak görsel değişince yalnızca `logo.png` güncelle; favicon/PDF için `bash scripts/competitive_proof.sh` + dashboard rebuild.

## Kullanmayın

- **CENIK** — eski çalışma adı; yeni metinlerde kullanmayın
- "Log analyzer" tek başına ürün adı olarak (eski repo adı; metrik prefix'te kalabilir)
- "CrowdStrike/Cloudflare yerine" (tamamlar, değiştirmez — README ile uyumlu)
- "Her şeyi yapan SIEM" — kapsam tier'lara bölünmüştür (aşağı)

## Teknik legacy isimler (bilinçli)

| Alan | Mevcut | Not |
|------|--------|-----|
| Prometheus metrikleri | `loganalyzer_*` | Breaking change; v2'de `log_guardian_*` planı |
| Env şifre | `LOGANALYZER_PASSWORD` | `rules.conf` KDF; rename sonraki major |
| BPF pin path | `/sys/fs/bpf/loganalyzer` | İç detay; dış dokümanda anmayın |

Yeni dokümantasyon ve UI metinlerinde **Linux Log Guardian** veya kısaca **Log Guardian** kullanın.

## Ürün kapsamı (algı yönetimi)

| Tier | Mesaj | Bileşenler |
|------|-------|------------|
| **Core (Community)** | "15 dakikada nginx koruması" | `log-guardian`, WAF, ban, TUI, SQLite |
| **Pro** | "SOC + filo + uyumluluk" | + daemon, dashboard, Grafana, fleet, webhook |
| **Enterprise (vizyon)** | "Marketplace + imzalı plugin + SLA" | + Wasm native, merkezi politika, air-gap runbook |

**Kural:** İlk temas her zaman **Core** mesajıdır. XDR, fleet, Wasm, Copilot LLM **isteğe bağlı modül** olarak anlatılır.

Detay: [CUSTOMER_REQUIREMENTS.md](CUSTOMER_REQUIREMENTS.md) · [DATA_ROOM.md](DATA_ROOM.md).

## Açık kaynak konumlandırma

- **Hedef:** Türk ve global topluluk — self-hosted, MIT, ölçülebilir kanıt.
- **Rakipler:** Fail2ban, CrowdSec, ModSecurity/CRS — hız yarışı iddiası yok; entegre log→ban + bench şeffaflığı.
- **İlk temas:** Core (15 dk nginx). Pro/Enterprise katmanları **opsiyonel modül**, ücretli paket değil.

## Grafana ve observability

- Dashboard başlığı: **Linux Log Guardian — Operations** (`grafana-dashboard.json`)
- Alert `labels.product`: `log-guardian`
- Prometheus `job_name`: `log-guardian`

## AI / agent bağlamı

Kök [AGENTS.md](../AGENTS.md) modül haritası ve token tasarrufu kurallarını içerir.
