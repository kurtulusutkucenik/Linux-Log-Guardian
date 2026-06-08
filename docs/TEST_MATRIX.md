# Test matrisi (Faz 0.2)

| ID | Alan | Komut / adim | Beklenen |
|----|------|----------------|----------|
| T0.1 | Derleme | `make -j$(nproc)` | Hata yok |
| T0.2 | Smoke | `bash scripts/smoke_test.sh` | OK |
| T0.3 | E2E paket | `bash scripts/run-all-e2e.sh` | Zorunlu adimlar OK |
| T0.4 | Faz kapisi | `bash scripts/phase_gate.sh` | PASSED |
| T0.5 | Saglik | `./log-guardian --health` | IPC/metrics (daemon aciksa) |
| T0.6 | Status JSON | `./log-guardian --status --db events.db` | JSON gecerli |
| T0.7 | DB kapali | `./log-guardian test_access.log --no-db --no-tui` | Cokme yok |
| T0.8 | Seccomp cikis | Kisa log analizi sonra `exit` | SIGSYS yok |
| T1.1 | CRS | `pcre_engine` + `rules/crs-core.rules` | SQLi log alarm |
| T1.2 | Ban TTL | `BAN_TTL_SEC=30` + log | Sure dolunca unban |
| T1.3 | Ban nedeni | DB `ban_events.reason` | Dolu |
| T2.1 | Lineage demo | `./log-guardian lineage-stats --demo` | attack_tree.json |
| T2.2 | Incident | `bash scripts/incident_e2e.sh` | INC- id |
| T2.3 | Falco host | `falco_host_rules.c` 25 kural | Risk boost lineage |
| T3.1 | Schema strict | `test_schema_strict.log` + rules.conf | Alarm |
| T3.2 | Endpoint BL | `ENDPOINT_BASELINE_ENABLED=1` | 7 gun sonra esik |
| T4.1 | Fleet | Dashboard + `fleet_e2e.sh` | telemetry OK |
| T5.1 | Wasm stub | `bash scripts/phase5_e2e.sh` | OK |
| T6.1 | Rekabet suite | `bash scripts/competitive_suite.sh` | JSON artefaktlar |
| T6.2 | Rekabet kapisi | `bash scripts/competitive_gate.sh` | FP<5%, EPS>0, Falco>=24 |
| T6.3 | BOLA/IDOR E2E | `bash scripts/bola_idor_e2e.sh` | idor_score>=80, GraphQL depth |
| T6.3 | Falco 50+ | `bash scripts/falco_fetch_and_import.sh` | >=50 kural (CE opsiyonel) |
| T100 | Tum fazlar | `bash scripts/phase100.sh` | Faz 0-6: 100% |

Ortam: `export LOGANALYZER_PASSWORD='DegistirBeni!123'`
