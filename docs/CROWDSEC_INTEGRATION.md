# CrowdSec bouncer entegrasyonu

**Linux Log Guardian** tek başına IP başına ban yapar; **CrowdSec** topluluk sinyali ve LAPI kararları sağlar. Bu rehber, CrowdSec `ban` kararlarını Log Guardian **ban API**'sine senkronlar — Fail2ban/CrowdSec bouncer yerine veya **yanında** kullanılabilir.

## Ne yapar / ne yapmaz

| Yapar | Yapmaz |
|-------|--------|
| LAPI `decisions` → `POST /api/v1/ban` | CrowdSec kurulumu / koleksiyon kuralları |
| systemd timer (5 dk) veya manuel sync | CrowdSec sinyal ağı yerine geçmez |
| Dry-run + kanıt (`crowdsec-bouncer-report.json`) | Dağıtık botnet tek başına çözüm |

**Mesaj:** Origin'de log→WAF→ban (Guardian) + isteğe bağlı CrowdSec sinyali (LAPI→ban API).

## Hızlı test (laptop, VPS yok)

```bash
export LOGANALYZER_PASSWORD='DegistirBeni!123'
bash scripts/crowdsec_bouncer_e2e.sh
# Canlı API (:8090 veya dashboard proxy):
LIVE_API=1 bash scripts/crowdsec_bouncer_e2e.sh
```

Beklenen: `crowdsec-bouncer-report.json` → `pass: true`, `mode: dry-run` (veya `live-api`).

## Prod kurulum

### 1. CrowdSec (ayrı paket)

CrowdSec'i resmi dokümantasyona göre kurun; LAPI `:8080` ve bouncer API key üretin.

### 2. Log Guardian ban API

```bash
sudo bash scripts/ensure_api_security.sh
sudo log-guardian --health   # IPC + API_TOKEN
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8090/api/v1/metrics
# 403 (tokensiz) veya 200 (Bearer token ile)
```

### 3. Bouncer timer

```bash
sudo bash scripts/install_crowdsec_bouncer.sh
sudo nano /etc/log-guardian/crowdsec.env   # CROWDSEC_API_KEY, LAPI URL
sudo systemctl enable --now log-guardian-crowdsec-bouncer.timer
sudo systemctl status log-guardian-crowdsec-bouncer.timer
```

Örnek `/etc/log-guardian/crowdsec.env`:

```bash
CROWDSEC_LAPI_URL=http://127.0.0.1:8081
CROWDSEC_API_KEY=<crowdsec-bouncer-key>
LG_BAN_API_BASE=http://127.0.0.1:8090
# API_TOKEN rules.conf ile ayni (install_crowdsec otomatik okur)
```

### 4. Manuel sync

```bash
CROWDSEC_DRY_RUN=1 bash scripts/crowdsec_bouncer_sync.sh   # listele
CROWDSEC_DRY_RUN=0 bash scripts/crowdsec_bouncer_sync.sh   # ban uygula
```

## Mimari

```text
CrowdSec LAPI (:8080)
        │ GET /v1/decisions
        ▼
crowdsec_bouncer_sync.sh  ──Bearer──▶  log-guardian API (:8090)
                                              │
                                              ▼
                                        ipset / XDP ban hattı
```

Guardian WAF hâlâ nginx log'unu okur; CrowdSec kararları **ek** IP ban kaynağıdır.

## Kanıt ve dashboard

| Dosya | Açıklama |
|-------|----------|
| `crowdsec-bouncer-report.json` | E2E dry-run / live |
| Dashboard `/tests` | Kart: `crowdsec-bouncer` |
| `competitive-proof.json` | Rekabet paketi bölümü |

## Sorun giderme

| Belirti | Çözüm |
|---------|--------|
| `API_TOKEN yok` | `ensure_api_security.sh` · `rules.conf` `API_TOKEN=` |
| LAPI erişilemiyor | `curl -H "X-Api-Key: …" $CROWDSEC_LAPI_URL/v1/decisions` |
| Ban olmuyor | `CROWDSEC_DRY_RUN=0` · daemon/ipset `--status` |
| Timer çalışmıyor | `journalctl -u log-guardian-crowdsec-bouncer.service` |

İlgili: [VS_RAKIPLER.md](VS_RAKIPLER.md) · [COMPETITIVE_STATUS.md](COMPETITIVE_STATUS.md) · [LAPTOP_OPS.md](LAPTOP_OPS.md)
