# Laptop operasyon rehberi

VPS veya GitHub olmadan **Linux Log Guardian** kurulum, güvenlik ve test.  
Core quickstart: [QUICKSTART_NGINX.md](QUICKSTART_NGINX.md)

## Script matrisi (hangi iş ne yapar?)

| Script | Ne zaman | Parolaya dokunur? |
|--------|----------|-------------------|
| `sudo bash install.sh` | İlk kurulum | Hayır (demo `DegistirBeni!123` kalır) |
| `sudo bash scripts/install_first_run.sh` | Kurulum sonrası tek komut (API, firewall, IPC, FP warmup) | Hayır |
| `sudo bash scripts/repair_no_xdp_stack.sh` | `--no-xdp` sonrasi daemon unit + servisler + fleet log sustur | Hayır |
| `bash scripts/post_install_verify.sh` | Tek komut yeşil/kırmızı kurulum matrisi | Hayır |
| `sudo bash scripts/ensure_api_security.sh` | API `:8090` — bind + token + firewall | **Hayır** |
| `bash scripts/api_fail_closed_test.sh` | Token yokken ban/consult 403 | Hayır |
| `bash scripts/install_audit_cron.sh` | Haftalık `local_security_audit` cron | Hayır |
| `bash scripts/install_fp_report_cron.sh` | Haftalık FP raporu | Hayır |
| `sudo bash scripts/rotate_api_token.sh` | API_TOKEN yenile + nginx/dashboard | Hayır |
| `bash scripts/publish_soak_report.sh` | Soak JSON → `docs/evidence/` | Hayır |
| `sudo bash scripts/ipv6_ban_e2e.sh` | IPv6 ban kanıtı (ipset v6) | Hayır |
| `bash scripts/sync_dashboard_api_token.sh` | Dashboard ban butonu | Hayır |
| `bash scripts/laptop_jwt_setup.sh` | JWT `.env` + dashboard restart | Hayır (opsiyonel `DASHBOARD_ADMIN_PASSWORD`) |
| `sudo bash scripts/laptop_harden.sh` | İnternete açık sunucu — tam sertleştirme | **Evet** |
| `bash scripts/laptop_harden_check.sh` | Hızlı denetim | — |
| `bash scripts/local_security_audit.sh` | Tam güvenlik denetimi | — |
| `bash scripts/fp_learn_warmup.sh` | FP ısınma (corpus) | Hayır |
| `sudo bash scripts/install_fp_trust_prod.sh` | Warmup → `/etc/log-guardian/data/fp-trust.lst` | Hayır |
| `SOAK_1H=1 bash scripts/laptop_soak_72h.sh --start` | 1 saat stabilite (soak kilidi aktif) | Hayır |
| `bash scripts/soak_5m.sh` | 5 dk stabilite (ön planda, ~5 dk) | Hayır |
| `bash scripts/laptop_fp_setup.sh` | FP warmup + prod store tek komut | Hayır |
| `bash scripts/laptop_soak_72h.sh --start` | 72 saat stabilite (`SOAK_GRACE_SEC=120`) | Hayır |
| `bash scripts/laptop_sprint_gate.sh` | Sprint 1–3 laptop kapısı (VPS/GitHub yok) | Hayır |
| `bash scripts/test_deb_local.sh` | `.deb` extract doğrulama (dpkg -i değil) | Hayır |
| `bash scripts/demo_3min.sh` | 3 dk demo (PDF, webhook, dashboard opsiyonel) | Hayır |
| `bash scripts/preview_website.sh` | Statik landing önizleme `:8765` | Hayır |
| `bash scripts/website_deploy_gate.sh` | Site build + deploy paketi + audit + smoke | Hayır |
| `wrangler pages deploy assets/website-deploy --project-name=linux-log-guardian-website --branch=main` | Canlı site güncelleme | Hayır |
| `bash scripts/pre_push_secret_scan.sh` | GitHub öncesi token tarama | Hayır |
| `bash scripts/website_kill_ports.sh` | 8765/8767 önizleme süreçlerini kapat (Cursor sandbox hariç) | Hayır |
| `bash scripts/website_smoke.sh` | Deploy HTTP/baslik testi (domain gerekmez) | Hayır |
| `LG_WEBSITE_PREVIEW=deploy bash scripts/preview_website.sh` | Prod paketi önizleme | Hayır |
| `bash scripts/soak_status.sh` | Soak PID + rapor özeti | Hayır |
| `bash scripts/dashboard_stack.sh` | Grafana + TLS dashboard + JWT | Hayır |
| `bash scripts/laptop_stack_boot.sh` | Eksik container’ları ayağa kaldır (reboot sonrası) | Hayır |
| `bash scripts/laptop_observability_check.sh` | Filo grafikleri + Prometheus/Grafana yeşil/kırmızı | Hayır |
| `bash scripts/prometheus_smoke.sh` | Prometheus UI sorgu doğrulama + kopyala-yapıştır PromQL | Hayır |
| `bash scripts/grafana_stack.sh` | Prometheus :9090 + Grafana :3002 + provision | Hayır |
| `bash scripts/grafana_provision.sh` | Dashboard + alert yeniden yükle | Hayır |
| `bash scripts/install_laptop_stack_boot.sh` | Reboot’ta otomatik stack (user systemd) | Hayır (linger için sudo isteyebilir) |
| `sudo bash scripts/install_threat_intel_stack.sh` | Firehol threat intel (key yok, **internet gerekir**) | Hayır |
| `sudo bash scripts/install_threat_feed_live.sh` | AbuseIPDB/OTX (key opsiyonel; doluysa ~30 sn–2 dk) | Hayır |
| `bash scripts/threat_intel_status.sh` | Firehol + API feed durumu | Hayır |
| `bash scripts/threat_feed_live_proof.sh` | Threat intel kanıt JSON | Hayır |

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
bash scripts/dashboard_stack.sh
```

- **JWT:** kök `.env` → `JWT_SECRET` (gitignore — commit etmeyin)
- **Giriş:** kullanıcı `admin` — parola:
  - `.env` içinde `DASHBOARD_ADMIN_PASSWORD` varsa o
  - yoksa seed varsayılanı: `ChangeMeOnFirstLogin!`
- **URL:** `https://localhost:8443`

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

Kontrol: `https://localhost:8443/` (Filo) — sarı “Prometheus yok” uyarısı gitmeli. Eski `/fleet` bookmark otomatik ana sayfaya yönlenir; detaylı komut: `/fleet/dispatch`.

## FP trust prod

Prod varsayılan: `FP_LEARN=1`, `FP_TRUST_DAYS=30` (`install.sh`). Warmup sadece başlangıç.

```bash
bash scripts/fp_learn_warmup.sh
sudo bash scripts/install_fp_trust_prod.sh
sudo systemctl restart log-guardian
```

Veya tek komut: `sudo bash scripts/install_first_run.sh`

Warmup çıktısı: `data/fp-trust-warmup.lst` (mutlak yol; overlay `/tmp` hatası giderildi).

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

## Clone notu

GitHub repo adı geçiş döneminde `loganalyzer`; ürün adı **Linux Log Guardian**, binary `log-guardian`.  
[BRANDING.md](BRANDING.md)
