# VPS kurulum — XDP, soak, HTTPS webhook

Laptop’ta test edilemeyen adımlar; VPS gelince bu sırayı izleyin.  
**Core quickstart önce:** [QUICKSTART_NGINX.md](QUICKSTART_NGINX.md) · **Laptop:** [LAPTOP_OPS.md](LAPTOP_OPS.md)

> Bu dosya repo içinde hazır; gerçek VPS doğrulaması operatörde.

---

## Önkoşullar

| Gereksinim | Not |
|------------|-----|
| Ubuntu 22.04+ / Debian 12+ | `install.sh` destekler |
| Root veya sudo | XDP attach için |
| `eth0` veya `ens3` | `IFACE` otomatik tespit |
| nginx + TLS | Cloudflare veya Let’s Encrypt |

---

## 1. Temel kurulum (laptop ile aynı)

```bash
sudo bash install.sh          # XDP varsayılan açık
sudo bash scripts/install_first_run.sh
```

`rules.conf` kontrol:

```ini
IFACE=eth0          # ip route get 8.8.8.8 ile doğrula
API_BIND=127.0.0.1
API_TOKEN=<otomatik>
FP_LEARN=1
FP_TRUST_DAYS=30
```

---

## 2. XDP eth0

```bash
# Arayüz
ip route get 8.8.8.8 | grep -oP 'dev \K\S+'

# Daemon
sudo systemctl enable --now log-guardian-daemon
sudo systemctl status log-guardian-daemon

# Metrik
curl -s http://127.0.0.1:9091/metrics | grep -E 'xdp|ebpf' | head
```

Sorun giderme:

```bash
sudo bash scripts/repair_active_bans_json.sh
bash scripts/ops_health.sh
```

`--no-xdp` sadece container / eski kernel için; VPS’te mümkünse XDP açık kalsın.

---

## 3. nginx edge

```bash
sudo bash scripts/prod_edge_setup.sh      # docs/EDGE_PROTECTION.md
sudo bash scripts/fix_nginx_inline_consult.sh
sudo bash scripts/fix_nginx_log_format.sh
```

Inline consult `X-Guardian-Token` header’ı `fix_nginx_inline_consult.sh` yazar (API fail-closed).

---

## 4. 72 saat soak (systemd)

Laptop: `scripts/laptop_soak_72h.sh`  
VPS (terminal kapanınca da devam):

```bash
sudo bash scripts/install_soak_systemd.sh
sudo systemctl start log-guardian-soak
journalctl -u log-guardian-soak -f
```

Rapor: `soak-report.json` · log: `soak-72h.log`

---

## 5. HTTPS Telegram webhook (tunnel yerine)

Tunnel (`cloudflared` / ngrok) laptop için uygundur. VPS’te kalıcı URL:

1. nginx TLS + gerçek domain (`docs/TLS_PRODUCTION.md`)
2. `rules.conf` webhook URL’sini `https://api.telegram.org/...` yerine kendi endpoint’inize yönlendirin veya doğrudan Telegram’a **HTTPS egress** ile gönderin
3. `bash scripts/webhook_test_cli.sh ban` ile doğrula

Detay: [WEBHOOK_SETUP.md](WEBHOOK_SETUP.md) — “Production HTTPS” bölümü.

---

## 6. Fleet / etcd mesh (opsiyonel)

Çok sunucu senaryosu; tek VPS’te **gerekmez**.

| Bileşen | Dosya |
|---------|--------|
| Agent sync | `agent_sync.c` |
| Rules fleet | `rules_fleet.c` |
| etcd mesh | `etcd_mesh.c` |

Açmak için `rules.conf` fleet anahtarları — [HOSTING_RUNBOOK_TR.md](HOSTING_RUNBOOK_TR.md).

---

## 7. Güvenlik checklist (VPS)

```bash
sudo bash scripts/ensure_api_security.sh
sudo env LG_NEW_PASSWORD='...' bash scripts/laptop_harden.sh   # internete açıksa
bash scripts/local_security_audit.sh
bash scripts/api_fail_closed_test.sh
bash scripts/install_audit_cron.sh
```

Docker prod: `docker-compose.prod.yml` — socat `bind=127.0.0.1` (metrik/API relay).

---

## 8. IPv6 ban doğrulama (laptop veya VPS)

```bash
sudo bash scripts/ensure_ipv6_ipset.sh
sudo bash scripts/ipv6_ban_e2e.sh
```

Çıktı: `ipv6-ban-e2e-report.json` — RFC 3849 `2001:db8::dead:beef` test IP.

API yoksa otomatik CLI fallback (`log-guardian ban`).

---

## 9. OpenAPI strict (API SaaS)

```bash
sudo bash scripts/install_openapi_strict_prod.sh
bash scripts/bola_idor_e2e.sh
```

[OPENAPI_STRICT_PROD.md](OPENAPI_STRICT_PROD.md)

---

## Ne zaman laptop’a dön?

- Geliştirme / dokümantasyon / FP corpus
- 1h soak (`SOAK_1H=1`)
- Dashboard + `/tests` demosu

VPS = üretim kanıtı (XDP + 72h + gerçek trafik FP).
