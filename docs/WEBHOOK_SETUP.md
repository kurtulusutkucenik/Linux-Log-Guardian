# Webhook bildirimleri (Telegram, Discord, Slack)

Log Guardian aynı alarmı yapılandırılan tüm kanallara gönderir (fan-out).

## Prod kurulum (Telegram canli alarm)

Yerel `.env.webhook.local` hazir olduktan sonra:

```bash
sudo bash scripts/webhook_install_prod.sh
sudo bash scripts/webhook_install_prod.sh --test-all
```

Script su isleri yapar:
- `/etc/log-guardian/webhook.env` (token, chmod 600)
- `rules.conf` → `WEBHOOK_ENABLED=1`
- systemd drop-in → `log-guardian.service` env yukler
- `log-guardian.service` restart

**Onerilen prod degerleri** (`.env.webhook.local`):

| Degisken | Deger | Anlam |
|----------|-------|-------|
| `WEBHOOK_MIN_LEVEL` | `1` | INFO+WARN+CRIT (agresif) |
| `WEBHOOK_COOLDOWN_SEC` | `1` | Ayni IP tekrar bildirim (min 1 sn) |
| `WEBHOOK_ASYNC` | `1` | Arka plan kuyrugu (log isleme bloklanmaz) |
| `WEBHOOK_SILENT_INFO` | `1` | INFO sessiz, WARN/CRIT sesli |
| `WEBHOOK_DRY_RUN` | `0` | Gercek Telegram gonderimi |
| `LOGANALYZER_TELEGRAM_CHAT_ID` | `-100...,123456789` | Virgulle coklu hedef (kanal+DM) |

Ban bildirimleri `min_level` filtresinden gecmez — her ban Telegram'a gider (sebep metni dahil).

## Yerel sır dosyası (GitHub'a commit etmeyin)

VPS yokken gerçek Discord/Telegram/Slack URL'lerini yalnızca yerelde tutun:

```bash
cp deploy/webhook.local.env.example .env.webhook.local
# URL/token doldur (en az bir kanal)
bash scripts/webhook_apply_local.sh
bash scripts/webhook_apply_local.sh --test alert
```

- `.env.webhook.local` → `.gitignore` (`.env.*`)
- Üretilen: `.cache/webhook.local.env`, `.cache/webhook.local.rules.conf`
- GitHub öncesi: `rm -f .env.webhook.local .cache/webhook.local.env`

## Hızlı yapılandırma (`rules.conf`)

```ini
WEBHOOK_ENABLED=1
WEBHOOK_MIN_LEVEL=2
WEBHOOK_COOLDOWN_SEC=60

TELEGRAM_TOKEN=123456:ABC...
TELEGRAM_CHAT_ID=-1001234567890

DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/ID/TOKEN
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T/B/SECRET
GENERIC_WEBHOOK_URL=https://example.com/hooks/log-guardian
```

## Ortam değişkenleri (Docker / systemd)

| Değişken | Açıklama |
|----------|----------|
| `LOGANALYZER_TELEGRAM_TOKEN` | Bot token |
| `LOGANALYZER_TELEGRAM_CHAT_ID` | Kanal / kullanici ID (virgulle coklu) |
| `LOGANALYZER_TELEGRAM_CHAT_IDS` | `CHAT_ID` ile ayni (alias) |
| `WEBHOOK_TELEGRAM_ROUTE` | `1`=seviye bazli Telegram hedefi (asagiya bak) |
| `LOGANALYZER_TELEGRAM_CHAT_CRIT` | Kanal ID — CRIT alarm, ban, tuzak |
| `LOGANALYZER_TELEGRAM_CHAT_WARN` | DM ID — WARN/INFO alarmlar |
| `WEBHOOK_TELEGRAM_BATCH_SEC` | WARN/INFO ozet penceresi (sn, `0`=kapali) |
| `WEBHOOK_ASYNC` | `1`=async kuyruk (varsayilan), `0`=senkron |
| `WEBHOOK_SILENT_INFO` | `1`=INFO sessiz bildirim (varsayilan) |
| `LOGANALYZER_DISCORD_WEBHOOK_URL` | Discord incoming webhook |
| `LOGANALYZER_SLACK_WEBHOOK_URL` | Slack incoming webhook |
| `LOGANALYZER_GENERIC_WEBHOOK_URL` | `{"text":"..."}` JSON POST |
| `WEBHOOK_DRY_RUN=1` | Ağ göndermez; stderr'e kanal + body önizlemesi |
| `WEBHOOK_TELEGRAM_API_BASE` | Dev only: Telegram API tabanı (mock test) |

## Geliştirme (gerçek URL olmadan)

**Not:** `/etc/log-guardian/rules.conf` içinde `WEBHOOK_ENABLED=0` ise düz `./log-guardian webhook-test` **fail** verir — bu beklenen davranış. Aşağıdaki yöntemlerden birini kullanın.

Tek komut (dry-run, env override):

```bash
bash scripts/webhook_test_cli.sh alert
bash scripts/webhook_test_cli.sh ban
bash scripts/webhook_test_cli.sh trap
```

Yerel mock listener — Discord embed + Slack + Telegram + generic POST doğrulanır:

```bash
bash scripts/webhook_dev.sh
```

Dry-run (yapılandırma + mesaj gövdesi önizleme):

```bash
WEBHOOK_ENABLED=1 WEBHOOK_DRY_RUN=1 \
  LOGANALYZER_DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/FAKE/FAKE" \
  ./log-guardian webhook-test alert
```

(`WEBHOOK_ENABLED=1` env, rules.conf'taki `WEBHOOK_ENABLED=0` üzerine yazar.)

Tam smoke (dry-run + mock HTTP):

```bash
bash scripts/webhook_smoke_test.sh
bash scripts/webhook_ban_e2e.sh   # saldiri log -> ban webhook
bash scripts/sprint_b.sh          # Sprint B paketi
```

## Yerel doğrulama (VM öncesi)

```bash
bash scripts/webhook_smoke_test.sh
WEBHOOK_DRY_RUN=1 ./log-guardian --status | jq .notifications
```

## Sanal makinede gerçek test

1. Discord: Kanal → Entegrasyonlar → Webhook oluştur → URL'yi kopyala.
2. Telegram: `@BotFather` → token; `@userinfobot` veya kanal ID.
3. `rules.conf` veya env ile URL'leri gir, `WEBHOOK_ENABLED=1`.
4. `WEBHOOK_DRY_RUN` **kapat** (unset veya `0`).
5. Test mesajı:

```bash
./log-guardian webhook-test alert --rules /etc/log-guardian/rules.conf
```

6. Saldırı logu ile tetikle:

```bash
./log-guardian test_attack.log --rules rules.conf --json
```

Ban bildirimi için otomatik ban + webhook açık olmalı.

Prod şablon: `deploy/webhook.env.example` · `examples/webhook.rules.snippet`

## Mesaj formatları

| Kanal | Format |
|-------|--------|
| Telegram | HTML (`<b>`, `<code>`), CRIT/WARN sesli, INFO sessiz |
| Discord | Embed (renk: INFO mavi, WARN turuncu, CRIT kırmızı) |
| Slack / Generic | Düz metin JSON `{"text":"..."}` |

Mesajlarda: hostname, IP, MITRE, `incident_id`, ban sebebi. Prometheus: `loganalyzer_webhook_*` — sayaclar `/var/lib/log-guardian/webhook.metrics` dosyasinda kalici (CLI `webhook-test` + servis ayni dosyayi paylasir).

## Telegram seviye yonlendirme (P2, opsiyonel)

Varsayilan: `LOGANALYZER_TELEGRAM_CHAT_ID` ile tum mesajlar ayni hedeflere gider (kanal+DM virgulle).

`WEBHOOK_TELEGRAM_ROUTE=1` ile:

| Mesaj | Hedef |
|-------|-------|
| CRIT alarm, ban, tuzak | `LOGANALYZER_TELEGRAM_CHAT_CRIT` (kanal) |
| WARN / INFO alarm | `LOGANALYZER_TELEGRAM_CHAT_WARN` (DM) |

Ornek prod (`/etc/log-guardian/webhook.env`):

```bash
WEBHOOK_TELEGRAM_ROUTE=1
LOGANALYZER_TELEGRAM_CHAT_CRIT=-1001234567890
LOGANALYZER_TELEGRAM_CHAT_WARN=123456789
# LOGANALYZER_TELEGRAM_CHAT_ID satirini kaldirin veya yorumlayin
```

CRIT/WARN listesi bos kalirsa `CHAT_ID` fallback kullanilir. Bot komutlari ve inline Ack, uc listedeki chat_id'lerde calisir.

**Onerilen prod:**

```bash
WEBHOOK_TELEGRAM_ROUTE=1
LOGANALYZER_TELEGRAM_CHAT_CRIT=-1001234567890
LOGANALYZER_TELEGRAM_CHAT_WARN=123456789
WEBHOOK_TELEGRAM_BATCH_SEC=10
# LOGANALYZER_TELEGRAM_CHAT_ID=...   # route acikken kaldirin
```

## Telegram ozet batch (P2)

`WEBHOOK_TELEGRAM_BATCH_SEC=10` ile WARN/INFO alarmlar pencere icinde tek mesajda birlestirilir:

```
⚠️ UYARI OZETI (10s · 5 olay)
Host: sunucu-adiniz
• 203.0.113.1 x3 — SQLi ...
• 198.51.100.2 x2 — brute ...
```

- CRIT alarm, ban ve tuzak **hemen** gider; batch'i otomatik bosaltir
- `webhook-test` batch'i atlar (anlik dogrulama)
- `0` veya unset = kapali (varsayilan)

**Prod E2E (route + saldiri logu):**

```bash
sudo bash scripts/webhook_prod_e2e.sh
sudo bash scripts/webhook_nginx_eps_smoke.sh   # nginx tail -> EPS/lines
```

**Grafana:** `Telegram route (P2)` satiri — `loganalyzer_webhook_telegram_route`, `_batch_sec`. Alert import icin `GRAFANA_URL` (varsayilan `:3002`) ve `admin/admin` — `bash scripts/grafana_provision.sh`.

## Telegram bot (opsiyonel)

`WEBHOOK_TELEGRAM_BOT=1` ile:

- **Inline buton:** WARN/CRIT alarmlar + ban + tuzak mesajlarinda `✅ Gördüm` — onay `telegram_acks` tablosuna yazilir
- **Komutlar** yalnizca **bot DM** (pozitif chat_id, or. `123456789`):
  - `/status` — EPS, ban, webhook metrikleri
  - `/bans` — ipset block listesi (ilk 8)
  - `/last` — son alarmlar (`events.db`)
  - `/ping` — saglik
  - `/help` — komut listesi
- **Kanal** (`-100...`): sadece alarm + inline buton; `/start` ve komutlar kanalda yanit vermez
- **CLI `--status` / `webhook-test`:** `/etc/log-guardian/webhook.env` otomatik okunur (token icin env source gerekmez)

Grafana: dashboard **Telegram / Webhook** satiri + alert `lg-webhook-fail`, `lg-webhook-queue-drop`.

## Sorun giderme

- `--status` içinde `"notifications":{"destinations":N}` — en az 1 kanal gerekir.
- `webhook-test` JSON: `"ok"` / `"fail"` — kanal başına gönderim sayısı (çoklu chat_id → ok chat sayısı kadar).
- **Text file busy** (`cp` başarısız): servis çalışırken binary değişmez. Çözüm:
  ```bash
  sudo bash scripts/upgrade_log_guardian_binary.sh
  sudo bash scripts/webhook_install_prod.sh --test-all
  ```
- Eski mesaj formatı (`*UYARI*`, Sebep yok): `/usr/local/bin/log-guardian` güncellenmemiş.
- `curl .../metrics | grep webhook` boş: yeni binary + servis restart; metrikler **çalışan servisin** gönderimlerinden dolar.
- HTTP 4xx/5xx artık hata sayılır (sadece curl OK yetmez).
- Ardışık hata sonrası exponential mute (max 8 sn); log: `[WEBHOOK]`.
- CLI: `--no-webhook` ile tek seferlik kapatma.
