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
bash scripts/vm_demo_host.sh          # host: VM bekle + filo kapısı
```

Beklenen: `/fleet` üzerinde `node-kurtulus-01` + `node-vm-02` **Online** · `vm-fleet-gate-report.json` pass.

VM guest (tek komut): `sudo bash /mnt/lg/scripts/vm_refresh_from_host.sh`

---

## P4 — Kanıt / vitrin

```bash
bash scripts/morning_operator_gate.sh   # laptop_core + presentation + :8443
bash scripts/competitive_proof.sh
bash scripts/sync_dashboard_data.sh
bash scripts/dashboard_refresh.sh
bash scripts/website_preview_gate.sh
```

Dashboard: `https://localhost:8443/tests` (**76 kart**) · Site: `cd landing && npm run dev`

---

## Escalation matrisi (plan)

| Rol | P1 | P2 | P3 |
|-----|----|----|-----|
| L1 operatör | `repair_no_xdp_stack` · nginx reload | Telegram ack/undo · `telegram_soc_gate` | `edge_protection_gate` |
| L2 mühendis | IPC/daemon root cause · ipset | `webhook_prod_e2e` · bot webhook | `prod_edge_setup` · XDP NIC |
| Müşteri bilgilendirme | Ban etkisi + ETA | Alarm özeti + false positive notu | Edge öneri (CDN) |

---

## Laptop kanıt (76 test)

| Kapı | Script |
|------|--------|
| Kurulum | `post_install_verify.sh` |
| Telegram SOC | `telegram_soc_gate.sh` |
| Edge | `edge_protection_gate.sh` |
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
bash scripts/enterprise_escalation_gate.sh
bash scripts/vm_host_prep_gate.sh
bash scripts/docs_consistency_gate.sh
bash scripts/vm_fleet_gate.sh
bash scripts/laptop_excellence_gate.sh
```
