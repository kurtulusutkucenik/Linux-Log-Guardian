/* Linux Log Guardian — statik site çevirileri */
const I18N = {
  "tr": {
    "meta.description": "Linux Log Guardian — Türk yapımı açık kaynak nginx WAF. log → ban ~15 dk.",
    "hero.title": "Linux Log Guardian",
    "hero.tag": "nginx access log → WAF/CRS → kernel ban · tek zincir · self-hosted",
    "hero.badge_tr": "TÜRK",
    "hero.badge_opensource": "açık kaynak",
    "hero.badge_mit": "MIT",
    "hero.badge_core": "Core ~15 dk kurulum",
    "hero.badge_soak": "72h soak PASS",
    "hero.cta_install": "15 dk kurulum",
    "hero.cta_dashboard": "Dashboard (kurulum sonrası)",
    "hero.cta_tests": "Test sonuçları",
    "hero.cta_evidence": "Kanıt paketi",
    "hero.cta_contact": "İletişim",
    "hero.cta_github": "GitHub kaynak",
    "hero.proof_traction": "2,3k+ ziyaret · 4k+ sayfa · 54 ülke · kanıt PDF",
    "hero.scroll_hint": "Kaydır — keşfet",
    "hero.enter_hint": "Tıkla veya kaydır — devam",
    "enter.skip": "Atla",
    "enter.continue": "Gir",
    "section.work_eyebrow": "//:Seçili",
    "section.work_title": "Seçili kanıtlar",
    "section.work_sub": "Core · Pro · Proof · Grafana — tek zincirde ölçülebilir sonuçlar.",
    "section.work_hint": "Kaydır — diğer kanıtlar",
    "compare.eyebrow": "//:Vs",
    "compare.title": "Rakiplerle kıyas",
    "compare.sub": "Ölçülmüş kanıt — Fail2ban / CrowdSec / ModSecurity mimari notları",
    "compare.col_metric": "Metrik",
    "compare.col_lg": "Log Guardian",
    "compare.col_f2b": "Fail2ban",
    "compare.col_cs": "CrowdSec",
    "compare.col_mod": "ModSec + CRS",
    "compare.row_pipeline": "Log → WAF → kernel ban",
    "compare.row_recall": "Gerçek saldırı recall",
    "compare.row_fp": "False positive",
    "compare.row_ban": "Ban gecikmesi",
    "compare.row_proof": "Kanıt paketi PDF+JSON",
    "compare.row_mit": "MIT + TR doküman",
    "compare.val_lg_pipeline": "Tek hat",
    "compare.val_f2b_pipeline": "Yalnız ban",
    "compare.val_cs_pipeline": "Parçalı",
    "compare.val_mod_pipeline": "WAF ayrı",
    "compare.val_lg_recall": "%100 (1K+10K)",
    "compare.val_na": "—",
    "compare.val_mod_recall": "CRS parity %100",
    "compare.val_lg_fp": "%0.2",
    "compare.val_f2b_fp": "Yüksek",
    "compare.val_cs_fp": "Orta",
    "compare.val_mod_fp": "CRS bağlı",
    "compare.val_lg_ban": "~17 ms",
    "compare.val_f2b_ban": "sn–dk",
    "compare.val_cs_ban": "sn",
    "compare.val_mod_ban": "Ayrı entegrasyon",
    "compare.val_yes": "Otomatik",
    "compare.val_no": "Yok",
    "compare.val_cs_proof": "Kısmi",
    "compare.val_mod_proof": "Modül modül",
    "compare.val_partial": "Kısmi",
    "compare.val_mod_mit": "CRS açık",
    "compare.sec_strength": "Güçlü yanlar (ölçülmüş)",
    "compare.sec_honest": "Dürüst sınırlar",
    "compare.row_ja3": "Dağıtık / JA3 cluster",
    "compare.row_consult": "nginx inline consult",
    "compare.row_l7": "L7 uygulama koruması",
    "compare.row_stability": "Kısa stabilite (5 dk)",
    "compare.row_inline_eps": "Inline regex EPS",
    "compare.row_reactive": "İlk istek geçebilir",
    "compare.row_ddos": "Volumetrik L3/L4 scrub",
    "compare.row_community": "Topluluk sinyal ağı",
    "compare.row_cloud": "Edge / Cloud WAF",
    "compare.val_lg_ja3": "%100 (80 IP)",
    "compare.val_cs_ja3": "Sinyal tabanlı",
    "compare.val_lg_consult": "PASS",
    "compare.val_lg_l7": "WAF + consult + eBPF",
    "compare.val_mod_l7": "CRS inline",
    "compare.val_mod_consult": "Ayrı modül",
    "compare.val_lg_stability": "PASS (0 fail)",
    "compare.val_lg_eps": "~130 EPS (log replay)",
    "compare.val_mod_eps": "~12K EPS inline",
    "compare.val_lg_reactive": "Reaktif (log satırı)",
    "compare.val_f2b_reactive": "Reaktif",
    "compare.val_cs_reactive": "Kısmen",
    "compare.val_mod_reactive": "Inline engel",
    "compare.val_lg_ddos": "Yok — CDN önerilir",
    "compare.val_lg_community": "Self-hosted",
    "compare.val_cs_community": "Var",
    "compare.val_lg_cloud": "Origin katmanı",
    "compare.val_mod_cloud": "Proxy modu",
    "compare.note": "Dürüst sınır: ModSec inline EPS yarışında değiliz — güçlü yan entegrasyon + ban hızı + şeffaf kanıt. Detay: docs/VS_RAKIPLER.md",
    "compare.scroll_hint": "Kaydır → tabloyu keşfet",
    "compare.progress_label": "Kanıt keşfi {pct}%",
    "bridge.eyebrow": "//:Pipeline",
    "bridge.kicker": "Tek zincir · self-hosted · MIT",
    "bridge.title": "Log → WAF → Kernel Ban",
    "bridge.sub": "nginx access log satırından ipset ban'a ~17 ms — rakiplerde parçalı mimari.",
    "bridge.s1": "log",
    "bridge.s2": "CRS",
    "bridge.s3": "ban",
    "bridge.s4": "kanıt",
    "why.eyebrow": "//:Why",
    "why.title": "Neden Log Guardian?",
    "why.lead": "Rakipler parça parça — biz tek zincirde ölçülebilir kanıt sunuyoruz.",
    "why.c1_title": "Tek hat",
    "why.c1_body": "nginx log → OWASP CRS → ~17 ms kernel ban. Fail2ban + ModSec + script yığını yok.",
    "why.c2_title": "Şeffaf kanıt",
    "why.c2_body": "competitive-proof PDF, 67 test, 72h soak — rakiplerde yok veya parçalı.",
    "why.c3_title": "MIT · Türkiye",
    "why.c3_body": "Açık kaynak, Türkçe doküman, self-hosted — vendor lock-in yok.",
    "why.c4_title": "Dürüst sınır",
    "why.c4_body": "ModSec inline EPS'te değiliz; Cloudflare absorb etmez. Origin'de entegrasyon + hız.",
    "evidence.preview_pdf": "Rakip kıyas PDF — ölçülmüş bench özeti",
    "evidence.preview_json": "competitive-proof JSON — tüm metrikler makine okunur",
    "evidence.preview_bench": "ModSecurity CRS parity + EPS karşılaştırması",
    "evidence.preview_fp": "200 benign istek — false positive oranı",
    "evidence.preview_ban": "Kernel ban gecikmesi — ~17 ms ipset",
    "evidence.preview_soak": "72h soak raporu — 864 örnek, 0 fail",
    "evidence.preview_soak_md": "Soak özeti — operatör notları",
    "evidence.preview_sprint": "Sprint prod gate — FAIL:0 kanıtı",
    "evidence.preview_siem": "SIEM export — Splunk/Elastic uyumu",
    "evidence.preview_taxii": "TAXII feed entegrasyon testi",
    "evidence.preview_vm": "VirtualBox VM sprint kanıtı",
    "evidence.preview_geoip": "GeoIP MMDB — attack map verisi",
    "evidence.preview_webhook": "Webhook route proof — alert hattı",
    "evidence.preview_telegram": "Telegram canlı webhook testi",
    "pager.sec_bridge": "Pipeline köprüsü",
    "pager.sec_why": "Neden LG",
    "hero.eyebrow": "//:LOG→BAN",
    "marquee.line": "nginx log → WAF → kernel ban · 67 test · 72h soak PASS · MIT · Türkiye · açık kaynak",
    "showcase.core.eyebrow": "//:Core",
    "showcase.core.title": "What=\"we do\"",
    "showcase.core.desc": "Tek zincir: nginx log → OWASP CRS → ~17 ms kernel ban. ~15 dakikada üretim.",
    "showcase.pro.eyebrow": "//:Pro",
    "showcase.pro.title": "Pro=\"SOC\"",
    "showcase.pro.desc": "Filo, SOC timeline, Grafana — kurulum sonrası kendi sunucunuzda opsiyonel katman.",
    "showcase.proof.eyebrow": "//:Proof",
    "showcase.core.peek": "Tek zincir · ~17 ms ban",
    "showcase.pro.peek": "Fleet · SOC timeline",
    "showcase.proof.peek": "67 test ·                                                                        72h soak PASS",
    "showcase.proof.title": "Proof=\"67 test\"",
    "showcase.proof.desc": "68 otomatik test, competitive PDF, 72h soak — dashboard /tests ile aynı matris.",
    "showcase.cta": "Keşfet",
    "showcase.core.short": "CORE",
    "showcase.core.tag1": "~17 ms ban",
    "showcase.core.tag2": "OWASP CRS",
    "showcase.pro.short": "SOC",
    "showcase.pro.tag1": "Filo",
    "showcase.pro.tag2": "Timeline",
    "showcase.proof.short": "KANIT",
    "showcase.proof.tag1": "67 test",
    "showcase.proof.tag2": "72h soak",
    "showcase.grafana.short": "METRİK",
    "showcase.grafana.eyebrow": "//:Metrics",
    "showcase.grafana.title": "Grafana=\"SOC\"",
    "showcase.grafana.desc": "Tenant etiketli Prometheus, Grafana panoları ve alert kuralları — self-hosted gözlemlenebilirlik.",
    "showcase.grafana.peek": "Prometheus · tenant alert",
    "showcase.grafana.tag1": "Prometheus",
    "showcase.grafana.tag2": "Alert",
    "stats.tests_label": "Otomatik test",
    "stats.eyebrow": "//:Stats",
    "stats.title": "Rakamlar",
    "stats.lead": "Ölçülmüş kanıt — otomatik test, soak, ban gecikmesi, erişim.",
    "stats.soak": "72h",
    "stats.soak_label": "Soak PASS",
    "stats.ban_suffix": "ms",
    "stats.ban_label": "Kernel ban",
    "stats.countries_label": "Ülke erişimi",
    "section.about_eyebrow": "//:About",
    "section.flow_eyebrow": "//:Pipeline",
    "section.scope_eyebrow": "//:Honest",
    "section.github_eyebrow": "//:Source",
    "section.install_eyebrow": "//:Setup",
    "section.dashboard_eyebrow": "//:Pro",
    "section.layers_eyebrow": "//:Layers",
    "section.evidence_eyebrow": "//:Kanıt",
    "section.tests_eyebrow": "//:Proof",
    "section.laptop_eyebrow": "//:Doğrula",
    "section.contact_eyebrow": "//:Contact",
    "cta.banner.title": "Kuruluma hazır mısınız?",
    "cta.banner.body": "Klonla, kur, FAIL:0 doğrula — Core dashboard olmadan da çalışır.",
    "cta.banner.btn": "15 dk kurulum",
    "nav.home": "Ana sayfa",
    "nav.install": "Kurulum",
    "nav.tests": "Testler",
    "nav.compare": "Rakipler",
    "nav.evidence": "Kanıt",
    "nav.contact": "İletişim",
    "nav.prev_section": "Önceki bölüm",
    "nav.next_section": "Sonraki bölüm",
    "nav.index": "Dizin",
    "index.title": "Bölümler",
    "index.close": "Kapat",
    "case.close": "Kapat",
    "case.open_hint": "Ön karta tıkla — case study",
    "case.prev": "Önceki kanıt",
    "case.next": "Sonraki kanıt",
    "case.core.lead": "Tek zincir: nginx access log → OWASP CRS → ~17 ms kernel ban. Kendi sunucunuzda ~15 dakikada üretim — Fail2ban + ModSec script yığını yok.",
    "case.core.cta": "Kurulum rehberi",
    "case.pro.lead": "Core sonrası opsiyonel Pro: filo senkronu, SOC timeline, Grafana — hepsi kendi altyapınızda self-hosted.",
    "case.pro.cta": "Dashboard & SOC",
    "case.proof.lead": "68 otomatik test, competitive-proof PDF, 72h soak — /tests ile aynı matris. Her sürümde FAIL:0 kapısı.",
    "case.proof.cta": "Testleri aç",
    "case.grafana.lead": "Tenant etiketli Prometheus metrikleri, Grafana panoları ve alert kuralları — vendor lock-in olmadan gözlemlenebilirlik.",
    "case.grafana.cta": "Metrik katmanı",
    "hero.metric_ban_val": "~17 ms",
    "hero.metric_ban": "kernel ban",
    "hero.metric_tests": "otomatik test",
    "hero.metric_soak_val": "72h",
    "hero.metric_soak": "soak PASS",
    "pager.hint": "Bölüm gezintisi — oklarla atla",
    "pager.sec_home": "Ana sayfa",
    "pager.sec_work": "Kanıtlar",
    "pager.sec_compare": "Rakipler",
    "pager.sec_stats": "Rakamlar",
    "pager.sec_about": "Hakkında",
    "pager.sec_install": "Kurulum",
    "pager.sec_dashboard": "Dashboard",
    "pager.sec_tests": "Testler",
    "pager.sec_evidence": "Kanıt",
    "pager.sec_contact": "İletişim",
    "pager.next_to": "Sonraki → {section}",
    "theme.label_light": "Açık mod",
    "theme.label_dark": "Koyu mod",
    "about.title": "Hakkında — Linux Log Guardian",
    "site.purpose": "<strong>Bu web sitesi halka açık tanıtım ve indirme sayfasıdır.</strong> Statik içerik sunar: proje tanıtımı, kurulum rehberi, kanıt paketi ve iletişim. Log Guardian yazılımı burada çalışmaz — kendi Linux sunucunuza kurarsınız.",
    "about.body": "<p><strong>Linux Log Guardian</strong>, Türkiye'de geliştirilen, tamamen <strong>açık kaynak (MIT)</strong> bir self-hosted güvenlik yazılımıdır. Fail2ban + ModSecurity + ayrı script karmaşası yerine tek bir zincir sunar: <em>nginx logunu oku → OWASP CRS kurallarıyla eşle → kernel seviyesinde banla</em>.</p><p>Kaynak kod <a href=\"https://github.com/kurtulusutkucenik/Linux-Log-Guardian\">GitHub</a> üzerinde — inceleyebilir, fork edebilir ve kendi sunucunuzda çalıştırabilirsiniz.</p><ul><li>Binary: <code>log-guardian</code> · paket: <code>log-guardian_*.deb</code></li><li><strong>Core</strong> tek başına üretimde (~15 dk)</li><li>Dashboard, Grafana, fleet = <strong>opsiyonel Pro</strong></li></ul>",
    "flow.title": "Tek zincir: logdan kernel bana",
    "flow.s1": "nginx access log",
    "flow.s2": "Parser + CRS/WAF",
    "flow.s3": "Ban pipeline",
    "flow.s4": "ipset / kernel",
    "flow.s5": "Metrik + dashboard",
    "flow.note": "XDR, Wasm marketplace ve LLM Copilot uzun vadeli opsiyonel katmanlardır — Core tek başına üretimde kullanılabilir.",
    "scope.honest.title": "Dürüst sınırlar (rakip iddiası değil)",
    "scope.honest.body": "<ul><li><strong>Reaktif mimari</strong> — log satırı düşene kadar ilk istek geçebilir; inline ModSec hızında değiliz.</li><li><strong>L7 uygulama katmanı</strong> — CRS/WAF, nginx consult ve eBPF HTTP probe ile koruma var; bu volumetrik L3/L4 scrub değil.</li><li><strong>Volumetrik L3/L4 DDoS</strong> absorb etmiyoruz — Cloudflare/CDN üstüne konuruz.</li><li><strong>Dağıtık botnet</strong> — IP başına ban; CrowdSec sinyal ağı yok.</li><li><strong>Yapar:</strong> log → CRS/WAF → ~17&nbsp;ms kernel ban, kanıt PDF, Telegram ops, MIT self-hosted.</li></ul>",
    "install.title": "Kurulum rehberi (detaylı)",
    "install.intro": "<p>Ubuntu/Debian üzerinde <strong>sıfırdan Core kurulumu</strong> (~15 dk). Kaynak: <a href=\"https://github.com/kurtulusutkucenik/Linux-Log-Guardian\">GitHub — Linux-Log-Guardian</a>. İki yol: hazır <strong>.deb</strong> (önerilen) veya kaynak koddan derleme. Laptop / VM'de XDP olmadan da çalışır. Repoda: <code>docs/QUICKSTART_NGINX.md</code> · <code>docs/LAPTOP_OPS.md</code>.</p>",
    "install.terminal_label": "15 dakikalık kurulum — canlı terminal",
    "install.terminal_demo": "$ sudo dpkg -i log-guardian_*_amd64.deb\nSelecting previously unselected package log-guardian.\nlog-guardian kuruldu.\n$ sudo bash /usr/local/share/log-guardian/scripts/install_first_run.sh\n[OK] log-guardian.service active\n[OK] --health IPC\n[OK] API fail-closed (tokensiz 403)\n\n=== ozet ===\n  FAIL: 0   WARN: 0\n[OK] post_install_verify — kurulum kapisi gecti",
    "install.expect_label": "Beklenen çıktı (örnek):",
    "install.deb_title": "A) Sıfır sunucu — .deb paketi (önerilen)",
    "install.deb_body": "<p>Derleme gerektirmez. Paket binary, systemd, kurallar ve script'ler içerir. <strong>Upgrade güvenli:</strong> mevcut <code>/etc/log-guardian/rules.conf</code> silinmez.</p><p><strong>İndir:</strong> <a href=\"https://github.com/kurtulusutkucenik/Linux-Log-Guardian/releases\">GitHub Releases</a> (<code>log-guardian_*_amd64.deb</code>) veya repodan <code>bash scripts/build_deb.sh</code> → <code>dist/</code>.</p>",
    "install.deb_s1_title": "1. Bağımlılıklar",
    "install.deb_s1_body": "<p>İlk kurulumda Debian paket bağımlılıklarını yükleyin. nginx kurulu değilse aynı komutla eklenebilir.</p>",
    "install.block_deb_deps": "sudo apt-get update\nsudo apt-get install -y ipset libbpf1 libcurl4 libpcre2-8-0 libsqlite3-0 \\\n  libssl3 libelf1 libz1 liburing2 nginx",
    "install.out_deb_deps": "Reading package lists... Done\nSetting up ipset (7.x) ...\nSetting up libbpf1:amd64 ...\nSetting up nginx (1.x) ...",
    "install.deb_s2_title": "2. Paketi kur",
    "install.deb_s2_body": "<p><code>dpkg -i</code> sonrası bağımlılık hatası görürseniz <code>apt-get install -f</code> çalıştırın. postinst otomatik olarak <code>log-guardian</code> kullanıcısını, izinleri ve servisleri hazırlar.</p>",
    "install.block_deb": "# Copy .deb to server (scp, wget, USB...)\nsudo dpkg -i log-guardian_*_amd64.deb\nsudo apt-get install -f   # if dependencies missing\n\n# On success:\n#   log-guardian kuruldu.\n#   sudo bash .../install_first_run.sh\n#   bash .../post_install_verify.sh",
    "install.out_deb": "Selecting previously unselected package log-guardian.\n(Reading database ... 100%)\nSetting up log-guardian (72e5a7b) ...\n[deb_post_install] rules.conf olusturuldu: /etc/log-guardian/rules.conf\n\nlog-guardian kuruldu.",
    "install.deb_s3_title": "3. İlk çalıştırma ve doğrulama",
    "install.deb_s3_body": "<p>nginx log formatı, FP trust ve API güvenliğini tek seferde hazırlar. Script yolu paket içindedir (<code>/usr/local/share/log-guardian/scripts/</code>).</p>",
    "install.block_deb_first": "sudo bash /usr/local/share/log-guardian/scripts/install_first_run.sh\nsudo bash /usr/local/share/log-guardian/scripts/ensure_api_security.sh\nbash /usr/local/share/log-guardian/scripts/post_install_verify.sh",
    "install.out_deb_first": "[OK] log-guardian.service active\n[OK] log-guardian-daemon.service active\n[OK] --health IPC\n[OK] API fail-closed (tokensiz 403)\n\n=== ozet ===\n  FAIL: 0   WARN: 0\n[OK] post_install_verify — kurulum kapisi gecti",
    "install.src_title": "B) Kaynak kod — derleme ve kurulum",
    "install.src_body": "<p><a href=\"https://github.com/kurtulusutkucenik/Linux-Log-Guardian\">GitHub</a> reposunu klonlayıp derlersiniz. Geliştirme, özelleştirme ve tam kaynak incelemesi için uygundur.</p>",
    "install.req_title": "Gereksinimler (her iki yol)",
    "install.req_body": "<ul><li>Ubuntu 22.04 / 24.04 veya Debian 12 (amd64)</li><li>nginx + yazılabilir access log</li><li>Root veya sudo (systemd, ipset, <code>/etc/log-guardian</code>)</li><li>Opsiyonel Pro: Docker (dashboard/Grafana), eBPF için uygun kernel</li></ul>",
    "install.s1_title": "Kaynak veya .deb",
    "install.s1_body": "<p>Repoyu klonlayın, derleyin ve ana kurulum scriptini çalıştırın. <code>install.sh</code> systemd unit'leri, kurallar ve nginx log formatını hazırlar.</p>",
    "install.block1": "git clone https://github.com/kurtulusutkucenik/Linux-Log-Guardian.git\ncd Linux-Log-Guardian\nmake -j$(nproc)\nsudo bash install.sh",
    "install.s2_title": "İlk çalıştırma ve API güvenliği",
    "install.s2_body": "<p>Servisleri ayağa kaldırır, API token senkronunu ve dashboard bağlantısını hazırlar.</p>",
    "install.block_api": "sudo bash scripts/install_first_run.sh\nsudo bash scripts/ensure_api_security.sh\nbash scripts/sync_dashboard_api_token.sh",
    "install.common_title": "Ortak adımlar (A ve B sonrası)",
    "install.s3_title": "Nginx log formatı",
    "install.s3_body": "<p>WAF'ın request body ve XFF okuyabilmesi için <code>log_guardian</code> formatı şart. Kurulum çoğu durumda otomatik uygular; kontrol edin:</p>",
    "install.block_nginx": "# examples/nginx-log-guardian.conf → site config\nSTRICT=1 bash scripts/check_nginx_log_format.sh\nsudo nginx -t && sudo systemctl reload nginx",
    "install.s4_title": "Doğrulama (her iki yol)",
    "install.s4_body": "<p>Sağlık, servis durumu ve Prometheus metriklerini kontrol edin. <strong>Yeşil kapı:</strong> <code>post_install_verify</code> sonunda <code>FAIL: 0</code> görmelisiniz.</p>",
    "install.block_verify": "sudo log-guardian --health\nsudo log-guardian --status\n# Source install:\nbash scripts/post_install_verify.sh\n# .deb install:\nbash /usr/local/share/log-guardian/scripts/post_install_verify.sh\ncurl -s http://127.0.0.1:9091/metrics | head",
    "install.out_health": "[HEALTH] daemon IPC: OK\n[HEALTH] BPF xdp=OFF execve=OFF lineage=OFF\n[HEALTH] RCE det=0 kill=0 lineage=0 connect=0 uptime=…s",
    "install.out_verify": "[OK] log-guardian.service active\n[OK] metrics :9091\n[OK] API fail-closed (tokensiz 403)\n[OK] nginx log_guardian format\n\n=== ozet ===\n  FAIL: 0   WARN: 0\n[OK] post_install_verify — kurulum kapisi gecti",
    "install.out_metrics": "# HELP loganalyzer_log_lines_total ...\nloganalyzer_log_lines_total{tenant_id=\"default\"} 8\nloganalyzer_ban_success_total{tenant_id=\"default\"} 8",
    "install.s5_title": "VirtualBox / XDP yok (laptop & VM)",
    "install.s5_body": "<p>eBPF/XDP olmayan ortamlarda <code>--no-xdp</code> ile ipset tabanlı ban yeterlidir. Servis bağımlılığı hatası alırsanız onarım scripti tek komuttur.</p>",
    "install.block2": "sudo bash install.sh --no-xdp\nsudo bash scripts/install_first_run.sh\n# if service FAIL:\nsudo bash scripts/repair_no_xdp_stack.sh",
    "install.tip": "<strong>İpucu:</strong> JWT ve dashboard parolası için <code>bash scripts/laptop_jwt_setup.sh</code>. 3 dakikalık demo: <code>SKIP_WEBHOOK=1 bash scripts/demo_3min.sh</code>",
    "dashboard.title": "Dashboard — kurulum sonrası (opsiyonel Pro)",
    "dashboard.where": "<strong>Önemli:</strong> Dashboard bu tanıtım sitesinde <em>çalışmaz</em>. <code>https://localhost:8443</code>, komutları çalıştırdığınız <strong>kendi Linux makinenizde</strong> açılır — ziyaretçinin tarayıcısındaki localhost sizin sunucunuz değildir.",
    "dashboard.body": "<p>Next.js tabanlı <strong>Pro dashboard</strong>: filo durumu, ban geçmişi, test sonuçları ve kanıt PDF'leri. Prod stack: <code>bash scripts/dashboard_refresh.sh</code> → <code>https://localhost:8443</code>. Hızlı UI: <code>dashboard_dev.sh</code> → <code>:3001</code>. İnternete açmadan önce <code>laptop_harden.sh</code>.</p>",
    "dashboard.access_title": "Kim, hangi şartla erişir?",
    "dashboard.access_row1_label": "Site ziyaretçisi",
    "dashboard.access_row1": "Bu sayfayı okur, kaynak veya .deb indirir — <strong>8443 açmaz</strong>, kurulum yapmaz.",
    "dashboard.access_row2_label": "Kuran kişi",
    "dashboard.access_row2": "Prod stack: <code>bash scripts/dashboard_refresh.sh</code> → <strong>https://localhost:8443</strong>. Hızlı UI: <code>dashboard_dev.sh</code> → <code>:3001</code> aynı makinede.",
    "dashboard.access_row3_label": "Uzak VPS",
    "dashboard.access_row3": "SSH tüneli: <code>ssh -L 8443:127.0.0.1:8443 …</code> — demo parola kapatılmadan internete açmayın.",
    "dashboard.req_title": "Dashboard için ek gereksinim",
    "dashboard.req_body": "<ul><li><strong>Core</strong> için yeterli: nginx + sudo — dashboard <em>zorunlu değil</em></li><li><strong>Dashboard prod</strong>: Docker + <code>dashboard_refresh.sh</code> → <code>:8443</code></li><li><strong>Dashboard dev</strong>: Node.js + <code>dashboard_dev.sh</code> → <code>:3001</code></li><li><strong>Grafana</strong> için: ayrıca <code>grafana_stack.sh</code> (opsiyonel)</li></ul>",
    "dashboard.start_title": "Kendi sunucunda başlat",
    "dashboard.start": "# On the machine where you installed (not this website):\nbash scripts/dashboard_refresh.sh\n# Browser on the same machine:\n#   https://localhost:8443\n# Login: admin / DASHBOARD_ADMIN_PASSWORD in .env",
    "dashboard.features": "<ul><li><strong>Filo:</strong> agent online/offline, son alarmlar</li><li><strong>Testler:</strong> phase100, competitive-proof, bench</li><li><strong>Raporlar:</strong> PDF/JSON kanıt paketi</li><li><strong>Grafana:</strong> <code>bash scripts/grafana_provision.sh</code> ile tenant metrikleri</li></ul>",
    "dashboard.optional": "<strong>Core yeterli mi?</strong> Evet. Sadece log → WAF → kernel ban istiyorsanız dashboard kurmanız gerekmez. CLI (<code>log-guardian --status</code>) ve Prometheus (<code>:9091/metrics</code>) Core ile gelir.",
    "dashboard.preview_title": "Arayüz önizlemesi",
    "dashboard.preview_note": "Aşağıdaki görseller örnek ekranlardır. Canlı panel yalnızca kendi kurulumunuzda çalışır.",
    "dashboard.cap1": "Filo — agent durumu ve son alarmlar",
    "dashboard.cap2": "Test paneli — phase100, bench, soak",
    "dashboard.cap3": "Grafana + Prometheus metrikleri",
    "dashboard.note": "Özet: Bu site = indir ve öğren. Dashboard = kendi sunucunda, kurulumdan sonra, isteğe bağlı.",
    "warn.title": "İnternete açmadan önce",
    "warn.p1": "Laptop/deneme: demo parola <code>DegistirBeni!123</code> bilinçli olarak açıktır.",
    "warn.p2": "Public VPS: <code>sudo env LG_NEW_PASSWORD='…' bash scripts/laptop_harden.sh</code>",
    "warn.p3": "Profiller: <code>docs/SECURITY_PROFILES.md</code>",
    "layers.title": "Katmanlar",
    "layers.core": "Core",
    "layers.core_desc": "log → WAF → ipset ban (~15 dk)",
    "layers.pro": "Pro",
    "layers.pro_desc": "eBPF daemon, dashboard, Grafana, fleet",
    "layers.opt": "Opsiyonel",
    "layers.opt_desc": "XDR, Wasm marketplace, LLM Copilot",
    "layers.note": "Pro ve opsiyonel katmanlar isteğe bağlıdır; günlük kullanım için Core yeterlidir.",
    "github.title": "Kaynak kod (GitHub)",
    "github.intro": "<p><strong>Linux Log Guardian</strong> tamamen açık kaynak (MIT). Tüm C kaynak kodu, kurulum script'leri, testler ve kanıt paketi GitHub'da yayında — kendi Linux sunucunuza kurarsınız; bu web sitesi yalnızca tanıtım sayfasıdır.</p>",
    "github.releases": "Releases (.deb)",
    "github.steps_title": "Hızlı başlangıç (kaynak)",
    "github.steps_body": "<p>Repoyu klonlayın, derleyin, kurun; <code>post_install_verify</code> sonunda <code>FAIL: 0</code> hedefleyin. Adım adım rehber: <a href=\"#kurulum\">Kurulum</a> · doğrulama: <a href=\"/tests\">Testler</a>.</p>",
    "github.contrib": "<p>Issue ve pull request'ler açık. Telegram/API anahtarlarınızı repoya koymayın — kurulumda <code>ensure_api_security.sh</code> ve <code>webhook.local.env.example</code> kullanın.</p>",
    "download.title": "İndir (.deb paketi)",
    "download.intro": "<p><strong>Sıfır sunucu</strong> için <a href=\"#kurulum\">kurulum rehberi → A) .deb</a>. Paket kaynakları:</p><ul><li><a href=\"https://github.com/kurtulusutkucenik/Linux-Log-Guardian/releases\">GitHub Releases</a> — <code>log-guardian_*_amd64.deb</code></li><li><a href=\"https://github.com/kurtulusutkucenik/Linux-Log-Guardian\">Kaynak repo</a> — <code>bash scripts/build_deb.sh</code></li></ul><p>Bütünlük testi (kurmadan): <code>bash scripts/test_deb_local.sh</code></p>",
    "download.block": "bash scripts/build_deb.sh\n# → dist/log-guardian_*.deb\nbash scripts/test_deb_local.sh",
    "download.verify": "Extract testi geçen paket örneği: <code>[OK] test_deb_local — extract dogrulama tamam</code> · Gerçek kurulum: <code>sudo dpkg -i dist/log-guardian_*.deb</code>",
    "evidence.title": "Kanıt paketi",
    "evidence.gate": "Kapılar: <code>laptop_sprint_gate.sh</code> · 1h soak (laptop) · <strong>72h soak (VM) PASS</strong>",
    "evidence.sync": "Güncelle: <code>bash scripts/sync_evidence_pack.sh</code>",
    "tests.title": "Doğrulama testleri",
    "tests.page_title": "Doğrulama testleri",
    "tests.page_title_line1": "DOĞRULAMA",
    "tests.page_title_line2": "TESTLERİ",
    "tests.hero_eyebrow": "//:Kanıt",
    "tests.page_intro": "Dashboard <code>/tests</code> ile aynı matris — kurulum kapıları, CRS parite, FP, ban gecikmesi, corpus recall ve <strong>72 saat soak</strong>. Her kart otomatik script çıktısıdır.",
    "tests.matrix_title": "Tam test matrisi",
    "tests.matrix_desc": "Kurulum kapılarından rekabet kanıtına — her satır gerçek script çıktısı, dashboard ile birebir.",
    "tests.filter_all": "Tümü",
    "tests.filter_gate": "Kurulum kapıları",
    "tests.filter_proof": "Rekabet kanıtı",
    "tests.filter_fail": "Kaldı",
    "tests.filter_aria": "Test matrisi filtresi",
    "tests.filter_count": "{visible}/{total} görünür",
    "tests.search_label": "Test ara",
    "tests.search_placeholder": "Test adı, script veya id…",
    "tests.proof_pack": "Kanıt paketi JSON",
    "tests.hl_pass_value": "67/72",
    "tests.hl_pass_label": "Otomatik test PASS",
    "tests.hl_soak_value": "72h",
    "tests.hl_soak_label": "Soak · 864 örnek · 0 hata",
    "tests.hl_ban_value": "17ms",
    "tests.hl_ban_label": "Medyan kernel ban",
    "tests.hl_crs_value": "%100",
    "tests.hl_crs_label": "OWASP CRS parite",
    "tests.hl_fp_value": "%0,2",
    "tests.hl_fp_label": "Benign FP oranı",
    "tests.hl_eps_value": "5357",
    "tests.hl_eps_label": "EPS · tek geçiş log-WAF",
    "tests.teaser": "Dashboard ile aynı otomatik test matrisi — <strong>72 kanıt</strong> (kurulum kapıları, CRS, FP, ban gecikmesi, corpus, 72h soak).",
    "tests.open_full": "Tüm testleri gör (72)",
    "tests.proof_pdf": "Kanıt PDF",
    "tests.intro": "Dashboard ile aynı otomatik test matrisi — kurulum kapıları (FAIL=0), CRS parite, FP, ban gecikmesi, corpus recall ve <strong>72 saat VPS/VM soak</strong>. Canlı kurulumda dashboard <code>/tests</code> aynı veriyi yeniler.",
    "tests.note": "Ham JSON: <a href=\"/evidence/competitive-proof.json\" rel=\"noopener noreferrer\" download>competitive-proof.json</a> · PDF: <a href=\"/evidence/competitive-proof.pdf\" rel=\"noopener noreferrer\">competitive-proof.pdf</a> · Güncelle: <code>bash scripts/competitive_proof.sh</code>",
    "laptop.title": "Laptop doğrulama matrisi",
    "laptop.intro": "<p>Laptop: sprint gate + 1h soak. VM/VPS: <strong>72h soak tamamlandı</strong> (864 örnek, 0 hata). Demo: <code>demo_3min.sh</code>.</p>",
    "laptop.block": "SKIP_PHASE100=1 bash scripts/laptop_sprint_gate.sh\nSOAK_1H=1 bash scripts/laptop_soak_72h.sh --start\nSKIP_WEBHOOK=1 bash scripts/demo_3min.sh",
    "contact.title": "İletişim & katkı",
    "contact.body": "<p>Sorular, iş birliği ve katkı için yazın. Hata bildirimi ve pull request'ler <a href=\"https://github.com/kurtulusutkucenik/Linux-Log-Guardian\">GitHub</a> üzerinden memnuniyetle karşılanır.</p>",
    "contact.email_label": "E-posta",
    "footer": "Linux Log Guardian · Türk yapımı · MIT · açık kaynak"
  },
  "en": {
    "meta.description": "Linux Log Guardian — Turkish-made open-source nginx WAF. log → ban in ~15 min.",
    "hero.title": "Linux Log Guardian",
    "hero.tag": "nginx access log → WAF/CRS → kernel ban · single chain · self-hosted",
    "hero.badge_tr": "TURK",
    "hero.badge_opensource": "open source",
    "hero.badge_mit": "MIT",
    "hero.badge_core": "Core ~15 min setup",
    "hero.badge_soak": "72h soak PASS",
    "hero.cta_install": "15 min setup",
    "hero.cta_dashboard": "Dashboard (after install)",
    "hero.cta_tests": "Test results",
    "hero.cta_evidence": "Evidence pack",
    "hero.cta_contact": "Contact",
    "hero.cta_github": "Source on GitHub",
    "hero.proof_traction": "2.3k+ visits · 4k+ page views · 54 countries · proof PDF",
    "hero.scroll_hint": "Scroll — explore",
    "hero.enter_hint": "Click or scroll — continue",
    "enter.skip": "Skip",
    "enter.continue": "Enter",
    "section.work_eyebrow": "//:Selected",
    "section.work_title": "Selected proofs",
    "section.work_sub": "Core · Pro · Proof · Grafana — measurable outcomes in one chain.",
    "section.work_hint": "Scroll — more evidence cards",
    "compare.eyebrow": "//:Vs",
    "compare.title": "Competitor compare",
    "compare.sub": "Measured proof — Fail2ban / CrowdSec / ModSecurity architectural notes",
    "compare.col_metric": "Metric",
    "compare.col_lg": "Log Guardian",
    "compare.col_f2b": "Fail2ban",
    "compare.col_cs": "CrowdSec",
    "compare.col_mod": "ModSec + CRS",
    "compare.row_pipeline": "Log → WAF → kernel ban",
    "compare.row_recall": "Real attack recall",
    "compare.row_fp": "False positive",
    "compare.row_ban": "Ban latency",
    "compare.row_proof": "Proof pack PDF+JSON",
    "compare.row_mit": "MIT + TR docs",
    "compare.val_lg_pipeline": "Single pipeline",
    "compare.val_f2b_pipeline": "Ban only",
    "compare.val_cs_pipeline": "Fragmented",
    "compare.val_mod_pipeline": "WAF separate",
    "compare.val_lg_recall": "100% (1K+10K)",
    "compare.val_na": "—",
    "compare.val_mod_recall": "CRS parity 100%",
    "compare.val_lg_fp": "0.2%",
    "compare.val_f2b_fp": "High",
    "compare.val_cs_fp": "Medium",
    "compare.val_mod_fp": "CRS dependent",
    "compare.val_lg_ban": "~17 ms",
    "compare.val_f2b_ban": "sec–min",
    "compare.val_cs_ban": "sec",
    "compare.val_mod_ban": "Separate integration",
    "compare.val_yes": "Automatic",
    "compare.val_no": "None",
    "compare.val_cs_proof": "Partial",
    "compare.val_mod_proof": "Per module",
    "compare.val_partial": "Partial",
    "compare.val_mod_mit": "CRS open",
    "compare.sec_strength": "Strengths (measured)",
    "compare.sec_honest": "Honest limits",
    "compare.row_ja3": "Distributed / JA3 cluster",
    "compare.row_consult": "nginx inline consult",
    "compare.row_l7": "L7 application protection",
    "compare.row_stability": "Short stability (5 min)",
    "compare.row_inline_eps": "Inline regex EPS",
    "compare.row_reactive": "First request may pass",
    "compare.row_ddos": "Volumetric L3/L4 scrub",
    "compare.row_community": "Community signal network",
    "compare.row_cloud": "Edge / Cloud WAF",
    "compare.val_lg_ja3": "100% (80 IPs)",
    "compare.val_cs_ja3": "Signal-based",
    "compare.val_lg_consult": "PASS",
    "compare.val_lg_l7": "WAF + consult + eBPF",
    "compare.val_mod_l7": "CRS inline",
    "compare.val_mod_consult": "Separate module",
    "compare.val_lg_stability": "PASS (0 fail)",
    "compare.val_lg_eps": "~130 EPS (log replay)",
    "compare.val_mod_eps": "~12K EPS inline",
    "compare.val_lg_reactive": "Reactive (log line)",
    "compare.val_f2b_reactive": "Reactive",
    "compare.val_cs_reactive": "Partial",
    "compare.val_mod_reactive": "Inline block",
    "compare.val_lg_ddos": "None — CDN recommended",
    "compare.val_lg_community": "Self-hosted",
    "compare.val_cs_community": "Yes",
    "compare.val_lg_cloud": "Origin layer",
    "compare.val_mod_cloud": "Proxy mode",
    "compare.note": "Honest limit: not an inline ModSec EPS race — strength is integration + ban speed + transparent proof. See docs/VS_RAKIPLER.md",
    "compare.scroll_hint": "Scroll → explore the table",
    "compare.progress_label": "Proof discovery {pct}%",
    "bridge.eyebrow": "//:Pipeline",
    "bridge.kicker": "Single chain · self-hosted · MIT",
    "bridge.title": "Log → WAF → Kernel Ban",
    "bridge.sub": "nginx access log line to ipset ban in ~17 ms — competitors use fragmented stacks.",
    "bridge.s1": "log",
    "bridge.s2": "CRS",
    "bridge.s3": "ban",
    "bridge.s4": "proof",
    "why.eyebrow": "//:Why",
    "why.title": "Why Log Guardian?",
    "why.lead": "Competitors are piecemeal — we ship measurable proof in one chain.",
    "why.c1_title": "One pipeline",
    "why.c1_body": "nginx log → OWASP CRS → ~17 ms kernel ban. No Fail2ban + ModSec + script pile.",
    "why.c2_title": "Transparent proof",
    "why.c2_body": "competitive-proof PDF, 67 tests, 72h soak — missing or partial elsewhere.",
    "why.c3_title": "MIT · Turkey",
    "why.c3_body": "Open source, Turkish docs, self-hosted — no vendor lock-in.",
    "why.c4_title": "Honest limits",
    "why.c4_body": "Not ModSec inline EPS; no Cloudflare absorb. Origin integration + speed.",
    "evidence.preview_pdf": "Competitor compare PDF — measured bench summary",
    "evidence.preview_json": "competitive-proof JSON — machine-readable metrics",
    "evidence.preview_bench": "ModSecurity CRS parity + EPS comparison",
    "evidence.preview_fp": "200 benign requests — false positive rate",
    "evidence.preview_ban": "Kernel ban latency — ~17 ms ipset",
    "evidence.preview_soak": "72h soak report — 864 samples, 0 fail",
    "evidence.preview_soak_md": "Soak summary — operator notes",
    "evidence.preview_sprint": "Sprint prod gate — FAIL:0 proof",
    "evidence.preview_siem": "SIEM export — Splunk/Elastic compatibility",
    "evidence.preview_taxii": "TAXII feed integration test",
    "evidence.preview_vm": "VirtualBox VM sprint proof",
    "evidence.preview_geoip": "GeoIP MMDB — attack map data",
    "evidence.preview_webhook": "Webhook route proof — alert pipeline",
    "evidence.preview_telegram": "Telegram live webhook test",
    "pager.sec_bridge": "Pipeline bridge",
    "pager.sec_why": "Why LG",
    "hero.eyebrow": "//:LOG→BAN",
    "marquee.line": "nginx log → WAF → kernel ban · 67 tests · 72h soak PASS · MIT self-hosted · Turkey · open source",
    "showcase.core.eyebrow": "//:Core",
    "showcase.core.title": "What=\"we do\"",
    "showcase.core.desc": "Single chain: nginx access log → OWASP CRS → ~17 ms kernel ban. Production-ready in ~15 minutes.",
    "showcase.pro.eyebrow": "//:Pro",
    "showcase.pro.title": "Pro=\"SOC\"",
    "showcase.pro.desc": "Fleet, SOC timeline, Grafana — optional layer on your server after install.",
    "showcase.proof.eyebrow": "//:Proof",
    "showcase.core.peek": "Single chain · ~17 ms ban",
    "showcase.pro.peek": "Fleet · SOC timeline",
    "showcase.proof.peek": "67 tests ·                                                                        72h soak PASS",
    "showcase.proof.title": "Proof=\"67 tests\"",
    "showcase.proof.desc": "68 automated tests, competitive PDF, 72h soak — same matrix as dashboard /tests.",
    "showcase.cta": "Discover",
    "showcase.core.short": "CORE",
    "showcase.core.tag1": "~17 ms ban",
    "showcase.core.tag2": "OWASP CRS",
    "showcase.pro.short": "SOC",
    "showcase.pro.tag1": "Fleet",
    "showcase.pro.tag2": "Timeline",
    "showcase.proof.short": "PROOF",
    "showcase.proof.tag1": "67 tests",
    "showcase.proof.tag2": "72h soak",
    "showcase.grafana.short": "METRICS",
    "showcase.grafana.eyebrow": "//:Metrics",
    "showcase.grafana.title": "Grafana=\"SOC\"",
    "showcase.grafana.desc": "Tenant-labeled Prometheus metrics, Grafana dashboards and alert rules — self-hosted observability.",
    "showcase.grafana.peek": "Prometheus · tenant alerts",
    "showcase.grafana.tag1": "Prometheus",
    "showcase.grafana.tag2": "Alerts",
    "stats.tests_label": "Automated tests",
    "stats.eyebrow": "//:Stats",
    "stats.title": "By the numbers",
    "stats.lead": "Measured proof — automated tests, soak, ban latency, reach.",
    "stats.soak": "72h",
    "stats.soak_label": "Soak PASS",
    "stats.ban_suffix": "ms",
    "stats.ban_label": "Kernel ban",
    "stats.countries_label": "Countries reached",
    "section.about_eyebrow": "//:About",
    "section.flow_eyebrow": "//:Pipeline",
    "section.scope_eyebrow": "//:Honest",
    "section.github_eyebrow": "//:Source",
    "section.install_eyebrow": "//:Setup",
    "section.dashboard_eyebrow": "//:Pro",
    "section.layers_eyebrow": "//:Layers",
    "section.evidence_eyebrow": "//:Evidence",
    "section.tests_eyebrow": "//:Proof",
    "section.laptop_eyebrow": "//:Verify",
    "section.contact_eyebrow": "//:Contact",
    "cta.banner.title": "Ready to deploy?",
    "cta.banner.body": "Clone, install, verify FAIL:0 — Core runs without the dashboard.",
    "cta.banner.btn": "15 min setup",
    "nav.home": "Home",
    "nav.install": "Setup",
    "nav.tests": "Tests",
    "nav.compare": "Compare",
    "nav.evidence": "Evidence",
    "nav.contact": "Contact",
    "nav.prev_section": "Previous section",
    "nav.next_section": "Next section",
    "nav.index": "Index",
    "index.title": "Chapters",
    "index.close": "Close",
    "case.close": "Close",
    "case.open_hint": "Click front card — case study",
    "case.prev": "Previous case",
    "case.next": "Next case",
    "case.core.lead": "Single chain: nginx access log → OWASP CRS → ~17 ms kernel ban. Production-ready on your server in ~15 minutes — no Fail2ban + ModSec script stack.",
    "case.core.cta": "Setup guide",
    "case.pro.lead": "Optional Pro layer after Core: fleet sync, SOC timeline, Grafana dashboards — all self-hosted on your infrastructure.",
    "case.pro.cta": "Dashboard & SOC",
    "case.proof.lead": "68 automated tests, competitive-proof PDF, 72h soak — the same matrix as /tests. FAIL:0 gate before every release.",
    "case.proof.cta": "Open tests",
    "case.grafana.lead": "Prometheus metrics with tenant labels, Grafana dashboards and alert rules — observability without vendor lock-in.",
    "case.grafana.cta": "Metrics layer",
    "hero.metric_ban_val": "~17 ms",
    "hero.metric_ban": "kernel ban",
    "hero.metric_tests": "automated tests",
    "hero.metric_soak_val": "72h",
    "hero.metric_soak": "soak PASS",
    "pager.hint": "Section nav — jump with arrows",
    "pager.sec_home": "Home",
    "pager.sec_work": "Selected proofs",
    "pager.sec_compare": "Compare",
    "pager.sec_stats": "Stats",
    "pager.sec_about": "About",
    "pager.sec_install": "Install",
    "pager.sec_dashboard": "Dashboard",
    "pager.sec_tests": "Tests",
    "pager.sec_evidence": "Evidence",
    "pager.sec_contact": "Contact",
    "pager.next_to": "Next → {section}",
    "theme.label_light": "Light mode",
    "theme.label_dark": "Dark mode",
    "about.title": "About — Linux Log Guardian",
    "site.purpose": "<strong>This is a public landing and download page.</strong> It serves static content: overview, install guide, evidence pack and contact. Log Guardian does not run here — you install it on your own Linux server.",
    "about.body": "<p><strong>Linux Log Guardian</strong> is an <strong>open-source (MIT)</strong> self-hosted security stack built in Turkey. One chain: <em>nginx log → OWASP CRS → kernel ban</em>.</p><p>Full source on <a href=\"https://github.com/kurtulusutkucenik/Linux-Log-Guardian\">GitHub</a> — review, fork and run on your own server.</p><ul><li>Binary: <code>log-guardian</code> · package: <code>log-guardian_*.deb</code></li><li><strong>Core</strong> production-ready (~15 min)</li><li>Dashboard, Grafana, fleet = optional <strong>Pro</strong></li></ul>",
    "flow.title": "Single chain: log to kernel ban",
    "flow.s1": "nginx access log",
    "flow.s2": "Parser + CRS/WAF",
    "flow.s3": "Ban pipeline",
    "flow.s4": "ipset / kernel",
    "flow.s5": "Metrics + dashboard",
    "flow.note": "XDR, Wasm marketplace and LLM Copilot are long-term optional layers — Core alone is production-ready.",
    "scope.honest.title": "Honest limits (not competing on edge speed)",
    "scope.honest.body": "<ul><li><strong>Reactive architecture</strong> — first request may pass until the log line is parsed; we are not inline ModSec throughput.</li><li><strong>L7 application layer</strong> — CRS/WAF, nginx consult, and eBPF HTTP probe; this is not volumetric L3/L4 scrub.</li><li><strong>No volumetric L3/L4 DDoS absorb</strong> — use CDN/Cloudflare on top.</li><li><strong>Distributed botnets</strong> — per-IP ban; no CrowdSec signal network.</li><li><strong>We do:</strong> log → CRS/WAF → ~17&nbsp;ms kernel ban, proof PDF, Telegram ops, MIT self-hosted.</li></ul>",
    "install.title": "Setup guide (detailed)",
    "install.intro": "<p><strong>Fresh Core install</strong> on Ubuntu/Debian (~15 min). Source: <a href=\"https://github.com/kurtulusutkucenik/Linux-Log-Guardian\">GitHub — Linux-Log-Guardian</a>. Two paths: <strong>.deb</strong> (recommended) or build from source. Works without XDP on laptop / VM. In repo: <code>docs/QUICKSTART_NGINX.md</code> · <code>docs/LAPTOP_OPS.md</code>.</p>",
    "install.terminal_label": "15-minute install — live terminal",
    "install.terminal_demo": "$ sudo dpkg -i log-guardian_*_amd64.deb\nSelecting previously unselected package log-guardian.\nlog-guardian installed.\n$ sudo bash /usr/local/share/log-guardian/scripts/install_first_run.sh\n[OK] log-guardian.service active\n[OK] --health IPC\n[OK] API fail-closed (unauthenticated 403)\n\n=== summary ===\n  FAIL: 0   WARN: 0\n[OK] post_install_verify — install gate passed",
    "install.expect_label": "Expected output (sample):",
    "install.deb_title": "A) Fresh server — .deb package (recommended)",
    "install.deb_body": "<p>No compile step. Ships binaries, systemd, rules and scripts. <strong>Upgrade-safe:</strong> existing <code>/etc/log-guardian/rules.conf</code> is preserved.</p><p><strong>Download:</strong> <a href=\"https://github.com/kurtulusutkucenik/Linux-Log-Guardian/releases\">GitHub Releases</a> (<code>log-guardian_*_amd64.deb</code>) or build from repo: <code>bash scripts/build_deb.sh</code> → <code>dist/</code>.</p>",
    "install.deb_s1_title": "1. Dependencies",
    "install.deb_s1_body": "<p>Install Debian package dependencies on first setup. nginx can be added in the same command if missing.</p>",
    "install.block_deb_deps": "sudo apt-get update\nsudo apt-get install -y ipset libbpf1 libcurl4 libpcre2-8-0 libsqlite3-0 \\\n  libssl3 libelf1 libz1 liburing2 nginx",
    "install.out_deb_deps": "Reading package lists... Done\nSetting up ipset (7.x) ...\nSetting up libbpf1:amd64 ...\nSetting up nginx (1.x) ...",
    "install.deb_s2_title": "2. Install package",
    "install.deb_s2_body": "<p>If <code>dpkg -i</code> reports missing dependencies, run <code>apt-get install -f</code>. postinst creates the <code>log-guardian</code> user, permissions and services automatically.</p>",
    "install.block_deb": "# Copy .deb to server (scp, wget, USB...)\nsudo dpkg -i log-guardian_*_amd64.deb\nsudo apt-get install -f   # if dependencies missing\n\n# On success:\n#   log-guardian kuruldu.\n#   sudo bash .../install_first_run.sh\n#   bash .../post_install_verify.sh",
    "install.out_deb": "Selecting previously unselected package log-guardian.\n(Reading database ... 100%)\nSetting up log-guardian (72e5a7b) ...\n[deb_post_install] rules.conf olusturuldu: /etc/log-guardian/rules.conf\n\nlog-guardian kuruldu.",
    "install.deb_s3_title": "3. First run & verification",
    "install.deb_s3_body": "<p>Prepares nginx log format, FP trust and API security in one pass. Scripts live under <code>/usr/local/share/log-guardian/scripts/</code>.</p>",
    "install.block_deb_first": "sudo bash /usr/local/share/log-guardian/scripts/install_first_run.sh\nsudo bash /usr/local/share/log-guardian/scripts/ensure_api_security.sh\nbash /usr/local/share/log-guardian/scripts/post_install_verify.sh",
    "install.out_deb_first": "[OK] log-guardian.service active\n[OK] log-guardian-daemon.service active\n[OK] --health IPC\n[OK] API fail-closed (tokensiz 403)\n\n=== ozet ===\n  FAIL: 0   WARN: 0\n[OK] post_install_verify — kurulum kapisi gecti",
    "install.src_title": "B) Source — build and install",
    "install.src_body": "<p>Clone from <a href=\"https://github.com/kurtulusutkucenik/Linux-Log-Guardian\">GitHub</a> and build locally. Best for development and full source review.</p>",
    "install.req_title": "Requirements (both paths)",
    "install.req_body": "<ul><li>Ubuntu 22.04 / 24.04 or Debian 12 (amd64)</li><li>nginx with writable access log</li><li>root/sudo (systemd, ipset, <code>/etc/log-guardian</code>)</li><li>Optional Pro: Docker (dashboard/Grafana), suitable kernel for eBPF</li></ul>",
    "install.s1_title": "Source or .deb",
    "install.s1_body": "<p>Clone, build and run the main installer. <code>install.sh</code> sets up systemd units, rules and nginx log format.</p>",
    "install.block1": "git clone https://github.com/kurtulusutkucenik/Linux-Log-Guardian.git\ncd Linux-Log-Guardian\nmake -j$(nproc)\nsudo bash install.sh",
    "install.s2_title": "First run & API security",
    "install.s2_body": "<p>Starts services and prepares API token sync for the dashboard.</p>",
    "install.block_api": "sudo bash scripts/install_first_run.sh\nsudo bash scripts/ensure_api_security.sh\nbash scripts/sync_dashboard_api_token.sh",
    "install.common_title": "Shared steps (after A or B)",
    "install.s3_title": "Nginx log format",
    "install.s3_body": "<p>WAF needs the <code>log_guardian</code> format for request body and XFF. Installer usually applies it — verify:</p>",
    "install.block_nginx": "# examples/nginx-log-guardian.conf → site config\nSTRICT=1 bash scripts/check_nginx_log_format.sh\nsudo nginx -t && sudo systemctl reload nginx",
    "install.s4_title": "Verification (both paths)",
    "install.s4_body": "<p>Check health, service status and Prometheus metrics. <strong>Green gate:</strong> <code>post_install_verify</code> must end with <code>FAIL: 0</code>.</p>",
    "install.block_verify": "sudo log-guardian --health\nsudo log-guardian --status\n# Source install:\nbash scripts/post_install_verify.sh\n# .deb install:\nbash /usr/local/share/log-guardian/scripts/post_install_verify.sh\ncurl -s http://127.0.0.1:9091/metrics | head",
    "install.out_health": "[HEALTH] daemon IPC: OK\n[HEALTH] BPF xdp=OFF execve=OFF lineage=OFF\n[HEALTH] RCE det=0 kill=0 lineage=0 connect=0 uptime=…s",
    "install.out_verify": "[OK] log-guardian.service active\n[OK] metrics :9091\n[OK] API fail-closed (tokensiz 403)\n[OK] nginx log_guardian format\n\n=== ozet ===\n  FAIL: 0   WARN: 0\n[OK] post_install_verify — kurulum kapisi gecti",
    "install.out_metrics": "# HELP loganalyzer_log_lines_total ...\nloganalyzer_log_lines_total{tenant_id=\"default\"} 8\nloganalyzer_ban_success_total{tenant_id=\"default\"} 8",
    "install.s5_title": "VirtualBox / no XDP (laptop & VM)",
    "install.s5_body": "<p>Without eBPF/XDP use <code>--no-xdp</code> with ipset bans. If service deps fail, run the repair script.</p>",
    "install.block2": "sudo bash install.sh --no-xdp\nsudo bash scripts/install_first_run.sh\n# if service FAIL:\nsudo bash scripts/repair_no_xdp_stack.sh",
    "install.tip": "<strong>Tip:</strong> JWT setup: <code>bash scripts/laptop_jwt_setup.sh</code>. Quick demo: <code>SKIP_WEBHOOK=1 bash scripts/demo_3min.sh</code>",
    "dashboard.title": "Dashboard — after install (optional Pro)",
    "dashboard.where": "<strong>Important:</strong> The dashboard does <em>not</em> run on this marketing site. <code>https://localhost:8443</code> is on <strong>your own Linux machine</strong> where you ran install — a visitor's browser localhost is not your server.",
    "dashboard.body": "<p>The <strong>Pro dashboard</strong> (Next.js): fleet status, ban history, tests and evidence PDFs. Prod stack: <code>bash scripts/dashboard_refresh.sh</code> → <code>https://localhost:8443</code>. Quick UI dev: <code>dashboard_dev.sh</code> → <code>:3001</code>. Harden with <code>laptop_harden.sh</code> before exposing to the internet.</p>",
    "dashboard.access_title": "Who accesses it, and when?",
    "dashboard.access_row1_label": "Site visitor",
    "dashboard.access_row1": "Reads this page, downloads source or .deb — does <strong>not</strong> open port 8443.",
    "dashboard.access_row2_label": "Installer",
    "dashboard.access_row2": "Prod stack: <code>bash scripts/dashboard_refresh.sh</code> → <strong>https://localhost:8443</strong>. Quick UI: <code>dashboard_dev.sh</code> → <code>:3001</code> on the same machine.",
    "dashboard.access_row3_label": "Remote VPS",
    "dashboard.access_row3": "SSH tunnel: <code>ssh -L 8443:127.0.0.1:8443 …</code> — do not expose with demo password.",
    "dashboard.req_title": "Extra requirements for dashboard",
    "dashboard.req_body": "<ul><li><strong>Core</strong> only needs nginx + sudo — dashboard <em>not required</em></li><li><strong>Dashboard prod</strong>: Docker + <code>dashboard_refresh.sh</code> → <code>:8443</code></li><li><strong>Dashboard dev</strong>: Node.js + <code>dashboard_dev.sh</code> → <code>:3001</code></li><li><strong>Grafana</strong> additionally <code>grafana_stack.sh</code> (optional)</li></ul>",
    "dashboard.start_title": "Start on your server",
    "dashboard.start": "# On the machine where you installed (not this website):\nbash scripts/dashboard_refresh.sh\n# Browser on the same machine:\n#   https://localhost:8443\n# Login: admin / DASHBOARD_ADMIN_PASSWORD in .env",
    "dashboard.features": "<ul><li><strong>Fleet:</strong> agent online/offline, recent alarms</li><li><strong>Tests:</strong> phase100, competitive-proof, bench</li><li><strong>Reports:</strong> PDF/JSON evidence pack</li><li><strong>Grafana:</strong> tenant metrics via <code>bash scripts/grafana_provision.sh</code></li></ul>",
    "dashboard.optional": "<strong>Is Core enough?</strong> Yes. If you only need log → WAF → kernel ban, skip the dashboard. CLI (<code>log-guardian --status</code>) and Prometheus (<code>:9091/metrics</code>) ship with Core.",
    "dashboard.preview_title": "UI preview",
    "dashboard.preview_note": "Screenshots below are examples. Live UI runs only on your own installation.",
    "dashboard.cap1": "Fleet — agents and recent alarms",
    "dashboard.cap2": "Tests — phase100, bench, soak",
    "dashboard.cap3": "Grafana + Prometheus metrics",
    "dashboard.note": "Summary: this site = download and learn. Dashboard = on your server, after install, optional.",
    "warn.title": "Before exposing to the internet",
    "warn.p1": "Laptop/demo: password <code>DegistirBeni!123</code> is intentionally open.",
    "warn.p2": "Public VPS: <code>sudo env LG_NEW_PASSWORD='…' bash scripts/laptop_harden.sh</code>",
    "warn.p3": "Profiles: <code>docs/SECURITY_PROFILES.md</code>",
    "layers.title": "Layers",
    "layers.core": "Core",
    "layers.core_desc": "log → WAF → ipset ban (~15 min)",
    "layers.pro": "Pro",
    "layers.pro_desc": "eBPF daemon, dashboard, Grafana, fleet",
    "layers.opt": "Optional",
    "layers.opt_desc": "XDR, Wasm marketplace, LLM Copilot",
    "layers.note": "Pro and optional layers are add-ons; Core is enough for day-to-day use.",
    "github.title": "Source code (GitHub)",
    "github.intro": "<p><strong>Linux Log Guardian</strong> is fully open source (MIT). All C source, install scripts, tests and evidence are on GitHub — you install on your own Linux server; this site is only a landing page.</p>",
    "github.releases": "Releases (.deb)",
    "github.steps_title": "Quick start (from source)",
    "github.steps_body": "<p>Clone, build, install; aim for <code>FAIL: 0</code> in <code>post_install_verify</code>. Step-by-step: <a href=\"#kurulum\">Setup</a> · proofs: <a href=\"/tests\">Tests</a>.</p>",
    "github.contrib": "<p>Issues and pull requests welcome. Do not commit API/Telegram secrets — use <code>ensure_api_security.sh</code> and <code>webhook.local.env.example</code> on install.</p>",
    "download.title": "Download (.deb package)",
    "download.intro": "<p><strong>Fresh server:</strong> <a href=\"#kurulum\">setup guide → A) .deb</a>. Package sources:</p><ul><li><a href=\"https://github.com/kurtulusutkucenik/Linux-Log-Guardian/releases\">GitHub Releases</a> — <code>log-guardian_*_amd64.deb</code></li><li><a href=\"https://github.com/kurtulusutkucenik/Linux-Log-Guardian\">Source repo</a> — <code>bash scripts/build_deb.sh</code></li></ul><p>Integrity check (no install): <code>bash scripts/test_deb_local.sh</code></p>",
    "download.block": "bash scripts/build_deb.sh\n# → dist/log-guardian_*.deb\nbash scripts/test_deb_local.sh",
    "download.verify": "Passing extract test: <code>[OK] test_deb_local — extract dogrulama tamam</code> · Real install: <code>sudo dpkg -i dist/log-guardian_*.deb</code>",
    "evidence.title": "Evidence pack",
    "evidence.gate": "Gates: <code>laptop_sprint_gate.sh</code> · 1h soak (laptop) · <strong>72h soak (VM) PASS</strong>",
    "evidence.sync": "Refresh: <code>bash scripts/sync_evidence_pack.sh</code>",
    "tests.title": "Validation tests",
    "tests.page_title": "Validation tests",
    "tests.page_title_line1": "VALIDATION",
    "tests.page_title_line2": "TESTS",
    "tests.hero_eyebrow": "//:Proof",
    "tests.page_intro": "Same matrix as dashboard <code>/tests</code> — install gates, CRS parity, FP, ban latency, corpus recall and <strong>72h soak</strong>. Each card is automated script output.",
    "tests.matrix_title": "Full test matrix",
    "tests.matrix_desc": "From install gates to competitive proof — every row is real script output, identical to the dashboard.",
    "tests.filter_all": "All",
    "tests.filter_gate": "Install gates",
    "tests.filter_proof": "Competitive proof",
    "tests.filter_fail": "Failed",
    "tests.filter_aria": "Test matrix filter",
    "tests.filter_count": "{visible}/{total} visible",
    "tests.search_label": "Search tests",
    "tests.search_placeholder": "Test name, script or id…",
    "tests.proof_pack": "Proof pack JSON",
    "tests.hl_pass_value": "67/72",
    "tests.hl_pass_label": "Automated tests PASS",
    "tests.hl_soak_value": "72h",
    "tests.hl_soak_label": "Soak · 864 samples · 0 failures",
    "tests.hl_ban_value": "17ms",
    "tests.hl_ban_label": "Median kernel ban",
    "tests.hl_crs_value": "100%",
    "tests.hl_crs_label": "OWASP CRS parity",
    "tests.hl_fp_value": "0.2%",
    "tests.hl_fp_label": "Benign FP rate",
    "tests.hl_eps_value": "5357",
    "tests.hl_eps_label": "EPS · single-pass log-WAF",
    "tests.teaser": "Same automated test matrix as the dashboard — <strong>72 proofs</strong> (install gates, CRS, FP, ban latency, corpus, 72h soak).",
    "tests.open_full": "View all tests (72)",
    "tests.proof_pdf": "Evidence PDF",
    "tests.intro": "Same automated test matrix as the dashboard — install gates (FAIL=0), CRS parity, FP, ban latency, corpus recall and <strong>72h VPS/VM soak</strong>. Live installs refresh the same data at dashboard <code>/tests</code>.",
    "tests.note": "Raw JSON: <a href=\"/evidence/competitive-proof.json\" rel=\"noopener noreferrer\" download>competitive-proof.json</a> · PDF: <a href=\"/evidence/competitive-proof.pdf\" rel=\"noopener noreferrer\">competitive-proof.pdf</a> · Refresh: <code>bash scripts/competitive_proof.sh</code>",
    "laptop.title": "Laptop validation matrix",
    "laptop.intro": "<p>Laptop: sprint gate + 1h soak. VM/VPS: <strong>72h soak complete</strong> (864 samples, 0 failures). Demo: <code>demo_3min.sh</code>.</p>",
    "laptop.block": "SKIP_PHASE100=1 bash scripts/laptop_sprint_gate.sh\nSOAK_1H=1 bash scripts/laptop_soak_72h.sh --start\nSKIP_WEBHOOK=1 bash scripts/demo_3min.sh",
    "contact.title": "Contact & contributions",
    "contact.body": "<p>Questions and contributions welcome. Issues and pull requests on <a href=\"https://github.com/kurtulusutkucenik/Linux-Log-Guardian\">GitHub</a>.</p>",
    "contact.email_label": "Email",
    "footer": "Linux Log Guardian · Made in Turkey · MIT · open source"
  },
  "de": {
    "meta.description": "Linux Log Guardian — Open-Source-nginx-WAF aus der Türkei. log → Ban in ~15 Min.",
    "hero.title": "Linux Log Guardian",
    "hero.tag": "nginx access log → WAF/CRS → Kernel-Ban · eine Kette · self-hosted",
    "hero.badge_tr": "TÜRK",
    "hero.badge_opensource": "Open Source",
    "hero.badge_mit": "Open Source · MIT",
    "hero.badge_core": "Core ~15 Min. Einrichtung",
    "hero.badge_soak": "72h soak PASS",
    "hero.cta_install": "15-Min.-Einrichtung",
    "hero.cta_dashboard": "Dashboard (nach Installation)",
    "hero.cta_tests": "Test results",
    "hero.cta_evidence": "Evidence-Paket",
    "hero.cta_contact": "Kontakt",
    "hero.cta_github": "Source on GitHub",
    "hero.proof_traction": "2.3k+ visits · 4k+ page views · 54 countries · proof PDF",
    "hero.scroll_hint": "Scroll — explore",
    "hero.enter_hint": "Click or scroll — continue",
    "enter.skip": "Skip",
    "enter.continue": "Enter",
    "section.work_eyebrow": "//:Selected",
    "section.work_title": "Selected proofs",
    "section.work_sub": "Core · Pro · Proof · Grafana — measurable outcomes in one chain.",
    "section.work_hint": "Scroll — more evidence cards",
    "compare.eyebrow": "//:Vs",
    "compare.title": "Competitor compare",
    "compare.sub": "Measured proof — Fail2ban / CrowdSec / ModSecurity architectural notes",
    "compare.col_metric": "Metric",
    "compare.col_lg": "Log Guardian",
    "compare.col_f2b": "Fail2ban",
    "compare.col_cs": "CrowdSec",
    "compare.col_mod": "ModSec + CRS",
    "compare.row_pipeline": "Log → WAF → kernel ban",
    "compare.row_recall": "Real attack recall",
    "compare.row_fp": "False positive",
    "compare.row_ban": "Ban latency",
    "compare.row_proof": "Proof pack PDF+JSON",
    "compare.row_mit": "MIT + TR docs",
    "compare.val_lg_pipeline": "Single pipeline",
    "compare.val_f2b_pipeline": "Ban only",
    "compare.val_cs_pipeline": "Fragmented",
    "compare.val_mod_pipeline": "WAF separate",
    "compare.val_lg_recall": "100% (1K+10K)",
    "compare.val_na": "—",
    "compare.val_mod_recall": "CRS parity 100%",
    "compare.val_lg_fp": "0.2%",
    "compare.val_f2b_fp": "High",
    "compare.val_cs_fp": "Medium",
    "compare.val_mod_fp": "CRS dependent",
    "compare.val_lg_ban": "~17 ms",
    "compare.val_f2b_ban": "sec–min",
    "compare.val_cs_ban": "sec",
    "compare.val_mod_ban": "Separate integration",
    "compare.val_yes": "Automatic",
    "compare.val_no": "None",
    "compare.val_cs_proof": "Partial",
    "compare.val_mod_proof": "Per module",
    "compare.val_partial": "Partial",
    "compare.val_mod_mit": "CRS open",
    "compare.sec_strength": "Strengths (measured)",
    "compare.sec_honest": "Honest limits",
    "compare.row_ja3": "Distributed / JA3 cluster",
    "compare.row_consult": "nginx inline consult",
    "compare.row_l7": "L7 application protection",
    "compare.row_stability": "Short stability (5 min)",
    "compare.row_inline_eps": "Inline regex EPS",
    "compare.row_reactive": "First request may pass",
    "compare.row_ddos": "Volumetric L3/L4 scrub",
    "compare.row_community": "Community signal network",
    "compare.row_cloud": "Edge / Cloud WAF",
    "compare.val_lg_ja3": "100% (80 IPs)",
    "compare.val_cs_ja3": "Signal-based",
    "compare.val_lg_consult": "PASS",
    "compare.val_lg_l7": "WAF + consult + eBPF",
    "compare.val_mod_l7": "CRS inline",
    "compare.val_mod_consult": "Separate module",
    "compare.val_lg_stability": "PASS (0 fail)",
    "compare.val_lg_eps": "~130 EPS (log replay)",
    "compare.val_mod_eps": "~12K EPS inline",
    "compare.val_lg_reactive": "Reactive (log line)",
    "compare.val_f2b_reactive": "Reactive",
    "compare.val_cs_reactive": "Partial",
    "compare.val_mod_reactive": "Inline block",
    "compare.val_lg_ddos": "None — CDN recommended",
    "compare.val_lg_community": "Self-hosted",
    "compare.val_cs_community": "Yes",
    "compare.val_lg_cloud": "Origin layer",
    "compare.val_mod_cloud": "Proxy mode",
    "compare.note": "Honest limit: not an inline ModSec EPS race — strength is integration + ban speed + transparent proof. See docs/VS_RAKIPLER.md",
    "compare.scroll_hint": "Scroll → explore the table",
    "compare.progress_label": "Proof discovery {pct}%",
    "bridge.eyebrow": "//:Pipeline",
    "bridge.kicker": "Single chain · self-hosted · MIT",
    "bridge.title": "Log → WAF → Kernel Ban",
    "bridge.sub": "nginx access log line to ipset ban in ~17 ms — competitors use fragmented stacks.",
    "bridge.s1": "log",
    "bridge.s2": "CRS",
    "bridge.s3": "ban",
    "bridge.s4": "proof",
    "why.eyebrow": "//:Why",
    "why.title": "Why Log Guardian?",
    "why.lead": "Competitors are piecemeal — we ship measurable proof in one chain.",
    "why.c1_title": "One pipeline",
    "why.c1_body": "nginx log → OWASP CRS → ~17 ms kernel ban. No Fail2ban + ModSec + script pile.",
    "why.c2_title": "Transparent proof",
    "why.c2_body": "competitive-proof PDF, 67 tests, 72h soak — missing or partial elsewhere.",
    "why.c3_title": "MIT · Turkey",
    "why.c3_body": "Open source, Turkish docs, self-hosted — no vendor lock-in.",
    "why.c4_title": "Honest limits",
    "why.c4_body": "Not ModSec inline EPS; no Cloudflare absorb. Origin integration + speed.",
    "evidence.preview_pdf": "Competitor compare PDF — measured bench summary",
    "evidence.preview_json": "competitive-proof JSON — machine-readable metrics",
    "evidence.preview_bench": "ModSecurity CRS parity + EPS comparison",
    "evidence.preview_fp": "200 benign requests — false positive rate",
    "evidence.preview_ban": "Kernel ban latency — ~17 ms ipset",
    "evidence.preview_soak": "72h soak report — 864 samples, 0 fail",
    "evidence.preview_soak_md": "Soak summary — operator notes",
    "evidence.preview_sprint": "Sprint prod gate — FAIL:0 proof",
    "evidence.preview_siem": "SIEM export — Splunk/Elastic compatibility",
    "evidence.preview_taxii": "TAXII feed integration test",
    "evidence.preview_vm": "VirtualBox VM sprint proof",
    "evidence.preview_geoip": "GeoIP MMDB — attack map data",
    "evidence.preview_webhook": "Webhook route proof — alert pipeline",
    "evidence.preview_telegram": "Telegram live webhook test",
    "pager.sec_bridge": "Pipeline bridge",
    "pager.sec_why": "Why LG",
    "hero.eyebrow": "//:LOG→BAN",
    "marquee.line": "nginx log → WAF → kernel ban · 67 tests · 72h soak PASS · MIT self-hosted · Turkey · open source",
    "showcase.core.eyebrow": "//:Core",
    "showcase.core.title": "What=\"we do\"",
    "showcase.core.desc": "Single chain: nginx access log → OWASP CRS → ~17 ms kernel ban. Production-ready in ~15 minutes.",
    "showcase.pro.eyebrow": "//:Pro",
    "showcase.pro.title": "Pro=\"SOC\"",
    "showcase.pro.desc": "Fleet, SOC timeline, Grafana — optional layer on your server after install.",
    "showcase.proof.eyebrow": "//:Proof",
    "showcase.core.peek": "Single chain · ~17 ms ban",
    "showcase.pro.peek": "Fleet · SOC timeline",
    "showcase.proof.peek": "67 tests ·                                                                        72h soak PASS",
    "showcase.proof.title": "Proof=\"67 tests\"",
    "showcase.proof.desc": "68 automated tests, competitive PDF, 72h soak — same matrix as dashboard /tests.",
    "showcase.cta": "Discover",
    "showcase.core.short": "CORE",
    "showcase.core.tag1": "~17 ms ban",
    "showcase.core.tag2": "OWASP CRS",
    "showcase.pro.short": "SOC",
    "showcase.pro.tag1": "Fleet",
    "showcase.pro.tag2": "Timeline",
    "showcase.proof.short": "PROOF",
    "showcase.proof.tag1": "67 tests",
    "showcase.proof.tag2": "72h soak",
    "showcase.grafana.short": "METRICS",
    "showcase.grafana.eyebrow": "//:Metrics",
    "showcase.grafana.title": "Grafana=\"SOC\"",
    "showcase.grafana.desc": "Tenant-labeled Prometheus metrics, Grafana dashboards and alert rules — self-hosted observability.",
    "showcase.grafana.peek": "Prometheus · tenant alerts",
    "showcase.grafana.tag1": "Prometheus",
    "showcase.grafana.tag2": "Alerts",
    "stats.tests_label": "Automated tests",
    "stats.eyebrow": "//:Stats",
    "stats.title": "By the numbers",
    "stats.lead": "Measured proof — automated tests, soak, ban latency, reach.",
    "stats.soak": "72h",
    "stats.soak_label": "Soak PASS",
    "stats.ban_suffix": "ms",
    "stats.ban_label": "Kernel ban",
    "stats.countries_label": "Countries reached",
    "section.about_eyebrow": "//:About",
    "section.flow_eyebrow": "//:Pipeline",
    "section.scope_eyebrow": "//:Honest",
    "section.github_eyebrow": "//:Source",
    "section.install_eyebrow": "//:Setup",
    "section.dashboard_eyebrow": "//:Pro",
    "section.layers_eyebrow": "//:Layers",
    "section.evidence_eyebrow": "//:Evidence",
    "section.tests_eyebrow": "//:Proof",
    "section.laptop_eyebrow": "//:Verify",
    "section.contact_eyebrow": "//:Contact",
    "cta.banner.title": "Ready to deploy?",
    "cta.banner.body": "Clone, install, verify FAIL:0 — Core runs without the dashboard.",
    "cta.banner.btn": "15 min setup",
    "nav.home": "Home",
    "nav.install": "Setup",
    "nav.tests": "Tests",
    "nav.compare": "Compare",
    "nav.evidence": "Evidence",
    "nav.contact": "Contact",
    "nav.prev_section": "Previous section",
    "nav.next_section": "Next section",
    "nav.index": "Index",
    "index.title": "Chapters",
    "index.close": "Close",
    "case.close": "Close",
    "case.open_hint": "Click front card — case study",
    "case.prev": "Previous case",
    "case.next": "Next case",
    "case.core.lead": "Single chain: nginx access log → OWASP CRS → ~17 ms kernel ban. Production-ready on your server in ~15 minutes — no Fail2ban + ModSec script stack.",
    "case.core.cta": "Setup guide",
    "case.pro.lead": "Optional Pro layer after Core: fleet sync, SOC timeline, Grafana dashboards — all self-hosted on your infrastructure.",
    "case.pro.cta": "Dashboard & SOC",
    "case.proof.lead": "68 automated tests, competitive-proof PDF, 72h soak — the same matrix as /tests. FAIL:0 gate before every release.",
    "case.proof.cta": "Open tests",
    "case.grafana.lead": "Prometheus metrics with tenant labels, Grafana dashboards and alert rules — observability without vendor lock-in.",
    "case.grafana.cta": "Metrics layer",
    "hero.metric_ban_val": "~17 ms",
    "hero.metric_ban": "kernel ban",
    "hero.metric_tests": "automated tests",
    "hero.metric_soak_val": "72h",
    "hero.metric_soak": "soak PASS",
    "pager.hint": "Section nav — jump with arrows",
    "pager.sec_home": "Home",
    "pager.sec_work": "Selected proofs",
    "pager.sec_compare": "Compare",
    "pager.sec_stats": "Stats",
    "pager.sec_about": "About",
    "pager.sec_install": "Install",
    "pager.sec_dashboard": "Dashboard",
    "pager.sec_tests": "Tests",
    "pager.sec_evidence": "Evidence",
    "pager.sec_contact": "Contact",
    "pager.next_to": "Next → {section}",
    "theme.label_light": "Light mode",
    "theme.label_dark": "Dark mode",
    "about.title": "Über — Linux Log Guardian",
    "site.purpose": "<strong>Dies ist eine öffentliche Landing- und Download-Seite.</strong> Statische Inhalte: Überblick, Installationsanleitung, Evidence-Paket und Kontakt. Log Guardian läuft hier nicht — Sie installieren es auf Ihrem eigenen Linux-Server.",
    "about.body": "<p><strong>Linux Log Guardian</strong> ist ein <strong>Open-Source (MIT)</strong> self-hosted Security-Stack aus der Türkei. Statt Fail2ban, ModSecurity und einzelner Skripte: <em>nginx-Logs lesen → OWASP-CRS-Regeln → Ban auf Kernel-Ebene</em>.</p><p>Unabhängiges Community-Projekt — Code-Review, Anpassung und On-Prem-Hosting ohne Cloud-Lock-in.</p><ul><li>Transparenter Quellcode; Community-Beiträge willkommen</li><li>Binary: <code>log-guardian</code> · Paket: <code>log-guardian_*.deb</code></li><li><strong>Core</strong> allein produktionsreif (~15 Min.)</li><li>Dashboard, Grafana, Fleet = optionale <strong>Pro</strong>-Schicht</li></ul>",
    "flow.title": "Eine Kette: Log bis Kernel-Ban",
    "flow.s1": "nginx access log",
    "flow.s2": "Parser + CRS/WAF",
    "flow.s3": "Ban-Pipeline",
    "flow.s4": "ipset / Kernel",
    "flow.s5": "Metriken + Dashboard",
    "flow.note": "XDR, Wasm-Marketplace und LLM Copilot sind langfristig optional — Core allein ist produktionsreif.",
    "scope.honest.title": "Honest limits (not competing on edge speed)",
    "scope.honest.body": "<ul><li><strong>Reactive architecture</strong> — first request may pass until the log line is parsed; we are not inline ModSec throughput.</li><li><strong>L7 application layer</strong> — CRS/WAF, nginx consult, and eBPF HTTP probe; this is not volumetric L3/L4 scrub.</li><li><strong>No volumetric L3/L4 DDoS absorb</strong> — use CDN/Cloudflare on top.</li><li><strong>Distributed botnets</strong> — per-IP ban; no CrowdSec signal network.</li><li><strong>We do:</strong> log → CRS/WAF → ~17&nbsp;ms kernel ban, proof PDF, Telegram ops, MIT self-hosted.</li></ul>",
    "install.title": "Installationsanleitung (detailliert)",
    "install.intro": "<p>Schritt-für-Schritt <strong>Produktions-Setup</strong> auf Ubuntu/Debian. Läuft ohne XDP auf Laptop oder VirtualBox-VM. Vollständige Docs: <code>docs/QUICKSTART_NGINX.md</code> und <code>docs/LAPTOP_OPS.md</code>.</p>",
    "install.terminal_label": "15-minute install — live terminal",
    "install.terminal_demo": "$ sudo dpkg -i log-guardian_*_amd64.deb\nSelecting previously unselected package log-guardian.\nlog-guardian installed.\n$ sudo bash /usr/local/share/log-guardian/scripts/install_first_run.sh\n[OK] log-guardian.service active\n[OK] --health IPC\n[OK] API fail-closed (unauthenticated 403)\n\n=== summary ===\n  FAIL: 0   WARN: 0\n[OK] post_install_verify — install gate passed",
    "install.expect_label": "Expected output (sample):",
    "install.deb_title": "A) Fresh server — .deb package (recommended)",
    "install.deb_body": "<p>No compile step. Ships binaries, systemd, rules and scripts. <strong>Upgrade-safe:</strong> existing <code>/etc/log-guardian/rules.conf</code> is preserved.</p><p><strong>Download:</strong> <a href=\"https://github.com/kurtulusutkucenik/Linux-Log-Guardian/releases\">GitHub Releases</a> (<code>log-guardian_*_amd64.deb</code>) or build from repo: <code>bash scripts/build_deb.sh</code> → <code>dist/</code>.</p>",
    "install.deb_s1_title": "1. Dependencies",
    "install.deb_s1_body": "<p>Install Debian package dependencies on first setup. nginx can be added in the same command if missing.</p>",
    "install.block_deb_deps": "sudo apt-get update\nsudo apt-get install -y ipset libbpf1 libcurl4 libpcre2-8-0 libsqlite3-0 \\\n  libssl3 libelf1 libz1 liburing2 nginx",
    "install.out_deb_deps": "Reading package lists... Done\nSetting up ipset (7.x) ...\nSetting up libbpf1:amd64 ...\nSetting up nginx (1.x) ...",
    "install.deb_s2_title": "2. Install package",
    "install.deb_s2_body": "<p>If <code>dpkg -i</code> reports missing dependencies, run <code>apt-get install -f</code>. postinst creates the <code>log-guardian</code> user, permissions and services automatically.</p>",
    "install.block_deb": "# Copy .deb to server (scp, wget, USB...)\nsudo dpkg -i log-guardian_*_amd64.deb\nsudo apt-get install -f   # if dependencies missing\n\n# On success:\n#   log-guardian kuruldu.\n#   sudo bash .../install_first_run.sh\n#   bash .../post_install_verify.sh",
    "install.out_deb": "Selecting previously unselected package log-guardian.\n(Reading database ... 100%)\nSetting up log-guardian (72e5a7b) ...\n[deb_post_install] rules.conf olusturuldu: /etc/log-guardian/rules.conf\n\nlog-guardian kuruldu.",
    "install.deb_s3_title": "3. First run & verification",
    "install.deb_s3_body": "<p>Prepares nginx log format, FP trust and API security in one pass. Scripts live under <code>/usr/local/share/log-guardian/scripts/</code>.</p>",
    "install.block_deb_first": "sudo bash /usr/local/share/log-guardian/scripts/install_first_run.sh\nsudo bash /usr/local/share/log-guardian/scripts/ensure_api_security.sh\nbash /usr/local/share/log-guardian/scripts/post_install_verify.sh",
    "install.out_deb_first": "[OK] log-guardian.service active\n[OK] log-guardian-daemon.service active\n[OK] --health IPC\n[OK] API fail-closed (tokensiz 403)\n\n=== ozet ===\n  FAIL: 0   WARN: 0\n[OK] post_install_verify — kurulum kapisi gecti",
    "install.src_title": "B) Source — build and install",
    "install.src_body": "<p>Clone from <a href=\"https://github.com/kurtulusutkucenik/Linux-Log-Guardian\">GitHub</a> and build locally. Best for development and full source review.</p>",
    "install.req_title": "Voraussetzungen",
    "install.req_body": "<ul><li>Ubuntu 22.04 / 24.04 oder Debian 12 (amd64)</li><li>nginx mit beschreibbarem Access-Log</li><li>root/sudo (systemd, ipset, <code>/etc/log-guardian</code>)</li><li>Optionales Pro: Docker (Dashboard/Grafana), passender Kernel für eBPF</li></ul>",
    "install.s1_title": "Quellcode oder .deb",
    "install.s1_body": "<p>Repository klonen, bauen und Hauptinstaller ausführen. <code>install.sh</code> richtet systemd-Units, Regeln und nginx-Logformat ein.</p>",
    "install.block1": "git clone https://github.com/kurtulusutkucenik/Linux-Log-Guardian.git\ncd Linux-Log-Guardian\nmake -j$(nproc)\nsudo bash install.sh",
    "install.s2_title": "Erster Start & API-Sicherheit",
    "install.s2_body": "<p>Startet Dienste und bereitet API-Token-Sync für das Dashboard vor.</p>",
    "install.block_api": "sudo bash scripts/install_first_run.sh\nsudo bash scripts/ensure_api_security.sh\nbash scripts/sync_dashboard_api_token.sh",
    "install.common_title": "Shared steps (after A or B)",
    "install.s3_title": "Nginx-Logformat",
    "install.s3_body": "<p>WAF benötigt das Format <code>log_guardian</code> für Request-Body und XFF. Installer wendet es meist an — prüfen:</p>",
    "install.block_nginx": "# examples/nginx-log-guardian.conf → site config\nSTRICT=1 bash scripts/check_nginx_log_format.sh\nsudo nginx -t && sudo systemctl reload nginx",
    "install.s4_title": "Verifikation",
    "install.s4_body": "<p>Health, Alarme und Prometheus-Metriken prüfen. <code>post_install_verify.sh</code> fasst auf dem Laptop zusammen.</p>",
    "install.block_verify": "sudo log-guardian --health\nsudo log-guardian --status\n# Source install:\nbash scripts/post_install_verify.sh\n# .deb install:\nbash /usr/local/share/log-guardian/scripts/post_install_verify.sh\ncurl -s http://127.0.0.1:9091/metrics | head",
    "install.out_health": "[HEALTH] daemon IPC: OK\n[HEALTH] BPF xdp=OFF execve=OFF lineage=OFF\n[HEALTH] RCE det=0 kill=0 lineage=0 connect=0 uptime=…s",
    "install.out_verify": "[OK] log-guardian.service active\n[OK] metrics :9091\n[OK] API fail-closed (tokensiz 403)\n[OK] nginx log_guardian format\n\n=== ozet ===\n  FAIL: 0   WARN: 0\n[OK] post_install_verify — kurulum kapisi gecti",
    "install.out_metrics": "# HELP loganalyzer_log_lines_total ...\nloganalyzer_log_lines_total{tenant_id=\"default\"} 8\nloganalyzer_ban_success_total{tenant_id=\"default\"} 8",
    "install.s5_title": "VirtualBox / ohne XDP (Laptop & VM)",
    "install.s5_body": "<p>Ohne eBPF/XDP <code>--no-xdp</code> mit ipset-Bans. Bei Service-Fehlern Reparatur-Skript ausführen.</p>",
    "install.block2": "sudo bash install.sh --no-xdp\nsudo bash scripts/install_first_run.sh\n# if service FAIL:\nsudo bash scripts/repair_no_xdp_stack.sh",
    "install.tip": "<strong>Tipp:</strong> JWT-Setup: <code>bash scripts/laptop_jwt_setup.sh</code>. Kurzdemo: <code>SKIP_WEBHOOK=1 bash scripts/demo_3min.sh</code>",
    "dashboard.title": "Dashboard — nach Installation (optionales Pro)",
    "dashboard.where": "<strong>Wichtig:</strong> Das Dashboard läuft <em>nicht</em> auf dieser Marketing-Seite. <code>localhost:3001</code> ist auf <strong>Ihrem Linux-Rechner</strong>, auf dem Sie installiert haben — localhost im Browser eines Besuchers ist nicht Ihr Server.",
    "dashboard.body": "<p><strong>Pro-Dashboard</strong> (Next.js): Fleet-Status, Ban-Historie, Tests und Evidence-PDFs. Hört auf <code>:3001</code> mit TLS auf dem installierten Host. Vor Internet-Exposition mit <code>laptop_harden.sh</code> härten.</p>",
    "dashboard.access_title": "Wer greift wann zu?",
    "dashboard.access_row1_label": "Seitenbesucher",
    "dashboard.access_row1": "Liest diese Seite, lädt Quellcode oder .deb — öffnet <strong>nicht</strong> Port 3001.",
    "dashboard.access_row2_label": "Installierender",
    "dashboard.access_row2": "Nach <code>install.sh</code> + <code>dashboard_dev.sh</code> auf Ubuntu/Debian: <code>http://localhost:3001</code> <strong>auf derselben Maschine</strong>.",
    "dashboard.access_row3_label": "Remote-VPS",
    "dashboard.access_row3": "SSH-Tunnel oder (wenn Firewall erlaubt) <code>https://SERVER_IP:3001</code>. Nicht mit Demo-Passwort exponieren.",
    "dashboard.req_title": "Zusätzliche Dashboard-Anforderungen",
    "dashboard.req_body": "<ul><li><strong>Core</strong> braucht nur nginx + sudo — Dashboard <em>nicht erforderlich</em></li><li><strong>Dashboard</strong> braucht Docker + <code>dashboard_dev.sh</code></li><li><strong>Grafana</strong> zusätzlich <code>grafana_stack.sh</code> (optional)</li></ul>",
    "dashboard.start_title": "Auf Ihrem Server starten",
    "dashboard.start": "# On the machine where you installed (not this website):\nbash scripts/dashboard_refresh.sh\n# Browser on the same machine:\n#   https://localhost:8443\n# Login: admin / DASHBOARD_ADMIN_PASSWORD in .env",
    "dashboard.features": "<ul><li><strong>Fleet:</strong> Agent online/offline, letzte Alarme</li><li><strong>Tests:</strong> phase100, competitive-proof, bench</li><li><strong>Berichte:</strong> PDF/JSON Evidence-Paket</li><li><strong>Grafana:</strong> Tenant-Metriken via <code>bash scripts/grafana_provision.sh</code></li></ul>",
    "dashboard.optional": "<strong>Reicht Core?</strong> Ja. Nur log → WAF → Kernel-Ban: Dashboard optional. CLI (<code>log-guardian --status</code>) und Prometheus (<code>:9091/metrics</code>) sind in Core enthalten.",
    "dashboard.preview_title": "UI-Vorschau",
    "dashboard.preview_note": "Screenshots unten sind Beispiele. Live-UI nur auf Ihrer Installation.",
    "dashboard.cap1": "Fleet — Agents und letzte Alarme",
    "dashboard.cap2": "Tests — phase100, bench, soak",
    "dashboard.cap3": "Grafana + Prometheus-Metriken",
    "dashboard.note": "Kurz: Diese Site = herunterladen und lernen. Dashboard = auf Ihrem Server, nach Installation, optional.",
    "warn.title": "⚠️ Vor Internet-Exposition",
    "warn.p1": "Laptop/Demo: Passwort <code>DegistirBeni!123</code> ist absichtlich offen.",
    "warn.p2": "Public VPS: <code>sudo env LG_NEW_PASSWORD='…' bash scripts/laptop_harden.sh</code>",
    "warn.p3": "Profile: <code>docs/SECURITY_PROFILES.md</code>",
    "layers.title": "Schichten",
    "layers.core": "Core",
    "layers.core_desc": "log → WAF → ipset-Ban (~15 Min.)",
    "layers.pro": "Pro",
    "layers.pro_desc": "eBPF-Daemon, Dashboard, Grafana, Fleet",
    "layers.opt": "Optional",
    "layers.opt_desc": "XDR, Wasm-Marketplace, LLM Copilot",
    "layers.note": "Pro und optionale Schichten sind Erweiterungen; Core reicht für den Alltag.",
    "github.title": "Source code (GitHub)",
    "github.intro": "<p><strong>Linux Log Guardian</strong> is fully open source (MIT). All C source, install scripts, tests and evidence are on GitHub — you install on your own Linux server; this site is only a landing page.</p>",
    "github.releases": "Releases (.deb)",
    "github.steps_title": "Quick start (from source)",
    "github.steps_body": "<p>Clone, build, install; aim for <code>FAIL: 0</code> in <code>post_install_verify</code>. Step-by-step: <a href=\"#kurulum\">Setup</a> · proofs: <a href=\"/tests\">Tests</a>.</p>",
    "github.contrib": "<p>Issues and pull requests welcome. Do not commit API/Telegram secrets — use <code>ensure_api_security.sh</code> and <code>webhook.local.env.example</code> on install.</p>",
    "download.title": "Download (.deb-Paket)",
    "download.intro": "<p>Paket bauen mit <code>build_deb.sh</code>. Integritätsprüfung ohne Installation: <code>test_deb_local.sh</code>.</p>",
    "download.block": "bash scripts/build_deb.sh\n# → dist/log-guardian_*.deb\nbash scripts/test_deb_local.sh",
    "download.verify": "Paketprüfung (ohne Installation): <code>bash scripts/test_deb_local.sh</code>",
    "evidence.title": "Evidence-Paket",
    "evidence.gate": "Laptop-Gate: <code>bash scripts/laptop_sprint_gate.sh</code>",
    "evidence.sync": "Aktualisieren: <code>bash scripts/sync_evidence_pack.sh</code>",
    "tests.title": "Validation tests",
    "tests.page_title": "Validation tests",
    "tests.page_title_line1": "VALIDATION",
    "tests.page_title_line2": "TESTS",
    "tests.hero_eyebrow": "//:Proof",
    "tests.page_intro": "Same matrix as dashboard <code>/tests</code> — install gates, CRS parity, FP, ban latency, corpus recall and <strong>72h soak</strong>. Each card is automated script output.",
    "tests.matrix_title": "Full test matrix",
    "tests.matrix_desc": "From install gates to competitive proof — every row is real script output, identical to the dashboard.",
    "tests.filter_all": "All",
    "tests.filter_gate": "Install gates",
    "tests.filter_proof": "Competitive proof",
    "tests.filter_fail": "Failed",
    "tests.filter_aria": "Test matrix filter",
    "tests.filter_count": "{visible}/{total} visible",
    "tests.search_label": "Search tests",
    "tests.search_placeholder": "Test name, script or id…",
    "tests.proof_pack": "Proof pack JSON",
    "tests.hl_pass_value": "67/72",
    "tests.hl_pass_label": "Automated tests PASS",
    "tests.hl_soak_value": "72h",
    "tests.hl_soak_label": "Soak · 864 samples · 0 failures",
    "tests.hl_ban_value": "17ms",
    "tests.hl_ban_label": "Median kernel ban",
    "tests.hl_crs_value": "100%",
    "tests.hl_crs_label": "OWASP CRS parity",
    "tests.hl_fp_value": "0.2%",
    "tests.hl_fp_label": "Benign FP rate",
    "tests.hl_eps_value": "5357",
    "tests.hl_eps_label": "EPS · single-pass log-WAF",
    "tests.teaser": "Same automated test matrix as the dashboard — <strong>72 proofs</strong> (install gates, CRS, FP, ban latency, corpus, 72h soak).",
    "tests.open_full": "View all tests (72)",
    "tests.proof_pdf": "Evidence PDF",
    "tests.intro": "Same automated test matrix as the dashboard — install gates (FAIL=0), CRS parity, FP, ban latency, corpus recall and <strong>72h VPS/VM soak</strong>. Live installs refresh the same data at dashboard <code>/tests</code>.",
    "tests.note": "Raw JSON: <a href=\"/evidence/competitive-proof.json\" rel=\"noopener noreferrer\" download>competitive-proof.json</a> · PDF: <a href=\"/evidence/competitive-proof.pdf\" rel=\"noopener noreferrer\">competitive-proof.pdf</a> · Refresh: <code>bash scripts/competitive_proof.sh</code>",
    "laptop.title": "Laptop-Validierungsmatrix",
    "laptop.intro": "<p>Schnelles Dev-Gate: Sprint-Gate, 1h-Soak und 3-Min.-Demo. Für 72h-VM-Soak: <code>laptop_soak_72h.sh --start</code>.</p>",
    "laptop.block": "SKIP_PHASE100=1 bash scripts/laptop_sprint_gate.sh\nSOAK_1H=1 bash scripts/laptop_soak_72h.sh --start\nSKIP_WEBHOOK=1 bash scripts/demo_3min.sh",
    "contact.title": "Kontakt & Beiträge",
    "contact.body": "<p>Fragen, Zusammenarbeit oder Beiträge — melden Sie sich. Bugreports und Pull Requests willkommen.</p>",
    "contact.email_label": "E-Mail:",
    "footer": "Linux Log Guardian · Aus der Türkei · MIT · Open Source · <a href=\"mailto:kurtulusutkucenikcontact@gmail.com\">kurtulusutkucenikcontact@gmail.com</a>"
  },
  "fr": {
    "meta.description": "Linux Log Guardian — WAF nginx open source, fabriqué en Turquie. log → ban en ~15 min.",
    "hero.title": "Linux Log Guardian",
    "hero.tag": "nginx access log → WAF/CRS → ban noyau · chaîne unique · self-hosted",
    "hero.badge_tr": "TURK",
    "hero.badge_opensource": "open source",
    "hero.badge_mit": "Open source · MIT",
    "hero.badge_core": "Core ~15 min d'installation",
    "hero.badge_soak": "72h soak PASS",
    "hero.cta_install": "Installation 15 min",
    "hero.cta_dashboard": "Tableau de bord (après install)",
    "hero.cta_tests": "Test results",
    "hero.cta_evidence": "Pack de preuves",
    "hero.cta_contact": "Contact",
    "hero.cta_github": "Source on GitHub",
    "hero.proof_traction": "2.3k+ visits · 4k+ page views · 54 countries · proof PDF",
    "hero.scroll_hint": "Scroll — explore",
    "hero.enter_hint": "Click or scroll — continue",
    "enter.skip": "Skip",
    "enter.continue": "Enter",
    "section.work_eyebrow": "//:Selected",
    "section.work_title": "Selected proofs",
    "section.work_sub": "Core · Pro · Proof · Grafana — measurable outcomes in one chain.",
    "section.work_hint": "Scroll — more evidence cards",
    "compare.eyebrow": "//:Vs",
    "compare.title": "Competitor compare",
    "compare.sub": "Measured proof — Fail2ban / CrowdSec / ModSecurity architectural notes",
    "compare.col_metric": "Metric",
    "compare.col_lg": "Log Guardian",
    "compare.col_f2b": "Fail2ban",
    "compare.col_cs": "CrowdSec",
    "compare.col_mod": "ModSec + CRS",
    "compare.row_pipeline": "Log → WAF → kernel ban",
    "compare.row_recall": "Real attack recall",
    "compare.row_fp": "False positive",
    "compare.row_ban": "Ban latency",
    "compare.row_proof": "Proof pack PDF+JSON",
    "compare.row_mit": "MIT + TR docs",
    "compare.val_lg_pipeline": "Single pipeline",
    "compare.val_f2b_pipeline": "Ban only",
    "compare.val_cs_pipeline": "Fragmented",
    "compare.val_mod_pipeline": "WAF separate",
    "compare.val_lg_recall": "100% (1K+10K)",
    "compare.val_na": "—",
    "compare.val_mod_recall": "CRS parity 100%",
    "compare.val_lg_fp": "0.2%",
    "compare.val_f2b_fp": "High",
    "compare.val_cs_fp": "Medium",
    "compare.val_mod_fp": "CRS dependent",
    "compare.val_lg_ban": "~17 ms",
    "compare.val_f2b_ban": "sec–min",
    "compare.val_cs_ban": "sec",
    "compare.val_mod_ban": "Separate integration",
    "compare.val_yes": "Automatic",
    "compare.val_no": "None",
    "compare.val_cs_proof": "Partial",
    "compare.val_mod_proof": "Per module",
    "compare.val_partial": "Partial",
    "compare.val_mod_mit": "CRS open",
    "compare.sec_strength": "Strengths (measured)",
    "compare.sec_honest": "Honest limits",
    "compare.row_ja3": "Distributed / JA3 cluster",
    "compare.row_consult": "nginx inline consult",
    "compare.row_l7": "L7 application protection",
    "compare.row_stability": "Short stability (5 min)",
    "compare.row_inline_eps": "Inline regex EPS",
    "compare.row_reactive": "First request may pass",
    "compare.row_ddos": "Volumetric L3/L4 scrub",
    "compare.row_community": "Community signal network",
    "compare.row_cloud": "Edge / Cloud WAF",
    "compare.val_lg_ja3": "100% (80 IPs)",
    "compare.val_cs_ja3": "Signal-based",
    "compare.val_lg_consult": "PASS",
    "compare.val_lg_l7": "WAF + consult + eBPF",
    "compare.val_mod_l7": "CRS inline",
    "compare.val_mod_consult": "Separate module",
    "compare.val_lg_stability": "PASS (0 fail)",
    "compare.val_lg_eps": "~130 EPS (log replay)",
    "compare.val_mod_eps": "~12K EPS inline",
    "compare.val_lg_reactive": "Reactive (log line)",
    "compare.val_f2b_reactive": "Reactive",
    "compare.val_cs_reactive": "Partial",
    "compare.val_mod_reactive": "Inline block",
    "compare.val_lg_ddos": "None — CDN recommended",
    "compare.val_lg_community": "Self-hosted",
    "compare.val_cs_community": "Yes",
    "compare.val_lg_cloud": "Origin layer",
    "compare.val_mod_cloud": "Proxy mode",
    "compare.note": "Honest limit: not an inline ModSec EPS race — strength is integration + ban speed + transparent proof. See docs/VS_RAKIPLER.md",
    "compare.scroll_hint": "Scroll → explore the table",
    "compare.progress_label": "Proof discovery {pct}%",
    "bridge.eyebrow": "//:Pipeline",
    "bridge.kicker": "Single chain · self-hosted · MIT",
    "bridge.title": "Log → WAF → Kernel Ban",
    "bridge.sub": "nginx access log line to ipset ban in ~17 ms — competitors use fragmented stacks.",
    "bridge.s1": "log",
    "bridge.s2": "CRS",
    "bridge.s3": "ban",
    "bridge.s4": "proof",
    "why.eyebrow": "//:Why",
    "why.title": "Why Log Guardian?",
    "why.lead": "Competitors are piecemeal — we ship measurable proof in one chain.",
    "why.c1_title": "One pipeline",
    "why.c1_body": "nginx log → OWASP CRS → ~17 ms kernel ban. No Fail2ban + ModSec + script pile.",
    "why.c2_title": "Transparent proof",
    "why.c2_body": "competitive-proof PDF, 67 tests, 72h soak — missing or partial elsewhere.",
    "why.c3_title": "MIT · Turkey",
    "why.c3_body": "Open source, Turkish docs, self-hosted — no vendor lock-in.",
    "why.c4_title": "Honest limits",
    "why.c4_body": "Not ModSec inline EPS; no Cloudflare absorb. Origin integration + speed.",
    "evidence.preview_pdf": "Competitor compare PDF — measured bench summary",
    "evidence.preview_json": "competitive-proof JSON — machine-readable metrics",
    "evidence.preview_bench": "ModSecurity CRS parity + EPS comparison",
    "evidence.preview_fp": "200 benign requests — false positive rate",
    "evidence.preview_ban": "Kernel ban latency — ~17 ms ipset",
    "evidence.preview_soak": "72h soak report — 864 samples, 0 fail",
    "evidence.preview_soak_md": "Soak summary — operator notes",
    "evidence.preview_sprint": "Sprint prod gate — FAIL:0 proof",
    "evidence.preview_siem": "SIEM export — Splunk/Elastic compatibility",
    "evidence.preview_taxii": "TAXII feed integration test",
    "evidence.preview_vm": "VirtualBox VM sprint proof",
    "evidence.preview_geoip": "GeoIP MMDB — attack map data",
    "evidence.preview_webhook": "Webhook route proof — alert pipeline",
    "evidence.preview_telegram": "Telegram live webhook test",
    "pager.sec_bridge": "Pipeline bridge",
    "pager.sec_why": "Why LG",
    "hero.eyebrow": "//:LOG→BAN",
    "marquee.line": "nginx log → WAF → kernel ban · 67 tests · 72h soak PASS · MIT self-hosted · Turkey · open source",
    "showcase.core.eyebrow": "//:Core",
    "showcase.core.title": "What=\"we do\"",
    "showcase.core.desc": "Single chain: nginx access log → OWASP CRS → ~17 ms kernel ban. Production-ready in ~15 minutes.",
    "showcase.pro.eyebrow": "//:Pro",
    "showcase.pro.title": "Pro=\"SOC\"",
    "showcase.pro.desc": "Fleet, SOC timeline, Grafana — optional layer on your server after install.",
    "showcase.proof.eyebrow": "//:Proof",
    "showcase.core.peek": "Single chain · ~17 ms ban",
    "showcase.pro.peek": "Fleet · SOC timeline",
    "showcase.proof.peek": "67 tests ·                                                                        72h soak PASS",
    "showcase.proof.title": "Proof=\"67 tests\"",
    "showcase.proof.desc": "68 automated tests, competitive PDF, 72h soak — same matrix as dashboard /tests.",
    "showcase.cta": "Discover",
    "showcase.core.short": "CORE",
    "showcase.core.tag1": "~17 ms ban",
    "showcase.core.tag2": "OWASP CRS",
    "showcase.pro.short": "SOC",
    "showcase.pro.tag1": "Fleet",
    "showcase.pro.tag2": "Timeline",
    "showcase.proof.short": "PROOF",
    "showcase.proof.tag1": "67 tests",
    "showcase.proof.tag2": "72h soak",
    "showcase.grafana.short": "METRICS",
    "showcase.grafana.eyebrow": "//:Metrics",
    "showcase.grafana.title": "Grafana=\"SOC\"",
    "showcase.grafana.desc": "Tenant-labeled Prometheus metrics, Grafana dashboards and alert rules — self-hosted observability.",
    "showcase.grafana.peek": "Prometheus · tenant alerts",
    "showcase.grafana.tag1": "Prometheus",
    "showcase.grafana.tag2": "Alerts",
    "stats.tests_label": "Automated tests",
    "stats.eyebrow": "//:Stats",
    "stats.title": "By the numbers",
    "stats.lead": "Measured proof — automated tests, soak, ban latency, reach.",
    "stats.soak": "72h",
    "stats.soak_label": "Soak PASS",
    "stats.ban_suffix": "ms",
    "stats.ban_label": "Kernel ban",
    "stats.countries_label": "Countries reached",
    "section.about_eyebrow": "//:About",
    "section.flow_eyebrow": "//:Pipeline",
    "section.scope_eyebrow": "//:Honest",
    "section.github_eyebrow": "//:Source",
    "section.install_eyebrow": "//:Setup",
    "section.dashboard_eyebrow": "//:Pro",
    "section.layers_eyebrow": "//:Layers",
    "section.evidence_eyebrow": "//:Evidence",
    "section.tests_eyebrow": "//:Proof",
    "section.laptop_eyebrow": "//:Verify",
    "section.contact_eyebrow": "//:Contact",
    "cta.banner.title": "Ready to deploy?",
    "cta.banner.body": "Clone, install, verify FAIL:0 — Core runs without the dashboard.",
    "cta.banner.btn": "15 min setup",
    "nav.home": "Home",
    "nav.install": "Setup",
    "nav.tests": "Tests",
    "nav.compare": "Compare",
    "nav.evidence": "Evidence",
    "nav.contact": "Contact",
    "nav.prev_section": "Previous section",
    "nav.next_section": "Next section",
    "nav.index": "Index",
    "index.title": "Chapters",
    "index.close": "Close",
    "case.close": "Close",
    "case.open_hint": "Click front card — case study",
    "case.prev": "Previous case",
    "case.next": "Next case",
    "case.core.lead": "Single chain: nginx access log → OWASP CRS → ~17 ms kernel ban. Production-ready on your server in ~15 minutes — no Fail2ban + ModSec script stack.",
    "case.core.cta": "Setup guide",
    "case.pro.lead": "Optional Pro layer after Core: fleet sync, SOC timeline, Grafana dashboards — all self-hosted on your infrastructure.",
    "case.pro.cta": "Dashboard & SOC",
    "case.proof.lead": "68 automated tests, competitive-proof PDF, 72h soak — the same matrix as /tests. FAIL:0 gate before every release.",
    "case.proof.cta": "Open tests",
    "case.grafana.lead": "Prometheus metrics with tenant labels, Grafana dashboards and alert rules — observability without vendor lock-in.",
    "case.grafana.cta": "Metrics layer",
    "hero.metric_ban_val": "~17 ms",
    "hero.metric_ban": "kernel ban",
    "hero.metric_tests": "automated tests",
    "hero.metric_soak_val": "72h",
    "hero.metric_soak": "soak PASS",
    "pager.hint": "Section nav — jump with arrows",
    "pager.sec_home": "Home",
    "pager.sec_work": "Selected proofs",
    "pager.sec_compare": "Compare",
    "pager.sec_stats": "Stats",
    "pager.sec_about": "About",
    "pager.sec_install": "Install",
    "pager.sec_dashboard": "Dashboard",
    "pager.sec_tests": "Tests",
    "pager.sec_evidence": "Evidence",
    "pager.sec_contact": "Contact",
    "pager.next_to": "Next → {section}",
    "theme.label_light": "Light mode",
    "theme.label_dark": "Dark mode",
    "about.title": "À propos — Linux Log Guardian",
    "site.purpose": "<strong>Page publique de présentation et de téléchargement.</strong> Contenu statique : aperçu, guide d'installation, pack de preuves et contact. Log Guardian ne s'exécute pas ici — vous l'installez sur votre propre serveur Linux.",
    "about.body": "<p><strong>Linux Log Guardian</strong> est une pile de sécurité <strong>open source (MIT)</strong> self-hosted, développée en Turquie. Une seule chaîne : <em>lire les logs nginx → règles OWASP CRS → ban au niveau noyau</em>.</p><p>Projet communautaire indépendant — revue de code, personnalisation et hébergement on-prem sans verrouillage cloud.</p><ul><li>Source transparente ; contributions bienvenues</li><li>Binaire : <code>log-guardian</code> · paquet : <code>log-guardian_*.deb</code></li><li><strong>Core</strong> seul prêt pour la production (~15 min)</li><li>Dashboard, Grafana, fleet = couche <strong>Pro</strong> optionnelle</li></ul>",
    "flow.title": "Chaîne unique : du log au ban noyau",
    "flow.s1": "nginx access log",
    "flow.s2": "Parser + CRS/WAF",
    "flow.s3": "Pipeline de ban",
    "flow.s4": "ipset / noyau",
    "flow.s5": "Métriques + dashboard",
    "flow.note": "XDR, marketplace Wasm et LLM Copilot sont des couches optionnelles à long terme — Core seul suffit en production.",
    "scope.honest.title": "Honest limits (not competing on edge speed)",
    "scope.honest.body": "<ul><li><strong>Reactive architecture</strong> — first request may pass until the log line is parsed; we are not inline ModSec throughput.</li><li><strong>L7 application layer</strong> — CRS/WAF, nginx consult, and eBPF HTTP probe; this is not volumetric L3/L4 scrub.</li><li><strong>No volumetric L3/L4 DDoS absorb</strong> — use CDN/Cloudflare on top.</li><li><strong>Distributed botnets</strong> — per-IP ban; no CrowdSec signal network.</li><li><strong>We do:</strong> log → CRS/WAF → ~17&nbsp;ms kernel ban, proof PDF, Telegram ops, MIT self-hosted.</li></ul>",
    "install.title": "Guide d'installation (détaillé)",
    "install.intro": "<p>Installation <strong>production</strong> pas à pas sur Ubuntu/Debian. Fonctionne sans XDP sur laptop ou VM VirtualBox. Docs : <code>docs/QUICKSTART_NGINX.md</code> et <code>docs/LAPTOP_OPS.md</code>.</p>",
    "install.terminal_label": "15-minute install — live terminal",
    "install.terminal_demo": "$ sudo dpkg -i log-guardian_*_amd64.deb\nSelecting previously unselected package log-guardian.\nlog-guardian installed.\n$ sudo bash /usr/local/share/log-guardian/scripts/install_first_run.sh\n[OK] log-guardian.service active\n[OK] --health IPC\n[OK] API fail-closed (unauthenticated 403)\n\n=== summary ===\n  FAIL: 0   WARN: 0\n[OK] post_install_verify — install gate passed",
    "install.expect_label": "Expected output (sample):",
    "install.deb_title": "A) Fresh server — .deb package (recommended)",
    "install.deb_body": "<p>No compile step. Ships binaries, systemd, rules and scripts. <strong>Upgrade-safe:</strong> existing <code>/etc/log-guardian/rules.conf</code> is preserved.</p><p><strong>Download:</strong> <a href=\"https://github.com/kurtulusutkucenik/Linux-Log-Guardian/releases\">GitHub Releases</a> (<code>log-guardian_*_amd64.deb</code>) or build from repo: <code>bash scripts/build_deb.sh</code> → <code>dist/</code>.</p>",
    "install.deb_s1_title": "1. Dependencies",
    "install.deb_s1_body": "<p>Install Debian package dependencies on first setup. nginx can be added in the same command if missing.</p>",
    "install.block_deb_deps": "sudo apt-get update\nsudo apt-get install -y ipset libbpf1 libcurl4 libpcre2-8-0 libsqlite3-0 \\\n  libssl3 libelf1 libz1 liburing2 nginx",
    "install.out_deb_deps": "Reading package lists... Done\nSetting up ipset (7.x) ...\nSetting up libbpf1:amd64 ...\nSetting up nginx (1.x) ...",
    "install.deb_s2_title": "2. Install package",
    "install.deb_s2_body": "<p>If <code>dpkg -i</code> reports missing dependencies, run <code>apt-get install -f</code>. postinst creates the <code>log-guardian</code> user, permissions and services automatically.</p>",
    "install.block_deb": "# Copy .deb to server (scp, wget, USB...)\nsudo dpkg -i log-guardian_*_amd64.deb\nsudo apt-get install -f   # if dependencies missing\n\n# On success:\n#   log-guardian kuruldu.\n#   sudo bash .../install_first_run.sh\n#   bash .../post_install_verify.sh",
    "install.out_deb": "Selecting previously unselected package log-guardian.\n(Reading database ... 100%)\nSetting up log-guardian (72e5a7b) ...\n[deb_post_install] rules.conf olusturuldu: /etc/log-guardian/rules.conf\n\nlog-guardian kuruldu.",
    "install.deb_s3_title": "3. First run & verification",
    "install.deb_s3_body": "<p>Prepares nginx log format, FP trust and API security in one pass. Scripts live under <code>/usr/local/share/log-guardian/scripts/</code>.</p>",
    "install.block_deb_first": "sudo bash /usr/local/share/log-guardian/scripts/install_first_run.sh\nsudo bash /usr/local/share/log-guardian/scripts/ensure_api_security.sh\nbash /usr/local/share/log-guardian/scripts/post_install_verify.sh",
    "install.out_deb_first": "[OK] log-guardian.service active\n[OK] log-guardian-daemon.service active\n[OK] --health IPC\n[OK] API fail-closed (tokensiz 403)\n\n=== ozet ===\n  FAIL: 0   WARN: 0\n[OK] post_install_verify — kurulum kapisi gecti",
    "install.src_title": "B) Source — build and install",
    "install.src_body": "<p>Clone from <a href=\"https://github.com/kurtulusutkucenik/Linux-Log-Guardian\">GitHub</a> and build locally. Best for development and full source review.</p>",
    "install.req_title": "Prérequis",
    "install.req_body": "<ul><li>Ubuntu 22.04 / 24.04 ou Debian 12 (amd64)</li><li>nginx avec access log inscriptible</li><li>root/sudo (systemd, ipset, <code>/etc/log-guardian</code>)</li><li>Pro optionnel : Docker (dashboard/Grafana), noyau adapté à eBPF</li></ul>",
    "install.s1_title": "Source ou .deb",
    "install.s1_body": "<p>Cloner, compiler et lancer l'installateur principal. <code>install.sh</code> configure systemd, règles et format de log nginx.</p>",
    "install.block1": "git clone https://github.com/kurtulusutkucenik/Linux-Log-Guardian.git\ncd Linux-Log-Guardian\nmake -j$(nproc)\nsudo bash install.sh",
    "install.s2_title": "Premier lancement et sécurité API",
    "install.s2_body": "<p>Démarre les services et prépare la synchro du token API pour le dashboard.</p>",
    "install.block_api": "sudo bash scripts/install_first_run.sh\nsudo bash scripts/ensure_api_security.sh\nbash scripts/sync_dashboard_api_token.sh",
    "install.common_title": "Shared steps (after A or B)",
    "install.s3_title": "Format de log nginx",
    "install.s3_body": "<p>Le WAF exige le format <code>log_guardian</code> pour le body et XFF. L'installateur l'applique en général — vérifier :</p>",
    "install.block_nginx": "# examples/nginx-log-guardian.conf → site config\nSTRICT=1 bash scripts/check_nginx_log_format.sh\nsudo nginx -t && sudo systemctl reload nginx",
    "install.s4_title": "Vérification",
    "install.s4_body": "<p>Vérifier santé, alarmes et métriques Prometheus. <code>post_install_verify.sh</code> résume sur laptop.</p>",
    "install.block_verify": "sudo log-guardian --health\nsudo log-guardian --status\n# Source install:\nbash scripts/post_install_verify.sh\n# .deb install:\nbash /usr/local/share/log-guardian/scripts/post_install_verify.sh\ncurl -s http://127.0.0.1:9091/metrics | head",
    "install.out_health": "[HEALTH] daemon IPC: OK\n[HEALTH] BPF xdp=OFF execve=OFF lineage=OFF\n[HEALTH] RCE det=0 kill=0 lineage=0 connect=0 uptime=…s",
    "install.out_verify": "[OK] log-guardian.service active\n[OK] metrics :9091\n[OK] API fail-closed (tokensiz 403)\n[OK] nginx log_guardian format\n\n=== ozet ===\n  FAIL: 0   WARN: 0\n[OK] post_install_verify — kurulum kapisi gecti",
    "install.out_metrics": "# HELP loganalyzer_log_lines_total ...\nloganalyzer_log_lines_total{tenant_id=\"default\"} 8\nloganalyzer_ban_success_total{tenant_id=\"default\"} 8",
    "install.s5_title": "VirtualBox / sans XDP (laptop et VM)",
    "install.s5_body": "<p>Sans eBPF/XDP, utiliser <code>--no-xdp</code> avec bans ipset. En cas d'échec service, script de réparation.</p>",
    "install.block2": "sudo bash install.sh --no-xdp\nsudo bash scripts/install_first_run.sh\n# if service FAIL:\nsudo bash scripts/repair_no_xdp_stack.sh",
    "install.tip": "<strong>Astuce :</strong> JWT : <code>bash scripts/laptop_jwt_setup.sh</code>. Démo rapide : <code>SKIP_WEBHOOK=1 bash scripts/demo_3min.sh</code>",
    "dashboard.title": "Dashboard — après installation (Pro optionnel)",
    "dashboard.where": "<strong>Important :</strong> le dashboard ne tourne <em>pas</em> sur ce site. <code>localhost:3001</code> est sur <strong>votre machine Linux</strong> où vous avez installé — le localhost du visiteur n'est pas votre serveur.",
    "dashboard.body": "<p><strong>Dashboard Pro</strong> (Next.js) : fleet, historique des bans, tests et PDF de preuves. Écoute sur <code>:3001</code> en TLS. Durcir avec <code>laptop_harden.sh</code> avant exposition internet.</p>",
    "dashboard.access_title": "Qui y accède, et quand ?",
    "dashboard.access_row1_label": "Visiteur du site",
    "dashboard.access_row1": "Lit cette page, télécharge source ou .deb — n'ouvre <strong>pas</strong> le port 3001.",
    "dashboard.access_row2_label": "Installateur",
    "dashboard.access_row2": "Après <code>install.sh</code> + <code>dashboard_dev.sh</code> sur Ubuntu/Debian : <code>http://localhost:3001</code> <strong>sur la même machine</strong>.",
    "dashboard.access_row3_label": "VPS distant",
    "dashboard.access_row3": "Tunnel SSH ou (si firewall) <code>https://SERVER_IP:3001</code>. Ne pas exposer avec le mot de passe démo.",
    "dashboard.req_title": "Prérequis supplémentaires dashboard",
    "dashboard.req_body": "<ul><li><strong>Core</strong> : nginx + sudo — dashboard <em>non requis</em></li><li><strong>Dashboard</strong> : Docker + <code>dashboard_dev.sh</code></li><li><strong>Grafana</strong> : aussi <code>grafana_stack.sh</code> (optionnel)</li></ul>",
    "dashboard.start_title": "Démarrer sur votre serveur",
    "dashboard.start": "# On the machine where you installed (not this website):\nbash scripts/dashboard_refresh.sh\n# Browser on the same machine:\n#   https://localhost:8443\n# Login: admin / DASHBOARD_ADMIN_PASSWORD in .env",
    "dashboard.features": "<ul><li><strong>Fleet :</strong> agents online/offline, alarmes récentes</li><li><strong>Tests :</strong> phase100, competitive-proof, bench</li><li><strong>Rapports :</strong> pack PDF/JSON</li><li><strong>Grafana :</strong> métriques tenant via <code>bash scripts/grafana_provision.sh</code></li></ul>",
    "dashboard.optional": "<strong>Core suffit ?</strong> Oui. log → WAF → ban noyau sans dashboard. CLI (<code>log-guardian --status</code>) et Prometheus (<code>:9091/metrics</code>) inclus dans Core.",
    "dashboard.preview_title": "Aperçu de l'interface",
    "dashboard.preview_note": "Captures ci-dessous : exemples. UI live uniquement sur votre installation.",
    "dashboard.cap1": "Fleet — agents et alarmes récentes",
    "dashboard.cap2": "Tests — phase100, bench, soak",
    "dashboard.cap3": "Grafana + métriques Prometheus",
    "dashboard.note": "Résumé : ce site = télécharger et apprendre. Dashboard = sur votre serveur, après install, optionnel.",
    "warn.title": "⚠️ Avant exposition internet",
    "warn.p1": "Laptop/démo : mot de passe <code>DegistirBeni!123</code> volontairement ouvert.",
    "warn.p2": "VPS public : <code>sudo env LG_NEW_PASSWORD='…' bash scripts/laptop_harden.sh</code>",
    "warn.p3": "Profils : <code>docs/SECURITY_PROFILES.md</code>",
    "layers.title": "Couches",
    "layers.core": "Core",
    "layers.core_desc": "log → WAF → ban ipset (~15 min)",
    "layers.pro": "Pro",
    "layers.pro_desc": "daemon eBPF, dashboard, Grafana, fleet",
    "layers.opt": "Optionnel",
    "layers.opt_desc": "XDR, marketplace Wasm, LLM Copilot",
    "layers.note": "Pro et couches optionnelles sont des extensions ; Core suffit au quotidien.",
    "github.title": "Source code (GitHub)",
    "github.intro": "<p><strong>Linux Log Guardian</strong> is fully open source (MIT). All C source, install scripts, tests and evidence are on GitHub — you install on your own Linux server; this site is only a landing page.</p>",
    "github.releases": "Releases (.deb)",
    "github.steps_title": "Quick start (from source)",
    "github.steps_body": "<p>Clone, build, install; aim for <code>FAIL: 0</code> in <code>post_install_verify</code>. Step-by-step: <a href=\"#kurulum\">Setup</a> · proofs: <a href=\"/tests\">Tests</a>.</p>",
    "github.contrib": "<p>Issues and pull requests welcome. Do not commit API/Telegram secrets — use <code>ensure_api_security.sh</code> and <code>webhook.local.env.example</code> on install.</p>",
    "download.title": "Télécharger (paquet .deb)",
    "download.intro": "<p>Construire le paquet : <code>build_deb.sh</code>. Vérification sans install : <code>test_deb_local.sh</code>.</p>",
    "download.block": "bash scripts/build_deb.sh\n# → dist/log-guardian_*.deb\nbash scripts/test_deb_local.sh",
    "download.verify": "Validation du paquet (sans install) : <code>bash scripts/test_deb_local.sh</code>",
    "evidence.title": "Pack de preuves",
    "evidence.gate": "Gate laptop : <code>bash scripts/laptop_sprint_gate.sh</code>",
    "evidence.sync": "Actualiser : <code>bash scripts/sync_evidence_pack.sh</code>",
    "tests.title": "Validation tests",
    "tests.page_title": "Validation tests",
    "tests.page_title_line1": "VALIDATION",
    "tests.page_title_line2": "TESTS",
    "tests.hero_eyebrow": "//:Proof",
    "tests.page_intro": "Same matrix as dashboard <code>/tests</code> — install gates, CRS parity, FP, ban latency, corpus recall and <strong>72h soak</strong>. Each card is automated script output.",
    "tests.matrix_title": "Full test matrix",
    "tests.matrix_desc": "From install gates to competitive proof — every row is real script output, identical to the dashboard.",
    "tests.filter_all": "All",
    "tests.filter_gate": "Install gates",
    "tests.filter_proof": "Competitive proof",
    "tests.filter_fail": "Failed",
    "tests.filter_aria": "Test matrix filter",
    "tests.filter_count": "{visible}/{total} visible",
    "tests.search_label": "Search tests",
    "tests.search_placeholder": "Test name, script or id…",
    "tests.proof_pack": "Proof pack JSON",
    "tests.hl_pass_value": "67/72",
    "tests.hl_pass_label": "Automated tests PASS",
    "tests.hl_soak_value": "72h",
    "tests.hl_soak_label": "Soak · 864 samples · 0 failures",
    "tests.hl_ban_value": "17ms",
    "tests.hl_ban_label": "Median kernel ban",
    "tests.hl_crs_value": "100%",
    "tests.hl_crs_label": "OWASP CRS parity",
    "tests.hl_fp_value": "0.2%",
    "tests.hl_fp_label": "Benign FP rate",
    "tests.hl_eps_value": "5357",
    "tests.hl_eps_label": "EPS · single-pass log-WAF",
    "tests.teaser": "Same automated test matrix as the dashboard — <strong>72 proofs</strong> (install gates, CRS, FP, ban latency, corpus, 72h soak).",
    "tests.open_full": "View all tests (72)",
    "tests.proof_pdf": "Evidence PDF",
    "tests.intro": "Same automated test matrix as the dashboard — install gates (FAIL=0), CRS parity, FP, ban latency, corpus recall and <strong>72h VPS/VM soak</strong>. Live installs refresh the same data at dashboard <code>/tests</code>.",
    "tests.note": "Raw JSON: <a href=\"/evidence/competitive-proof.json\" rel=\"noopener noreferrer\" download>competitive-proof.json</a> · PDF: <a href=\"/evidence/competitive-proof.pdf\" rel=\"noopener noreferrer\">competitive-proof.pdf</a> · Refresh: <code>bash scripts/competitive_proof.sh</code>",
    "laptop.title": "Matrice de validation laptop",
    "laptop.intro": "<p>Gate dev rapide : sprint gate, soak 1h et démo 3 min. Soak 72h VM : <code>laptop_soak_72h.sh --start</code>.</p>",
    "laptop.block": "SKIP_PHASE100=1 bash scripts/laptop_sprint_gate.sh\nSOAK_1H=1 bash scripts/laptop_soak_72h.sh --start\nSKIP_WEBHOOK=1 bash scripts/demo_3min.sh",
    "contact.title": "Contact et contributions",
    "contact.body": "<p>Questions, collaboration ou contributions — contactez-nous. Bugs et pull requests bienvenus.</p>",
    "contact.email_label": "E-mail :",
    "footer": "Linux Log Guardian · Fabriqué en Turquie · MIT · open source · <a href=\"mailto:kurtulusutkucenikcontact@gmail.com\">kurtulusutkucenikcontact@gmail.com</a>"
  },
  "es": {
    "meta.description": "Linux Log Guardian — WAF nginx open source hecho en Turquía. log → ban en ~15 min.",
    "hero.title": "Linux Log Guardian",
    "hero.tag": "nginx access log → WAF/CRS → ban en kernel · cadena única · self-hosted",
    "hero.badge_tr": "TURK",
    "hero.badge_opensource": "código abierto",
    "hero.badge_mit": "Open source · MIT",
    "hero.badge_core": "Core ~15 min de instalación",
    "hero.badge_soak": "72h soak PASS",
    "hero.cta_install": "Instalación 15 min",
    "hero.cta_dashboard": "Panel (tras instalar)",
    "hero.cta_tests": "Test results",
    "hero.cta_evidence": "Paquete de pruebas",
    "hero.cta_contact": "Contacto",
    "hero.cta_github": "Source on GitHub",
    "hero.proof_traction": "2.3k+ visits · 4k+ page views · 54 countries · proof PDF",
    "hero.scroll_hint": "Scroll — explore",
    "hero.enter_hint": "Click or scroll — continue",
    "enter.skip": "Skip",
    "enter.continue": "Enter",
    "section.work_eyebrow": "//:Selected",
    "section.work_title": "Selected proofs",
    "section.work_sub": "Core · Pro · Proof · Grafana — measurable outcomes in one chain.",
    "section.work_hint": "Scroll — more evidence cards",
    "compare.eyebrow": "//:Vs",
    "compare.title": "Competitor compare",
    "compare.sub": "Measured proof — Fail2ban / CrowdSec / ModSecurity architectural notes",
    "compare.col_metric": "Metric",
    "compare.col_lg": "Log Guardian",
    "compare.col_f2b": "Fail2ban",
    "compare.col_cs": "CrowdSec",
    "compare.col_mod": "ModSec + CRS",
    "compare.row_pipeline": "Log → WAF → kernel ban",
    "compare.row_recall": "Real attack recall",
    "compare.row_fp": "False positive",
    "compare.row_ban": "Ban latency",
    "compare.row_proof": "Proof pack PDF+JSON",
    "compare.row_mit": "MIT + TR docs",
    "compare.val_lg_pipeline": "Single pipeline",
    "compare.val_f2b_pipeline": "Ban only",
    "compare.val_cs_pipeline": "Fragmented",
    "compare.val_mod_pipeline": "WAF separate",
    "compare.val_lg_recall": "100% (1K+10K)",
    "compare.val_na": "—",
    "compare.val_mod_recall": "CRS parity 100%",
    "compare.val_lg_fp": "0.2%",
    "compare.val_f2b_fp": "High",
    "compare.val_cs_fp": "Medium",
    "compare.val_mod_fp": "CRS dependent",
    "compare.val_lg_ban": "~17 ms",
    "compare.val_f2b_ban": "sec–min",
    "compare.val_cs_ban": "sec",
    "compare.val_mod_ban": "Separate integration",
    "compare.val_yes": "Automatic",
    "compare.val_no": "None",
    "compare.val_cs_proof": "Partial",
    "compare.val_mod_proof": "Per module",
    "compare.val_partial": "Partial",
    "compare.val_mod_mit": "CRS open",
    "compare.sec_strength": "Strengths (measured)",
    "compare.sec_honest": "Honest limits",
    "compare.row_ja3": "Distributed / JA3 cluster",
    "compare.row_consult": "nginx inline consult",
    "compare.row_l7": "L7 application protection",
    "compare.row_stability": "Short stability (5 min)",
    "compare.row_inline_eps": "Inline regex EPS",
    "compare.row_reactive": "First request may pass",
    "compare.row_ddos": "Volumetric L3/L4 scrub",
    "compare.row_community": "Community signal network",
    "compare.row_cloud": "Edge / Cloud WAF",
    "compare.val_lg_ja3": "100% (80 IPs)",
    "compare.val_cs_ja3": "Signal-based",
    "compare.val_lg_consult": "PASS",
    "compare.val_lg_l7": "WAF + consult + eBPF",
    "compare.val_mod_l7": "CRS inline",
    "compare.val_mod_consult": "Separate module",
    "compare.val_lg_stability": "PASS (0 fail)",
    "compare.val_lg_eps": "~130 EPS (log replay)",
    "compare.val_mod_eps": "~12K EPS inline",
    "compare.val_lg_reactive": "Reactive (log line)",
    "compare.val_f2b_reactive": "Reactive",
    "compare.val_cs_reactive": "Partial",
    "compare.val_mod_reactive": "Inline block",
    "compare.val_lg_ddos": "None — CDN recommended",
    "compare.val_lg_community": "Self-hosted",
    "compare.val_cs_community": "Yes",
    "compare.val_lg_cloud": "Origin layer",
    "compare.val_mod_cloud": "Proxy mode",
    "compare.note": "Honest limit: not an inline ModSec EPS race — strength is integration + ban speed + transparent proof. See docs/VS_RAKIPLER.md",
    "compare.scroll_hint": "Scroll → explore the table",
    "compare.progress_label": "Proof discovery {pct}%",
    "bridge.eyebrow": "//:Pipeline",
    "bridge.kicker": "Single chain · self-hosted · MIT",
    "bridge.title": "Log → WAF → Kernel Ban",
    "bridge.sub": "nginx access log line to ipset ban in ~17 ms — competitors use fragmented stacks.",
    "bridge.s1": "log",
    "bridge.s2": "CRS",
    "bridge.s3": "ban",
    "bridge.s4": "proof",
    "why.eyebrow": "//:Why",
    "why.title": "Why Log Guardian?",
    "why.lead": "Competitors are piecemeal — we ship measurable proof in one chain.",
    "why.c1_title": "One pipeline",
    "why.c1_body": "nginx log → OWASP CRS → ~17 ms kernel ban. No Fail2ban + ModSec + script pile.",
    "why.c2_title": "Transparent proof",
    "why.c2_body": "competitive-proof PDF, 67 tests, 72h soak — missing or partial elsewhere.",
    "why.c3_title": "MIT · Turkey",
    "why.c3_body": "Open source, Turkish docs, self-hosted — no vendor lock-in.",
    "why.c4_title": "Honest limits",
    "why.c4_body": "Not ModSec inline EPS; no Cloudflare absorb. Origin integration + speed.",
    "evidence.preview_pdf": "Competitor compare PDF — measured bench summary",
    "evidence.preview_json": "competitive-proof JSON — machine-readable metrics",
    "evidence.preview_bench": "ModSecurity CRS parity + EPS comparison",
    "evidence.preview_fp": "200 benign requests — false positive rate",
    "evidence.preview_ban": "Kernel ban latency — ~17 ms ipset",
    "evidence.preview_soak": "72h soak report — 864 samples, 0 fail",
    "evidence.preview_soak_md": "Soak summary — operator notes",
    "evidence.preview_sprint": "Sprint prod gate — FAIL:0 proof",
    "evidence.preview_siem": "SIEM export — Splunk/Elastic compatibility",
    "evidence.preview_taxii": "TAXII feed integration test",
    "evidence.preview_vm": "VirtualBox VM sprint proof",
    "evidence.preview_geoip": "GeoIP MMDB — attack map data",
    "evidence.preview_webhook": "Webhook route proof — alert pipeline",
    "evidence.preview_telegram": "Telegram live webhook test",
    "pager.sec_bridge": "Pipeline bridge",
    "pager.sec_why": "Why LG",
    "hero.eyebrow": "//:LOG→BAN",
    "marquee.line": "nginx log → WAF → kernel ban · 67 tests · 72h soak PASS · MIT self-hosted · Turkey · open source",
    "showcase.core.eyebrow": "//:Core",
    "showcase.core.title": "What=\"we do\"",
    "showcase.core.desc": "Single chain: nginx access log → OWASP CRS → ~17 ms kernel ban. Production-ready in ~15 minutes.",
    "showcase.pro.eyebrow": "//:Pro",
    "showcase.pro.title": "Pro=\"SOC\"",
    "showcase.pro.desc": "Fleet, SOC timeline, Grafana — optional layer on your server after install.",
    "showcase.proof.eyebrow": "//:Proof",
    "showcase.core.peek": "Single chain · ~17 ms ban",
    "showcase.pro.peek": "Fleet · SOC timeline",
    "showcase.proof.peek": "67 tests ·                                                                        72h soak PASS",
    "showcase.proof.title": "Proof=\"67 tests\"",
    "showcase.proof.desc": "68 automated tests, competitive PDF, 72h soak — same matrix as dashboard /tests.",
    "showcase.cta": "Discover",
    "showcase.core.short": "CORE",
    "showcase.core.tag1": "~17 ms ban",
    "showcase.core.tag2": "OWASP CRS",
    "showcase.pro.short": "SOC",
    "showcase.pro.tag1": "Fleet",
    "showcase.pro.tag2": "Timeline",
    "showcase.proof.short": "PROOF",
    "showcase.proof.tag1": "67 tests",
    "showcase.proof.tag2": "72h soak",
    "showcase.grafana.short": "METRICS",
    "showcase.grafana.eyebrow": "//:Metrics",
    "showcase.grafana.title": "Grafana=\"SOC\"",
    "showcase.grafana.desc": "Tenant-labeled Prometheus metrics, Grafana dashboards and alert rules — self-hosted observability.",
    "showcase.grafana.peek": "Prometheus · tenant alerts",
    "showcase.grafana.tag1": "Prometheus",
    "showcase.grafana.tag2": "Alerts",
    "stats.tests_label": "Automated tests",
    "stats.eyebrow": "//:Stats",
    "stats.title": "By the numbers",
    "stats.lead": "Measured proof — automated tests, soak, ban latency, reach.",
    "stats.soak": "72h",
    "stats.soak_label": "Soak PASS",
    "stats.ban_suffix": "ms",
    "stats.ban_label": "Kernel ban",
    "stats.countries_label": "Countries reached",
    "section.about_eyebrow": "//:About",
    "section.flow_eyebrow": "//:Pipeline",
    "section.scope_eyebrow": "//:Honest",
    "section.github_eyebrow": "//:Source",
    "section.install_eyebrow": "//:Setup",
    "section.dashboard_eyebrow": "//:Pro",
    "section.layers_eyebrow": "//:Layers",
    "section.evidence_eyebrow": "//:Evidence",
    "section.tests_eyebrow": "//:Proof",
    "section.laptop_eyebrow": "//:Verify",
    "section.contact_eyebrow": "//:Contact",
    "cta.banner.title": "Ready to deploy?",
    "cta.banner.body": "Clone, install, verify FAIL:0 — Core runs without the dashboard.",
    "cta.banner.btn": "15 min setup",
    "nav.home": "Home",
    "nav.install": "Setup",
    "nav.tests": "Tests",
    "nav.compare": "Compare",
    "nav.evidence": "Evidence",
    "nav.contact": "Contact",
    "nav.prev_section": "Previous section",
    "nav.next_section": "Next section",
    "nav.index": "Index",
    "index.title": "Chapters",
    "index.close": "Close",
    "case.close": "Close",
    "case.open_hint": "Click front card — case study",
    "case.prev": "Previous case",
    "case.next": "Next case",
    "case.core.lead": "Single chain: nginx access log → OWASP CRS → ~17 ms kernel ban. Production-ready on your server in ~15 minutes — no Fail2ban + ModSec script stack.",
    "case.core.cta": "Setup guide",
    "case.pro.lead": "Optional Pro layer after Core: fleet sync, SOC timeline, Grafana dashboards — all self-hosted on your infrastructure.",
    "case.pro.cta": "Dashboard & SOC",
    "case.proof.lead": "68 automated tests, competitive-proof PDF, 72h soak — the same matrix as /tests. FAIL:0 gate before every release.",
    "case.proof.cta": "Open tests",
    "case.grafana.lead": "Prometheus metrics with tenant labels, Grafana dashboards and alert rules — observability without vendor lock-in.",
    "case.grafana.cta": "Metrics layer",
    "hero.metric_ban_val": "~17 ms",
    "hero.metric_ban": "kernel ban",
    "hero.metric_tests": "automated tests",
    "hero.metric_soak_val": "72h",
    "hero.metric_soak": "soak PASS",
    "pager.hint": "Section nav — jump with arrows",
    "pager.sec_home": "Home",
    "pager.sec_work": "Selected proofs",
    "pager.sec_compare": "Compare",
    "pager.sec_stats": "Stats",
    "pager.sec_about": "About",
    "pager.sec_install": "Install",
    "pager.sec_dashboard": "Dashboard",
    "pager.sec_tests": "Tests",
    "pager.sec_evidence": "Evidence",
    "pager.sec_contact": "Contact",
    "pager.next_to": "Next → {section}",
    "theme.label_light": "Light mode",
    "theme.label_dark": "Dark mode",
    "about.title": "Acerca de — Linux Log Guardian",
    "site.purpose": "<strong>Sitio público de presentación y descarga.</strong> Contenido estático: resumen, guía de instalación, pruebas y contacto. Log Guardian no se ejecuta aquí — lo instalas en tu propio servidor Linux.",
    "about.body": "<p><strong>Linux Log Guardian</strong> es una pila de seguridad <strong>open source (MIT)</strong> self-hosted, desarrollada en Turquía. Una cadena: <em>leer logs nginx → reglas OWASP CRS → ban a nivel kernel</em>.</p><p>Proyecto comunitario independiente — revisión de código, personalización y hosting on-prem sin bloqueo cloud.</p><ul><li>Código transparente; contribuciones bienvenidas</li><li>Binario: <code>log-guardian</code> · paquete: <code>log-guardian_*.deb</code></li><li><strong>Core</strong> solo listo para producción (~15 min)</li><li>Dashboard, Grafana, fleet = capa <strong>Pro</strong> opcional</li></ul>",
    "flow.title": "Cadena única: del log al ban en kernel",
    "flow.s1": "nginx access log",
    "flow.s2": "Parser + CRS/WAF",
    "flow.s3": "Pipeline de ban",
    "flow.s4": "ipset / kernel",
    "flow.s5": "Métricas + dashboard",
    "flow.note": "XDR, marketplace Wasm y LLM Copilot son capas opcionales a largo plazo — Core solo es suficiente en producción.",
    "scope.honest.title": "Honest limits (not competing on edge speed)",
    "scope.honest.body": "<ul><li><strong>Reactive architecture</strong> — first request may pass until the log line is parsed; we are not inline ModSec throughput.</li><li><strong>L7 application layer</strong> — CRS/WAF, nginx consult, and eBPF HTTP probe; this is not volumetric L3/L4 scrub.</li><li><strong>No volumetric L3/L4 DDoS absorb</strong> — use CDN/Cloudflare on top.</li><li><strong>Distributed botnets</strong> — per-IP ban; no CrowdSec signal network.</li><li><strong>We do:</strong> log → CRS/WAF → ~17&nbsp;ms kernel ban, proof PDF, Telegram ops, MIT self-hosted.</li></ul>",
    "install.title": "Guía de instalación (detallada)",
    "install.intro": "<p>Instalación <strong>de producción</strong> paso a paso en Ubuntu/Debian. Funciona sin XDP en laptop o VM VirtualBox. Docs: <code>docs/QUICKSTART_NGINX.md</code> y <code>docs/LAPTOP_OPS.md</code>.</p>",
    "install.terminal_label": "15-minute install — live terminal",
    "install.terminal_demo": "$ sudo dpkg -i log-guardian_*_amd64.deb\nSelecting previously unselected package log-guardian.\nlog-guardian installed.\n$ sudo bash /usr/local/share/log-guardian/scripts/install_first_run.sh\n[OK] log-guardian.service active\n[OK] --health IPC\n[OK] API fail-closed (unauthenticated 403)\n\n=== summary ===\n  FAIL: 0   WARN: 0\n[OK] post_install_verify — install gate passed",
    "install.expect_label": "Expected output (sample):",
    "install.deb_title": "A) Fresh server — .deb package (recommended)",
    "install.deb_body": "<p>No compile step. Ships binaries, systemd, rules and scripts. <strong>Upgrade-safe:</strong> existing <code>/etc/log-guardian/rules.conf</code> is preserved.</p><p><strong>Download:</strong> <a href=\"https://github.com/kurtulusutkucenik/Linux-Log-Guardian/releases\">GitHub Releases</a> (<code>log-guardian_*_amd64.deb</code>) or build from repo: <code>bash scripts/build_deb.sh</code> → <code>dist/</code>.</p>",
    "install.deb_s1_title": "1. Dependencies",
    "install.deb_s1_body": "<p>Install Debian package dependencies on first setup. nginx can be added in the same command if missing.</p>",
    "install.block_deb_deps": "sudo apt-get update\nsudo apt-get install -y ipset libbpf1 libcurl4 libpcre2-8-0 libsqlite3-0 \\\n  libssl3 libelf1 libz1 liburing2 nginx",
    "install.out_deb_deps": "Reading package lists... Done\nSetting up ipset (7.x) ...\nSetting up libbpf1:amd64 ...\nSetting up nginx (1.x) ...",
    "install.deb_s2_title": "2. Install package",
    "install.deb_s2_body": "<p>If <code>dpkg -i</code> reports missing dependencies, run <code>apt-get install -f</code>. postinst creates the <code>log-guardian</code> user, permissions and services automatically.</p>",
    "install.block_deb": "# Copy .deb to server (scp, wget, USB...)\nsudo dpkg -i log-guardian_*_amd64.deb\nsudo apt-get install -f   # if dependencies missing\n\n# On success:\n#   log-guardian kuruldu.\n#   sudo bash .../install_first_run.sh\n#   bash .../post_install_verify.sh",
    "install.out_deb": "Selecting previously unselected package log-guardian.\n(Reading database ... 100%)\nSetting up log-guardian (72e5a7b) ...\n[deb_post_install] rules.conf olusturuldu: /etc/log-guardian/rules.conf\n\nlog-guardian kuruldu.",
    "install.deb_s3_title": "3. First run & verification",
    "install.deb_s3_body": "<p>Prepares nginx log format, FP trust and API security in one pass. Scripts live under <code>/usr/local/share/log-guardian/scripts/</code>.</p>",
    "install.block_deb_first": "sudo bash /usr/local/share/log-guardian/scripts/install_first_run.sh\nsudo bash /usr/local/share/log-guardian/scripts/ensure_api_security.sh\nbash /usr/local/share/log-guardian/scripts/post_install_verify.sh",
    "install.out_deb_first": "[OK] log-guardian.service active\n[OK] log-guardian-daemon.service active\n[OK] --health IPC\n[OK] API fail-closed (tokensiz 403)\n\n=== ozet ===\n  FAIL: 0   WARN: 0\n[OK] post_install_verify — kurulum kapisi gecti",
    "install.src_title": "B) Source — build and install",
    "install.src_body": "<p>Clone from <a href=\"https://github.com/kurtulusutkucenik/Linux-Log-Guardian\">GitHub</a> and build locally. Best for development and full source review.</p>",
    "install.req_title": "Requisitos",
    "install.req_body": "<ul><li>Ubuntu 22.04 / 24.04 o Debian 12 (amd64)</li><li>nginx con access log escribible</li><li>root/sudo (systemd, ipset, <code>/etc/log-guardian</code>)</li><li>Pro opcional: Docker (dashboard/Grafana), kernel adecuado para eBPF</li></ul>",
    "install.s1_title": "Código fuente o .deb",
    "install.s1_body": "<p>Clonar, compilar y ejecutar el instalador principal. <code>install.sh</code> configura systemd, reglas y formato de log nginx.</p>",
    "install.block1": "git clone https://github.com/kurtulusutkucenik/Linux-Log-Guardian.git\ncd Linux-Log-Guardian\nmake -j$(nproc)\nsudo bash install.sh",
    "install.s2_title": "Primer arranque y seguridad API",
    "install.s2_body": "<p>Inicia servicios y prepara la sincronización del token API para el dashboard.</p>",
    "install.block_api": "sudo bash scripts/install_first_run.sh\nsudo bash scripts/ensure_api_security.sh\nbash scripts/sync_dashboard_api_token.sh",
    "install.common_title": "Shared steps (after A or B)",
    "install.s3_title": "Formato de log nginx",
    "install.s3_body": "<p>El WAF necesita el formato <code>log_guardian</code> para body y XFF. El instalador suele aplicarlo — verificar:</p>",
    "install.block_nginx": "# examples/nginx-log-guardian.conf → site config\nSTRICT=1 bash scripts/check_nginx_log_format.sh\nsudo nginx -t && sudo systemctl reload nginx",
    "install.s4_title": "Verificación",
    "install.s4_body": "<p>Comprobar salud, alarmas y métricas Prometheus. <code>post_install_verify.sh</code> resume en laptop.</p>",
    "install.block_verify": "sudo log-guardian --health\nsudo log-guardian --status\n# Source install:\nbash scripts/post_install_verify.sh\n# .deb install:\nbash /usr/local/share/log-guardian/scripts/post_install_verify.sh\ncurl -s http://127.0.0.1:9091/metrics | head",
    "install.out_health": "[HEALTH] daemon IPC: OK\n[HEALTH] BPF xdp=OFF execve=OFF lineage=OFF\n[HEALTH] RCE det=0 kill=0 lineage=0 connect=0 uptime=…s",
    "install.out_verify": "[OK] log-guardian.service active\n[OK] metrics :9091\n[OK] API fail-closed (tokensiz 403)\n[OK] nginx log_guardian format\n\n=== ozet ===\n  FAIL: 0   WARN: 0\n[OK] post_install_verify — kurulum kapisi gecti",
    "install.out_metrics": "# HELP loganalyzer_log_lines_total ...\nloganalyzer_log_lines_total{tenant_id=\"default\"} 8\nloganalyzer_ban_success_total{tenant_id=\"default\"} 8",
    "install.s5_title": "VirtualBox / sin XDP (laptop y VM)",
    "install.s5_body": "<p>Sin eBPF/XDP usar <code>--no-xdp</code> con bans ipset. Si falla el servicio, script de reparación.</p>",
    "install.block2": "sudo bash install.sh --no-xdp\nsudo bash scripts/install_first_run.sh\n# if service FAIL:\nsudo bash scripts/repair_no_xdp_stack.sh",
    "install.tip": "<strong>Consejo:</strong> JWT: <code>bash scripts/laptop_jwt_setup.sh</code>. Demo rápida: <code>SKIP_WEBHOOK=1 bash scripts/demo_3min.sh</code>",
    "dashboard.title": "Dashboard — tras instalar (Pro opcional)",
    "dashboard.where": "<strong>Importante:</strong> el dashboard <em>no</em> corre en este sitio. <code>localhost:3001</code> está en <strong>tu máquina Linux</strong> donde instalaste — el localhost del visitante no es tu servidor.",
    "dashboard.body": "<p><strong>Dashboard Pro</strong> (Next.js): estado de fleet, historial de bans, tests y PDFs de prueba. Escucha en <code>:3001</code> con TLS. Endurecer con <code>laptop_harden.sh</code> antes de exponer a internet.</p>",
    "dashboard.access_title": "¿Quién accede y cuándo?",
    "dashboard.access_row1_label": "Visitante del sitio",
    "dashboard.access_row1": "Lee esta página, descarga fuente o .deb — <strong>no</strong> abre el puerto 3001.",
    "dashboard.access_row2_label": "Instalador",
    "dashboard.access_row2": "Tras <code>install.sh</code> + <code>dashboard_dev.sh</code> en Ubuntu/Debian: <code>http://localhost:3001</code> <strong>en la misma máquina</strong>.",
    "dashboard.access_row3_label": "VPS remoto",
    "dashboard.access_row3": "Túnel SSH o (si firewall) <code>https://SERVER_IP:3001</code>. No exponer con contraseña demo.",
    "dashboard.req_title": "Requisitos extra del dashboard",
    "dashboard.req_body": "<ul><li><strong>Core</strong> solo necesita nginx + sudo — dashboard <em>no requerido</em></li><li><strong>Dashboard</strong>: Docker + <code>dashboard_dev.sh</code></li><li><strong>Grafana</strong>: además <code>grafana_stack.sh</code> (opcional)</li></ul>",
    "dashboard.start_title": "Iniciar en tu servidor",
    "dashboard.start": "# On the machine where you installed (not this website):\nbash scripts/dashboard_refresh.sh\n# Browser on the same machine:\n#   https://localhost:8443\n# Login: admin / DASHBOARD_ADMIN_PASSWORD in .env",
    "dashboard.features": "<ul><li><strong>Fleet:</strong> agent online/offline, alarmas recientes</li><li><strong>Tests:</strong> phase100, competitive-proof, bench</li><li><strong>Informes:</strong> paquete PDF/JSON</li><li><strong>Grafana:</strong> métricas tenant via <code>bash scripts/grafana_provision.sh</code></li></ul>",
    "dashboard.optional": "<strong>¿Core basta?</strong> Sí. Solo log → WAF → ban kernel sin dashboard. CLI (<code>log-guardian --status</code>) y Prometheus (<code>:9091/metrics</code>) vienen con Core.",
    "dashboard.preview_title": "Vista previa de la UI",
    "dashboard.preview_note": "Capturas abajo: ejemplos. UI en vivo solo en tu instalación.",
    "dashboard.cap1": "Fleet — agentes y alarmas recientes",
    "dashboard.cap2": "Tests — phase100, bench, soak",
    "dashboard.cap3": "Grafana + métricas Prometheus",
    "dashboard.note": "Resumen: este sitio = descargar y aprender. Dashboard = en tu servidor, tras instalar, opcional.",
    "warn.title": "⚠️ Antes de exponer a internet",
    "warn.p1": "Laptop/demo: contraseña <code>DegistirBeni!123</code> abierta intencionalmente.",
    "warn.p2": "VPS público: <code>sudo env LG_NEW_PASSWORD='…' bash scripts/laptop_harden.sh</code>",
    "warn.p3": "Perfiles: <code>docs/SECURITY_PROFILES.md</code>",
    "layers.title": "Capas",
    "layers.core": "Core",
    "layers.core_desc": "log → WAF → ban ipset (~15 min)",
    "layers.pro": "Pro",
    "layers.pro_desc": "daemon eBPF, dashboard, Grafana, fleet",
    "layers.opt": "Opcional",
    "layers.opt_desc": "XDR, marketplace Wasm, LLM Copilot",
    "layers.note": "Pro y capas opcionales son extensiones; Core basta para el uso diario.",
    "github.title": "Source code (GitHub)",
    "github.intro": "<p><strong>Linux Log Guardian</strong> is fully open source (MIT). All C source, install scripts, tests and evidence are on GitHub — you install on your own Linux server; this site is only a landing page.</p>",
    "github.releases": "Releases (.deb)",
    "github.steps_title": "Quick start (from source)",
    "github.steps_body": "<p>Clone, build, install; aim for <code>FAIL: 0</code> in <code>post_install_verify</code>. Step-by-step: <a href=\"#kurulum\">Setup</a> · proofs: <a href=\"/tests\">Tests</a>.</p>",
    "github.contrib": "<p>Issues and pull requests welcome. Do not commit API/Telegram secrets — use <code>ensure_api_security.sh</code> and <code>webhook.local.env.example</code> on install.</p>",
    "download.title": "Descargar (paquete .deb)",
    "download.intro": "<p>Construir paquete: <code>build_deb.sh</code>. Verificación sin instalar: <code>test_deb_local.sh</code>.</p>",
    "download.block": "bash scripts/build_deb.sh\n# → dist/log-guardian_*.deb\nbash scripts/test_deb_local.sh",
    "download.verify": "Validación del paquete (sin instalar): <code>bash scripts/test_deb_local.sh</code>",
    "evidence.title": "Paquete de pruebas",
    "evidence.gate": "Gate laptop: <code>bash scripts/laptop_sprint_gate.sh</code>",
    "evidence.sync": "Actualizar: <code>bash scripts/sync_evidence_pack.sh</code>",
    "tests.title": "Validation tests",
    "tests.page_title": "Validation tests",
    "tests.page_title_line1": "VALIDATION",
    "tests.page_title_line2": "TESTS",
    "tests.hero_eyebrow": "//:Proof",
    "tests.page_intro": "Same matrix as dashboard <code>/tests</code> — install gates, CRS parity, FP, ban latency, corpus recall and <strong>72h soak</strong>. Each card is automated script output.",
    "tests.matrix_title": "Full test matrix",
    "tests.matrix_desc": "From install gates to competitive proof — every row is real script output, identical to the dashboard.",
    "tests.filter_all": "All",
    "tests.filter_gate": "Install gates",
    "tests.filter_proof": "Competitive proof",
    "tests.filter_fail": "Failed",
    "tests.filter_aria": "Test matrix filter",
    "tests.filter_count": "{visible}/{total} visible",
    "tests.search_label": "Search tests",
    "tests.search_placeholder": "Test name, script or id…",
    "tests.proof_pack": "Proof pack JSON",
    "tests.hl_pass_value": "67/72",
    "tests.hl_pass_label": "Automated tests PASS",
    "tests.hl_soak_value": "72h",
    "tests.hl_soak_label": "Soak · 864 samples · 0 failures",
    "tests.hl_ban_value": "17ms",
    "tests.hl_ban_label": "Median kernel ban",
    "tests.hl_crs_value": "100%",
    "tests.hl_crs_label": "OWASP CRS parity",
    "tests.hl_fp_value": "0.2%",
    "tests.hl_fp_label": "Benign FP rate",
    "tests.hl_eps_value": "5357",
    "tests.hl_eps_label": "EPS · single-pass log-WAF",
    "tests.teaser": "Same automated test matrix as the dashboard — <strong>72 proofs</strong> (install gates, CRS, FP, ban latency, corpus, 72h soak).",
    "tests.open_full": "View all tests (72)",
    "tests.proof_pdf": "Evidence PDF",
    "tests.intro": "Same automated test matrix as the dashboard — install gates (FAIL=0), CRS parity, FP, ban latency, corpus recall and <strong>72h VPS/VM soak</strong>. Live installs refresh the same data at dashboard <code>/tests</code>.",
    "tests.note": "Raw JSON: <a href=\"/evidence/competitive-proof.json\" rel=\"noopener noreferrer\" download>competitive-proof.json</a> · PDF: <a href=\"/evidence/competitive-proof.pdf\" rel=\"noopener noreferrer\">competitive-proof.pdf</a> · Refresh: <code>bash scripts/competitive_proof.sh</code>",
    "laptop.title": "Matriz de validación laptop",
    "laptop.intro": "<p>Gate dev rápido: sprint gate, soak 1h y demo 3 min. Soak 72h VM: <code>laptop_soak_72h.sh --start</code>.</p>",
    "laptop.block": "SKIP_PHASE100=1 bash scripts/laptop_sprint_gate.sh\nSOAK_1H=1 bash scripts/laptop_soak_72h.sh --start\nSKIP_WEBHOOK=1 bash scripts/demo_3min.sh",
    "contact.title": "Contacto y contribuciones",
    "contact.body": "<p>Preguntas, colaboración o contribuciones — escríbenos. Bugs y pull requests bienvenidos.</p>",
    "contact.email_label": "Correo:",
    "footer": "Linux Log Guardian · Hecho en Turquía · MIT · open source · <a href=\"mailto:kurtulusutkucenikcontact@gmail.com\">kurtulusutkucenikcontact@gmail.com</a>"
  },
  "pt": {
    "meta.description": "Linux Log Guardian — WAF nginx open source feito na Turquia. log → ban em ~15 min.",
    "hero.title": "Linux Log Guardian",
    "hero.tag": "nginx access log → WAF/CRS → ban no kernel · cadeia única · self-hosted",
    "hero.badge_tr": "TURK",
    "hero.badge_opensource": "código aberto",
    "hero.badge_mit": "Open source · MIT",
    "hero.badge_core": "Core ~15 min de instalação",
    "hero.badge_soak": "72h soak PASS",
    "hero.cta_install": "Instalação 15 min",
    "hero.cta_dashboard": "Painel (após instalar)",
    "hero.cta_tests": "Test results",
    "hero.cta_evidence": "Pacote de evidências",
    "hero.cta_contact": "Contato",
    "hero.cta_github": "Source on GitHub",
    "hero.proof_traction": "2.3k+ visits · 4k+ page views · 54 countries · proof PDF",
    "hero.scroll_hint": "Scroll — explore",
    "hero.enter_hint": "Click or scroll — continue",
    "enter.skip": "Skip",
    "enter.continue": "Enter",
    "section.work_eyebrow": "//:Selected",
    "section.work_title": "Selected proofs",
    "section.work_sub": "Core · Pro · Proof · Grafana — measurable outcomes in one chain.",
    "section.work_hint": "Scroll — more evidence cards",
    "compare.eyebrow": "//:Vs",
    "compare.title": "Competitor compare",
    "compare.sub": "Measured proof — Fail2ban / CrowdSec / ModSecurity architectural notes",
    "compare.col_metric": "Metric",
    "compare.col_lg": "Log Guardian",
    "compare.col_f2b": "Fail2ban",
    "compare.col_cs": "CrowdSec",
    "compare.col_mod": "ModSec + CRS",
    "compare.row_pipeline": "Log → WAF → kernel ban",
    "compare.row_recall": "Real attack recall",
    "compare.row_fp": "False positive",
    "compare.row_ban": "Ban latency",
    "compare.row_proof": "Proof pack PDF+JSON",
    "compare.row_mit": "MIT + TR docs",
    "compare.val_lg_pipeline": "Single pipeline",
    "compare.val_f2b_pipeline": "Ban only",
    "compare.val_cs_pipeline": "Fragmented",
    "compare.val_mod_pipeline": "WAF separate",
    "compare.val_lg_recall": "100% (1K+10K)",
    "compare.val_na": "—",
    "compare.val_mod_recall": "CRS parity 100%",
    "compare.val_lg_fp": "0.2%",
    "compare.val_f2b_fp": "High",
    "compare.val_cs_fp": "Medium",
    "compare.val_mod_fp": "CRS dependent",
    "compare.val_lg_ban": "~17 ms",
    "compare.val_f2b_ban": "sec–min",
    "compare.val_cs_ban": "sec",
    "compare.val_mod_ban": "Separate integration",
    "compare.val_yes": "Automatic",
    "compare.val_no": "None",
    "compare.val_cs_proof": "Partial",
    "compare.val_mod_proof": "Per module",
    "compare.val_partial": "Partial",
    "compare.val_mod_mit": "CRS open",
    "compare.sec_strength": "Strengths (measured)",
    "compare.sec_honest": "Honest limits",
    "compare.row_ja3": "Distributed / JA3 cluster",
    "compare.row_consult": "nginx inline consult",
    "compare.row_l7": "L7 application protection",
    "compare.row_stability": "Short stability (5 min)",
    "compare.row_inline_eps": "Inline regex EPS",
    "compare.row_reactive": "First request may pass",
    "compare.row_ddos": "Volumetric L3/L4 scrub",
    "compare.row_community": "Community signal network",
    "compare.row_cloud": "Edge / Cloud WAF",
    "compare.val_lg_ja3": "100% (80 IPs)",
    "compare.val_cs_ja3": "Signal-based",
    "compare.val_lg_consult": "PASS",
    "compare.val_lg_l7": "WAF + consult + eBPF",
    "compare.val_mod_l7": "CRS inline",
    "compare.val_mod_consult": "Separate module",
    "compare.val_lg_stability": "PASS (0 fail)",
    "compare.val_lg_eps": "~130 EPS (log replay)",
    "compare.val_mod_eps": "~12K EPS inline",
    "compare.val_lg_reactive": "Reactive (log line)",
    "compare.val_f2b_reactive": "Reactive",
    "compare.val_cs_reactive": "Partial",
    "compare.val_mod_reactive": "Inline block",
    "compare.val_lg_ddos": "None — CDN recommended",
    "compare.val_lg_community": "Self-hosted",
    "compare.val_cs_community": "Yes",
    "compare.val_lg_cloud": "Origin layer",
    "compare.val_mod_cloud": "Proxy mode",
    "compare.note": "Honest limit: not an inline ModSec EPS race — strength is integration + ban speed + transparent proof. See docs/VS_RAKIPLER.md",
    "compare.scroll_hint": "Scroll → explore the table",
    "compare.progress_label": "Proof discovery {pct}%",
    "bridge.eyebrow": "//:Pipeline",
    "bridge.kicker": "Single chain · self-hosted · MIT",
    "bridge.title": "Log → WAF → Kernel Ban",
    "bridge.sub": "nginx access log line to ipset ban in ~17 ms — competitors use fragmented stacks.",
    "bridge.s1": "log",
    "bridge.s2": "CRS",
    "bridge.s3": "ban",
    "bridge.s4": "proof",
    "why.eyebrow": "//:Why",
    "why.title": "Why Log Guardian?",
    "why.lead": "Competitors are piecemeal — we ship measurable proof in one chain.",
    "why.c1_title": "One pipeline",
    "why.c1_body": "nginx log → OWASP CRS → ~17 ms kernel ban. No Fail2ban + ModSec + script pile.",
    "why.c2_title": "Transparent proof",
    "why.c2_body": "competitive-proof PDF, 67 tests, 72h soak — missing or partial elsewhere.",
    "why.c3_title": "MIT · Turkey",
    "why.c3_body": "Open source, Turkish docs, self-hosted — no vendor lock-in.",
    "why.c4_title": "Honest limits",
    "why.c4_body": "Not ModSec inline EPS; no Cloudflare absorb. Origin integration + speed.",
    "evidence.preview_pdf": "Competitor compare PDF — measured bench summary",
    "evidence.preview_json": "competitive-proof JSON — machine-readable metrics",
    "evidence.preview_bench": "ModSecurity CRS parity + EPS comparison",
    "evidence.preview_fp": "200 benign requests — false positive rate",
    "evidence.preview_ban": "Kernel ban latency — ~17 ms ipset",
    "evidence.preview_soak": "72h soak report — 864 samples, 0 fail",
    "evidence.preview_soak_md": "Soak summary — operator notes",
    "evidence.preview_sprint": "Sprint prod gate — FAIL:0 proof",
    "evidence.preview_siem": "SIEM export — Splunk/Elastic compatibility",
    "evidence.preview_taxii": "TAXII feed integration test",
    "evidence.preview_vm": "VirtualBox VM sprint proof",
    "evidence.preview_geoip": "GeoIP MMDB — attack map data",
    "evidence.preview_webhook": "Webhook route proof — alert pipeline",
    "evidence.preview_telegram": "Telegram live webhook test",
    "pager.sec_bridge": "Pipeline bridge",
    "pager.sec_why": "Why LG",
    "hero.eyebrow": "//:LOG→BAN",
    "marquee.line": "nginx log → WAF → kernel ban · 67 tests · 72h soak PASS · MIT self-hosted · Turkey · open source",
    "showcase.core.eyebrow": "//:Core",
    "showcase.core.title": "What=\"we do\"",
    "showcase.core.desc": "Single chain: nginx access log → OWASP CRS → ~17 ms kernel ban. Production-ready in ~15 minutes.",
    "showcase.pro.eyebrow": "//:Pro",
    "showcase.pro.title": "Pro=\"SOC\"",
    "showcase.pro.desc": "Fleet, SOC timeline, Grafana — optional layer on your server after install.",
    "showcase.proof.eyebrow": "//:Proof",
    "showcase.core.peek": "Single chain · ~17 ms ban",
    "showcase.pro.peek": "Fleet · SOC timeline",
    "showcase.proof.peek": "67 tests ·                                                                        72h soak PASS",
    "showcase.proof.title": "Proof=\"67 tests\"",
    "showcase.proof.desc": "68 automated tests, competitive PDF, 72h soak — same matrix as dashboard /tests.",
    "showcase.cta": "Discover",
    "showcase.core.short": "CORE",
    "showcase.core.tag1": "~17 ms ban",
    "showcase.core.tag2": "OWASP CRS",
    "showcase.pro.short": "SOC",
    "showcase.pro.tag1": "Fleet",
    "showcase.pro.tag2": "Timeline",
    "showcase.proof.short": "PROOF",
    "showcase.proof.tag1": "67 tests",
    "showcase.proof.tag2": "72h soak",
    "showcase.grafana.short": "METRICS",
    "showcase.grafana.eyebrow": "//:Metrics",
    "showcase.grafana.title": "Grafana=\"SOC\"",
    "showcase.grafana.desc": "Tenant-labeled Prometheus metrics, Grafana dashboards and alert rules — self-hosted observability.",
    "showcase.grafana.peek": "Prometheus · tenant alerts",
    "showcase.grafana.tag1": "Prometheus",
    "showcase.grafana.tag2": "Alerts",
    "stats.tests_label": "Automated tests",
    "stats.eyebrow": "//:Stats",
    "stats.title": "By the numbers",
    "stats.lead": "Measured proof — automated tests, soak, ban latency, reach.",
    "stats.soak": "72h",
    "stats.soak_label": "Soak PASS",
    "stats.ban_suffix": "ms",
    "stats.ban_label": "Kernel ban",
    "stats.countries_label": "Countries reached",
    "section.about_eyebrow": "//:About",
    "section.flow_eyebrow": "//:Pipeline",
    "section.scope_eyebrow": "//:Honest",
    "section.github_eyebrow": "//:Source",
    "section.install_eyebrow": "//:Setup",
    "section.dashboard_eyebrow": "//:Pro",
    "section.layers_eyebrow": "//:Layers",
    "section.evidence_eyebrow": "//:Evidence",
    "section.tests_eyebrow": "//:Proof",
    "section.laptop_eyebrow": "//:Verify",
    "section.contact_eyebrow": "//:Contact",
    "cta.banner.title": "Ready to deploy?",
    "cta.banner.body": "Clone, install, verify FAIL:0 — Core runs without the dashboard.",
    "cta.banner.btn": "15 min setup",
    "nav.home": "Home",
    "nav.install": "Setup",
    "nav.tests": "Tests",
    "nav.compare": "Compare",
    "nav.evidence": "Evidence",
    "nav.contact": "Contact",
    "nav.prev_section": "Previous section",
    "nav.next_section": "Next section",
    "nav.index": "Index",
    "index.title": "Chapters",
    "index.close": "Close",
    "case.close": "Close",
    "case.open_hint": "Click front card — case study",
    "case.prev": "Previous case",
    "case.next": "Next case",
    "case.core.lead": "Single chain: nginx access log → OWASP CRS → ~17 ms kernel ban. Production-ready on your server in ~15 minutes — no Fail2ban + ModSec script stack.",
    "case.core.cta": "Setup guide",
    "case.pro.lead": "Optional Pro layer after Core: fleet sync, SOC timeline, Grafana dashboards — all self-hosted on your infrastructure.",
    "case.pro.cta": "Dashboard & SOC",
    "case.proof.lead": "68 automated tests, competitive-proof PDF, 72h soak — the same matrix as /tests. FAIL:0 gate before every release.",
    "case.proof.cta": "Open tests",
    "case.grafana.lead": "Prometheus metrics with tenant labels, Grafana dashboards and alert rules — observability without vendor lock-in.",
    "case.grafana.cta": "Metrics layer",
    "hero.metric_ban_val": "~17 ms",
    "hero.metric_ban": "kernel ban",
    "hero.metric_tests": "automated tests",
    "hero.metric_soak_val": "72h",
    "hero.metric_soak": "soak PASS",
    "pager.hint": "Section nav — jump with arrows",
    "pager.sec_home": "Home",
    "pager.sec_work": "Selected proofs",
    "pager.sec_compare": "Compare",
    "pager.sec_stats": "Stats",
    "pager.sec_about": "About",
    "pager.sec_install": "Install",
    "pager.sec_dashboard": "Dashboard",
    "pager.sec_tests": "Tests",
    "pager.sec_evidence": "Evidence",
    "pager.sec_contact": "Contact",
    "pager.next_to": "Next → {section}",
    "theme.label_light": "Light mode",
    "theme.label_dark": "Dark mode",
    "about.title": "Sobre — Linux Log Guardian",
    "site.purpose": "<strong>Site público de apresentação e download.</strong> Conteúdo estático: visão geral, guia de instalação, evidências e contato. Log Guardian não roda aqui — você instala no seu servidor Linux.",
    "about.body": "<p><strong>Linux Log Guardian</strong> é uma stack de segurança <strong>open source (MIT)</strong> self-hosted, desenvolvida na Turquia. Uma cadeia: <em>ler logs nginx → regras OWASP CRS → ban no kernel</em>.</p><p>Projeto comunitário independente — revisão de código, personalização e hosting on-prem sem lock-in de cloud.</p><ul><li>Código transparente; contribuições bem-vindas</li><li>Binário: <code>log-guardian</code> · pacote: <code>log-guardian_*.deb</code></li><li><strong>Core</strong> sozinho pronto para produção (~15 min)</li><li>Dashboard, Grafana, fleet = camada <strong>Pro</strong> opcional</li></ul>",
    "flow.title": "Cadeia única: do log ao ban no kernel",
    "flow.s1": "nginx access log",
    "flow.s2": "Parser + CRS/WAF",
    "flow.s3": "Pipeline de ban",
    "flow.s4": "ipset / kernel",
    "flow.s5": "Métricas + dashboard",
    "flow.note": "XDR, marketplace Wasm e LLM Copilot são camadas opcionais de longo prazo — Core sozinho basta em produção.",
    "scope.honest.title": "Honest limits (not competing on edge speed)",
    "scope.honest.body": "<ul><li><strong>Reactive architecture</strong> — first request may pass until the log line is parsed; we are not inline ModSec throughput.</li><li><strong>L7 application layer</strong> — CRS/WAF, nginx consult, and eBPF HTTP probe; this is not volumetric L3/L4 scrub.</li><li><strong>No volumetric L3/L4 DDoS absorb</strong> — use CDN/Cloudflare on top.</li><li><strong>Distributed botnets</strong> — per-IP ban; no CrowdSec signal network.</li><li><strong>We do:</strong> log → CRS/WAF → ~17&nbsp;ms kernel ban, proof PDF, Telegram ops, MIT self-hosted.</li></ul>",
    "install.title": "Guia de instalação (detalhado)",
    "install.intro": "<p>Instalação <strong>de produção</strong> passo a passo em Ubuntu/Debian. Funciona sem XDP em laptop ou VM VirtualBox. Docs: <code>docs/QUICKSTART_NGINX.md</code> e <code>docs/LAPTOP_OPS.md</code>.</p>",
    "install.terminal_label": "15-minute install — live terminal",
    "install.terminal_demo": "$ sudo dpkg -i log-guardian_*_amd64.deb\nSelecting previously unselected package log-guardian.\nlog-guardian installed.\n$ sudo bash /usr/local/share/log-guardian/scripts/install_first_run.sh\n[OK] log-guardian.service active\n[OK] --health IPC\n[OK] API fail-closed (unauthenticated 403)\n\n=== summary ===\n  FAIL: 0   WARN: 0\n[OK] post_install_verify — install gate passed",
    "install.expect_label": "Expected output (sample):",
    "install.deb_title": "A) Fresh server — .deb package (recommended)",
    "install.deb_body": "<p>No compile step. Ships binaries, systemd, rules and scripts. <strong>Upgrade-safe:</strong> existing <code>/etc/log-guardian/rules.conf</code> is preserved.</p><p><strong>Download:</strong> <a href=\"https://github.com/kurtulusutkucenik/Linux-Log-Guardian/releases\">GitHub Releases</a> (<code>log-guardian_*_amd64.deb</code>) or build from repo: <code>bash scripts/build_deb.sh</code> → <code>dist/</code>.</p>",
    "install.deb_s1_title": "1. Dependencies",
    "install.deb_s1_body": "<p>Install Debian package dependencies on first setup. nginx can be added in the same command if missing.</p>",
    "install.block_deb_deps": "sudo apt-get update\nsudo apt-get install -y ipset libbpf1 libcurl4 libpcre2-8-0 libsqlite3-0 \\\n  libssl3 libelf1 libz1 liburing2 nginx",
    "install.out_deb_deps": "Reading package lists... Done\nSetting up ipset (7.x) ...\nSetting up libbpf1:amd64 ...\nSetting up nginx (1.x) ...",
    "install.deb_s2_title": "2. Install package",
    "install.deb_s2_body": "<p>If <code>dpkg -i</code> reports missing dependencies, run <code>apt-get install -f</code>. postinst creates the <code>log-guardian</code> user, permissions and services automatically.</p>",
    "install.block_deb": "# Copy .deb to server (scp, wget, USB...)\nsudo dpkg -i log-guardian_*_amd64.deb\nsudo apt-get install -f   # if dependencies missing\n\n# On success:\n#   log-guardian kuruldu.\n#   sudo bash .../install_first_run.sh\n#   bash .../post_install_verify.sh",
    "install.out_deb": "Selecting previously unselected package log-guardian.\n(Reading database ... 100%)\nSetting up log-guardian (72e5a7b) ...\n[deb_post_install] rules.conf olusturuldu: /etc/log-guardian/rules.conf\n\nlog-guardian kuruldu.",
    "install.deb_s3_title": "3. First run & verification",
    "install.deb_s3_body": "<p>Prepares nginx log format, FP trust and API security in one pass. Scripts live under <code>/usr/local/share/log-guardian/scripts/</code>.</p>",
    "install.block_deb_first": "sudo bash /usr/local/share/log-guardian/scripts/install_first_run.sh\nsudo bash /usr/local/share/log-guardian/scripts/ensure_api_security.sh\nbash /usr/local/share/log-guardian/scripts/post_install_verify.sh",
    "install.out_deb_first": "[OK] log-guardian.service active\n[OK] log-guardian-daemon.service active\n[OK] --health IPC\n[OK] API fail-closed (tokensiz 403)\n\n=== ozet ===\n  FAIL: 0   WARN: 0\n[OK] post_install_verify — kurulum kapisi gecti",
    "install.src_title": "B) Source — build and install",
    "install.src_body": "<p>Clone from <a href=\"https://github.com/kurtulusutkucenik/Linux-Log-Guardian\">GitHub</a> and build locally. Best for development and full source review.</p>",
    "install.req_title": "Requisitos",
    "install.req_body": "<ul><li>Ubuntu 22.04 / 24.04 ou Debian 12 (amd64)</li><li>nginx com access log gravável</li><li>root/sudo (systemd, ipset, <code>/etc/log-guardian</code>)</li><li>Pro opcional: Docker (dashboard/Grafana), kernel adequado para eBPF</li></ul>",
    "install.s1_title": "Código-fonte ou .deb",
    "install.s1_body": "<p>Clonar, compilar e executar o instalador principal. <code>install.sh</code> configura systemd, regras e formato de log nginx.</p>",
    "install.block1": "git clone https://github.com/kurtulusutkucenik/Linux-Log-Guardian.git\ncd Linux-Log-Guardian\nmake -j$(nproc)\nsudo bash install.sh",
    "install.s2_title": "Primeira execução e segurança API",
    "install.s2_body": "<p>Inicia serviços e prepara sync do token API para o dashboard.</p>",
    "install.block_api": "sudo bash scripts/install_first_run.sh\nsudo bash scripts/ensure_api_security.sh\nbash scripts/sync_dashboard_api_token.sh",
    "install.common_title": "Shared steps (after A or B)",
    "install.s3_title": "Formato de log nginx",
    "install.s3_body": "<p>O WAF precisa do formato <code>log_guardian</code> para body e XFF. O instalador geralmente aplica — verificar:</p>",
    "install.block_nginx": "# examples/nginx-log-guardian.conf → site config\nSTRICT=1 bash scripts/check_nginx_log_format.sh\nsudo nginx -t && sudo systemctl reload nginx",
    "install.s4_title": "Verificação",
    "install.s4_body": "<p>Verificar saúde, alarmes e métricas Prometheus. <code>post_install_verify.sh</code> resume no laptop.</p>",
    "install.block_verify": "sudo log-guardian --health\nsudo log-guardian --status\n# Source install:\nbash scripts/post_install_verify.sh\n# .deb install:\nbash /usr/local/share/log-guardian/scripts/post_install_verify.sh\ncurl -s http://127.0.0.1:9091/metrics | head",
    "install.out_health": "[HEALTH] daemon IPC: OK\n[HEALTH] BPF xdp=OFF execve=OFF lineage=OFF\n[HEALTH] RCE det=0 kill=0 lineage=0 connect=0 uptime=…s",
    "install.out_verify": "[OK] log-guardian.service active\n[OK] metrics :9091\n[OK] API fail-closed (tokensiz 403)\n[OK] nginx log_guardian format\n\n=== ozet ===\n  FAIL: 0   WARN: 0\n[OK] post_install_verify — kurulum kapisi gecti",
    "install.out_metrics": "# HELP loganalyzer_log_lines_total ...\nloganalyzer_log_lines_total{tenant_id=\"default\"} 8\nloganalyzer_ban_success_total{tenant_id=\"default\"} 8",
    "install.s5_title": "VirtualBox / sem XDP (laptop e VM)",
    "install.s5_body": "<p>Sem eBPF/XDP use <code>--no-xdp</code> com bans ipset. Se o serviço falhar, script de reparo.</p>",
    "install.block2": "sudo bash install.sh --no-xdp\nsudo bash scripts/install_first_run.sh\n# if service FAIL:\nsudo bash scripts/repair_no_xdp_stack.sh",
    "install.tip": "<strong>Dica:</strong> JWT: <code>bash scripts/laptop_jwt_setup.sh</code>. Demo rápida: <code>SKIP_WEBHOOK=1 bash scripts/demo_3min.sh</code>",
    "dashboard.title": "Dashboard — após instalar (Pro opcional)",
    "dashboard.where": "<strong>Importante:</strong> o dashboard <em>não</em> roda neste site. <code>localhost:3001</code> está na <strong>sua máquina Linux</strong> onde instalou — o localhost do visitante não é seu servidor.",
    "dashboard.body": "<p><strong>Dashboard Pro</strong> (Next.js): fleet, histórico de bans, testes e PDFs. Escuta em <code>:3001</code> com TLS. Endurecer com <code>laptop_harden.sh</code> antes de expor à internet.</p>",
    "dashboard.access_title": "Quem acessa e quando?",
    "dashboard.access_row1_label": "Visitante do site",
    "dashboard.access_row1": "Lê esta página, baixa fonte ou .deb — <strong>não</strong> abre a porta 3001.",
    "dashboard.access_row2_label": "Instalador",
    "dashboard.access_row2": "Após <code>install.sh</code> + <code>dashboard_dev.sh</code> no Ubuntu/Debian: <code>http://localhost:3001</code> <strong>na mesma máquina</strong>.",
    "dashboard.access_row3_label": "VPS remoto",
    "dashboard.access_row3": "Túnel SSH ou (se firewall) <code>https://SERVER_IP:3001</code>. Não exponha com senha demo.",
    "dashboard.req_title": "Requisitos extras do dashboard",
    "dashboard.req_body": "<ul><li><strong>Core</strong> só precisa nginx + sudo — dashboard <em>não obrigatório</em></li><li><strong>Dashboard</strong>: Docker + <code>dashboard_dev.sh</code></li><li><strong>Grafana</strong>: também <code>grafana_stack.sh</code> (opcional)</li></ul>",
    "dashboard.start_title": "Iniciar no seu servidor",
    "dashboard.start": "# On the machine where you installed (not this website):\nbash scripts/dashboard_refresh.sh\n# Browser on the same machine:\n#   https://localhost:8443\n# Login: admin / DASHBOARD_ADMIN_PASSWORD in .env",
    "dashboard.features": "<ul><li><strong>Fleet:</strong> agent online/offline, alarmes recentes</li><li><strong>Testes:</strong> phase100, competitive-proof, bench</li><li><strong>Relatórios:</strong> pacote PDF/JSON</li><li><strong>Grafana:</strong> métricas tenant via <code>bash scripts/grafana_provision.sh</code></li></ul>",
    "dashboard.optional": "<strong>Core basta?</strong> Sim. Só log → WAF → ban kernel sem dashboard. CLI (<code>log-guardian --status</code>) e Prometheus (<code>:9091/metrics</code>) vêm com Core.",
    "dashboard.preview_title": "Prévia da interface",
    "dashboard.preview_note": "Capturas abaixo são exemplos. UI ao vivo só na sua instalação.",
    "dashboard.cap1": "Fleet — agents e alarmes recentes",
    "dashboard.cap2": "Testes — phase100, bench, soak",
    "dashboard.cap3": "Grafana + métricas Prometheus",
    "dashboard.note": "Resumo: este site = baixar e aprender. Dashboard = no seu servidor, após instalar, opcional.",
    "warn.title": "⚠️ Antes de expor à internet",
    "warn.p1": "Laptop/demo: senha <code>DegistirBeni!123</code> aberta de propósito.",
    "warn.p2": "VPS público: <code>sudo env LG_NEW_PASSWORD='…' bash scripts/laptop_harden.sh</code>",
    "warn.p3": "Perfis: <code>docs/SECURITY_PROFILES.md</code>",
    "layers.title": "Camadas",
    "layers.core": "Core",
    "layers.core_desc": "log → WAF → ban ipset (~15 min)",
    "layers.pro": "Pro",
    "layers.pro_desc": "daemon eBPF, dashboard, Grafana, fleet",
    "layers.opt": "Opcional",
    "layers.opt_desc": "XDR, marketplace Wasm, LLM Copilot",
    "layers.note": "Pro e camadas opcionais são extensões; Core basta no dia a dia.",
    "github.title": "Source code (GitHub)",
    "github.intro": "<p><strong>Linux Log Guardian</strong> is fully open source (MIT). All C source, install scripts, tests and evidence are on GitHub — you install on your own Linux server; this site is only a landing page.</p>",
    "github.releases": "Releases (.deb)",
    "github.steps_title": "Quick start (from source)",
    "github.steps_body": "<p>Clone, build, install; aim for <code>FAIL: 0</code> in <code>post_install_verify</code>. Step-by-step: <a href=\"#kurulum\">Setup</a> · proofs: <a href=\"/tests\">Tests</a>.</p>",
    "github.contrib": "<p>Issues and pull requests welcome. Do not commit API/Telegram secrets — use <code>ensure_api_security.sh</code> and <code>webhook.local.env.example</code> on install.</p>",
    "download.title": "Download (pacote .deb)",
    "download.intro": "<p>Construir pacote: <code>build_deb.sh</code>. Verificação sem instalar: <code>test_deb_local.sh</code>.</p>",
    "download.block": "bash scripts/build_deb.sh\n# → dist/log-guardian_*.deb\nbash scripts/test_deb_local.sh",
    "download.verify": "Validação do pacote (sem instalar): <code>bash scripts/test_deb_local.sh</code>",
    "evidence.title": "Pacote de evidências",
    "evidence.gate": "Gate laptop: <code>bash scripts/laptop_sprint_gate.sh</code>",
    "evidence.sync": "Atualizar: <code>bash scripts/sync_evidence_pack.sh</code>",
    "tests.title": "Validation tests",
    "tests.page_title": "Validation tests",
    "tests.page_title_line1": "VALIDATION",
    "tests.page_title_line2": "TESTS",
    "tests.hero_eyebrow": "//:Proof",
    "tests.page_intro": "Same matrix as dashboard <code>/tests</code> — install gates, CRS parity, FP, ban latency, corpus recall and <strong>72h soak</strong>. Each card is automated script output.",
    "tests.matrix_title": "Full test matrix",
    "tests.matrix_desc": "From install gates to competitive proof — every row is real script output, identical to the dashboard.",
    "tests.filter_all": "All",
    "tests.filter_gate": "Install gates",
    "tests.filter_proof": "Competitive proof",
    "tests.filter_fail": "Failed",
    "tests.filter_aria": "Test matrix filter",
    "tests.filter_count": "{visible}/{total} visible",
    "tests.search_label": "Search tests",
    "tests.search_placeholder": "Test name, script or id…",
    "tests.proof_pack": "Proof pack JSON",
    "tests.hl_pass_value": "67/72",
    "tests.hl_pass_label": "Automated tests PASS",
    "tests.hl_soak_value": "72h",
    "tests.hl_soak_label": "Soak · 864 samples · 0 failures",
    "tests.hl_ban_value": "17ms",
    "tests.hl_ban_label": "Median kernel ban",
    "tests.hl_crs_value": "100%",
    "tests.hl_crs_label": "OWASP CRS parity",
    "tests.hl_fp_value": "0.2%",
    "tests.hl_fp_label": "Benign FP rate",
    "tests.hl_eps_value": "5357",
    "tests.hl_eps_label": "EPS · single-pass log-WAF",
    "tests.teaser": "Same automated test matrix as the dashboard — <strong>72 proofs</strong> (install gates, CRS, FP, ban latency, corpus, 72h soak).",
    "tests.open_full": "View all tests (72)",
    "tests.proof_pdf": "Evidence PDF",
    "tests.intro": "Same automated test matrix as the dashboard — install gates (FAIL=0), CRS parity, FP, ban latency, corpus recall and <strong>72h VPS/VM soak</strong>. Live installs refresh the same data at dashboard <code>/tests</code>.",
    "tests.note": "Raw JSON: <a href=\"/evidence/competitive-proof.json\" rel=\"noopener noreferrer\" download>competitive-proof.json</a> · PDF: <a href=\"/evidence/competitive-proof.pdf\" rel=\"noopener noreferrer\">competitive-proof.pdf</a> · Refresh: <code>bash scripts/competitive_proof.sh</code>",
    "laptop.title": "Matriz de validação laptop",
    "laptop.intro": "<p>Gate dev rápido: sprint gate, soak 1h e demo 3 min. Soak 72h VM: <code>laptop_soak_72h.sh --start</code>.</p>",
    "laptop.block": "SKIP_PHASE100=1 bash scripts/laptop_sprint_gate.sh\nSOAK_1H=1 bash scripts/laptop_soak_72h.sh --start\nSKIP_WEBHOOK=1 bash scripts/demo_3min.sh",
    "contact.title": "Contato e contribuições",
    "contact.body": "<p>Dúvidas, colaboração ou contribuições — entre em contato. Bugs e pull requests bem-vindos.</p>",
    "contact.email_label": "E-mail:",
    "footer": "Linux Log Guardian · Feito na Turquia · MIT · open source · <a href=\"mailto:kurtulusutkucenikcontact@gmail.com\">kurtulusutkucenikcontact@gmail.com</a>"
  },
  "ru": {
    "meta.description": "Linux Log Guardian — open source WAF для nginx из Турции. log → ban за ~15 мин.",
    "hero.title": "Linux Log Guardian",
    "hero.tag": "nginx access log → WAF/CRS → ban в ядре · одна цепочка · self-hosted",
    "hero.badge_tr": "TURK",
    "hero.badge_opensource": "открытый код",
    "hero.badge_mit": "Open source · MIT",
    "hero.badge_core": "Core ~15 мин установки",
    "hero.badge_soak": "72h soak PASS",
    "hero.cta_install": "Установка 15 мин",
    "hero.cta_dashboard": "Панель (после установки)",
    "hero.cta_tests": "Test results",
    "hero.cta_evidence": "Пакет доказательств",
    "hero.cta_contact": "Контакт",
    "hero.cta_github": "Source on GitHub",
    "hero.proof_traction": "2.3k+ visits · 4k+ page views · 54 countries · proof PDF",
    "hero.scroll_hint": "Scroll — explore",
    "hero.enter_hint": "Click or scroll — continue",
    "enter.skip": "Skip",
    "enter.continue": "Enter",
    "section.work_eyebrow": "//:Selected",
    "section.work_title": "Selected proofs",
    "section.work_sub": "Core · Pro · Proof · Grafana — measurable outcomes in one chain.",
    "section.work_hint": "Scroll — more evidence cards",
    "compare.eyebrow": "//:Vs",
    "compare.title": "Competitor compare",
    "compare.sub": "Measured proof — Fail2ban / CrowdSec / ModSecurity architectural notes",
    "compare.col_metric": "Metric",
    "compare.col_lg": "Log Guardian",
    "compare.col_f2b": "Fail2ban",
    "compare.col_cs": "CrowdSec",
    "compare.col_mod": "ModSec + CRS",
    "compare.row_pipeline": "Log → WAF → kernel ban",
    "compare.row_recall": "Real attack recall",
    "compare.row_fp": "False positive",
    "compare.row_ban": "Ban latency",
    "compare.row_proof": "Proof pack PDF+JSON",
    "compare.row_mit": "MIT + TR docs",
    "compare.val_lg_pipeline": "Single pipeline",
    "compare.val_f2b_pipeline": "Ban only",
    "compare.val_cs_pipeline": "Fragmented",
    "compare.val_mod_pipeline": "WAF separate",
    "compare.val_lg_recall": "100% (1K+10K)",
    "compare.val_na": "—",
    "compare.val_mod_recall": "CRS parity 100%",
    "compare.val_lg_fp": "0.2%",
    "compare.val_f2b_fp": "High",
    "compare.val_cs_fp": "Medium",
    "compare.val_mod_fp": "CRS dependent",
    "compare.val_lg_ban": "~17 ms",
    "compare.val_f2b_ban": "sec–min",
    "compare.val_cs_ban": "sec",
    "compare.val_mod_ban": "Separate integration",
    "compare.val_yes": "Automatic",
    "compare.val_no": "None",
    "compare.val_cs_proof": "Partial",
    "compare.val_mod_proof": "Per module",
    "compare.val_partial": "Partial",
    "compare.val_mod_mit": "CRS open",
    "compare.sec_strength": "Strengths (measured)",
    "compare.sec_honest": "Honest limits",
    "compare.row_ja3": "Distributed / JA3 cluster",
    "compare.row_consult": "nginx inline consult",
    "compare.row_l7": "L7 application protection",
    "compare.row_stability": "Short stability (5 min)",
    "compare.row_inline_eps": "Inline regex EPS",
    "compare.row_reactive": "First request may pass",
    "compare.row_ddos": "Volumetric L3/L4 scrub",
    "compare.row_community": "Community signal network",
    "compare.row_cloud": "Edge / Cloud WAF",
    "compare.val_lg_ja3": "100% (80 IPs)",
    "compare.val_cs_ja3": "Signal-based",
    "compare.val_lg_consult": "PASS",
    "compare.val_lg_l7": "WAF + consult + eBPF",
    "compare.val_mod_l7": "CRS inline",
    "compare.val_mod_consult": "Separate module",
    "compare.val_lg_stability": "PASS (0 fail)",
    "compare.val_lg_eps": "~130 EPS (log replay)",
    "compare.val_mod_eps": "~12K EPS inline",
    "compare.val_lg_reactive": "Reactive (log line)",
    "compare.val_f2b_reactive": "Reactive",
    "compare.val_cs_reactive": "Partial",
    "compare.val_mod_reactive": "Inline block",
    "compare.val_lg_ddos": "None — CDN recommended",
    "compare.val_lg_community": "Self-hosted",
    "compare.val_cs_community": "Yes",
    "compare.val_lg_cloud": "Origin layer",
    "compare.val_mod_cloud": "Proxy mode",
    "compare.note": "Honest limit: not an inline ModSec EPS race — strength is integration + ban speed + transparent proof. See docs/VS_RAKIPLER.md",
    "compare.scroll_hint": "Scroll → explore the table",
    "compare.progress_label": "Proof discovery {pct}%",
    "bridge.eyebrow": "//:Pipeline",
    "bridge.kicker": "Single chain · self-hosted · MIT",
    "bridge.title": "Log → WAF → Kernel Ban",
    "bridge.sub": "nginx access log line to ipset ban in ~17 ms — competitors use fragmented stacks.",
    "bridge.s1": "log",
    "bridge.s2": "CRS",
    "bridge.s3": "ban",
    "bridge.s4": "proof",
    "why.eyebrow": "//:Why",
    "why.title": "Why Log Guardian?",
    "why.lead": "Competitors are piecemeal — we ship measurable proof in one chain.",
    "why.c1_title": "One pipeline",
    "why.c1_body": "nginx log → OWASP CRS → ~17 ms kernel ban. No Fail2ban + ModSec + script pile.",
    "why.c2_title": "Transparent proof",
    "why.c2_body": "competitive-proof PDF, 67 tests, 72h soak — missing or partial elsewhere.",
    "why.c3_title": "MIT · Turkey",
    "why.c3_body": "Open source, Turkish docs, self-hosted — no vendor lock-in.",
    "why.c4_title": "Honest limits",
    "why.c4_body": "Not ModSec inline EPS; no Cloudflare absorb. Origin integration + speed.",
    "evidence.preview_pdf": "Competitor compare PDF — measured bench summary",
    "evidence.preview_json": "competitive-proof JSON — machine-readable metrics",
    "evidence.preview_bench": "ModSecurity CRS parity + EPS comparison",
    "evidence.preview_fp": "200 benign requests — false positive rate",
    "evidence.preview_ban": "Kernel ban latency — ~17 ms ipset",
    "evidence.preview_soak": "72h soak report — 864 samples, 0 fail",
    "evidence.preview_soak_md": "Soak summary — operator notes",
    "evidence.preview_sprint": "Sprint prod gate — FAIL:0 proof",
    "evidence.preview_siem": "SIEM export — Splunk/Elastic compatibility",
    "evidence.preview_taxii": "TAXII feed integration test",
    "evidence.preview_vm": "VirtualBox VM sprint proof",
    "evidence.preview_geoip": "GeoIP MMDB — attack map data",
    "evidence.preview_webhook": "Webhook route proof — alert pipeline",
    "evidence.preview_telegram": "Telegram live webhook test",
    "pager.sec_bridge": "Pipeline bridge",
    "pager.sec_why": "Why LG",
    "hero.eyebrow": "//:LOG→BAN",
    "marquee.line": "nginx log → WAF → kernel ban · 67 tests · 72h soak PASS · MIT self-hosted · Turkey · open source",
    "showcase.core.eyebrow": "//:Core",
    "showcase.core.title": "What=\"we do\"",
    "showcase.core.desc": "Single chain: nginx access log → OWASP CRS → ~17 ms kernel ban. Production-ready in ~15 minutes.",
    "showcase.pro.eyebrow": "//:Pro",
    "showcase.pro.title": "Pro=\"SOC\"",
    "showcase.pro.desc": "Fleet, SOC timeline, Grafana — optional layer on your server after install.",
    "showcase.proof.eyebrow": "//:Proof",
    "showcase.core.peek": "Single chain · ~17 ms ban",
    "showcase.pro.peek": "Fleet · SOC timeline",
    "showcase.proof.peek": "67 tests ·                                                                        72h soak PASS",
    "showcase.proof.title": "Proof=\"67 tests\"",
    "showcase.proof.desc": "68 automated tests, competitive PDF, 72h soak — same matrix as dashboard /tests.",
    "showcase.cta": "Discover",
    "showcase.core.short": "CORE",
    "showcase.core.tag1": "~17 ms ban",
    "showcase.core.tag2": "OWASP CRS",
    "showcase.pro.short": "SOC",
    "showcase.pro.tag1": "Fleet",
    "showcase.pro.tag2": "Timeline",
    "showcase.proof.short": "PROOF",
    "showcase.proof.tag1": "67 tests",
    "showcase.proof.tag2": "72h soak",
    "showcase.grafana.short": "METRICS",
    "showcase.grafana.eyebrow": "//:Metrics",
    "showcase.grafana.title": "Grafana=\"SOC\"",
    "showcase.grafana.desc": "Tenant-labeled Prometheus metrics, Grafana dashboards and alert rules — self-hosted observability.",
    "showcase.grafana.peek": "Prometheus · tenant alerts",
    "showcase.grafana.tag1": "Prometheus",
    "showcase.grafana.tag2": "Alerts",
    "stats.tests_label": "Automated tests",
    "stats.eyebrow": "//:Stats",
    "stats.title": "By the numbers",
    "stats.lead": "Measured proof — automated tests, soak, ban latency, reach.",
    "stats.soak": "72h",
    "stats.soak_label": "Soak PASS",
    "stats.ban_suffix": "ms",
    "stats.ban_label": "Kernel ban",
    "stats.countries_label": "Countries reached",
    "section.about_eyebrow": "//:About",
    "section.flow_eyebrow": "//:Pipeline",
    "section.scope_eyebrow": "//:Honest",
    "section.github_eyebrow": "//:Source",
    "section.install_eyebrow": "//:Setup",
    "section.dashboard_eyebrow": "//:Pro",
    "section.layers_eyebrow": "//:Layers",
    "section.evidence_eyebrow": "//:Evidence",
    "section.tests_eyebrow": "//:Proof",
    "section.laptop_eyebrow": "//:Verify",
    "section.contact_eyebrow": "//:Contact",
    "cta.banner.title": "Ready to deploy?",
    "cta.banner.body": "Clone, install, verify FAIL:0 — Core runs without the dashboard.",
    "cta.banner.btn": "15 min setup",
    "nav.home": "Home",
    "nav.install": "Setup",
    "nav.tests": "Tests",
    "nav.compare": "Compare",
    "nav.evidence": "Evidence",
    "nav.contact": "Contact",
    "nav.prev_section": "Previous section",
    "nav.next_section": "Next section",
    "nav.index": "Index",
    "index.title": "Chapters",
    "index.close": "Close",
    "case.close": "Close",
    "case.open_hint": "Click front card — case study",
    "case.prev": "Previous case",
    "case.next": "Next case",
    "case.core.lead": "Single chain: nginx access log → OWASP CRS → ~17 ms kernel ban. Production-ready on your server in ~15 minutes — no Fail2ban + ModSec script stack.",
    "case.core.cta": "Setup guide",
    "case.pro.lead": "Optional Pro layer after Core: fleet sync, SOC timeline, Grafana dashboards — all self-hosted on your infrastructure.",
    "case.pro.cta": "Dashboard & SOC",
    "case.proof.lead": "68 automated tests, competitive-proof PDF, 72h soak — the same matrix as /tests. FAIL:0 gate before every release.",
    "case.proof.cta": "Open tests",
    "case.grafana.lead": "Prometheus metrics with tenant labels, Grafana dashboards and alert rules — observability without vendor lock-in.",
    "case.grafana.cta": "Metrics layer",
    "hero.metric_ban_val": "~17 ms",
    "hero.metric_ban": "kernel ban",
    "hero.metric_tests": "automated tests",
    "hero.metric_soak_val": "72h",
    "hero.metric_soak": "soak PASS",
    "pager.hint": "Section nav — jump with arrows",
    "pager.sec_home": "Home",
    "pager.sec_work": "Selected proofs",
    "pager.sec_compare": "Compare",
    "pager.sec_stats": "Stats",
    "pager.sec_about": "About",
    "pager.sec_install": "Install",
    "pager.sec_dashboard": "Dashboard",
    "pager.sec_tests": "Tests",
    "pager.sec_evidence": "Evidence",
    "pager.sec_contact": "Contact",
    "pager.next_to": "Next → {section}",
    "theme.label_light": "Light mode",
    "theme.label_dark": "Dark mode",
    "about.title": "О проекте — Linux Log Guardian",
    "site.purpose": "<strong>Публичная страница загрузки и описания.</strong> Статический контент: обзор, руководство по установке, доказательства и контакт. Log Guardian здесь не работает — вы устанавливаете его на свой Linux-сервер.",
    "about.body": "<p><strong>Linux Log Guardian</strong> — <strong>open source (MIT)</strong> self-hosted стек безопасности из Турции. Одна цепочка: <em>читать логи nginx → правила OWASP CRS → ban на уровне ядра</em>.</p><p>Независимый community-проект — ревью кода, настройка и on-prem без cloud lock-in.</p><ul><li>Прозрачный исходный код; вклад приветствуется</li><li>Бинарник: <code>log-guardian</code> · пакет: <code>log-guardian_*.deb</code></li><li><strong>Core</strong> сам по себе готов к production (~15 мин)</li><li>Dashboard, Grafana, fleet = опциональный <strong>Pro</strong></li></ul>",
    "flow.title": "Одна цепочка: от лога до ban в ядре",
    "flow.s1": "nginx access log",
    "flow.s2": "Parser + CRS/WAF",
    "flow.s3": "Ban pipeline",
    "flow.s4": "ipset / kernel",
    "flow.s5": "Метрики + dashboard",
    "flow.note": "XDR, Wasm marketplace и LLM Copilot — долгосрочные опции; Core сам по себе готов к production.",
    "scope.honest.title": "Honest limits (not competing on edge speed)",
    "scope.honest.body": "<ul><li><strong>Reactive architecture</strong> — first request may pass until the log line is parsed; we are not inline ModSec throughput.</li><li><strong>L7 application layer</strong> — CRS/WAF, nginx consult, and eBPF HTTP probe; this is not volumetric L3/L4 scrub.</li><li><strong>No volumetric L3/L4 DDoS absorb</strong> — use CDN/Cloudflare on top.</li><li><strong>Distributed botnets</strong> — per-IP ban; no CrowdSec signal network.</li><li><strong>We do:</strong> log → CRS/WAF → ~17&nbsp;ms kernel ban, proof PDF, Telegram ops, MIT self-hosted.</li></ul>",
    "install.title": "Руководство по установке (подробно)",
    "install.intro": "<p>Пошаговая <strong>production</strong> установка на Ubuntu/Debian. Работает без XDP на laptop или VirtualBox VM. Документация: <code>docs/QUICKSTART_NGINX.md</code> и <code>docs/LAPTOP_OPS.md</code>.</p>",
    "install.terminal_label": "15-minute install — live terminal",
    "install.terminal_demo": "$ sudo dpkg -i log-guardian_*_amd64.deb\nSelecting previously unselected package log-guardian.\nlog-guardian installed.\n$ sudo bash /usr/local/share/log-guardian/scripts/install_first_run.sh\n[OK] log-guardian.service active\n[OK] --health IPC\n[OK] API fail-closed (unauthenticated 403)\n\n=== summary ===\n  FAIL: 0   WARN: 0\n[OK] post_install_verify — install gate passed",
    "install.expect_label": "Expected output (sample):",
    "install.deb_title": "A) Fresh server — .deb package (recommended)",
    "install.deb_body": "<p>No compile step. Ships binaries, systemd, rules and scripts. <strong>Upgrade-safe:</strong> existing <code>/etc/log-guardian/rules.conf</code> is preserved.</p><p><strong>Download:</strong> <a href=\"https://github.com/kurtulusutkucenik/Linux-Log-Guardian/releases\">GitHub Releases</a> (<code>log-guardian_*_amd64.deb</code>) or build from repo: <code>bash scripts/build_deb.sh</code> → <code>dist/</code>.</p>",
    "install.deb_s1_title": "1. Dependencies",
    "install.deb_s1_body": "<p>Install Debian package dependencies on first setup. nginx can be added in the same command if missing.</p>",
    "install.block_deb_deps": "sudo apt-get update\nsudo apt-get install -y ipset libbpf1 libcurl4 libpcre2-8-0 libsqlite3-0 \\\n  libssl3 libelf1 libz1 liburing2 nginx",
    "install.out_deb_deps": "Reading package lists... Done\nSetting up ipset (7.x) ...\nSetting up libbpf1:amd64 ...\nSetting up nginx (1.x) ...",
    "install.deb_s2_title": "2. Install package",
    "install.deb_s2_body": "<p>If <code>dpkg -i</code> reports missing dependencies, run <code>apt-get install -f</code>. postinst creates the <code>log-guardian</code> user, permissions and services automatically.</p>",
    "install.block_deb": "# Copy .deb to server (scp, wget, USB...)\nsudo dpkg -i log-guardian_*_amd64.deb\nsudo apt-get install -f   # if dependencies missing\n\n# On success:\n#   log-guardian kuruldu.\n#   sudo bash .../install_first_run.sh\n#   bash .../post_install_verify.sh",
    "install.out_deb": "Selecting previously unselected package log-guardian.\n(Reading database ... 100%)\nSetting up log-guardian (72e5a7b) ...\n[deb_post_install] rules.conf olusturuldu: /etc/log-guardian/rules.conf\n\nlog-guardian kuruldu.",
    "install.deb_s3_title": "3. First run & verification",
    "install.deb_s3_body": "<p>Prepares nginx log format, FP trust and API security in one pass. Scripts live under <code>/usr/local/share/log-guardian/scripts/</code>.</p>",
    "install.block_deb_first": "sudo bash /usr/local/share/log-guardian/scripts/install_first_run.sh\nsudo bash /usr/local/share/log-guardian/scripts/ensure_api_security.sh\nbash /usr/local/share/log-guardian/scripts/post_install_verify.sh",
    "install.out_deb_first": "[OK] log-guardian.service active\n[OK] log-guardian-daemon.service active\n[OK] --health IPC\n[OK] API fail-closed (tokensiz 403)\n\n=== ozet ===\n  FAIL: 0   WARN: 0\n[OK] post_install_verify — kurulum kapisi gecti",
    "install.src_title": "B) Source — build and install",
    "install.src_body": "<p>Clone from <a href=\"https://github.com/kurtulusutkucenik/Linux-Log-Guardian\">GitHub</a> and build locally. Best for development and full source review.</p>",
    "install.req_title": "Требования",
    "install.req_body": "<ul><li>Ubuntu 22.04 / 24.04 или Debian 12 (amd64)</li><li>nginx с записываемым access log</li><li>root/sudo (systemd, ipset, <code>/etc/log-guardian</code>)</li><li>Опционально Pro: Docker (dashboard/Grafana), подходящее ядро для eBPF</li></ul>",
    "install.s1_title": "Исходники или .deb",
    "install.s1_body": "<p>Клонировать, собрать и запустить установщик. <code>install.sh</code> настраивает systemd, правила и формат лога nginx.</p>",
    "install.block1": "git clone https://github.com/kurtulusutkucenik/Linux-Log-Guardian.git\ncd Linux-Log-Guardian\nmake -j$(nproc)\nsudo bash install.sh",
    "install.s2_title": "Первый запуск и безопасность API",
    "install.s2_body": "<p>Запускает сервисы и готовит синхронизацию API-токена для dashboard.</p>",
    "install.block_api": "sudo bash scripts/install_first_run.sh\nsudo bash scripts/ensure_api_security.sh\nbash scripts/sync_dashboard_api_token.sh",
    "install.common_title": "Shared steps (after A or B)",
    "install.s3_title": "Формат лога nginx",
    "install.s3_body": "<p>WAF требует формат <code>log_guardian</code> для body и XFF. Установщик обычно применяет — проверьте:</p>",
    "install.block_nginx": "# examples/nginx-log-guardian.conf → site config\nSTRICT=1 bash scripts/check_nginx_log_format.sh\nsudo nginx -t && sudo systemctl reload nginx",
    "install.s4_title": "Проверка",
    "install.s4_body": "<p>Проверьте health, алерты и метрики Prometheus. <code>post_install_verify.sh</code> даёт сводку на laptop.</p>",
    "install.block_verify": "sudo log-guardian --health\nsudo log-guardian --status\n# Source install:\nbash scripts/post_install_verify.sh\n# .deb install:\nbash /usr/local/share/log-guardian/scripts/post_install_verify.sh\ncurl -s http://127.0.0.1:9091/metrics | head",
    "install.out_health": "[HEALTH] daemon IPC: OK\n[HEALTH] BPF xdp=OFF execve=OFF lineage=OFF\n[HEALTH] RCE det=0 kill=0 lineage=0 connect=0 uptime=…s",
    "install.out_verify": "[OK] log-guardian.service active\n[OK] metrics :9091\n[OK] API fail-closed (tokensiz 403)\n[OK] nginx log_guardian format\n\n=== ozet ===\n  FAIL: 0   WARN: 0\n[OK] post_install_verify — kurulum kapisi gecti",
    "install.out_metrics": "# HELP loganalyzer_log_lines_total ...\nloganalyzer_log_lines_total{tenant_id=\"default\"} 8\nloganalyzer_ban_success_total{tenant_id=\"default\"} 8",
    "install.s5_title": "VirtualBox / без XDP (laptop и VM)",
    "install.s5_body": "<p>Без eBPF/XDP используйте <code>--no-xdp</code> с ipset ban. При сбое сервиса — repair script.</p>",
    "install.block2": "sudo bash install.sh --no-xdp\nsudo bash scripts/install_first_run.sh\n# if service FAIL:\nsudo bash scripts/repair_no_xdp_stack.sh",
    "install.tip": "<strong>Совет:</strong> JWT: <code>bash scripts/laptop_jwt_setup.sh</code>. Быстрая demo: <code>SKIP_WEBHOOK=1 bash scripts/demo_3min.sh</code>",
    "dashboard.title": "Dashboard — после установки (опциональный Pro)",
    "dashboard.where": "<strong>Важно:</strong> dashboard <em>не</em> работает на этом сайте. <code>localhost:3001</code> — на <strong>вашей Linux-машине</strong>, где вы установили; localhost посетителя — не ваш сервер.",
    "dashboard.body": "<p><strong>Pro dashboard</strong> (Next.js): fleet, история ban, тесты и PDF. Слушает <code>:3001</code> с TLS. Перед internet — <code>laptop_harden.sh</code>.</p>",
    "dashboard.access_title": "Кто и когда получает доступ?",
    "dashboard.access_row1_label": "Посетитель сайта",
    "dashboard.access_row1": "Читает страницу, скачивает исходники или .deb — <strong>не</strong> открывает порт 3001.",
    "dashboard.access_row2_label": "Установивший",
    "dashboard.access_row2": "После <code>install.sh</code> + <code>dashboard_dev.sh</code> на Ubuntu/Debian: <code>http://localhost:3001</code> <strong>на той же машине</strong>.",
    "dashboard.access_row3_label": "Удалённый VPS",
    "dashboard.access_row3": "SSH-туннель или (если firewall) <code>https://SERVER_IP:3001</code>. Не открывайте с demo-паролем.",
    "dashboard.req_title": "Доп. требования для dashboard",
    "dashboard.req_body": "<ul><li><strong>Core</strong> — nginx + sudo; dashboard <em>не обязателен</em></li><li><strong>Dashboard</strong> — Docker + <code>dashboard_dev.sh</code></li><li><strong>Grafana</strong> — также <code>grafana_stack.sh</code> (опционально)</li></ul>",
    "dashboard.start_title": "Запуск на вашем сервере",
    "dashboard.start": "# On the machine where you installed (not this website):\nbash scripts/dashboard_refresh.sh\n# Browser on the same machine:\n#   https://localhost:8443\n# Login: admin / DASHBOARD_ADMIN_PASSWORD in .env",
    "dashboard.features": "<ul><li><strong>Fleet:</strong> agent online/offline, последние алерты</li><li><strong>Tests:</strong> phase100, competitive-proof, bench</li><li><strong>Reports:</strong> PDF/JSON evidence pack</li><li><strong>Grafana:</strong> tenant metrics via <code>bash scripts/grafana_provision.sh</code></li></ul>",
    "dashboard.optional": "<strong>Достаточно Core?</strong> Да. log → WAF → kernel ban без dashboard. CLI (<code>log-guardian --status</code>) и Prometheus (<code>:9091/metrics</code>) в Core.",
    "dashboard.preview_title": "Превью интерфейса",
    "dashboard.preview_note": "Скриншоты ниже — примеры. Live UI только на вашей установке.",
    "dashboard.cap1": "Fleet — agents и последние алерты",
    "dashboard.cap2": "Tests — phase100, bench, soak",
    "dashboard.cap3": "Grafana + Prometheus metrics",
    "dashboard.note": "Итого: этот сайт = скачать и изучить. Dashboard = на вашем сервере, после установки, опционально.",
    "warn.title": "⚠️ Перед выходом в internet",
    "warn.p1": "Laptop/demo: пароль <code>DegistirBeni!123</code> намеренно открыт.",
    "warn.p2": "Public VPS: <code>sudo env LG_NEW_PASSWORD='…' bash scripts/laptop_harden.sh</code>",
    "warn.p3": "Профили: <code>docs/SECURITY_PROFILES.md</code>",
    "layers.title": "Слои",
    "layers.core": "Core",
    "layers.core_desc": "log → WAF → ipset ban (~15 мин)",
    "layers.pro": "Pro",
    "layers.pro_desc": "eBPF daemon, dashboard, Grafana, fleet",
    "layers.opt": "Опционально",
    "layers.opt_desc": "XDR, Wasm marketplace, LLM Copilot",
    "layers.note": "Pro и опции — дополнения; Core достаточен для ежедневной работы.",
    "github.title": "Source code (GitHub)",
    "github.intro": "<p><strong>Linux Log Guardian</strong> is fully open source (MIT). All C source, install scripts, tests and evidence are on GitHub — you install on your own Linux server; this site is only a landing page.</p>",
    "github.releases": "Releases (.deb)",
    "github.steps_title": "Quick start (from source)",
    "github.steps_body": "<p>Clone, build, install; aim for <code>FAIL: 0</code> in <code>post_install_verify</code>. Step-by-step: <a href=\"#kurulum\">Setup</a> · proofs: <a href=\"/tests\">Tests</a>.</p>",
    "github.contrib": "<p>Issues and pull requests welcome. Do not commit API/Telegram secrets — use <code>ensure_api_security.sh</code> and <code>webhook.local.env.example</code> on install.</p>",
    "download.title": "Скачать (.deb пакет)",
    "download.intro": "<p>Сборка пакета: <code>build_deb.sh</code>. Проверка без установки: <code>test_deb_local.sh</code>.</p>",
    "download.block": "bash scripts/build_deb.sh\n# → dist/log-guardian_*.deb\nbash scripts/test_deb_local.sh",
    "download.verify": "Проверка пакета (без установки): <code>bash scripts/test_deb_local.sh</code>",
    "evidence.title": "Пакет доказательств",
    "evidence.gate": "Laptop gate: <code>bash scripts/laptop_sprint_gate.sh</code>",
    "evidence.sync": "Обновить: <code>bash scripts/sync_evidence_pack.sh</code>",
    "tests.title": "Validation tests",
    "tests.page_title": "Validation tests",
    "tests.page_title_line1": "VALIDATION",
    "tests.page_title_line2": "TESTS",
    "tests.hero_eyebrow": "//:Proof",
    "tests.page_intro": "Same matrix as dashboard <code>/tests</code> — install gates, CRS parity, FP, ban latency, corpus recall and <strong>72h soak</strong>. Each card is automated script output.",
    "tests.matrix_title": "Full test matrix",
    "tests.matrix_desc": "From install gates to competitive proof — every row is real script output, identical to the dashboard.",
    "tests.filter_all": "All",
    "tests.filter_gate": "Install gates",
    "tests.filter_proof": "Competitive proof",
    "tests.filter_fail": "Failed",
    "tests.filter_aria": "Test matrix filter",
    "tests.filter_count": "{visible}/{total} visible",
    "tests.search_label": "Search tests",
    "tests.search_placeholder": "Test name, script or id…",
    "tests.proof_pack": "Proof pack JSON",
    "tests.hl_pass_value": "67/72",
    "tests.hl_pass_label": "Automated tests PASS",
    "tests.hl_soak_value": "72h",
    "tests.hl_soak_label": "Soak · 864 samples · 0 failures",
    "tests.hl_ban_value": "17ms",
    "tests.hl_ban_label": "Median kernel ban",
    "tests.hl_crs_value": "100%",
    "tests.hl_crs_label": "OWASP CRS parity",
    "tests.hl_fp_value": "0.2%",
    "tests.hl_fp_label": "Benign FP rate",
    "tests.hl_eps_value": "5357",
    "tests.hl_eps_label": "EPS · single-pass log-WAF",
    "tests.teaser": "Same automated test matrix as the dashboard — <strong>72 proofs</strong> (install gates, CRS, FP, ban latency, corpus, 72h soak).",
    "tests.open_full": "View all tests (72)",
    "tests.proof_pdf": "Evidence PDF",
    "tests.intro": "Same automated test matrix as the dashboard — install gates (FAIL=0), CRS parity, FP, ban latency, corpus recall and <strong>72h VPS/VM soak</strong>. Live installs refresh the same data at dashboard <code>/tests</code>.",
    "tests.note": "Raw JSON: <a href=\"/evidence/competitive-proof.json\" rel=\"noopener noreferrer\" download>competitive-proof.json</a> · PDF: <a href=\"/evidence/competitive-proof.pdf\" rel=\"noopener noreferrer\">competitive-proof.pdf</a> · Refresh: <code>bash scripts/competitive_proof.sh</code>",
    "laptop.title": "Матрица проверки laptop",
    "laptop.intro": "<p>Быстрый dev gate: sprint gate, soak 1h и demo 3 min. Soak 72h VM: <code>laptop_soak_72h.sh --start</code>.</p>",
    "laptop.block": "SKIP_PHASE100=1 bash scripts/laptop_sprint_gate.sh\nSOAK_1H=1 bash scripts/laptop_soak_72h.sh --start\nSKIP_WEBHOOK=1 bash scripts/demo_3min.sh",
    "contact.title": "Контакт и вклад",
    "contact.body": "<p>Вопросы, сотрудничество или вклад — пишите. Bug reports и pull requests приветствуются.</p>",
    "contact.email_label": "Email:",
    "footer": "Linux Log Guardian · Сделано в Турции · MIT · open source · <a href=\"mailto:kurtulusutkucenikcontact@gmail.com\">kurtulusutkucenikcontact@gmail.com</a>"
  },
  "ar": {
    "meta.description": "Linux Log Guardian — WAF مفتوح المصدر لـ nginx من تركيا. log → ban في ~15 دقيقة.",
    "hero.title": "Linux Log Guardian",
    "hero.tag": "nginx access log → WAF/CRS → حظر على مستوى النواة · سلسلة واحدة · self-hosted",
    "hero.badge_tr": "تورك",
    "hero.badge_opensource": "مفتوح المصدر",
    "hero.badge_mit": "مفتوح المصدر · MIT",
    "hero.badge_core": "Core ~15 دقيقة للتثبيت",
    "hero.badge_soak": "72h soak PASS",
    "hero.cta_install": "تثبيت 15 دقيقة",
    "hero.cta_dashboard": "لوحة التحكم (بعد التثبيت)",
    "hero.cta_tests": "Test results",
    "hero.cta_evidence": "حزمة الأدلة",
    "hero.cta_contact": "تواصل",
    "hero.cta_github": "Source on GitHub",
    "hero.proof_traction": "2.3k+ visits · 4k+ page views · 54 countries · proof PDF",
    "hero.scroll_hint": "Scroll — explore",
    "hero.enter_hint": "Click or scroll — continue",
    "enter.skip": "Skip",
    "enter.continue": "Enter",
    "section.work_eyebrow": "//:Selected",
    "section.work_title": "Selected proofs",
    "section.work_sub": "Core · Pro · Proof · Grafana — measurable outcomes in one chain.",
    "section.work_hint": "Scroll — more evidence cards",
    "compare.eyebrow": "//:Vs",
    "compare.title": "Competitor compare",
    "compare.sub": "Measured proof — Fail2ban / CrowdSec / ModSecurity architectural notes",
    "compare.col_metric": "Metric",
    "compare.col_lg": "Log Guardian",
    "compare.col_f2b": "Fail2ban",
    "compare.col_cs": "CrowdSec",
    "compare.col_mod": "ModSec + CRS",
    "compare.row_pipeline": "Log → WAF → kernel ban",
    "compare.row_recall": "Real attack recall",
    "compare.row_fp": "False positive",
    "compare.row_ban": "Ban latency",
    "compare.row_proof": "Proof pack PDF+JSON",
    "compare.row_mit": "MIT + TR docs",
    "compare.val_lg_pipeline": "Single pipeline",
    "compare.val_f2b_pipeline": "Ban only",
    "compare.val_cs_pipeline": "Fragmented",
    "compare.val_mod_pipeline": "WAF separate",
    "compare.val_lg_recall": "100% (1K+10K)",
    "compare.val_na": "—",
    "compare.val_mod_recall": "CRS parity 100%",
    "compare.val_lg_fp": "0.2%",
    "compare.val_f2b_fp": "High",
    "compare.val_cs_fp": "Medium",
    "compare.val_mod_fp": "CRS dependent",
    "compare.val_lg_ban": "~17 ms",
    "compare.val_f2b_ban": "sec–min",
    "compare.val_cs_ban": "sec",
    "compare.val_mod_ban": "Separate integration",
    "compare.val_yes": "Automatic",
    "compare.val_no": "None",
    "compare.val_cs_proof": "Partial",
    "compare.val_mod_proof": "Per module",
    "compare.val_partial": "Partial",
    "compare.val_mod_mit": "CRS open",
    "compare.sec_strength": "Strengths (measured)",
    "compare.sec_honest": "Honest limits",
    "compare.row_ja3": "Distributed / JA3 cluster",
    "compare.row_consult": "nginx inline consult",
    "compare.row_l7": "L7 application protection",
    "compare.row_stability": "Short stability (5 min)",
    "compare.row_inline_eps": "Inline regex EPS",
    "compare.row_reactive": "First request may pass",
    "compare.row_ddos": "Volumetric L3/L4 scrub",
    "compare.row_community": "Community signal network",
    "compare.row_cloud": "Edge / Cloud WAF",
    "compare.val_lg_ja3": "100% (80 IPs)",
    "compare.val_cs_ja3": "Signal-based",
    "compare.val_lg_consult": "PASS",
    "compare.val_lg_l7": "WAF + consult + eBPF",
    "compare.val_mod_l7": "CRS inline",
    "compare.val_mod_consult": "Separate module",
    "compare.val_lg_stability": "PASS (0 fail)",
    "compare.val_lg_eps": "~130 EPS (log replay)",
    "compare.val_mod_eps": "~12K EPS inline",
    "compare.val_lg_reactive": "Reactive (log line)",
    "compare.val_f2b_reactive": "Reactive",
    "compare.val_cs_reactive": "Partial",
    "compare.val_mod_reactive": "Inline block",
    "compare.val_lg_ddos": "None — CDN recommended",
    "compare.val_lg_community": "Self-hosted",
    "compare.val_cs_community": "Yes",
    "compare.val_lg_cloud": "Origin layer",
    "compare.val_mod_cloud": "Proxy mode",
    "compare.note": "Honest limit: not an inline ModSec EPS race — strength is integration + ban speed + transparent proof. See docs/VS_RAKIPLER.md",
    "compare.scroll_hint": "Scroll → explore the table",
    "compare.progress_label": "Proof discovery {pct}%",
    "bridge.eyebrow": "//:Pipeline",
    "bridge.kicker": "Single chain · self-hosted · MIT",
    "bridge.title": "Log → WAF → Kernel Ban",
    "bridge.sub": "nginx access log line to ipset ban in ~17 ms — competitors use fragmented stacks.",
    "bridge.s1": "log",
    "bridge.s2": "CRS",
    "bridge.s3": "ban",
    "bridge.s4": "proof",
    "why.eyebrow": "//:Why",
    "why.title": "Why Log Guardian?",
    "why.lead": "Competitors are piecemeal — we ship measurable proof in one chain.",
    "why.c1_title": "One pipeline",
    "why.c1_body": "nginx log → OWASP CRS → ~17 ms kernel ban. No Fail2ban + ModSec + script pile.",
    "why.c2_title": "Transparent proof",
    "why.c2_body": "competitive-proof PDF, 67 tests, 72h soak — missing or partial elsewhere.",
    "why.c3_title": "MIT · Turkey",
    "why.c3_body": "Open source, Turkish docs, self-hosted — no vendor lock-in.",
    "why.c4_title": "Honest limits",
    "why.c4_body": "Not ModSec inline EPS; no Cloudflare absorb. Origin integration + speed.",
    "evidence.preview_pdf": "Competitor compare PDF — measured bench summary",
    "evidence.preview_json": "competitive-proof JSON — machine-readable metrics",
    "evidence.preview_bench": "ModSecurity CRS parity + EPS comparison",
    "evidence.preview_fp": "200 benign requests — false positive rate",
    "evidence.preview_ban": "Kernel ban latency — ~17 ms ipset",
    "evidence.preview_soak": "72h soak report — 864 samples, 0 fail",
    "evidence.preview_soak_md": "Soak summary — operator notes",
    "evidence.preview_sprint": "Sprint prod gate — FAIL:0 proof",
    "evidence.preview_siem": "SIEM export — Splunk/Elastic compatibility",
    "evidence.preview_taxii": "TAXII feed integration test",
    "evidence.preview_vm": "VirtualBox VM sprint proof",
    "evidence.preview_geoip": "GeoIP MMDB — attack map data",
    "evidence.preview_webhook": "Webhook route proof — alert pipeline",
    "evidence.preview_telegram": "Telegram live webhook test",
    "pager.sec_bridge": "Pipeline bridge",
    "pager.sec_why": "Why LG",
    "hero.eyebrow": "//:LOG→BAN",
    "marquee.line": "nginx log → WAF → kernel ban · 67 tests · 72h soak PASS · MIT self-hosted · Turkey · open source",
    "showcase.core.eyebrow": "//:Core",
    "showcase.core.title": "What=\"we do\"",
    "showcase.core.desc": "Single chain: nginx access log → OWASP CRS → ~17 ms kernel ban. Production-ready in ~15 minutes.",
    "showcase.pro.eyebrow": "//:Pro",
    "showcase.pro.title": "Pro=\"SOC\"",
    "showcase.pro.desc": "Fleet, SOC timeline, Grafana — optional layer on your server after install.",
    "showcase.proof.eyebrow": "//:Proof",
    "showcase.core.peek": "Single chain · ~17 ms ban",
    "showcase.pro.peek": "Fleet · SOC timeline",
    "showcase.proof.peek": "67 tests ·                                                                        72h soak PASS",
    "showcase.proof.title": "Proof=\"67 tests\"",
    "showcase.proof.desc": "68 automated tests, competitive PDF, 72h soak — same matrix as dashboard /tests.",
    "showcase.cta": "Discover",
    "showcase.core.short": "CORE",
    "showcase.core.tag1": "~17 ms ban",
    "showcase.core.tag2": "OWASP CRS",
    "showcase.pro.short": "SOC",
    "showcase.pro.tag1": "Fleet",
    "showcase.pro.tag2": "Timeline",
    "showcase.proof.short": "PROOF",
    "showcase.proof.tag1": "67 tests",
    "showcase.proof.tag2": "72h soak",
    "showcase.grafana.short": "METRICS",
    "showcase.grafana.eyebrow": "//:Metrics",
    "showcase.grafana.title": "Grafana=\"SOC\"",
    "showcase.grafana.desc": "Tenant-labeled Prometheus metrics, Grafana dashboards and alert rules — self-hosted observability.",
    "showcase.grafana.peek": "Prometheus · tenant alerts",
    "showcase.grafana.tag1": "Prometheus",
    "showcase.grafana.tag2": "Alerts",
    "stats.tests_label": "Automated tests",
    "stats.eyebrow": "//:Stats",
    "stats.title": "By the numbers",
    "stats.lead": "Measured proof — automated tests, soak, ban latency, reach.",
    "stats.soak": "72h",
    "stats.soak_label": "Soak PASS",
    "stats.ban_suffix": "ms",
    "stats.ban_label": "Kernel ban",
    "stats.countries_label": "Countries reached",
    "section.about_eyebrow": "//:About",
    "section.flow_eyebrow": "//:Pipeline",
    "section.scope_eyebrow": "//:Honest",
    "section.github_eyebrow": "//:Source",
    "section.install_eyebrow": "//:Setup",
    "section.dashboard_eyebrow": "//:Pro",
    "section.layers_eyebrow": "//:Layers",
    "section.evidence_eyebrow": "//:Evidence",
    "section.tests_eyebrow": "//:Proof",
    "section.laptop_eyebrow": "//:Verify",
    "section.contact_eyebrow": "//:Contact",
    "cta.banner.title": "Ready to deploy?",
    "cta.banner.body": "Clone, install, verify FAIL:0 — Core runs without the dashboard.",
    "cta.banner.btn": "15 min setup",
    "nav.home": "Home",
    "nav.install": "Setup",
    "nav.tests": "Tests",
    "nav.compare": "Compare",
    "nav.evidence": "Evidence",
    "nav.contact": "Contact",
    "nav.prev_section": "Previous section",
    "nav.next_section": "Next section",
    "nav.index": "Index",
    "index.title": "Chapters",
    "index.close": "Close",
    "case.close": "Close",
    "case.open_hint": "Click front card — case study",
    "case.prev": "Previous case",
    "case.next": "Next case",
    "case.core.lead": "Single chain: nginx access log → OWASP CRS → ~17 ms kernel ban. Production-ready on your server in ~15 minutes — no Fail2ban + ModSec script stack.",
    "case.core.cta": "Setup guide",
    "case.pro.lead": "Optional Pro layer after Core: fleet sync, SOC timeline, Grafana dashboards — all self-hosted on your infrastructure.",
    "case.pro.cta": "Dashboard & SOC",
    "case.proof.lead": "68 automated tests, competitive-proof PDF, 72h soak — the same matrix as /tests. FAIL:0 gate before every release.",
    "case.proof.cta": "Open tests",
    "case.grafana.lead": "Prometheus metrics with tenant labels, Grafana dashboards and alert rules — observability without vendor lock-in.",
    "case.grafana.cta": "Metrics layer",
    "hero.metric_ban_val": "~17 ms",
    "hero.metric_ban": "kernel ban",
    "hero.metric_tests": "automated tests",
    "hero.metric_soak_val": "72h",
    "hero.metric_soak": "soak PASS",
    "pager.hint": "Section nav — jump with arrows",
    "pager.sec_home": "Home",
    "pager.sec_work": "Selected proofs",
    "pager.sec_compare": "Compare",
    "pager.sec_stats": "Stats",
    "pager.sec_about": "About",
    "pager.sec_install": "Install",
    "pager.sec_dashboard": "Dashboard",
    "pager.sec_tests": "Tests",
    "pager.sec_evidence": "Evidence",
    "pager.sec_contact": "Contact",
    "pager.next_to": "Next → {section}",
    "theme.label_light": "Light mode",
    "theme.label_dark": "Dark mode",
    "about.title": "حول — Linux Log Guardian",
    "site.purpose": "<strong>صفحة عامة للتعريف والتنزيل.</strong> محتوى ثابت: نظرة عامة، دليل التثبيت، الأدلة والتواصل. Log Guardian لا يعمل هنا — تثبته على خادم Linux الخاص بك.",
    "about.body": "<p><strong>Linux Log Guardian</strong> مكدس أمان <strong>مفتوح المصدر (MIT)</strong> self-hosted من تركيا. سلسلة واحدة: <em>قراءة سجلات nginx → قواعد OWASP CRS → حظر على مستوى النواة</em>.</p><p>مشروع مجتمعي مستقل — مراجعة الكود والتخصيص والاستضافة المحلية دون قفل سحابي.</p><ul><li>مصدر شفاف؛ المساهمات مرحب بها</li><li>Binary: <code>log-guardian</code> · حزمة: <code>log-guardian_*.deb</code></li><li><strong>Core</strong> وحده جاهز للإنتاج (~15 دقيقة)</li><li>Dashboard وGrafana وfleet = طبقة <strong>Pro</strong> اختيارية</li></ul>",
    "flow.title": "سلسلة واحدة: من السجل إلى حظر النواة",
    "flow.s1": "nginx access log",
    "flow.s2": "Parser + CRS/WAF",
    "flow.s3": "Ban pipeline",
    "flow.s4": "ipset / kernel",
    "flow.s5": "مقاييس + dashboard",
    "flow.note": "XDR وWasm marketplace وLLM Copilot طبقات اختيارية طويلة الأمد — Core وحده كافٍ للإنتاج.",
    "scope.honest.title": "Honest limits (not competing on edge speed)",
    "scope.honest.body": "<ul><li><strong>Reactive architecture</strong> — first request may pass until the log line is parsed; we are not inline ModSec throughput.</li><li><strong>L7 application layer</strong> — CRS/WAF, nginx consult, and eBPF HTTP probe; this is not volumetric L3/L4 scrub.</li><li><strong>No volumetric L3/L4 DDoS absorb</strong> — use CDN/Cloudflare on top.</li><li><strong>Distributed botnets</strong> — per-IP ban; no CrowdSec signal network.</li><li><strong>We do:</strong> log → CRS/WAF → ~17&nbsp;ms kernel ban, proof PDF, Telegram ops, MIT self-hosted.</li></ul>",
    "install.title": "دليل التثبيت (مفصل)",
    "install.intro": "<p>تثبيت <strong>إنتاج</strong> خطوة بخطوة على Ubuntu/Debian. يعمل بدون XDP على laptop أو VirtualBox VM. الوثائق: <code>docs/QUICKSTART_NGINX.md</code> و<code>docs/LAPTOP_OPS.md</code>.</p>",
    "install.terminal_label": "15-minute install — live terminal",
    "install.terminal_demo": "$ sudo dpkg -i log-guardian_*_amd64.deb\nSelecting previously unselected package log-guardian.\nlog-guardian installed.\n$ sudo bash /usr/local/share/log-guardian/scripts/install_first_run.sh\n[OK] log-guardian.service active\n[OK] --health IPC\n[OK] API fail-closed (unauthenticated 403)\n\n=== summary ===\n  FAIL: 0   WARN: 0\n[OK] post_install_verify — install gate passed",
    "install.expect_label": "Expected output (sample):",
    "install.deb_title": "A) Fresh server — .deb package (recommended)",
    "install.deb_body": "<p>No compile step. Ships binaries, systemd, rules and scripts. <strong>Upgrade-safe:</strong> existing <code>/etc/log-guardian/rules.conf</code> is preserved.</p><p><strong>Download:</strong> <a href=\"https://github.com/kurtulusutkucenik/Linux-Log-Guardian/releases\">GitHub Releases</a> (<code>log-guardian_*_amd64.deb</code>) or build from repo: <code>bash scripts/build_deb.sh</code> → <code>dist/</code>.</p>",
    "install.deb_s1_title": "1. Dependencies",
    "install.deb_s1_body": "<p>Install Debian package dependencies on first setup. nginx can be added in the same command if missing.</p>",
    "install.block_deb_deps": "sudo apt-get update\nsudo apt-get install -y ipset libbpf1 libcurl4 libpcre2-8-0 libsqlite3-0 \\\n  libssl3 libelf1 libz1 liburing2 nginx",
    "install.out_deb_deps": "Reading package lists... Done\nSetting up ipset (7.x) ...\nSetting up libbpf1:amd64 ...\nSetting up nginx (1.x) ...",
    "install.deb_s2_title": "2. Install package",
    "install.deb_s2_body": "<p>If <code>dpkg -i</code> reports missing dependencies, run <code>apt-get install -f</code>. postinst creates the <code>log-guardian</code> user, permissions and services automatically.</p>",
    "install.block_deb": "# Copy .deb to server (scp, wget, USB...)\nsudo dpkg -i log-guardian_*_amd64.deb\nsudo apt-get install -f   # if dependencies missing\n\n# On success:\n#   log-guardian kuruldu.\n#   sudo bash .../install_first_run.sh\n#   bash .../post_install_verify.sh",
    "install.out_deb": "Selecting previously unselected package log-guardian.\n(Reading database ... 100%)\nSetting up log-guardian (72e5a7b) ...\n[deb_post_install] rules.conf olusturuldu: /etc/log-guardian/rules.conf\n\nlog-guardian kuruldu.",
    "install.deb_s3_title": "3. First run & verification",
    "install.deb_s3_body": "<p>Prepares nginx log format, FP trust and API security in one pass. Scripts live under <code>/usr/local/share/log-guardian/scripts/</code>.</p>",
    "install.block_deb_first": "sudo bash /usr/local/share/log-guardian/scripts/install_first_run.sh\nsudo bash /usr/local/share/log-guardian/scripts/ensure_api_security.sh\nbash /usr/local/share/log-guardian/scripts/post_install_verify.sh",
    "install.out_deb_first": "[OK] log-guardian.service active\n[OK] log-guardian-daemon.service active\n[OK] --health IPC\n[OK] API fail-closed (tokensiz 403)\n\n=== ozet ===\n  FAIL: 0   WARN: 0\n[OK] post_install_verify — kurulum kapisi gecti",
    "install.src_title": "B) Source — build and install",
    "install.src_body": "<p>Clone from <a href=\"https://github.com/kurtulusutkucenik/Linux-Log-Guardian\">GitHub</a> and build locally. Best for development and full source review.</p>",
    "install.req_title": "المتطلبات",
    "install.req_body": "<ul><li>Ubuntu 22.04 / 24.04 أو Debian 12 (amd64)</li><li>nginx مع access log قابل للكتابة</li><li>root/sudo (systemd, ipset, <code>/etc/log-guardian</code>)</li><li>Pro اختياري: Docker (dashboard/Grafana)، نواة مناسبة لـ eBPF</li></ul>",
    "install.s1_title": "المصدر أو .deb",
    "install.s1_body": "<p>استنساخ وبناء وتشغيل المثبت الرئيسي. <code>install.sh</code> يعد systemd والقواعد وتنسيق log nginx.</p>",
    "install.block1": "git clone https://github.com/kurtulusutkucenik/Linux-Log-Guardian.git\ncd Linux-Log-Guardian\nmake -j$(nproc)\nsudo bash install.sh",
    "install.s2_title": "التشغيل الأول وأمان API",
    "install.s2_body": "<p>يبدأ الخدمات ويجهّز مزامنة token API للوحة التحكم.</p>",
    "install.block_api": "sudo bash scripts/install_first_run.sh\nsudo bash scripts/ensure_api_security.sh\nbash scripts/sync_dashboard_api_token.sh",
    "install.common_title": "Shared steps (after A or B)",
    "install.s3_title": "تنسيق log nginx",
    "install.s3_body": "<p>WAF يحتاج تنسيق <code>log_guardian</code> للـ body وXFF. المثبت يطبقه عادة — تحقق:</p>",
    "install.block_nginx": "# examples/nginx-log-guardian.conf → site config\nSTRICT=1 bash scripts/check_nginx_log_format.sh\nsudo nginx -t && sudo systemctl reload nginx",
    "install.s4_title": "التحقق",
    "install.s4_body": "<p>تحقق من health والتنبيهات ومقاييس Prometheus. <code>post_install_verify.sh</code> يلخص على laptop.</p>",
    "install.block_verify": "sudo log-guardian --health\nsudo log-guardian --status\n# Source install:\nbash scripts/post_install_verify.sh\n# .deb install:\nbash /usr/local/share/log-guardian/scripts/post_install_verify.sh\ncurl -s http://127.0.0.1:9091/metrics | head",
    "install.out_health": "[HEALTH] daemon IPC: OK\n[HEALTH] BPF xdp=OFF execve=OFF lineage=OFF\n[HEALTH] RCE det=0 kill=0 lineage=0 connect=0 uptime=…s",
    "install.out_verify": "[OK] log-guardian.service active\n[OK] metrics :9091\n[OK] API fail-closed (tokensiz 403)\n[OK] nginx log_guardian format\n\n=== ozet ===\n  FAIL: 0   WARN: 0\n[OK] post_install_verify — kurulum kapisi gecti",
    "install.out_metrics": "# HELP loganalyzer_log_lines_total ...\nloganalyzer_log_lines_total{tenant_id=\"default\"} 8\nloganalyzer_ban_success_total{tenant_id=\"default\"} 8",
    "install.s5_title": "VirtualBox / بدون XDP (laptop وVM)",
    "install.s5_body": "<p>بدون eBPF/XDP استخدم <code>--no-xdp</code> مع ipset ban. عند فشل الخدمة — repair script.</p>",
    "install.block2": "sudo bash install.sh --no-xdp\nsudo bash scripts/install_first_run.sh\n# if service FAIL:\nsudo bash scripts/repair_no_xdp_stack.sh",
    "install.tip": "<strong>نصيحة:</strong> JWT: <code>bash scripts/laptop_jwt_setup.sh</code>. demo سريعة: <code>SKIP_WEBHOOK=1 bash scripts/demo_3min.sh</code>",
    "dashboard.title": "Dashboard — بعد التثبيت (Pro اختياري)",
    "dashboard.where": "<strong>مهم:</strong> لوحة التحكم <em>لا</em> تعمل على هذا الموقع. <code>localhost:3001</code> على <strong>جهاز Linux</strong> حيث ثبّت — localhost للزائر ليس خادمك.",
    "dashboard.body": "<p><strong>Pro dashboard</strong> (Next.js): fleet، سجل الحظر، الاختبارات وPDF. يستمع على <code>:3001</code> بـ TLS. قوِّ بـ <code>laptop_harden.sh</code> قبل الإنترنت.</p>",
    "dashboard.access_title": "من يصل ومتى؟",
    "dashboard.access_row1_label": "زائر الموقع",
    "dashboard.access_row1": "يقرأ هذه الصفحة وينزّل المصدر أو .deb — <strong>لا</strong> يفتح المنفذ 3001.",
    "dashboard.access_row2_label": "المثبت",
    "dashboard.access_row2": "بعد <code>install.sh</code> + <code>dashboard_dev.sh</code> على Ubuntu/Debian: <code>http://localhost:3001</code> <strong>على نفس الجهاز</strong>.",
    "dashboard.access_row3_label": "VPS بعيد",
    "dashboard.access_row3": "نفق SSH أو (إذا سمح firewall) <code>https://SERVER_IP:3001</code>. لا تفتح بكلمة demo.",
    "dashboard.req_title": "متطلبات إضافية للوحة",
    "dashboard.req_body": "<ul><li><strong>Core</strong> يحتاج nginx + sudo — dashboard <em>غير مطلوب</em></li><li><strong>Dashboard</strong>: Docker + <code>dashboard_dev.sh</code></li><li><strong>Grafana</strong>: أيضاً <code>grafana_stack.sh</code> (اختياري)</li></ul>",
    "dashboard.start_title": "ابدأ على خادمك",
    "dashboard.start": "# On the machine where you installed (not this website):\nbash scripts/dashboard_refresh.sh\n# Browser on the same machine:\n#   https://localhost:8443\n# Login: admin / DASHBOARD_ADMIN_PASSWORD in .env",
    "dashboard.features": "<ul><li><strong>Fleet:</strong> agent online/offline، آخر التنبيهات</li><li><strong>Tests:</strong> phase100, competitive-proof, bench</li><li><strong>Reports:</strong> حزمة PDF/JSON</li><li><strong>Grafana:</strong> tenant metrics via <code>bash scripts/grafana_provision.sh</code></li></ul>",
    "dashboard.optional": "<strong>هل Core كافٍ؟</strong> نعم. log → WAF → kernel ban بدون dashboard. CLI (<code>log-guardian --status</code>) وPrometheus (<code>:9091/metrics</code>) مع Core.",
    "dashboard.preview_title": "معاينة الواجهة",
    "dashboard.preview_note": "الصور أدناه أمثلة. الواجهة الحية فقط على تثبيتك.",
    "dashboard.cap1": "Fleet — agents وآخر التنبيهات",
    "dashboard.cap2": "Tests — phase100, bench, soak",
    "dashboard.cap3": "Grafana + Prometheus metrics",
    "dashboard.note": "الملخص: هذا الموقع = تنزيل وتعلّم. Dashboard = على خادمك، بعد التثبيت، اختياري.",
    "warn.title": "⚠️ قبل التعرض للإنترنت",
    "warn.p1": "Laptop/demo: كلمة المرور <code>DegistirBeni!123</code> مفتوحة عمداً.",
    "warn.p2": "VPS عام: <code>sudo env LG_NEW_PASSWORD='…' bash scripts/laptop_harden.sh</code>",
    "warn.p3": "الملفات: <code>docs/SECURITY_PROFILES.md</code>",
    "layers.title": "الطبقات",
    "layers.core": "Core",
    "layers.core_desc": "log → WAF → ipset ban (~15 دقيقة)",
    "layers.pro": "Pro",
    "layers.pro_desc": "eBPF daemon, dashboard, Grafana, fleet",
    "layers.opt": "اختياري",
    "layers.opt_desc": "XDR, Wasm marketplace, LLM Copilot",
    "layers.note": "Pro والطبقات الاختيارية إضافات؛ Core كافٍ للاستخدام اليومي.",
    "github.title": "Source code (GitHub)",
    "github.intro": "<p><strong>Linux Log Guardian</strong> is fully open source (MIT). All C source, install scripts, tests and evidence are on GitHub — you install on your own Linux server; this site is only a landing page.</p>",
    "github.releases": "Releases (.deb)",
    "github.steps_title": "Quick start (from source)",
    "github.steps_body": "<p>Clone, build, install; aim for <code>FAIL: 0</code> in <code>post_install_verify</code>. Step-by-step: <a href=\"#kurulum\">Setup</a> · proofs: <a href=\"/tests\">Tests</a>.</p>",
    "github.contrib": "<p>Issues and pull requests welcome. Do not commit API/Telegram secrets — use <code>ensure_api_security.sh</code> and <code>webhook.local.env.example</code> on install.</p>",
    "download.title": "تنزيل (حزمة .deb)",
    "download.intro": "<p>بناء الحزمة: <code>build_deb.sh</code>. التحقق بدون تثبيت: <code>test_deb_local.sh</code>.</p>",
    "download.block": "bash scripts/build_deb.sh\n# → dist/log-guardian_*.deb\nbash scripts/test_deb_local.sh",
    "download.verify": "التحقق من الحزمة (بدون تثبيت): <code>bash scripts/test_deb_local.sh</code>",
    "evidence.title": "حزمة الأدلة",
    "evidence.gate": "Laptop gate: <code>bash scripts/laptop_sprint_gate.sh</code>",
    "evidence.sync": "تحديث: <code>bash scripts/sync_evidence_pack.sh</code>",
    "tests.title": "Validation tests",
    "tests.page_title": "Validation tests",
    "tests.page_title_line1": "VALIDATION",
    "tests.page_title_line2": "TESTS",
    "tests.hero_eyebrow": "//:Proof",
    "tests.page_intro": "Same matrix as dashboard <code>/tests</code> — install gates, CRS parity, FP, ban latency, corpus recall and <strong>72h soak</strong>. Each card is automated script output.",
    "tests.matrix_title": "Full test matrix",
    "tests.matrix_desc": "From install gates to competitive proof — every row is real script output, identical to the dashboard.",
    "tests.filter_all": "All",
    "tests.filter_gate": "Install gates",
    "tests.filter_proof": "Competitive proof",
    "tests.filter_fail": "Failed",
    "tests.filter_aria": "Test matrix filter",
    "tests.filter_count": "{visible}/{total} visible",
    "tests.search_label": "Search tests",
    "tests.search_placeholder": "Test name, script or id…",
    "tests.proof_pack": "Proof pack JSON",
    "tests.hl_pass_value": "67/72",
    "tests.hl_pass_label": "Automated tests PASS",
    "tests.hl_soak_value": "72h",
    "tests.hl_soak_label": "Soak · 864 samples · 0 failures",
    "tests.hl_ban_value": "17ms",
    "tests.hl_ban_label": "Median kernel ban",
    "tests.hl_crs_value": "100%",
    "tests.hl_crs_label": "OWASP CRS parity",
    "tests.hl_fp_value": "0.2%",
    "tests.hl_fp_label": "Benign FP rate",
    "tests.hl_eps_value": "5357",
    "tests.hl_eps_label": "EPS · single-pass log-WAF",
    "tests.teaser": "Same automated test matrix as the dashboard — <strong>72 proofs</strong> (install gates, CRS, FP, ban latency, corpus, 72h soak).",
    "tests.open_full": "View all tests (72)",
    "tests.proof_pdf": "Evidence PDF",
    "tests.intro": "Same automated test matrix as the dashboard — install gates (FAIL=0), CRS parity, FP, ban latency, corpus recall and <strong>72h VPS/VM soak</strong>. Live installs refresh the same data at dashboard <code>/tests</code>.",
    "tests.note": "Raw JSON: <a href=\"/evidence/competitive-proof.json\" rel=\"noopener noreferrer\" download>competitive-proof.json</a> · PDF: <a href=\"/evidence/competitive-proof.pdf\" rel=\"noopener noreferrer\">competitive-proof.pdf</a> · Refresh: <code>bash scripts/competitive_proof.sh</code>",
    "laptop.title": "مصفوفة التحقق laptop",
    "laptop.intro": "<p>بوابة dev سريعة: sprint gate، soak 1h وdemo 3 min. Soak 72h VM: <code>laptop_soak_72h.sh --start</code>.</p>",
    "laptop.block": "SKIP_PHASE100=1 bash scripts/laptop_sprint_gate.sh\nSOAK_1H=1 bash scripts/laptop_soak_72h.sh --start\nSKIP_WEBHOOK=1 bash scripts/demo_3min.sh",
    "contact.title": "التواصل والمساهمة",
    "contact.body": "<p>أسئلة أو تعاون أو مساهمة — تواصل معنا. تقارير الأخطاء وpull requests مرحب بها.</p>",
    "contact.email_label": "البريد:",
    "footer": "Linux Log Guardian · صنع في تركيا · MIT · open source · <a href=\"mailto:kurtulusutkucenikcontact@gmail.com\">kurtulusutkucenikcontact@gmail.com</a>"
  },
  "zh": {
    "meta.description": "Linux Log Guardian — 土耳其开源 nginx WAF。log → ban 约 15 分钟。",
    "hero.title": "Linux Log Guardian",
    "hero.tag": "nginx access log → WAF/CRS → 内核封禁 · 单链 · self-hosted",
    "hero.badge_tr": "TURK",
    "hero.badge_opensource": "开源",
    "hero.badge_mit": "开源 · MIT",
    "hero.badge_core": "Core 约 15 分钟安装",
    "hero.badge_soak": "72h soak PASS",
    "hero.cta_install": "15 分钟安装",
    "hero.cta_dashboard": "仪表盘（安装后）",
    "hero.cta_tests": "Test results",
    "hero.cta_evidence": "证据包",
    "hero.cta_contact": "联系",
    "hero.cta_github": "Source on GitHub",
    "hero.proof_traction": "2.3k+ visits · 4k+ page views · 54 countries · proof PDF",
    "hero.scroll_hint": "Scroll — explore",
    "hero.enter_hint": "Click or scroll — continue",
    "enter.skip": "Skip",
    "enter.continue": "Enter",
    "section.work_eyebrow": "//:Selected",
    "section.work_title": "Selected proofs",
    "section.work_sub": "Core · Pro · Proof · Grafana — measurable outcomes in one chain.",
    "section.work_hint": "Scroll — more evidence cards",
    "compare.eyebrow": "//:Vs",
    "compare.title": "Competitor compare",
    "compare.sub": "Measured proof — Fail2ban / CrowdSec / ModSecurity architectural notes",
    "compare.col_metric": "Metric",
    "compare.col_lg": "Log Guardian",
    "compare.col_f2b": "Fail2ban",
    "compare.col_cs": "CrowdSec",
    "compare.col_mod": "ModSec + CRS",
    "compare.row_pipeline": "Log → WAF → kernel ban",
    "compare.row_recall": "Real attack recall",
    "compare.row_fp": "False positive",
    "compare.row_ban": "Ban latency",
    "compare.row_proof": "Proof pack PDF+JSON",
    "compare.row_mit": "MIT + TR docs",
    "compare.val_lg_pipeline": "Single pipeline",
    "compare.val_f2b_pipeline": "Ban only",
    "compare.val_cs_pipeline": "Fragmented",
    "compare.val_mod_pipeline": "WAF separate",
    "compare.val_lg_recall": "100% (1K+10K)",
    "compare.val_na": "—",
    "compare.val_mod_recall": "CRS parity 100%",
    "compare.val_lg_fp": "0.2%",
    "compare.val_f2b_fp": "High",
    "compare.val_cs_fp": "Medium",
    "compare.val_mod_fp": "CRS dependent",
    "compare.val_lg_ban": "~17 ms",
    "compare.val_f2b_ban": "sec–min",
    "compare.val_cs_ban": "sec",
    "compare.val_mod_ban": "Separate integration",
    "compare.val_yes": "Automatic",
    "compare.val_no": "None",
    "compare.val_cs_proof": "Partial",
    "compare.val_mod_proof": "Per module",
    "compare.val_partial": "Partial",
    "compare.val_mod_mit": "CRS open",
    "compare.sec_strength": "Strengths (measured)",
    "compare.sec_honest": "Honest limits",
    "compare.row_ja3": "Distributed / JA3 cluster",
    "compare.row_consult": "nginx inline consult",
    "compare.row_l7": "L7 application protection",
    "compare.row_stability": "Short stability (5 min)",
    "compare.row_inline_eps": "Inline regex EPS",
    "compare.row_reactive": "First request may pass",
    "compare.row_ddos": "Volumetric L3/L4 scrub",
    "compare.row_community": "Community signal network",
    "compare.row_cloud": "Edge / Cloud WAF",
    "compare.val_lg_ja3": "100% (80 IPs)",
    "compare.val_cs_ja3": "Signal-based",
    "compare.val_lg_consult": "PASS",
    "compare.val_lg_l7": "WAF + consult + eBPF",
    "compare.val_mod_l7": "CRS inline",
    "compare.val_mod_consult": "Separate module",
    "compare.val_lg_stability": "PASS (0 fail)",
    "compare.val_lg_eps": "~130 EPS (log replay)",
    "compare.val_mod_eps": "~12K EPS inline",
    "compare.val_lg_reactive": "Reactive (log line)",
    "compare.val_f2b_reactive": "Reactive",
    "compare.val_cs_reactive": "Partial",
    "compare.val_mod_reactive": "Inline block",
    "compare.val_lg_ddos": "None — CDN recommended",
    "compare.val_lg_community": "Self-hosted",
    "compare.val_cs_community": "Yes",
    "compare.val_lg_cloud": "Origin layer",
    "compare.val_mod_cloud": "Proxy mode",
    "compare.note": "Honest limit: not an inline ModSec EPS race — strength is integration + ban speed + transparent proof. See docs/VS_RAKIPLER.md",
    "compare.scroll_hint": "Scroll → explore the table",
    "compare.progress_label": "Proof discovery {pct}%",
    "bridge.eyebrow": "//:Pipeline",
    "bridge.kicker": "Single chain · self-hosted · MIT",
    "bridge.title": "Log → WAF → Kernel Ban",
    "bridge.sub": "nginx access log line to ipset ban in ~17 ms — competitors use fragmented stacks.",
    "bridge.s1": "log",
    "bridge.s2": "CRS",
    "bridge.s3": "ban",
    "bridge.s4": "proof",
    "why.eyebrow": "//:Why",
    "why.title": "Why Log Guardian?",
    "why.lead": "Competitors are piecemeal — we ship measurable proof in one chain.",
    "why.c1_title": "One pipeline",
    "why.c1_body": "nginx log → OWASP CRS → ~17 ms kernel ban. No Fail2ban + ModSec + script pile.",
    "why.c2_title": "Transparent proof",
    "why.c2_body": "competitive-proof PDF, 67 tests, 72h soak — missing or partial elsewhere.",
    "why.c3_title": "MIT · Turkey",
    "why.c3_body": "Open source, Turkish docs, self-hosted — no vendor lock-in.",
    "why.c4_title": "Honest limits",
    "why.c4_body": "Not ModSec inline EPS; no Cloudflare absorb. Origin integration + speed.",
    "evidence.preview_pdf": "Competitor compare PDF — measured bench summary",
    "evidence.preview_json": "competitive-proof JSON — machine-readable metrics",
    "evidence.preview_bench": "ModSecurity CRS parity + EPS comparison",
    "evidence.preview_fp": "200 benign requests — false positive rate",
    "evidence.preview_ban": "Kernel ban latency — ~17 ms ipset",
    "evidence.preview_soak": "72h soak report — 864 samples, 0 fail",
    "evidence.preview_soak_md": "Soak summary — operator notes",
    "evidence.preview_sprint": "Sprint prod gate — FAIL:0 proof",
    "evidence.preview_siem": "SIEM export — Splunk/Elastic compatibility",
    "evidence.preview_taxii": "TAXII feed integration test",
    "evidence.preview_vm": "VirtualBox VM sprint proof",
    "evidence.preview_geoip": "GeoIP MMDB — attack map data",
    "evidence.preview_webhook": "Webhook route proof — alert pipeline",
    "evidence.preview_telegram": "Telegram live webhook test",
    "pager.sec_bridge": "Pipeline bridge",
    "pager.sec_why": "Why LG",
    "hero.eyebrow": "//:LOG→BAN",
    "marquee.line": "nginx log → WAF → kernel ban · 67 tests · 72h soak PASS · MIT self-hosted · Turkey · open source",
    "showcase.core.eyebrow": "//:Core",
    "showcase.core.title": "What=\"we do\"",
    "showcase.core.desc": "Single chain: nginx access log → OWASP CRS → ~17 ms kernel ban. Production-ready in ~15 minutes.",
    "showcase.pro.eyebrow": "//:Pro",
    "showcase.pro.title": "Pro=\"SOC\"",
    "showcase.pro.desc": "Fleet, SOC timeline, Grafana — optional layer on your server after install.",
    "showcase.proof.eyebrow": "//:Proof",
    "showcase.core.peek": "Single chain · ~17 ms ban",
    "showcase.pro.peek": "Fleet · SOC timeline",
    "showcase.proof.peek": "67 tests ·                                                                        72h soak PASS",
    "showcase.proof.title": "Proof=\"67 tests\"",
    "showcase.proof.desc": "68 automated tests, competitive PDF, 72h soak — same matrix as dashboard /tests.",
    "showcase.cta": "Discover",
    "showcase.core.short": "CORE",
    "showcase.core.tag1": "~17 ms ban",
    "showcase.core.tag2": "OWASP CRS",
    "showcase.pro.short": "SOC",
    "showcase.pro.tag1": "Fleet",
    "showcase.pro.tag2": "Timeline",
    "showcase.proof.short": "PROOF",
    "showcase.proof.tag1": "67 tests",
    "showcase.proof.tag2": "72h soak",
    "showcase.grafana.short": "METRICS",
    "showcase.grafana.eyebrow": "//:Metrics",
    "showcase.grafana.title": "Grafana=\"SOC\"",
    "showcase.grafana.desc": "Tenant-labeled Prometheus metrics, Grafana dashboards and alert rules — self-hosted observability.",
    "showcase.grafana.peek": "Prometheus · tenant alerts",
    "showcase.grafana.tag1": "Prometheus",
    "showcase.grafana.tag2": "Alerts",
    "stats.tests_label": "Automated tests",
    "stats.eyebrow": "//:Stats",
    "stats.title": "By the numbers",
    "stats.lead": "Measured proof — automated tests, soak, ban latency, reach.",
    "stats.soak": "72h",
    "stats.soak_label": "Soak PASS",
    "stats.ban_suffix": "ms",
    "stats.ban_label": "Kernel ban",
    "stats.countries_label": "Countries reached",
    "section.about_eyebrow": "//:About",
    "section.flow_eyebrow": "//:Pipeline",
    "section.scope_eyebrow": "//:Honest",
    "section.github_eyebrow": "//:Source",
    "section.install_eyebrow": "//:Setup",
    "section.dashboard_eyebrow": "//:Pro",
    "section.layers_eyebrow": "//:Layers",
    "section.evidence_eyebrow": "//:Evidence",
    "section.tests_eyebrow": "//:Proof",
    "section.laptop_eyebrow": "//:Verify",
    "section.contact_eyebrow": "//:Contact",
    "cta.banner.title": "Ready to deploy?",
    "cta.banner.body": "Clone, install, verify FAIL:0 — Core runs without the dashboard.",
    "cta.banner.btn": "15 min setup",
    "nav.home": "Home",
    "nav.install": "Setup",
    "nav.tests": "Tests",
    "nav.compare": "Compare",
    "nav.evidence": "Evidence",
    "nav.contact": "Contact",
    "nav.prev_section": "Previous section",
    "nav.next_section": "Next section",
    "nav.index": "Index",
    "index.title": "Chapters",
    "index.close": "Close",
    "case.close": "Close",
    "case.open_hint": "Click front card — case study",
    "case.prev": "Previous case",
    "case.next": "Next case",
    "case.core.lead": "Single chain: nginx access log → OWASP CRS → ~17 ms kernel ban. Production-ready on your server in ~15 minutes — no Fail2ban + ModSec script stack.",
    "case.core.cta": "Setup guide",
    "case.pro.lead": "Optional Pro layer after Core: fleet sync, SOC timeline, Grafana dashboards — all self-hosted on your infrastructure.",
    "case.pro.cta": "Dashboard & SOC",
    "case.proof.lead": "68 automated tests, competitive-proof PDF, 72h soak — the same matrix as /tests. FAIL:0 gate before every release.",
    "case.proof.cta": "Open tests",
    "case.grafana.lead": "Prometheus metrics with tenant labels, Grafana dashboards and alert rules — observability without vendor lock-in.",
    "case.grafana.cta": "Metrics layer",
    "hero.metric_ban_val": "~17 ms",
    "hero.metric_ban": "kernel ban",
    "hero.metric_tests": "automated tests",
    "hero.metric_soak_val": "72h",
    "hero.metric_soak": "soak PASS",
    "pager.hint": "Section nav — jump with arrows",
    "pager.sec_home": "Home",
    "pager.sec_work": "Selected proofs",
    "pager.sec_compare": "Compare",
    "pager.sec_stats": "Stats",
    "pager.sec_about": "About",
    "pager.sec_install": "Install",
    "pager.sec_dashboard": "Dashboard",
    "pager.sec_tests": "Tests",
    "pager.sec_evidence": "Evidence",
    "pager.sec_contact": "Contact",
    "pager.next_to": "Next → {section}",
    "theme.label_light": "Light mode",
    "theme.label_dark": "Dark mode",
    "about.title": "关于 — Linux Log Guardian",
    "site.purpose": "<strong>这是公开的落地与下载页。</strong> 静态内容：概览、安装指南、证据包与联系。Log Guardian 不在此运行 — 请安装到您自己的 Linux 服务器。",
    "about.body": "<p><strong>Linux Log Guardian</strong> 是土耳其开发的 <strong>开源 (MIT)</strong> self-hosted 安全栈。一条链：<em>读 nginx 日志 → OWASP CRS 规则 → 内核级封禁</em>。</p><p>独立社区项目 — 代码审查、定制与本地托管，无云锁定。</p><ul><li>源码透明；欢迎社区贡献</li><li>二进制：<code>log-guardian</code> · 包：<code>log-guardian_*.deb</code></li><li><strong>Core</strong> 单独即可生产 (~15 分钟)</li><li>Dashboard、Grafana、fleet = 可选 <strong>Pro</strong> 层</li></ul>",
    "flow.title": "单链：从日志到内核封禁",
    "flow.s1": "nginx access log",
    "flow.s2": "Parser + CRS/WAF",
    "flow.s3": "Ban pipeline",
    "flow.s4": "ipset / kernel",
    "flow.s5": "指标 + dashboard",
    "flow.note": "XDR、Wasm 市场与 LLM Copilot 为长期可选层 — Core 单独即可生产。",
    "scope.honest.title": "Honest limits (not competing on edge speed)",
    "scope.honest.body": "<ul><li><strong>Reactive architecture</strong> — first request may pass until the log line is parsed; we are not inline ModSec throughput.</li><li><strong>L7 application layer</strong> — CRS/WAF, nginx consult, and eBPF HTTP probe; this is not volumetric L3/L4 scrub.</li><li><strong>No volumetric L3/L4 DDoS absorb</strong> — use CDN/Cloudflare on top.</li><li><strong>Distributed botnets</strong> — per-IP ban; no CrowdSec signal network.</li><li><strong>We do:</strong> log → CRS/WAF → ~17&nbsp;ms kernel ban, proof PDF, Telegram ops, MIT self-hosted.</li></ul>",
    "install.title": "安装指南（详细）",
    "install.intro": "<p>在 Ubuntu/Debian 上<strong>生产环境</strong>分步安装。笔记本或 VirtualBox VM 可无 XDP 运行。完整文档：<code>docs/QUICKSTART_NGINX.md</code> 与 <code>docs/LAPTOP_OPS.md</code>。</p>",
    "install.terminal_label": "15-minute install — live terminal",
    "install.terminal_demo": "$ sudo dpkg -i log-guardian_*_amd64.deb\nSelecting previously unselected package log-guardian.\nlog-guardian installed.\n$ sudo bash /usr/local/share/log-guardian/scripts/install_first_run.sh\n[OK] log-guardian.service active\n[OK] --health IPC\n[OK] API fail-closed (unauthenticated 403)\n\n=== summary ===\n  FAIL: 0   WARN: 0\n[OK] post_install_verify — install gate passed",
    "install.expect_label": "Expected output (sample):",
    "install.deb_title": "A) Fresh server — .deb package (recommended)",
    "install.deb_body": "<p>No compile step. Ships binaries, systemd, rules and scripts. <strong>Upgrade-safe:</strong> existing <code>/etc/log-guardian/rules.conf</code> is preserved.</p><p><strong>Download:</strong> <a href=\"https://github.com/kurtulusutkucenik/Linux-Log-Guardian/releases\">GitHub Releases</a> (<code>log-guardian_*_amd64.deb</code>) or build from repo: <code>bash scripts/build_deb.sh</code> → <code>dist/</code>.</p>",
    "install.deb_s1_title": "1. Dependencies",
    "install.deb_s1_body": "<p>Install Debian package dependencies on first setup. nginx can be added in the same command if missing.</p>",
    "install.block_deb_deps": "sudo apt-get update\nsudo apt-get install -y ipset libbpf1 libcurl4 libpcre2-8-0 libsqlite3-0 \\\n  libssl3 libelf1 libz1 liburing2 nginx",
    "install.out_deb_deps": "Reading package lists... Done\nSetting up ipset (7.x) ...\nSetting up libbpf1:amd64 ...\nSetting up nginx (1.x) ...",
    "install.deb_s2_title": "2. Install package",
    "install.deb_s2_body": "<p>If <code>dpkg -i</code> reports missing dependencies, run <code>apt-get install -f</code>. postinst creates the <code>log-guardian</code> user, permissions and services automatically.</p>",
    "install.block_deb": "# Copy .deb to server (scp, wget, USB...)\nsudo dpkg -i log-guardian_*_amd64.deb\nsudo apt-get install -f   # if dependencies missing\n\n# On success:\n#   log-guardian kuruldu.\n#   sudo bash .../install_first_run.sh\n#   bash .../post_install_verify.sh",
    "install.out_deb": "Selecting previously unselected package log-guardian.\n(Reading database ... 100%)\nSetting up log-guardian (72e5a7b) ...\n[deb_post_install] rules.conf olusturuldu: /etc/log-guardian/rules.conf\n\nlog-guardian kuruldu.",
    "install.deb_s3_title": "3. First run & verification",
    "install.deb_s3_body": "<p>Prepares nginx log format, FP trust and API security in one pass. Scripts live under <code>/usr/local/share/log-guardian/scripts/</code>.</p>",
    "install.block_deb_first": "sudo bash /usr/local/share/log-guardian/scripts/install_first_run.sh\nsudo bash /usr/local/share/log-guardian/scripts/ensure_api_security.sh\nbash /usr/local/share/log-guardian/scripts/post_install_verify.sh",
    "install.out_deb_first": "[OK] log-guardian.service active\n[OK] log-guardian-daemon.service active\n[OK] --health IPC\n[OK] API fail-closed (tokensiz 403)\n\n=== ozet ===\n  FAIL: 0   WARN: 0\n[OK] post_install_verify — kurulum kapisi gecti",
    "install.src_title": "B) Source — build and install",
    "install.src_body": "<p>Clone from <a href=\"https://github.com/kurtulusutkucenik/Linux-Log-Guardian\">GitHub</a> and build locally. Best for development and full source review.</p>",
    "install.req_title": "要求",
    "install.req_body": "<ul><li>Ubuntu 22.04 / 24.04 或 Debian 12 (amd64)</li><li>nginx 可写 access log</li><li>root/sudo (systemd, ipset, <code>/etc/log-guardian</code>)</li><li>可选 Pro：Docker (dashboard/Grafana)、适合 eBPF 的内核</li></ul>",
    "install.s1_title": "源码或 .deb",
    "install.s1_body": "<p>克隆、编译并运行主安装脚本。<code>install.sh</code> 配置 systemd、规则与 nginx 日志格式。</p>",
    "install.block1": "git clone https://github.com/kurtulusutkucenik/Linux-Log-Guardian.git\ncd Linux-Log-Guardian\nmake -j$(nproc)\nsudo bash install.sh",
    "install.s2_title": "首次运行与 API 安全",
    "install.s2_body": "<p>启动服务并为 dashboard 准备 API token 同步。</p>",
    "install.block_api": "sudo bash scripts/install_first_run.sh\nsudo bash scripts/ensure_api_security.sh\nbash scripts/sync_dashboard_api_token.sh",
    "install.common_title": "Shared steps (after A or B)",
    "install.s3_title": "Nginx 日志格式",
    "install.s3_body": "<p>WAF 需要 <code>log_guardian</code> 格式读取 body 与 XFF。安装器通常会自动应用 — 请验证：</p>",
    "install.block_nginx": "# examples/nginx-log-guardian.conf → site config\nSTRICT=1 bash scripts/check_nginx_log_format.sh\nsudo nginx -t && sudo systemctl reload nginx",
    "install.s4_title": "验证",
    "install.s4_body": "<p>检查健康、告警与 Prometheus 指标。笔记本上 <code>post_install_verify.sh</code> 可汇总。</p>",
    "install.block_verify": "sudo log-guardian --health\nsudo log-guardian --status\n# Source install:\nbash scripts/post_install_verify.sh\n# .deb install:\nbash /usr/local/share/log-guardian/scripts/post_install_verify.sh\ncurl -s http://127.0.0.1:9091/metrics | head",
    "install.out_health": "[HEALTH] daemon IPC: OK\n[HEALTH] BPF xdp=OFF execve=OFF lineage=OFF\n[HEALTH] RCE det=0 kill=0 lineage=0 connect=0 uptime=…s",
    "install.out_verify": "[OK] log-guardian.service active\n[OK] metrics :9091\n[OK] API fail-closed (tokensiz 403)\n[OK] nginx log_guardian format\n\n=== ozet ===\n  FAIL: 0   WARN: 0\n[OK] post_install_verify — kurulum kapisi gecti",
    "install.out_metrics": "# HELP loganalyzer_log_lines_total ...\nloganalyzer_log_lines_total{tenant_id=\"default\"} 8\nloganalyzer_ban_success_total{tenant_id=\"default\"} 8",
    "install.s5_title": "VirtualBox / 无 XDP（笔记本与 VM）",
    "install.s5_body": "<p>无 eBPF/XDP 时使用 <code>--no-xdp</code> 与 ipset 封禁。服务失败则运行修复脚本。</p>",
    "install.block2": "sudo bash install.sh --no-xdp\nsudo bash scripts/install_first_run.sh\n# if service FAIL:\nsudo bash scripts/repair_no_xdp_stack.sh",
    "install.tip": "<strong>提示：</strong> JWT：<code>bash scripts/laptop_jwt_setup.sh</code>。快速 demo：<code>SKIP_WEBHOOK=1 bash scripts/demo_3min.sh</code>",
    "dashboard.title": "Dashboard — 安装后（可选 Pro）",
    "dashboard.where": "<strong>重要：</strong> dashboard <em>不</em>在此营销站运行。<code>localhost:3001</code> 在<strong>您安装的那台 Linux 机器</strong>上 — 访客的 localhost 不是您的服务器。",
    "dashboard.body": "<p><strong>Pro dashboard</strong> (Next.js)：fleet 状态、封禁历史、测试与证据 PDF。在已安装主机 <code>:3001</code> TLS 监听。上网前请用 <code>laptop_harden.sh</code> 加固。</p>",
    "dashboard.access_title": "谁何时访问？",
    "dashboard.access_row1_label": "网站访客",
    "dashboard.access_row1": "阅读本页、下载源码或 .deb — <strong>不会</strong>打开 3001 端口。",
    "dashboard.access_row2_label": "安装者",
    "dashboard.access_row2": "在 Ubuntu/Debian 上 <code>install.sh</code> + <code>dashboard_dev.sh</code> 后，<strong>同一机器</strong>打开 <code>http://localhost:3001</code>。",
    "dashboard.access_row3_label": "远程 VPS",
    "dashboard.access_row3": "SSH 隧道或（防火墙允许时）<code>https://SERVER_IP:3001</code>。勿用 demo 密码暴露公网。",
    "dashboard.req_title": "Dashboard 额外要求",
    "dashboard.req_body": "<ul><li><strong>Core</strong> 只需 nginx + sudo — dashboard <em>非必需</em></li><li><strong>Dashboard</strong> 需 Docker + <code>dashboard_dev.sh</code></li><li><strong>Grafana</strong> 另需 <code>grafana_stack.sh</code>（可选）</li></ul>",
    "dashboard.start_title": "在您的服务器上启动",
    "dashboard.start": "# On the machine where you installed (not this website):\nbash scripts/dashboard_refresh.sh\n# Browser on the same machine:\n#   https://localhost:8443\n# Login: admin / DASHBOARD_ADMIN_PASSWORD in .env",
    "dashboard.features": "<ul><li><strong>Fleet：</strong> agent 在线/离线、近期告警</li><li><strong>Tests：</strong> phase100, competitive-proof, bench</li><li><strong>Reports：</strong> PDF/JSON 证据包</li><li><strong>Grafana：</strong> tenant 指标 via <code>bash scripts/grafana_provision.sh</code></li></ul>",
    "dashboard.optional": "<strong>Core 够吗？</strong> 够。只要 log → WAF → 内核封禁可跳过 dashboard。CLI (<code>log-guardian --status</code>) 与 Prometheus (<code>:9091/metrics</code>) 随 Core 提供。",
    "dashboard.preview_title": "界面预览",
    "dashboard.preview_note": "下方截图为示例。 live UI 仅在您的安装上运行。",
    "dashboard.cap1": "Fleet — agent 与近期告警",
    "dashboard.cap2": "Tests — phase100, bench, soak",
    "dashboard.cap3": "Grafana + Prometheus 指标",
    "dashboard.note": "总结：本网站 = 下载与学习。Dashboard = 您的服务器上、安装后、可选。",
    "warn.title": "⚠️ 暴露到公网前",
    "warn.p1": "笔记本/demo：密码 <code>DegistirBeni!123</code> 故意开放。",
    "warn.p2": "公网 VPS：<code>sudo env LG_NEW_PASSWORD='…' bash scripts/laptop_harden.sh</code>",
    "warn.p3": "配置：<code>docs/SECURITY_PROFILES.md</code>",
    "layers.title": "层级",
    "layers.core": "Core",
    "layers.core_desc": "log → WAF → ipset 封禁 (~15 分钟)",
    "layers.pro": "Pro",
    "layers.pro_desc": "eBPF daemon, dashboard, Grafana, fleet",
    "layers.opt": "可选",
    "layers.opt_desc": "XDR, Wasm marketplace, LLM Copilot",
    "layers.note": "Pro 与可选层为扩展；日常使用 Core 足够。",
    "github.title": "Source code (GitHub)",
    "github.intro": "<p><strong>Linux Log Guardian</strong> is fully open source (MIT). All C source, install scripts, tests and evidence are on GitHub — you install on your own Linux server; this site is only a landing page.</p>",
    "github.releases": "Releases (.deb)",
    "github.steps_title": "Quick start (from source)",
    "github.steps_body": "<p>Clone, build, install; aim for <code>FAIL: 0</code> in <code>post_install_verify</code>. Step-by-step: <a href=\"#kurulum\">Setup</a> · proofs: <a href=\"/tests\">Tests</a>.</p>",
    "github.contrib": "<p>Issues and pull requests welcome. Do not commit API/Telegram secrets — use <code>ensure_api_security.sh</code> and <code>webhook.local.env.example</code> on install.</p>",
    "download.title": "下载 (.deb 包)",
    "download.intro": "<p>构建包：<code>build_deb.sh</code>。不安装完整性检查：<code>test_deb_local.sh</code>。</p>",
    "download.block": "bash scripts/build_deb.sh\n# → dist/log-guardian_*.deb\nbash scripts/test_deb_local.sh",
    "download.verify": "包验证（不安装）：<code>bash scripts/test_deb_local.sh</code>",
    "evidence.title": "证据包",
    "evidence.gate": "Laptop gate: <code>bash scripts/laptop_sprint_gate.sh</code>",
    "evidence.sync": "更新：<code>bash scripts/sync_evidence_pack.sh</code>",
    "tests.title": "Validation tests",
    "tests.page_title": "Validation tests",
    "tests.page_title_line1": "VALIDATION",
    "tests.page_title_line2": "TESTS",
    "tests.hero_eyebrow": "//:Proof",
    "tests.page_intro": "Same matrix as dashboard <code>/tests</code> — install gates, CRS parity, FP, ban latency, corpus recall and <strong>72h soak</strong>. Each card is automated script output.",
    "tests.matrix_title": "Full test matrix",
    "tests.matrix_desc": "From install gates to competitive proof — every row is real script output, identical to the dashboard.",
    "tests.filter_all": "All",
    "tests.filter_gate": "Install gates",
    "tests.filter_proof": "Competitive proof",
    "tests.filter_fail": "Failed",
    "tests.filter_aria": "Test matrix filter",
    "tests.filter_count": "{visible}/{total} visible",
    "tests.search_label": "Search tests",
    "tests.search_placeholder": "Test name, script or id…",
    "tests.proof_pack": "Proof pack JSON",
    "tests.hl_pass_value": "67/72",
    "tests.hl_pass_label": "Automated tests PASS",
    "tests.hl_soak_value": "72h",
    "tests.hl_soak_label": "Soak · 864 samples · 0 failures",
    "tests.hl_ban_value": "17ms",
    "tests.hl_ban_label": "Median kernel ban",
    "tests.hl_crs_value": "100%",
    "tests.hl_crs_label": "OWASP CRS parity",
    "tests.hl_fp_value": "0.2%",
    "tests.hl_fp_label": "Benign FP rate",
    "tests.hl_eps_value": "5357",
    "tests.hl_eps_label": "EPS · single-pass log-WAF",
    "tests.teaser": "Same automated test matrix as the dashboard — <strong>72 proofs</strong> (install gates, CRS, FP, ban latency, corpus, 72h soak).",
    "tests.open_full": "View all tests (72)",
    "tests.proof_pdf": "Evidence PDF",
    "tests.intro": "Same automated test matrix as the dashboard — install gates (FAIL=0), CRS parity, FP, ban latency, corpus recall and <strong>72h VPS/VM soak</strong>. Live installs refresh the same data at dashboard <code>/tests</code>.",
    "tests.note": "Raw JSON: <a href=\"/evidence/competitive-proof.json\" rel=\"noopener noreferrer\" download>competitive-proof.json</a> · PDF: <a href=\"/evidence/competitive-proof.pdf\" rel=\"noopener noreferrer\">competitive-proof.pdf</a> · Refresh: <code>bash scripts/competitive_proof.sh</code>",
    "laptop.title": "笔记本验证矩阵",
    "laptop.intro": "<p>快速 dev gate：sprint gate、1h soak 与 3 min demo。VM 72h soak：<code>laptop_soak_72h.sh --start</code>。</p>",
    "laptop.block": "SKIP_PHASE100=1 bash scripts/laptop_sprint_gate.sh\nSOAK_1H=1 bash scripts/laptop_soak_72h.sh --start\nSKIP_WEBHOOK=1 bash scripts/demo_3min.sh",
    "contact.title": "联系与贡献",
    "contact.body": "<p>问题、合作或贡献 — 欢迎联系。Bug 与 pull request 欢迎。</p>",
    "contact.email_label": "邮箱：",
    "footer": "Linux Log Guardian · 土耳其制造 · MIT · 开源 · <a href=\"mailto:kurtulusutkucenikcontact@gmail.com\">kurtulusutkucenikcontact@gmail.com</a>"
  }
};



const LANG_KEY = "lg_website_lang";
const THEME_KEY = "lg_website_theme";
const DEFAULT_LANG = "tr";
const __lgExpected = typeof document !== "undefined"
  ? (document.querySelector('meta[name="lg-integrity-i18n"]')?.getAttribute("content") || "")
  : "";
const __lgCssExpected = typeof document !== "undefined"
  ? (document.querySelector('meta[name="lg-integrity-css"]')?.getAttribute("content") || "")
  : "";
const __lgScript = typeof document !== "undefined"
  ? (document.currentScript || document.querySelector('script[src*="i18n.js"]'))
  : null;
const __lgCssLink = typeof document !== "undefined" ? document.getElementById("lg-site-css") : null;
const __lgSriOk = !!(
  __lgScript &&
  __lgExpected &&
  __lgCssExpected &&
  __lgCssLink &&
  __lgScript.integrity &&
  __lgScript.integrity === __lgExpected &&
  __lgCssLink.integrity === __lgCssExpected &&
  __lgScript.getAttribute("crossorigin") === "anonymous" &&
  !__lgCssLink.hasAttribute("crossorigin")
);
const ALLOWED_LANGS = new Set(Object.keys(I18N));
const ALLOWED_HTML_TAGS = new Set([
  "P", "STRONG", "EM", "B", "I", "UL", "OL", "LI", "CODE", "BR", "SPAN", "A"
]);
const MAX_I18N_HTML_LEN = 8192;
const UNSAFE_HTML_RE = /(<script|<iframe|<object|<embed|<link|<meta|<style|javascript:|vbscript:|data:text\/html|on[a-z]+\s*=|&#x?[0-9a-f]+;)/i;
const HTML_HINT_RE = /<[a-z!/]/i;

let __lgApplyingI18n = false;
let __lgTrustPolicy = null;

function lgEnsureTrustPolicy() {
  if (__lgTrustPolicy) return __lgTrustPolicy;
  if (typeof window !== "undefined" && window.__lgTrustPolicy) {
    __lgTrustPolicy = window.__lgTrustPolicy;
    return __lgTrustPolicy;
  }
  if (typeof window !== "undefined" && window.trustedTypes && window.trustedTypes.createPolicy) {
    try {
      __lgTrustPolicy = window.trustedTypes.createPolicy("lgI18n", {
        createHTML: (input) => String(input),
      });
    } catch (_) {
      try {
        __lgTrustPolicy = window.trustedTypes.getExistingPolicy("lgI18n");
      } catch (_2) {}
    }
    if (__lgTrustPolicy) window.__lgTrustPolicy = __lgTrustPolicy;
  }
  return __lgTrustPolicy;
}

lgEnsureTrustPolicy();

function lgTrustedHTML(html) {
  const policy = lgEnsureTrustPolicy();
  const s = String(html);
  if (policy) return policy.createHTML(s);
  return s;
}

function lgSetInnerHTML(el, html) {
  if (!el) return;
  el.innerHTML = lgTrustedHTML(html);
}

function lgChapterRingSvg() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "lg-chapter-item-ring");
  svg.setAttribute("viewBox", "0 0 36 36");
  svg.setAttribute("aria-hidden", "true");
  const track = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  track.setAttribute("class", "lg-chapter-item-ring-track");
  track.setAttribute("cx", "18");
  track.setAttribute("cy", "18");
  track.setAttribute("r", "15.5");
  track.setAttribute("fill", "none");
  track.setAttribute("stroke-width", "2");
  const fill = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  fill.setAttribute("class", "lg-chapter-item-ring-fill");
  fill.setAttribute("cx", "18");
  fill.setAttribute("cy", "18");
  fill.setAttribute("r", "15.5");
  fill.setAttribute("fill", "none");
  fill.setAttribute("stroke-width", "2");
  fill.setAttribute("pathLength", "100");
  svg.append(track, fill);
  return svg;
}

function lgPagerChevronSvg(left) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "20");
  svg.setAttribute("height", "20");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute(
    "d",
    left
      ? "M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"
      : "M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z"
  );
  path.setAttribute("fill", "currentColor");
  svg.appendChild(path);
  return svg;
}

function sanitizeHtml(html) {
  if (!html) return null;
  if (html.length > MAX_I18N_HTML_LEN) return null;
  if (/\0/.test(html)) return null;
  if (UNSAFE_HTML_RE.test(html)) return null;

  const template = document.createElement("template");
  lgSetInnerHTML(template, html);
  const out = document.createElement("div");

  function appendSafe(parent, node) {
    if (node.nodeType === Node.TEXT_NODE) {
      parent.appendChild(document.createTextNode(node.textContent));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const tag = node.tagName;
    if (!ALLOWED_HTML_TAGS.has(tag)) {
      node.childNodes.forEach((child) => appendSafe(parent, child));
      return;
    }

    const el = document.createElement(tag.toLowerCase());
    if (tag === "A") {
      const href = (node.getAttribute("href") || "").trim();
      const lower = href.toLowerCase();
      if (!href || lower.includes("javascript:") || lower.includes("data:")) return;
      const ok =
        lower.startsWith("mailto:") ||
        lower.startsWith("#") ||
        lower.startsWith("https://github.com/");
      if (!ok) return;
      el.setAttribute("href", href);
      el.setAttribute("rel", "noopener noreferrer");
      if (lower.startsWith("https://")) {
        el.setAttribute("target", "_blank");
      }
    }
    node.childNodes.forEach((child) => appendSafe(el, child));
    parent.appendChild(el);
  }

  template.content.childNodes.forEach((child) => appendSafe(out, child));
  return out.childNodes.length ? out : null;
}

function stripHtmlToText(html) {
  return String(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function mountSafeHtml(el, root) {
  el.textContent = "";
  root.childNodes.forEach((child) => {
    el.appendChild(child.cloneNode(true));
  });
}

function setSafeHtml(el, html) {
  const safeRoot = sanitizeHtml(html);
  if (safeRoot && safeRoot.childNodes.length) {
    mountSafeHtml(el, safeRoot);
    return;
  }
  const plain = stripHtmlToText(html);
  if (plain) el.textContent = plain;
}

function applyI18nElement(el, lang) {
  const key = el.getAttribute("data-i18n");
  if (!key || !/^[a-z0-9_.]+$/i.test(key)) return;
  const text = t(lang, key);
  if (text === undefined) return;
  if (el.tagName === "PRE") {
    el.textContent = text;
  } else if (HTML_HINT_RE.test(text)) {
    setSafeHtml(el, text);
  } else {
    el.textContent = text;
  }
}

function applyI18nAlt(lang) {
  document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
    const key = el.getAttribute("data-i18n-alt");
    if (!key || !/^[a-z0-9_.]+$/i.test(key)) return;
    const text = t(lang, key);
    if (text) el.setAttribute("alt", stripHtmlToText(text));
  });
}

const LG_CONTACT_USER = "kurtulusutkucenikcontact";
const LG_CONTACT_DOMAIN = "gmail.com";

function lgContactEmail() {
  return LG_CONTACT_USER + "\u0040" + LG_CONTACT_DOMAIN;
}

/** E-posta: HTML'de @ yok (CF obfuscation); JS calisinca tam adres + mailto. */
function applyContactEmail() {
  const email = lgContactEmail();
  document.querySelectorAll(".contact-plain").forEach((el) => {
    el.textContent = email;
    el.classList.add("contact-email-live");
  });
  document.querySelectorAll("[data-lg-email]").forEach((el) => {
    el.textContent = email;
  });
  document.querySelectorAll("[data-lg-email-link]").forEach((el) => {
    el.setAttribute("href", "mailto:" + email);
  });
}

function isAllowedLang(lang) {
  return typeof lang === "string" && ALLOWED_LANGS.has(lang);
}

Object.freeze(ALLOWED_HTML_TAGS);
Object.freeze(ALLOWED_LANGS);
Object.freeze(I18N);
for (const lang of Object.keys(I18N)) {
  Object.freeze(I18N[lang]);
}

function t(lang, key) {
  return I18N[lang]?.[key] ?? I18N.en?.[key] ?? I18N.tr?.[key];
}

function setLang(lang) {
  if (!isAllowedLang(lang)) lang = DEFAULT_LANG;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  const meta = document.querySelector('meta[name="description"]');
  if (meta) {
    const desc = t(lang, "meta.description");
    if (desc) meta.setAttribute("content", desc);
  }
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    const on = btn.dataset.lang === lang;
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
  __lgApplyingI18n = true;
  try {
    Array.from(document.querySelectorAll("[data-i18n]")).forEach((el) => {
      try {
        applyI18nElement(el, lang);
      } catch (_) {
        const key = el.getAttribute("data-i18n");
        const text = t(lang, key);
        if (text !== undefined) el.textContent = stripHtmlToText(text);
      }
    });
    applyI18nAlt(lang);
    applyContactEmail();
  } finally {
    __lgApplyingI18n = false;
  }
  try { sessionStorage.setItem(LANG_KEY, lang); } catch (_) {}
  updateThemeButtonLabel(lang);
  document.dispatchEvent(new CustomEvent("lg-lang-change", { detail: { lang } }));
}

function isAllowedTheme(theme) {
  return theme === "light" || theme === "dark";
}

function updateThemeButtonLabel(lang) {
  /* tema degistirici kaldirildi — yalnizca koyu mod */
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", "dark");
  try { localStorage.setItem(THEME_KEY, "dark"); } catch (_) {}
}

function getInitialTheme() {
  return "dark";
}

function getInitialLang() {
  let initial = DEFAULT_LANG;
  let hasSaved = false;
  try {
    const saved = sessionStorage.getItem(LANG_KEY);
    if (saved && isAllowedLang(saved)) { initial = saved; hasSaved = true; }
  } catch (_) {}
  if (!hasSaved) {
    const nav = (navigator.language || "").toLowerCase();
    const map = [
      ["zh", "zh"], ["ar", "ar"], ["ru", "ru"], ["pt", "pt"],
      ["es", "es"], ["fr", "fr"], ["de", "de"], ["en", "en"], ["tr", "tr"]
    ];
    for (const [prefix, code] of map) {
      if (nav.startsWith(prefix)) { initial = code; break; }
    }
  }
  return initial;
}

function purgeServiceWorkers() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.getRegistrations()
    .then((regs) => regs.forEach((r) => r.unregister()))
    .catch(() => {});
}

function installDomGuard() {
  if (!__lgSriOk || installDomGuard.done) return;
  installDomGuard.done = true;
  const blocked = new Set(["SCRIPT", "IFRAME", "OBJECT", "EMBED", "BASE"]);
  new MutationObserver((mutations) => {
    if (__lgApplyingI18n) return;
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (blocked.has(node.tagName)) { node.remove(); continue; }
        if (node.tagName === "LINK" && node.id !== "lg-site-css") { node.remove(); continue; }
        node.querySelectorAll?.("script,iframe,object,embed,base,link:not(#lg-site-css)")
          .forEach((el) => el.remove());
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
}

function prefersReducedMotion() {
  try {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (_) {
    return false;
  }
}

const LG_MQ_LITE = "(max-width: 767px), (prefers-reduced-data: reduce)";

function isMotionLite() {
  if (prefersReducedMotion()) return true;
  try {
    return window.matchMedia(LG_MQ_LITE).matches;
  } catch (_) {
    return window.innerWidth < 768;
  }
}

function allowsSpineMotion() {
  return !prefersReducedMotion();
}

function allowsHeavyMotion() {
  return allowsSpineMotion() && !isMotionLite();
}

function syncMotionClass() {
  const off = prefersReducedMotion();
  const lite = isMotionLite() && !off;
  document.body.classList.toggle("lg-motion-off", off);
  document.body.classList.toggle("lg-motion-lite", lite);
}

function initMotionMedia() {
  syncMotionClass();
  try {
    const mq = window.matchMedia(LG_MQ_LITE);
    const onChange = () => syncMotionClass();
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else if (mq.addListener) mq.addListener(onChange);
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (rm.addEventListener) rm.addEventListener("change", onChange);
    else if (rm.addListener) rm.addListener(onChange);
  } catch (_) {}
}

let __lgHeavyMotionStarted = false;
let __lgSpineReady = false;
const __lgImmersiveMouse = { x: 0.5, y: 0.5 };

function initImmersivePointer() {
  if (initImmersivePointer._on) return;
  initImmersivePointer._on = true;
  let smoothX = 0.5;
  let smoothY = 0.5;
  window.addEventListener(
    "pointermove",
    (e) => {
      __lgImmersiveMouse.x = e.clientX / Math.max(window.innerWidth, 1);
      __lgImmersiveMouse.y = e.clientY / Math.max(window.innerHeight, 1);
    },
    { passive: true }
  );
  const syncDepth = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? window.scrollY / max : 0;
    document.body.style.setProperty("--lg-scene-depth", p.toFixed(3));
  };
  window.addEventListener("scroll", syncDepth, { passive: true });
  syncDepth();
  function tickPointer() {
    smoothX += (__lgImmersiveMouse.x - smoothX) * 0.09;
    smoothY += (__lgImmersiveMouse.y - smoothY) * 0.09;
    document.body.style.setProperty("--lg-mouse-x", smoothX.toFixed(4));
    document.body.style.setProperty("--lg-mouse-y", smoothY.toFixed(4));
    requestAnimationFrame(tickPointer);
  }
  tickPointer();
}

function applyEnterDoneClasses() {
  document.body.classList.remove("lg-booting");
  document.body.classList.add("lg-ready", "lg-enter-done", "lg-atmosphere-live");
  if (document.body.classList.contains("page-home")) {
    document.body.classList.add("lg-immersive");
  }
}

function ensureSpineMotion() {
  if (__lgSpineReady || !allowsSpineMotion()) return;
  if (!document.body.classList.contains("page-home")) return;
  __lgSpineReady = true;
  initAtmospherePage();
}

function initMotionHeavy() {
  ensureSpineMotion();
  if (__lgHeavyMotionStarted || !allowsHeavyMotion()) return;
  __lgHeavyMotionStarted = true;
  initAtmospherePage();
}

function scheduleHeavyMotion() {
  ensureSpineMotion();
  if (!allowsHeavyMotion()) return;
  const run = () => initMotionHeavy();
  if (document.body.classList.contains("lg-enter-done")) {
    run();
    return;
  }
  try {
    if (sessionStorage.getItem("lg_enter_rev6") === "1") {
      run();
      return;
    }
  } catch (_) {}
  document.addEventListener("lg-enter-complete", run, { once: true });
}

function initScrollProgress() {
  const bar = document.querySelector(".lg-scroll-progress");
  if (!bar) return;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? window.scrollY / max : 0;
    bar.style.transform = "scaleX(" + Math.min(1, Math.max(0, p)) + ")";
  };
  window.addEventListener("scroll", update, { passive: true });
  update();
}

function initScrollSectionLabel() {
  const label = document.getElementById("lg-scroll-section-label");
  if (!label || !document.body.classList.contains("page-home")) return;
  let lang = getInitialLang();
  const sync = (idx) => {
    const sections = getPageSections();
    const sec = sections[idx];
    if (!sec) return;
    const name = t(lang, sec.key) || "";
    label.textContent = name;
    label.hidden = !name;
  };
  document.addEventListener("lg-section-change", (e) => {
    if (e.detail && typeof e.detail.index === "number") sync(e.detail.index);
  });
  document.addEventListener("lg-lang-change", (e) => {
    if (e.detail && e.detail.lang) lang = e.detail.lang;
    const sections = getPageSections();
    const mid = window.innerHeight * 0.42;
    let best = 0;
    let bestDist = Infinity;
    sections.forEach((sec, i) => {
      const rect = sec.el.getBoundingClientRect();
      const dist = Math.abs(rect.top + rect.height * 0.35 - mid);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    sync(best);
  });
  const sections = getPageSections();
  if (sections.length) sync(0);
}

function initNavScroll() {
  const nav = document.querySelector(".app-nav");
  if (!nav) return;
  const onScroll = () => nav.classList.toggle("lg-nav-scrolled", window.scrollY > 20);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function ensureHeroVisible() {
  if (!document.body.classList.contains("page-home")) return;
  document.querySelectorAll(".lg-hero-inner.lg-reveal, .lg-hero-inner").forEach((el) => {
    el.classList.add("lg-visible");
  });
  document.querySelectorAll(".lg-motion-title .lg-motion-word").forEach((w) => {
    w.classList.add("lg-motion-word-on");
  });
}

function initReveal() {
  ensureHeroVisible();
  const sel = ".lg-reveal, .lg-reveal-fade, .lg-reveal-scale, .lg-reveal-left, .lg-reveal-right, .lg-reveal-blur, .lg-stagger, .lg-showcase, .lg-stats, .lg-marquee, .lg-motion-rail-head, .lg-motion-compare-head, .lg-compare-note";
  observeReveal(document.querySelectorAll(sel));
}

let __lgRevealObs = null;

function observeReveal(els) {
  if (!els.length) return;
  if (prefersReducedMotion()) {
    els.forEach((el) => el.classList.add("lg-visible"));
    return;
  }
  if (!__lgRevealObs) {
    __lgRevealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("lg-visible");
          e.target.querySelectorAll(".lg-stagger").forEach((s) => s.classList.add("lg-visible"));
          __lgRevealObs.unobserve(e.target);
        });
      },
      { threshold: 0.06, rootMargin: "0px 0px -2% 0px" }
    );
  }
  els.forEach((el) => {
    if (!el.classList.contains("lg-visible")) {
      __lgRevealObs.observe(el);
    }
  });
}

function lgRefreshReveal() {
  const sel = ".lg-reveal:not(.lg-visible), .lg-reveal-fade:not(.lg-visible), .lg-reveal-scale:not(.lg-visible), .lg-reveal-left:not(.lg-visible), .lg-reveal-right:not(.lg-visible), .lg-reveal-blur:not(.lg-visible), .lg-stagger:not(.lg-visible), .lg-stats:not(.lg-visible), .lg-marquee:not(.lg-visible)";
  observeReveal(document.querySelectorAll(sel));
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function animateCounter(el, target, duration, format) {
  const start = performance.now();
  const from = 0;
  const fmt = typeof format === "function" ? format : (n) => String(n);
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const n = Math.round(from + (target - from) * easeOutCubic(t));
    el.textContent = fmt(n);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function initCounters() {
  const countEls = document.querySelectorAll("[data-lg-count]");
  const msEls = document.querySelectorAll("[data-lg-count-ms]");
  const hEls = document.querySelectorAll("[data-lg-count-h]");
  if (!countEls.length && !msEls.length && !hEls.length) return;

  const applyStatic = () => {
    countEls.forEach((el) => {
      el.textContent = el.getAttribute("data-lg-count") || "0";
    });
    msEls.forEach((el) => {
      const n = el.getAttribute("data-lg-count-ms") || "0";
      el.textContent = "~" + n + " ms";
    });
    hEls.forEach((el) => {
      const n = el.getAttribute("data-lg-count-h") || "0";
      el.textContent = n + "h";
    });
  };

  if (prefersReducedMotion()) {
    applyStatic();
    return;
  }

  const targets = [...countEls, ...msEls, ...hEls];
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        if (el.hasAttribute("data-lg-count-ms")) {
          const target = parseInt(el.getAttribute("data-lg-count-ms") || "0", 10);
          if (Number.isFinite(target)) animateCounter(el, target, 1600, (n) => "~" + n + " ms");
        } else if (el.hasAttribute("data-lg-count-h")) {
          const target = parseInt(el.getAttribute("data-lg-count-h") || "0", 10);
          if (Number.isFinite(target)) animateCounter(el, target, 1400, (n) => n + "h");
        } else {
          const target = parseInt(el.getAttribute("data-lg-count") || "0", 10);
          if (Number.isFinite(target)) animateCounter(el, target, 1400);
        }
        obs.unobserve(el);
      });
    },
    { threshold: 0.35 }
  );
  targets.forEach((el) => obs.observe(el));
}

function initParallax() {
  const layers = document.querySelectorAll("[data-lg-parallax]");
  if (!layers.length || prefersReducedMotion() || isMotionLite()) return;
  let ticking = false;
  const update = () => {
    ticking = false;
    const y = window.scrollY;
    layers.forEach((el) => {
      const rate = parseFloat(el.getAttribute("data-lg-parallax") || "0.1");
      el.style.transform = "translate3d(0, " + (y * rate) + "px, 0)";
    });
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true }
  );
  update();
}

function initPageReady() {
  const hero = document.querySelector(".lg-hero-inner");
  if (hero && !prefersReducedMotion()) {
    requestAnimationFrame(() => hero.classList.add("lg-visible"));
  }
}

function easeOutCubic(p) {
  return 1 - Math.pow(1 - p, 3);
}

const ENTER_DURATION_HOME = 5500;
const ENTER_DURATION_TESTS = 2800;

function setEnterGoReady() {
  const actions = document.getElementById("lg-motion-enter-actions");
  const goBtn = document.getElementById("lg-motion-enter-go");
  if (actions) actions.classList.add("lg-motion-enter-ready");
  if (goBtn) {
    goBtn.disabled = false;
    goBtn.removeAttribute("aria-disabled");
  }
}

function runEnterCounter(onComplete) {
  const el = document.getElementById("lg-motion-counter");
  const isTests = document.body.classList.contains("page-tests");
  const duration = isTests ? ENTER_DURATION_TESTS : ENTER_DURATION_HOME;
  if (!el || prefersReducedMotion()) {
    if (typeof onComplete === "function") onComplete();
    return;
  }
  const start = performance.now();
  let done = false;
  let goReady = false;
  const finish = () => {
    if (done) return;
    done = true;
    window.clearInterval(iv);
    el.textContent = "100%";
    el.classList.add("lg-motion-counter-done");
    setEnterGoReady();
    if (typeof onComplete === "function") onComplete();
  };
  const tick = (now) => {
    if (done) return;
    const p = Math.min(1, (now - start) / duration);
    const eased = easeOutCubic(p);
    const n = Math.round(eased * 100);
    el.textContent = n + "%";
    if (p >= 0.72 && !goReady) {
      goReady = true;
      setEnterGoReady();
    }
    if (p < 1) {
      requestAnimationFrame(tick);
    } else {
      finish();
    }
  };
  requestAnimationFrame(tick);
  const iv = window.setInterval(() => {
    const p = Math.min(1, (performance.now() - start) / duration);
    const n = Math.round(easeOutCubic(p) * 100);
    el.textContent = n + "%";
    if (p >= 0.72 && !goReady) {
      goReady = true;
      setEnterGoReady();
    }
    if (p >= 1) finish();
  }, 80);
}

function waitForTestsRendered() {
  if (document.body.classList.contains("lg-tests-ready")) {
    return Promise.resolve();
  }
  return Promise.race([
    new Promise((resolve) => {
      document.addEventListener("lg-tests-rendered", resolve, { once: true });
    }),
    new Promise((resolve) => {
      window.setTimeout(resolve, 2500);
    }),
  ]);
}

function forceFinishEnter() {
  const enter = document.getElementById("lg-motion-enter");
  if (enter && !enter.classList.contains("lg-motion-enter-out")) {
    enter.classList.add("lg-motion-enter-out");
    enter.setAttribute("aria-hidden", "true");
  }
  applyEnterDoneClasses();
  try {
    sessionStorage.setItem("lg_enter_rev6", "1");
  } catch (_) {}
  ensureSpineMotion();
  document.dispatchEvent(new CustomEvent("lg-enter-complete"));
}

function initEnterSkip(onFinish) {
  const enter = document.getElementById("lg-motion-enter");
  const skipBtn = document.getElementById("lg-motion-enter-skip");
  const goBtn = document.getElementById("lg-motion-enter-go");
  if (!enter) return;
  const finish = () => {
    if (document.body.classList.contains("lg-enter-done")) return;
    forceFinishEnter();
    if (typeof onFinish === "function") onFinish();
  };
  const skip = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    finish();
  };
  if (skipBtn) skipBtn.addEventListener("click", skip);
  if (goBtn) {
    goBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!goBtn.disabled) finish();
    });
  }
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") skip(e);
    if (e.key === "Enter" && goBtn && !goBtn.disabled) skip(e);
  });
}

function initNavDismissEnter() {
  document.querySelectorAll(".app-nav a, .skip-link").forEach((a) => {
    a.addEventListener("click", () => forceFinishEnter(), { capture: true });
  });
}

function initEnterCurtain() {
  const enter = document.getElementById("lg-motion-enter");
  const isTests = document.body.classList.contains("page-tests");

  if (!enter) {
    applyEnterDoneClasses();
    ensureSpineMotion();
    return Promise.resolve();
  }

  if (document.body.classList.contains("lg-enter-done")) {
    return Promise.resolve();
  }

  const enterDuration = isTests ? ENTER_DURATION_TESTS : ENTER_DURATION_HOME;
  const hardMaxMs = enterDuration + 1200;

  if (window.__lgEnterBoot && window.__lgEnterBoot.active) {
    return new Promise((resolve) => {
      if (document.body.classList.contains("lg-enter-done")) {
        resolve();
        return;
      }
      const onDone = () => resolve();
      document.addEventListener("lg-enter-complete", onDone, { once: true });
      window.setTimeout(() => {
        if (!document.body.classList.contains("lg-enter-done")) forceFinishEnter();
        resolve();
      }, hardMaxMs);
    });
  }

  let seen = false;
  try {
    seen = sessionStorage.getItem("lg_enter_rev6") === "1";
  } catch (_) {}

  if (seen || prefersReducedMotion()) {
    forceFinishEnter();
    return Promise.resolve();
  }

  return (isTests ? waitForTestsRendered() : Promise.resolve()).then(
    () =>
      new Promise((resolve) => {
        initEnterSkip(resolve);
        initNavDismissEnter();
        const hardTimer = window.setTimeout(forceFinishEnter, hardMaxMs);
        const finish = () => {
          window.clearTimeout(hardTimer);
          if (document.body.classList.contains("lg-enter-done")) {
            resolve();
            return;
          }
          enter.classList.add("lg-motion-enter-out");
          document.body.classList.add("lg-enter-done");
          document.body.classList.remove("lg-booting");
          document.body.classList.add("lg-ready");
          try {
            sessionStorage.setItem("lg_enter_rev6", "1");
          } catch (_) {}
          window.setTimeout(() => {
            enter.setAttribute("aria-hidden", "true");
            document.dispatchEvent(new CustomEvent("lg-enter-complete"));
            resolve();
          }, 1100);
        };
        runEnterCounter(() => {
          const fontsReady =
            !document.fonts || typeof document.fonts.ready === "undefined"
              ? Promise.resolve()
              : document.fonts.ready;
          fontsReady.then(() => window.setTimeout(finish, 280));
        });
      })
  );
}

function resetTitleSplit() {
  document.querySelectorAll(".lg-motion-title-split, .lg-motion-title-chars").forEach((el) => {
    const label = el.getAttribute("aria-label");
    if (label) el.textContent = label;
    el.classList.remove("lg-motion-title-split", "lg-motion-title-chars");
    el.removeAttribute("aria-label");
  });
}

function initTitleSplit() {
  if (prefersReducedMotion()) return;
  resetTitleSplit();

  function splitWords(title, opts) {
    if (!title || title.querySelector(".lg-motion-word")) return;
    const raw = (title.textContent || "").trim();
    if (!raw) return;
    title.textContent = "";
    title.setAttribute("aria-label", raw);
    title.classList.add("lg-motion-title-split");
    const baseDelay = opts.baseDelay || 180;
    const step = opts.step || 72;
    const parts = raw.split(/(\s+)/);
    let wi = 0;
    parts.forEach((part) => {
      if (!part) return;
      const span = document.createElement("span");
      span.className = "lg-motion-word";
      if (/^\s+$/.test(part)) {
        span.textContent = "\u00a0";
        span.classList.add("lg-motion-word-space");
      } else {
        span.textContent = part;
        const delay = baseDelay + wi * step;
        wi += 1;
        window.setTimeout(() => span.classList.add("lg-motion-word-on"), delay);
      }
      title.appendChild(span);
    });
    bindTitleScrollOpacity(title);
  }

  function splitChars(el, opts) {
    if (!el || el.querySelector(".lg-motion-char")) return;
    const raw = (el.textContent || "").trim();
    if (!raw) return;
    el.textContent = "";
    el.setAttribute("aria-label", raw);
    el.classList.add("lg-motion-title-chars");
    const baseDelay = opts.baseDelay || 220;
    const step = opts.step || 38;
    [...raw].forEach((ch, i) => {
      const span = document.createElement("span");
      span.className = "lg-motion-char";
      span.textContent = ch;
      window.setTimeout(() => span.classList.add("lg-motion-char-on"), baseDelay + i * step);
      el.appendChild(span);
    });
  }

  [
    { sel: ".lg-motion-title", baseDelay: 180, step: 72 },
    { sel: ".lg-motion-bridge-title", baseDelay: 420, step: 48 },
    { sel: ".lg-motion-stats-title", baseDelay: 280, step: 56 },
    { sel: ".lg-motion-compare-title", baseDelay: 320, step: 44 },
  ].forEach(({ sel, baseDelay, step }) => {
    const title = document.querySelector(sel);
    splitWords(title, { baseDelay, step });
  });

  document.querySelectorAll(".lg-tests-title-line").forEach((line, li) => {
    splitChars(line, { baseDelay: 280 + li * 180, step: 42 });
  });
}

function bindTitleScrollOpacity(title) {
  if (prefersReducedMotion()) return;
  const update = () => {
    const rect = title.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = 1 - Math.min(1, Math.max(0, (rect.top - vh * 0.12) / Math.max(vh * 0.55, 1)));
    title.style.setProperty("--lg-title-scroll-o", p.toFixed(3));
  };
  window.addEventListener("scroll", update, { passive: true });
  update();
}

function initHeroCanvas() {
  const canvas = document.getElementById("lg-motion-canvas");
  const hero = document.querySelector(".lg-motion-hero");
  if (!canvas || !hero || !allowsHeavyMotion()) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let w = 0;
  let h = 0;
  let particles = [];
  let raf = 0;
  let mouse = { x: -9999, y: -9999 };

  const count = () => Math.min(48, Math.max(20, Math.floor((w * h) / 28000)));

  function resize() {
    const rect = hero.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.max(1, Math.floor(rect.width));
    h = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = count();
    particles = Array.from({ length: n }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: 0.12 + Math.random() * 0.45,
      vy: (Math.random() - 0.5) * 0.18,
      r: 0.5 + Math.random() * 1.6,
      hue: Math.random() > 0.5 ? "amber" : "violet",
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const linkDist = Math.min(140, w * 0.18);
    const mx = mouse.x;
    const my = mouse.y;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x > w + 8) {
        p.x = -4;
        p.y = Math.random() * h;
      }
      if (p.y < 0 || p.y > h) p.vy *= -1;

      if (mx > 0) {
        const dx = mx - p.x;
        const dy = my - p.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 22000) {
          p.x -= dx * 0.0012;
          p.y -= dy * 0.0006;
        }
      }

      if (p.hue === "amber" && p.r > 1.2) {
        ctx.beginPath();
        ctx.moveTo(p.x - p.vx * 8, p.y - p.vy * 8);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = "rgba(210, 175, 120, 0.22)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle =
        p.hue === "violet" ? "rgba(120, 80, 140, 0.48)" : "rgba(210, 175, 120, 0.42)";
      ctx.fill();

      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > linkDist) continue;
        const alpha = (1 - dist / linkDist) * 0.16;
        ctx.strokeStyle = "rgba(180, 140, 120, " + alpha + ")";
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
    }
    raf = requestAnimationFrame(draw);
  }

  const onMove = (e) => {
    const rect = hero.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  };
  const onLeave = () => {
    mouse.x = -9999;
    mouse.y = -9999;
  };

  resize();
  draw();
  window.addEventListener("resize", resize, { passive: true });
  hero.addEventListener("pointermove", onMove, { passive: true });
  hero.addEventListener("pointerleave", onLeave, { passive: true });

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    hero.removeEventListener("pointermove", onMove);
    hero.removeEventListener("pointerleave", onLeave);
  };
}

function lgSmoothstep(t) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

function ensureCardFlipStructure(cards) {
  cards.forEach((card) => {
    if (card.querySelector(".lg-motion-card-flip")) return;
    const accent = card.querySelector(".lg-motion-card-accent");
    const body = card.querySelector(".lg-motion-card-body");
    const num = body?.querySelector(".lg-motion-card-num")?.textContent?.trim() || "00";
    const peekLabel = accent?.querySelector(".lg-motion-card-peek-label")?.textContent?.trim() || "";
    const accentColor = card.getAttribute("data-lg-accent") || "#e30a17";

    const flip = document.createElement("div");
    flip.className = "lg-motion-card-flip";

    const front = document.createElement("div");
    front.className = "lg-motion-card-face lg-motion-card-face-front";
    if (accent) front.appendChild(accent);
    if (body) front.appendChild(body);

    const back = document.createElement("div");
    back.className = "lg-motion-card-face lg-motion-card-face-back";
    back.setAttribute("aria-hidden", "true");
    back.style.setProperty("--lg-card-accent", accentColor);
    back.innerHTML =
      '<div class="lg-motion-card-back-pattern" aria-hidden="true"></div>' +
      '<div class="lg-motion-card-back-stripe" aria-hidden="true"></div>' +
      '<span class="lg-motion-card-back-state lg-motion-card-back-state-read" aria-hidden="true">OKUNDU</span>' +
      '<span class="lg-motion-card-back-state lg-motion-card-back-state-unread" aria-hidden="true">SIRADA</span>' +
      '<span class="lg-motion-card-back-num">' +
      num +
      "</span>" +
      '<span class="lg-motion-card-back-label">' +
      peekLabel +
      "</span>";

    flip.appendChild(front);
    flip.appendChild(back);
    card.appendChild(flip);
  });
}

function syncCardBackFaces(cards) {
  cards.forEach((card) => {
    const back = card.querySelector(".lg-motion-card-face-back");
    if (!back) return;
    if (!back.querySelector(".lg-motion-card-back-state-read")) {
      const read = document.createElement("span");
      read.className = "lg-motion-card-back-state lg-motion-card-back-state-read";
      read.setAttribute("aria-hidden", "true");
      read.textContent = "OKUNDU";
      const unread = document.createElement("span");
      unread.className = "lg-motion-card-back-state lg-motion-card-back-state-unread";
      unread.setAttribute("aria-hidden", "true");
      unread.textContent = "SIRADA";
      back.appendChild(read);
      back.appendChild(unread);
    }
    const accentColor = card.getAttribute("data-lg-accent") || "#e30a17";
    back.style.setProperty("--lg-card-accent", accentColor);
    const num = card.querySelector(".lg-motion-card-num");
    const peek = card.querySelector(".lg-motion-card-peek-label");
    const backNum = back.querySelector(".lg-motion-card-back-num");
    const backLabel = back.querySelector(".lg-motion-card-back-label");
    if (backNum && num) backNum.textContent = num.textContent.trim();
    if (backLabel && peek) backLabel.textContent = peek.textContent.trim();
  });
}

function initCoverflowRail() {
  const wrap = document.querySelector(".lg-motion-rail-wrap");
  const stage = document.getElementById("lg-motion-coverflow-stage") || document.querySelector(".lg-motion-coverflow-stage");
  const rail = document.getElementById("lg-motion-rail");
  const bar = document.getElementById("lg-motion-rail-bar");
  const dotsWrap = document.getElementById("lg-motion-coverflow-dots");
  const ghost = document.getElementById("lg-motion-rail-ghost");
  const idxEl = document.getElementById("lg-motion-rail-idx");
  const totalEl = document.getElementById("lg-motion-rail-total");
  const activeEl = document.getElementById("lg-motion-rail-active");
  const ambient = document.getElementById("lg-motion-rail-ambient");
  const scan = document.getElementById("lg-motion-coverflow-scan");
  if (!wrap || !rail || !stage) return;

  const cards = [...rail.querySelectorAll(".lg-motion-card")];
  const n = cards.length;
  if (!n) return;

  ensureCardFlipStructure(cards);
  syncCardBackFaces(cards);

  const accents = cards.map((c) => c.getAttribute("data-lg-accent") || "#e30a17");
  const pad2 = (i) => String(i + 1).padStart(2, "0");

  if (totalEl) totalEl.textContent = String(n).padStart(2, "0");

  if (dotsWrap && !dotsWrap.childElementCount) {
    cards.forEach((_, i) => {
      const dot = document.createElement("span");
      dot.className = "lg-motion-coverflow-dot";
      dotsWrap.appendChild(dot);
    });
  }
  const dots = dotsWrap ? [...dotsWrap.querySelectorAll(".lg-motion-coverflow-dot")] : [];

  const mq = window.matchMedia("(min-width: 760px)");
  let enabled = mq.matches;
  let lastFront = -1;

  function setCardPose(card, shell, opacity) {
    card.style.setProperty("--lg-card-shell", shell);
    card.style.setProperty("--lg-card-opacity", String(opacity));
    card.style.transform = shell;
    card.style.opacity = String(opacity);
  }

  function resetCards() {
    rail.style.transform = "";
    cards.forEach((c) => {
      c.style.transform = "";
      c.style.opacity = "";
      c.style.width = "";
      c.style.removeProperty("--lg-card-shell");
      c.style.removeProperty("--lg-card-opacity");
      const flip = c.querySelector(".lg-motion-card-flip");
      if (flip) {
        flip.style.transform = "";
        flip.style.removeProperty("--lg-card-flip");
      }
      c.classList.remove(
        "lg-motion-card-front",
        "lg-motion-card-peek",
        "lg-motion-card-peek-l",
        "lg-motion-card-peek-r",
        "lg-motion-card-flipped",
        "lg-motion-card-read",
        "lg-motion-card-reading",
        "lg-motion-card-unread"
      );
    });
    dots.forEach((d) => d.classList.remove("lg-motion-coverflow-dot-on"));
    wrap.style.removeProperty("--lg-rail-accent");
  }

  function updateMeta(frontIdx, frac) {
    const num = pad2(frontIdx);
    if (ghost) ghost.textContent = num;
    if (idxEl) idxEl.textContent = num;
    const peek = cards[frontIdx]?.querySelector(".lg-motion-card-peek-label");
    if (activeEl && peek) activeEl.textContent = peek.textContent;
    const accent = accents[frontIdx] || accents[0];
    wrap.style.setProperty("--lg-rail-accent", accent);
    if (ambient) {
      ambient.style.opacity = String(0.42 + frac * 0.28);
      ambient.style.background =
        "radial-gradient(ellipse 55% 48% at 50% 46%, color-mix(in srgb, " +
        accent +
        " 38%, transparent), transparent 72%)";
    }
    if (scan) {
      const local = frac - Math.floor(frac);
      scan.style.transform = "translateY(" + (local * 100).toFixed(1) + "%)";
      scan.style.opacity = String(0.35 + Math.sin(local * Math.PI) * 0.45);
    }
    if (frontIdx !== lastFront) {
      lastFront = frontIdx;
      stage.classList.remove("lg-motion-coverflow-pulse");
      void stage.offsetWidth;
      stage.classList.add("lg-motion-coverflow-pulse");
    }
  }

  function update() {
    if (!enabled) {
      resetCards();
      if (bar) bar.style.width = "0%";
      return;
    }

    const rect = wrap.getBoundingClientRect();
    const vh = window.innerHeight;
    const total = wrap.offsetHeight - vh;
    if (total <= 0) return;
    const scrolled = Math.min(Math.max(-rect.top, 0), total);
    const p = scrolled / total;
    if (bar) bar.style.width = (p * 100).toFixed(2) + "%";

    const outer = wrap.querySelector(".lg-motion-rail-outer");
    if (!outer) return;
    const outerW = outer.clientWidth;
    const cardW = Math.min(Math.max(outerW * 0.36, 260), 420);
    const gap = cardW * 0.58;
    const rawActive = p * Math.max(n - 1, 1);
    const frontIdx = Math.min(n - 1, Math.max(0, Math.round(rawActive)));

    updateMeta(frontIdx, rawActive);

    cards.forEach((card, i) => {
      /* rel < 0 → okunmuş (sol) · rel ≈ 0 → okunuyor (merkez) · rel > 0 → okunmamış (sağ) */
      const rel = i - rawActive;
      const ad = Math.abs(rel);
      const flip = card.querySelector(".lg-motion-card-flip");

      const isReading = ad < 0.4;
      const isRead = rel < -0.08;
      const isUnread = rel > 0.08;

      card.classList.toggle("lg-motion-card-reading", isReading);
      card.classList.toggle("lg-motion-card-read", isRead && !isReading);
      card.classList.toggle("lg-motion-card-unread", isUnread && !isReading);
      card.classList.toggle("lg-motion-card-front", isReading);
      card.classList.toggle("lg-motion-card-peek", !isReading && ad <= 1.15);
      card.classList.toggle("lg-motion-card-peek-l", isRead);
      card.classList.toggle("lg-motion-card-peek-r", isUnread);
      card.classList.toggle("lg-motion-card-flipped", ad > 0.12);

      if (prefersReducedMotion()) {
        const shell = "translate(-50%, -50%) translateX(" + (rel * gap).toFixed(1) + "px)";
        setCardPose(card, shell, isReading ? 1 : isRead ? 0.55 : 0.68);
        if (flip) {
          const flipT = isReading ? "rotateY(0deg)" : "rotateY(180deg)";
          flip.style.transform = flipT;
          flip.style.setProperty("--lg-card-flip", flipT);
        }
        return;
      }

      let flipY = 0;
      if (rel > 0.04) flipY = -Math.min(180, rel * 180);
      else if (rel < -0.04) flipY = Math.min(180, -rel * 180);

      if (ad > 1.18) {
        card.style.pointerEvents = "none";
        card.style.width = cardW + "px";
        setCardPose(
          card,
          "translate(-50%, -50%) translateX(" +
            (rel * gap).toFixed(1) +
            "px) translateZ(-150px) scale(0.66)",
          0
        );
        if (flip) {
          const flipT = "rotateY(" + flipY.toFixed(2) + "deg)";
          flip.style.transform = flipT;
          flip.style.setProperty("--lg-card-flip", flipT);
        }
        return;
      }

      card.style.pointerEvents = isReading ? "auto" : "none";
      const fanY = Math.max(-14, Math.min(14, rel * -10));
      const rotX = isReading ? card._lgTiltX || 0 : 0;
      const scale =
        (isReading ? 1 - ad * 0.04 : isRead ? 0.86 - Math.min(ad, 2) * 0.03 : 0.9 - ad * 0.04) *
        (card._lgScale || 1);
      const tz = -ad * 115 + (card._lgLift || 0);
      const tx = rel * gap;
      const op = isReading ? 1 : isRead ? Math.max(0.42, 0.72 - ad * 0.14) : Math.max(0.55, 0.88 - ad * 0.12);

      card.style.zIndex = String(Math.round(230 - ad * 40));
      card.style.width = cardW + "px";
      setCardPose(
        card,
        "translate(-50%, -50%) rotateY(" +
          fanY.toFixed(2) +
          "deg) rotateX(" +
          rotX.toFixed(1) +
          "deg) translateX(" +
          tx.toFixed(1) +
          "px) translateZ(" +
          tz.toFixed(1) +
          "px) scale(" +
          scale.toFixed(3) +
          ")",
        op
      );
      if (flip) {
        const hoverY = isReading ? (card._lgTiltY || 0) * 0.35 : 0;
        const flipX = isReading ? -(card._lgTiltX || 0) * 0.25 : 0;
        const flipTransform =
          "rotateY(" + (flipY + hoverY).toFixed(2) + "deg) rotateX(" + flipX.toFixed(1) + "deg)";
        flip.style.transform = flipTransform;
        flip.style.setProperty("--lg-card-flip", flipTransform);
      }
    });

    dots.forEach((d, i) => d.classList.toggle("lg-motion-coverflow-dot-on", i === frontIdx));
    rail.style.transform = "";
  }

  function bindCardHover() {
    if (prefersReducedMotion()) return;
    cards.forEach((card) => {
      card._lgTiltX = 0;
      card._lgTiltY = 0;
      card._lgLift = 0;
      card._lgScale = 1;
      card.addEventListener("pointermove", (e) => {
        if (!card.classList.contains("lg-motion-card-front")) return;
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card._lgTiltX = -py * 10;
        card._lgTiltY = px * 12;
        card._lgLift = 22;
        card._lgScale = 1.02;
        card.classList.add("lg-motion-card-hover");
        requestAnimationFrame(update);
      });
      card.addEventListener("pointerleave", () => {
        card._lgTiltX = 0;
        card._lgTiltY = 0;
        card._lgLift = 0;
        card._lgScale = 1;
        card.classList.remove("lg-motion-card-hover");
        requestAnimationFrame(update);
      });
    });
  }

  function onMq(e) {
    enabled = e.matches;
    update();
  }

  mq.addEventListener("change", onMq);
  window.addEventListener("resize", () => requestAnimationFrame(update), { passive: true });
  window.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
  document.addEventListener("lg-lang-change", () => {
    syncCardBackFaces(cards);
    requestAnimationFrame(update);
  });
  update();
  bindCardHover();
}

function initOrbitRail() {
  initCoverflowRail();
}

function initHorizontalRail() {
  const wrap = document.querySelector(".lg-motion-rail-wrap");
  if (document.body.classList.contains("lg-clean-v2")) {
    const desktop = window.matchMedia("(min-width: 760px)").matches;
    if (desktop && wrap) {
      const cards = wrap.querySelectorAll(".lg-motion-card");
      const n = Math.max(cards.length, 4);
      wrap.classList.add("lg-scroll-stack", "lg-coverflow-live");
      wrap.style.height = Math.max(520, n * 100) + "vh";
      initCoverflowRail();
      return;
    }
    initShowcaseGrid();
    return;
  }
  initOrbitRail();
}

/** V2: düz grid — tıklanabilir kanıt kartları (Lando tarzı) */
function initShowcaseGrid() {
  const wrap = document.querySelector(".lg-motion-rail-wrap");
  const rail = document.getElementById("lg-motion-rail");
  const bar = document.getElementById("lg-motion-rail-bar");
  if (!wrap || !rail) return;

  const cards = [...rail.querySelectorAll(".lg-motion-card")];
  const stage = document.getElementById("lg-motion-coverflow-stage");
  if (stage) {
    stage.querySelectorAll(
      ".lg-motion-orbit-core, .lg-motion-coverflow-scan, .lg-motion-rail-ambient, .lg-motion-coverflow-edge, .lg-motion-rail-ghost-num, .lg-motion-rail-spine"
    ).forEach((el) => {
      if (el) el.setAttribute("hidden", "");
    });
  }

  cards.forEach((card, i) => {
    card.style.transform = "";
    card.style.opacity = "1";
    card.style.width = "";
    card.style.pointerEvents = "auto";
    const flip = card.querySelector(".lg-motion-card-flip");
    if (flip) flip.style.transform = "";
    card.classList.toggle("lg-motion-card-front", i === 0);
    card.classList.remove("lg-motion-card-peek", "lg-motion-card-peek-l", "lg-motion-card-peek-r", "lg-motion-card-flipped");
  });

  if (bar) bar.style.width = "100%";
  wrap.style.removeProperty("--lg-rail-accent");
}

function initCompareScroll() {
  const wrap = document.querySelector(".lg-motion-compare-wrap");
  const rail = document.getElementById("lg-compare-rail");
  const colsTrack = document.getElementById("lg-compare-cols-track");
  const bar = document.getElementById("lg-compare-bar");
  const label = document.getElementById("lg-compare-progress-label");
  if (!wrap || !rail) return;

  let lang = getInitialLang();

  function syncProgressLabel(p) {
    if (!label) return;
    const pct = Math.round(Math.min(1, Math.max(0, p)) * 100);
    const tpl = t(lang, "compare.progress_label") || "Kanıt keşfi %{pct}";
    label.textContent = tpl.replace("{pct}", String(pct)).replace("%{pct}", pct + "%");
  }

  const tbody = rail.querySelector(".lg-compare-table tbody");
  const revealRows = tbody
    ? [...tbody.querySelectorAll("tr.lg-compare-section, tr:not(.lg-compare-section)")]
    : [];
  revealRows.forEach((row) => row.classList.add("lg-compare-row"));
  if (prefersReducedMotion()) {
    revealRows.forEach((row) => row.classList.add("lg-compare-row-on"));
  }

  let maxShift = 0;

  function setRailTransform(tx) {
    rail.style.transform = tx;
    if (colsTrack) colsTrack.style.transform = tx;
  }

  function revealByProgress(p) {
    if (!revealRows.length || prefersReducedMotion()) return;
    const rect = wrap.getBoundingClientRect();
    const entered = rect.top <= window.innerHeight * 0.2;
    if (!entered) return;
    const n = revealRows.length;
    revealRows.forEach((row, i) => {
      const instant = i < 5;
      const threshold = instant ? 0 : Math.max(0.02, ((i - 4) / Math.max(1, n - 4)) * 0.82);
      if (p >= threshold) row.classList.add("lg-compare-row-on");
    });
  }

  function measure() {
    const outer = wrap.querySelector(".lg-motion-compare-outer");
    if (!outer) return;
    const table = rail.querySelector(".lg-compare-table");
    const cols = document.querySelector(".lg-compare-cols");
    const fluid = window.matchMedia("(min-width: 1024px)").matches;
    if (fluid && table) {
      const w = outer.clientWidth;
      table.style.width = w + "px";
      if (cols) cols.style.width = w + "px";
    } else if (table) {
      table.style.width = "";
      if (cols) cols.style.width = "";
    }
    const contentW = table ? table.offsetWidth : rail.scrollWidth;
    maxShift = Math.max(0, contentW - outer.clientWidth + 8);
    if (maxShift <= 0) {
      setRailTransform("");
      if (bar) bar.style.width = "0%";
    }
  }

  function scrollProgress() {
    const rect = wrap.getBoundingClientRect();
    const vh = window.innerHeight;
    const total = wrap.offsetHeight - vh;
    if (total <= 0) return 0;
    const scrolled = Math.min(Math.max(-rect.top, 0), total);
    return scrolled / total;
  }

  function update() {
    measure();
    const p = scrollProgress();
    revealByProgress(p);

    if (maxShift <= 0) {
      setRailTransform("");
      if (bar) bar.style.width = (p * 100).toFixed(2) + "%";
      syncProgressLabel(p);
      wrap.classList.toggle("lg-compare-active", p > 0.04 && p < 0.96);
      return;
    }
    const rect = wrap.getBoundingClientRect();
    const vh = window.innerHeight;
    const total = wrap.offsetHeight - vh;
    if (total <= 0) return;
    const scrolled = Math.min(Math.max(-rect.top, 0), total);
    const tx = "translate3d(" + (-p * maxShift).toFixed(2) + "px, 0, 0)";
    setRailTransform(tx);
    if (bar) bar.style.width = (p * 100).toFixed(2) + "%";
    syncProgressLabel(p);
    wrap.classList.toggle("lg-compare-active", p > 0.04 && p < 0.96);

    if (!prefersReducedMotion()) {
      const table = rail.querySelector(".lg-compare-table");
      if (table) {
        const tilt = (p - 0.5) * 3;
        table.style.transform = "rotateY(" + tilt.toFixed(2) + "deg)";
      }
    }
  }

  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(() => requestAnimationFrame(update));
    ro.observe(rail);
    const outer = wrap.querySelector(".lg-motion-compare-outer");
    if (outer) ro.observe(outer);
  }

  window.addEventListener("resize", () => requestAnimationFrame(update), { passive: true });
  window.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
  if (document.fonts?.ready) document.fonts.ready.then(() => requestAnimationFrame(update));
  document.addEventListener("lg-lang-change", (e) => {
    if (e.detail?.lang) lang = e.detail.lang;
    syncProgressLabel(scrollProgress());
  });
  update();
}

function initAtmospherePage() {
  if (!document.body.classList.contains("page-home")) return;
  document.body.classList.add("lg-immersive", "lg-atmosphere-live", "lg-clean-v2");
}

function initWebGLStage() {
  /* V2: WebGL devre dışı — yeniden yazım */
}

function initAmbientPulse() {
  if (prefersReducedMotion()) return;
  const root = document.getElementById("lg-bg-events");
  const ambient = document.querySelector(".lg-ambient");
  const cables = document.querySelector(".lg-cable-stage");
  let phase = 0;
  const cycle = () => {
    phase = (phase + 1) % 3;
    if (root) {
      root.classList.remove("lg-bg-phase-0", "lg-bg-phase-1", "lg-bg-phase-2");
      root.classList.add("lg-bg-phase-" + phase);
    }
    if (ambient) {
      ambient.classList.remove("lg-ambient-burst-0", "lg-ambient-burst-1", "lg-ambient-burst-2");
      ambient.classList.add("lg-ambient-burst-" + phase);
    }
    if (cables) cables.classList.add("lg-cable-pulse");
    window.setTimeout(() => cables && cables.classList.remove("lg-cable-pulse"), 900);
    document.dispatchEvent(new CustomEvent("lg-bg-pulse", { detail: { phase } }));
  };
  cycle();
  window.setInterval(cycle, 3000);
}

function initHeroScrollJack() {
  if (document.body.classList.contains("lg-clean-v2")) return;
  const hero = document.querySelector(".lg-motion-hero");
  if (!hero || prefersReducedMotion() || isMotionLite()) return;
  let ticking = false;
  const update = () => {
    ticking = false;
    const rect = hero.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, -rect.top / Math.max(rect.height * 0.55, 1)));
    hero.style.setProperty("--lg-hero-exit", p.toFixed(3));
    hero.style.setProperty("--lg-hero-depth", (0.35 + p * 0.85).toFixed(3));
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true }
  );
  update();
}

function initPageEnterCascade() {
  if (prefersReducedMotion()) {
    document.body.classList.add("lg-page-enter");
    return;
  }
  const run = () => {
    document.body.classList.add("lg-page-enter");
    const nav = document.querySelector(".app-nav");
    if (nav) {
      nav.classList.add("lg-enter-item");
      requestAnimationFrame(() => nav.classList.add("lg-enter-visible"));
    }
    const hero = document.querySelector(".lg-hero-inner, .lg-motion-hero-inner, .lg-tests-hero-inner");
    if (hero) {
      hero.classList.add("lg-enter-item", "lg-visible");
      window.setTimeout(() => hero.classList.add("lg-enter-visible"), 100);
    }
    const blocks = document.querySelectorAll(
      "main > section, .lg-motion-rail-wrap, .lg-motion-compare-wrap, .lg-motion-why-wrap, .lg-stats, .lg-tests-matrix"
    );
    blocks.forEach((el, i) => {
      el.classList.add("lg-enter-item");
      window.setTimeout(() => el.classList.add("lg-enter-visible"), 240 + i * 78);
    });
    document.querySelectorAll(".lg-tests-title-line").forEach((line, i) => {
      window.setTimeout(() => line.classList.add("lg-enter-visible"), 140 + i * 120);
    });
    document.dispatchEvent(new CustomEvent("lg-bg-pulse"));
  };
  if (document.body.classList.contains("lg-enter-done")) {
    window.setTimeout(run, 80);
  } else {
    document.addEventListener(
      "lg-enter-complete",
      () => {
        document.body.classList.add("lg-enter-breath");
        window.setTimeout(() => {
          document.body.classList.remove("lg-enter-breath");
          run();
        }, 1200);
      },
      { once: true }
    );
  }
}

function initSectionTransitions() {
  if (document.body.classList.contains("lg-clean-v2")) return;
  if (!allowsHeavyMotion()) return;
  const sections = document.querySelectorAll(
    "main > section:not([data-lg-pin]):not(.lg-evidence-section):not(.lg-studio-panel):not(.lg-contact-studio), .lg-stats, .lg-marquee"
  );
  if (!sections.length) return;
  sections.forEach((s) => s.classList.add("lg-motion-section-fx"));
  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = window.innerHeight;
    sections.forEach((sec) => {
      const rect = sec.getBoundingClientRect();
      const center = rect.top + rect.height * 0.5;
      const dist = (center - vh * 0.5) / vh;
      const abs = Math.min(1, Math.abs(dist));
      const scale = 1 - abs * 0.045;
      const ty = dist * 28;
      const opacity = 1 - abs * 0.32;
      sec.style.transform = "translate3d(0," + ty.toFixed(1) + "px,0) scale(" + scale.toFixed(3) + ")";
      sec.style.opacity = opacity.toFixed(3);
      sec.classList.toggle("lg-section-near", abs < 0.24);
    });
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true }
  );
  update();
}

function getPageSections() {
  return LG_PAGE_SECTIONS.map((r) => ({ ...r, el: document.querySelector(r.sel) })).filter((r) => r.el);
}

function padSectionNum(n) {
  return String(n).padStart(2, "0");
}

const LG_PAGE_SECTIONS = [
  { sel: ".lg-motion-hero", key: "pager.sec_home" },
  { sel: "#lg-motion-bridge", key: "pager.sec_bridge" },
  { sel: "#work", key: "pager.sec_work" },
  { sel: "#neden", key: "pager.sec_why" },
  { sel: "#rakipler", key: "pager.sec_compare" },
  { sel: ".lg-motion-stats", key: "pager.sec_stats" },
  { sel: "#hakkimizda", key: "pager.sec_about" },
  { sel: "#kurulum", key: "pager.sec_install" },
  { sel: "#dashboard", key: "pager.sec_dashboard" },
  { sel: "#testler", key: "pager.sec_tests" },
  { sel: "#kanit", key: "pager.sec_evidence" },
  { sel: "#iletisim", key: "pager.sec_contact" },
];

const LG_CASE_IDS = ["core", "pro", "proof", "grafana"];

const LG_CASE_STUDIES = {
  core: {
    num: "01",
    accent: "#e30a17",
    eyebrow: "showcase.core.eyebrow",
    title: "showcase.core.title",
    body: "case.core.lead",
    cta: "case.core.cta",
    href: "#kurulum",
    tags: ["showcase.core.tag1", "showcase.core.tag2"],
    image: "screenshots/dashboard-fleet.png",
  },
  pro: {
    num: "02",
    accent: "#38bdf8",
    eyebrow: "showcase.pro.eyebrow",
    title: "showcase.pro.title",
    body: "case.pro.lead",
    cta: "case.pro.cta",
    href: "#dashboard",
    tags: ["showcase.pro.tag1", "showcase.pro.tag2"],
    image: "screenshots/dashboard-fleet.png",
  },
  proof: {
    num: "03",
    accent: "#22c55e",
    eyebrow: "showcase.proof.eyebrow",
    title: "showcase.proof.title",
    body: "case.proof.lead",
    cta: "case.proof.cta",
    href: "/tests",
    tags: ["showcase.proof.tag1", "showcase.proof.tag2"],
    image: "screenshots/dashboard-tests.png",
  },
  grafana: {
    num: "04",
    accent: "#f97316",
    eyebrow: "showcase.grafana.eyebrow",
    title: "showcase.grafana.title",
    body: "case.grafana.lead",
    cta: "case.grafana.cta",
    href: "#dashboard",
    tags: ["showcase.grafana.tag1", "showcase.grafana.tag2"],
    image: "screenshots/dashboard-fleet.png",
  },
};

function initChapterIndex() {
  const wrap = document.getElementById("lg-chapter-index");
  const toggle = document.getElementById("lg-index-toggle");
  const closeBtn = document.getElementById("lg-chapter-close");
  const backdrop = document.getElementById("lg-chapter-backdrop");
  const list = document.getElementById("lg-chapter-list");
  if (!wrap || !toggle || !list || !document.body.classList.contains("page-home")) return;

  const sections = getPageSections();
  if (sections.length < 2) {
    toggle.hidden = true;
    return;
  }

  let lang = getInitialLang();
  let active = 0;
  let open = false;
  let lastFocus = null;

  function sectionLabel(i) {
    const key = sections[i]?.key;
    return (key && t(lang, key)) || padSectionNum(i + 1);
  }

  function syncActive(i) {
    active = i;
    const total = sections.length;
    list.querySelectorAll(".lg-chapter-item").forEach((btn, idx) => {
      btn.classList.toggle("lg-chapter-item-on", idx === active);
      btn.setAttribute("aria-current", idx === active ? "true" : "false");
      const ring = btn.querySelector(".lg-chapter-item-ring-fill");
      if (ring) {
        const p = (idx + 1) / total;
        ring.style.strokeDashoffset = String(100 * (1 - p));
      }
    });
  }

  function scrollToSection(i) {
    const el = sections[i]?.el;
    if (!el) return;
    const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 72;
    const top = el.getBoundingClientRect().top + window.scrollY - navH - 8;
    window.scrollTo({ top: Math.max(0, top), behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }

  function buildList() {
    list.textContent = "";
    sections.forEach((sec, i) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lg-chapter-item";
      const ringWrap = document.createElement("span");
      ringWrap.className = "lg-chapter-item-ring-wrap";
      ringWrap.appendChild(lgChapterRingSvg());
      const num = document.createElement("span");
      num.className = "lg-chapter-item-num";
      num.textContent = padSectionNum(i + 1);
      ringWrap.appendChild(num);
      const label = document.createElement("span");
      label.className = "lg-chapter-item-label";
      label.textContent = sectionLabel(i);
      btn.append(ringWrap, label);
      btn.addEventListener("click", () => {
        scrollToSection(i);
        closePanel();
      });
      li.appendChild(btn);
      list.appendChild(li);
    });
    syncActive(active);
  }

  function openPanel() {
    if (open) return;
    open = true;
    lastFocus = document.activeElement;
    wrap.hidden = false;
    requestAnimationFrame(() => wrap.classList.add("lg-chapter-open"));
    toggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("lg-chapter-lock");
    closeBtn.setAttribute("aria-label", t(lang, "index.close") || "Close");
    closeBtn.focus();
  }

  function closePanel() {
    if (!open) return;
    open = false;
    wrap.classList.remove("lg-chapter-open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("lg-chapter-lock");
    window.setTimeout(() => {
      if (!open) wrap.hidden = true;
    }, 420);
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  toggle.addEventListener("click", () => (open ? closePanel() : openPanel()));
  closeBtn.addEventListener("click", closePanel);
  backdrop.addEventListener("click", closePanel);
  window.addEventListener("keydown", (e) => {
    if (!open) return;
    if (e.key === "Escape") {
      e.preventDefault();
      closePanel();
    }
  });
  document.addEventListener("lg-section-change", (e) => {
    if (e.detail && typeof e.detail.index === "number") syncActive(e.detail.index);
  });
  document.addEventListener("lg-lang-change", (e) => {
    if (e.detail && e.detail.lang) lang = e.detail.lang;
    buildList();
    closeBtn.setAttribute("aria-label", t(lang, "index.close") || "Close");
  });

  buildList();
}

function initCaseOverlay() {
  const wrap = document.getElementById("lg-case-overlay");
  const backdrop = document.getElementById("lg-case-backdrop");
  const closeBtn = document.getElementById("lg-case-close");
  const prevBtn = document.getElementById("lg-case-prev");
  const nextBtn = document.getElementById("lg-case-next");
  const visual = document.getElementById("lg-case-visual");
  const imgEl = document.getElementById("lg-case-img");
  const videoEl = document.getElementById("lg-case-video");
  const panel = wrap?.querySelector(".lg-case-panel");
  const numEl = document.getElementById("lg-case-num");
  const eyebrowEl = document.getElementById("lg-case-eyebrow");
  const titleEl = document.getElementById("lg-case-title");
  const bodyEl = document.getElementById("lg-case-body");
  const tagsEl = document.getElementById("lg-case-tags");
  const ctaEl = document.getElementById("lg-case-cta");
  const cards = document.querySelectorAll(".lg-motion-card[data-lg-case]");
  if (!wrap || !panel || !cards.length || !document.body.classList.contains("page-home")) return;

  let lang = getInitialLang();
  let open = false;
  let lastFocus = null;
  let currentId = null;

  function caseIndex(id) {
    return LG_CASE_IDS.indexOf(id);
  }

  function fillCase(id) {
    const spec = LG_CASE_STUDIES[id];
    if (!spec) return;
    currentId = id;
    panel.classList.remove("lg-case-panel--core", "lg-case-panel--pro", "lg-case-panel--proof", "lg-case-panel--grafana");
    panel.classList.add("lg-case-panel--" + id);
    if (numEl) numEl.textContent = spec.num;
    if (eyebrowEl) eyebrowEl.textContent = t(lang, spec.eyebrow) || "";
    if (titleEl) titleEl.textContent = stripHtmlToText(t(lang, spec.title) || "");
    if (bodyEl) bodyEl.textContent = t(lang, spec.body) || "";
    if (ctaEl) {
      ctaEl.href = spec.href;
      ctaEl.textContent = t(lang, spec.cta) || "";
    }
    if (tagsEl) {
      tagsEl.textContent = "";
      spec.tags.forEach((key) => {
        const text = t(lang, key);
        if (!text) return;
        const span = document.createElement("span");
        span.textContent = text;
        tagsEl.appendChild(span);
      });
    }
    panel.style.setProperty("--lg-case-accent", spec.accent);
    if (visual) {
      visual.classList.toggle("lg-case-visual-has-img", !!(spec.image || spec.video));
      visual.classList.toggle("lg-case-visual-has-video", !!spec.video && !prefersReducedMotion());
      visual.classList.remove("lg-case-visual-pulse");
      void visual.offsetWidth;
      visual.classList.add("lg-case-visual-pulse");
    }
    if (videoEl) {
      videoEl.pause();
      if (spec.video && !prefersReducedMotion()) {
        if (videoEl.getAttribute("src") !== spec.video) videoEl.setAttribute("src", spec.video);
        videoEl.hidden = false;
        videoEl.play().catch(() => {});
        if (imgEl) imgEl.hidden = true;
      } else {
        videoEl.hidden = true;
        videoEl.removeAttribute("src");
      }
    }
    if (imgEl) {
      if (spec.image && (!spec.video || prefersReducedMotion())) {
        imgEl.src = spec.image;
        imgEl.alt = stripHtmlToText(t(lang, spec.title) || "");
        imgEl.hidden = false;
      } else if (!spec.video) {
        imgEl.hidden = true;
        imgEl.removeAttribute("src");
      }
    }
    const idx = caseIndex(id);
    if (prevBtn) prevBtn.disabled = idx <= 0;
    if (nextBtn) nextBtn.disabled = idx >= LG_CASE_IDS.length - 1;
    if (prevBtn) prevBtn.setAttribute("aria-label", (t(lang, "case.prev") || "Previous") + ": " + (LG_CASE_IDS[idx - 1] ? stripHtmlToText(t(lang, LG_CASE_STUDIES[LG_CASE_IDS[idx - 1]].title) || "") : ""));
    if (nextBtn) nextBtn.setAttribute("aria-label", (t(lang, "case.next") || "Next") + ": " + (LG_CASE_IDS[idx + 1] ? stripHtmlToText(t(lang, LG_CASE_STUDIES[LG_CASE_IDS[idx + 1]].title) || "") : ""));
  }

  function staggerCasePanel() {
    if (prefersReducedMotion()) return;
    panel.querySelectorAll(".lg-case-num, .lg-case-eyebrow, .lg-case-title, .lg-case-body, .lg-case-tags, .lg-case-cta").forEach((el, i) => {
      el.classList.remove("lg-case-stagger-on");
      el.style.setProperty("--lg-case-stagger", i * 55 + 90 + "ms");
      void el.offsetWidth;
      el.classList.add("lg-case-stagger-on");
    });
  }

  function openCase(id) {
    if (!LG_CASE_STUDIES[id]) return;
    fillCase(id);
    open = true;
    lastFocus = document.activeElement;
    wrap.hidden = false;
    requestAnimationFrame(() => {
      wrap.classList.add("lg-case-open");
      staggerCasePanel();
    });
    document.body.classList.add("lg-case-lock");
    closeBtn.setAttribute("aria-label", t(lang, "case.close") || "Close");
    closeBtn.focus();
  }

  function closeCase() {
    if (!open) return;
    open = false;
    if (videoEl) {
      videoEl.pause();
      videoEl.hidden = true;
    }
    wrap.classList.remove("lg-case-open");
    document.body.classList.remove("lg-case-lock");
    window.setTimeout(() => {
      if (!open) wrap.hidden = true;
    }, 420);
    currentId = null;
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  function stepCase(delta) {
    if (!currentId) return;
    const idx = caseIndex(currentId);
    const next = LG_CASE_IDS[idx + delta];
    if (!next) return;
    fillCase(next);
    staggerCasePanel();
  }

  cards.forEach((card) => {
    const id = card.getAttribute("data-lg-case");
    const tryOpen = (e) => {
      if (e.target.closest("a")) return;
      e.preventDefault();
      openCase(id);
    };
    card.addEventListener("click", tryOpen);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        if (e.target.closest("a")) return;
        e.preventDefault();
        openCase(id);
      }
    });
  });

  closeBtn.addEventListener("click", closeCase);
  backdrop.addEventListener("click", closeCase);
  if (prevBtn) prevBtn.addEventListener("click", () => stepCase(-1));
  if (nextBtn) nextBtn.addEventListener("click", () => stepCase(1));
  window.addEventListener("keydown", (e) => {
    if (!open) return;
    if (e.key === "Escape") {
      e.preventDefault();
      closeCase();
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      stepCase(-1);
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      stepCase(1);
    }
  });
  document.addEventListener("lg-lang-change", (e) => {
    if (e.detail && e.detail.lang) lang = e.detail.lang;
    if (currentId) fillCase(currentId);
    closeBtn.setAttribute("aria-label", t(lang, "case.close") || "Close");
  });
}

function initSectionPager() {
  const pager = document.getElementById("lg-motion-pager");
  const prev = document.getElementById("lg-motion-pager-prev");
  const next = document.getElementById("lg-motion-pager-next");
  const countEl = document.getElementById("lg-motion-pager-count");
  const ringEl = document.getElementById("lg-motion-pager-ring");
  const labelEl = document.getElementById("lg-motion-pager-label");
  const hintEl = document.getElementById("lg-motion-pager-hint");
  if (!pager || !prev || !next || !document.body.classList.contains("page-home")) return;

  const route = LG_PAGE_SECTIONS;
  const sections = getPageSections();
  if (sections.length < 2) {
    pager.hidden = true;
    return;
  }

  let active = 0;
  let lang = getInitialLang();

  function sectionLabel(i) {
    const key = route[i]?.key;
    return (key && t(lang, key)) || String(i + 1);
  }

  function formatNextHint(i) {
    if (i >= sections.length - 1) return t(lang, "pager.hint") || "";
    const tpl = t(lang, "pager.next_to") || "Next → {section}";
    return tpl.replace("{section}", sectionLabel(i + 1));
  }

  function pad(n) {
    return padSectionNum(n);
  }

  function renderMeta() {
    const total = sections.length;
    if (countEl) countEl.textContent = pad(active + 1) + "/" + pad(total);
    if (ringEl) {
      const p = (active + 1) / total;
      ringEl.style.strokeDashoffset = String(100 * (1 - p));
    }
    if (labelEl) labelEl.textContent = sectionLabel(active);
    if (hintEl) hintEl.textContent = formatNextHint(active);
    const prevName = active > 0 ? sectionLabel(active - 1) : "";
    const nextName = active < total - 1 ? sectionLabel(active + 1) : "";
    prev.setAttribute(
      "aria-label",
      (t(lang, "nav.prev_section") || "Previous") + (prevName ? ": " + prevName : "")
    );
    next.setAttribute(
      "aria-label",
      (t(lang, "nav.next_section") || "Next") + (nextName ? ": " + nextName : "")
    );
    pager.setAttribute("aria-label", sectionLabel(active) + " · " + pad(active + 1) + "/" + pad(total));
  }

  function scrollToIndex(i) {
    active = Math.max(0, Math.min(sections.length - 1, i));
    const el = sections[active].el;
    const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 72;
    const top = el.getBoundingClientRect().top + window.scrollY - navH - 8;
    window.scrollTo({ top: Math.max(0, top), behavior: prefersReducedMotion() ? "auto" : "smooth" });
    updateButtons();
    renderMeta();
  }

  function updateButtons() {
    prev.disabled = active <= 0;
    next.disabled = active >= sections.length - 1;
  }

  function syncActive() {
    const mid = window.innerHeight * 0.42;
    let best = 0;
    let bestDist = Infinity;
    sections.forEach((sec, i) => {
      const el = sec.el;
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height * 0.35;
      const dist = Math.abs(center - mid);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    if (best !== active) {
      active = best;
      updateButtons();
      renderMeta();
      document.dispatchEvent(new CustomEvent("lg-section-change", { detail: { index: active } }));
    }
  }

  prev.addEventListener("click", () => scrollToIndex(active - 1));
  next.addEventListener("click", () => scrollToIndex(active + 1));
  window.addEventListener("scroll", () => requestAnimationFrame(syncActive), { passive: true });
  document.addEventListener("lg-lang-change", (e) => {
    if (e.detail && e.detail.lang) lang = e.detail.lang;
    renderMeta();
  });
  updateButtons();
  renderMeta();
  pager.classList.add("lg-motion-pager-on");
  document.dispatchEvent(new CustomEvent("lg-section-change", { detail: { index: active } }));
}

function wrapPinSection(section) {
  if (!section || section.closest(".lg-motion-pin-wrap")) return null;
  const vh = window.innerHeight;
  const contentH = section.offsetHeight;
  if (contentH > vh * 1.15) return null;
  const wrap = document.createElement("div");
  wrap.className = "lg-motion-pin-wrap";
  const sticky = document.createElement("div");
  sticky.className = "lg-motion-pin-sticky";
  const pinH = Math.max(vh * 1.45, contentH + vh * 0.55);
  wrap.style.height = Math.ceil(pinH) + "px";
  section.parentNode.insertBefore(wrap, section);
  sticky.appendChild(section);
  wrap.appendChild(sticky);
  return { wrap, sticky, section };
}

function initSectionPinJack() {
  if (!allowsHeavyMotion()) return;
  const pins = Array.from(document.querySelectorAll("[data-lg-pin]"))
    .map(wrapPinSection)
    .filter(Boolean);
  if (!pins.length) return;

  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = window.innerHeight;
    pins.forEach(({ wrap, sticky, section }) => {
      const rect = wrap.getBoundingClientRect();
      const total = Math.max(wrap.offsetHeight - vh, 1);
      const raw = Math.min(1, Math.max(0, -rect.top / total));
      const enter = Math.min(1, raw * 2.4);
      const exit = Math.min(1, (1 - raw) * 2.4);
      const vis = Math.min(enter, exit);
      sticky.style.setProperty("--lg-pin-p", raw.toFixed(3));
      section.style.opacity = "1";
      const ty = (1 - vis) * 28;
      const sc = 0.96 + vis * 0.04;
      section.style.transform = "translate3d(0," + ty.toFixed(1) + "px,0) scale(" + sc.toFixed(3) + ")";
    });
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true }
  );
  update();
}

function initCursorTrail() {
  if (!allowsHeavyMotion() || !document.body.classList.contains("page-home")) return;
  const canvas = document.getElementById("lg-cursor-trail");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let w = 0;
  let h = 0;
  let mx = -999;
  let my = -999;
  const pts = [];
  const maxPts = 28;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    if (mx > 0) {
      pts.unshift({ x: mx, y: my, life: 1 });
      if (pts.length > maxPts) pts.pop();
    }
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      p.life *= 0.92;
      const r = 2 + (1 - p.life) * 4;
      const alpha = p.life * 0.55;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? "rgba(210,175,120," + alpha + ")" : "rgba(120,80,140," + alpha * 0.9 + ")";
      ctx.fill();
      if (i > 0) {
        const q = pts[i - 1];
        ctx.strokeStyle = "rgba(255,255,255," + alpha * 0.2 + ")";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
    }
    requestAnimationFrame(draw);
  }

  const onMove = (e) => {
    mx = e.clientX;
    my = e.clientY;
  };
  const onLeave = () => {
    mx = -999;
    my = -999;
  };

  resize();
  draw();
  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerleave", onLeave, { passive: true });
}

function spineProject(x, y, z, rotY, rotX, cx, cy, scale) {
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);
  const x1 = x * cosY - z * sinY;
  const z1 = x * sinY + z * cosY;
  const y1 = y * cosX - z1 * sinX;
  const z2 = y * sinX + z1 * cosX;
  const focal = 680;
  const f = focal / (focal + z2);
  return { x: cx + x1 * f * scale, y: cy + y1 * f * scale, z: z2, f };
}

function spineDrawFrame(ctx, w, h, t, cx, cy, scale, scrollP, intensity, spreadMul, immersive) {
  const spread = spreadMul ?? 1;
  const rotBase = t * 0.18 + scrollP * 0.28;
  const inten = Math.max(0, Math.min(1, intensity));
  ctx.clearRect(0, 0, w, h);
  if (inten <= 0.01) return;

  function drawRing(rx, ry, rot, hue, sat, lit, alpha, lw) {
    const segs = 32;
    const pts = [];
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const x = Math.cos(a) * rx * scale * spread;
      const y = Math.sin(a) * ry * scale * spread;
      const z = Math.sin(a * 2 + t * 0.25) * 10 * scale * spread;
      pts.push(spineProject(x, y, z, rot, rot * 0.22, cx, cy, 1));
    }
    ctx.beginPath();
    pts.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.strokeStyle = "hsla(" + hue + ", " + sat + "%, " + lit + "%, " + alpha * inten + ")";
    ctx.lineWidth = lw;
    ctx.stroke();
  }

  const rings = [
    { rx: 118, ry: 38, hue: 38, sat: 72, lit: 58, a: 0.28, lw: 1.15 },
    { rx: 88, ry: 28, hue: 278, sat: 58, lit: 56, a: 0.22, lw: 1 },
    { rx: 58, ry: 18, hue: 32, sat: 68, lit: 55, a: 0.18, lw: 0.85 },
  ];
  rings.forEach((r, i) => {
    drawRing(r.rx, r.ry, rotBase + i * 0.72, r.hue, r.sat, r.lit, immersive ? r.a : r.a * 0.75, r.lw);
  });

  const arcSegs = 24;
  const arcR = 140 * scale * spread;
  ctx.beginPath();
  for (let i = 0; i <= arcSegs; i++) {
    const a = rotBase * 0.6 + (i / arcSegs) * Math.PI * 1.35 - 0.4;
    const p = spineProject(
      Math.cos(a) * arcR,
      Math.sin(t * 0.2) * 8,
      Math.sin(a) * arcR * 0.35,
      rotBase * 0.4,
      0.15,
      cx,
      cy,
      1
    );
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.strokeStyle = "rgba(180, 130, 220, " + 0.14 * inten + ")";
  ctx.lineWidth = 0.9;
  ctx.stroke();
}

function mountSpineCanvas(canvas, opts) {
  if (!canvas || !allowsSpineMotion()) return null;
  if (canvas.dataset.lgSpineMounted === "1") return null;
  canvas.dataset.lgSpineMounted = "1";
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  let w = 0;
  let h = 0;
  let raf = 0;
  let tick = 0;
  const t0 = performance.now();
  let scrollP = 0;
  let intensity = opts.initialIntensity ?? 1;

  function currentIntensity() {
    if (typeof opts.getIntensity === "function") return opts.getIntensity();
    return intensity;
  }

  function currentSpread() {
    if (typeof opts.getSpread === "function") return opts.getSpread();
    return 1;
  }

  function resize() {
    const rect = opts.getRect();
    const dpr = Math.min(window.devicePixelRatio || 1, opts.fullscreen ? 1.25 : 1.5);
    w = Math.max(1, Math.floor(rect.width));
    h = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    if (opts.fullscreen) {
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    raf = requestAnimationFrame(draw);
    if (document.hidden) return;
    tick++;
    if (opts.fullscreen && tick % 2 !== 0) return;
    const t = (performance.now() - t0) * 0.001;
    const rect = opts.getRect();
    if (rect.width !== w || rect.height !== h) resize();
    const cx =
      rect.width * (opts.cxRatio ?? 0.5) +
      (opts.immersive ? (__lgImmersiveMouse.x - 0.5) * rect.width * 0.05 : 0);
    const cy =
      rect.height * (opts.cyRatio ?? 0.42) +
      (opts.immersive ? (__lgImmersiveMouse.y - 0.5) * rect.height * 0.04 : 0);
    const scale = (opts.getScale?.() ?? 1) * (opts.scaleMul ?? 1);
    spineDrawFrame(
      ctx,
      w,
      h,
      t,
      cx,
      cy,
      scale,
      scrollP,
      currentIntensity(),
      currentSpread(),
      !!opts.immersive
    );
  }

  resize();
  draw();

  const api = {
    setScrollP(v) {
      scrollP = v;
    },
    setIntensity(v) {
      intensity = v;
    },
    stop() {
      cancelAnimationFrame(raf);
    },
    start() {
      draw();
    },
  };

  window.addEventListener("resize", resize, { passive: true });
  if (opts.onScroll) {
    window.addEventListener(
      "scroll",
      () => {
        opts.onScroll(api);
      },
      { passive: true }
    );
  }
  return api;
}

function initSpineMorph() {
  if (!allowsSpineMotion()) return;
  const globalCanvas = document.getElementById("lg-motion-spine-global");
  const hero = document.querySelector(".lg-motion-hero");
  const bridge = document.getElementById("lg-motion-bridge");
  if (!globalCanvas) {
    initGlobalSpine();
    return;
  }

  const morph = {
    spread: 0.34,
    heroInt: 1,
    bridgeInt: 0,
    globalIn: 0,
    bridgeP: 0,
    enterBoost: 0,
  };

  mountSpineCanvas(globalCanvas, {
    fullscreen: true,
    immersive: true,
    getRect: () => ({ width: window.innerWidth, height: window.innerHeight }),
    cxRatio: 0.5,
    cyRatio: 0.48,
    scaleMul: 1.22,
    getScale: () => 0.82 + morph.globalIn * 0.28,
    getSpread: () => 0.88 + morph.globalIn * 0.35,
    getIntensity: () => 1,
    initialIntensity: 1,
    onScroll: (api) => {
      api.setScrollP(morph.bridgeP * 0.5 + Math.min(1, window.scrollY * 0.00028));
    },
  });

  if (!hero || !bridge) return;

  function rampEnterBoost() {
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / 1600);
      morph.enterBoost = p * p;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  document.addEventListener("lg-enter-complete", () => {
    document.body.classList.add("lg-spine-global");
    rampEnterBoost();
  });

  try {
    if (sessionStorage.getItem("lg_enter_rev6") === "1") {
      morph.enterBoost = 1;
      morph.globalIn = 1;
      document.body.classList.add("lg-spine-global");
    }
  } catch (_) {}

  let ticking = false;

  function updateMorph() {
    ticking = false;
    const vh = window.innerHeight;
    const heroRect = hero.getBoundingClientRect();
    const heroOut = Math.min(1, Math.max(0, -heroRect.top / Math.max(heroRect.height, 1)));

    morph.bridgeP = getBridgeScrollProgress();

    morph.spread = 0.32 + heroOut * 0.38 + morph.bridgeP * 1.05;
    morph.heroInt = Math.max(0, 1 - morph.bridgeP * 1.15 - heroOut * 0.35);
    morph.bridgeInt =
      morph.bridgeP > 0.02 && morph.bridgeP < 0.98
        ? Math.min(1.15, Math.sin(morph.bridgeP * Math.PI) * 1.1 + heroOut * 0.25)
        : morph.bridgeP >= 0.98
          ? 0
          : heroOut * 0.4;
    morph.globalIn = Math.min(
      1,
      morph.enterBoost * 0.4 + morph.bridgeP * 0.85 + (1 - heroOut) * 0.38
    );

    document.body.classList.toggle("lg-spine-global", morph.globalIn > 0.12);
    document.body.classList.toggle("lg-spine-morph", morph.bridgeP > 0.04 && morph.bridgeP < 0.96);
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateMorph);
      }
    },
    { passive: true }
  );
  updateMorph();
}

function initHeroSpine() {
  const canvas = document.getElementById("lg-motion-spine");
  const hero = document.querySelector(".lg-motion-hero");
  if (!canvas || !hero) return;

  mountSpineCanvas(canvas, {
    getRect: () => hero.getBoundingClientRect(),
    cxRatio: 0.5,
    cyRatio: 0.42,
    initialIntensity: 1,
    onScroll: (api) => {
      const rect = hero.getBoundingClientRect();
      api.setScrollP(Math.min(1, Math.max(0, -rect.top / Math.max(rect.height, 1))));
    },
  });
}

function initGlobalSpine() {
  const canvas = document.getElementById("lg-motion-spine-global");
  if (!canvas) return;

  let globalIntensity = 0;
  const spine = mountSpineCanvas(canvas, {
    fullscreen: true,
    immersive: true,
    getRect: () => ({ width: window.innerWidth, height: window.innerHeight }),
    cxRatio: 0.5,
    cyRatio: 0.5,
    scaleMul: 1.35,
    initialIntensity: 1,
    getIntensity: () => 1,
    getScale: () => 0.88 + globalIntensity * 0.35,
    onScroll: (api) => {
      api.setScrollP(Math.min(1, window.scrollY * 0.0004));
    },
  });
  if (!spine) return;

  document.addEventListener("lg-enter-complete", () => {
    document.body.classList.add("lg-spine-global");
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / 1800);
      globalIntensity = p * p;
      spine.setIntensity(globalIntensity);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  try {
    if (sessionStorage.getItem("lg_enter_rev6") === "1") {
      globalIntensity = 1;
      spine.setIntensity(1);
      document.body.classList.add("lg-spine-global");
    }
  } catch (_) {}
}

function initSectionSpine(canvasId, wrapSelector) {
  const canvas = document.getElementById(canvasId);
  const wrap = document.querySelector(wrapSelector);
  if (!canvas || !wrap) return;
  mountSpineCanvas(canvas, {
    getRect: () => {
      const outer = wrap.querySelector("[class*='-outer']") || wrap;
      return outer.getBoundingClientRect();
    },
    cxRatio: 0.5,
    cyRatio: 0.55,
    scaleMul: 0.55,
    initialIntensity: 0.22,
    onScroll: (api) => {
      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.5 - rect.top) / Math.max(rect.height, 1)));
      api.setScrollP(p);
    },
  });
}

function lgSectionInView(el, margin = 0.08) {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight;
  return r.top < vh * (1 - margin) && r.bottom > vh * margin;
}

function getBridgeScrollProgress() {
  const bridge = document.getElementById("lg-motion-bridge");
  if (!bridge) return 0;
  const vh = window.innerHeight;
  const total = Math.max(bridge.offsetHeight - vh, 1);
  const scrolled = Math.min(Math.max(-bridge.getBoundingClientRect().top, 0), total);
  return scrolled / total;
}

function updateBridgeUI(p) {
  const bridge = document.getElementById("lg-motion-bridge");
  if (!bridge) return;
  const bar = document.getElementById("lg-bridge-bar");
  const packet = document.getElementById("lg-bridge-packet");
  const inner = bridge.querySelector(".lg-motion-bridge-inner");
  const steps = bridge.querySelectorAll(".lg-motion-bridge-steps span");
  const connectorGlow = bridge.querySelector(".lg-bridge-connector-glow");
  const heavy = allowsHeavyMotion();

  bridge.style.setProperty("--lg-bridge-p", p.toFixed(3));
  document.body.classList.toggle("lg-bridge-active", p > 0.03 && p < 0.97);

  if (bar) bar.style.width = (p * 100).toFixed(2) + "%";
  if (connectorGlow) connectorGlow.style.width = (p * 100).toFixed(2) + "%";

  if (steps.length) {
    const active = Math.min(steps.length - 1, Math.floor(p * steps.length * 1.12));
    steps.forEach((el, i) => {
      el.classList.toggle("lg-bridge-step-lit", i <= active);
      el.classList.toggle("lg-bridge-step-on", i === active);
    });
    if (packet) packet.style.left = (((active + 0.5) / steps.length) * 100).toFixed(2) + "%";
  }

  const workRail = document.getElementById("work");
  if (workRail) workRail.classList.toggle("lg-rail-bridge-wash", p > 0.82);

  if (!inner || prefersReducedMotion()) return;

  if (heavy) {
    const mid = Math.min(1, Math.sin(p * Math.PI) * 0.35 + 0.65);
    const endFade = 1 - Math.max(0, (p - 0.72) / 0.28);
    const bridgeRect = bridge.getBoundingClientRect();
    const inSticky = bridgeRect.top <= 2 && bridgeRect.bottom >= window.innerHeight * 0.5;
    const base = inSticky ? 0.97 : 0.82;
    inner.style.opacity = (base * mid * endFade + 0.04).toFixed(3);
    inner.style.filter =
      "drop-shadow(0 0 " + (14 + mid * 26).toFixed(0) + "px rgba(227,10,23," + (0.28 + mid * 0.32).toFixed(2) + "))";
    inner.style.transform =
      "scale(" + (0.92 + mid * 0.08 * endFade).toFixed(3) + ") translateY(" + ((1 - mid) * 8).toFixed(1) + "px)";
  } else {
    inner.style.opacity = "";
    inner.style.transform = "";
    inner.style.filter = "";
  }
}

function initBridgeScroll() {
  const bridge = document.getElementById("lg-motion-bridge");
  if (!bridge || !document.body.classList.contains("page-home")) return;

  let ticking = false;
  const tick = () => {
    ticking = false;
    updateBridgeUI(getBridgeScrollProgress());
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(tick);
      }
    },
    { passive: true }
  );
  window.addEventListener("resize", tick, { passive: true });
  tick();
}

const LG_EVIDENCE_STAT = {
  tr: {
    "evidence.preview_pdf": "PDF · 68 test · bench özeti",
    "evidence.preview_json": "JSON · makine okunur · 68/68 PASS",
    "evidence.preview_bench": "ModSec CRS · EPS karşılaştırma",
    "evidence.preview_fp": "FP · %0.2 benign · hedef <%5",
    "evidence.preview_ban": "Ban · medyan ~17 ms · ipset",
    "evidence.preview_soak": "72h · 864 örnek · 0 fail",
    "evidence.preview_soak_md": "Soak özet · operatör notları",
    "evidence.preview_sprint": "Sprint gate · FAIL:0",
    "evidence.preview_siem": "SIEM · alert+ban JSON",
    "evidence.preview_taxii": "TAXII · conf≥70 IOC",
    "evidence.preview_vm": "VM sprint · VirtualBox kanıt",
    "evidence.preview_geoip": "GeoIP · attack map MMDB",
    "evidence.preview_webhook": "Webhook · route+batch",
    "evidence.preview_telegram": "Telegram · canlı ack",
  },
  en: {
    "evidence.preview_pdf": "PDF · 68 tests · bench summary",
    "evidence.preview_json": "JSON · machine-readable · 68/68 PASS",
    "evidence.preview_bench": "ModSec CRS · EPS comparison",
    "evidence.preview_fp": "FP · 0.2% benign · target <5%",
    "evidence.preview_ban": "Ban · median ~17 ms · ipset",
    "evidence.preview_soak": "72h · 864 samples · 0 fail",
    "evidence.preview_soak_md": "Soak summary · operator notes",
    "evidence.preview_sprint": "Sprint gate · FAIL:0",
    "evidence.preview_siem": "SIEM · alert+ban JSON",
    "evidence.preview_taxii": "TAXII · conf≥70 IOC",
    "evidence.preview_vm": "VM sprint · VirtualBox proof",
    "evidence.preview_geoip": "GeoIP · attack map MMDB",
    "evidence.preview_webhook": "Webhook · route+batch",
    "evidence.preview_telegram": "Telegram · live ack",
  },
};

function initEvidencePreview() {
  const tip = document.getElementById("lg-evidence-tip");
  const links = document.querySelectorAll("[data-lg-evidence-preview]");
  if (!tip || !links.length) return;

  let lang = getInitialLang();
  let active = null;

  function show(link) {
    const key = link.getAttribute("data-lg-evidence-preview");
    if (!key) return;
    const text = t(lang, key);
    if (!text) return;
    const statMap = LG_EVIDENCE_STAT[lang] || LG_EVIDENCE_STAT.en;
    const stat = statMap[key] || "";
    tip.textContent = stat ? text + "\n" + stat : text;
    tip.hidden = false;
    if (active && active !== link) active.classList.remove("lg-evidence-active");
    active = link;
    link.classList.add("lg-evidence-active");
    link.closest("li")?.classList.add("lg-evidence-li-active");
    position(link);
  }

  function hide() {
    tip.hidden = true;
    if (active) {
      active.classList.remove("lg-evidence-active");
      active.closest("li")?.classList.remove("lg-evidence-li-active");
    }
    active = null;
  }

  function position(link) {
    const r = link.getBoundingClientRect();
    tip.hidden = false;
    const w = tip.offsetWidth || 220;
    const h = tip.offsetHeight || 48;
    const pad = 14;
    let left = r.left + r.width * 0.5;
    let top = r.top - 10;
    let below = false;
    left = Math.max(pad + w * 0.5, Math.min(window.innerWidth - pad - w * 0.5, left));
    if (top < pad + h + 48) {
      top = r.bottom + 12;
      below = true;
    }
    tip.style.left = left + "px";
    tip.style.top = top + "px";
    tip.classList.toggle("lg-evidence-tip-below", below);
  }

  links.forEach((link) => {
    link.addEventListener("pointerenter", () => show(link));
    link.addEventListener("focus", () => show(link));
    link.addEventListener("pointerleave", hide);
    link.addEventListener("blur", hide);
  });
  window.addEventListener("scroll", () => active && position(active), { passive: true });
  document.addEventListener("lg-lang-change", (e) => {
    if (e.detail?.lang) lang = e.detail.lang;
    if (active) show(active);
  });
}

const __lgTerminals = [];

function isTerminalCmdLine(line) {
  const t = line.trimStart();
  return t.startsWith("$ ") || t.startsWith("# ");
}

function isTerminalOkLine(line) {
  return /^\[OK\]/.test(line.trim()) || /FAIL:\s*0/.test(line);
}

function clearTerminalTimers(state) {
  state.timers.forEach((id) => window.clearTimeout(id));
  state.timers = [];
}

function stopTerminal(state) {
  state.running = false;
  state.gen += 1;
  clearTerminalTimers(state);
  state.root.classList.remove("lg-terminal-active");
}

function renderTerminalStatic(state, lang) {
  const text = t(lang, state.key) || "";
  state.linesEl.textContent = text;
  if (state.cursor) state.cursor.style.display = "none";
  state.root.classList.add("lg-terminal-done");
}

function runTerminalSequence(state, lang) {
  const script = t(lang, state.key) || "";
  const lines = script.split("\n");
  const gen = state.gen;
  state.linesEl.textContent = "";
  state.root.classList.remove("lg-terminal-done");
  state.root.classList.add("lg-terminal-active");
  if (state.cursor) {
    state.cursor.style.display = "";
    state.cursor.hidden = false;
  }

  let lineIdx = 0;
  let charIdx = 0;
  let currentLine = "";
  let currentSpan = null;

  const finishLine = () => {
    if (gen !== state.gen) return;
    if (currentSpan) {
      currentSpan.textContent = currentLine;
      currentSpan.classList.add("lg-terminal-line-done");
    }
    if (lineIdx < lines.length - 1) {
      state.linesEl.appendChild(document.createTextNode("\n"));
    }
    lineIdx += 1;
    charIdx = 0;
    currentLine = "";
    currentSpan = null;
    const pause = lineIdx < lines.length ? (isTerminalCmdLine(lines[lineIdx]) ? 280 : 120) : 0;
    if (lineIdx < lines.length) {
      const id = window.setTimeout(tick, pause);
      state.timers.push(id);
    } else {
      state.root.classList.add("lg-terminal-done");
      const id = window.setTimeout(() => {
        if (gen !== state.gen || !state.running) return;
        runTerminalSequence(state, lang);
      }, 4200);
      state.timers.push(id);
    }
  };

  const tick = () => {
    if (gen !== state.gen || !state.running) return;
    if (lineIdx >= lines.length) return;
    const line = lines[lineIdx];
    if (!currentSpan) {
      currentSpan = document.createElement("span");
      currentSpan.className = "lg-terminal-line";
      if (isTerminalCmdLine(line)) currentSpan.classList.add("lg-terminal-cmd");
      else if (isTerminalOkLine(line)) currentSpan.classList.add("lg-terminal-ok");
      else if (line.trim() === "") currentSpan.classList.add("lg-terminal-blank");
      state.linesEl.appendChild(currentSpan);
    }
    if (charIdx >= line.length) {
      finishLine();
      return;
    }
    const ch = line[charIdx];
    charIdx += 1;
    currentLine += ch;
    currentSpan.textContent = currentLine;
    const base = isTerminalCmdLine(line) ? 22 : isTerminalOkLine(line) ? 12 : 16;
    const id = window.setTimeout(tick, base + Math.random() * 14);
    state.timers.push(id);
  };

  tick();
}

function startTerminal(state, lang) {
  if (state.running) return;
  state.running = true;
  state.gen += 1;
  clearTerminalTimers(state);
  runTerminalSequence(state, lang || getInitialLang());
}

function restartTerminal(state, lang) {
  stopTerminal(state);
  startTerminal(state, lang);
}

function initTerminalTypewriter() {
  const roots = document.querySelectorAll("[data-lg-terminal-i18n]");
  if (!roots.length) return;

  roots.forEach((root) => {
    const key = root.getAttribute("data-lg-terminal-i18n");
    if (!key) return;
    const linesEl = root.querySelector(".lg-terminal-lines");
    if (!linesEl) return;
    const state = {
      root,
      key,
      linesEl,
      cursor: root.querySelector(".lg-terminal-cursor"),
      running: false,
      gen: 0,
      timers: [],
    };
    __lgTerminals.push(state);

    if (prefersReducedMotion()) {
      renderTerminalStatic(state, getInitialLang());
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) startTerminal(state, getInitialLang());
          else stopTerminal(state);
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px 0px 0px" }
    );
    obs.observe(root);
    if (lgSectionInView(root, 0.05)) startTerminal(state, getInitialLang());
  });

  window.setTimeout(() => {
    const lang = getInitialLang();
    __lgTerminals.forEach((s) => {
      if (s.linesEl.textContent.trim()) return;
      if (lgSectionInView(s.root, 0.05)) renderTerminalStatic(s, lang);
    });
  }, 1400);

  document.addEventListener("lg-lang-change", (e) => {
    const lang = e.detail?.lang || getInitialLang();
    __lgTerminals.forEach((s) => {
      if (prefersReducedMotion()) {
        renderTerminalStatic(s, lang);
        return;
      }
      const rect = s.root.getBoundingClientRect();
      const visible = rect.top < window.innerHeight * 0.88 && rect.bottom > window.innerHeight * 0.12;
      if (s.running || visible) restartTerminal(s, lang);
      else {
        s.linesEl.textContent = "";
        s.root.classList.remove("lg-terminal-done", "lg-terminal-active");
      }
    });
  });
}

function initContactStudio() {
  const section = document.querySelector(".lg-contact-studio");
  if (!section) return;
  const activate = () => section.classList.add("lg-contact-live");
  if (prefersReducedMotion()) {
    activate();
    return;
  }
  if (lgSectionInView(section, 0.05)) activate();
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) activate();
      });
    },
    { threshold: 0.05, rootMargin: "0px 0px 0px 0px" }
  );
  obs.observe(section);
}

let __lgTestCardObs = null;

function initTestsCardReveal() {
  if (!document.body.classList.contains("page-tests")) return;

  function bind() {
    const cards = document.querySelectorAll("#test-results-list .test-card");
    const labels = document.querySelectorAll("#test-results-list .test-group-label");
    if (__lgTestCardObs) {
      __lgTestCardObs.disconnect();
      __lgTestCardObs = null;
    }
    if (prefersReducedMotion()) {
      cards.forEach((c) => c.classList.add("lg-test-visible"));
      labels.forEach((l) => l.classList.add("lg-test-visible"));
      return;
    }
    cards.forEach((card, i) => {
      card.classList.remove("lg-test-visible");
      card.style.setProperty("--lg-test-delay", (i % 5) * 50 + "ms");
    });
    labels.forEach((label) => label.classList.remove("lg-test-visible"));
    __lgTestCardObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("lg-test-visible");
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -4% 0px" }
    );
    cards.forEach((c) => __lgTestCardObs.observe(c));
    labels.forEach((l) => __lgTestCardObs.observe(l));
  }

  bind();
  document.addEventListener("lg-tests-rendered", bind);
}

function initTestsGroupRail() {
  if (!document.body.classList.contains("page-tests")) return;

  let rail = document.getElementById("lg-tests-pager");
  if (!rail) {
    rail = document.createElement("nav");
    rail.id = "lg-tests-pager";
    rail.className = "lg-motion-pager lg-tests-pager";
    rail.setAttribute("aria-label", "Test grupları");
    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "lg-motion-pager-btn lg-motion-pager-prev";
    prev.id = "lg-tests-pager-prev";
    prev.setAttribute("aria-label", "Önceki grup");
    prev.appendChild(lgPagerChevronSvg(true));
    const meta = document.createElement("div");
    meta.className = "lg-motion-pager-meta";
    const countEl = document.createElement("span");
    countEl.className = "lg-motion-pager-count";
    countEl.id = "lg-tests-pager-count";
    countEl.setAttribute("aria-hidden", "true");
    countEl.textContent = "01 / 02";
    const labelEl = document.createElement("span");
    labelEl.className = "lg-motion-pager-label";
    labelEl.id = "lg-tests-pager-label";
    const hintEl = document.createElement("span");
    hintEl.className = "lg-motion-pager-hint";
    hintEl.id = "lg-tests-pager-hint";
    meta.append(countEl, labelEl, hintEl);
    const next = document.createElement("button");
    next.type = "button";
    next.className = "lg-motion-pager-btn lg-motion-pager-next";
    next.id = "lg-tests-pager-next";
    next.setAttribute("aria-label", "Sonraki grup");
    next.appendChild(lgPagerChevronSvg(false));
    rail.append(prev, meta, next);
    document.body.appendChild(rail);
  }

  const prev = document.getElementById("lg-tests-pager-prev");
  const next = document.getElementById("lg-tests-pager-next");
  const countEl = document.getElementById("lg-tests-pager-count");
  const labelEl = document.getElementById("lg-tests-pager-label");
  const hintEl = document.getElementById("lg-tests-pager-hint");
  if (!prev || !next) return;

  let groups = [];
  let active = 0;
  let lang = getInitialLang();

  function groupName(i) {
    return groups[i]?.textContent?.trim() || padSectionNum(i + 1);
  }

  function renderMeta() {
    const total = groups.length;
    if (countEl) countEl.textContent = padSectionNum(active + 1) + " / " + padSectionNum(total);
    if (labelEl) labelEl.textContent = groupName(active);
    if (hintEl) {
      const tpl = t(lang, "pager.next_to") || "Sonraki → {section}";
      hintEl.textContent =
        active < total - 1 ? tpl.replace("{section}", groupName(active + 1)) : t(lang, "pager.hint") || "";
    }
    prev.disabled = active <= 0;
    next.disabled = active >= total - 1;
  }

  function scrollToGroup(i) {
    active = Math.max(0, Math.min(groups.length - 1, i));
    const el = groups[active];
    if (!el) return;
    const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 72;
    const top = el.getBoundingClientRect().top + window.scrollY - navH - 12;
    window.scrollTo({ top: Math.max(0, top), behavior: prefersReducedMotion() ? "auto" : "smooth" });
    renderMeta();
  }

  function syncActive() {
    if (!groups.length) return;
    const mid = window.innerHeight * 0.38;
    let best = 0;
    let bestDist = Infinity;
    groups.forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      const dist = Math.abs(rect.top - mid);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    if (best !== active) {
      active = best;
      renderMeta();
    }
  }

  function rebuild() {
    groups = [...document.querySelectorAll("#test-results-list .test-group-label")];
    if (groups.length < 2) {
      rail.hidden = true;
      return;
    }
    rail.hidden = false;
    active = Math.min(active, groups.length - 1);
    renderMeta();
    if (!rail.classList.contains("lg-motion-pager-on")) rail.classList.add("lg-motion-pager-on");
  }

  prev.addEventListener("click", () => scrollToGroup(active - 1));
  next.addEventListener("click", () => scrollToGroup(active + 1));
  window.addEventListener("scroll", () => requestAnimationFrame(syncActive), { passive: true });
  document.addEventListener("lg-lang-change", (e) => {
    if (e.detail?.lang) lang = e.detail.lang;
    renderMeta();
  });
  document.addEventListener("lg-tests-rendered", rebuild);
  rebuild();
}

function initTestsHeroTiles() {
  if (!document.body.classList.contains("page-tests")) return;
  const tiles = document.querySelectorAll(".lg-tests-highlights .lg-proof-tile");
  if (!tiles.length) return;
  if (prefersReducedMotion()) {
    tiles.forEach((t) => t.classList.add("lg-test-visible"));
    return;
  }
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("lg-test-visible");
      });
    },
    { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
  );
  tiles.forEach((tile, i) => {
    tile.style.setProperty("--lg-test-delay", i * 70 + "ms");
    obs.observe(tile);
  });
}

function initTestsMotion() {
  if (!document.body.classList.contains("page-tests")) return;
  initTestsCardReveal();
  initTestsGroupRail();
  initTestsHeroTiles();
  initTestsFilter();
  initTestsCardExpand();
  initTestsDeepLink();
}

function initTestsCardExpand() {
  if (!document.body.classList.contains("page-tests")) return;

  function bind() {
    const cards = document.querySelectorAll("#test-results-list .test-card");
    if (prefersReducedMotion()) {
      cards.forEach((c) => c.classList.add("lg-test-expanded"));
      return;
    }
    cards.forEach((card) => {
      if (card.dataset.lgExpandBound === "1") return;
      card.dataset.lgExpandBound = "1";
      const head = card.querySelector(".test-card-head");
      if (!head) return;
      head.setAttribute("role", "button");
      head.setAttribute("tabindex", "0");
      head.setAttribute("aria-expanded", card.classList.contains("lg-test-expanded") ? "true" : "false");
      const toggle = () => {
        const on = card.classList.toggle("lg-test-expanded");
        head.setAttribute("aria-expanded", on ? "true" : "false");
      };
      head.addEventListener("click", (e) => {
        if (e.target.closest("a")) return;
        toggle();
      });
      head.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      });
    });
  }

  bind();
  document.addEventListener("lg-tests-rendered", bind);
}

function expandTestCard(card) {
  if (!card) return;
  card.classList.add("lg-test-expanded");
  const head = card.querySelector(".test-card-head");
  if (head) head.setAttribute("aria-expanded", "true");
}

function initTestsDeepLink() {
  if (!document.body.classList.contains("page-tests")) return;

  function resolveHash() {
    const raw = (location.hash || "").replace(/^#/, "").trim();
    if (!raw) return null;
    const id = raw.startsWith("test-") ? raw : "test-" + raw;
    return document.getElementById(id);
  }

  function openFromHash() {
    const card = resolveHash();
    if (!card) return;
    expandTestCard(card);
    card.classList.remove("lg-test-filtered-out");
    const label = card.previousElementSibling;
    if (label && label.classList.contains("test-group-label")) {
      label.classList.remove("lg-test-filtered-out");
    }
    window.setTimeout(() => {
      card.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
      card.classList.add("lg-test-hash-flash");
      window.setTimeout(() => card.classList.remove("lg-test-hash-flash"), 1400);
    }, 120);
  }

  document.addEventListener("lg-tests-rendered", () => {
    window.setTimeout(openFromHash, 80);
  });
  window.addEventListener("hashchange", openFromHash);
  if (location.hash) window.setTimeout(openFromHash, 400);
}

function initTestsFilter() {
  if (!document.body.classList.contains("page-tests")) return;
  const bar = document.getElementById("lg-tests-filter");
  const summaryEl = document.getElementById("test-results-summary");
  const searchInput = document.getElementById("lg-tests-search");
  if (!bar) return;

  let active = "all";
  let searchQuery = "";
  let lang = getInitialLang();
  let searchTimer = 0;

  function syncSearchUi() {
    if (!searchInput) return;
    searchInput.placeholder = t(lang, "tests.search_placeholder") || "";
    searchInput.setAttribute("aria-label", t(lang, "tests.search_label") || "Search tests");
  }

  function cardMatchesSearch(card) {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const id = (card.dataset.testId || card.id || "").toLowerCase();
    const hay = (card.textContent || "").toLowerCase();
    return id.includes(q) || hay.includes(q);
  }

  function bindFilterBtn(btn) {
    btn.addEventListener("click", () => {
      active = btn.getAttribute("data-lg-test-filter") || "all";
      bar.querySelectorAll(".lg-tests-filter-btn").forEach((b) => {
        b.classList.toggle("lg-tests-filter-on", b === btn);
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
      applyFilter();
    });
  }

  function syncFailFilter() {
    const failCount = document.querySelectorAll(
      '#test-results-list .test-card[data-test-status="fail"]'
    ).length;
    let failBtn = bar.querySelector('[data-lg-test-filter="fail"]');
    if (failCount <= 0) {
      if (failBtn) failBtn.remove();
      if (active === "fail") active = "all";
      return;
    }
    if (!failBtn) {
      failBtn = document.createElement("button");
      failBtn.type = "button";
      failBtn.className = "lg-tests-filter-btn lg-tests-filter-btn-fail";
      failBtn.setAttribute("data-lg-test-filter", "fail");
      failBtn.setAttribute("aria-pressed", "false");
      bar.appendChild(failBtn);
      bindFilterBtn(failBtn);
    }
    const tpl = t(lang, "tests.filter_fail") || "Kaldı";
    failBtn.textContent = tpl + " (" + failCount + ")";
  }

  function applyFilter() {
    const cards = document.querySelectorAll("#test-results-list .test-card");
    const labels = document.querySelectorAll("#test-results-list .test-group-label");
    let visible = 0;
    cards.forEach((card) => {
      const group = card.dataset.testGroup || "proof";
      const st = card.dataset.testStatus || "";
      let show = false;
      if (active === "all") show = true;
      else if (active === "fail") show = st === "fail";
      else show = group === active;
      if (show) show = cardMatchesSearch(card);
      card.classList.toggle("lg-test-filtered-out", !show);
      if (show) visible++;
    });
    labels.forEach((label) => {
      let sib = label.nextElementSibling;
      let any = false;
      while (sib && !sib.classList.contains("test-group-label")) {
        if (sib.classList.contains("test-card") && !sib.classList.contains("lg-test-filtered-out")) {
          any = true;
          break;
        }
        sib = sib.nextElementSibling;
      }
      label.classList.toggle("lg-test-filtered-out", !any);
    });
    if (summaryEl && cards.length) {
      const tpl = t(lang, "tests.filter_count") || "{visible}/{total}";
      const base = summaryEl.dataset.lgSummaryBase;
      if (!base && cards.length) {
        summaryEl.dataset.lgSummaryBase = summaryEl.textContent || "";
      }
      const suffix = tpl.replace("{visible}", String(visible)).replace("{total}", String(cards.length));
      if (active === "all") {
        summaryEl.textContent = summaryEl.dataset.lgSummaryBase || summaryEl.textContent;
      } else {
        summaryEl.textContent = (summaryEl.dataset.lgSummaryBase || "") + " · " + suffix;
      }
    }
    document.dispatchEvent(new CustomEvent("lg-reveal-refresh"));
  }

  bar.querySelectorAll("[data-lg-test-filter]").forEach((btn) => {
    bindFilterBtn(btn);
  });

  if (searchInput) {
    syncSearchUi();
    searchInput.addEventListener("input", () => {
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(() => {
        searchQuery = (searchInput.value || "").trim();
        applyFilter();
      }, 120);
    });
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        searchInput.value = "";
        searchQuery = "";
        applyFilter();
        searchInput.blur();
      }
    });
  }

  const ariaKey = bar.getAttribute("aria-label");
  if (!ariaKey || ariaKey === "Test filtresi") {
    bar.setAttribute("aria-label", t(lang, "tests.filter_aria") || "Test filter");
  }

  document.addEventListener("lg-tests-rendered", () => {
    if (summaryEl) summaryEl.dataset.lgSummaryBase = summaryEl.textContent || "";
    syncFailFilter();
    applyFilter();
  });
  document.addEventListener("lg-lang-change", (e) => {
    if (e.detail?.lang) lang = e.detail.lang;
    bar.setAttribute("aria-label", t(lang, "tests.filter_aria") || "Test filter");
    syncSearchUi();
    syncFailFilter();
    applyFilter();
  });
  syncSearchUi();
  syncFailFilter();
  applyFilter();
}

function initSectionWipe() {
  if (!allowsHeavyMotion() || !document.body.classList.contains("page-home")) return;
  const wipe = document.getElementById("lg-motion-wipe");
  if (!wipe) return;
  let lastIdx = -1;
  let wipeTimer = 0;
  document.addEventListener("lg-section-change", (e) => {
    const idx = e.detail?.index;
    if (idx === undefined || idx === lastIdx) return;
    lastIdx = idx;
    wipe.classList.remove("lg-motion-wipe-play");
    void wipe.offsetWidth;
    wipe.classList.add("lg-motion-wipe-play");
    window.clearTimeout(wipeTimer);
    wipeTimer = window.setTimeout(() => wipe.classList.remove("lg-motion-wipe-play"), 820);
  });
}

function initScrollMicro() {
  if (prefersReducedMotion()) return;
  let lastY = window.scrollY;
  let tickTimer = 0;
  const progress = document.querySelector(".lg-scroll-progress");
  window.addEventListener(
    "scroll",
    () => {
      const dy = Math.abs(window.scrollY - lastY);
      if (dy < 6) return;
      lastY = window.scrollY;
      document.body.classList.add("lg-scroll-tick");
      if (progress) progress.classList.add("lg-scroll-pulse");
      window.clearTimeout(tickTimer);
      tickTimer = window.setTimeout(() => {
        document.body.classList.remove("lg-scroll-tick");
        if (progress) progress.classList.remove("lg-scroll-pulse");
      }, 160);
    },
    { passive: true }
  );
}

function initMotion() {
  if (document.body.classList.contains("page-home")) {
    initAtmospherePage();
    initWebGLStage();
    ensureHeroVisible();
  }
  initMotionMedia();
  initScrollProgress();
  initScrollSectionLabel();
  initNavScroll();
  initSectionPinJack();
  initReveal();
  initCounters();
  initParallax();
  initBridgeScroll();
  initHorizontalRail();
  initChapterIndex();
  initCaseOverlay();
  initCompareScroll();
  initHeroScrollJack();
  initSectionTransitions();
  initSectionPager();
  initSectionWipe();
  initScrollMicro();
  initEvidencePreview();
  initTerminalTypewriter();
  initContactStudio();
  initTestsMotion();
  initShotGrid();
  initSectionGlow();
  initPageEnterCascade();
  initPageReady();
  ensureSpineMotion();
  scheduleHeavyMotion();
}

function initShotGrid() {
  const shots = document.querySelectorAll(".shot-grid .shot");
  if (!shots.length) return;
  if (prefersReducedMotion()) {
    shots.forEach((s) => s.classList.add("lg-shot-visible"));
    return;
  }
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("lg-shot-visible");
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -6% 0px" }
  );
  shots.forEach((s) => obs.observe(s));

  if (isMotionLite()) return;
  shots.forEach((shot) => {
    shot.addEventListener(
      "pointermove",
      (e) => {
        if (!shot.classList.contains("lg-shot-visible")) return;
        const r = shot.getBoundingClientRect();
        const x = (e.clientX - r.left) / Math.max(r.width, 1) - 0.5;
        const y = (e.clientY - r.top) / Math.max(r.height, 1) - 0.5;
        shot.style.setProperty("--shot-tx", (x * 10).toFixed(2) + "deg");
        shot.style.setProperty("--shot-ty", (-y * 7).toFixed(2) + "deg");
      },
      { passive: true }
    );
    shot.addEventListener("pointerleave", () => {
      shot.style.removeProperty("--shot-tx");
      shot.style.removeProperty("--shot-ty");
    });
  });
}

function initSectionGlow() {
  if (prefersReducedMotion()) return;
  const sections = document.querySelectorAll(
    "main section, .lg-showcase, .lg-stats, .lg-motion-rail-wrap, .lg-motion-compare-wrap, .lg-tests-hero, .lg-tests-matrix"
  );
  if (!sections.length) return;
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("lg-in-view");
        } else {
          e.target.classList.remove("lg-in-view");
        }
      });
    },
    { threshold: 0.15, rootMargin: "-5% 0px -5% 0px" }
  );
  sections.forEach((s) => obs.observe(s));
}

let __lgBootDone = false;

function bootI18n() {
  if (__lgBootDone) return;
  __lgBootDone = true;

  window.setTimeout(() => {
    if (!document.body.classList.contains("lg-enter-done")) {
      forceFinishEnter();
    }
  }, 9000);

  if (__lgSriOk) {
    purgeServiceWorkers();
    installDomGuard();
  }
  initEnterCurtain().then(() => {
    const startHeavy = () => {
      initMotion();
    };
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(startHeavy, { timeout: 400 });
    } else {
      window.setTimeout(startHeavy, 0);
    }
    document.addEventListener("lg-reveal-refresh", () => requestAnimationFrame(lgRefreshReveal));
    document.addEventListener("lg-enter-complete", () => {
      ensureHeroVisible();
      window.setTimeout(() => initTitleSplit(), 120);
    });
    document.addEventListener("lg-lang-change", () => {
      window.setTimeout(() => initTitleSplit(), 40);
    });
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".lang-btn");
      if (!btn || !isAllowedLang(btn.dataset.lang)) return;
      e.preventDefault();
      setLang(btn.dataset.lang);
    });
    setTheme(getInitialTheme());
    setLang(getInitialLang());
    window.setTimeout(() => initTitleSplit(), 60);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootI18n);
} else {
  bootI18n();
}

window.addEventListener("pageshow", (e) => {
  if (!e.persisted) return;
  applyEnterDoneClasses();
  ensureSpineMotion();
  const enter = document.getElementById("lg-motion-enter");
  if (enter) {
    enter.classList.add("lg-motion-enter-out");
    enter.setAttribute("aria-hidden", "true");
  }
  if (document.body.classList.contains("page-tests") && !document.body.classList.contains("lg-tests-ready")) {
    document.dispatchEvent(new CustomEvent("lg-reveal-refresh"));
  }
});

/* ============================================================
 * SANDBOX: Coverflow navigation layer
 * prev/next · dot-click · keyboard · auto-advance · gentle snap.
 * Scroll-driven rail: we navigate by scrolling the page to the
 * scroll offset that maps to a given card index (no rail rewrite).
 * ============================================================ */
;(function lgCoverflowNav() {
  "use strict";
  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }
  ready(function () {
    var wrap = document.querySelector(".lg-motion-rail-wrap");
    var rail = document.getElementById("lg-motion-rail");
    if (!wrap || !rail) return;
    var cards = [].slice.call(rail.querySelectorAll(".lg-motion-card"));
    var n = cards.length;
    if (n < 2) return;

    var reduce = false;
    try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
    function enabled() {
      try { return window.matchMedia("(min-width: 640px)").matches; } catch (e) { return true; }
    }

    function metrics() {
      var rect = wrap.getBoundingClientRect();
      var vh = window.innerHeight;
      var total = wrap.offsetHeight - vh;
      var topAbs = window.scrollY + rect.top;
      return { rect: rect, vh: vh, total: total, topAbs: topAbs };
    }
    function frontIndex() {
      var m = metrics();
      if (m.total <= 0) return 0;
      var scrolled = Math.min(Math.max(-m.rect.top, 0), m.total);
      return Math.min(n - 1, Math.max(0, Math.round((scrolled / m.total) * (n - 1))));
    }
    function inRange() {
      var m = metrics();
      return m.rect.top <= 1 && m.rect.bottom - m.vh >= -1;
    }
    function goTo(i) {
      i = Math.min(n - 1, Math.max(0, i));
      var m = metrics();
      if (m.total <= 0) return;
      var p = n > 1 ? i / (n - 1) : 0;
      window.scrollTo({ top: Math.round(m.topAbs + p * m.total), behavior: reduce ? "auto" : "smooth" });
    }

    /* ---- auto-advance state ---- */
    var pauseUntil = 0;
    var hovering = false;
    var autoOn = !reduce;
    function nudge() { pauseUntil = Date.now() + 6500; }

    /* ---- prev / next / auto buttons ---- */
    var nav = document.getElementById("lg-motion-rail-nav");
    if (nav) {
      var prev = nav.querySelector("[data-rail-prev]");
      var next = nav.querySelector("[data-rail-next]");
      var auto = nav.querySelector("[data-rail-auto]");
      if (prev) prev.addEventListener("click", function () { nudge(); goTo(frontIndex() - 1); });
      if (next) next.addEventListener("click", function () { nudge(); goTo(frontIndex() + 1); });
      if (auto) auto.addEventListener("click", function () {
        autoOn = !autoOn;
        auto.setAttribute("aria-pressed", autoOn ? "true" : "false");
        if (autoOn) pauseUntil = 0;
      });
    }

    /* ---- dot clicks (dots built by initCoverflowRail) ---- */
    function bindDots() {
      var dw = document.getElementById("lg-motion-coverflow-dots");
      if (!dw) return;
      var dots = [].slice.call(dw.querySelectorAll(".lg-motion-coverflow-dot"));
      dots.forEach(function (d, i) {
        d.setAttribute("role", "button");
        d.setAttribute("tabindex", "0");
        d.setAttribute("aria-label", "Kart " + (i + 1));
        d.addEventListener("click", function () { nudge(); goTo(i); });
        d.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); nudge(); goTo(i); }
        });
      });
    }
    setTimeout(bindDots, 400);

    /* ---- keyboard arrows while the section owns the viewport ---- */
    window.addEventListener("keydown", function (e) {
      if (!enabled() || !inRange()) return;
      if (e.key === "ArrowRight") { e.preventDefault(); nudge(); goTo(frontIndex() + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); nudge(); goTo(frontIndex() - 1); }
    });

    /* ---- pause auto on any user intent ---- */
    wrap.addEventListener("pointerenter", function () { hovering = true; });
    wrap.addEventListener("pointerleave", function () { hovering = false; });
    window.addEventListener("wheel", nudge, { passive: true });
    window.addEventListener("touchstart", nudge, { passive: true });

    /* ---- auto-advance while pinned + idle ---- */
    window.setInterval(function () {
      if (reduce || !autoOn || !enabled()) return;
      if (hovering || document.hidden) return;
      if (Date.now() < pauseUntil) return;
      if (!inRange()) return;
      var f = frontIndex();
      if (f < n - 1) goTo(f + 1);
    }, 4200);

    /* ---- gentle snap after the user stops scrolling (mid-range only) ---- */
    var snapT = null;
    window.addEventListener("scroll", function () {
      if (reduce || !enabled()) return;
      window.clearTimeout(snapT);
      snapT = window.setTimeout(function () {
        if (Date.now() < pauseUntil || hovering) return;
        if (!inRange()) return;
        var m = metrics();
        var scrolled = Math.min(Math.max(-m.rect.top, 0), m.total);
        var raw = (scrolled / m.total) * (n - 1);
        var nearest = Math.round(raw);
        if (nearest <= 0 || nearest >= n - 1) return; // never trap at the ends
        if (Math.abs(raw - nearest) > 0.08) goTo(nearest);
      }, 240);
    }, { passive: true });
  });
})();

/* ============================================================
 * SANDBOX: Red laser cursor — bright red glowing trail follows mouse
 * ============================================================ */
;(function lgRedLaser() {
  "use strict";
  function ready(fn) { if (document.readyState !== "loading") fn(); else document.addEventListener("DOMContentLoaded", fn); }
  ready(function () {
    var reduce = false;
    try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
    if (reduce) return;
    try { if (window.matchMedia("(pointer: coarse)").matches) return; } catch (e) {}

    var canvas = document.getElementById("lg-laser");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "lg-laser";
      canvas.setAttribute("aria-hidden", "true");
      document.body.appendChild(canvas);
    }
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var w = 0, h = 0;
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize, { passive: true });

    var pts = [], MAX = 22, mx = -999, my = -999, has = false;
    window.addEventListener("pointermove", function (e) { mx = e.clientX; my = e.clientY; has = true; }, { passive: true });

    (function loop() {
      ctx.clearRect(0, 0, w, h);
      if (has) { pts.unshift({ x: mx, y: my }); if (pts.length > MAX) pts.pop(); }
      if (pts.length > 1) {
        ctx.lineCap = "round"; ctx.lineJoin = "round";
        // soft outer glow pass
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
        for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.strokeStyle = "rgba(255,20,20,0.18)"; ctx.lineWidth = 11;
        ctx.shadowColor = "rgba(255,0,0,0.9)"; ctx.shadowBlur = 20; ctx.stroke();
        // bright core beam
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
        for (var j = 1; j < pts.length; j++) ctx.lineTo(pts[j].x, pts[j].y);
        ctx.strokeStyle = "rgba(255,72,72,0.95)"; ctx.lineWidth = 2.2;
        ctx.shadowColor = "rgba(255,60,60,0.95)"; ctx.shadowBlur = 10; ctx.stroke();
        ctx.shadowBlur = 0;
      }
      if (has) {
        ctx.beginPath(); ctx.arc(mx, my, 3.2, 0, Math.PI * 2);
        ctx.fillStyle = "#fff"; ctx.shadowColor = "rgba(255,0,0,1)"; ctx.shadowBlur = 14; ctx.fill(); ctx.shadowBlur = 0;
      }
      requestAnimationFrame(loop);
    })();
  });
})();

