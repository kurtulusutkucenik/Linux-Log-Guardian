# Prod yol haritası (geliştirme öncelikleri)

Müşteri gereksinimleri: `docs/CUSTOMER_REQUIREMENTS.md`.

**Tüm kapsam checklist + 6 haftalık sprint:** [SCOPE_COVERAGE.md](SCOPE_COVERAGE.md)

## 1. Stub → prod (en yüksek ROI)

| Parça | Durum | Sonraki adım |
|-------|--------|--------------|
| **Wasm** | `plugins_native` + `WASM_PROD_STRICT` | `bash scripts/wasm_release.sh` → `docs/WASM_PROD_CHECKLIST.md` |
| **Lineage** | Daemon 5s export + ringbuf poll | `bash scripts/prod_stack_e2e.sh`; canlı: `sudo log-guardian-daemon` |
| **L7 probe** | `--status` + dashboard + attack-tree `probes` | Daemon ile `probe_active=true` |

Tek komut doğrulama: `bash scripts/prod_stack_e2e.sh`

## 2. Kanıt sertleştirme

- `corpus/benign_corpus.access` ≥200 satır (WordPress, API, statik)
- `bench-vs-modsec.json`: EPS + **latency µs/satır** (Guardian vs CRS replay)
- CI: `competitive_gate.sh` merge blocker (`.github/workflows/build.yml`)

## 3. API güvenliği (BOLA/IDOR)

- Path ID traversal, session ID penceresi, GraphQL depth — `scripts/bola_idor_e2e.sh`

## 4. SaaS

- `docs/BRANDING.md` — Community / Pro / Enterprise katmanları

## 6. Guvenlik + 7/24 (yeni)

- IPC: `LOG_GUARDIAN_IPC_TOKEN` + `SO_PEERCRED` + `log-guardian` grubu
- Analyzer: `READY=1`, `--follow` seek-to-end, DB kuyruk overflow korumasi
- Dashboard: scrypt sifre, JWT zorunlu (prod), login rate limit, `next build` standalone
- TLS: `docker-compose.prod.yml` + Caddy — `docs/TLS_PRODUCTION.md`
- Soak: `bash scripts/soak_test.sh` (72h) — `docs/SOAK_TEST.md`
- Test: `bash scripts/security_hardening_test.sh` · `bash scripts/local_security_audit.sh` · `bash scripts/docs_consistency_check.sh`
