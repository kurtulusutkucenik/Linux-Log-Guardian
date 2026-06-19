# Kanıt paketi (data-room)

**Linux Log Guardian** benchmark ve doğrulama artefaktları tek klasörde: FP, CRS parite, ban gecikmesi, soak, compliance.

Açık kaynak topluluk için — satış veya due diligence değil, **ölçülebilir kanıt**.

## Tek komut (Sprint A)

```bash
# Hızlı paket (~5–15 dk, competitive FAST mod)
bash scripts/sprint_a.sh

# + 1 saat soak (bloklar, kanıt güçlenir)
SPRINT_A_SOAK=1h bash scripts/sprint_a.sh

# + 72 saat soak (arka plan, hemen devam eder)
SPRINT_A_SOAK=72h bash scripts/sprint_a.sh

# Tam suite (wasm + bola, yavaş)
SPRINT_A_FULL=1 bash scripts/sprint_a.sh
```

## Çıktılar

| Dosya | İçerik |
|-------|--------|
| `data-room/competitive-proof.pdf` | Kanıt özeti (scorecard + testler) |
| `data-room/competitive-proof.json` | Birleşik JSON |
| `data-room/MANIFEST.json` | Dosya listesi + tarihler |
| `data-room.zip` | ZIP arşiv (zip kuruluysa) |

Kaynak JSON'lar repo kökünde de kalır: `fp-report.json`, `crs-parity-report.json`, `soak-report.json`, vb.

## Dashboard

- Testler: `/tests`
- PDF: `/api/data-room/competitive-proof.pdf`
- Docker volume: `bash scripts/sync_dashboard_data.sh` → `.cache/dashboard-live`

## 72 saat soak (ayrı)

```bash
sudo systemctl start log-guardian-daemon log-guardian
SOAK_1H=1 bash scripts/laptop_soak_72h.sh --start   # önce 1 saat
# bash scripts/laptop_soak_72h.sh --start           # 72 saat
tail -f soak-72h.log
# Bittiğinde:
bash scripts/competitive_proof.sh
bash scripts/data_room_pack.sh
bash scripts/sync_dashboard_data.sh
```

Detay: [SOAK_TEST.md](SOAK_TEST.md) · [LAPTOP_OPS.md](LAPTOP_OPS.md)

## Topluluğa nasıl anlatılır

> “Her release'te otomatik test suite çalışıyor. PDF ve JSON'da **ne iddia ediyoruz** ve **ne iddia etmiyoruz** açık: ModSec hız yarışı değil — log→WAF→kernel ban, FP oranı, CRS paritesi, ban gecikmesi ölçülüyor.”

Detay: [OPERATIONS.md](OPERATIONS.md) · [BENCHMARK.md](BENCHMARK.md) · [SCOPE_COVERAGE.md](SCOPE_COVERAGE.md) · [COMPETITIVE_STATUS.md](COMPETITIVE_STATUS.md)
