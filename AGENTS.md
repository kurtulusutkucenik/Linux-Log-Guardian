# Linux Log Guardian — Agent rehberi

## Kimlik

- **Ürün:** Linux Log Guardian · **Kısa:** Log Guardian
- **Paket/binary:** `log-guardian`, `log-guardian-daemon`
- **İsimlendirme:** [docs/BRANDING.md](docs/BRANDING.md)

## Konumlandırma (kapsam)

| Katman | Ne söyle | Ana dosyalar |
|--------|----------|--------------|
| **Core** | nginx log → WAF → kernel ban | `main.c`, `parser.c`, `waf_rules.c`, `ban_pipeline.c`, `firewall.c` |
| **Pro** | eBPF daemon, dashboard, Grafana, fleet | `ebpf_daemon.c`, `xdp_filter.c`, `dashboard/`, `grafana-*.json` |
| **Opsiyonel** | XDR, Wasm, LLM Copilot | `attack_tree.c`, `lineage_probe.c`, `wasm_runtime.c`, `dashboard/src` copilot |

Enterprise roadmap ([docs/Log_Guardian_Enterprise_Roadmap.md](docs/Log_Guardian_Enterprise_Roadmap.md)) **uzun vadeli vizyon**dur; güncel müşteri girişi [docs/QUICKSTART_NGINX.md](docs/QUICKSTART_NGINX.md) (15 dk). Laptop operasyon: [docs/LAPTOP_OPS.md](docs/LAPTOP_OPS.md).

## Modül haritası (`graphify-out/graph.json`)

Görev bazlı okuma — tüm repoyu tarama:

### Log ingest ve CLI
- `main.c`, `parser.c`, `parser.h`, `tui.c`, `db.c`
- Test: `tester.c`, `test_access.log`

### WAF ve kurallar
- `waf_rules.c`, `pcre_engine.c`, `schema_validator.c` (OpenAPI/BOLA)
- Kurallar: `rules/`, `scripts/import_crs.py`

### Ban hattı
- `ban_pipeline.c`, `firewall.c`, `daemon_ipc.c`, `ipc_auth.c`
- Policy: `ban_policy.c`, `tenant_policy.c`

### eBPF / XDP
- `ebpf_daemon.c`, `xdp_filter.c`, `xdp_loader.c`, `daemon_stats.c`
- L7: `http_l7_probe.c`, `l7_telemetry.c`, `pkt_inspector.h`

### Anomali ve ML
- `anomaly.c`, `adaptive_threshold.c`, `fp_trust.c`, `endpoint_baseline.c`
- JA3: `ja3_engine.c`, `tls_uprobe.c`

### XDR / lineage / incident
- `attack_tree.c`, `lineage_probe.c`, `incident_engine.c`, `syscall_uprobe.c`
- APT: `apt_graph.c`, `covert_ch.c`

### Tehdit ve deception
- `threat_feed.c`, `falco_host_rules.c`, `deception.c`, `tarpit_server.c`, `trap_watcher.c`

### Fleet ve multi-tenant
- `agent_sync.c`, `rules_fleet.c`, `etcd_mesh.c`, `mesh_intel.c`
- Dashboard: `dashboard/src/app/fleet/`, Prisma tenant

### Wasm marketplace
- `wasm_runtime.c`, `examples/plugins/`

### Observability
- `metrics.c`, `webhook.c`, `grafana-dashboard.json`, `grafana-alerts.json`
- `scripts/grafana_provision.sh`, `docs/GRAFANA_SETUP.md`

### Dashboard (Next.js)
- `dashboard/` — ayrı [dashboard/AGENTS.md](dashboard/AGENTS.md) (Next.js kuralları)

## Token tasarrufu

1. **Ham `graphify-out/graph.json` (~50K satır) context'e eklemeyin.**
2. Soru modüle özgüyse yukarıdaki dosya listesinden 3–8 dosya okuyun.
3. Değişiklik tespiti: `graphify-out/manifest.json` veya `graphify-out/cache/stat-index.json` hash'leri.
4. Operatör akışı: `docs/LAPTOP_OPS.md` + `docs/QUICKSTART_NGINX.md` + `docs/CUSTOMER_REQUIREMENTS.md`.
5. Grafana işi: sadece `grafana-dashboard.json`, `grafana-alerts.json`, `metrics.c`, `scripts/grafana_provision.sh`.
6. Kapsam / sprint takibi: `docs/SCOPE_COVERAGE.md` (tüm tier + faz checklist).
7. **72h soak tamam** — `soak-report.json` (`72.0h`, 864 örnek, 0 fail). Kullanıcıya tekrar koşturma önerme.

## Geliştirme komutları

```bash
make -j$(nproc)
./log-guardian --health
sudo bash scripts/ensure_api_security.sh   # API (demo parola kalir)
bash scripts/local_security_audit.sh
bash scripts/phase100.sh          # tüm faz kapıları
bash scripts/grafana_provision.sh
bash scripts/local_proof_refresh.sh  # yerel kanıt PDF/ZIP (GitHub push ayrı)
```

## Metrikler

Prometheus prefix: `loganalyzer_*` (legacy). Tenant label: `tenant_id`. Port: `METRICS_PORT=9091`.
