# Türk hosting operatör runbook

**Hedef kitle:** Paylaşımlı / VPS hosting firmaları, NOC ve güvenlik ekibi.  
**Kapsam:** nginx access log → WAF/CRS → kernel ban (Core). VPS soak ve webhook bu rehberde zorunlu değil.

**İlgili:** [QUICKSTART_NGINX.md](QUICKSTART_NGINX.md) · [ATTACK_DEFENSE.md](ATTACK_DEFENSE.md) · [EDGE_PROTECTION.md](EDGE_PROTECTION.md) · [OPENAPI_STRICT_PROD.md](OPENAPI_STRICT_PROD.md) · [WEBHOOK_SETUP.md](WEBHOOK_SETUP.md) · [ENTERPRISE_ESCALATION.md](ENTERPRISE_ESCALATION.md)

---

## 1. Ne yapar / ne yapmaz

| Yapar | Yapmaz |
|-------|--------|
| SQLi, XSS, LFI, brute, scanner UA → alarm + ban | L3/L4 volumetrik DDoS absorb (CDN şart) |
| CRS parite + ölçülebilir FP/bench | Tam inline ModSec değil; **hibrit** (log + opsiyonel `auth_request` consult) |
| ipset ban ~17 ms (IPC) | CrowdSec global IOC ağı |
| Incident korelasyonu (`INC-xxx`) | Webhook olmadan dış SIEM push |

---

## 2. Kurulum (15 dk)

**Tek komut (sprint prod + inline consult + kanit):**

```bash
git clone https://github.com/kurtulusutkucenik/loganalyzer.git
cd loganalyzer   # ürün: Linux Log Guardian; binary: log-guardian
sudo bash install.sh
sudo bash scripts/prod_hosting_activate.sh
sudo log-guardian --health
```

Adim adim (ayni sonuc):

```bash
sudo bash scripts/sprint_prod_activate.sh
sudo bash scripts/sprint_harden_prod.sh
sudo bash scripts/fix_nginx_inline_consult.sh   # nginx varsa
bash scripts/sprint_prod_proof.sh
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

### 3b. Hibrit prod — log + inline consult (önerilen hosting)

**Varsayılan:** `log_guardian` access log → analyzer (POST body dahil).  
**Ek katman:** Şüpheli istekte nginx `auth_request` ile `:8090/api/v1/consult` — upstream’e gitmeden 403.

```bash
sudo bash scripts/fix_nginx_inline_consult.sh
sudo nginx -t && sudo systemctl reload nginx
bash scripts/nginx_inline_consult_e2e.sh
```

Tam site örneği (`server {}`):

```nginx
server {
    listen 80;
    server_name musteri.example.com;

    # Core — log format + rate limit (zorunlu)
    include /etc/nginx/snippets/log-guardian-server.conf;
    access_log /var/log/nginx/access.log log_guardian;

    # Opsiyonel inline WAF (ModSec boşluğu)
    include /etc/nginx/snippets/log-guardian-inline-consult.conf;
    include /etc/nginx/snippets/log-guardian-inline-server.conf;

    location / {
        auth_request /_lg_consult;
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

| Mod | Ne zaman | Kurulum |
|-----|----------|---------|
| **Log only** | Çoğu müşteri, düşük gecikme | §3 snippet + `log_guardian` |
| **Hibrit** | ModSec inline beklentisi | §3b + `prod_hosting_activate.sh` |
| **Consult only** | Test / dar path | Önerilmez — POST body logda kalmalı |

Kanıt: `nginx-inline-consult-report.json` · `nginx-hybrid-report.json`

---

## 4. `rules.conf` tuning (hosting)

| Anahtar | Öneri | Açıklama |
|---------|-------|----------|
| `INCIDENT_MIN_LOG_HITS` | `3` (prod) | Aynı IP'de kaç log alarmından sonra `INC-xxx` açılır |
| `AUTO_BAN_MIN_RISK` | `60`–`75` | Agresif ban vs FP dengesi |
| `BRUTE_FORCE_ERR` | `5` | Login 401/403 eşiği |
| `DDOS_RPS` | `200`–`400` | Tek IP flood |
| `ADAPTIVE_THRESHOLD` | `1` | Low-and-slow (ısınma gerekir) |
| `FP_LEARN` | `1` | İlk hafta daha fazla alarm normal |
| `FP_TRUST_DAYS` | `30` | Güvenilir IP EMA süresi |
| `DIST_RISK` | `1` | Dağıtık saldırı: /24 + UA fp + ülke → ban risk bonusu (max +20) |
| `DIST_RISK_MIN_IPS` | `3` | Bonus için minimum farklı IP (subnet/fingerprint) |
| `DIST_RISK_WINDOW_SEC` | `300` | Korelasyon penceresi (5 dk) |
| `JA3_CLUSTER_BAN` | `1` | Aynı UA/JA3 → toplu cluster ban (DIST_RISK'ten bağımsız) |
| `CONSULT_CACHE_TTL` | `5` | Inline consult flood koruması (saniye) |

**DIST_RISK Grafana:** `loganalyzer_dist_risk_buckets_active`, `loganalyzer_dist_risk_bonus_applied_total` — SOC dashboard “DIST risk” panelleri.

**Kanıt:** `bash scripts/dist_risk_proof_e2e.sh` (risk delta ≥10, unit test dahil).

**İlk hafta beklentisi:** `FP_LEARN=1` açıkken `trusted_ips` sıfırdan başlar; 30 gün / ~100 temiz örnekten sonra false alarm düşer. Dashboard → FP panelinde görünür.

**FP ısınma (staging):**
```bash
bash scripts/fp_learn_warmup.sh
sudo bash scripts/install_fp_trust_prod.sh
sudo systemctl restart log-guardian
```
Warmup overlay WAF kapalı (`rules.conf` ham replay alarm üretir). Çıktı: `data/fp-trust-warmup.lst` → prod `/etc/log-guardian/data/fp-trust.lst`.

### `INCIDENT_MIN_LOG_HITS` prod tuning

| Ortam | Öneri | Ne zaman |
|-------|-------|----------|
| **Varsayılan hosting** | `3` | SQLi + brute-force; tek satır alarm gürültüsünü filtreler |
| **Yüksek trafik / API** | `4`–`5` | Çok sayıda 4xx/scan; incident flood riski |
| **Düşük trafik / pilot** | `2` | Hızlı kanıt; `live_attack_harness.sh` ile doğrula |
| **Sadece eBPF korelasyon** | `1` | Log alarmı tek başına yeterli değilse (nadir) |

**Doğrulama:**

```bash
grep INCIDENT_MIN_LOG_HITS /etc/log-guardian/rules.conf
bash scripts/incident_e2e.sh
curl -s http://127.0.0.1:9091/metrics | grep incident
```

**Belirtiler:** Çok erken `INC-xxx` → değeri **yükselt**; saldırı görünüyor ama incident yok → **düşür** veya `AUTO_BAN_MIN_RISK` kontrol et. `INCIDENT_WINDOW_SEC=600` ile birlikte düşünün — pencere içinde eşik kadar alarm gerekir.

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

## 7. Inline consult (hibrit katman)

Şüpheli istekte nginx `auth_request` ile analyzer'a sor. **Log hattı açık kalmalı** — consult büyük POST body için log replay kadar tam değildir.

```bash
sudo bash scripts/fix_nginx_inline_consult.sh
bash scripts/nginx_inline_consult_e2e.sh
# veya tek paket: sudo bash scripts/prod_hosting_activate.sh
```

Snippet dosyaları:

- `examples/nginx/snippets/log-guardian-inline-consult.conf` — internal `/_lg_consult` → API
- `examples/nginx/snippets/log-guardian-inline-server.conf` — `@lg_blocked` JSON 403
- `examples/nginx/log-guardian-inline-site.conf` — tam `location /` örneği

**Prod kontrol listesi**

1. `API_TOKEN` dolu (`sudo bash scripts/ensure_api_security.sh`)
2. `post_install_verify` satırı: `nginx inline consult snippet` yeşil
3. `curl -H "X-Guardian-Token: …" "http://127.0.0.1:8090/api/v1/consult?method=GET&path=/etc/passwd"` → 403 veya allow (kurala göre)
4. Canlı site: `bash scripts/live_attack_harness.sh` veya `real_attack_suite.sh`

---

## 8. Günlük operasyon (3 komut)

```bash
sudo log-guardian --status
curl -s http://127.0.0.1:9091/metrics | grep -E 'alerts_total|ban_pipeline'
sudo log-guardian --list-bans | head
```

Grafana: `bash scripts/grafana_provision.sh` → `$tenant` değişkeni.

### 8b. Telegram operatör zinciri (hosting NOC)

**Akış:** nginx log → WAF → ban → Telegram (WARN/INFO batch · CRIT/ban anında).

| Adım | Operatör | Aksiyon |
|------|----------|---------|
| Kurulum | Sistem | `sudo bash scripts/webhook_install_prod.sh` → `/etc/log-guardian/webhook.env` |
| Alarm | NOC | KRİTİK / IP BANLANDI mesajı |
| Gördüm | NOC | Inline **Gördüm** → ack + SOC timeline |
| Yanlış ban | NOC | **Sesi aç** veya `bash scripts/telegram_operator_undo.sh <IP>` |
| Doğrulama | Güvenlik | Dashboard `#webhook-ops` · `#soc-timeline` · `/bans?search=` |

```bash
# Prod kurulum + test (detay: WEBHOOK_SETUP.md)
sudo bash scripts/webhook_install_prod.sh --test-all
bash scripts/telegram_soc_gate.sh
bash scripts/telegram_operator_undo_e2e.sh   # kanıt (RFC5737 IP)
```

**P2 escalation** (alarm gitmiyor / yanlış sessiz): [ENTERPRISE_ESCALATION.md](ENTERPRISE_ESCALATION.md) § P2 — önce `telegram_soc_gate`, sonra `webhook.env` token/chat ve `WEBHOOK_DRY_RUN=0`.

Laptop kanıt (VPS yok): `.env.webhook.local` + `bash scripts/webhook_apply_local.sh` — token'ları Git'e commit etmeyin.

---

## 9. Sorun giderme

| Belirti | Olası neden | Çözüm |
|---------|-------------|-------|
| POST SQLi görünmüyor | `$request_body` logda yok | `fix_nginx_log_format.sh` |
| Ban yok, alarm var | `AUTO_BAN_MIN_RISK` yüksek | `rules.conf` düşür veya incident eşiği |
| `REFUSED=0` canlı testte | nginx :80 kapalı | `systemctl start nginx` |
| XDP OFF | Laptop / Wi‑Fi NIC | Normal; ipset fallback çalışır |
| `trusted_ips: 0` | FP henüz ısınmadı | `bash scripts/fp_learn_warmup.sh` (staging) veya 30 gün bekle |

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
