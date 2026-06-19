# Threat Intel kurulumu

Linux Log Guardian'da threat intel **iki katman**:

| Katman | Kaynak | API key? | İnternet? |
|--------|--------|----------|-----------|
| **Firehol + GeoIP** | `threat_intel.sh` + timer | Hayır | **Evet** (ilk sync + günlük) |
| **AbuseIPDB / OTX** | `threat_feed.c` | Evet | **Evet** |

**Core (log → WAF → ban)** internet olmadan çalışır. Threat feed, Telegram webhook ve dış listeler **çıkış interneti** ister (Wi‑Fi veya ethernet fark etmez).

---

## Ne zaman internet gerekir?

| İş | İnternet |
|----|----------|
| `install.sh`, derleme (`make`) | Hayır (paketler önceden kuruluysa) |
| nginx log analizi, yerel ban | Hayır |
| Offline kanıt (`rakip_kanit.sh`, corpus) | Hayır |
| Firehol / GeoIP listesi indirme | **Evet** |
| AbuseIPDB / OTX sync | **Evet** + API key |
| Telegram / Slack webhook | **Evet** (hedef URL) |
| Dashboard Grafana image pull | **Evet** (ilk `docker pull`) |

Laptop'ta Wi‑Fi NIC'te XDP yok → **ipset fallback** normaldir (`[WARN] XDP haritasi yok`).

---

## Tek komut — Firehol (key gerekmez)

```bash
sudo bash scripts/install_threat_intel_stack.sh
```

**Süre (kabaca):**

| Durum | Süre |
|-------|------|
| İlk kurulum (ipset boş, ağ iyi) | 1–4 dk |
| Zaten kurulu (ipset ≥ 50, key yok) | ~10 sn |
| Ağ kopuk / retry | 5+ dk (ipset silinmez) |

Kanıt:

```bash
sudo bash scripts/threat_intel_status.sh      # ipset + key dosyasi root okur
sudo bash scripts/threat_feed_live_proof.sh   # sudo yoksa script otomatik sudo'lar
```

`bash` (sudo'suz) çalıştırırsan ipset=0 / key=0 **yanlış görünür** — dosyalar `chmod 600`.

---

## Opsiyonel — AbuseIPDB / OTX (API key)

Laptop için **zorunlu değil**. Firehol katmanı tek başına yeterli.

### 1. Ücretsiz key al

| Değişken | Kayıt |
|----------|-------|
| `ABUSEIPDB_API_KEY` | https://www.abuseipdb.com/account/api |
| `OTX_API_KEY` | https://otx.alienvault.com → Settings → API Key |

### 2. Dosyayı düzenle (çalıştırma değil!)

```bash
sudo nano /etc/log-guardian/threat-feed.env
```

Örnek:

```bash
ABUSEIPDB_API_KEY=abc123...
OTX_API_KEY=xyz789...
```

- Dosya `chmod 600`, sahip `root` — normal kullanıcı okuyamaz (**kasıtlı**).
- **`bash /etc/log-guardian/threat-feed.env` kullanmayın** — bu bir env dosyası, script değil.

### 3. Kurulum

```bash
sudo bash scripts/install_threat_feed_live.sh
```

**Süre (gerçekçi):**

| Kaynak | İlk sync |
|--------|----------|
| Sadece AbuseIPDB | ~1–3 dk (API + binlerce ipset yazma) |
| AbuseIPDB + OTX | **5–15 dk** (OTX tam IPv4 export çok büyük) |
| Script `threat-feed-sync` satırı | Ekranda sessiz kalabilir — arka planda indiriyor/banlıyor |

`[install_threat_feed_live] ilk threat-feed-sync...` satırında takılı görünmesi **normal**. İlerlemeyi görmek için başka terminal:

```bash
sudo /usr/local/bin/log-guardian threat-feed-sync
```

Laptop’ta OTX yavaşsa `rules.conf` içinde `THREAT_FEED_SOURCES=abuseipdb` yeterli.

Key'lerden biri dolu olsa yeterli; ikisi de boşsa script Firehol-only modda kalır.

---

## Threat feed güvenlik (AbuseIPDB / OTX katmanı)

`threat_feed.c` indirme politikası (yerel laptop / prod):

| Kural | Davranış |
|-------|----------|
| URL şeması | `https://` zorunlu (`http://` yalnızca `127.0.0.1` / `localhost` dev) |
| `file://` | Yalnızca `/etc/log-guardian/data/` veya repo `data/` altı |
| Redirect | Kapalı (SSRF riski) |
| Boyut | Maks. 8 MB / sync |
| Ban | `is_valid_ip()` + `ban_pipeline` (whitelist dahil) |

`THREAT_FEED_URL` veya `STIX_URL` için dışarıdan rastgele `file:///etc/passwd` gibi URL'ler **reddedilir**.

---

## Sık sorunlar

| Belirti | Sebep | Çözüm |
|---------|-------|-------|
| `Indirme basarisiz` | İnternet yok / DNS | Wi‑Fi kontrol; mevcut ipset korunur |
| `threat-feed-sync` ERR | Key yok veya geçersiz | Key doldur veya Firehol-only bırak |
| `curl :9091` timeout | `log-guardian` çökmüş | `sudo bash scripts/fix_analyzer.sh` |
| `Erişim engellendi` env dosyası | `sudo` olmadan okuma | `sudo nano ...` |
| `THREAT_FEED_ENABLED=0` metrik | API katmanı kapalı | Normal (Firehol-only) |
| `--status` `last_sync_ts=0` | CLI sync ayrı süreç | Son sync `/etc/log-guardian/threat_feed_stats.json`; `log-guardian --status` dosyadan birleştirir |

---

## İlgili dosyalar

| Dosya | Açıklama |
|-------|----------|
| `/etc/log-guardian/threat-feed.env` | API key'ler (commit etme) |
| `/etc/log-guardian/rules.conf` | `THREAT_FEED_*`, `BLOCK_COUNTRIES` |
| `examples/threat-feed.env.example` | Şablon |
| `log-guardian-threatintel.timer` | Gece Firehol sync |

Operasyon: [OPERATIONS.md](OPERATIONS.md) · Laptop: [LAPTOP_OPS.md](LAPTOP_OPS.md)
