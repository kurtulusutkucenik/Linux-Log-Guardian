# Güvenlik politikası / Security policy

## Desteklenen sürümler / Supported versions

| Sürüm / Version | Destek / Supported |
|-----------------|-------------------|
| `main` branch | Aktif geliştirme / active development |

## Güvenlik açığı bildirimi / Reporting a vulnerability

**Lütfen güvenlik açıklarını public issue olarak açmayın.**

Please **do not** open public issues for security vulnerabilities.

1. GitHub **Private vulnerability report** (repo → Security → Report) veya
2. Maintainer'a özel iletişim (GitHub profil üzerinden)

Bildirimde ekleyin / Include:

- Etkilenen bileşen (analyzer, daemon, dashboard, IPC)
- Tekrar adımları / reproduction steps
- Etki (RCE, privilege escalation, auth bypass vb.)

Hedef yanıt süresi / Target response: **7 gün** ilk geri dönüş.

## Güvenli kurulum hatırlatmaları / Secure deployment reminders

Log Guardian **self-hosted**’tır. Kurulum kanıtı (recall, EPS, PDF) ≠ prod güvenliği. İlk kurulumda **aynı gün** aşağıdakileri tamamlayın:

### Zorunlu (prod öncesi)

1. **Analyzer parolası** — `/etc/log-guardian/env` → `LOGANALYZER_PASSWORD` ve `rules.conf` → `ACCESS_PASSWORD_KDF`  
   Repo’daki `DegistirBeni!123` ve dokümandaki örnek parolalar **herkese açıktır**.

2. **Laptop / deneme** — demo parola (`DegistirBeni!123`) repoda kalabilir; API ve dashboard için:
   ```bash
   sudo bash scripts/ensure_api_security.sh
   bash scripts/sync_dashboard_api_token.sh
   bash scripts/laptop_jwt_setup.sh
   bash scripts/laptop_harden_check.sh
   ```

3. **İnternete açık sunucu** — parola da dahil tam sertleştirme:
   ```bash
   sudo env LG_NEW_PASSWORD='KENDI_PAROLAN' bash scripts/laptop_harden.sh
   bash scripts/laptop_harden_check.sh
   ```
   `LG_NEW_PASSWORD='x' sudo bash ...` **çalışmaz** — `sudo env` veya `--password` kullanın.

4. **Dashboard** — `bash scripts/laptop_jwt_setup.sh` (JWT `.env`); prod’da güçlü `DASHBOARD_ADMIN_PASSWORD`.

5. **Webhook / Telegram** — token’ları repoya commit etmeyin; `webhook.env` chmod 600.  
   Laptop: **POLL** modu yeterli. Prod: [WEBHOOK_SETUP.md](docs/WEBHOOK_SETUP.md).

6. **API :8090** — `API_BIND=127.0.0.1` + `API_TOKEN`; `ensure_api_security.sh` üretir.  
   Denetim: `bash scripts/local_security_audit.sh`

Script matrisi: [docs/LAPTOP_OPS.md](docs/LAPTOP_OPS.md)

### Önerilen

- Whitelist: ofis / monitoring IP’leri (`WHITELIST_IP`)
- IPC token: `install.sh` üretir — paylaşmayın
- `data-room.zip` / kanıt JSON: gerçek müşteri IP/token koymayın

Detay: [docs/OPERATIONS.md](docs/OPERATIONS.md) · Quickstart: [docs/QUICKSTART_NGINX.md#ilk-kurulum-guvenlik](docs/QUICKSTART_NGINX.md#ilk-kurulum-guvenlik)
