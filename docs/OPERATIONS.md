# Operasyon — 7/24 systemd entegrasyonu

**Hedef:** Kurulumdan sonra sunucu reboot olsa bile Log Guardian otomatik ayakta; operatör üç komutla durumu görür.

**İlgili:** [LAPTOP_OPS.md](LAPTOP_OPS.md) · [QUICKSTART_NGINX.md](QUICKSTART_NGINX.md) · [GRAFANA_SETUP.md](GRAFANA_SETUP.md) · [WEBHOOK_SETUP.md](WEBHOOK_SETUP.md) · [DOCS_INDEX.md](DOCS_INDEX.md)

---

## Mimari (Core)

```
nginx access.log
       │
       ▼
log-guardian.service      ← --follow (tail -f), WAF, SQLite
       │
       ▼ IPC
log-guardian-daemon       ← eBPF/XDP veya ipset fallback
       │
       ▼
kernel ban (ipset / XDP)
```

| Servis | Rol | Kullanıcı |
|--------|-----|-----------|
| `log-guardian-daemon` | Ban hattı, eBPF | root |
| `log-guardian` | Log analizi, metrik | `log-guardian` |
| `log-guardian-threatintel.timer` | Gece threat feed | oneshot |

---

## Kurulum (tek komut)

```bash
git clone https://github.com/kurtulusutkucenik/loganalyzer.git
cd loganalyzer   # ürün: Linux Log Guardian
sudo bash install.sh
sudo bash scripts/ensure_api_security.sh
```

Laptop operasyon matrisi: [LAPTOP_OPS.md](LAPTOP_OPS.md)

XDP desteklenmiyorsa veya container:

```bash
sudo bash install.sh --no-xdp
```

Kurulum sonrası otomatik: systemd enable + start + health retry.

---

## Operatör — günlük üç komut

```bash
sudo log-guardian --health
sudo log-guardian --status --rules /etc/log-guardian/rules.conf
curl -s http://127.0.0.1:9091/metrics | grep -E 'loganalyzer_(eps|lines_total|bans_)'
```

Kurulu sistemde `--status` otomatik `/etc/log-guardian/rules.conf` kullanır (yeni binary).
Metrik sayaçları servis restart sonrası sıfırlanır; SQLite (`events.db`) kalıcıdır.

`--health` kontrol eder: daemon IPC · `daemon_stats.json` · `/metrics` endpoint.

---

## systemd yönetimi

```bash
sudo systemctl status log-guardian-daemon log-guardian
sudo systemctl restart log-guardian-daemon
sudo systemctl restart log-guardian
sudo journalctl -u log-guardian -u log-guardian-daemon -f
```

Reboot sonrası servisler `enable` ile otomatik başlar. Doğrulama:

```bash
bash scripts/ops_smoke.sh
```

---

## Yapılandırma (`/etc/log-guardian/`)

| Dosya | Açıklama |
|-------|----------|
| `rules.conf` | WAF, IFACE, METRICS_PORT, BAN_TTL |
| `env` | `LOGANALYZER_PASSWORD`, IPC token |
| `events.db` | SQLite olay kaydı |
| `xdp_filter.o` | eBPF nesnesi (XDP modunda) |

Önemli `rules.conf` alanları:

```ini
IFACE=eth0
LOG_PATH=/var/log/nginx/access.log
METRICS_PORT=9091
BAN_TTL_SEC=600
```

`install.sh` IFACE ve nginx log yolunu otomatik tespit eder.

---

## Nginx entegrasyonu

`examples/nginx-log-guardian.conf` içeriğini site config'e ekleyin:

```nginx
log_format log_guardian '$remote_addr - $remote_user [$time_local] '
    '"$request" $status $body_bytes_sent '
    '"$http_referer" "$http_user_agent" "$http_x_forwarded_for" '
    '"$request_body"';
access_log /var/log/nginx/access.log log_guardian;
```

**XFF:** Log formatı `X-Forwarded-For` içerir. Varsayılan olarak parser **XFF'ye güvenmez** (`TRUST_XFF=0`). Reverse proxy arkasındaysanız `rules.conf` içinde `TRUST_XFF=1` ve `TRUST_PROXY_CIDRS=...` ayarlayın.

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Log rotate sonrası analyzer `--follow` ile devam eder; sorun olursa:

```bash
sudo systemctl restart log-guardian
```

---

## XDP / fallback

| Ortam | Beklenen |
|-------|----------|
| Prod NIC (eth0/ens…) | `loganalyzer_xdp_active=1` |
| Dev Wi‑Fi, container | ipset/iptables fallback — Core ban yine çalışır |

```bash
sudo bash install.sh --no-xdp    # bilinçli iptables modu
```

---

## Systemd uyarıları (`StartLimitIntervalSec`)

Eski unit dosyalarında `[Service]` altındaki `StartLimitIntervalSec` systemd uyarısı verir:

```bash
sudo bash scripts/repair_systemd_units.sh
sudo systemctl restart log-guardian-daemon log-guardian
```

## Sorun giderme

| Belirti | Kontrol | Çözüm |
|---------|---------|-------|
| `--health` IPC FAIL | `ls -la /run/log-guardian/` | `sudo systemctl restart log-guardian-daemon` |
| IPC izin | `groups log-guardian` | `sudo bash scripts/fix_ipc_perms.sh` |
| Metrik yok | `systemctl status log-guardian` | nginx log yolu + `adm` grubu izni |
| Ban yok | `sudo log-guardian ban 203.0.113.99 --reason test` | daemon + ipset |
| Health timeout | BPF yüklemesi yavaş | `bash scripts/ops_health.sh` (retry) |

---

## Beta pilot doğrulama

Kurulum sonrası tek komut (referans / demo kanıtı):

```bash
export LOGANALYZER_PASSWORD='DegistirBeni!123'
sudo bash scripts/pilot_e2e.sh
```

Beklenen: health OK · sentetik logda ≥1 alert · status JSON.

## Doğrulama scriptleri

```bash
bash scripts/pilot_e2e.sh          # beta pilot kanıtı
bash scripts/ops_smoke.sh          # systemd 7/24 (root veya kurulu sistem)
bash scripts/ops_health.sh         # health retry
bash scripts/smoke_test.sh         # hızlı işlev testi
bash scripts/phase0_e2e.sh         # Faz 0 kapısı
export LOGANALYZER_PASSWORD='DegistirBeni!123'
bash scripts/phase100.sh           # tüm faz kapıları
```

---

## Grafana + webhook (Pro katman)

```bash
bash scripts/grafana_provision.sh
# WEBHOOK_DRY_RUN=1 bash scripts/webhook_smoke_test.sh
```

Detay: [GRAFANA_SETUP.md](GRAFANA_SETUP.md), [WEBHOOK_SETUP.md](WEBHOOK_SETUP.md).

---

## Satış dili (dürüst)

- **Söyle:** tek geçiş log→WAF→kernel ban, ölçülebilir FP, systemd 7/24
- **Söyleme:** ModSecurity'ten hızlıyız (bench farklı modda karşılaştırır)

Kanıt: `bash scripts/competitive_suite.sh` → `competitive-proof.pdf`
