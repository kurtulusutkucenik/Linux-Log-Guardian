# Grafana + Prometheus (Linux Log Guardian)

## 1. Prometheus scrape

`rules.conf`:

```ini
METRICS_PORT=9091
TENANT_ID=default
```

`prometheus.yml`:

```yaml
scrape_configs:
  - job_name: log-guardian
    static_configs:
      - targets: ['127.0.0.1:9091']
```

### Prometheus UI (`:9090` → Query)

Kutuya **`PromQL` yazmayin** — bu dilin adi, metrik degil. Asagidakilerden birini yapistirip **Execute**:

```promql
up{job="log-guardian"}
loganalyzer_threat_last_applied{tenant_id="default"}
loganalyzer_eps{tenant_id="default"}
```

Dogrulama scripti (kopyalanacak sorgulari listeler):

```bash
bash scripts/prometheus_smoke.sh
```

## 2. Dashboard import

1. Grafana → Dashboards → Import
2. Upload `grafana-dashboard.json` (repo kökü)
3. Prometheus datasource seç
4. **Tenant** değişkeni: `label_values(loganalyzer_eps, tenant_id)` — filo kurulumunda tenant seçin

## 3. Paneller

| Panel | Metrik |
|-------|--------|
| Log / ban / EPS | `loganalyzer_lines_total`, `bans_success`, `bans_fail`, `eps` |
| Sağlık | `parse_errors_total`, `xdp_active`, `ringbuf_drops_total` |
| Threat + FP | `threat_last_sync_ts`, `threat_total_iocs`, `threat_last_applied`, `threat_last_failed`, `fp_trusted_ips`, `fp_learn_enabled` |
| Ban pipeline | `ban_pipeline_ipc`, `ban_pipeline_xdp`, `ban_pipeline_ipset`, `ban_pipeline_failed` |
| HTTP | `http_status_total` (4xx/5xx) |
| Alert rate | `rate(alerts_total[1m])` |

Tüm sorgular `tenant_id="$tenant"` kullanır. Metrik prefix `loganalyzer_*` legacy isimdir — [BRANDING.md](BRANDING.md).

## 4. Alert kuralları

`grafana-alerts.json`:

- EPS düşük — son **15 dk**'da log varken EPS &lt; 0.5 (`for: 10m`); laptop bench sonrası **15+ dk boşta** tetiklenmez
- Alert artışı
- Ban başarısız (`bans_fail`)
- Parse hatası artışı
- Threat intel eski (>24 saat)
- Threat sync hatalari (`threat_last_failed` > 0)
- API yetkisiz istek artisi (`api_auth_fail` 15 dk’da > 20)
- FP learn ısınma (`trusted_ips=0`, 24h — ilk hafta info)

Metrik smoke test (systemd `/usr/local/bin` — `make` yetmez, `make install` gerekir):

```bash
bash scripts/metrics_reload.sh          # make install + restart + smoke
bash scripts/grafana_metrics_smoke.sh
```

Grafana stack (compose'da yok — ayri Docker container):

```bash
bash scripts/grafana_stack.sh             # Prometheus :9090 + Grafana :3002 + provision
bash scripts/grafana_smoke_test.sh        # opsiyonel dogrulama
```

Alert Telegram **Source** linki `:3000` ise 404 verir (dashboard portu). Duzeltme:

```bash
bash scripts/grafana_fix_root_url.sh        # Grafana root_url → :3002 + alert yeniden yukle
# Eski :3000 linkleri icin (dashboard redirect):
docker compose -f docker-compose.prod.yml up -d --build dashboard
```

`docker-compose.prod.yml` yalnizca **dashboard + caddy** icerir; Grafana icin `grafana_stack.sh` kullanin.

## 5. Otomatik kurulum

```bash
bash scripts/grafana_stack.sh
bash scripts/grafana_smoke_test.sh
```

Tek komut `grafana_stack.sh`: Prometheus (host scrape) + Grafana + dashboard/alert provision.

Manuel API:

```bash
GRAFANA_URL=http://127.0.0.1:3002 GRAFANA_PASS=admin bash scripts/grafana_provision.sh
```

Dashboard import sirasinda Prometheus datasource UID otomatik enjekte edilir (`grafana_dashboard_pack.py`) — tenant degiskeni kirmizi uyari vermemeli.

Ornek metrik akisi (Grafana tablo paneli icin):

```bash
bash scripts/metrics_demo.sh
# Grafana: http://127.0.0.1:3002/d/log-guardian-01 — "Anlik metrikler (tablo)" paneli
```

## 6. Grafana Telegram contact (#30 — LG Ops ayri)

Grafana alarmlari **LG Ops supergroup**'una gitmemeli; Log Guardian zaten `LOGANALYZER_TELEGRAM_CHAT_CRIT/WARN` kullanir.

**Onerilen:** operator DM (`LOGANALYZER_TELEGRAM_CHAT_WARN` ile ayni ID):

```bash
bash scripts/grafana_telegram_contact.sh --from-webhook-warn --test
```

Manuel env: `deploy/grafana.telegram.env.example` → `.env.grafana.telegram.local`

Dogrulama: Grafana → Alerting → Contact points → `log-guardian-telegram`  
Policy: `product=log-guardian` → bu contact (Ops `-100…` chat_id kullanmayin).

**E2E (policy + DM mesaji):**

```bash
bash scripts/grafana_alert_e2e.sh   # sudo sorar (webhook.env token; Grafana API token'i maskeler)
# Sadece policy/contact: bash scripts/grafana_alert_e2e.sh --check-only
```

Telegram DM'de Grafana `FIRING` formatinda test mesaji gorunur; LG Ops supergroup'ta **olmamali**.
