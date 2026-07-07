# Enterprise destek süreci

Log Guardian **MIT Core** + opsiyonel **Pro/Enterprise** katmanları.

## Destek seviyeleri

| Seviye | Kapsam | Kanıt / giriş |
|--------|--------|----------------|
| **Community** | GitHub issues, doküman | `docs/QUICKSTART_NGINX.md`, `competitive-proof.pdf` |
| **Production** | Kurulum kapısı, `/tests` | `post_install_verify` FAIL=0, `laptop_harden.sh` |
| **Enterprise (plan)** | SLA, öncelikli patch, multi-tenant fleet | `ENTERPRISE_SUPPORT.md` + imzalı marketplace |

## Prod checklist (müşteri)

1. `sudo bash scripts/install_first_run.sh` — nginx hibrit + FP warmup
2. Internet-facing: `LG_NEW_PASSWORD=...` + `laptop_harden.sh`
3. `OPENAPI_STRICT=1` — API host ([OPENAPI_STRICT_PROD.md](OPENAPI_STRICT_PROD.md))
4. `bash scripts/local_security_audit.sh` — FAIL:0
5. Edge koruma: `bash scripts/edge_protection_gate.sh` — nginx + ipset/XDP ([EDGE_PROTECTION.md](EDGE_PROTECTION.md))
6. Opsiyonel: CrowdSec ([CROWDSEC_INTEGRATION.md](CROWDSEC_INTEGRATION.md)), mesh ([MESH_ETCD_PROD.md](MESH_ETCD_PROD.md))
7. Enterprise harici ban API: mTLS + mutation token — [BAN_API_MTLS_DESIGN.md](BAN_API_MTLS_DESIGN.md) (tasarım; kod backlog)

## SLA hedefleri (plan)

| Metrik | Hedef | Laptop kanıt (2026-06) |
|--------|--------|-------------------------|
| Kritik patch | 72 saat (Enterprise) | — |
| Ban pipeline uptime | 99.5% | `soak-report.json` 72.0h, 0/864 fail |
| FP oranı | <%5 (hedef %0.5) | `fp-report.json` ~%0.2 |
| Filo çoklu host | 2+ agent Online | `fleet-multi-node-report.json` · `vm-fleet-gate-report.json` |
| Dağıtık saldırı riski | /24 + UA bonus ≤+20 | `dist-risk-proof-report.json` |
| Edge kapısı | nginx + ban yolu | `edge-protection-gate-report.json` |
| Edge checklist | laptop/prod 15 madde | `edge-protection-checklist-report.json` |
| Telegram operatör | ack + undo | `telegram-soc-gate-report.json` |
| Sabah operatör | 80/80 + core zincir | `morning-operator-gate-report.json` |

## E9 doğrulama (tek komut)

Müşteri data room öncesi veya haftalık L2 kontrol:

```bash
bash scripts/enterprise_e9_verify.sh
# Hizli (sabah gate atla): SKIP_MORNING=1 bash scripts/enterprise_e9_verify.sh
```

Rapor: `enterprise-e9-verify-report.json` — escalation + edge checklist + docs consistency (+ isteğe bağlı morning gate).

## Laptop kanıt paketi (GitHub push olmadan)

Müşteri data room / PDF vitrin için yerel paket:

```bash
bash scripts/local_proof_refresh.sh    # competitive-proof.pdf + data-room.zip
bash scripts/release_ready_check.sh    # artefakt kapısı
bash scripts/release_ready_gate.sh     # ZIP + docs + live + filo zinciri
```

Dashboard vitrin: `https://localhost:8443/tests` (**80 kart**) · site: `https://ceniklinuxlogguardian.org/tests`

Operatör escalation: [ENTERPRISE_ESCALATION.md](ENTERPRISE_ESCALATION.md) · E9 tek kapı: `bash scripts/enterprise_e9_verify.sh` · sabah: `bash scripts/morning_operator_gate.sh` · kapı: `bash scripts/enterprise_escalation_gate.sh`

### Operatör cron (özet)

```bash
bash scripts/install_operator_cron.sh
```

Günlük sabah gate · haftalık core kanıt · intel DB prune · güvenlik haftalık (E9 dahil) · aylık `POST_INSTALL_STRICT` + E9 + edge checklist (internet-facing). Detay: [ENTERPRISE_ESCALATION.md](ENTERPRISE_ESCALATION.md) § P4.

Filo demo (host): `bash scripts/vm_demo_host.sh` → `node-kurtulus-01` + `node-vm-02` Online · çoklu dispatch: `bash scripts/fleet_multi_node_e2e.sh`

## Teknik önkoşullar

- Linux x86_64, kernel 5.15+
- nginx `log_guardian` format
- BTF (XDP prod için)
- Dashboard: Docker + Caddy `:8443` ([TLS_PRODUCTION.md](TLS_PRODUCTION.md))

## İletişim

GitHub: [Linux-Log-Guardian](https://github.com/kurtulusutkucenik/Linux-Log-Guardian)  
E-posta: README / site iletişim bölümü
