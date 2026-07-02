# Ücretsiz araç — “en iyi” yol haritası

Satış değil; topluluk için MIT nginx log → WAF → ban.  
Dürüst liste: ne bitti, ne açık.

**Operasyon:** [LAPTOP_OPS.md](LAPTOP_OPS.md) · **15 dk:** [QUICKSTART_15MIN.md](QUICKSTART_15MIN.md) · **VPS:** [VPS_SETUP.md](VPS_SETUP.md)

---

## Öncelik sırası (cano — 2026-06)

| Sıra | Hedef | Durum | Not |
|------|--------|-------|-----|
| **1** | Threat intel live (AbuseIPDB/OTX) | ✅ | `install_threat_intel_stack.sh` + proof pass |
| **2** | 72h soak kanıtı | ✅ | VM `72.0h` PASS · laptop'a `scp` + `publish_soak_report.sh` |
| **3** | EPS bench / 10K replay | ✅ | `corpus_10k_proof.sh` recall PASS · dev gate skip-cat |
| **4** | Log-tailing → hibrit (inline consult) | ✅ | `nginx_hybrid_proof.sh` · `proof_replay_webhook_ban.sh` |
| **5** | XDP laptop/VPS kanıtı | 📋 | Laptop: ipset fallback ✅ · VPS: `eth0` |
| **6** | `.deb` / release binary | ✅ | `bash scripts/build_deb.sh` → `dist/*.deb` (~5M) |
| — | GIF onboarding | ⏸️ | Plandan çıktı (senin kaydın, sonra) |
| — | Tek analyzer split | ❌ | Bilinçli — ban öncelik, zarar önleme |

---

## Öncelik 1–7 (ürün)

| # | Hedef | Durum | Not |
|---|--------|-------|-----|
| 1 | Kurulum sürtünmesi ≈ 0 | ✅ kod | `install_first_run.sh` + `post_install_verify.sh` |
| 2 | İlk 5 dk “vay be” | ✅ | `demo_3min.sh` + dashboard `/tests` |
| 3 | Yanlış beklenti yok | ✅ | README — DDoS / ModSec dürüstlüğü |
| 4 | 72h stabilite kanıtı | ✅ | `soak-report.json` 72.0h, 864 örnek, 0 fail |
| 5 | FP ısınma varsayılan | ✅ | `fp_learn_warmup.sh` + prod store |
| 6 | nginx format tek komut | ✅ | `enforce_*` |
| 7 | XDP farkı | 📄 VPS | [VPS_SETUP.md](VPS_SETUP.md) §2 |

---

## Güvenlik (yüksek ROI)

Demo parolalar (`DegistirBeni!123`, dashboard `ChangeMeOnFirstLogin!`) **bilinçli** — topluluk girişi; değiştirme zorunlu değil (laptop).

| Madde | Durum | Dosya |
|-------|-------|-------|
| API fail-closed | ✅ | `api_server.c` |
| Read API auth | ✅ | `api_check_read_auth` |
| Consult + ban rate limit | ✅ | `api_server.c` |
| Metrics loopback | ✅ | `metrics.c` |
| Internet-facing harden gate | ✅ | `detect_internet_facing.sh` |
| Güvenlik profilleri | ✅ | [SECURITY_PROFILES.md](SECURITY_PROFILES.md) |
| Soak kilidi + grace | ✅ | `soak_active_lock.sh` |
| Threat feed keys | ✅ | `/etc/log-guardian/threat-feed.env` chmod 600 |

---

## Threat intel (çift katman)

| Katman | Ne | Komut |
|--------|-----|-------|
| **Hepsi (key opsiyonel)** | Firehol + API | `sudo bash scripts/install_threat_intel_stack.sh` |
| **Durum** | Key var mi? ipset? | `bash scripts/threat_intel_status.sh` |
| **Kanıt** | JSON rapor | `bash scripts/threat_feed_live_proof.sh` |

---

## XDP — laptop vs VPS

| Ortam | Ne yapılır |
|-------|------------|
| **Laptop** | ipset v4/v6 fallback ✅ · `ipv6_ban_e2e.sh` · daemon XDP map yok = normal |
| **VPS** | `log-guardian-daemon --iface eth0` · [VPS_SETUP.md](VPS_SETUP.md) · XDP pin + kernel drop kanıtı |

---

## Bilerek yapılmayanlar

- L3/L4 DDoS mitigation (CDN upstream)
- ModSecurity inline EPS rekabeti (dürüst bench var)
- Analyzer/API proses split (tek binary — ban öncelik)
- Kapalı kaynak SaaS paneli

---

## Hızlı komutlar

```bash
sudo bash scripts/install_first_run.sh
bash scripts/post_install_verify.sh
sudo bash scripts/install_threat_intel_stack.sh        # Firehol (key yok) + API opsiyonel
bash scripts/threat_intel_status.sh
bash scripts/threat_feed_live_proof.sh
bash scripts/laptop_soak_72h.sh --start                # dev bitince
bash scripts/build_deb.sh                              # .deb paketi
```

Son güncelleme: repo ile senkron — `bash scripts/docs_consistency_check.sh`
