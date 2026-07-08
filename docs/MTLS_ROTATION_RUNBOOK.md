# mTLS sertifika rotasyonu — Enterprise SOAR ban API

**Kapsam:** Caddy edge (`:9443`) + istemci sertifikasi. Loopback `127.0.0.1:8090` degismez.

Ilgili: [BAN_API_MTLS_DESIGN.md](BAN_API_MTLS_DESIGN.md) · `scripts/caddy_mtls_setup.sh` · `scripts/mtls_client_issue.sh`

---

## Ne zaman

| Olay | Aksiyon |
|------|---------|
| Istemci cert suresi < 30 gun | Yeni client cert uret, SOAR'a dagit |
| CA rotasyonu (yillik) | Yeni CA + server cert + tum client'lar |
| Sizinti suphesi | `API_MUTATION_TOKEN` + client cert iptal |

---

## Hizli durum

```bash
bash scripts/caddy_mtls_status_export.sh
cat caddy-mtls-status.json | jq .
bash scripts/enterprise_soar_gate.sh
```

---

## Istemci cert yenileme (lab / laptop)

```bash
# 1. Yeni istemci sertifikasi
bash scripts/mtls_client_issue.sh --cn soar-client-02

# 2. Caddy reload (server cert degismediyse yeterli)
docker compose -f docker-compose.prod.yml exec caddy caddy reload --config /etc/caddy/Caddyfile

# 3. E2E
bash scripts/ban_api_mtls_e2e.sh
bash scripts/caddy_api_mtls_e2e.sh

# 4. Eski client.crt'yi SOAR'dan kaldir
```

---

## Server cert yenileme

```bash
bash scripts/caddy_mtls_setup.sh   # deploy/mtls/ yeniden uretir (lab CA)
docker compose -f docker-compose.prod.yml restart caddy
bash scripts/caddy_api_mtls_e2e.sh
```

**Prod müşteri:** Kendi PKI — `deploy/mtls/` yerine müşteri CA'sını mount edin; `examples/nginx-api-mtls.conf` alternatif.

---

## Mutation token rotasyonu

```bash
sudo API_SPLIT_ROTATE=1 bash scripts/ensure_api_split_tokens.sh
bash scripts/sync_dashboard_api_token.sh
bash scripts/dashboard_refresh.sh
bash scripts/api_mutation_token_e2e.sh
```

nginx consult token otomatik guncellenir (`sync_nginx_consult_token.sh`).

---

## Süre dolma uyarısı (operatör)

`caddy-mtls-status.json` icinde `not_after` alanini sabah gate ile kontrol edin:

```bash
python3 -c "
import json, datetime
d=json.load(open('caddy-mtls-status.json'))
na=d.get('client_not_after') or d.get('not_after')
if na:
    dt=datetime.datetime.fromisoformat(na.replace('Z','+00:00'))
    days=(dt-datetime.datetime.now(datetime.timezone.utc)).days
    print(f'mTLS cert: {days} gun kaldi')
"
```

< 14 gun → rotasyon planla.

**Otomasyon:**

```bash
bash scripts/install_mtls_cert_expiry_cron.sh   # Pazartesi 09:30
# haftalik ritual de cagirir: bash scripts/weekly_operator_ritual.sh
```

Rapor: `mtls-cert-expiry-report.json` · Grafana Prometheus fleet metric yoksa bu dosya + Telegram ops yeterli (laptop).

---

## Geri alma (SOAR kapat)

```bash
sudo bash scripts/disable_enterprise_soar_api.sh
bash scripts/enterprise_soar_gate.sh   # mode=community
```

Community profil: tek token, mTLS kapali — isleyis eski haline doner.
