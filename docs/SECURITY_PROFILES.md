# Güvenlik profilleri — Community vs Production

Linux Log Guardian iki kurulum profili ile gelir. **Demo parolalar bilinçlidir** — topluluk testi için; internete açık sunucuda kullanılmaz.

Detay: [LAPTOP_OPS.md](LAPTOP_OPS.md) · [SECURITY.md](../SECURITY.md)

---

## Profil karşılaştırması

| | **Community / laptop** | **Production / internet-facing** |
|--|------------------------|----------------------------------|
| **Kim** | Geliştirici, lab, VM soak | VPS, public IP, gerçek trafik |
| **Analyzer parola** | `DegistirBeni!123` OK | **Değiştir** — `laptop_harden.sh` |
| **Dashboard giriş** | `ChangeMeOnFirstLogin!` OK | `.env` → güçlü `DASHBOARD_ADMIN_PASSWORD` |
| **API_BIND** | `127.0.0.1` | `127.0.0.1` (nginx consult) |
| **API_TOKEN** | Otomatik (`ensure_api_security.sh`) | Rotate: `rotate_api_token.sh` |
| **Metrics :9091** | Loopback | Loopback + relay (Docker) |
| **Webhook / Telegram** | Fake veya lab token | `/etc/log-guardian/webhook.env` chmod 600 |
| **Doğrulama** | `post_install_verify.sh` WARN kabul | Demo parola → **FAIL** |

---

## Community profil (varsayılan)

```bash
sudo bash install.sh
sudo bash scripts/install_first_run.sh
bash scripts/post_install_verify.sh
```

- Demo parola değiştirmek **zorunlu değil**
- API fail-closed: token yok → 403
- `local_security_audit` demo KDF için WARN verir — laptop için normal

---

## Production profil (VPS / public IP)

Makine internete açıksa (`detect_internet_facing.sh`):

```bash
sudo bash scripts/install_first_run.sh
sudo env LG_NEW_PASSWORD='GucluParola!' bash scripts/laptop_harden.sh
bash scripts/laptop_jwt_setup.sh          # JWT + dashboard parola
bash scripts/rotate_api_token.sh          # isteğe bağlı token yenileme
sudo bash scripts/fix_nginx_inline_consult.sh
bash scripts/post_install_verify.sh       # demo parola FAIL olmamalı
bash scripts/local_security_audit.sh
```

**Zorunlu:**

1. `ACCESS_PASSWORD_KDF` — demo hash değil
2. `API_BIND=127.0.0.1` + firewall 8090
3. nginx inline consult token enjekte (`fix_nginx_inline_consult.sh`)
4. Dashboard JWT güçlü (32+ byte hex)
5. `webhook.env` / `threat-feed.env` → chmod 600, repoda gerçek secret yok

---

## Mimari güvenlik (her iki profil)

| Kontrol | Durum |
|---------|--------|
| API fail-closed | Token yok → ban/consult/metrics 403 |
| IPC SO_PEERCRED | Daemon socket peer doğrulama |
| Ban / consult rate limit | `api_server.c` |
| Metrics loopback | `:9091` dışarıya kapalı |
| Wasm path guard + fuel | İzinsiz `.wasm` yüklenmez |
| Threat feed URL sandbox | `threat_feed.c` |
| Dashboard login rate limit | scrypt parola |

---

## Secret yönetimi (private repo dönemi)

Geliştirme aşamasında Telegram webhook IP/token repoda kalabilir. **GitHub push öncesi:**

- Gerçek token → yalnızca `/etc/log-guardian/webhook.env`
- Repoda → `deploy/webhook.local.env.example` (fake değerler)
- `bash scripts/backup_operator_secrets.sh` — yedek (opsiyonel)

---

## Hızlı kontrol

```bash
bash scripts/detect_internet_facing.sh && echo "PUBLIC" || echo "LAB"
bash scripts/post_install_verify.sh
bash scripts/local_security_audit.sh
bash scripts/laptop_harden_check.sh
```

---

## İlgili komutlar

| Komut | Ne yapar |
|-------|----------|
| `ensure_api_security.sh` | API bind + token + firewall (parolaya dokunmaz) |
| `laptop_harden.sh` | Demo parola değiştir + API + webhook izinleri |
| `rotate_api_token.sh` | API_TOKEN yenile + nginx/dashboard sync |
| `api_fail_closed_test.sh` | Tokensiz 403 kanıtı |
