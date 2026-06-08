# TLS + Production Deploy

Dashboard'u internete acmadan once **HTTPS zorunlu**. Iki yol:

## 1. Docker + Caddy (onerilen)

```bash
export JWT_SECRET=$(openssl rand -hex 32)
export DOMAIN=dashboard.example.com    # veya localhost (self-signed)
export ACME_EMAIL=ops@example.com

bash scripts/tls_proxy_up.sh
# veya: bash scripts/quickstart-docker.sh prod
```

Dogrulama:

```bash
bash scripts/tls_proxy_test.sh
curl -k https://localhost/api/tier
```

Stack: `docker-compose.prod.yml` — dashboard yalnizca internal network; disarida **80/443** (Caddy).

| Degisken | Aciklama |
|----------|----------|
| `JWT_SECRET` | Zorunlu, min 32 karakter |
| `DOMAIN` | Let's Encrypt domain veya `localhost` |
| `LOG_GUARDIAN_TIER` | `pro` / `enterprise` |
| `HTTP_PORT` / `HTTPS_PORT` | Varsayilan **8080/8443** (80/443 mesgulse); prod'da 80/443 |

## 2. nginx (host uzerinde)

Sablon: `deploy/nginx-dashboard.conf`

```bash
sudo cp deploy/nginx-dashboard.conf /etc/nginx/sites-available/log-guardian-dashboard
sudo ln -sf /etc/nginx/sites-available/log-guardian-dashboard /etc/nginx/sites-enabled/
sudo certbot certonly --nginx -d dashboard.example.com
sudo nginx -t && sudo systemctl reload nginx
```

Dashboard `127.0.0.1:3000` uzerinde calisir (`npm run build && npm run start`).

## Analyzer + daemon (host)

TLS yalnizca dashboard icin. Analyzer metrikleri **127.0.0.1:9091** — disari acmayin.

Fleet agent telemetry:

```text
SAAS_URL=https://dashboard.example.com/api/telemetry
SAAS_TOKEN=<install.sh veya dashboard API key>
```

## Guvenlik kontrol listesi

- [ ] `JWT_SECRET` rastgele, repoda yok
- [ ] Dashboard port 3000 host'a publish edilmedi (prod compose)
- [ ] HSTS aktif (`tls_proxy_test.sh`)
- [ ] `LOG_GUARDIAN_IPC_TOKEN` `/etc/log-guardian/env` icinde
- [ ] 72s soak: `bash scripts/soak_test.sh` (bkz. `docs/SOAK_TEST.md`)
