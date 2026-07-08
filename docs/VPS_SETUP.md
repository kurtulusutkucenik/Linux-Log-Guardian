# VPS kurulum — XDP, soak, HTTPS webhook

Laptop’ta test edilemeyen adımlar; VPS gelince bu sırayı izleyin.  
**Core quickstart önce:** [QUICKSTART_NGINX.md](QUICKSTART_NGINX.md) · **Laptop:** [LAPTOP_OPS.md](LAPTOP_OPS.md)

> Bu dosya repo içinde hazır; gerçek VPS doğrulaması operatörde.

**VPS yokken (laptop):** paket hazırlığını doğrula — sunucu gerekmez:

```bash
bash scripts/vps_prep_gate.sh    # -> vps-prep-gate-report.json
bash scripts/enterprise_e9_verify.sh
```

`vps-xdp-kernel` test kartı laptop'ta **skip** (bilinçli); VPS gelince aşağıdaki §2 ile gerçek kernel-XDP kanıtlanır.

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

**VM/VPS soak bittiğinde** (ör. `failures=0/864`, `72.0h`) kanıtı laptop + siteye taşı:

```bash
# VM'de (zaten var):
bash scripts/publish_soak_report.sh

# Laptop'a kopyala (VM IP'sini değiştir):
scp kurtulus@<vm-ip>:~/Linux-Log-Guardian/soak-report.json ./soak-report.json
scp kurtulus@<vm-ip>:~/Linux-Log-Guardian/docs/evidence/SOAK_SUMMARY.md docs/evidence/ 2>/dev/null || true

# Laptop'ta site kanıtına işle:
bash scripts/publish_soak_report.sh
bash scripts/sync_evidence_pack.sh
```

Kontrol: `python3 -c "import json; d=json.load(open('soak-report.json')); print(d.get('duration_hours'), d.get('failures'))"` → `72.0 0`

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

## 7. Sunum kapısı — `post_install_verify` 0 FAIL

Dış demo / müşteri öncesi **zorunlu**. Telegram webhook yeşil olsa bile `:9091` / `:8090` / `--health` kırmızıysa sunumda rezil olursun.

| FAIL mesajı | Anlam | Tek komut onarım |
|-------------|-------|------------------|
| `--health` | IPC izni / grup | `sudo bash scripts/fix_ipc_perms.sh` |
| `metrics :9091 erisilemiyor` | Analyzer metrik dinlemiyor | `sudo systemctl restart log-guardian` |
| `API tokensiz code=000` | API ayakta değil (000 = bağlantı yok) | `sudo bash scripts/ensure_api_security.sh` + restart |

**VM kod senkronu (VirtualBox `/mnt/lg`):**

Script henuz VM'de yoksa (ilk sefer):

```bash
cp /mnt/lg/scripts/vm_bootstrap_from_host.sh scripts/ 2>/dev/null \
  || curl -fsSL ...   # veya asagidaki tek satir
bash /mnt/lg/scripts/vm_bootstrap_from_host.sh   # paylasim mount edilmisse
bash scripts/vm_sync_from_host.sh               # tam repo senkronu
```

`rsync -a /mnt/lg/` **kullanma** — `.cache`, `data/`, `rules.conf`, `vmlinux.h` izin hatasi verir.

**Binary güncelleme (k8s_webhook vb. C değişikliği):**

```bash
bash /mnt/lg/scripts/vm_sync_from_host.sh
sudo bash scripts/vm_build_binary.sh    # make + install (BPF vmlinux duzeltmeli)
sudo bash scripts/vm_demo_gate.sh
```

`make -j$(nproc)` tek basina yetmez — laptop'tan gelen `vmlinux.h` typedef cakismasi yapabilir.

**Tek komut (önerilen):**

```bash
sudo bash scripts/vm_demo_gate.sh
newgrp log-guardian    # veya VM oturumunu kapat/aç
bash scripts/vm_demo_gate.sh --verify-only
```

Çıkış: `FAIL: 0` · WARN (Prometheus docker, demo parola) lab VM’de normal.

Webhook + Grafana E2E sonrası:

```bash
bash scripts/grafana_alert_e2e.sh
sudo bash scripts/webhook_prod_e2e.sh
bash scripts/post_install_verify.sh   # veya --verify-only gate
```

---

## 8. Güvenlik checklist (VPS)

```bash
sudo bash scripts/ensure_api_security.sh
sudo env LG_NEW_PASSWORD='...' bash scripts/laptop_harden.sh   # internete açıksa
bash scripts/local_security_audit.sh
bash scripts/api_fail_closed_test.sh
bash scripts/install_audit_cron.sh
```

Docker prod: `docker-compose.prod.yml` — socat `bind=127.0.0.1` (metrik/API relay).

---

## 9. IPv6 ban doğrulama (laptop veya VPS)

```bash
sudo bash scripts/ensure_ipv6_ipset.sh
sudo bash scripts/ipv6_ban_e2e.sh
```

Çıktı: `ipv6-ban-e2e-report.json` — RFC 3849 `2001:db8::dead:beef` test IP.

API yoksa otomatik CLI fallback (`log-guardian ban`).

---

## 10. OpenAPI strict (API SaaS)

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

---

## VPS sipariş / alış öncesi kontrol listesi

Laptop bu satırlara **hazır** — satın alınca sırayla:

| # | Satın almadan | Komut / kanıt |
|---|---------------|---------------|
| 1 | Kanıt vitrin yeşil | `/tests` **89/89** · `bash scripts/vps_prep_gate.sh` |
| 2 | Internet-facing runbook | [INTERNET_FACING_SECURITY_CHAIN.md](INTERNET_FACING_SECURITY_CHAIN.md) |
| 3 | Edge checklist | [EDGE_PROTECTION.md](EDGE_PROTECTION.md) · `edge_protection_checklist.sh` |
| 4 | mTLS / SOAR (opsiyonel) | [MTLS_ROTATION_RUNBOOK.md](MTLS_ROTATION_RUNBOOK.md) |
| 5 | Filo demo (opsiyonel) | host keepalive + VM · `fleet_offline_gate` |

**Sipariş önerisi:** Ubuntu 22.04+ · ≥2 vCPU · 2–4 GB RAM · public IPv4 · NIC adı `eth0` veya `ens*` (XDP).

**Satın alınca ilk gece (kısa):**

```bash
sudo bash install.sh
sudo bash scripts/install_first_run.sh
bash scripts/detect_internet_facing.sh && echo PUBLIC || echo LAB
# PUBLIC ise:
bash scripts/backup_operator_secrets.sh
sudo env LG_NEW_PASSWORD='GucluParola!' bash scripts/laptop_harden.sh
sudo bash scripts/apply_internet_facing_hardening.sh
bash scripts/post_install_verify.sh   # demo parola = FAIL beklenir
sudo bash scripts/vps_xdp_proof.sh    # eth0 — skip YOK
```

Detaylı sıra: yukarıdaki §1–§8 + [INTERNET_FACING_SECURITY_CHAIN.md](INTERNET_FACING_SECURITY_CHAIN.md).

**Bilinçli sonraya:** GitHub ship / release (ayrı onay) · laptop 72h soak tekrarı yok.
