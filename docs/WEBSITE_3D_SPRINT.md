# Linux Log Guardian — Premium 3D Sprint (72 saat)

**Hedef:** [Active Theory](https://activetheory.net/) + [Lusion](https://lusion.co/) seviyesinde immersive hero + scroll-driven 3D dünya.  
**Kuzey yıldızı:** Lusion mouse-reactive 3D + Active Theory scroll sineması.  
**Marka:** Iron Man paleti — kırmızı `#E11D24`, altın `#FFB800`, arc cyan `#00E5FF`, taban `#070709`.  
**Build:** `bash scripts/website_build.sh` · Preview: `bash scripts/preview_website.sh`

---

## 1. Referans analizi — ne alıyoruz, ne almıyoruz

| Site | Alınacak pattern | Log Guardian’a uyarlanması |
|------|------------------|----------------------------|
| **[Active Theory](https://activetheory.net/)** | Tek WebGL sahne, scroll = timeline, minimal chrome | **Ana mimari.** Pipeline hikâyesi scroll ile açılır |
| **[Lusion](https://lusion.co/)** | Hero’da 3D obje kümesi, mouse parallax, “scroll to explore” | **Hero etkileşimi.** Kalkan/plus geometrileri mouse ile döner |
| **[Lando Norris](https://landonorris.com/)** | Bölüm bölüm scroll anlatım, tipografi dramaturjisi | Bridge + bölüm geçişleri, büyük tip |
| **[Unseen](https://unseen.co/)** | Enter curtain, ses opsiyonu, “drag to explore” | Enter + ilk 3 sn “world boot” |
| **[Scout Motors](https://www.scoutmotors.com/)** | Ürün hero, scroll chapter, sade nav | Core mesaj: log → WAF → ban |
| **[Obys](https://obys.agency/)** | Grid + horizontal project rail | `#work` showcase rail (mevcut, cilalanacak) |
| **[Loveiko](https://loveiko.com/)** | Yatay slider navigasyon | Chapter index + drag rail |
| **[Dogstudio](https://dogstudio.co/)** | Showreel energy, bold type | Case overlay video loop |
| **[Apple](https://www.apple.com/)** / **[Genesis](https://www.genesis.com/)** | Okunabilirlik, boşluk, ürün netliği | **Metin her zaman kazanır** — 3D arka planda |
| **[Bruno Simon](https://bruno-simon.com/)** | Tam 3D oyun dünyası | ❌ **Kapsam dışı** (72h + CSP + ürün sitesi) |
| **[Gufram](https://gufram.it/prodotti/detecma-grey/)** | Parametrik form, materyal | Tek hero obje ailesi için ilham |
| **[The Mill](https://www.themill.com/)** | Reel + craft | Evidence bölümü sinematik geçiş |

### Önceki hatalardan dersler (tekrar etme)

1. **6 canvas + CSS grid + WebGL shader üst üste** → turuncu wash, okunamaz metin.
2. **`lg-spine-global` JS ile canvas’ı tekrar açmak** → CSS ile kapatılan katman geri geldi.
3. **Kart opaklığı %40** → arka plan metni yedi.
4. **Spec ile UI çelişkisi** (`WEBSITE_MOTION_SPEC` amber/violet vs Iron Man) → tek palet doc.

**Kural:** Tek WebGL canvas, HTML içerik üstte, opaklık ≥ %82, 3D asla full-screen color wash olmaz.

---

## 2. Tasarım konsepti: “Reactor Pipeline”

Log Guardian = nginx log → OWASP CRS → kernel ban. Görsel metafor:

```
[LOG STREAM] ──► [WAF CORE] ──► [KERNEL SHIELD] ──► BAN
     │              │                │
  altın parçacık   kırmızı grid    cyan arc pulse
```

### Hero (Lusion + Active Theory)

- Viewport ortasında **3D “shield cluster”**: birbirine kenetlenmiş plus/kalkan primitive’leri (Lusion’daki yeşil/siyah/beyaz plus’ların Log Guardian versiyonu: kırmızı metal, altın edge, cyan core glow).
- **Mouse parallax:** `pointermove` → grup Y/X tilt + hafif depth shift (max ± workspaces 8°).
- **Scroll phase 0→1:** kamera zoom-out, grid zemin belirir, objeler dağılar → bridge bölümüne morph.
- Arka plan: koyu `#070709`, **kırmızı dik grid** (zemin), **sarı 60°/120°** ince çizgiler (ayrı CSS katman — düşük opaklık, drift animasyon).

### Scroll world (Active Theory)

Tek timeline, 12 chapter (mevcut `LG_PAGE_SECTIONS`):

| Scroll % | Sahne | 3D olay |
|----------|-------|---------|
| 0–12% | Hero | Cluster + logo glow |
| 12–22% | Bridge | Parçacık paketi hat boyunca akar |
| 22–40% | Work rail | Objeler showcase kartlarına “snap” |
| 40–55% | Compare | Split view — sol cloud (soluk), sağ kernel (parlak) |
| 55–70% | Stats | Counter burst, grid pulse |
| 70–100% | Footer chapters | Sahne fade, 3D minimal |

---

## 3. Teknik mimari

### 3.1 Dosya yapısı (yeni)

```
assets/website/
  webgl/
    lg-scene.js          # Three.js sahne, tek giriş
    lg-hero-cluster.js   # Lusion-style geometry + materials
    lg-scroll-driver.js  # scroll → uniform timeline
    lg-quality.js        # tier: ultra|high|lite|off
    lg-post.js           # bloom (arc cyan), optional FXAA
  webgl-runtime.js       # build: three.module min + above → tek bundle
  boot-enter.js          # enter curtain (mevcut)
  i18n.runtime.js        # DOM motion, initWebGL() çağrısı
  index.html             # <canvas id="lg-webgl-stage">
```

### 3.2 CSP uyumu

| Kısıt | Çözüm |
|-------|--------|
| `script-src` hash-only | `webgl-runtime.js` build → SRI hash → `website_refresh_sri.sh` |
| `connect-src 'none'` | Harici CDN yok; Three.js **vendor’da repoya gömülü** |
| `worker-src 'none'` | Physics worker yok; Rapier/bruno tarzı fizik yok |
| `require-sri-for script` | Her deploy `website_build.sh` zorunlu |
| Trusted Types | WebGL bundle `innerHTML` kullanmaz |

**Build pipeline eklentisi:**

```bash
# scripts/website_bundle_webgl.sh (yeni)
# esbuild: three + lg-scene → webgl-runtime.js
bash scripts/website_bundle_webgl.sh
bash scripts/website_bundle_i18n.py
bash scripts/website_refresh_sri.sh   # 3 script hash: boot-enter, i18n, webgl-runtime
bash scripts/website_build.sh
```

### 3.3 Tek canvas kuralı

- `#lg-webgl-stage` — `position:fixed; inset:0; z-index:1; pointer-events:none`
- Eski `#lg-motion-spine-global`, hero/bridge/rail spine canvas’ları → **kaldır veya display:none kalıcı**
- CSS atmosphere (`lg-atmosphere-*`) — WebGL **altında** dekoratif grid (mevcut, opaklık düşük)

### 3.4 Kalite katmanları

| Tier | Koşul | 3D |
|------|-------|-----|
| **off** | `prefers-reduced-motion` | CSS grid only |
| **lite** | `<768px` veya `data-lg-motion-lite` | Statik hero screenshot / düşük poly |
| **high** | Desktop default | Full scene, bloom kapalı |
| **ultra** | `matchMedia('(min-width:1280px)')` + dpr≤2 | Bloom + parallax + 60fps hedef |

---

## 4. 72 saatlik sprint — faz faz

### Faz 0 — Donmuş kararlar (2 saat) ✅ bu doküman

- [ ] Palet: Iron Man (spec doc güncelle)
- [ ] Tek canvas + tek timeline onayı
- [ ] Bruno/ tam oyun dünyası **reddedildi**

---

### Faz 1 — Altyapı + boş sahne (Saat 0–8)

**Deliverable:** Siyah ekranda dönen test küpü, enter sonrası mount, mobile’da CSS fallback.

| Saat | İş |
|------|-----|
| 0–2 | `vendor/three/` pin (r160+), `website_bundle_webgl.sh`, CSP 3-script |
| 2–4 | `lg-scene.js`: renderer, resize, rAF loop, dispose |
| 4–6 | `index.html` canvas slot; eski spine canvas’ları temizle |
| 6–8 | `initWebGL()` enter-complete hook; lite/off tier; preview gate yeşil |

**Kabul:** `http://127.0.0.1:8765/?enter=1` → enter bitince WebGL görünür, metin okunur.

---

### Faz 2 — Hero “Shield Cluster” (Saat 8–24)

**Deliverable:** Lusion kalitesinde mouse-reactive 3D hero.

| Saat | İş |
|------|-----|
| 8–12 | `lg-hero-cluster.js`: InstancedMesh plus primitives, PBR materials (red/gold/cyan) |
| 12–16 | Mouse parallax + inertia (lerp 0.08) |
| 16–20 | Işık: key rim + cyan fill; zemin grid (shader veya CSS sync) |
| 20–24 | Enter anim: cluster scale 0→1, bloom pulse arc cyan |

**Referans:** Lusion plus cluster — mouse ile “oynuyor” hissi.

**Kabul:** 60fps desktop, hero metin `#f5f5f5` net, turuncu wash yok.

---

### Faz 3 — Scroll timeline (Saat 24–36)

**Deliverable:** Active Theory tarzı scroll = kamera + sahne morph.

| Saat | İş |
|------|-----|
| 24–28 | `lg-scroll-driver.js`: `scrollY / (docHeight - vh)` → `{ hero, bridge, work, … }` |
| 28–32 | Bridge: parçacık çizgisi `#lg-motion-bridge` DOM rect ile sync |
| 32–36 | Section 3D: kart hover’da ilgili mesh highlight |

**Kabul:** Bridge scroll progress bar ile 3D paket aynı fazda.

---

### Faz 4 — UI premium pass (Saat 36–44)

**Deliverable:** Apple/Genesis okunabilirlik + Obys grid disiplini.

| Saat | İş |
|------|-----|
| 36–38 | Nav: cam bar, scroll-shrink |
| 38–40 | Tipografi: hero clamp, section eyebrows `//:01` |
| 40–42 | Kartlar: `%84–88` bg, blur 14px, kırmızı border 1px |
| 42–44 | Footer + CTA: tek primary red, gold secondary |

---

### Faz 5 — Bölüm sinemaları (Saat 44–56)

| Bölüm | Efekt |
|-------|-------|
| Compare | Split shader: cloud grey vs kernel red |
| Stats | 3D sayılar particle burst (DOM counter sync) |
| Evidence | Case overlay video + 3D fade back |
| Tests/assets/website/media/ | `.webm` loop CSP `media-src 'self'` |

---

### Faz 6 — Enter + geçişler (Saat 56–62)

- Enter counter → WebGL `enterBoost` uniform (mevcut boot-enter.js hook)
- Section wipe: DOM `#lg-motion-wipe` + WebGL flash sync
- `?enter=1` force; session `lg_enter_rev7`

---

### Faz 7 — Perf + a11y (Saat 62–68)

| Test | Hedef |
|------|-------|
| Lighthouse desktop perf | ≥ 85 |
| Lighthouse mobile | ≥ 75 |
| reduced-motion | CSS only, anında skip |
| `website_smoke.sh` | PASS |
| `website_security_check.sh` | PASS |

---

### Faz 8 — Polish + deploy (Saat 68–72)

- `website_lighthouse.sh` baseline kayıt
- `website_award_pack.sh` — FWA/Awwwards submission ZIP
- `WEBSITE_MOTION_SPEC.md` palet + WebGL bölümü sync
- Prod deploy checklist (`WEBSITE_DEPLOY.md`)

---

## 5. Ekip / vardiya önerisi (tek geliştirici)

```
Gün 1 (0–24h):  Faz 1 + Faz 2 başlangıç — “WebGL çalışıyor + hero cluster”
Gün 2 (24–48h): Faz 2 bitir + Faz 3 — “scroll sineması”
Gün 3 (48–72h): Faz 4–8 — “UI + bölümler + perf + deploy”
```

**Her 8 saatte bir:** `bash scripts/preview_website.sh` + Ctrl+Shift+R + screenshot karşılaştırma.

---

## 6. Riskler ve fallback

| Risk | Olasılık | Fallback |
|------|----------|----------|
| Three bundle > 600KB | Orta | Tree-shake; sadece WebGLRenderer + Scene + InstancedMesh |
| Mobile GPU zayıf | Yüksek | lite tier: CSS + statik PNG hero |
| CSP hash drift | Orta | Her commit `website_build.sh`; CF Auto Minify kapalı |
| 72h yetmez Faz 5 | Yüksek | Faz 5 kısalt — compare/stats DOM-only, hero+scroll ship |
| Okunabilirlik regresyonu | Orta | **Ship gate:** metin kontrast WCAG AA zorunlu |

**Minimum shippable (48h):** Faz 1–3 + Faz 4 nav/hero = Active Theory “lite” + Lusion hero.  
**Full vision (72h):** Tüm fazlar.

---

## 7. Hemen başlangıç checklist (ilk commit)

```bash
# 1. Branch
git checkout -b feat/website-3d-sprint

# 2. Three vendor + bundle script (Faz 1)
# 3. index.html: <canvas id="lg-webgl-stage">
# 4. site.css: z-index stack (atmosphere=0, webgl=1, content=2)
# 5. boot-enter.js: finishEnter → lg-webgl-ready event
# 6. Build
bash scripts/website_bundle_webgl.sh   # eklenecek
bash scripts/website_build.sh
bash scripts/preview_website.sh
```

---

## 8. Başarı kriterleri (kullanıcı göz testi)

1. Enter animasyonu `?enter=1` ile her seferinde çalışır.
2. Hero’da mouse ile 3D küme hareket eder (Lusion hissi).
3. Scroll ile sahne evrilir (Active Theory hissi).
4. **Hiçbir bölümde metin kaybolmaz** — koyu cam kart, beyaz/gri tipografi.
5. Turuncu full-screen wash **yok**.
6. `/tests` sayfası etkilenmez (home-only WebGL).
7. `bash scripts/website_build.sh` yeşil.

---

*Son güncelleme: sprint başlangıcı — Faz 1 koduna geçilebilir.*
