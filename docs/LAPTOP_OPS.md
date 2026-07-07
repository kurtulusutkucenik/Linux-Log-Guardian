# Laptop operasyon rehberi

VPS veya GitHub olmadan **Linux Log Guardian** kurulum, güvenlik ve test.  
Core quickstart: [QUICKSTART_NGINX.md](QUICKSTART_NGINX.md)

## Scriptleri nereden çalıştır?

Tüm `scripts/*.sh` komutları **repo kökünden** çalıştırılır (`Linux Log Guardian/`), `landing/` veya `dashboard/` içinden değil.

```bash
cd ~/Masaüstü/Linux\ Log\ Guardian    # veya: cd "$(git rev-parse --show-toplevel)"
bash scripts/quick_proof_refresh.sh
bash scripts/local_proof_refresh.sh
bash scripts/dashboard_refresh.sh
```

`landing/` içindeysen: `bash ../scripts/quick_proof_refresh.sh` · `cd ..` sonra normal komut.

`cd landing && npm run dev` yalnızca `:3001` önizleme içindir; kanıt/kapı scriptleri repo kökünden koşulur.

## Günlük / haftalık operasyon

| Sıklık | Komut | Süre | Ne yapar |
|--------|--------|------|----------|
| **Her sabah** | `bash scripts/morning_operator_gate.sh` | ~30 sn | laptop_core + :8443 + attack_map + **telegram_soc** parity |
| **Haftalık / demo öncesi** | `bash scripts/core_proof_refresh.sh` | ~5–10 dk | Track A: nginx hybrid + ban profile + IPv6 + competitive-proof sync |
| **Vitrin plani (GIF/VPS haric)** | `bash scripts/finish_vitrin_plan.sh` | ~15–25 dk | cron + Track A + audit + landing + :8443; canli: `PUBLISH=1` |
| **Opsiyonel katman** | `bash scripts/optional_track_refresh.sh` | ~10–15 dk | L7, Grafana alert e2e, demo_3min, landing export (canlı publish yok) |
| **UI değiştiyse** | `bash scripts/dashboard_refresh.sh` | ~2–3 dk | Docker rebuild → `https://localhost:8443` |

```bash
# Günlük
bash scripts/morning_operator_gate.sh

# Haftalık core kanıt (IPv6 atlamak için SKIP_IPV6=1)
bash scripts/core_proof_refresh.sh
UI=1 bash scripts/core_proof_refresh.sh          # aynı + dashboard rebuild

# Opsiyonel: L7 + Grafana + demo + landing (Cloudflare yok)
bash scripts/optional_track_refresh.sh
# Canlı site istenirse: PUBLISH=1 bash scripts/optional_track_refresh.sh
```

**Kural:** Ağır e2e’yi `morning_operator_gate` içine ekleme; haftalık paketler ayrı kalır. Sabah gate önce `proof_meta_gates_refresh` + çift `competitive_proof_build` yapar; yalnızca proof geçici düşükse ikinci build sonrası **recovery** (Telegram spam önlenir). Tarayıcı: **Ctrl+Shift+R** on `https://localhost:8443/` (attack map · SOC timeline · `/tests`).

**Operatör kısayolları:**

| Ne | Nerede |
|----|--------|
| Son vitrin koşusu | `~/lg-last-vitrin.json` (`dashboard_refresh.sh` veya `finish_vitrin_plan.sh` sonunda) |
| INTEL ban DB kontrol | `WARN_ONLY=1 bash scripts/intel_ban_db_ops_check.sh` → `intel-ban-db-report.json` |
| Edge checklist ozet | `bash scripts/edge_protection_checklist.sh` → `edge-protection-checklist-report.json` |
| E9 Enterprise runbook | `bash scripts/enterprise_e9_verify.sh` → `enterprise-e9-verify-report.json` |
| Sabah gate uyarısı | 80/80 değilse, JWT >90g veya intel_ban_db → Telegram (`operator_telegram_notify.sh`) |
| Gate test deep link | Aşağıdaki tablo — `https://localhost:8443/tests#test-<id>` |

**Gate deep link’leri** (`:8443/tests`):

| Gate | Deep link |
|------|-----------|
| Sabah operatör | `#test-morning-operator-gate` |
| Laptop core | `#test-laptop-core-gate` |
| Edge koruma | `#test-edge-protection-gate` |
| Telegram SOC | `#test-telegram-soc-gate` |
| Website preview | `#test-website-preview-gate` |
| Presentation ship | `#test-presentation-ship-gate` |
| Nginx hybrid | `#test-nginx-hybrid` |
| IPv6 ban e2e | `#test-ipv6-ban-e2e` |
| CrowdSec bouncer | `#test-crowdsec-bouncer` |

Tam URL örneği: `https://localhost:8443/tests#test-morning-operator-gate`

**Cron (önerilen):**

```bash
bash scripts/install_operator_cron.sh
# Her gün 08:00 — morning_operator_gate
# Pazar 03:00 — core_proof_refresh
```

Haftalık güvenlik denetimi ayrı: `bash scripts/install_audit_cron.sh` (Pazartesi 09:00 `local_security_audit`).

## Script matrisi (hangi iş ne yapar?)

| Script | Ne zaman | Parolaya dokunur? |
|--------|----------|-------------------|
| `sudo bash install.sh` | İlk kurulum | Hayır (demo `DegistirBeni!123` kalır) |
| `sudo bash scripts/install_first_run.sh` | Kurulum sonrası tek komut (API, firewall, IPC, FP warmup) | Hayır |
| `sudo bash scripts/apply_laptop_security_p0.sh` | P0 güvenlik: nginx log, inline consult, FP trust, whitelist, API | Hayır |
| `bash scripts/ban_profile_e2e.sh` | AUTO_BAN_PROFILE + consult cache + threat intel offline kanıt | Hayır |
| `sudo bash scripts/repair_no_xdp_stack.sh` | `--no-xdp` sonrasi daemon unit + servisler + fleet log sustur | Hayır |
| `bash scripts/post_install_verify.sh` | Tek komut yeşil/kırmızı kurulum matrisi | Hayır |
| `sudo bash scripts/ensure_api_security.sh` | API `:8090` — bind + token + firewall | **Hayır** |
| `bash scripts/api_fail_closed_test.sh` | Token yokken ban/consult 403 | Hayır |
| `bash scripts/install_audit_cron.sh` | Haftalık `local_security_audit` cron | Hayır |
| `bash scripts/install_operator_cron.sh` | Günlük sabah kapısı + haftalık core kanıt cron | Hayır |
| `bash scripts/install_fp_report_cron.sh` | Haftalık FP raporu | Hayır |
| `sudo bash scripts/rotate_api_token.sh` | API_TOKEN yenile + nginx/dashboard | Hayır |
| `bash scripts/publish_soak_report.sh` | Soak JSON → `docs/evidence/` | Hayır |
| `sudo bash scripts/ipv6_ban_e2e.sh` | IPv6 ban kanıtı (ipset v6) | Hayır |
| `bash scripts/sync_dashboard_api_token.sh` | Dashboard ban butonu | Hayır |
| `bash scripts/laptop_jwt_setup.sh` | JWT `.env` + dashboard restart | Hayır (opsiyonel `DASHBOARD_ADMIN_PASSWORD`) |
| `sudo bash scripts/laptop_harden.sh` | İnternete açık sunucu — tam sertleştirme | **Evet** |
| `bash scripts/laptop_harden_check.sh` | Hızlı denetim | — |
| `bash scripts/optional_layers_gate.sh` | K8s + mesh + wasm + copilot opsiyonel kapı | Kısmen |
| `bash scripts/k8s_kind_e2e.sh` | K8s kind dry-run / canlı install | `K8S_KIND_CREATE=1` |
| `bash scripts/mesh_etcd_docker_smoke.sh` | etcd docker lab smoke | Hayır |
| `APPLY=1 bash scripts/laptop_security_excellence.sh` | JWT + haftalık audit cron | Hayır |
| `sudo bash scripts/laptop_security_excellence.sh` | + API firewall + IPC abuse test | **Evet** |
| `bash scripts/security_closure_gate.sh` | Tam güvenlik kapatma (~15 dk) | Kısmen |
| `bash scripts/taxii_feed_e2e.sh` | TAXII/STIX fixture + confidence gate (URL gerekmez) | Hayır |
| `bash scripts/taxii_sync_hook.sh` | Prod TAXII sync — `rules.conf` `TAXII_URL` varsa | Hayır |
| `bash scripts/fp_learn_warmup.sh` | FP ısınma (corpus) | Hayır |
| `sudo bash scripts/install_fp_trust_prod.sh` | Warmup → `/etc/log-guardian/data/fp-trust.lst` | Hayır |
| `SOAK_1H=1 bash scripts/laptop_soak_72h.sh --start` | 1 saat stabilite (soak kilidi aktif) | Hayır |
| `bash scripts/soak_5m.sh` | 5 dk stabilite (ön planda, ~5 dk) | Hayır |
| `bash scripts/laptop_fp_setup.sh` | FP warmup + prod store tek komut | Hayır |
| `bash scripts/laptop_soak_72h.sh --start` | 72 saat stabilite (`SOAK_GRACE_SEC=120`) | Hayır |
| `bash scripts/laptop_excellence_gate.sh` | Laptop mükemmellik kapısı (~2 dk, VPS/GitHub yok) | Hayır |
| `FULL=1 bash scripts/laptop_excellence_gate.sh` | + canlı site + filo e2e + release_ready | Hayır |
| `bash scripts/laptop_reboot_ready.sh` | Reboot sonrası stack + filo tek komut | Kısmen (daemon env sudo) |
| `bash scripts/laptop_release_gate.sh` | Sprint + `.deb` + site gate (GitHub öncesi) | Hayır |
| `bash scripts/optional_polish_refresh.sh` | Fleet prune + site/dashboard test parity (51/51) | Hayır |
| `bash scripts/laptop_optional_layers_preflight.sh` | L7 + webhook durum (sudo yok) | Hayır |
| `sudo bash scripts/laptop_optional_layers_on.sh` | L7 eBPF + Telegram webhook prod + filo | Kısmen |
| `bash scripts/test_deb_local.sh` | `.deb` extract doğrulama (dpkg -i değil) | Hayır |
| `bash scripts/demo_3min.sh` | 3 dk demo (PDF, webhook, dashboard opsiyonel) | Hayır |
| `cd landing && npm run dev` | Landing önizleme `:3001` (hızlı geliştirme) | Hayır |
| `bash scripts/website_landing_export.sh` | Landing static export → `landing/out` | Hayır |
| `bash scripts/website_deploy_gate.sh` | Landing build + `landing/out` + wrangler doğrulama | Hayır |
| `bash scripts/website_publish.sh` | Canlı site güncelleme (landing/out → Cloudflare Pages) | Hayır |
| `bash scripts/pre_push_secret_scan.sh` | GitHub öncesi token tarama | Hayır |
| `bash scripts/website_preview_gate.sh` | Landing /tests parity (80/80, offline) | Hayır |
| `bash scripts/soak_status.sh` | Soak PID + rapor özeti | Hayır |
| `bash scripts/dashboard_stack.sh` | Grafana + TLS dashboard + JWT | Hayır |
| `bash scripts/laptop_stack_boot.sh` | Eksik container’ları ayağa kaldır (reboot sonrası) | Hayır |
| `bash scripts/laptop_observability_check.sh` | Filo grafikleri + Prometheus/Grafana yeşil/kırmızı | Hayır |
| `bash scripts/prometheus_smoke.sh` | Prometheus UI sorgu doğrulama + kopyala-yapıştır PromQL | Hayır |
| `bash scripts/grafana_stack.sh` | Prometheus :9090 + Grafana :3002 + provision | Hayır |
| `bash scripts/grafana_provision.sh` | Dashboard + alert yeniden yükle | Hayır |
| `bash scripts/install_laptop_stack_boot.sh` | Reboot’ta otomatik stack (user systemd) | Hayır (linger için sudo isteyebilir) |
| `sudo bash scripts/install_binaries_systemd.sh` | log-guardian + daemon binary (stop→cp→start) | Hayır |
| `sudo bash scripts/telegram_unacked_ops_cleanup.sh` | Telegram unacked sayacini ops ack ile temizle | Hayır |
| `bash scripts/telegram_operator_undo.sh` | WL/Sessiz geri al (SIGUSR2; fallback restart) · `REBAN=1` demo | Hayır |
| `bash scripts/telegram_soc_gate.sh` | SOC timeline + attack map + webhook panel birleşik kapı | Hayır |
| `bash scripts/bans_telegram_ops_e2e.sh` | `/api/telegram-acks` + `/bans?search=` kapısı | Hayır |
| `bash scripts/publish_soak_report.sh` | 72h soak JSON → docs/evidence + dashboard | Hayır |
| `sudo bash scripts/install_threat_intel_stack.sh` | Firehol threat intel (key yok, **internet gerekir**) | Hayır |
| `sudo bash scripts/install_threat_feed_live.sh` | AbuseIPDB/OTX (key opsiyonel; doluysa ~30 sn–2 dk) | Hayır |
| `bash scripts/threat_intel_status.sh` | Firehol + API feed durumu | Hayır |
| `bash scripts/threat_feed_live_proof.sh` | Threat intel kanıt JSON | Hayır |
| `sudo bash scripts/crowdsec_lapi_setup.sh --install` | CrowdSec LAPI + bouncer key (`:8081`, Caddy `:8080` çakışmaz) | Hayır |
| `sudo bash scripts/crowdsec_lapi_setup.sh` | Mevcut key / LAPI doğrula + `.cache/crowdsec-bouncer.env` | Hayır |
| `LIVE_API=1 bash scripts/crowdsec_bouncer_e2e.sh` | LAPI + ban API kanıtı | Hayır |
| `bash scripts/honeypot_feed_e2e.sh` | Deception Prometheus metrikleri | Hayır |
| `bash scripts/l7_probe_prod_e2e.sh` | Daemon L7 probe readiness | Hayır |
| `bash scripts/morning_operator_gate.sh` | Sabah operatör kapısı (~30 sn, 80/80) | Hayır |
| `bash scripts/core_proof_refresh.sh` | Haftalık Track A kanıt paketi | Kısmen (IPv6 sudo) |
| `bash scripts/optional_track_refresh.sh` | Opsiyonel track (L7, Grafana, demo, landing) | Kısmen |

**İnternet:** Threat feed listeleri ve API sync için gerekli. Core log→ban offline çalışır. Bkz. [THREAT_INTEL_SETUP.md](THREAT_INTEL_SETUP.md)

## Demo parola (bilerek açık)

Repo ve ilk kurulumda analyzer parolası: **`DegistirBeni!123`**

```bash
export LOGANALYZER_PASSWORD='DegistirBeni!123'
./log-guardian --health
```

Laptop / deneme için **değiştirmek zorunlu değil**. İnternete açık sunucuda:

```bash
sudo env LG_NEW_PASSWORD='KENDI_PAROLAN' bash scripts/laptop_harden.sh
```

## API_TOKEN (otomatik, fail-closed)

```bash
sudo bash scripts/ensure_api_security.sh
bash scripts/sync_dashboard_api_token.sh
bash scripts/api_fail_closed_test.sh
```

Token `/etc/log-guardian/rules.conf` içinde `API_TOKEN=...`. Manuel yazmayın.

`API_TOKEN` boşsa servis uyarı verir; `POST /ban` ve `GET /consult` **403** (fail-closed). nginx inline consult `X-Guardian-Token` header kullanır (`fix_nginx_inline_consult.sh`).

## Dashboard JWT + giriş

```bash
bash scripts/laptop_jwt_setup.sh
# veya tam stack:
bash scripts/dashboard_dev.sh
# veya tam stack (Docker/TLS — opsiyonel):
# bash scripts/dashboard_stack.sh
```

- **JWT:** kök `.env` → `JWT_SECRET` (gitignore — commit etmeyin)
- **Giriş:** kullanıcı `admin` — parola:
  - `.env` içinde `DASHBOARD_ADMIN_PASSWORD` varsa o
  - yoksa seed varsayılanı: `ChangeMeOnFirstLogin!`
- **URL (laptop dev):** `http://localhost:3001`

## Reboot sonrası grafikler (Filo)

`dashboard_stack.sh` bir kez çalıştıktan sonra container’lar `--restart unless-stopped` ile kalır. Yine de reboot’ta eksik parça varsa:

```bash
bash scripts/laptop_stack_boot.sh
```

Kalıcı otomatik başlatma (laptop, VPS değil):

```bash
bash scripts/install_laptop_stack_boot.sh
systemctl --user start log-guardian-laptop-stack.service
```

Kontrol: `http://localhost:3001/` (Filo + testler) — sarı “Prometheus yok” uyarısı gitmeli. Eski `/fleet` bookmark otomatik ana sayfaya yönlenir; detaylı komut: `/fleet/dispatch`.

## Laptop mükemmellik (VPS gelene kadar)

Tek komut durum özeti:

```bash
bash scripts/laptop_excellence_gate.sh          # ~2 dk
FULL=1 bash scripts/laptop_excellence_gate.sh   # + canlı site + filo e2e
```

Reboot sonrası her şeyi ayağa kaldır:

```bash
bash scripts/laptop_reboot_ready.sh
# VM icinde ayrica: bash scripts/vm_fleet_agent_setup.sh --install-user-service
```

| Katman | Hedef | Komut |
|--------|--------|--------|
| Core | daemon + analyzer + IPC | `ensure_daemon_env.sh` · `repair_no_xdp_stack.sh` |
| Dashboard | 80/80 `/tests` | `dashboard_refresh.sh` |
| Vitrin | canlı site 80 kart | `LG_WEBSITE_PUBLISH=1 bash scripts/website_publish.sh` |
| Ban temizliği | ipset flush + kanıt modu | `FLUSH=1 bash scripts/laptop_ban_cleanup.sh` |
| CF cache | SRI drift sonrası | `LG_CF_PURGE=1` veya `bash scripts/website_cf_purge.sh` |
| Filo | host + VM Online | `host_fleet_agent_setup.sh` · `vm_fleet_agent_setup.sh` |
| Kanıt | PDF + ZIP | `local_proof_refresh.sh` |
| EDGE | nginx attack + checklist | `nginx_attack_test.sh` |
| VM demo | 0 FAIL | `vm_sync_from_host.sh` → `vm_demo_gate.sh` |

**Kapalı (2026-06-28):** 72h soak · phase100_fast · release_ready · EDGE laptop checklist · prod site SRI · **security Tier-A** (`laptop_security_excellence.sh`)

Güvenlik rehberi: [SECURITY_EXCELLENCE.md](SECURITY_EXCELLENCE.md)

**VPS gelince tek açık kart:** kernel-XDP (`vps_bootstrap.sh`)

## FP trust prod

Prod varsayılan: `FP_LEARN=1`, `FP_TRUST_DAYS=30` (`install.sh`). Warmup sadece başlangıç.

```bash
bash scripts/fp_learn_warmup.sh
sudo bash scripts/install_fp_trust_prod.sh
sudo systemctl restart log-guardian
```

Veya tek komut: `sudo bash scripts/install_first_run.sh`

Warmup çıktısı: `data/fp-trust-warmup.lst` (mutlak yol; overlay `/tmp` hatası giderildi).

## CrowdSec bouncer (opsiyonel)

Log Guardian WAF’a **ek** ban kaynağı — LAPI kararları → `:8090` ban API. Anahtar **repodaki `.env` değil** → `/etc/log-guardian/crowdsec.env`.

```bash
# İlk kurulum (Linux Mint: ubuntu noble repo otomatik)
sudo bash scripts/crowdsec_lapi_setup.sh --install
sudo bash scripts/crowdsec_lapi_setup.sh

# Doğrulama + dashboard raporu
LIVE_API=1 bash scripts/crowdsec_bouncer_e2e.sh
bash scripts/sync_dashboard_data.sh
```

- LAPI varsayılan **`:8081`** (prod Caddy `HTTP_PORT=8080` ile çakışmaz)
- Operator cache: `.cache/crowdsec-bouncer.env` (e2e/sync okur)
- Timer: `log-guardian-crowdsec-bouncer.timer` (5 dk)
- Detay: [CROWDSEC_INTEGRATION.md](CROWDSEC_INTEGRATION.md)

## Soak test (laptop)

| Süre | Komut |
|------|--------|
| 5 dk | `SOAK_SHORT=1 bash scripts/soak_test.sh` |
| 1 saat | `SOAK_1H=1 bash scripts/laptop_soak_72h.sh --start` |
| 72 saat | `bash scripts/laptop_soak_72h.sh --start` |

Önce uyku **kapalı**. İzleme: `tail -f soak-72h.log` · Rapor: `soak-report.json`

Detay: [SOAK_TEST.md](SOAK_TEST.md)

## Dokümantasyon

| Rehber | İçerik |
|--------|--------|
| [QUICKSTART_15MIN.md](QUICKSTART_15MIN.md) | İlk 15 dk akış |
| [ROADMAP_FREE.md](ROADMAP_FREE.md) | Açık / bitti checklist |
| [VPS_SETUP.md](VPS_SETUP.md) | XDP + soak (VPS gelince) |

Tüm rehberler: [DOCS_INDEX.md](DOCS_INDEX.md)  
Tutarlılık kontrolü: `bash scripts/docs_consistency_check.sh`

**Canlı site:** [ceniklinuxlogguardian.org](https://ceniklinuxlogguardian.org) (yazım: `log**g**uardian`)

GitHub öncesi: `bash scripts/pre_push_secret_scan.sh` → 0 FAIL sonra commit/push.

## Haftalık rutin (GitHub gerekmez)

Güvenlik profilleri: [SECURITY_PROFILES.md](SECURITY_PROFILES.md) (Community vs Production)

İki ayrı komut — birbirini çağırmaz:

```bash
# 1) Canlı güvenlik (servis, API, JWT, firewall)
bash scripts/local_security_audit.sh

# 2) Dokümantasyon / yönlendirme tutarlılığı (repo metinleri)
bash scripts/docs_consistency_check.sh

# 3) Servis sağlığı
bash scripts/ops_smoke.sh
```

## VM güncelleme (VirtualBox — laptop değişince)

**Host = laptop** (`kurtulus@kurtulus`). **VM = VirtualBox** (`kurtulus@kurtulus-VirtualBox`).

Laptop'ta kod değiştirdikten sonra VM'ye aktarmak için:

### Tek komut (önerilen)

```bash
# VM içinde
sudo mount -t vboxsf lg /mnt/lg    # gerekirse
cd ~/Linux-Log-Guardian
sudo bash scripts/vm_prod_gate.sh
```

Bu akış: `vm_sync` → `vm_build_binary` → `sprint_prod_activate` → `repair_no_xdp_stack` → `post_install_verify` → `sprint_prod_proof` → `vm_demo_gate --verify-only`.

Tam SIEM/RULES_VERIFY harden dahil:

```bash
sudo bash scripts/vm_prod_gate.sh --harden
# veya
sudo bash scripts/prod_hosting_activate.sh   # sync sonrasi; VM'de build otomatik
```

Sadece doğrulama (onarim yok):

```bash
sudo bash scripts/vm_prod_gate.sh --verify-only
```

### Adim adim (eski / manuel)

```bash
cd ~/Linux-Log-Guardian
sudo bash scripts/vm_sync_from_host.sh
sudo bash scripts/vm_build_binary.sh
sudo bash scripts/repair_no_xdp_stack.sh
bash scripts/post_install_verify.sh
bash scripts/sprint_prod_proof.sh
bash scripts/vm_demo_gate.sh --verify-only
```

Kod + binary hizli yenileme (sprint prod olmadan):

```bash
sudo bash scripts/vm_refresh_from_host.sh
```

**VM filo agent (host :8443):** `vm_refresh_from_host` sonunda `--install-user-service` ile kurar. Manuel:

```bash
bash scripts/vm_fleet_agent_setup.sh --install-user-service
# sync sonrasi servis: systemctl --user restart log-guardian-fleet-keepalive
journalctl --user -u log-guardian-fleet-keepalive -f   # [fleet_push] OK agent=node-vm-02
```

**NAT (varsayilan):** `FLEET_HOST_IP` **vermeyin** — script otomatik `10.0.2.2` kullanir.  
`192.168.x.x` dokümandaki örnektir; komutta aynen yazmayin.

**Bridged** ancak o zaman: host LAN IP'si (`ip -4 addr` laptop'ta) ile  
`FLEET_HOST_IP=192.168.1.42 bash scripts/vm_fleet_agent_setup.sh --install-user-service`

**Not:** `vm_sync_from_host.sh` tek basina keepalive baslatmaz — sync sonrasi yukaridaki setup veya `vm_refresh_from_host`.

**Host eski OFFLINE dugumler:** `STALE_HOURS=1 bash scripts/fleet_prune_stale.sh` (dashboard DB); UI `stale_hours=6` ile gizler.

**Takili fleet komutlari:** `bash scripts/fleet_prune_pending_commands.sh` (`DRY_RUN=1` önizleme, varsayılan `STALE_HOURS=48`) — yalnızca 48h+ bekleyen `pending`/`delivered` komutlar kapatılır; `dashboard_refresh.sh` otomatik çağırır.

**ban_events DB prune:** `sudo log-guardian ban-db-prune --ttl-days 7` · haftalik cron: `bash scripts/install_operator_cron.sh` (Pazar 04:30, `stale>=500`) · `bash scripts/intel_ban_db_prune_cron.sh`

**Cron prune (sudo sifresiz):** `scripts/sudoers-ban-db-prune.example` → `/etc/sudoers.d/log-guardian-ban-db-prune` (`visudo -f`). Binary yolu `which log-guardian` ile dogrula.

**Dashboard :8443 LAN:** internet-facing icin `sudo bash scripts/firewall_dashboard_bind.sh install` (localhost + docker + VM NAT `10.0.2.0/24`). Kontrol: `bash scripts/check_dashboard_tls_bind.sh`

**POST_INSTALL_STRICT (aylik):** `install_operator_cron.sh` ayin 1'i 05:00 — `operator_post_install_strict.sh` (internet-facing tespitinde nginx limit + WASM + dashboard bind)

**Host filo agent (reboot-safe):**

```bash
bash scripts/host_fleet_agent_setup.sh --install-user-service
journalctl --user -u log-guardian-fleet-keepalive -f   # [fleet_push] OK agent=node-kurtulus-01
systemctl --user restart log-guardian-fleet-keepalive
```

`laptop_optional_layers_on.sh` filo adiminda bunu otomatik kurar. Manuel keepalive: `bash scripts/fleet_telemetry_keepalive.sh --bg`

**Daemon io_uring (laptop kararlılık):** Wi-Fi / no-xdp ortamda io_uring watchdog kill onler:

```bash
sudo bash scripts/ensure_daemon_env.sh          # LG_DISABLE_URING=1 -> /etc/log-guardian/env
sudo systemctl restart log-guardian-daemon.service
journalctl -u log-guardian-daemon -b | grep -E 'DISABLE_URING|klasik poll'
```

Host stack ayaktayken `node-vm-02` filoda ONLINE kalir (`TELEMETRY_URL=https://10.0.2.2:8443/...` NAT).

**Filo doğrulama (host laptop):**

```bash
bash scripts/vm_fleet_gate.sh          # node-kurtulus-01 + node-vm-02 Online?
# https://localhost:8443/fleet
```

VM keepalive kurulu değilse guest içinde:

```bash
bash scripts/vm_fleet_agent_setup.sh --install-user-service
journalctl --user -u log-guardian-fleet-keepalive -f   # [fleet_push] OK agent=node-vm-02
```

İlgili: `scripts/vm_fleet_gate.sh` · `scripts/fleet_multi_node_e2e.sh` (dispatch kanıtı) · [ENTERPRISE_SUPPORT.md](ENTERPRISE_SUPPORT.md) § filo demo.

**Not:** `vm_sync` binary taşımaz — C değişince **mutlaka** `vm_build_binary`. `prod_hosting_activate` tek basina sync sonrasi FAIL verebilir; once build veya `vm_prod_gate` kullan.

**Test fixture:** `vm_sync` kök `*.log` dosyalarini tasimaz; `tests/fixtures/*.fixture` sync olur. `auth_log_e2e` / `journald_e2e` eksik logu otomatik kopyalar. Host→VM `rsync` SSH gerekmez (VirtualBox paylasim `/mnt/lg` yeterli).

**Dashboard /tests (VM):** `bash scripts/dashboard_refresh.sh` → `https://localhost:8443/tests` (Ctrl+Shift+R). `vm_refresh_from_host` ops_gate + sync_dashboard_data calistirir.

Script yoksa (ilk sefer): `bash /mnt/lg/scripts/vm_bootstrap_from_host.sh`

| Ne değişti | VM komutu |
|------------|-----------|
| Sadece docs/script | sync + `vm_demo_gate` |
| C kaynak (.c) | sync + **`vm_build_binary`** + `vm_demo_gate` |
| Dashboard | laptop `dashboard_refresh.sh` (VM değil) |

Opsiyonel demo kanıtı (laptop — Grafana stack):

```bash
bash scripts/ops_alert_e2e.sh
# veya parca parca:
bash scripts/grafana_alert_e2e.sh
sudo bash scripts/webhook_prod_e2e.sh
```

Detay: [VPS_SETUP.md](VPS_SETUP.md) §7 · `rsync -a /mnt/lg/` **kullanma** · `vmlinux.h` sync edilmez.

## Clone notu

GitHub repo adı geçiş döneminde `loganalyzer`; ürün adı **Linux Log Guardian**, binary `log-guardian`.  
[BRANDING.md](BRANDING.md)
