# Internet-facing sertlestirme — geri alma

`apply_internet_facing_hardening.sh` ban/WAF hattina dokunmaz; yine de env ve nginx degisikliklerini geri alabilmek icin bu not.

Ilgili: [SECURITY_PROFILES.md](SECURITY_PROFILES.md) · `scripts/apply_internet_facing_hardening.sh`

---

## Oncesi (zorunlu)

```bash
bash scripts/backup_operator_secrets.sh
sudo cp /etc/log-guardian/env /etc/log-guardian/env.bak.$(date +%Y%m%d) 2>/dev/null || true
sudo cp /etc/log-guardian/rules.conf /etc/log-guardian/rules.conf.bak.$(date +%Y%m%d) 2>/dev/null || true
```

---

## Geri alinan ayarlar

| Degisiklik | Dosya | Geri alma |
|------------|-------|-----------|
| `WASM_PROD_STRICT=1` | `/etc/log-guardian/env` | `WASM_PROD_STRICT=0` veya satiri sil |
| Dashboard firewall (Caddy) | `ufw`/`nft` | `sudo ufw delete allow 8443/tcp` (kuruluma gore) |
| nginx rate limit snippet | `/etc/nginx/snippets/` | Eklenen `include` satirini kaldir |
| Demo parola FAIL | `rules.conf` KDF | `laptop_harden.sh` oncesi `.bak` dosyasini geri yukle |

---

## Tam geri alma (env + rules)

```bash
sudo cp /etc/log-guardian/env.bak.YYYYMMDD /etc/log-guardian/env
sudo cp /etc/log-guardian/rules.conf.bak.YYYYMMDD /etc/log-guardian/rules.conf
sudo systemctl restart log-guardian log-guardian-daemon
sudo nginx -t && sudo systemctl reload nginx
bash scripts/post_install_verify.sh
```

---

## SOAR / mTLS geri alma

```bash
sudo bash scripts/disable_enterprise_soar_api.sh
docker compose -f docker-compose.prod.yml restart caddy
```

---

## Dogrulama

```bash
bash scripts/local_security_audit.sh
bash scripts/post_install_verify.sh
sudo log-guardian --health
```

Community laptop profiline donmek icin `detect_internet_facing` false olmali veya lab makinesinde calistirin.
