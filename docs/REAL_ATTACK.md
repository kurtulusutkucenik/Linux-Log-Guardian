# Gerçek saldırı corpus — offline replay + canlı senaryo

**Hedef:** CRS parity dışında, güncel SQLi/XSS/LFI/RCE/scanner/API payload'larında ölçülebilir recall kanıtı.

## Hızlı çalıştırma

```bash
# Corpus üret + offline replay (~30 sn)
bash scripts/real_attack_suite.sh

# + canlı tester (nginx gerekli)
LIVE=1 bash scripts/real_attack_suite.sh
```

Çıktı: `real-attack-report.json` — dashboard `/tests` panelinde **real-attack** satırı.

## Ne ölçülür?

| Katman | Dosya | Metrik |
|--------|-------|--------|
| Corpus | `corpus/real_attack_corpus.access` | 19 kategori, varsayılan **1000** satır (`REAL_ATTACK_CORPUS_LINES`) |
| Corpus 10K | `bash scripts/corpus_10k_proof.sh` | Ayrı kanıt: `real-attack-report-10k.json` (~5–10 dk) |
| Manifest | `corpus/real_attack_manifest.json` | Kategori → satır indeksleri |
| Replay | `scripts/real_attack_replay.py` | `attack_recall_pct` (tam corpus) |
| Gate | `scripts/competitive_gate.sh` | `REAL_ATTACK_MIN_RECALL` (varsayılan **85%**) |

**Pass:** tam corpus recall ≥ hedef; kategori ortalaması bilgi amaçlı (`category_avg_recall_pct`).

**Brute flood:** offline corpus'ta login+SQLi örnekleri var; gerçek login flood için `LIVE=1` ve [EDGE_PROTECTION.md](EDGE_PROTECTION.md) nginx rate limit.

## Entegrasyon

- `scripts/competitive_suite.sh` — FAST modda corpus replay
- `scripts/competitive_proof_build.py` — scorecard + validation_tests
- `scripts/data_room_pack.sh` — ZIP'e `real-attack-report.json`
- `scripts/ja3_cluster_proof.sh` — dağıtık saldırı recall ([JA3_CLUSTERING.md](JA3_CLUSTERING.md))
- `scripts/sync_dashboard_data.sh` — dashboard volume

## Ortam değişkenleri

| Değişken | Varsayılan | Açıklama |
|----------|------------|----------|
| `REAL_ATTACK_MIN_RECALL` | `85` | Minimum recall % |
| `REAL_ATTACK_REPORT` | `real-attack-report.json` | Çıktı dosyası |
| `LIVE` | `0` | `1` → tester sqli/ddos/slow |
| `LIVE_ATTACK` | `0` | `rakip_kanit.sh` sonunda canlı harness |
| `ATTACK_HOST` / `ATTACK_PORT` | `127.0.0.1` / `80` | Canlı hedef |

## Sınırlar (dürüst mesaj)

- **Offline replay** = log satırı → WAF; inline ModSec hız iddiası değil.
- **Volumetrik DDoS** = CDN + nginx rate limit ([EDGE_PROTECTION.md](EDGE_PROTECTION.md)); tester yalnızca operasyonel doğrulama.
- **XDP kernel drop** = VPS `eth0` (laptop Wi‑Fi → ipset fallback beklenen).

## Corpus genişletme

```bash
python3 scripts/generate_attack_corpus.py
# scripts/generate_attack_corpus.py içinde kategori listelerini düzenle
bash scripts/real_attack_suite.sh
```

Yeni payload eklerken nginx `log_format log_guardian` ile uyumlu satır üretin ([QUICKSTART_NGINX.md](QUICKSTART_NGINX.md)).
