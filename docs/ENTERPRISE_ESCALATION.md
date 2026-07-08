# Enterprise escalation — operatör playbook

**Hedef:** P1–P4 olaylarda kim ne yapar, hangi kanıt scripti çalışır, Telegram + edge zinciri nasıl doğrulanır.

İlgili: [ENTERPRISE_SUPPORT.md](ENTERPRISE_SUPPORT.md) · [WEBHOOK_SETUP.md](WEBHOOK_SETUP.md) · [EDGE_PROTECTION.md](EDGE_PROTECTION.md) · [HOSTING_RUNBOOK_TR.md](HOSTING_RUNBOOK_TR.md)

---

## Önem dereceleri

| Seviye | Örnek | İlk yanıt | Kanıt |
|--------|--------|-----------|--------|
| **P1** | Ban hattı tamamen durdu, site açık saldırı altında | 15 dk | `post_install_verify` FAIL>0 |
| **P2** | Telegram alarm gitmiyor / yanlış WL-Sessiz | 1 saat | `telegram_soc_gate` |
| **P3** | Edge nginx rate limit / threat intel gecikmesi | 4 saat | `edge_protection_gate` |
| **P4** | Dashboard vitrin / rapor tazeliği | 1 iş günü | `competitive_proof.sh` |

---

## P1 — Ban hattı / servis

```bash
sudo log-guardian --status --quiet | jq '.ipc, .xdp_mode, .db.bans_active'
sudo systemctl status log-guardian log-guardian-daemon nginx
bash scripts/post_install_verify.sh
```

Beklenen: `ipc=ok`, daemon active, nginx `log_guardian` format.

Onarım sırası:

1. `sudo bash scripts/repair_no_xdp_stack.sh`
2. `sudo systemctl restart log-guardian log-guardian-daemon`
3. `bash scripts/edge_protection_gate.sh`

---

## P2 — Telegram operatör zinciri

**Hosting operatör özeti:** [HOSTING_RUNBOOK_TR.md](HOSTING_RUNBOOK_TR.md) §8b (kurulum + günlük NOC tablosu).

**Akış:** log → WAF → ban → Telegram (batch WARN/INFO · CRIT/ban anında)

| Adım | Operatör aksiyonu | Komut / UI |
|------|-------------------|------------|
| Alarm | KRİTİK / IP BANLANDI mesajı | Telegram |
| Gördüm | Inline **Gördüm** | ack → DB + SOC timeline |
| Yanlış WL/Sessiz | **Sesi aç** veya host undo | `bash scripts/telegram_operator_undo.sh <IP>` |
| Doğrulama | Üç yüzey birlikte | Dashboard `#webhook-ops` · `#soc-timeline` · `/bans?search=` |

**SOC derin link (harita ↔ timeline senkron filtre):**

| Hash | Filtre |
|------|--------|
| `#soc-timeline` | Tümü |
| `#soc-ban` | Ban |
| `#soc-ack` | Telegram ack |
| `#soc-lineage` | eBPF lineage |
| `#soc-incident` | Incident |
| `#soc-waf` | WAF |

Örnek: `https://localhost:8443/#soc-ban` — nav badge · harita · timeline aynı ban katmanını gösterir.

```bash
bash scripts/telegram_soc_gate.sh
bash scripts/telegram_operator_undo_e2e.sh   # kanıt (RFC5737 IP)
sudo bash scripts/webhook_prod_e2e.sh        # tam prod zincir (root)
```

**SIGUSR2 undo:** `telegram_operator_undo.sh` → `log-guardian` SIGUSR2 — poll kesintisiz.

---

## P3 — Edge / origin

Wi‑Fi / laptop: **ipset-fallback** bilinçli (XDP OFF normal).

```bash
bash scripts/edge_protection_gate.sh
bash scripts/prod_nic_xdp_check.sh
sudo bash scripts/prod_edge_setup.sh    # prod origin sertleştirme
bash scripts/nginx_attack_test.sh       # SQLi ingest (127.0.0.1 whitelist → ban atlanır OK)
```

CDN/origin: [EDGE_PROTECTION.md](EDGE_PROTECTION.md) — Cloudflare `real_ip`, nginx snippet, threat-intel özet DB.

---

## P3b — Filo / çoklu host

VM veya agent Offline ise önce keepalive, sonra dispatch:

```bash
bash scripts/vm_fleet_gate.sh
bash scripts/fleet_multi_node_e2e.sh
STALE_HOURS=48 bash scripts/fleet_prune_pending_commands.sh   # >48h takili komutlar
bash scripts/vm_demo_host.sh          # host: VM bekle + filo kapısı
```

Beklenen: `/fleet` üzerinde `node-kurtulus-01` + `node-vm-02` **Online** · `vm-fleet-gate-report.json` pass.

VM guest (tek komut): `sudo bash /mnt/lg/scripts/vm_refresh_from_host.sh`

---

## P4 — Kanıt / vitrin

```bash
bash scripts/install_operator_cron.sh      # cron matrisi (asagida)
bash scripts/morning_operator_chain.sh     # gunluk tam zincir (~5–8 dk)
# veya: bash scripts/morning_operator_gate.sh  # hizli gate (~30 sn)
bash scripts/weekly_operator_ritual.sh     # haftalik kanit + evidence + mTLS sure
bash scripts/core_proof_refresh.sh         # haftalik Track A
bash scripts/finish_vitrin_plan.sh         # tam vitrin; PUBLISH=1 canli site
bash scripts/competitive_proof_build.py
bash scripts/sync_dashboard_data.sh
bash scripts/dashboard_refresh.sh
bash scripts/website_preview_gate.sh
bash scripts/enterprise_e9_verify.sh       # E9 tek kapı (dok + zincir)
# Enterprise SOAR aciksa: ENTERPRISE_SOAR=1 bash scripts/enterprise_e9_verify.sh
```

**Filo pending temizligi:** Demo öncesi veya haftalık — `bash scripts/fleet_prune_pending_commands.sh` · cron: `bash scripts/install_fleet_prune_cron.sh` (Pazar 09:30). Detay: [FLEET_ONLINE.md](FLEET_ONLINE.md) §5.

### Operatör cron (`install_operator_cron.sh` + Sprint 7+)

| Zaman | Script | Log |
|-------|--------|-----|
| Her gün 08:00 | `morning_operator_gate.sh` | `~/lg-morning-operator-gate.log` |
| Cuma 10:00 | `weekly_operator_ritual.sh` | `~/lg-weekly-operator.log` |
| Pazar 03:00 | `core_proof_refresh.sh` | `~/lg-core-proof-refresh.log` |
| Pazar 03:15 / 09:30 | `fleet_prune_pending_commands.sh` (48h+) | `~/lg-fleet-prune*.log` |
| Pazar 04:30 | `intel_ban_db_prune_cron.sh` | `~/lg-intel-ban-db-prune.log` |
| Pazar 08:00 | `webhook_metrics_reset.sh` | `~/lg-webhook-metrics-reset.log` |
| Pazartesi 06:00 | `operator_security_weekly.sh` | `~/lg-operator-security-weekly.log` |
| Ayın 1'i 05:00 | `operator_post_install_strict.sh` | `~/lg-post-install-strict.log` |

Internet-facing strict (manuel): `POST_INSTALL_STRICT=1 bash scripts/post_install_verify.sh`

Harici SOAR ban API (Enterprise backlog): [BAN_API_MTLS_DESIGN.md](BAN_API_MTLS_DESIGN.md) — mTLS edge + `API_MUTATION_TOKEN` ayrımı.

Dashboard: `https://localhost:8443/tests` (**85 kart**) · Site: `https://ceniklinuxlogguardian.org/tests`

---

## P3c — Dashboard / internet-facing güvenlik

Laptop demo `:8443` LAN açık olabilir; **internet-facing** makinede kapatın:

```bash
sudo bash scripts/firewall_dashboard_bind.sh install
bash scripts/check_dashboard_tls_bind.sh
bash scripts/laptop_harden_check.sh
```

VM filo (VirtualBox NAT `10.0.2.0/24`) firewall kuralında izinlidir — `docker-compose` `127.0.0.1:8443` bind filo telemetry'yi kırabilir.

---

## P3d — Intel ban DB (TTL / boyut)

Ban mantığına dokunmaz; özet satır + TTL prune:

```bash
WARN_ONLY=1 bash scripts/intel_ban_db_ops_check.sh
sudo log-guardian ban-db-prune --ttl-days 7
bash scripts/intel_ban_db_prune_cron.sh
```

Haftalık cron için sudoers: `scripts/sudoers-ban-db-prune.example` → `/etc/sudoers.d/log-guardian-ban-db-prune`

Edge checklist özeti: `bash scripts/edge_protection_checklist.sh` → `edge-protection-checklist-report.json`

---

## Escalation matrisi (plan)

| Rol | P1 | P2 | P3 |
|-----|----|----|-----|
| L1 operatör | `repair_no_xdp_stack` · nginx reload | Telegram ack/undo · `telegram_soc_gate` | `edge_protection_gate` |
| L2 mühendis | IPC/daemon root cause · ipset | `webhook_prod_e2e` · bot webhook | `prod_edge_setup` · XDP NIC |
| Müşteri bilgilendirme | Ban etkisi + ETA | Alarm özeti + false positive notu | Edge öneri (CDN) |

---

## Laptop kanıt (80 test)

| Kapı | Script |
|------|--------|
| E9 zincir | `enterprise_e9_verify.sh` |
| Kurulum | `post_install_verify.sh` |
| Sabah operatör | `morning_operator_gate.sh` |
| Telegram SOC | `telegram_soc_gate.sh` |
| Edge | `edge_protection_gate.sh` |
| Edge checklist | `edge_protection_checklist.sh` |
| Grafana parity | `grafana_parity_gate.sh` |
| Site preview | `website_preview_gate.sh` |
| VM host prep | `vm_host_prep_gate.sh` |
| Docs consistency | `docs_consistency_gate.sh` |
| VM fleet | `vm_fleet_gate.sh` |
| Laptop excellence | `laptop_excellence_gate.sh` |
| Website live | `website_live_gate.sh` |
| Release ready | `release_ready_gate.sh` |
| Demo rehearsal | `demo_rehearsal_gate.sh` |

```bash
bash scripts/enterprise_e9_verify.sh
bash scripts/enterprise_escalation_gate.sh
bash scripts/vm_host_prep_gate.sh
bash scripts/docs_consistency_gate.sh
bash scripts/vm_fleet_gate.sh
bash scripts/laptop_excellence_gate.sh
```
