# Changelog

All notable changes to **Linux Log Guardian** are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] - 2026-06-07

### Added

- **Rakip kanıt paketi** — `bash scripts/rakip_kanit.sh` (offline PDF + JSON + ZIP)
- **Gerçek saldırı corpus** — 300 satır, 11 kategori (`real_attack_suite.sh`)
- **Dağıtık saldırı kanıtı** — 50 IP, aynı scanner UA (`ja3_cluster_proof.sh`)
- **Canlı nginx harness** — tester sqli/post_sqli/brute/ddos/slow (`live_attack_harness.sh`)
- **GitHub release pack** — `bash scripts/github_release_pack.sh` → `release-pack.zip`
- Dashboard `/tests` — `real-attack`, `live-attack`, `ja3-cluster` satırları
- CI — offline `real_attack_suite` + `ja3_cluster_proof` artefakt upload

### Measured (reference host)

| Metrik | Değer |
|--------|-------|
| Real attack recall | 100% (300 lines) |
| Distributed cluster | 100% (50 IPs) |
| Live harness refused | 525/525 |
| False positive | 0.5% (500 benign) |
| Ban latency | ~17 ms |
| CRS parity | 100% |

### Notes

- ModSecurity inline EPS hız iddiası yok — güçlü yan: log→WAF→kernel ban + ölçülebilir kanıt.
- Canlı harness için nginx `:80` + `log_guardian` log formatı gerekir.

[0.1.0]: https://github.com/kurtulusutkucenik/loganalyzer/releases/tag/v0.1.0
