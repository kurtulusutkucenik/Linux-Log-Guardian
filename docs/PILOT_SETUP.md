# Sunucu kurulum — SSH checklist

**Hedef:** Yeni sunucuya SSH ile bağlanıp 15 dakikada Core (nginx log → WAF → kernel ban) çalışır hale getirmek. Topluluk / kendi VPS’in için.

**İlgili:** [QUICKSTART_NGINX.md](QUICKSTART_NGINX.md) · [OPERATIONS.md](OPERATIONS.md) · [EDGE_PROTECTION.md](EDGE_PROTECTION.md)

---

## Ön koşullar

| Gereksinim | Kontrol |
|------------|---------|
| Ubuntu 22.04+ / Debian 12+ x86_64 | `uname -m` → `x86_64` |
| root veya sudo | `sudo -v` |
| nginx kurulu | `nginx -v` |
| Gerçek NIC (VPS) | `ip -o link show \| grep -v lo` → `eth0` |
| SSH erişimi | `ssh user@pilot-host` |

---

## Adım adım (SSH)

### 1. Sunucuya bağlan

```bash
ssh -i ~/.ssh/pilot.pem ubuntu@YOUR_VPS_IP
```

### 2. Bağımlılıklar + repo

```bash
sudo apt-get update -qq
sudo apt-get install -y git build-essential ipset iptables nginx sqlite3 curl
git clone https://github.com/kurtulusutkucenik/loganalyzer.git
cd loganalyzer   # ürün: Linux Log Guardian
sudo bash scripts/ensure_api_security.sh
```

### 3. Tek komut kurulum

```bash
sudo bash install.sh
```

Kurulum sonunda kontrol edin:

- `[ OK ]` nginx log_format uyarısı yoksa → format hazır
- `[WARN] log_format log_guardian YOK` → adım 4’e geçin
- `Lisans dosyalari: /usr/local/share/doc/log-guardian/`

### 4. Nginx log formatı (gerekirse)

```bash
sudo nano /etc/nginx/nginx.conf
```

`http { }` bloğuna ekleyin:

```nginx
include /etc/nginx/snippets/log-guardian.conf;
```

Site config’inizde:

```nginx
access_log /var/log/nginx/access.log log_guardian;
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 5. rules.conf doğrulama

```bash
sudo grep -E '^(LOG_PATH|IFACE|METRICS_PORT|BAN_TTL)=' /etc/log-guardian/rules.conf
```

| Anahtar | Beklenen |
|---------|----------|
| `LOG_PATH` | `/var/log/nginx/access.log` |
| `IFACE` | `eth0` (VPS NIC) |
| `METRICS_PORT` | `9091` |

### 6. Servisler

```bash
sudo systemctl enable --now log-guardian-daemon log-guardian
sudo systemctl status log-guardian-daemon log-guardian --no-pager
```

### 7. Sağlık (3 komut)

```bash
sudo log-guardian --health
sudo log-guardian --status --quiet | jq .
curl -s http://127.0.0.1:9091/metrics | grep -E 'loganalyzer_(eps|lines_total)'
```

### 8. İlk ban testi

```bash
sudo log-guardian ban 203.0.113.99 --reason pilot-test
sudo ipset test log_analyzer_block_v4 203.0.113.99 && echo "BAN OK"
sudo log-guardian unban 203.0.113.99
```

### 9. Webhook (opsiyonel)

```bash
# rules.conf veya env — docs/WEBHOOK_SETUP.md
export WEBHOOK_DRY_RUN=1
./log-guardian webhook-test ban --quiet --rules /etc/log-guardian/rules.conf
```

### 10. Doğrulama paketi

```bash
bash scripts/ops_smoke.sh
bash scripts/webhook_smoke_test.sh
SKIP_DEMO=1 bash scripts/sprint_b.sh
```

VPS + eth0 için (Sprint C):

```bash
bash scripts/sprint_c.sh
# veya adim adim:
sudo bash scripts/prod_nic_xdp_check.sh
bash scripts/prod_stack_e2e.sh
sudo BENCH_TARGET_MS=50 bash scripts/bench_ban_latency.sh
SOAK_72H=1 bash scripts/sprint_c.sh

# VPS: reboot sonrasi otomatik soak (unit kur, sonra start)
sudo bash scripts/install_soak_systemd.sh
sudo systemctl enable --now log-guardian-soak
```

---

## Whitelist (prod öncesi)

`/etc/log-guardian/rules.conf`:

```
WHITELIST_IP=YOUR_OFFICE_IP
WHITELIST_IP=MONITORING_IP
```

Değişiklik sonrası: `sudo systemctl restart log-guardian`

---

## Sık hatalar

| Belirti | Çözüm |
|---------|--------|
| Analyzer başlamıyor | `LOG_PATH` izinleri: `chgrp adm /var/log/nginx/access.log` |
| XDP OFF | Wi‑Fi/generic NIC normal; VPS `eth0` + kablolu gerekir |
| ipset dolu (65536) | `sudo ipset flush log_analyzer_block_v4` veya threat_intel prune |
| Dashboard boş ban | `bash scripts/sync_dashboard_data.sh` |
| SQLi tespit yok | `log_guardian` format + `$request_body` eksik |

---

## Kurulum çıkış kriterleri

- [ ] `install.sh` tek komut, hata yok
- [ ] `--health` PASS
- [ ] Manuel ban → ipset’te görünür
- [ ] nginx `log_guardian` format aktif
- [ ] `ops_smoke.sh` PASS
- [ ] (VPS) `prod_stack_e2e.sh` PASS veya ipset-fallback bilinçli

**Data room:** `bash scripts/sprint_a.sh` → `data-room.zip`
