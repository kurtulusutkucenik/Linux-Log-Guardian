# Statik site yayini (domain oncesi hazirlik)

Marketing sitesi `assets/website/` altinda gelistirilir; **internete cikan paket** `assets/website-deploy/` dir.

## Tek komut (yerel)

```bash
bash scripts/website_deploy_gate.sh   # build + pack + audit
bash scripts/website_smoke.sh           # HTTP smoke (domain gerekmez)
LG_WEBSITE_PREVIEW=deploy bash scripts/preview_website.sh
```

## Domain almadan cozulen riskler

| Risk | Onlem |
|------|--------|
| Yanlis build output (`assets/website`) | `wrangler.toml` → `pages_build_output_dir = "assets/website-deploy"` |
| Hassas dosya sizintisi | Deploy paketinde `csp.txt` / `publish.allowlist` yok; CI kontrol eder |
| Bayat deploy paketi | `website_ensure_deploy.sh` SRI hash karsilastirir |
| Regresyon | GitHub Actions `website.yml` her PR/push'ta gate + smoke |

## Cloudflare Pages (domain alinca)

1. Repo bagla (`kurtulusutkucenik/loganalyzer`)
2. **Build command:** `bash scripts/website_deploy_gate.sh`
3. **Build output directory:** `assets/website-deploy` (veya kok `wrangler.toml` otomatik okur)
4. Custom domain ekle → HTTPS otomatik
5. **Cloudflare Dashboard (zorunlu — SRI kirilir):**
   - **Speed → Optimization → Auto Minify:** JavaScript **kapalı** (HTML/CSS isteğe bağlı)
   - **Scrape Shield → Email Address Obfuscation:** kapalı veya JS dosyalarına dokunmuyor olmalı
   - Rocket Loader **kapalı**
6. Deploy sonrasi:
   ```bash
   wrangler pages deploy assets/website-deploy --project-name=linux-log-guardian-website --branch=main --commit-dirty=true
   bash scripts/website_live_css_check.sh   # curl — CSS drift
   bash scripts/website_live_js_check.sh    # tarayici — JS SRI (curl yetmez)
   ```
7. Canli dogrulama:
   ```bash
   curl -sI https://ceniklinuxlogguardian.org/csp.txt          # 404
   curl -sI https://ceniklinuxlogguardian.org/ | grep -i strict # HSTS
   ```

`website_live_js_check.sh` basarisiz ve konsolda `Failed to find a valid digest in the integrity attribute` gorurseniz: Auto Minify acik — JS minify SRI hash'i bozuluyor.

`/_redirects` icinde `/tests → /tests.html` **eklemeyin** — Cloudflare zaten `/tests` pretty URL kullanir; rewrite redirect dongusu yapar.

## Onemli

- `assets/website-deploy/` git'e **commit edilmez** (`.gitignore`)
- `i18n.js` veya `site.css` degisince mutlaka `bash scripts/website_build.sh`
- Prod onizleme deploy paketinden: `LG_WEBSITE_PREVIEW=deploy bash scripts/preview_website.sh`
- `website_smoke.sh` **bos port** secer (8767 sabit degil); 8767'de baska statik sunucu varsa artik karismaz
