# Site yayini (landing → Cloudflare Pages)

Canli site **`landing/`** (Next.js, 24 dil) projesinden uretilir. Static export ciktisi
`landing/out`; Cloudflare Pages bu dizini yayinlar. Eski statik `assets/website/`
pipeline'i emekliye ayrildi.

## Tek komut (yerel)

```bash
cd landing && npm run dev              # hizli onizleme :3001
bash scripts/website_landing_export.sh # static export -> landing/out
bash scripts/website_deploy_gate.sh    # build + landing/out + wrangler dogrulama (deploy yok)
bash scripts/website_publish.sh        # landing/out -> Cloudflare Pages production (canli site)
bash scripts/website_preview_gate.sh   # /tests parity (landing/lib/tests.ts <-> competitive-proof) 80/80
```

**Canli yayin:** Cloudflare Pages bu repoda Git bagli degil — `git push` siteyi guncellemez.
`bash scripts/website_publish.sh` (repo kokunden; `landing/` icinden degil).

**Analytics + Search Console (tek seferlik):**
```bash
# Otomatik (Cloudflare API token ile analytics + istege bagli GSC DNS):
LG_CF_API_TOKEN=<token> bash scripts/website_search_setup.sh

# veya sadece GSC meta tag (API gerekmez):
GSC_META_TOKEN=<google-content> bash scripts/website_search_setup.sh

bash scripts/website_publish.sh
```
Sablon: `landing/env.example` → `landing/.env.local` (commit edilmez).

GSC sitemap (dogrulama sonrasi): Search Console → Site haritalari → `https://ceniklinuxlogguardian.org/sitemap.xml`

**Analytics (manuel):** Cloudflare Dashboard → Web Analytics → token → `NEXT_PUBLIC_CF_BEACON` (`landing/.env.local`)

## Cloudflare Pages (domain ayari)

1. Proje: `linux-log-guardian-website`
2. **Build command:** `bash scripts/website_deploy_gate.sh`
3. **Build output directory:** `landing/out` (kok `wrangler.toml` otomatik okur)
4. Custom domain ekle → HTTPS otomatik
5. **Cloudflare Dashboard (zorunlu — SRI kirilir):**
   - **Speed → Optimization → Auto Minify:** JavaScript **kapali**
   - **Scrape Shield → Email Address Obfuscation:** JS dosyalarina dokunmamali
   - Rocket Loader **kapali**
6. Deploy sonrasi dogrulama:
   ```bash
   LG_CF_PURGE=1 bash scripts/website_cf_purge.sh   # cache purge — token: LG_CF_API_TOKEN
   bash scripts/website_live_css_check.sh           # curl — CSS drift
   bash scripts/website_live_js_check.sh            # tarayici — JS SRI (curl yetmez)
   bash scripts/website_live_gate.sh                # css + js + /tests parity tek kapi
   ```
7. Canli dogrulama:
   ```bash
   curl -sI https://ceniklinuxlogguardian.org/ | grep -i strict   # HSTS
   ```

`website_live_js_check.sh` basarisiz ve konsolda `Failed to find a valid digest in the integrity attribute`
gorurseniz: Auto Minify acik — JS minify SRI hash'i bozuyor.

## Onemli

- `landing/out/` ve `landing/.next/` git'e **commit edilmez** (`.gitignore`)
- Kanit dosyalari: `bash scripts/landing_sync_assets.sh` → `landing/public/evidence/`
- `/tests` parity: icerik degisince `python3 scripts/competitive_proof_build.py` + `bash scripts/website_preview_gate.sh`
