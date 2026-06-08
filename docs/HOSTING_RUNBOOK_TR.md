# Türk hosting operatör runbook

**Hedef kitle:** Paylaşımlı / VPS hosting firmaları, NOC ve güvenlik ekibi.  
**Kapsam:** nginx access log → WAF/CRS → kernel ban (Core). VPS soak ve webhook bu rehberde zorunlu değil.

**İlgili:** [QUICKSTART_NGINX.md](QUICKSTART_NGINX.md) · [ATTACK_DEFENSE.md](ATTACK_DEFENSE.md) · [EDGE_PROTECTION.md](EDGE_PROTECTION.md) · [OPENAPI_STRICT_PROD.md](OPENAPI_STRICT_PROD.md)

---

## 1. Ne yapar / ne yapmaz

| Yapar | Yapmaz |
|-------|--------|
| SQLi, XSS, LFI, brute, scanner UA → alarm + ban | L3/L4 volumetrik DDoS absorb (CDN şart) |
| CRS parite + ölçülebilir FP/bench | ModSecurity kadar inline 403 (reaktif mimari) |
| ipset ban ~17 ms (IPC) | CrowdSec global IOC ağı |
| Incident korelasyonu (`INC-xxx`) | Webhook olmadan dış SIEM push |

---

## 2. Kurulum (15 dk)

```bash
git clone https://github.com/kurtulusutkucenik/loganalyzer.git
cd loganalyzer
sudo NGINX_AUTO_LOG_FORMAT=1 NGINX_ENFORCE_LOG_FORMAT=1 bash install.sh
sudo log-guardian --health
```

Kurulum sonrası **mutlaka** log formatını doğrula (POST SQLi için `$request_body` şart):

```bash
bash scripts/check_nginx_log_format.sh
# eksikse:
sudo bash scripts/fix_nginx_log_format.sh
sudo nginx -t && sudo systemctl reload nginx
```

---

## 3. nginx site config

`http {}` bloğuna:

```nginx
include /etc/nginx/snippets/log-guardian.conf;
```

Site `server {}` içine:

```nginx
include /etc/nginx/snippets/log-guardian-server.conf;
access_log /var/log/nginx/access.log log_guardian;
```

Rate limit (flood nefesi — ban gelmeden önce):

```nginx
limit_req_zone $binary_remote_addr zone=lg_login:10m rate=5r/s;
location /giris { limit_req zone=lg_login burst=10 nodelay; }
```

Detay: [EDGE_PROTECTION.md](EDGE_PROTECTION.md)

---

## 4. `rules.conf` tuning (hosting)

| Anahtar | Öneri | Açıklama |
|---------|-------|----------|
| `INCIDENT_MIN_LOG_HITS` | `3` | Tek SQLi yerine 3 log alarmı sonra incident |
| `AUTO_BAN_MIN_RISK` | `60`–`75` | Agresif ban vs FP dengesi |
| `BRUTE_FORCE_ERR` | `5` | Login 401/403 eşiği |
| `DDOS_RPS` | `200`–`400` | Tek IP flood |
| `ADAPTIVE_THRESHOLD` | `1` | Low-and-slow (ısınma gerekir) |
| `FP_LEARN` | `1` | İlk hafta daha fazla alarm normal |
| `FP_TRUST_DAYS` | `30` | Güvenilir IP EMA süresi |

**İlk hafta beklentisi:** `FP_LEARN=1` açıkken `trusted_ips` sıfırdan başlar; 30 gün / ~100 temiz örnekten sonra false alarm düşer. Dashboard → FP panelinde görünür.

---

## 5. Whitelist (kendini kilitleme)

Ofis IP, monitoring, health-check:

```bash
# rules.conf
WHITELIST_IP=1.2.3.4,5.6.7.8
```

Cloudflare arkası: `examples/nginx/snippets/log-guardian.conf` içindeki `realip` bloğunu açın.

---

## 6. API / OpenAPI müşterileri

REST/GraphQL API sunan hosting müşterileri için:

```bash
OPENAPI_STRICT=1
OPENAPI_SCHEMA_PATH=/etc/log-guardian/openapi.yaml
```

BOLA/IDOR testi: `bash scripts/bola_idor_e2e.sh`  
Rehber: [OPENAPI_STRICT_PROD.md](OPENAPI_STRICT_PROD.md)

---

## 7. Inline consult (opsiyonel — ModSec boşluğu)

Şüpheli istekte nginx `auth_request` ile analyzer'a sor:

```bash
bash scripts/nginx_inline_consult_proof.sh
```

Snippet: `examples/nginx/snippets/log-guardian-inline-consult.conf`

---

## 8. Günlük operasyon (3 komut)

```bash
sudo log-guardian --status
curl -s http://127.0.0.1:9091/metrics | grep -E 'alerts_total|ban_pipeline'
sudo log-guardian --list-bans | head
```

Grafana: `bash scripts/grafana_provision.sh` → `$tenant` değişkeni.

---

## 9. Sorun giderme

| Belirti | Olası neden | Çözüm |
|---------|-------------|-------|
| POST SQLi görünmüyor | `$request_body` logda yok | `fix_nginx_log_format.sh` |
| Ban yok, alarm var | `AUTO_BAN_MIN_RISK` yüksek | `rules.conf` düşür veya incident eşiği |
| `REFUSED=0` canlı testte | nginx :80 kapalı | `systemctl start nginx` |
| XDP OFF | Laptop / Wi‑Fi NIC | Normal; ipset fallback çalışır |
| `trusted_ips: 0` | FP henüz ısınmadı | Bekle veya `FP_LEARN=0` geçici |

---

## 10. Laptop kanıt (VPS yok)

Geliştirme veya satış öncesi offline doğrulama:

```bash
bash scripts/laptop_dev_gate.sh
bash scripts/rakip_kanit.sh
```

Çıktılar: `real-attack-report.json`, `owasp-corpus-report.json`, `tr-hosting-corpus-report.json`, `competitive-proof.pdf`

---

## 11. Müşteri iletişimi (dürüst mesaj)

> Log Guardian, nginx log'unuzdan WAF+CRS ile saldırıyı tespit eder ve saniyenin altında kernel ban uygular. Volumetrik DDoS için Cloudflare veya benzeri CDN kullanın; biz origin katmanındayız.

Detaylı rakip konumu: [VS_RAKIPLER.md](VS_RAKIPLER.md)
