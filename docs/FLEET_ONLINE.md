# Fleet agent “Online” gorunurlugu

Dashboard **Filo** ana sayfasi (`/`) ve agent listesinde **Online** gorunmesi icin telemetry akisi gerekir. Eski `/fleet` URL ana sayfaya yonlenir; komut dagitimi: `/fleet/dispatch`.

## 1. Dashboard

```bash
cd dashboard
npx prisma db push
node prisma/seed.mjs
npm run dev
```

Seed token: `sk_guardian_fleet_test_token_123` (`.env` veya `FLEET_API_KEY`).

## 2. Analyzer (rules.conf)

```ini
SAAS_ENABLED=1
SAAS_URL=http://127.0.0.1:3000/api/telemetry
SAAS_TOKEN=sk_guardian_fleet_test_token_123
AGENT_ID=node-istanbul-01
TENANT_ID=default
```

## 3. Canli log

```bash
export LOGANALYZER_PASSWORD='DegistirBeni!123'
./log-guardian test_access.log --no-tui --rules rules.conf --follow
```

~15 sn icinde `/fleet` → `node-istanbul-01` **Online**.

## 4. E2E (dashboard acikken)

```bash
bash scripts/fleet_e2e.sh
```

## Sorun giderme

| Sorun | Cozum |
|-------|--------|
| 401 telemetry | `SAAS_TOKEN` = seed token |
| Agent yok | `node prisma/seed.mjs` |
| Hep Offline | `--follow` veya periyodik log; `SAAS_ENABLED=1` |
| Curl FAIL | `DASH_URL=http://127.0.0.1:3000` |

Tam E2E paketi: `bash scripts/run-all-e2e.sh` (dashboard yoksa fleet atlanir).
