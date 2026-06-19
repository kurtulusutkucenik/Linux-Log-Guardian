# Quick start — Docker (Dashboard)

## Önerilen (TLS + Grafana + JWT kalıcı)

```bash
bash scripts/dashboard_stack.sh
```

Giriş: `https://localhost:8443` — `admin` / `.env` `DASHBOARD_ADMIN_PASSWORD` veya `ChangeMeOnFirstLogin!`

Laptop matris: [LAPTOP_OPS.md](LAPTOP_OPS.md)

## Dev (HTTP, localhost:3000)

```bash
bash scripts/quickstart-docker.sh
cd dashboard && DASHBOARD_SEED=1 node prisma/seed.mjs
```

## Prod TLS (yalnızca dashboard)

```bash
bash scripts/laptop_jwt_setup.sh
export DOMAIN=localhost
bash scripts/tls_proxy_test.sh
```

Detay: [TLS_PRODUCTION.md](TLS_PRODUCTION.md)

## Manuel compose

```bash
bash scripts/laptop_jwt_setup.sh   # JWT -> .env
docker compose -f docker-compose.prod.yml up -d --build
```

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
SOAK_1H=1 bash scripts/laptop_soak_72h.sh --start   # once 1 saat
# bash scripts/laptop_soak_72h.sh --start            # 72 saat
bash scripts/soak_status.sh
```

Kisa test: `SOAK_SHORT=1 bash scripts/soak_test.sh` — [docs/SOAK_TEST.md](SOAK_TEST.md)
