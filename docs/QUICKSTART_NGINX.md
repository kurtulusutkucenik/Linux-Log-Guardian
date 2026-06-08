# Quick Start — Nginx (15 dakika)

**Hedef:** Tek sunucuda SQLi + brute-force otomatik kesim (Fail2ban + ModSecurity script karmaşası yerine).

> **Gerçek DDoS / volumetrik saldırı:** Log Guardian tek başına yetmez — önce CDN + nginx rate limit.  
> Bkz. [EDGE_PROTECTION.md](EDGE_PROTECTION.md) · Savunma katmanları: [ATTACK_DEFENSE.md](ATTACK_DEFENSE.md)

## 1. Kurulum (5 dk)

```bash
git clone https://github.com/kurtulusutkucenik/loganalyzer.git
cd loganalyzer
sudo NGINX_AUTO_LOG_FORMAT=1 bash install.sh
```

Kurulum sonunda `log_format log_guardian` uyarısı çıkarsa:

```bash
bash scripts/check_nginx_log_format.sh
```

Kurulum sonunda:

```bash
sudo log-guardian --health          # IPC + daemon_stats + /metrics
sudo log-guardian --status          # son 10 alarm, aktif ban, EPS
curl -s http://127.0.0.1:9091/metrics | head
```

## 2. Nginx log formatı (3 dk)

`examples/nginx-log-guardian.conf` içeriğini site config’inize ekleyin:

```nginx
log_format log_guardian '$remote_addr - $remote_user [$time_local] '
    '"$request" $status $body_bytes_sent '
    '"$http_referer" "$http_user_agent" "$request_body"';
access_log /var/log/nginx/access.log log_guardian;
sudo nginx -t && sudo systemctl reload nginx
```

**Prod edge (CDN + rate limit + yuk testi):** [EDGE_PROTECTION.md](EDGE_PROTECTION.md) — `sudo bash scripts/prod_edge_setup.sh`

Snippet yolu: `examples/nginx/snippets/log-guardian.conf` + `log-guardian-server.conf`

### 2b. Inline consult — istek gelmeden 403 (opsiyonel, ~3 dk)

ModSecurity `auth_request` boşluğu: aynı WAF motoru, nginx üzerinden anlık karar.

```bash
sudo bash scripts/merge_nginx_inline_consult.sh
sudo systemctl restart log-guardian
bash scripts/nginx_inline_consult_quickstart.sh   # union/or1/LFI=403, benign=200
```

nginx `server {}` (5 satır):

```nginx
include snippets/log-guardian-inline-consult.conf;
location / {
    auth_request /_lg_consult;
    error_page 403 = @lg_blocked;
    proxy_pass http://127.0.0.1:8080;
}
```

Tam örnek: `examples/nginx/log-guardian-inline-site.conf`

## 3. Servisler (2 dk)

```bash
sudo systemctl enable --now log-guardian-daemon log-guardian
sudo systemctl status log-guardian-daemon log-guardian
```

`rules.conf` (`/etc/log-guardian/rules.conf`):

- `IFACE=` gerçek NIC (ör. `eth0`)
- `LOG_PATH=/var/log/nginx/access.log`
- `METRICS_PORT=9091`
- `BAN_TTL_SEC=600`

## 4. Doğrulama (5 dk)

```bash
# Sentetik saldırı logu
./log-guardian test_access.log --no-tui --json --rules test_rules.conf

# Canlı SOC
sudo log-guardian --status --db /etc/log-guardian/events.db | jq .

# Manuel ban
sudo log-guardian ban 203.0.113.99 --reason manual-test
sudo log-guardian unban 203.0.113.99
```

## Rakip farkı (tek cümle)

| Fail2ban / ModSecurity | Log Guardian |
|------------------------|--------------|
| Log + ayrı firewall script | Log → analiz → **IPC → XDP/ipset** tek binary |
| Kurulum parçalı | `install.sh` + systemd + `--health` |

## Pilot VPS (SSH checklist)

Yeni sunucuya adım adım kurulum: [PILOT_SETUP.md](PILOT_SETUP.md)

**Türk hosting operatörleri:** [HOSTING_RUNBOOK_TR.md](HOSTING_RUNBOOK_TR.md)  
**Laptop kanıt (VPS/webhook yok):** `bash scripts/laptop_dev_gate.sh`

## 7/24 operasyon

Kurulumdan sonra reboot dahil sürekli çalışma: [OPERATIONS.md](OPERATIONS.md)

```bash
bash scripts/ops_smoke.sh       # systemd + health retry
sudo log-guardian --health
```

## Topluluk demosu (3 dk)

```bash
bash scripts/demo_3min.sh
```

PDF kanıt: `data-room/competitive-proof.pdf` · Test paneli: `https://localhost:8443/tests`

## Sonraki adımlar

- OWASP CRS: `python3 scripts/import_crs.py /path/to/coreruleset/rules -o rules/crs-imported.rules`
- Benchmark raporu: `bash scripts/bench_report.sh`
- Dashboard: `cd dashboard && npm run dev`
