# Sprint hedefleri — Linux Log Guardian

**Açık kaynak · Türk topluluk · ölçülebilir kanıt.** Her sprint bitince `[x]` işaretle.

Son güncelleme: 2026-06-29

---

## Sprint G — Opsiyonel polish (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| G1 | CI merge gate açık | `.github/workflows/build.yml` → `competitive_gate.sh` | ✅ |
| G2 | 51/51 test yeşil (laptop VPS skip) | `vps-xdp-kernel` skip → pass | ✅ |
| G3 | Fleet gürültü temizliği | `STALE_HOURS=1 bash scripts/fleet_prune_stale.sh` | ✅ |
| G4 | Site + dashboard parity | `bash scripts/optional_polish_refresh.sh` | ✅ |
| G5 | Release pack `.deb` | `github_release_pack.sh` → `deb/` | ✅ |
| G6 | FP trust prod (opsiyonel) | `bash scripts/optional_polish_refresh.sh --fp-trust` | ✅ 14 satir |

```bash
bash scripts/optional_polish_refresh.sh
STALE_HOURS=1 bash scripts/fleet_prune_stale.sh
bash scripts/fleet_prune_pending_commands.sh
```

**Not:** 72h soak **tamam** (`soak-report.json` → 72.0h, 864 örnek, 0 fail). Tekrar koşma / önerme yok.

---

## Sprint H — Operasyon sertleştirme (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| H1 | Canlı site 51 test deploy | `website_live_check` → 51 kart | ✅ |
| H2 | Daemon io_uring laptop modu | `ensure_daemon_env.sh` → `LG_DISABLE_URING=1` | ✅ |
| H3 | Host fleet reboot-safe | `host_fleet_agent_setup.sh --install-user-service` | ✅ |
| H4 | VM fleet reboot-safe | `vm_fleet_agent_setup.sh --install-user-service` | ✅ |
| H5 | Git branch temizliği | `feat/telegram-webhook-p2` review | ⏸️ (kullanıcı sonra) |
| H6 | VPS kernel-XDP | sunucu gelince | ⏸️ |
| H7 | GitHub push / release | `release_prep_no_github.sh` | ⏸️ |

---

## Sprint I — Kanıt tazeliği + ops (devam)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| I1 | Yerel kanıt paketi | `local_proof_refresh.sh` → `release_ready_check` | ✅ |
| I2 | Filo multi-host e2e | `FLEET_AGENT_B=node-vm-02 fleet_multi_node_e2e.sh` | ✅ |
| I3 | Dashboard `/tests` sync | `sync_dashboard_data.sh` + Ctrl+Shift+R (51 kart) | ✅ |
| I4 | Enterprise destek runbook (E9) | `docs/ENTERPRISE_SUPPORT.md` polish | ✅ |
| I5 | EDGE_PROTECTION laptop checklist | `docs/EDGE_PROTECTION.md` laptop maddeleri | ✅ |
| I6 | VPS kernel-XDP | sunucu gelince | ⏸️ |

```bash
# I1 — kanıt PDF/ZIP (GitHub push yok)
bash scripts/local_proof_refresh.sh

# Canlı site deploy (prod branch)
LG_WEBSITE_PUBLISH=1 bash scripts/website_publish.sh
```

---

## Sprint J — Opsiyonel katmanlar (devam)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| J1 | Opsiyonel katman kapısı | `optional_layers_gate.sh` | ✅ |
| J2 | K8s admission JSON | `k8s_admission_test.sh` (kind-live) | ✅ |
| J3 | K8s kind e2e (dry-run) | `k8s_kind_e2e.sh` | ✅ |
| J4 | Mesh etcd docker smoke | `mesh_etcd_docker_smoke.sh` | ✅ |
| J5 | K8s canlı kind cluster | `K8S_KIND_BUILD=1 K8S_KIND_APPLY=1 k8s_kind_e2e.sh` | ✅ live-ready |
| J6 | Mesh prod cluster | docker live PUT/GET + VPS multi-node | ✅ laptop · ⏸️ VPS |

```bash
# Opsiyonel katmanlar (laptop)
bash scripts/optional_layers_gate.sh

# K8s kind canli (docker + kind gerekir, ~10-15 dk)
K8S_KIND_CREATE=1 K8S_KIND_BUILD=1 K8S_KIND_APPLY=1 bash scripts/k8s_kind_e2e.sh

# Mesh etcd docker lab
bash scripts/mesh_etcd_docker_smoke.sh
```

---

## Sprint K — Vitrin + laptop hijyen (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| K1 | Canlı site 51 test | `website_publish.sh` + CF purge (SRI) | ✅ |
| K2 | Ban listesi temizliği | `FLUSH=1 bash scripts/laptop_ban_cleanup.sh` | ✅ |
| K3 | Yerel kanıt paketi | `bash scripts/local_proof_refresh.sh` | ✅ |
| K4 | VM demo gate | `vm_refresh_from_host.sh` FAIL=0 + fleet keepalive | ✅ |
| K5 | `.deb` yenile | `log-guardian_0.c9b9af1_amd64.deb` | ✅ |
| K6 | VPS kernel-XDP | sunucu gelince | ⏸️ |
| K7 | Git push / release | kullanıcı onayı | ⏸️ |

```bash
# Site vitrin (51 test)
bash scripts/website_sync_tests.sh
LG_WEBSITE_PUBLISH=1 bash scripts/website_publish.sh

# Laptop ban — API bos olsa ipset okur; tam sifir:
bash scripts/laptop_ban_cleanup.sh                   # dry-run
APPLY=1 bash scripts/laptop_ban_cleanup.sh           # tek tek unban
FLUSH=1 bash scripts/laptop_ban_cleanup.sh           # ipset flush + kanit onizleme
# repair_ipset_v4 ban TEMIZLEMEZ (DB geri yukler)

# VM
sudo bash scripts/vm_refresh_from_host.sh
bash scripts/vm_fleet_agent_setup.sh --install-user-service

# Kanit paketi (K3)
bash scripts/local_proof_refresh.sh
```

---

## Sprint L — Kanıt paketi + release hazırlık (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| L1 | Yerel kanıt paketi | `local_proof_refresh.sh` + `release_ready_check` | ✅ |
| L2 | Dashboard 51/51 yeşil | `dashboard_refresh.sh` → `:8443/tests` | ✅ |
| L3 | CF SRI purge | live check OK (token opsiyonel) | ✅ |
| L4 | Opsiyonel katman kapısı | `optional_layers_gate.sh` FAIL=0 | ✅ |
| L5 | Git branch + release prep | `release_prep_no_github.sh` | ✅ |
| L6 | VPS kernel-XDP | sunucu gelince | ⏸️ |

```bash
bash scripts/dashboard_refresh.sh
bash scripts/optional_layers_gate.sh
bash scripts/release_prep_no_github.sh
LG_CF_PURGE=1 LG_WEBSITE_PUBLISH=1 bash scripts/website_publish.sh
```

---

## Sprint M — Release prep + site SRI (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| M1 | Release prep kapısı | `release_prep_no_github.sh` — 51 test | ✅ |
| M2 | Site 51 + live SRI | `website_publish` | ✅ |
| M3 | VM host sync | `vm_refresh_from_host.sh` FAIL=0 | ✅ |
| M4 | K8s kind live-ready | `k8s_kind_e2e.sh` pass=true | ✅ |
| M5 | Git push / release | kullanıcı onayı | ⏸️ |
| M6 | VPS kernel-XDP | sunucu gelince | ⏸️ |

---

## Sprint N — Köşe temizlik (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| N1 | Docs 48→51 senkron | `SCOPE_COVERAGE` + vitrin dokümanları | ✅ |
| N2 | Fleet stale prune | `STALE_HOURS=1 fleet_prune_stale.sh` | ✅ |
| N3 | VM fleet keepalive | `vm_fleet_agent_setup.sh --install-user-service` | ✅ |
| N4 | Live demo cleanup | `CLEANUP=1 dashboard_live_demo.sh` | ✅ |
| N5 | Git push / release | kullanıcı onayı | ⏸️ |

```bash
STALE_HOURS=1 bash scripts/fleet_prune_stale.sh
bash scripts/fleet_prune_pending_commands.sh
# VM icinde:
bash scripts/vm_fleet_agent_setup.sh --install-user-service
CLEANUP=1 bash scripts/dashboard_live_demo.sh
```

## Sprint O — İstihbarat + güvenlik kapatma (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| O1 | TAXII confidence gate | `taxii_feed_sync.sh` + `TAXII_MIN_CONFIDENCE` | ✅ |
| O2 | TAXII e2e + dashboard kart | `taxii_feed_e2e.sh` → 55 test | ✅ |
| O3 | Parser fuzz | `parser_fuzz_e2e.sh` (536+ run) | ✅ |
| O4 | `security_closure_gate` genişletme | fuzz + ban audit + lineage incident | ✅ |
| O5 | Lineage → incident (tek senaryo) | `lineage_incident_e2e.sh` | ✅ |
| O6 | OPENAPI_STRICT + ban audit | `ban_policy_audit_e2e.sh` | ✅ |
| O7 | TAXII canlı URL (opsiyonel VPS) | `rules.conf` `TAXII_URL=` · laptop fixture yeterli | ⏸️ |
| O8 | Dashboard kartları (fuzz/audit/incident) | `/tests` 55 kart | ✅ |

```bash
bash scripts/taxii_feed_e2e.sh          # laptop — URL gerekmez
bash scripts/security_closure_gate.sh   # SKIP_DOCKER=1 hizli
```

---

## Sprint P — Threat intel + TAXII prod bağlantısı (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| P1 | `rules.conf` TAXII okuma | `taxii_feed_sync.sh` + `lg_rules_kv` | ✅ |
| P2 | Timer hook (URL varsa) | `log-guardian-taxii-sync` · `taxii_sync_hook.sh` | ✅ |
| P3 | THREAT_INTEL_SETUP TAXII bölümü | `docs/THREAT_INTEL_SETUP.md` | ✅ |
| P4 | COMPETITIVE_STATUS 55 test | `docs/COMPETITIVE_STATUS.md` | ✅ |

---

## Sprint Q — Laptop öncelik kapısı (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| Q1 | Fleet stale prune | `STALE_HOURS=1 fleet_prune_stale.sh` | ✅ |
| Q2 | VM sync + demo gate | `vm_sync_from_host.sh` → `vm_demo_gate.sh` | ✅ (kullanıcı) |
| Q3 | Kanıt paketi tazele | `local_proof_refresh.sh` | ✅ |
| Q4 | Excellence gate 55 | `laptop_excellence_gate.sh` 0 FAIL | ✅ |
| Q5 | FULL vitrin + filo e2e | `FULL=1 laptop_excellence_gate.sh` | ✅ (15 OK · 0 WARN · 0 FAIL) |
| Q6 | VPS kernel-XDP | `vps_bootstrap.sh` | ⏸️ |
| Q7 | GitHub push / release | kullanıcı onayı | ⏸️ |

```bash
STALE_HOURS=1 bash scripts/fleet_prune_stale.sh
bash scripts/local_proof_refresh.sh
FULL=1 bash scripts/laptop_excellence_gate.sh
```

---

## Sprint R — Mükemmellik sıfır uyarı (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| R1 | `laptop_security_excellence` | `APPLY=1` + audit log izin düzeltmesi | ✅ |
| R2 | Canlı site SRI (Playwright) | `website_live_check` 55 kart | ✅ |
| R3 | FULL gate sıfır uyarı | `FULL=1 laptop_excellence_gate` **15 OK · 0 WARN** | ✅ |
| R4 | E9 + OpenAPI strict dok | `ENTERPRISE_SUPPORT` · `COMPETITIVE_STATUS` T3 | ✅ |

```bash
APPLY=1 bash scripts/laptop_security_excellence.sh
bash scripts/website_live_check.sh
FULL=1 bash scripts/laptop_excellence_gate.sh
```

---

## Sprint S — Opsiyonel katman derinleştirme (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| S1 | K8s kind **live-ready** | 3/3 pod Running | ✅ |
| S2 | Mesh etcd canlı PUT/GET | `mesh_etcd_live_e2e.sh` | ✅ |
| S3 | `optional_layers_gate` genişletme | 14 OK · phase5 + wasm native | ✅ |
| S4 | Dashboard kart `mesh-etcd-live` | `/tests` **56 kart** | ✅ |

```bash
K8S_KIND_CREATE=1 K8S_KIND_BUILD=1 K8S_KIND_APPLY=1 bash scripts/k8s_kind_e2e.sh
bash scripts/mesh_etcd_live_e2e.sh
bash scripts/optional_layers_gate.sh
bash scripts/dashboard_refresh.sh
```

---

## Sprint T — L7 + Telegram webhook prod (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| T1 | L7 probe canlı | `l7_probe_prod_e2e` · journal `l7=ON` | ✅ |
| T2 | Webhook smoke | `webhook_smoke_test` | ✅ |
| T3 | `webhook.env` prod | `/etc/log-guardian/webhook.env` | ✅ |
| T4 | BPF + filo sudo bitiş | `sudo laptop_optional_layers_on.sh` | ✅ |
| T5 | Telegram /start + test | `webhook_install_prod.sh --test-all` | ✅ |

```bash
bash scripts/laptop_optional_layers_preflight.sh
sudo bash scripts/laptop_optional_layers_on.sh
sudo bash scripts/webhook_install_prod.sh --test-all   # Telegram /start sonrasi
sudo bash scripts/webhook_prod_e2e.sh                  # log → ban → Telegram
```

---

## Sprint W — SOC + Telegram operatör (devam)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| W1 | SOC timeline WAF katmanı | `/api/soc-timeline` + `guardian-status` | ✅ |
| W2 | Telegram inline teshis | `telegram_inline_button_check.sh` | ✅ |
| W3 | Gördüm canlı (kullanıcı) | Telegram buton + ack metrik | ✅ |
| W4 | WL / Sessiz / Unban geri al | `telegram_operator_undo.sh` (SIGUSR2) | ✅ |
| W5 | Telegram **Sesi aç** butonu | `undo:IP` inline + toast | ✅ |
| W6 | Undo E2E kapısı | `telegram_operator_undo_e2e.sh` | ✅ |
| W7 | SOC timeline Telegram ack | `--status` `recent_telegram_acks` + `/api/soc-timeline` | ✅ |
| W8 | Undo E2E dashboard kartı | `/tests` + Webhook panel + sync | ✅ |

---

## Sprint X — 57/57 vitrin + attack map ack (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| X1 | Dashboard 57/57 yeşil | `telegram-operator-undo-e2e` kartı | ✅ |
| X2 | Attack map Telegram ack | `/api/attack-geo` emerald pin | ✅ |
| X3 | competitive-proof 57 | `competitive_proof_build.py` + sync | ✅ |
| X4 | Statik site 57 test | `website_sync_tests.sh` (publish yok) | ✅ |

```bash
sudo bash scripts/telegram_operator_undo_e2e.sh
bash scripts/sync_dashboard_data.sh
bash scripts/website_sync_tests.sh
bash scripts/dashboard_refresh.sh
```

---

## Sprint Y — Telegram SOC birleşik kapı (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| Y1 | SOC + map + webhook gate | `telegram_soc_gate.sh` | ✅ |
| Y2 | Attack map kind metrikleri | `attack_map_e2e` ack/ban sayaci | ✅ |
| Y3 | `/tests` 58. kart | `telegram-soc-gate` + sync | ✅ |
| Y4 | optional_layers gate | `telegram_soc_gate` satiri | ✅ |

```bash
bash scripts/telegram_soc_gate.sh
bash scripts/attack_map_e2e.sh
bash scripts/website_sync_tests.sh
bash scripts/sync_dashboard_data.sh
```

---

## Sprint Z — Bans + Telegram operatör (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| Z1 | `/api/telegram-acks` | `guardian-status` recent acks | ✅ |
| Z2 | Bans sayfası ack rozeti | yeşil ✓ satırda | ✅ |
| Z3 | Undo komut paneli | IP aramasında copy | ✅ |

```bash
# https://localhost:8443/bans?search=203.0.113.198
bash scripts/dashboard_refresh.sh
```

---

## Sprint AA — Bans ack API kapısı (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| AA1 | `telegram_soc_gate` + bans ack | `/api/telegram-acks` 4. yüzey | ✅ |
| AA2 | Bans Telegram e2e | `bans_telegram_ops_e2e.sh` | ✅ |
| AA3 | optional_layers | gate satırları | ✅ |

---

## Sprint AB — Prod E2E → Bans kanıt (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| AB1 | `webhook_prod_e2e` [2b/4] | `REQUIRE_BAN=1` bans ops (ban anında) | ✅ |
| AB2 | `/tests` 59. kart | `bans-telegram-ops` | ✅ |
| AB3 | Prod sonu sync | soc gate + raporlar | ✅ |

```bash
sudo bash scripts/webhook_prod_e2e.sh   # Telegram + [2b/4] ban_search=True
bash scripts/sync_dashboard_data.sh
```

```bash
bash scripts/bans_telegram_ops_e2e.sh
bash scripts/telegram_soc_gate.sh
bash scripts/sync_dashboard_data.sh
```

---

## Sprint AI — VM host prep kapısı (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| AI1 | HOST sync öncesi kanıt | `vm_host_prep_gate.sh` | ✅ |
| AI2 | vm_sync footer | host prep hatırlatması | ✅ |
| AI3 | `/tests` 64. kart | `vm-host-prep-gate` | ✅ |

```bash
bash scripts/vm_host_prep_gate.sh
# VM: sudo bash scripts/vm_sync_from_host.sh → vm_build_binary.sh → vm_demo_gate.sh
```

---

## Sprint AJ — HOSTING_RUNBOOK Telegram cross-link (tamamlandı)

| # | Hedef | Çıktı | Durum |
|---|--------|--------|-------|
| AJ1 | TR runbook §8b | Telegram NOC tablosu + kurulum komutları | ✅ |
| AJ2 | ENTERPRISE_ESCALATION P2 | `HOSTING_RUNBOOK_TR.md` §8b geri bağlantı | ✅ |
| AJ3 | İlgili linkler | `WEBHOOK_SETUP` + `ENTERPRISE_ESCALATION` çift yönlü | ✅ |

---

## Sprint AK — Docs consistency kapısı (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| AK1 | Script matrisi | `docs_consistency_check.sh` — 64+ test + §8b | ✅ |
| AK2 | JSON kapı | `docs_consistency_gate.sh` | ✅ |
| AK3 | `/tests` 65. kart | `docs-consistency-gate` | ✅ |

```bash
bash scripts/docs_consistency_gate.sh
```

---

## Sprint AL — VM fleet keepalive kapısı (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| AL1 | LAPTOP_OPS filo § | `node-vm-02` + `vm_fleet_gate.sh` | ✅ |
| AL2 | JSON kapı | `vm_fleet_gate.sh` — iki düğüm Online | ✅ |
| AL3 | `/tests` 66. kart | `vm-fleet-gate` | ✅ |

```bash
bash scripts/vm_fleet_gate.sh
# VM: bash scripts/vm_fleet_agent_setup.sh --install-user-service
```

---

## Sprint AM — Laptop excellence kapısı (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| AM1 | Excellence JSON rapor | `laptop_excellence_gate.sh` → `laptop-excellence-gate-report.json` | ✅ |
| AM2 | Filo + docs zincir | vm_fleet + docs_consistency excellence içinde | ✅ |
| AM3 | `/tests` 67. kart | `laptop-excellence-gate` | ✅ |

```bash
bash scripts/laptop_excellence_gate.sh
FULL=1 bash scripts/laptop_excellence_gate.sh   # + live site + fleet e2e
```

---

## Sprint AN — Website live kapısı (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| AN1 | Canlı site parity JSON | `website_live_gate.sh` → `website-live-gate-report.json` | ✅ |
| AN2 | CSS + JS + kart sayısı | `website_live_css_check` + `website_live_js_check` | ✅ |
| AN3 | `/tests` 68. kart | `website-live-gate` | ✅ |

```bash
bash scripts/website_live_gate.sh
LG_WEBSITE_PUBLISH=1 bash scripts/website_publish.sh   # deploy sonrası otomatik gate
```

---

## Sprint AO — Release ready kapısı (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| AO1 | GitHub öncesi zincir JSON | `release_ready_gate.sh` → `release-ready-gate-report.json` | ✅ |
| AO2 | ZIP + docs + live + filo | `release_ready_check` + `docs_consistency` + `website_live` + `vm_fleet` | ✅ |
| AO3 | `/tests` 69. kart | `release-ready-gate` | ✅ |

```bash
bash scripts/release_ready_gate.sh
SKIP_LIVE=1 bash scripts/release_ready_gate.sh   # ağ yok
bash scripts/local_proof_refresh.sh              # tam kanıt paketi
```

---

## Sprint AU — Morning operator kapısı (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| AU1 | Sabah hızlı hazırlık | `morning_operator_gate.sh` → `morning-operator-gate-report.json` | ✅ |
| AU2 | Rapor öncelikli | demo_3min yok, mevcut gate'leri bozmaz | ✅ |
| AU3 | `/tests` 75. kart | `morning-operator-gate` | ✅ |

```bash
bash scripts/morning_operator_gate.sh
REFRESH=1 bash scripts/morning_operator_gate.sh   # laptop_core yenile
```

---

## Sprint AT — Laptop Core operatör kapısı (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| AT1 | Core üçgen (edge+SOC+ban) | `laptop_core_gate.sh` → `laptop-core-gate-report.json` | ✅ |
| AT2 | VPS/GitHub yok | daemon IPC + :8443 | ✅ |
| AT3 | `/tests` 74. kart | `laptop-core-gate` | ✅ |

```bash
bash scripts/laptop_core_gate.sh
SKIP_EDGE=1 bash scripts/laptop_core_gate.sh   # edge raporu yeterli
```

---

## Sprint AS — GitHub ship kapısı (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| AS1 | Push öncesi tam zincir | `github_ship_gate.sh` → `github-ship-gate-report.json` | ✅ |
| AS2 | ship + closure + secret | `presentation_ship` + `security_closure` + scan | ✅ |
| AS3 | `/tests` 73. kart | `github-ship-gate` | ✅ |

```bash
bash scripts/github_ship_gate.sh
LIVE_PUBLISH=1 WITH_FLEET=1 bash scripts/github_ship_gate.sh
SKIP_CLOSURE=1 bash scripts/github_ship_gate.sh   # hızlı
```

---

## Sprint AR — Demo video kapısı (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| AR1 | 04:00 kayıt hazırlık | `demo_video_gate.sh` → `demo-video-gate-report.json` | ✅ |
| AR2 | SIEM + PDF + ship + SOC | interaktif olmadan otomatik | ✅ |
| AR3 | `/tests` 72. kart | `demo-video-gate` | ✅ |

```bash
bash scripts/demo_video_gate.sh
LIVE_WEBHOOK=1 bash scripts/demo_video_gate.sh   # gerçek Telegram provası
bash scripts/demo_video.sh                         # interaktif kayıt (04:00)
```

---

## Sprint AQ — Presentation ship kapısı (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| AQ1 | Sunum + ship zinciri | `presentation_ship_gate.sh` → `presentation-ship-gate-report.json` | ✅ |
| AQ2 | demo_rehearsal + release_ready | tek komut, SKIP_LIVE varsayılan | ✅ |
| AQ3 | `/tests` 71. kart | `presentation-ship-gate` | ✅ |

```bash
bash scripts/presentation_ship_gate.sh
WITH_FLEET=1 bash scripts/presentation_ship_gate.sh   # VM filo dahil
LIVE_PUBLISH=1 bash scripts/presentation_ship_gate.sh # canli 71 kart yayini
```

---

## Sprint AP — Demo rehearsal kapısı (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| AP1 | Sunum hazırlık JSON | `demo_rehearsal_gate.sh` → `demo-rehearsal-gate-report.json` | ✅ |
| AP2 | demo_3min + :8443 + live | `demo_3min` + dashboard + `website_live_gate` | ✅ |
| AP3 | `/tests` 70. kart | `demo-rehearsal-gate` | ✅ |

```bash
bash scripts/demo_rehearsal_gate.sh
FULL=1 bash scripts/demo_rehearsal_gate.sh   # + security_closure + webhook
bash scripts/demo_rehearsal.sh              # klasik 08:00 provası
```

---

## Sprint AH — Enterprise escalation runbook (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| AH1 | P1–P4 operatör playbook | `docs/ENTERPRISE_ESCALATION.md` | ✅ |
| AH2 | Escalation kapı | `enterprise_escalation_gate.sh` | ✅ |
| AH3 | `/tests` 63. kart | `enterprise-escalation-gate` | ✅ |

```bash
bash scripts/enterprise_escalation_gate.sh
```

---

## Sprint AG — Website preview kapısı (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| AG1 | Yerel preview gate | `website_preview_gate.sh` | ✅ |
| AG2 | Smoke test parity | `website_smoke` + test-results.js | ✅ |
| AG3 | `/tests` 62. kart | `website-preview-gate` | ✅ |

```bash
bash scripts/website_sync_tests.sh
bash scripts/website_preview_gate.sh
bash scripts/preview_website.sh
```

---

## Sprint AF — Grafana panel parity (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| AF1 | SOC/API/Webhook mini panel | threat · ban IPC/XDP · API 403 | ✅ |
| AF2 | grafanaPanels ↔ dashboard JSON | `grafana_parity_gate.sh` | ✅ |
| AF3 | `/tests` 61. kart | `grafana-parity-gate` | ✅ |

```bash
bash scripts/grafana_parity_gate.sh
bash scripts/competitive_proof.sh
bash scripts/dashboard_refresh.sh
```

---

## Sprint AE — 60/60 vitrin + Enterprise runbook (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| AE1 | Statik site 60 test | `website_sync_tests.sh` + locale 60/60 | ✅ |
| AE2 | Enterprise SLA tablosu | edge + telegram kanıt satırları | ✅ |
| AE3 | Dok parity | COMPETITIVE_STATUS · SCOPE · ENTERPRISE | ✅ |

```bash
bash scripts/website_sync_tests.sh
bash scripts/preview_website.sh
# http://127.0.0.1:8765/tests — 60/60
```

---

## Sprint AD — Edge koruma kapısı + dashboard (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| AD1 | Edge kapı script | `edge_protection_gate.sh` | ✅ |
| AD2 | Dashboard panel | `#edge-protection` + `/api/edge-status` | ✅ |
| AD3 | `/tests` 60. kart | `edge-protection-gate` | ✅ |

```bash
bash scripts/edge_protection_gate.sh
bash scripts/competitive_proof.sh
bash scripts/sync_dashboard_data.sh
bash scripts/dashboard_refresh.sh
```

---

## Sprint AC — Grafana Telegram + Bans canlı durum (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| AC1 | Grafana route/batch/kuyruk | `GRAFANA_TELEGRAM_STAT_PANELS` + mini panel | ✅ |
| AC2 | Operatör hızlı linkler | webhook · bans · SOC | ✅ |
| AC3 | Bans panel canlı ban | `/api/bans` arama | ✅ |

```bash
bash scripts/dashboard_refresh.sh
# Ana sayfa → Grafana → Telegram operatör satırı
```

```bash
bash scripts/telegram_inline_button_check.sh
bash scripts/sync_dashboard_data.sh
# https://localhost:8443 — SOC timeline + Webhook panel
```

---

## Sprint V — 56/56 vitrin parity (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| V1 | Dashboard 56/56 yeşil | `validationTests` tier_gate + `dashboard_refresh` | ✅ |
| V2 | Gate rapor sırası | `guardian_status_export` → `ops_gate_report` | ✅ |
| V3 | Statik site 56 test | `website_sync_tests.sh` | ✅ |
| V4 | Kanıt tazele | `tests_reports_refresh.sh` | ✅ |
| V5 | Excellence gate | `laptop_excellence_gate.sh` 0 FAIL | ✅ |

```bash
bash scripts/tests_reports_refresh.sh
bash scripts/website_sync_tests.sh
bash scripts/laptop_excellence_gate.sh
```

---

## Sprint U — Prod webhook zinciri (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| U1 | Preflight 0 WARN | `laptop_optional_layers_preflight.sh` | ✅ |
| U2 | Fleet keepalive | `host_fleet_agent_setup.sh --install-user-service` | ✅ |
| U3 | Tam prod E2E | `sudo webhook_prod_e2e.sh` | ✅ |
| U4 | Gate entegrasyon | `optional_layers_gate` + `webhook_prod_e2e_gate` | ✅ |

```bash
bash scripts/webhook_prod_e2e_gate.sh          # mevcut kanit / hazirlik
sudo bash scripts/webhook_prod_e2e.sh           # log→WAF→ban→Telegram
sudo WEBHOOK_E2E_CLI_TEST=1 bash scripts/webhook_prod_e2e.sh  # + CLI test paketi
bash scripts/optional_layers_gate.sh            # 16 OK hedefi
```


Öncelik sırası — her madde bitince `[x]`:

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| E1 | Statik site test parity | `bash scripts/website_sync_tests.sh` | ✅ (56) |
| E2 | COMPETITIVE_STATUS güncel | `docs/COMPETITIVE_STATUS.md` P2/T2 | ✅ |
| E3 | Attack map 4 ban demo | `bash scripts/dashboard_live_demo.sh` | ✅ (6 marker) |
| E4 | VM demo gate 0 FAIL | `vm_demo_gate.sh` + ops_gate | ✅ host + VM guest |
| E5 | Inline hibrit prod snippet | `HOSTING_RUNBOOK_TR.md` §3b + §7 | ✅ |
| E6 | VPS kernel-XDP | `vps_bootstrap.sh` (sunucu gerekir) | ⏸️ |
| E7 | GitHub push + release | `release_prep_no_github.sh` | ⏸️ |

---

## Sprint F — Paketleme & vitrin (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| F1 | `SCOPE_COVERAGE` senkron | 51 kart, faz özeti | ✅ |
| F2 | Kanıt paketi tazele | `bash scripts/local_proof_refresh.sh` | ✅ |
| F3 | `.deb` paket | `bash scripts/build_deb.sh` → `dist/log-guardian_0.c9b9af1_amd64.deb` | ✅ |
| F4 | Statik site test | `bash scripts/website_sync_tests.sh` | ✅ (51/51 parity) |
| F5 | VM `.deb` doğrulama | `vm_install_deb.sh` + `vm_demo_gate` FAIL=0 | ✅ |

---

## Sprint A — Kanıt paketi ✅ (tamamlandı)

| # | Hedef | Komut / çıktı | Durum |
|---|--------|----------------|-------|
| A1 | Competitive suite (FAST) | `bash scripts/sprint_a.sh` | ✅ |
| A2 | Ban latency bench | `sudo bash scripts/bench_ban_latency.sh` (sprint_a otomatik sudo) | ✅ |
| A3 | competitive-proof.pdf | `data-room/competitive-proof.pdf` | ✅ |
| A4 | Kanıt paketi ZIP | `data-room.zip` | ✅ |
| A5 | Dashboard test paneli | `/tests` + PDF link | ✅ |
| A6 | ipset dolu fix | bench otomatik flush | ✅ |

**Devam (A opsiyonel):**
- [x] `SPRINT_A_SOAK=1h bash scripts/sprint_a.sh` — 1 saat soak
- [x] `SPRINT_A_SOAK=72h bash scripts/sprint_a.sh` — 72h soak (`soak-report.json` 72.0h PASS)

---

## Sprint B — Canlı demo & webhook ✅ (tamamlandı)

| # | Hedef | Ne yapılacak | Durum |
|---|--------|--------------|-------|
| B1 | Webhook dry-run | `bash scripts/webhook_smoke_test.sh` | ✅ |
| B2 | Ban → webhook akışı | `bash scripts/webhook_ban_e2e.sh` | ✅ |
| B3 | 3 dk demo script | `bash scripts/demo_3min.sh` | ✅ |
| B4 | ipset maxelem / prune | `threat_intel.sh` dynamic rezerv 12K + DB restore | ✅ |
| B5 | Ban bench | medyan 16 ms, dashboard **Geçti** | ✅ |
| B6 | Sunucu kurulum checklist | `docs/PILOT_SETUP.md` SSH adımları | ✅ |
| B7 | nginx log format | `install.sh` sonunda `log_guardian` uyarısı | ✅ |
| B8 | NOTICE / LICENSE | `/usr/local/share/doc/log-guardian/` | ✅ |

```bash
bash scripts/sprint_b.sh
sudo bash scripts/ipset_prune_policy_test.sh
bash scripts/demo_3min.sh
```

---

## Sprint C — Prod / topluluk sunucusu (laptop tamam; VPS eth0 bekliyor)

| # | Hedef | Ne yapılacak | Durum |
|---|--------|--------------|-------|
| C0 | Sprint C script | `bash scripts/sprint_c.sh` | ✅ |
| C1 | VPS + eth0 | `sudo log-guardian-daemon --iface eth0` | ⬜ VPS |
| C2 | XDP açık demo | `--status` → xdp=ON | ⬜ VPS |
| C3 | TLS :8443 demo | `docker-compose.prod.yml` | 🟡 laptop |
| C4 | Ban latency prod | VPS'te bench → prod hedef **<50 ms** | 🟡 laptop <75ms |
| C5 | 72h soak | `soak-report.json` 72.0h PASS (laptop) · VPS tekrar opsiyonel | ✅ |
| C6 | VPS soak systemd | `sudo bash scripts/install_soak_systemd.sh` | ✅ |

```bash
bash scripts/sprint_c.sh
sudo BENCH_TARGET_MS=50 bash scripts/bench_ban_latency.sh
SOAK_72H=1 bash scripts/sprint_c.sh
```

---

## Sprint D — Açık kaynak yayın

| # | Hedef | Ne yapılacak | Durum |
|---|--------|--------------|-------|
| D1 | README TR + EN | `README.md` + `docs/README_DETAY.md` | ✅ |
| D2 | GitHub public | SECURITY.md (katkı şablonu yok — solo proje) | ✅ |
| D3 | VPS prod kanıt | eth0 + kernel-xdp (72h soak laptop'ta ✅) | ⬜ VPS eth0 |
| D4 | Topluluk demo | `demo_3min.sh` + competitive-proof PDF | ✅ |
| D5 | Rakip karşılaştırma | BENCHMARK.md güncel, dürüst EPS mesajı | ✅ |
| D6 | Gerçek saldırı corpus | `real_attack_suite.sh` + competitive-proof | ✅ |
| D7 | Rakip kanıt vitrin | `rakip_kanit.sh` + [VS_RAKIPLER.md](VS_RAKIPLER.md) | ✅ |
| D8 | P0 saldırı savunması | `live_attack_harness`, POST SQLi, `bench_mixed` 500 satır | ✅ |
| D9 | Dağıtık saldırı / JA3 kanıt | `ja3_cluster_proof.sh` + dashboard + data-room | ✅ |
| D10 | GitHub release vitrin | `github_release_pack.sh` + README + `release.yml` | ✅ |
| D11 | Corpus 500 + nginx consult | `generate_attack_corpus.py` + `/api/v1/consult` | ✅ |
| D12 | Corpus 1K + NoSQL WAF | `REAL_ATTACK_CORPUS_LINES=1000`, `waf_rules.c` nosql | ✅ |
| D13 | T2 TLS local proof | `t2_tls_proof.sh` + `check_nginx_tls_443.sh` | ✅ |
| D14 | Corpus 10K proof | `corpus_10k_proof.sh` + dinamik replay timeout | ✅ |
| D15 | Kısa soak gate | `soak_short_proof.sh` (5 dk, VPS yok) | ✅ |
| D16 | nginx log_guardian enforce | `install.sh` otomatik `fix_nginx_log_format` | ✅ |
| D17 | OWASP/CRS test corpus | `owasp_corpus_proof.sh` (54 satır, 11 kategori) | ✅ |
| D18 | Threat intel sync metrik | `threat_intel_sync_proof.sh` + fixture | ✅ |
| D19 | TR hosting corpus | `tr_hosting_corpus_proof.sh` (150 satır) | ✅ |
| D20 | Extended proof pack | `extended_proof_pack.sh` → data-room | ✅ |
| D21 | phase100 fast gate | `phase100_fast_gate.sh` | ✅ |
| D22 | Laptop dev gate | `laptop_dev_gate.sh` (VPS/webhook yok) | ✅ |
| D23 | TR hosting runbook | `HOSTING_RUNBOOK_TR.md` | ✅ |
| D24 | Incident timeline UI | dashboard `IncidentsPanel` detay modal | ✅ |
| D25 | Corpus genişletme | TR 500 + OWASP 200 satır | ✅ |
| D26 | OpenAPI strict prod | `OPENAPI_STRICT_PROD.md` | ✅ |
| D27 | FP learn warmup UI | dashboard `FpMetricsPanel` | ✅ |

```bash
bash scripts/laptop_dev_gate.sh
bash scripts/sprint_a.sh
bash scripts/real_attack_suite.sh
bash scripts/ja3_cluster_proof.sh
bash scripts/demo_3min.sh
bash scripts/phase100.sh
```

Detay: [REAL_ATTACK.md](REAL_ATTACK.md)

---

## Hızlı komutlar

```bash
bash scripts/sprint_a.sh
sudo bash scripts/bench_ban_latency.sh
bash scripts/competitive_proof.sh
bash scripts/sync_dashboard_data.sh
docker compose -f docker-compose.prod.yml up -d --build
./log-guardian --health
bash scripts/sprint_c.sh
bash scripts/demo_3min.sh
```

---

## Linkler

| Ne | URL |
|----|-----|
| Dashboard | https://localhost:8443/ |
| Testler | https://localhost:8443/tests |
| PDF | https://localhost:8443/api/data-room/competitive-proof.pdf |
| Grafana | http://127.0.0.1:3002 |

---

## Notlar

- **Ban hedefi:** Laptop IPC → **<75 ms**. Prod VPS → **<50 ms**.
- **Core mesajı:** ModSec hız yarışı değil — log→WAF→kernel ban + ölçülebilir kanıt.
- **Lisans:** MIT — ticari satış paketi yok; solo geliştirme.

İlgili: [DATA_ROOM.md](DATA_ROOM.md) · [SCOPE_COVERAGE.md](SCOPE_COVERAGE.md) · [QUICKSTART_NGINX.md](QUICKSTART_NGINX.md)
