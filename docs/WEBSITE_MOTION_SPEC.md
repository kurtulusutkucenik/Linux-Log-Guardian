# Linux Log Guardian — Website Motion Spec

Statik tanıtım sitesi (`assets/website/`) için süre, easing, bölüm haritası ve perf bütçesi.
Build: `bash scripts/website_build.sh` · Preview: `bash scripts/preview_website.sh`

## Easing token’ları (`site.css`)

| Token | Değer | Kullanım |
|-------|-------|----------|
| `--ease` | `cubic-bezier(0.25, 0.1, 0.25, 1)` | Renk, border, genel UI |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Giriş, reveal, karakter/word split |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Buton hover, mikro etkileşim |

## Süre haritası (ms)

| Olay | Süre | Not |
|------|------|-----|
| Enter counter (home) | 5500 | Skip anında · Esc |
| Enter counter (/tests) | 2800 | Daha kısa |
| Enter out wipe | 1100 | `lg-motion-enter-out` |
| Enter nefes (UI cascade öncesi) | **1200** | `lg-enter-breath` |
| Hero title word split | 180 + n×72 | Bridge title: 420 + n×48 |
| Bridge step illuminate | scroll-driven | 4 adım, kümülatif `lg-bridge-step-lit` |
| Section wipe (scroll) | 780 | `lg-motion-wipe-sweep` |
| Case overlay açılış | 420 | Panel + backdrop |
| WebGL enter boost | 1500 | Enter sonrası yoğunluk |
| Marquee loop | 28s | linear infinite |

## Renk / glow

Arka plan (WebGL + trail): **amber · violet · copper · silver** — mavi/kırmızı/yeşil/turkuaz yok.

| Bölüm | Accent | Glow |
|-------|--------|------|
| WebGL grid | copper + violet wire | amber pulse + spark specks |
| Fare izi | violet → amber → cream | — |
| Hero parçacık | amber / violet | — |
| UI kart / CTA | `#e30a17` (marka) | Değişmedi |

## Bölüm outline (01–12)

| No | Selector | Etiket (pager) |
|----|----------|----------------|
| 01 | `.lg-motion-hero` | Ana sayfa |
| 02 | `#lg-motion-bridge` | Pipeline |
| 03 | `#work` | Selected |
| 04 | `#neden` | Why |
| 05 | `#rakipler` | Vs |
| 06 | `.lg-motion-stats` | Stats |
| 07 | `#hakkimizda` | About |
| 08 | `#kurulum` | Setup |
| 09 | `#dashboard` | Pro |
| 10 | `#testler` | Tests |
| 11 | `#kanit` | Evidence |
| 12 | `#iletisim` | Contact |

Her bölümde: `lg-section-outline` + `//:` eyebrow (i18n).

## Test sayısı (tek kaynak)

Kaynak: `competitive-proof.json` → `scripts/website_embed_tests.py`

| Metin | Alan | Anlam |
|-------|------|-------|
| Toplam | `/tests`, teaser, toolbar | Tüm kanıt sayısı |
| Geçen | hero metrik, stats, marquee, why | `status=pass` sayısı |

Embed script locale + `index.html` `data-lg-count` alanlarını senkronlar.

## CSP notları

- Script: SRI hash (`i18n.js`, `boot-enter.js`, `test-results.js`)
- Style: SRI hash (`site-*.css`)
- `media-src 'self'` — case overlay `.webm` loop
- `trusted-types lgI18n` — innerHTML yalnızca i18n policy
- Video ekleme: `assets/website/media/` → `website_refresh_sri.sh` allowlist

## Perf bütçesi (Lighthouse hedef)

| Kategori | Desktop | Mobile |
|----------|---------|--------|
| Performance | ≥ 85 | ≥ 75 |
| Accessibility | ≥ 95 | ≥ 95 |
| Best Practices | ≥ 95 | ≥ 90 |
| SEO | ≥ 90 | ≥ 90 |

Ölçüm: `bash scripts/website_lighthouse.sh` → `docs/website-lighthouse.json`

Kapalı ağır efektler:
- `prefers-reduced-motion: reduce` → scroll-jack off, WebGL off, enter skip
- `data-lg-motion-lite` / düşük GPU → hero canvas off, spine lite

## Reduced-motion audit checklist

- [ ] Enter: anında `lg-enter-done`
- [ ] WebGL + hero canvas: mount yok
- [ ] Compare rail: normal tablo scroll, tüm satırlar görünür
- [ ] Bridge / rail / compare sticky: normal akış (opacity anim yok)
- [ ] Marquee: `animation: none`
- [ ] Case overlay: focus-trap aktif, video autoplay yok

## Build kapıları

```bash
bash scripts/website_build.sh          # SRI + embed + security
bash scripts/website_preview_gate.sh     # test parity
bash scripts/website_lighthouse.sh       # baseline kayıt
```
