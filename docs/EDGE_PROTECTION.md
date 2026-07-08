# Edge koruma — CDN, nginx, XDP, yuk testi

**Hedef:** Volumetrik saldiri oncesi nefes + dogru istemci IP + kernel ban + operasyonel dogrulama.

Tek komut (root):

```bash
sudo bash scripts/prod_edge_setup.sh
```

---

## 1. CDN / reverse proxy

Log Guardian **tek sunucu WAF**; L3/L4 DDoS icin edge sart.

| Katman | Ne yapar | Log Guardian rolu |
|--------|----------|-------------------|
| Cloudflare / AWS Shield / Fastly | Volumetrik absorb, bot fight | Origin'de nginx + ban |
| nginx (origin) | rate limit, TLS terminate | access log → analyzer |
| Log Guardian | CRS + anomaly + ban | ipset / XDP drop |

### Cloudflare (onerilen)

1. DNS → proxied (turuncu bulut)
2. SSL/TLS: Full (strict)
3. Origin'e sablon: `deploy/cloudflare-origin.conf`
4. `rules.conf`: saldiri IP'leri gercek istemciden gelir (`$remote_addr` CF sonrasi duzgun)

**Log Guardian XFF politikasi:**

| Kurulum | `rules.conf` |
|---------|----------------|
| Cloudflare + `real_ip_header CF-Connecting-IP` (onerilen) | `TRUST_XFF=0` (varsayilan) — nginx `$remote_addr` yeterli |
| Yerel nginx reverse proxy (`proxy_pass`) | `TRUST_XFF=1` + `TRUST_PROXY_CIDRS=...` |
| Sablon | `examples/rules/proxy-trust.conf` |

```bash
sudo cp deploy/cloudflare-origin.conf /etc/nginx/conf.d/log-guardian-cloudflare.conf
sudo nginx -t && sudo systemctl reload nginx
```

Dashboard / fleet TLS: [TLS_PRODUCTION.md](TLS_PRODUCTION.md)

---

## 2. nginx rate limiting

Snippet'ler:

- `examples/nginx/snippets/log-guardian.conf` — `limit_req_zone`, `limit_conn_zone`, log format
- `examples/nginx/snippets/log-guardian-server.conf` — server limitleri

```bash
sudo cp examples/nginx/snippets/log-guardian.conf /etc/nginx/snippets/
sudo cp examples/nginx/snippets/log-guardian-server.conf /etc/nginx/snippets/
# site config'inize include ekleyin (ornek: examples/nginx-log-guardian.conf)
sudo nginx -t && sudo systemctl reload nginx
```

Varsayilanlar: **30 r/s** genel, **5 r/m** login, **50 eszamanli baglanti** / IP.

---

## 3. Prod NIC + XDP

Wi‑Fi / generic NIC'te XDP kapali → **ipset-fallback** normal.

```bash
bash scripts/prod_nic_xdp_check.sh
# kablolu eth0/ens* onerilir:
sudo systemctl restart log-guardian-daemon
sudo log-guardian --status --quiet | jq '.xdp_mode, .daemon.xdp_active, .daemon.l7_probe'
```

Beklenen (prod NIC): `xdp_mode=kernel-xdp` veya en azindan `ipc=ok` + ipset ban.

---

## 4. Threat intel + DB (24K sisme onleme)

Guncel script repo ile sync:

```bash
sudo install -m 755 threat_intel.sh /usr/local/bin/log-guardian-threatintel
sudo bash /usr/local/bin/log-guardian-threatintel /etc/log-guardian/events.db
```

- DB'ye **ozet satir** yazar (`threat-intel-summary:N IPs`)
- Legacy per-IP satirlari siler
- XDP yoksa **ipset fallback** (`THREAT_INTEL_IPSET=1`)

`rules.conf`:

```ini
INTEL_BAN_DB_TTL_DAYS=7
BLOCK_COUNTRIES=CN,RU,KP   # opsiyonel GeoIP
```

**Prometheus (ban mantigina dokunmaz):** `loganalyzer_ban_events_total`, `loganalyzer_intel_ban_legacy_rows`, `loganalyzer_intel_ban_summary_rows` — Grafana alert `lg-ban-db-size` / `lg-intel-ban-legacy`. Ops: `bash scripts/intel_ban_db_ops_check.sh` · haftalik prune: `bash scripts/intel_ban_db_prune_cron.sh` (cron: `install_operator_cron.sh`).

---

## 5. Whitelist

`/etc/log-guardian/rules.conf`:

```ini
WHITELIST_IP=127.0.0.1
WHITELIST_IP=::1
# WHITELIST_IP=203.0.113.10    # ofis
# WHITELIST_IP=198.51.100.2   # monitoring / uptime
```

Degisiklik sonrasi: `sudo systemctl restart log-guardian`

---

## 6. Yuk testi (gercek nginx)

```bash
export LOGANALYZER_PASSWORD='DegistirBeni!123'
bash scripts/nginx_attack_test.sh
```

SQLi modu nginx :80'e vurur; birkac saniye icinde `ban_pipeline` veya ipset'te ban beklenir.

---

## Kontrol listesi

Otomatik ozet (laptop/prod):

```bash
bash scripts/edge_protection_checklist.sh   # -> edge-protection-checklist-report.json
```

| Madde | Laptop | Prod |
|-------|--------|------|
| `edge_protection_gate` | gerekli | gerekli |
| nginx snippet + rate limit | gerekli | gerekli |
| intel ban DB TTL + prune cron | gerekli | gerekli |
| dashboard :8443 LAN | gerekli (firewall bind) | gerekli |
| CDN real_ip snippet | atla | gerekli |
| kernel-XDP | atla (ipset OK) | VPS'te hedef |

- [ ] `sudo bash scripts/prod_edge_setup.sh` → `[OK] prod_edge_setup` (prod/VPS)
- [x] `bash scripts/edge_protection_gate.sh` → laptop/prod kapı raporu (`edge-protection-gate-report.json`)
- [x] `bash scripts/edge_protection_checklist.sh` → checklist JSON (`edge-protection-checklist-report.json`)
- [x] `bash scripts/dist_risk_proof_e2e.sh` → dağıtık saldırı risk bonusu kanıtı
- [x] `:9091/metrics` → `loganalyzer_dist_risk_*` (Grafana SOC paneli)
- [x] `bash scripts/laptop_core_gate.sh` → Core operatör (edge + SOC + ban, VPS/GitHub yok)
- [ ] CDN proxied + origin real_ip (Cloudflare ise — prod origin)
- [x] nginx snippet aktif, `nginx -t` OK (laptop)
- [x] `prod_nic_xdp_check.sh` — ipset-fallback bilincli (Wi‑Fi laptop)
- [x] threat_intel ozet DB — `intel_ban_db_ops_check` + haftalik `intel_ban_db_prune_cron` (sudoers: `scripts/sudoers-ban-db-prune.example`)
- [x] WHITELIST loopback+ (`WHITELIST_IP` rules.conf)
- [x] dashboard :8443 LAN kapali — `firewall_dashboard_bind.sh` veya `check_dashboard_tls_bind.sh`
- [x] `nginx_attack_test.sh` — SQLi alarm ingest OK (laptop; whitelist → ban atlanir beklenen)

### Laptop / lab (XDP kapali — bilincli)

Wi‑Fi / VirtualBox ortaminda XDP OFF + **ipset ban** normal. Asagidaki maddeler laptop demo icin yeterli:

- [x] `sudo bash scripts/apply_laptop_security_p0.sh` — nginx log + inline consult + FP trust + whitelist (tek sudo)
- [x] `sudo bash scripts/ensure_daemon_env.sh` — `LG_DISABLE_URING=1` (IPC kararliligi)
- [x] `sudo bash scripts/repair_no_xdp_stack.sh` — daemon unit + metrics
- [x] Cloudflare Pages: `LG_WEBSITE_PUBLISH=1 bash scripts/website_publish.sh` → `website_live_gate` **85/85 kart** (`sitemap.xml` + `robots.txt`)
- [x] `bash scripts/binary_hardening_check.sh` — PIE + RELRO (upgrade sonrasi OK)
- [x] Filo NAT: VM `vm_fleet_agent_setup.sh` + host `host_fleet_agent_setup.sh` · doğrulama: `vm_fleet_gate.sh`
- [x] `bash scripts/nginx_attack_test.sh` — SQLi alarm ingest OK (`127.0.0.1` whitelist → ban atlanir, beklenen)
- [x] `bash scripts/edge_protection_checklist.sh` — laptop checklist ozeti
- [x] Dashboard :8443 — `firewall_dashboard_bind.sh` (nftables/iptables)
- [x] `bash scripts/vps_prep_gate.sh` — VPS kurulum hazırlığı (laptop; sunucu yok)
- [ ] VPS gelince: `sudo bash scripts/vps_xdp_proof.sh` → kernel-XDP (skip **yok**)
- [ ] VPS gelince: `prod_nic_xdp_check.sh` → kernel-XDP maddesi

---

## Dashboard doğrulama deep link’leri

Operatör paneli (`https://localhost:8443/tests`) — gate dokümantasyonu ile aynı id:

| Konu | Deep link |
|------|-----------|
| Edge koruma | `https://localhost:8443/tests#test-edge-protection-gate` |
| INTEL ban DB | `https://localhost:8443/tests#test-intel-ban-db` |
| Webhook / Telegram | `https://localhost:8443/tests#test-webhook-route-proof` |
| CrowdSec (tamamlayıcı) | `https://localhost:8443/tests#test-crowdsec-bouncer` |
| Sabah operatör | `https://localhost:8443/tests#test-morning-operator-gate` |

Tam matris: `docs/LAPTOP_OPS.md` § Gate test deep link.
