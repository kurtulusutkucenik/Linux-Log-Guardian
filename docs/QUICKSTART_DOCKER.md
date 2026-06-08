# Quick start — Docker (Dashboard)

## Dev (HTTP, localhost:3000)

```bash
export JWT_SECRET=$(openssl rand -hex 32)
bash scripts/quickstart-docker.sh
```

Ilk giris (seed):

```bash
cd dashboard
DASHBOARD_SEED=1 DASHBOARD_ADMIN_PASSWORD='GucluParola!' node prisma/seed.mjs
```

## Prod TLS (Caddy, 443)

```bash
export JWT_SECRET=$(openssl rand -hex 32)
export DOMAIN=localhost   # veya dashboard.example.com
bash scripts/quickstart-docker.sh prod
bash scripts/tls_proxy_test.sh
```

Detay: [docs/TLS_PRODUCTION.md](TLS_PRODUCTION.md)

## Manuel

```bash
export JWT_SECRET=$(openssl rand -hex 32)
docker compose build dashboard
docker compose up dashboard
```

Prod stack: `docker compose -f docker-compose.prod.yml up -d --build`

## Analyzer + daemon (host, `full` profil)

Host'ta nginx log ve BPF gerekir:

```bash
export IFACE=wlo1
export LOGANALYZER_PASSWORD='DegistirBeni!123'
docker compose --profile full up --build
```

## Fleet agent ONLINE

`rules.conf`:

```text
SAAS_ENABLED=1
SAAS_URL=https://dashboard.example.com/api/telemetry
SAAS_TOKEN=<install.sh veya dashboard API key>
AGENT_ID=node-istanbul-01
TENANT_ID=default
```

## 72 saat soak test

```bash
sudo systemctl start log-guardian-daemon log-guardian
bash scripts/soak_start.sh
bash scripts/soak_status.sh
```

Kisa test: `SOAK_SHORT=1 bash scripts/soak_test.sh` — [docs/SOAK_TEST.md](SOAK_TEST.md)
