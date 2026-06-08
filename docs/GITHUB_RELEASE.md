# GitHub Release — kanıt paketi yayını

VPS veya webhook gerekmez. Offline kanıt CI'da da üretilebilir; canlı harness opsiyoneldir.

## Yerel (önerilen)

```bash
# Tam kanıt (önerilen — 10K + TLS + consult + live + release ZIP)
STABILITY=1 bash scripts/full_proof_pack.sh

# Sadece offline kanıt
bash scripts/rakip_kanit.sh

# nginx :80 açıksa — canlı harness + proof yenileme
LIVE_ATTACK=1 bash scripts/rakip_kanit.sh

# Release öncesi doğrulama
bash scripts/release_ready_check.sh
REQUIRE_STABILITY=1 bash scripts/release_ready_check.sh

# Release ZIP (full_proof_pack zaten üretir)
bash scripts/github_release_pack.sh
```

Çıktılar:

| Dosya | Açıklama |
|-------|----------|
| `release-pack.zip` | PDF + JSON kanıt bundle |
| `competitive-proof.pdf` | Vitrin özeti |
| `data-room.zip` | 17 JSON/PDF artefakt |
| `release-pack/RELEASE_NOTES.md` | Otomatik özet |

## GitHub'da yayınlama

```bash
git tag v0.1.0
git push origin v0.1.0

gh release create v0.1.0 \
  release-pack.zip \
  competitive-proof.pdf \
  --title "v0.1.0 — Measurable proof pack" \
  --notes-file release-pack/RELEASE_NOTES.md
```

Etiket push edildiğinde `.github/workflows/release.yml` aynı artefaktları CI'dan da yükleyebilir.

## Canlı harness (opsiyonel)

```bash
sudo bash scripts/fix_nginx_log_format.sh   # bir kez
sudo systemctl start nginx
LIVE_ATTACK=1 bash scripts/rakip_kanit.sh
```

`live-attack-report.json` → `sent=525 refused=525` beklenir (localhost whitelist'te ban farklı davranabilir; refused kanıt yeterli).

## Dürüst mesaj

Release notlarında **ModSec EPS yarışı** iddiası kullanmayın. Vitrin: recall, FP, ban ms, CRS parity, entegre pipeline.

İlgili: [VS_RAKIPLER.md](VS_RAKIPLER.md) · [REAL_ATTACK.md](REAL_ATTACK.md) · [JA3_CLUSTERING.md](JA3_CLUSTERING.md)
