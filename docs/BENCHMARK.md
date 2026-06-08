# Log Guardian — Benchmark Kanıtı

Rakip karşılaştırması için ölçülebilir metrikler. **Dürüst sınır:** ModSecurity inline CRS replay genelde daha yüksek EPS — farklı mimari; güçlü yan entegre log→WAF→kernel ban + şeffaf JSON/PDF.

Son ölçüm: `STABILITY=1 bash scripts/full_proof_pack.sh` (laptop, 2026-06)

---

## Ölçülmüş sonuçlar (laptop)

| Metrik | Değer | Kaynak |
|--------|-------|--------|
| Gerçek saldırı recall (1K) | **%100** (1000 satır, 19 kategori) | `real-attack-report.json` |
| Corpus 10K recall | **%100** (10000 satır) | `real-attack-report-10k.json` |
| Dağıtık cluster recall | **%100** (80 IP) | `ja3-cluster-report.json` |
| JA3 TLS live | **PASS** (`:443`) | `ja3-cluster-report.json` → `live` |
| nginx inline consult | **PASS** (union=403, benign=200) | `nginx-inline-consult-report.json` |
| Canlı harness refused | **525/525** | `live-attack-report.json` |
| False positive | **%0.5** (200 benign) | `fp-report.json` |
| Ban gecikmesi | **~17 ms** (ipset) | `bench-ban-latency.json` |
| CRS parity | **%100** | `crs-parity-report.json` |
| Kısa soak (5 dk) | **PASS** (0/10 failure) | `soak-report.short.json` |
| Guardian EPS (log replay) | ~130 EPS (tek geçiş) | `bench-vs-modsec.json` |
| CRS @rx replay EPS | ~12K EPS (referans) | `bench-vs-modsec.json` |

**Prod hedefleri:** ban < **50 ms** (VPS), FP < **%5**, attack recall ≥ **%85**.

---

## Hızlı çalıştırma

```bash
export LOGANALYZER_PASSWORD='DegistirBeni!123'

# Tam kanıt paketi (önerilen)
STABILITY=1 bash scripts/full_proof_pack.sh

# Tekil bench
bash scripts/bench_report.sh
bash scripts/bench_vs_modsec.sh       # EPS → bench-vs-modsec.json
sudo bash scripts/bench_ban_latency.sh # ban ms → bench-ban-latency.json
bash scripts/fp_report.sh

# Release öncesi (GitHub push etmeden doğrulama)
bash scripts/release_ready_check.sh
REQUIRE_STABILITY=1 bash scripts/release_ready_check.sh
```

---

## Metrikler

| Metrik | Script | Hedef |
|--------|--------|-------|
| Log satır/s (EPS) | `bench_vs_modsec.sh` | Referans only — CRS replay genelde daha yüksek |
| Ban gecikmesi | `bench_ban_latency.sh` | < 50 ms prod, < 75 ms laptop (IPC→ipset) |
| False positive | `fp_report.sh` | Benign log < %5 |
| CRS parity | `crs_parity_bench.py` | Attack recall ≥85%, parity ≥80% |
| Gerçek saldırı recall | `real_attack_suite.sh` | %100 hedef (corpus) |
| Corpus 10K | `corpus_10k_proof.sh` | %100 hedef |
| Kısa stabilite | `soak_short_proof.sh` | 5 dk, 0 failure |
| Bellek (RSS) | `soak_test.sh` / soak raporu | Raporla; prod 72h VPS |

---

## CRS kural paritesi

ModSecurity OWASP CRS ile aynı regex seti:

```bash
python3 scripts/crs_parity_bench.py -o crs-parity-report.json
bash scripts/crs_parity_test.sh
python3 scripts/import_crs.py /path/to/coreruleset/rules -o rules/crs-imported.rules
# rules.conf: CRS_RULES=rules/crs-imported.rules
```

Log Guardian farkı: eşleşme sonrası **IPC → XDP/ipset ban** tek pipeline.

---

## Örnek çıktı

`bench-ban-latency.json`:

```json
{
  "ban_latency_ms": 16.92,
  "ipset_confirmed": true,
  "target_ms": 50
}
```

`bench-vs-modsec.json` (mimari fark — EPS karşılaştırması dürüst mesaj içindir):

```json
{
  "log_guardian": { "eps": 130, "latency_us_per_line": 7692 },
  "modsecurity": { "eps": 12000, "latency_us_per_line": 83 }
}
```

---

## Rakip karşılaştırma (VPS gerekmez)

```bash
STABILITY=1 JA3_LIVE=1 NGINX_CONSULT=1 LIVE_ATTACK=1 bash scripts/rakip_kanit.sh
bash scripts/competitive_gate.sh
```

Detaylı tablo: [VS_RAKIPLER.md](VS_RAKIPLER.md)

Dashboard `/tests` paneli `BENCH_DATA_DIR` veya `../` JSON dosyalarını okur.

```bash
bash scripts/competitive_suite.sh
bash scripts/sync_dashboard_data.sh
docker compose -f docker-compose.prod.yml up -d dashboard
bash scripts/phase100.sh               # Faz 0-6 (PHASE100_FAST=1 kısaltır)
```
