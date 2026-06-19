# Webhook bildirimleri (Telegram)

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
| `WEBHOOK_OPERATOR_MUTE_SEC` | `3600` | Inline **Sessiz** — IP bazli Telegram susturma (sn) |
| `WEBHOOK_ASYNC` | `1` | Arka plan kuyrugu (log isleme bloklanmaz) |
| `WEBHOOK_SILENT_INFO` | `1` | INFO sessiz, WARN/CRIT sesli |
| `WEBHOOK_DRY_RUN` | `0` | Gercek Telegram gonderimi |
| `LOGANALYZER_TELEGRAM_CHAT_ID` | `-100...,123456789` | Virgulle coklu hedef (kanal+DM) |

Ban bildirimleri `min_level` filtresinden gecmez — her ban Telegram'a gider (sebep metni dahil).

## Yerel sır dosyası (GitHub'a commit etmeyin)

VPS yokken gerçek Telegram token/chat ID'lerini yalnızca yerelde tutun:

```bash
cp deploy/webhook.local.env.example .env.webhook.local
# URL/token doldur (en az bir kanal)
bash scripts/webhook_apply_local.sh
bash scripts/webhook_apply_local.sh --test alert
```

- `.env.webhook.local` → `.gitignore` (`.env.*`)
- Üretilen: `.cache/webhook.local.env`, `.cache/webhook.local.rules.conf`
- GitHub öncesi: `rm -f .env.webhook.local .cache/webhook.local.env`

## Hızlı yapılandırma

**Prod (önerilen):** token’lar `/etc/log-guardian/webhook.env` — `sudo bash scripts/webhook_install_prod.sh`  
**Laptop:** `.env.webhook.local` — `bash scripts/webhook_apply_local.sh` (Git’e commit etmeyin)

`rules.conf` içinde yalnızca bayraklar:

```ini
WEBHOOK_ENABLED=1
WEBHOOK_MIN_LEVEL=2
WEBHOOK_COOLDOWN_SEC=60
```

Token/chat ID **ortam değişkeni** (aşağıdaki tablo) — `TELEGRAM_TOKEN` alan adı legacy; prod’da `LOGANALYZER_TELEGRAM_*` kullanın.

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
| `WEBHOOK_TELEGRAM_TOPIC_WAF` | Forum `#waf` `message_thread_id` (0=kapali) |
| `WEBHOOK_TELEGRAM_TOPIC_BAN` | Forum `#ban` thread_id |
| `WEBHOOK_TELEGRAM_TOPIC_TRAP` | Forum `#trap` thread_id |
| `WEBHOOK_TELEGRAM_TOPIC_WARN` | Forum `#uyari` thread_id — WARN mirror |
| `WEBHOOK_TELEGRAM_MIRROR_WARN` | `1`=WARN hem DM hem Ops `#uyari` (topic set ise varsayilan acik) |
| `WEBHOOK_DASHBOARD_BASE_URL` | Dashboard deep-link kok (`http://host:3000`) |
| `WEBHOOK_TELEGRAM_RICH_CARD` | `1`=URL buton + deep-link |
| `WEBHOOK_TELEGRAM_DISABLE_PREVIEW` | `1`=link onizleme kapali (varsayilan acik) |
| `WEBHOOK_TELEGRAM_REPLY_CHAIN` | `1`=ayni IP alarmi `reply_to` zinciri |
| `WEBHOOK_TELEGRAM_REPLY_CHAIN_SEC` | Anchor TTL (sn, varsayilan `86400`) |
| `WEBHOOK_TELEGRAM_GEOIP` | `1`=alarm/ban mesajinda ulke satiri (bayrak + kod, ip-api.com) |
| `WEBHOOK_TELEGRAM_PIN_CRIT` | `1`=KRITIK alarm mesajini Ops grubunda otomatik pin |
| `WEBHOOK_TELEGRAM_CARD_PHOTO_URL` | Opsiyonel Telegram `sendPhoto` gorseli |
| `WEBHOOK_TELEGRAM_WEBHOOK_URL` | `setWebhook` HTTPS URL (long-poll yerine) |
| `WEBHOOK_TELEGRAM_WEBHOOK_SECRET` | Opsiyonel `X-Telegram-Bot-Api-Secret-Token` |
| `WEBHOOK_DAILY_SUMMARY` | Gunluk ozet saati (`08:00`, bos=kapali) — operator DM + CRIT kanal |
| `WEBHOOK_WEEKLY_SUMMARY` | Haftalik ozet (`Sun:20:00` / `Pazar:20:00`, bos=kapali) |
| `WEBHOOK_ASYNC` | `1`=async kuyruk (varsayilan), `0`=senkron |
| `WEBHOOK_SILENT_INFO` | `1`=INFO sessiz bildirim (varsayilan) |
| `LOGANALYZER_GENERIC_WEBHOOK_URL` | `{"text":"..."}` JSON POST (opsiyonel) |
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

Yerel mock listener — Telegram + generic POST doğrulanır:

```bash
bash scripts/webhook_dev.sh
```

Dry-run (yapılandırma + mesaj gövdesi önizleme):

```bash
WEBHOOK_ENABLED=1 WEBHOOK_DRY_RUN=1 \
  LOGANALYZER_TELEGRAM_TOKEN="FAKE:TOKEN" \
  LOGANALYZER_TELEGRAM_CHAT_ID="-1001" \
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

1. Telegram: `@BotFather` → token; `@userinfobot` veya kanal ID.
2. `rules.conf` veya env ile token/chat ID gir, `WEBHOOK_ENABLED=1`.
3. `WEBHOOK_DRY_RUN` **kapat** (unset veya `0`).
4. Test mesajı:

```bash
./log-guardian webhook-test alert --rules /etc/log-guardian/rules.conf
```

5. Saldırı logu ile tetikle:

```bash
./log-guardian test_attack.log --rules rules.conf --json
```

Ban bildirimi için otomatik ban + webhook açık olmalı.

Prod şablon: `deploy/webhook.env.example` · `examples/webhook.rules.snippet`

## Mesaj formatları

| Kanal | Format |
|-------|--------|
| Telegram | HTML (`<b>`, `<code>`), CRIT/WARN sesli, INFO sessiz |
| Generic | Düz metin JSON `{"text":"..."}` (opsiyonel) |

Mesajlarda: hostname, IP, MITRE, `incident_id`, ban sebebi. Prometheus: `loganalyzer_webhook_*` — sayaclar `/var/lib/log-guardian/webhook.metrics` dosyasinda kalici (CLI `webhook-test` + servis ayni dosyayi paylasir).

**Fail sayaci sifirlama** (token/chat duzeltmesi sonrasi Grafana `increase()` stale alarm onleme):

```bash
sudo log-guardian webhook-metrics-reset --rules /etc/log-guardian/rules.conf
# (eski sira da calisir: --rules ... webhook-metrics-reset)
# veya: sudo bash scripts/webhook_metrics_reset.sh
# tum sayaclar: webhook-metrics-reset --all
```

Varsayilan yalnizca `fail` sifirlanir; `sent` / `drops` korunur.

## Telegram seviye yonlendirme

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

## Telegram forum topic (P2 — #waf / #ban / #trap / #uyari)

Supergroup'ta **Topics** acik kanalda mesajlari konuya ayirir (`message_thread_id`).

| Mesaj | Topic env | Ornek konu |
|-------|-----------|------------|
| WAF / CRIT alarm (kanal) | `WEBHOOK_TELEGRAM_TOPIC_WAF` | `#waf` |
| IP ban | `WEBHOOK_TELEGRAM_TOPIC_BAN` | `#ban` |
| Tuzak erisimi | `WEBHOOK_TELEGRAM_TOPIC_TRAP` | `#trap` |
| WARN alarm (Ops mirror) | `WEBHOOK_TELEGRAM_TOPIC_WARN` | `#uyari` |

WARN alarmlar varsayilan olarak operator DM'e gider. `WEBHOOK_TELEGRAM_TOPIC_WARN` set edildiginde ayni mesaj **Ops grubunda `#uyari` konusuna da** gider (cift bildirim). Topic yalnizca `LOGANALYZER_TELEGRAM_CHAT_CRIT` hedefine yazilir.

**thread_id bulma:**

1. Kanalda Topics ac; `#waf`, `#ban`, `#trap`, `#uyari` olustur.
2. Her konuya bir test mesaji yaz.
3. Bot `@RawDataBot` veya `getUpdates` ile `message_thread_id` oku (her konunun ID'si farklidir).

Ornek (`/etc/log-guardian/webhook.env`):

```bash
WEBHOOK_TELEGRAM_TOPIC_WAF=12
WEBHOOK_TELEGRAM_TOPIC_BAN=14
WEBHOOK_TELEGRAM_TOPIC_TRAP=16
WEBHOOK_TELEGRAM_TOPIC_WARN=18
WEBHOOK_TELEGRAM_MIRROR_WARN=1
```

`rules.conf` alias: `TELEGRAM_TOPIC_WAF=12` (aynisi BAN/TRAP/WARN icin).

Dogrulama: Telegram `/status` → `Topics: waf=12 ban=14 trap=16 warn=18` satiri.

Test:

```bash
sudo bash -c '
  set -a; source /etc/log-guardian/webhook.env; set +a
  export WEBHOOK_ENABLED=1 WEBHOOK_DRY_RUN=0
  log-guardian webhook-test ban --rules /etc/log-guardian/rules.conf
'
# Kanalda #ban konusunda gorunmeli
```

## Rich card + deep-link (#14)

| Degisken | Ornek |
|----------|-------|
| `WEBHOOK_DASHBOARD_BASE_URL` | `http://127.0.0.1:3000` |
| `WEBHOOK_TELEGRAM_RICH_CARD` | `1` |
| `WEBHOOK_TELEGRAM_CARD_PHOTO_URL` | opsiyonel PNG/JPG URL |

Deep-link: alarm `{base}/incidents/INC-…` · ban `{base}/?ip=…` · tuzak `{base}/?view=traps`

Mesajda **→ Dashboard** linki + inline **📊 Dashboard** URL butonu. `/status` → `Rich: ON (http://…)` · `Preview: OFF`.

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

## Gunluk ozet (#10)

Operator DM'e son 24 saatin tek mesaj ozeti (alarm/ban/tuzak/ack/webhook).

```bash
# rules.conf veya webhook.env
WEBHOOK_DAILY_SUMMARY=08:00
```

- Daemon icinde her dakika kontrol; ayni gun tekrar gondermez (`/var/lib/log-guardian/daily_summary.last`)
- Manuel veya cron: `./log-guardian daily-summary` · test: `daily-summary --force`
- Hedef: WARN chat (operator DM), yoksa ilk tanimli chat

Ornek mesaj:

```
📊 Günlük Özet (son 24s)
Alarm: 12 (KRİT 2 · UYARI 8 · BİLGİ 2)
Ban: 5 yeni · 42 aktif
Telegram ack: 3 · unacked: 7
Webhook: 45 gonderim · 0 hata
```

## Haftalik ozet (#28)

Operator DM + CRIT kanala son **7 gun** tek mesaj ozeti.

```bash
WEBHOOK_WEEKLY_SUMMARY=Sun:20:00
# veya Turkce:
WEBHOOK_WEEKLY_SUMMARY=Pazar:20:00
```

- Daemon her dakika kontrol; ayni ISO haftada tekrar gondermez (`/var/lib/log-guardian/weekly_summary.last`)
- Manuel: `log-guardian weekly-summary` · test: `weekly-summary --force`
- Gun adlari: `Sun`/`Pazar`/`Paz`, `Mon`/`Pzt`, … veya `0`–`6` (0=Pazar)

Ornek mesaj:

```
📈 Haftalık Özet (son 7 gün)
Alarm: 84 (Krit 12 · Uyari 58 · Bilgi 14)
Ban: 23 yeni · 42 aktif
Tuzak: 3
Ack: 18 · unacked: 4
```

## Sessiz saatler (P1)

`WEBHOOK_QUIET_HOURS=23:00-08:00` (yerel saat; gece yarisi sarmal aralik desteklenir):

| Mesaj | Sessiz saatte |
|-------|----------------|
| WARN/INFO | Batch ozet → DM (degismedi) |
| CRIT alarm | Yalnizca DM, sessiz bildirim |
| Ban | Kanal susar → DM (sessiz) |
| Tuzak | **Kanal** — her zaman gider |
| Generic webhook | Etkilenmez |

`/status`: `Quiet: ACTIVE (23:00-08:00)` veya `Quiet: off (...)`.

```bash
WEBHOOK_QUIET_HOURS=23:00-08:00
```

Ayni `INC-…` 60 sn icinde tek Telegram alarmi (incident dedup; test modu haric).

**Prod E2E (route + saldiri logu):**

```bash
sudo bash scripts/webhook_prod_e2e.sh
sudo bash scripts/webhook_nginx_eps_smoke.sh   # nginx tail -> EPS/lines
```

**Grafana:** `Telegram route` satiri — `loganalyzer_webhook_telegram_route`, `_batch_sec`. Alert import: `GRAFANA_URL` (varsayilan `:3002`) — `bash scripts/grafana_provision.sh`.

## Telegram bot komutları

`WEBHOOK_TELEGRAM_BOT=1` ile:

- **Inline buton:** WARN/CRIT alarmlar + ban + tuzak mesajlarinda `✅ Gördüm` — onay `telegram_acks` tablosuna yazilir
- **Komutlar** yalnizca **bot DM** (pozitif chat_id, or. `123456789`):
  - `/status` — EPS, ban, webhook metrikleri, Ack/Unacked (24h)
  - `/bans` — ipset block listesi (ilk 8)
  - `/last` — son alarmlar (`events.db`)
  - `/unacked` — onay bekleyen alarmlar/banlar (24h)
  - `/incident INC-…` — tek incident ozeti + ban + onay durumu
  - `/ping` — saglik
  - `/help` — komut listesi
- **Kanal** (`-100...`): sadece alarm + inline buton; `/start` ve komutlar kanalda yanit vermez
- **CLI `--status` / `webhook-test`:** `/etc/log-guardian/webhook.env` otomatik okunur (token icin env source gerekmez)

### Webhook modu (setWebhook, #15)

Long-poll yerine Telegram'in POST ettigi HTTPS endpoint. `/status` → `Bot: WEBHOOK`.

```bash
# webhook.env
WEBHOOK_TELEGRAM_BOT=1
WEBHOOK_TELEGRAM_WEBHOOK_URL=https://your.domain/telegram/webhook
WEBHOOK_TELEGRAM_WEBHOOK_SECRET=uzun-rastgele-dize   # onerilir
```

1. `rules.conf`: `API_PORT=8090` (varsayilan)
2. nginx TLS snippet kur:
   ```bash
   sudo bash scripts/install_nginx_telegram_webhook.sh
   # HTTPS server {} icine: include snippets/log-guardian-telegram-webhook.conf;
   sudo nginx -t && sudo systemctl reload nginx
   ```
   **Not:** `examples/nginx/...conf` dosyasini `bash` ile calistirmayin — nginx `include` eder.
3. `sudo systemctl restart log-guardian` — API ayaga kalkinca `setWebhook` otomatik
4. Dogrulama: `sudo bash scripts/telegram_webhook_register.sh --check`

Yerel test (long-poll): `WEBHOOK_TELEGRAM_WEBHOOK_URL` bos birak — mevcut davranis (`Bot: POLL`).

**Laptop (VPS yok) — gecici HTTPS tunnel:**

```bash
bash scripts/install_cloudflared.sh   # Mint: apt'te yok, GitHub binary veya Cloudflare repo
bash scripts/telegram_webhook_tunnel_dev.sh --register
# Bot DM → /status → Bot: WEBHOOK
bash scripts/telegram_webhook_tunnel_dev.sh --check   # API + tunnel + getWebhookInfo
bash scripts/telegram_webhook_tunnel_dev.sh --stop   # tunnel + deleteWebhook → POLL
```

`trycloudflare.com` URL her oturumda degisir; kalici prod icin nginx + domain gerekir.

**Sorun giderme:** `--register` FAIL ama `.cache/cloudflared-telegram.log` icinde URL varsa tünel ayaktadir; `--check` ile dogrulayip `--register` tekrar deneyin (`--stop` gerekmez).

### GeoIP satiri (#23)

```bash
WEBHOOK_TELEGRAM_GEOIP=1
```

- Gercek public IP → `ip-api.com` ile ulke kodu + bayrak (or. `🇹🇷 TR`, `🇩🇪 DE`)
- RFC 5737 test IP (`203.0.113.x`, `webhook-test`) → ulke satiri **yok** (yanlis bayrak gostermez)
- LAN/private → `🏠 LAN`
- Ozel sablon: `{geo}` (bayrak+kod), `{country}` (yalnizca kod)
- Dis IP icin `ip-api.com` (2 sn timeout, 24h bellek cache); `GEOIP_LOOKUP_URL` ile override
- `/status` → `GeoIP: ON`

### CRIT pin (#25)

```bash
WEBHOOK_TELEGRAM_PIN_CRIT=1
```

- Yalnizca **KRITIK alarm** (`ALERT_CRIT`) — ban/tuzak pinlenmez
- Hedef: `LOGANALYZER_TELEGRAM_CHAT_CRIT` (Ops supergroup, `#waf` topic)
- Bot **Pin Messages** yetkisi gerekir
- Test: `log-guardian webhook-test crit`
- `/status` → `Pin CRIT: ON`

### URL onizleme kapali (#24)

```bash
WEBHOOK_TELEGRAM_DISABLE_PREVIEW=1   # varsayilan — unset bile acik
```

- Tum Telegram `sendMessage` / `sendPhoto` (alarm, ban, batch, gunluk ozet, bot `/status`)
- Dashboard linki metinde kalir; Telegram buyuk onizleme karti gostermez
- Kapatmak icin: `WEBHOOK_TELEGRAM_DISABLE_PREVIEW=0`
- `/status` → `Preview: OFF`

### Reply zinciri (#29)

```bash
WEBHOOK_TELEGRAM_REPLY_CHAIN=1
WEBHOOK_TELEGRAM_REPLY_CHAIN_SEC=86400
```

- Ayni IP icin ikinci+ alarm → onceki mesaja `reply_to_message_id` (DM, `#waf`, `#warn` ayri zincir)
- Anchor kalici: `/var/lib/log-guardian/telegram_reply.chain` (servis restart + ayri CLI test)
- Ban/tuzak/ozet mesajlari zincire dahil degil
- Test: `webhook-test crit-chain` (aynı process'te 2 mesaj) veya iki kez `webhook-test crit`
- `/status` → `Reply chain: ON (86400s)`

### Grafana vs LG ayri chat (#30)

- **Grafana alertleri:** Grafana UI → Contact point (ayri Telegram bot/kanal)
- **Log Guardian ops:** `LOGANALYZER_TELEGRAM_CHAT_CRIT/WARN` + forum topic'ler
- Karistirmamak icin Grafana'ya LG Ops grubunu vermeyin; LG kendi rota env'ini kullanir

### Coklu operator ack (#27)

- `Gördüm` → mesaj altina `✅ Gördü: Ali, Veli` eklenir (`editMessageText`)
- Ayni operator tekrar tiklarsa: `Zaten onayladiniz`
- Sessiz/WL/Unban tiklaninca butonlar kaldirilir (onceki davranis)
- `telegram_acks.operator_id` + `operator_name` kolonlari

### DRY-RUN / TEST rozeti (#26)

- `webhook-test alert|ban|trap|crit` → Telegram basliginda **`[TEST]`** (canli gonderimde bile)
- `WEBHOOK_DRY_RUN=1` → mesaj basliginda **`[DRY-RUN]`** (+ ag gonderilmez, stderr onizleme)
- Ikisi birlikte: `[DRY-RUN] [TEST] …`

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

## Telegram ozellik listesi (tamamlandi — 2026-06)

Asagidaki tablolar **referans**; yeni kurulum icin yukaridaki **Prod kurulum** ve **Yerel sır dosyası** bolumlerini kullanin.

### Hizli kazanimlar (1–2 gun)

| # | Ozellik | Durum | Not |
|---|---------|-------|-----|
| 1 | Ack → `events.db` / incident | **DONE** | `telegram_acks`, inline `Gordum`, `lg_telegram_ack()` |
| 2 | Ban mesajina risk + karar | **DONE** | `webhook_send_ban(..., risk_score, policy)` |
| 3 | `--status` otomatik env | **DONE** | `/etc/log-guardian/webhook.env` CLI’da otomatik |
| 4 | `/last` + incident ozeti | **DONE** | `/last`, `/incident INC-…`, `/unacked` |
| 5 | Turkce UTF-8 tutarlilik | **DONE** | KRİTİK, ÖZET, tuzak metinleri UTF-8 |
| 6 | `upgrade_log_guardian_binary.sh` metrik WARN | **DONE** | `:9091/metrics` 5×2s retry veya `strings` |

### Orta vade (1 sprint) — spam ve rota

| # | Ozellik | Durum | Not |
|---|---------|-------|-----|
| 7 | Seviye bazli rota CRIT/WARN | **DONE** | `WEBHOOK_TELEGRAM_ROUTE=1`, prod dogrulandi |
| 8 | Batch ozet (10 sn) | **DONE** | `WEBHOOK_TELEGRAM_BATCH_SEC=10` |
| 9 | Mesaj sablonu `rules.conf` | **DONE** | `WEBHOOK_TELEGRAM_ALERT_FMT` — `{level}{host}{ip}{geo}{country}{time}{message}{mitre}{incident}{nl}` |
| 10 | Gunluk ozet (cron/timer) | **DONE** | `WEBHOOK_DAILY_SUMMARY=08:00` + `daily-summary` CLI |
| 11 | Forum topic (`message_thread_id`) | **DONE** | `#waf` / `#ban` / `#trap` / `#warn` — CRIT kanal + WARN mirror |

### Ileri seviye (Pro)

| # | Ozellik | Durum | Not |
|---|---------|-------|-----|
| 12 | Ek inline: sessiz / whitelist / unban | **DONE** | `mute:` / `wl:` / `ub:` + IPC unban |
| 13 | Ack → Grafana paneli | **DONE** | `telegram_ack/unacked_24h`, quiet panelleri |
| 14 | Rich card / deep-link | **DONE** | `WEBHOOK_TELEGRAM_RICH_CARD`, `/incidents/INC-…`, Dashboard butonu |
| 15 | `setWebhook` HTTPS endpoint | **DONE** | `WEBHOOK_TELEGRAM_WEBHOOK_URL`, nginx → `POST /telegram/webhook` |

**Telegram yol haritasi (1–32) tamamlandi.** Ops: `WEBHOOK_WEEKLY_SUMMARY` kalici env, istege bagli `setWebhook` nginx.

### Ek fikirler (yol haritasina eklendi)

| # | Ozellik | Oncelik | Aciklama |
|---|---------|---------|----------|
| 16 | Sessiz saatler | **DONE** | `WEBHOOK_QUIET_HOURS=23:00-08:00` — kanal susar, tuzak haric |
| 17 | Incident dedup | **DONE** | Ayni `INC-…` 60 sn icinde tek Telegram mesaji |
| 18 | Ack mesaj edit | **DONE** | `Gordum` → `editMessageReplyMarkup` (metin korunur, buton kaldirilir) |
| 19 | `/unacked` + `/status` ack sayaci | **DONE** | `/status` Ack+Unacked; `/unacked` son 24h |
| 20 | `/incident INC-…` | **DONE** | alerts + ban + onay durumu |
| 21 | Grafana EPS gurultu filtresi | **DONE** | `lines_total > 100` iken EPS dusuk uyar (alert expr) |
| 22 | Webhook fail operator ping | **DONE** | 3 ard arda Telegram fail → tek operator DM |
| 23 | GeoIP satiri | **DONE** | `WEBHOOK_TELEGRAM_GEOIP=1`, `{geo}` / `{country}`, ip-api cache |
| 24 | `disable_web_page_preview` | **DONE** | `WEBHOOK_TELEGRAM_DISABLE_PREVIEW=1` (varsayilan), tum sendMessage/sendPhoto |
| 25 | CRIT kanal pin | **DONE** | `WEBHOOK_TELEGRAM_PIN_CRIT=1`, `webhook-test crit` → `#waf` pin |
| 26 | `[DRY-RUN]` / `[TEST]` rozeti | **DONE** | `webhook-test` → `[TEST]`; `WEBHOOK_DRY_RUN=1` → `[DRY-RUN]` baslik |
| 27 | Coklu operator ack | **DONE** | `Gördü: Ali, Veli` — butonlar kalir, `editMessageText` |
| 28 | Haftalik saglik ozeti | **DONE** | `WEBHOOK_WEEKLY_SUMMARY=Sun:20:00`, `weekly-summary` CLI |
| 29 | `reply_to` zinciri | **DONE** | `WEBHOOK_TELEGRAM_REPLY_CHAIN=1`, chat+topic+IP anchor 24h |
| 30 | Grafana vs LG ayri chat | **DONE** | Policy: Grafana contact point ayri; LG `LOGANALYZER_TELEGRAM_*` |
| 31 | `setWebhook` + nginx TLS | **DONE** | Kod + nginx snippet; prod: `telegram_webhook_register.sh` |
| 32 | Inline: 1s sessiz / whitelist | **DONE** | `WEBHOOK_OPERATOR_MUTE_SEC`, inline `wl:` / `ub:` |
