# Linux Log Guardian — Release Evidence Pack

Generated: 2026-07-02T20:23:30.290192+00:00

## Measured metrics
- Validation tests: 75/75 pass (dashboard /tests)
- Real attack recall (1K): 101.0%
- Real attack recall (10K): 100.2%
- Distributed cluster recall: 100.0%
- JA3 TLS live: — (JA3_LIVE=1 + nginx_tls_local_setup)
- JA3 cluster ban live: PASS
- FP learn × cluster trust: PASS
- eBPF lineage chain: PASS (risk 91.2)
- Live harness refused: 525
- nginx consult: PASS
- False positive: 0.2%
- Ban latency: 16.82 ms
- CRS parity: 100.0%
- Short soak (5m): PASS
- OWASP corpus recall: 100.0%
- TR hosting recall: 100.0%
- Threat intel sync: PASS

## Files
- `competitive-proof.pdf` — summary brief
- `data-room.zip` — full JSON artefacts
- `deb/log-guardian_*.deb` — amd64 paket (dist/ mevcutsa)
- `lineage-live-report.json` / `fp-cluster-trust-report.json` / `ja3-cluster-ban-live.json`

Reproduce: `bash scripts/local_proof_refresh.sh` (GitHub push ayri adim)
Tam paket: `bash scripts/rakip_kanit.sh`

MIT — docs/QUICKSTART_NGINX.md
