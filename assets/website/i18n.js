/* Linux Log Guardian — statik site çevirileri */
const I18N = {
  "tr": {
    "meta.description": "Linux Log Guardian — Türk yapımı açık kaynak nginx WAF. log → ban ~15 dk.",
    "hero.title": "Linux Log Guardian",
    "hero.tag": "nginx access log → WAF/CRS → kernel ban · tek zincir · self-hosted",
    "hero.badge_os": "Türkiye · açık kaynak",
    "hero.badge_mit": "MIT",
    "hero.badge_core": "Core ~15 dk kurulum",
    "hero.badge_soak": "72h soak PASS",
    "hero.cta_install": "15 dk kurulum",
    "hero.cta_dashboard": "Dashboard (kurulum sonrası)",
    "hero.cta_tests": "Test sonuçları",
    "hero.cta_evidence": "Kanıt paketi",
    "hero.cta_contact": "İletişim",
    "hero.cta_github": "GitHub kaynak",
    "nav.home": "Ana sayfa",
    "nav.install": "Kurulum",
    "nav.tests": "Testler",
    "nav.evidence": "Kanıt",
    "nav.contact": "İletişim",
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
    "scope.honest.body": "<ul><li><strong>Reaktif mimari</strong> — log satırı düşene kadar ilk istek geçebilir; inline ModSec hızında değiliz.</li><li><strong>L3/L4 DDoS</strong> absorb etmiyoruz — Cloudflare/CDN üstüne konuruz.</li><li><strong>Dağıtık botnet</strong> — IP başına ban; CrowdSec sinyal ağı yok.</li><li><strong>Yapar:</strong> log → CRS/WAF → ~17&nbsp;ms kernel ban, kanıt PDF, Telegram ops, MIT self-hosted.</li></ul>",
    "install.title": "Kurulum rehberi (detaylı)",
    "install.intro": "<p>Ubuntu/Debian üzerinde <strong>sıfırdan Core kurulumu</strong> (~15 dk). Kaynak: <a href=\"https://github.com/kurtulusutkucenik/Linux-Log-Guardian\">GitHub — Linux-Log-Guardian</a>. İki yol: hazır <strong>.deb</strong> (önerilen) veya kaynak koddan derleme. Laptop / VM'de XDP olmadan da çalışır. Repoda: <code>docs/QUICKSTART_NGINX.md</code> · <code>docs/LAPTOP_OPS.md</code>.</p>",
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
    "dashboard.where": "<strong>Önemli:</strong> Dashboard bu tanıtım sitesinde <em>çalışmaz</em>. <code>localhost:3001</code>, komutları çalıştırdığınız <strong>kendi Linux makinenizde</strong> açılır — ziyaretçinin tarayıcısındaki localhost sizin sunucunuz değildir.",
    "dashboard.body": "<p>Next.js tabanlı <strong>Pro dashboard</strong>: filo durumu, ban geçmişi, test sonuçları ve kanıt PDF'leri. Laptop geliştirmede <code>bash scripts/dashboard_dev.sh</code> → <code>http://localhost:3001</code>. İnternete açmadan önce <code>laptop_harden.sh</code>.</p>",
    "dashboard.access_title": "Kim, hangi şartla erişir?",
    "dashboard.access_row1_label": "Site ziyaretçisi",
    "dashboard.access_row1": "Bu sayfayı okur, kaynak veya .deb indirir — <strong>3001 açmaz</strong>, kurulum yapmaz.",
    "dashboard.access_row2_label": "Kuran kişi",
    "dashboard.access_row2": "Kendi makinede <code>bash scripts/dashboard_dev.sh</code> sonrası <strong>aynı makinede</strong> <code>http://localhost:3001</code>.",
    "dashboard.access_row3_label": "Uzak VPS",
    "dashboard.access_row3": "SSH tüneli: <code>ssh -L 3001:127.0.0.1:3001 …</code> — demo parola kapatılmadan internete açmayın.",
    "dashboard.req_title": "Dashboard için ek gereksinim",
    "dashboard.req_body": "<ul><li><strong>Core</strong> için yeterli: nginx + sudo — dashboard <em>zorunlu değil</em></li><li><strong>Dashboard</strong> için: Docker + <code>dashboard_stack.sh</code></li><li><strong>Grafana</strong> için: ayrıca <code>grafana_stack.sh</code> (opsiyonel)</li></ul>",
    "dashboard.start_title": "Kendi sunucunda başlat",
    "dashboard.start": "# On the machine where you installed (not this website):\nbash scripts/dashboard_dev.sh\n# Browser on the same machine:\n#   http://localhost:3001\n# Login: admin / DASHBOARD_ADMIN_PASSWORD in .env",
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
    "tests.page_intro": "Dashboard <code>/tests</code> ile aynı matris — kurulum kapıları, CRS parite, FP, ban gecikmesi, corpus recall ve <strong>72 saat soak</strong>. Her kart otomatik script çıktısıdır.",
    "tests.teaser": "Dashboard ile aynı otomatik test matrisi — <strong>28 kanıt</strong> (kurulum kapıları, CRS, FP, ban gecikmesi, corpus, 72h soak).",
    "tests.open_full": "Tüm testleri gör (28)",
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
    "hero.badge_os": "Turkey · open source",
    "hero.badge_mit": "MIT",
    "hero.badge_core": "Core ~15 min setup",
    "hero.badge_soak": "72h soak PASS",
    "hero.cta_install": "15 min setup",
    "hero.cta_dashboard": "Dashboard (after install)",
    "hero.cta_tests": "Test results",
    "hero.cta_evidence": "Evidence pack",
    "hero.cta_contact": "Contact",
    "hero.cta_github": "Source on GitHub",
    "nav.home": "Home",
    "nav.install": "Setup",
    "nav.tests": "Tests",
    "nav.evidence": "Evidence",
    "nav.contact": "Contact",
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
    "scope.honest.body": "<ul><li><strong>Reactive architecture</strong> — first request may pass until the log line is parsed; we are not inline ModSec throughput.</li><li><strong>No L3/L4 DDoS absorb</strong> — use CDN/Cloudflare on top.</li><li><strong>Distributed botnets</strong> — per-IP ban; no CrowdSec signal network.</li><li><strong>We do:</strong> log → CRS/WAF → ~17&nbsp;ms kernel ban, proof PDF, Telegram ops, MIT self-hosted.</li></ul>",
    "install.title": "Setup guide (detailed)",
    "install.intro": "<p><strong>Fresh Core install</strong> on Ubuntu/Debian (~15 min). Source: <a href=\"https://github.com/kurtulusutkucenik/Linux-Log-Guardian\">GitHub — Linux-Log-Guardian</a>. Two paths: <strong>.deb</strong> (recommended) or build from source. Works without XDP on laptop / VM. In repo: <code>docs/QUICKSTART_NGINX.md</code> · <code>docs/LAPTOP_OPS.md</code>.</p>",
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
    "dashboard.where": "<strong>Important:</strong> The dashboard does <em>not</em> run on this marketing site. <code>localhost:3001</code> is on <strong>your own Linux machine</strong> where you ran install — a visitor's browser localhost is not your server.",
    "dashboard.body": "<p>The <strong>Pro dashboard</strong> (Next.js): fleet status, ban history, tests and evidence PDFs. Laptop dev: <code>bash scripts/dashboard_dev.sh</code> → <code>http://localhost:3001</code>. Harden with <code>laptop_harden.sh</code> before exposing to the internet.</p>",
    "dashboard.access_title": "Who accesses it, and when?",
    "dashboard.access_row1_label": "Site visitor",
    "dashboard.access_row1": "Reads this page, downloads source or .deb — does <strong>not</strong> open port 3001.",
    "dashboard.access_row2_label": "Installer",
    "dashboard.access_row2": "After <code>bash scripts/dashboard_dev.sh</code> on their host, opens <code>http://localhost:3001</code> <strong>on that same machine</strong>.",
    "dashboard.access_row3_label": "Remote VPS",
    "dashboard.access_row3": "SSH tunnel: <code>ssh -L 3001:127.0.0.1:3001 …</code> — do not expose with demo password.",
    "dashboard.req_title": "Extra requirements for dashboard",
    "dashboard.req_body": "<ul><li><strong>Core</strong> only needs nginx + sudo — dashboard <em>not required</em></li><li><strong>Dashboard dev</strong>: Node.js + <code>dashboard_dev.sh</code></li><li><strong>Grafana</strong> additionally <code>grafana_stack.sh</code> (optional)</li></ul>",
    "dashboard.start_title": "Start on your server",
    "dashboard.start": "# On the machine where you installed (not this website):\nbash scripts/dashboard_dev.sh\n# Browser on the same machine:\n#   http://localhost:3001\n# Login: admin / DASHBOARD_ADMIN_PASSWORD in .env",
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
    "tests.page_intro": "Same matrix as dashboard <code>/tests</code> — install gates, CRS parity, FP, ban latency, corpus recall and <strong>72h soak</strong>. Each card is automated script output.",
    "tests.teaser": "Same automated test matrix as the dashboard — <strong>28 proofs</strong> (install gates, CRS, FP, ban latency, corpus, 72h soak).",
    "tests.open_full": "View all tests (28)",
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
    "hero.badge_os": "🇹🇷 Aus der Türkei",
    "hero.badge_mit": "Open Source · MIT",
    "hero.badge_core": "Core ~15 Min. Einrichtung",
    "hero.badge_soak": "72h soak PASS",
    "hero.cta_install": "15-Min.-Einrichtung",
    "hero.cta_dashboard": "Dashboard (nach Installation)",
    "hero.cta_tests": "Test results",
    "hero.cta_evidence": "Evidence-Paket",
    "hero.cta_contact": "Kontakt",
    "hero.cta_github": "Source on GitHub",
    "nav.home": "Home",
    "nav.install": "Setup",
    "nav.tests": "Tests",
    "nav.evidence": "Evidence",
    "nav.contact": "Contact",
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
    "scope.honest.body": "<ul><li><strong>Reactive architecture</strong> — first request may pass until the log line is parsed; we are not inline ModSec throughput.</li><li><strong>No L3/L4 DDoS absorb</strong> — use CDN/Cloudflare on top.</li><li><strong>Distributed botnets</strong> — per-IP ban; no CrowdSec signal network.</li><li><strong>We do:</strong> log → CRS/WAF → ~17&nbsp;ms kernel ban, proof PDF, Telegram ops, MIT self-hosted.</li></ul>",
    "install.title": "Installationsanleitung (detailliert)",
    "install.intro": "<p>Schritt-für-Schritt <strong>Produktions-Setup</strong> auf Ubuntu/Debian. Läuft ohne XDP auf Laptop oder VirtualBox-VM. Vollständige Docs: <code>docs/QUICKSTART_NGINX.md</code> und <code>docs/LAPTOP_OPS.md</code>.</p>",
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
    "dashboard.start": "# On the machine where you installed (not this website):\nbash scripts/dashboard_dev.sh\n# Browser on the same machine:\n#   http://localhost:3001\n# Login: admin / DASHBOARD_ADMIN_PASSWORD in .env",
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
    "tests.page_intro": "Same matrix as dashboard <code>/tests</code> — install gates, CRS parity, FP, ban latency, corpus recall and <strong>72h soak</strong>. Each card is automated script output.",
    "tests.teaser": "Same automated test matrix as the dashboard — <strong>28 proofs</strong> (install gates, CRS, FP, ban latency, corpus, 72h soak).",
    "tests.open_full": "View all tests (28)",
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
    "hero.badge_os": "🇹🇷 Fabriqué en Turquie",
    "hero.badge_mit": "Open source · MIT",
    "hero.badge_core": "Core ~15 min d'installation",
    "hero.badge_soak": "72h soak PASS",
    "hero.cta_install": "Installation 15 min",
    "hero.cta_dashboard": "Tableau de bord (après install)",
    "hero.cta_tests": "Test results",
    "hero.cta_evidence": "Pack de preuves",
    "hero.cta_contact": "Contact",
    "hero.cta_github": "Source on GitHub",
    "nav.home": "Home",
    "nav.install": "Setup",
    "nav.tests": "Tests",
    "nav.evidence": "Evidence",
    "nav.contact": "Contact",
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
    "scope.honest.body": "<ul><li><strong>Reactive architecture</strong> — first request may pass until the log line is parsed; we are not inline ModSec throughput.</li><li><strong>No L3/L4 DDoS absorb</strong> — use CDN/Cloudflare on top.</li><li><strong>Distributed botnets</strong> — per-IP ban; no CrowdSec signal network.</li><li><strong>We do:</strong> log → CRS/WAF → ~17&nbsp;ms kernel ban, proof PDF, Telegram ops, MIT self-hosted.</li></ul>",
    "install.title": "Guide d'installation (détaillé)",
    "install.intro": "<p>Installation <strong>production</strong> pas à pas sur Ubuntu/Debian. Fonctionne sans XDP sur laptop ou VM VirtualBox. Docs : <code>docs/QUICKSTART_NGINX.md</code> et <code>docs/LAPTOP_OPS.md</code>.</p>",
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
    "dashboard.start": "# On the machine where you installed (not this website):\nbash scripts/dashboard_dev.sh\n# Browser on the same machine:\n#   http://localhost:3001\n# Login: admin / DASHBOARD_ADMIN_PASSWORD in .env",
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
    "tests.page_intro": "Same matrix as dashboard <code>/tests</code> — install gates, CRS parity, FP, ban latency, corpus recall and <strong>72h soak</strong>. Each card is automated script output.",
    "tests.teaser": "Same automated test matrix as the dashboard — <strong>28 proofs</strong> (install gates, CRS, FP, ban latency, corpus, 72h soak).",
    "tests.open_full": "View all tests (28)",
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
    "hero.badge_os": "🇹🇷 Hecho en Turquía",
    "hero.badge_mit": "Open source · MIT",
    "hero.badge_core": "Core ~15 min de instalación",
    "hero.badge_soak": "72h soak PASS",
    "hero.cta_install": "Instalación 15 min",
    "hero.cta_dashboard": "Panel (tras instalar)",
    "hero.cta_tests": "Test results",
    "hero.cta_evidence": "Paquete de pruebas",
    "hero.cta_contact": "Contacto",
    "hero.cta_github": "Source on GitHub",
    "nav.home": "Home",
    "nav.install": "Setup",
    "nav.tests": "Tests",
    "nav.evidence": "Evidence",
    "nav.contact": "Contact",
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
    "scope.honest.body": "<ul><li><strong>Reactive architecture</strong> — first request may pass until the log line is parsed; we are not inline ModSec throughput.</li><li><strong>No L3/L4 DDoS absorb</strong> — use CDN/Cloudflare on top.</li><li><strong>Distributed botnets</strong> — per-IP ban; no CrowdSec signal network.</li><li><strong>We do:</strong> log → CRS/WAF → ~17&nbsp;ms kernel ban, proof PDF, Telegram ops, MIT self-hosted.</li></ul>",
    "install.title": "Guía de instalación (detallada)",
    "install.intro": "<p>Instalación <strong>de producción</strong> paso a paso en Ubuntu/Debian. Funciona sin XDP en laptop o VM VirtualBox. Docs: <code>docs/QUICKSTART_NGINX.md</code> y <code>docs/LAPTOP_OPS.md</code>.</p>",
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
    "dashboard.start": "# On the machine where you installed (not this website):\nbash scripts/dashboard_dev.sh\n# Browser on the same machine:\n#   http://localhost:3001\n# Login: admin / DASHBOARD_ADMIN_PASSWORD in .env",
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
    "tests.page_intro": "Same matrix as dashboard <code>/tests</code> — install gates, CRS parity, FP, ban latency, corpus recall and <strong>72h soak</strong>. Each card is automated script output.",
    "tests.teaser": "Same automated test matrix as the dashboard — <strong>28 proofs</strong> (install gates, CRS, FP, ban latency, corpus, 72h soak).",
    "tests.open_full": "View all tests (28)",
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
    "hero.badge_os": "🇹🇷 Feito na Turquia",
    "hero.badge_mit": "Open source · MIT",
    "hero.badge_core": "Core ~15 min de instalação",
    "hero.badge_soak": "72h soak PASS",
    "hero.cta_install": "Instalação 15 min",
    "hero.cta_dashboard": "Painel (após instalar)",
    "hero.cta_tests": "Test results",
    "hero.cta_evidence": "Pacote de evidências",
    "hero.cta_contact": "Contato",
    "hero.cta_github": "Source on GitHub",
    "nav.home": "Home",
    "nav.install": "Setup",
    "nav.tests": "Tests",
    "nav.evidence": "Evidence",
    "nav.contact": "Contact",
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
    "scope.honest.body": "<ul><li><strong>Reactive architecture</strong> — first request may pass until the log line is parsed; we are not inline ModSec throughput.</li><li><strong>No L3/L4 DDoS absorb</strong> — use CDN/Cloudflare on top.</li><li><strong>Distributed botnets</strong> — per-IP ban; no CrowdSec signal network.</li><li><strong>We do:</strong> log → CRS/WAF → ~17&nbsp;ms kernel ban, proof PDF, Telegram ops, MIT self-hosted.</li></ul>",
    "install.title": "Guia de instalação (detalhado)",
    "install.intro": "<p>Instalação <strong>de produção</strong> passo a passo em Ubuntu/Debian. Funciona sem XDP em laptop ou VM VirtualBox. Docs: <code>docs/QUICKSTART_NGINX.md</code> e <code>docs/LAPTOP_OPS.md</code>.</p>",
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
    "dashboard.start": "# On the machine where you installed (not this website):\nbash scripts/dashboard_dev.sh\n# Browser on the same machine:\n#   http://localhost:3001\n# Login: admin / DASHBOARD_ADMIN_PASSWORD in .env",
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
    "tests.page_intro": "Same matrix as dashboard <code>/tests</code> — install gates, CRS parity, FP, ban latency, corpus recall and <strong>72h soak</strong>. Each card is automated script output.",
    "tests.teaser": "Same automated test matrix as the dashboard — <strong>28 proofs</strong> (install gates, CRS, FP, ban latency, corpus, 72h soak).",
    "tests.open_full": "View all tests (28)",
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
    "hero.badge_os": "🇹🇷 Сделано в Турции",
    "hero.badge_mit": "Open source · MIT",
    "hero.badge_core": "Core ~15 мин установки",
    "hero.badge_soak": "72h soak PASS",
    "hero.cta_install": "Установка 15 мин",
    "hero.cta_dashboard": "Панель (после установки)",
    "hero.cta_tests": "Test results",
    "hero.cta_evidence": "Пакет доказательств",
    "hero.cta_contact": "Контакт",
    "hero.cta_github": "Source on GitHub",
    "nav.home": "Home",
    "nav.install": "Setup",
    "nav.tests": "Tests",
    "nav.evidence": "Evidence",
    "nav.contact": "Contact",
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
    "scope.honest.body": "<ul><li><strong>Reactive architecture</strong> — first request may pass until the log line is parsed; we are not inline ModSec throughput.</li><li><strong>No L3/L4 DDoS absorb</strong> — use CDN/Cloudflare on top.</li><li><strong>Distributed botnets</strong> — per-IP ban; no CrowdSec signal network.</li><li><strong>We do:</strong> log → CRS/WAF → ~17&nbsp;ms kernel ban, proof PDF, Telegram ops, MIT self-hosted.</li></ul>",
    "install.title": "Руководство по установке (подробно)",
    "install.intro": "<p>Пошаговая <strong>production</strong> установка на Ubuntu/Debian. Работает без XDP на laptop или VirtualBox VM. Документация: <code>docs/QUICKSTART_NGINX.md</code> и <code>docs/LAPTOP_OPS.md</code>.</p>",
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
    "dashboard.start": "# On the machine where you installed (not this website):\nbash scripts/dashboard_dev.sh\n# Browser on the same machine:\n#   http://localhost:3001\n# Login: admin / DASHBOARD_ADMIN_PASSWORD in .env",
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
    "tests.page_intro": "Same matrix as dashboard <code>/tests</code> — install gates, CRS parity, FP, ban latency, corpus recall and <strong>72h soak</strong>. Each card is automated script output.",
    "tests.teaser": "Same automated test matrix as the dashboard — <strong>28 proofs</strong> (install gates, CRS, FP, ban latency, corpus, 72h soak).",
    "tests.open_full": "View all tests (28)",
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
    "hero.badge_os": "🇹🇷 صنع في تركيا",
    "hero.badge_mit": "مفتوح المصدر · MIT",
    "hero.badge_core": "Core ~15 دقيقة للتثبيت",
    "hero.badge_soak": "72h soak PASS",
    "hero.cta_install": "تثبيت 15 دقيقة",
    "hero.cta_dashboard": "لوحة التحكم (بعد التثبيت)",
    "hero.cta_tests": "Test results",
    "hero.cta_evidence": "حزمة الأدلة",
    "hero.cta_contact": "تواصل",
    "hero.cta_github": "Source on GitHub",
    "nav.home": "Home",
    "nav.install": "Setup",
    "nav.tests": "Tests",
    "nav.evidence": "Evidence",
    "nav.contact": "Contact",
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
    "scope.honest.body": "<ul><li><strong>Reactive architecture</strong> — first request may pass until the log line is parsed; we are not inline ModSec throughput.</li><li><strong>No L3/L4 DDoS absorb</strong> — use CDN/Cloudflare on top.</li><li><strong>Distributed botnets</strong> — per-IP ban; no CrowdSec signal network.</li><li><strong>We do:</strong> log → CRS/WAF → ~17&nbsp;ms kernel ban, proof PDF, Telegram ops, MIT self-hosted.</li></ul>",
    "install.title": "دليل التثبيت (مفصل)",
    "install.intro": "<p>تثبيت <strong>إنتاج</strong> خطوة بخطوة على Ubuntu/Debian. يعمل بدون XDP على laptop أو VirtualBox VM. الوثائق: <code>docs/QUICKSTART_NGINX.md</code> و<code>docs/LAPTOP_OPS.md</code>.</p>",
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
    "dashboard.start": "# On the machine where you installed (not this website):\nbash scripts/dashboard_dev.sh\n# Browser on the same machine:\n#   http://localhost:3001\n# Login: admin / DASHBOARD_ADMIN_PASSWORD in .env",
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
    "tests.page_intro": "Same matrix as dashboard <code>/tests</code> — install gates, CRS parity, FP, ban latency, corpus recall and <strong>72h soak</strong>. Each card is automated script output.",
    "tests.teaser": "Same automated test matrix as the dashboard — <strong>28 proofs</strong> (install gates, CRS, FP, ban latency, corpus, 72h soak).",
    "tests.open_full": "View all tests (28)",
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
    "hero.badge_os": "🇹🇷 土耳其制造",
    "hero.badge_mit": "开源 · MIT",
    "hero.badge_core": "Core 约 15 分钟安装",
    "hero.badge_soak": "72h soak PASS",
    "hero.cta_install": "15 分钟安装",
    "hero.cta_dashboard": "仪表盘（安装后）",
    "hero.cta_tests": "Test results",
    "hero.cta_evidence": "证据包",
    "hero.cta_contact": "联系",
    "hero.cta_github": "Source on GitHub",
    "nav.home": "Home",
    "nav.install": "Setup",
    "nav.tests": "Tests",
    "nav.evidence": "Evidence",
    "nav.contact": "Contact",
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
    "scope.honest.body": "<ul><li><strong>Reactive architecture</strong> — first request may pass until the log line is parsed; we are not inline ModSec throughput.</li><li><strong>No L3/L4 DDoS absorb</strong> — use CDN/Cloudflare on top.</li><li><strong>Distributed botnets</strong> — per-IP ban; no CrowdSec signal network.</li><li><strong>We do:</strong> log → CRS/WAF → ~17&nbsp;ms kernel ban, proof PDF, Telegram ops, MIT self-hosted.</li></ul>",
    "install.title": "安装指南（详细）",
    "install.intro": "<p>在 Ubuntu/Debian 上<strong>生产环境</strong>分步安装。笔记本或 VirtualBox VM 可无 XDP 运行。完整文档：<code>docs/QUICKSTART_NGINX.md</code> 与 <code>docs/LAPTOP_OPS.md</code>。</p>",
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
    "dashboard.start": "# On the machine where you installed (not this website):\nbash scripts/dashboard_dev.sh\n# Browser on the same machine:\n#   http://localhost:3001\n# Login: admin / DASHBOARD_ADMIN_PASSWORD in .env",
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
    "tests.page_intro": "Same matrix as dashboard <code>/tests</code> — install gates, CRS parity, FP, ban latency, corpus recall and <strong>72h soak</strong>. Each card is automated script output.",
    "tests.teaser": "Same automated test matrix as the dashboard — <strong>28 proofs</strong> (install gates, CRS, FP, ban latency, corpus, 72h soak).",
    "tests.open_full": "View all tests (28)",
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

let ttPolicy = null;
let __lgApplyingI18n = false;
if (typeof window !== "undefined" && window.trustedTypes && window.trustedTypes.createPolicy) {
  try {
    ttPolicy = window.trustedTypes.createPolicy("lgI18n", {
      createHTML: (input) => sanitizeHtml(String(input)),
    });
  } catch (_) {}
}

function sanitizeHtml(html) {
  if (!html) return "";
  if (html.length > MAX_I18N_HTML_LEN) return "";
  if (/\0/.test(html)) return "";
  if (UNSAFE_HTML_RE.test(html)) return "";

  const doc = new DOMParser().parseFromString(html, "text/html");
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

  doc.body.childNodes.forEach((child) => appendSafe(out, child));
  return out.innerHTML;
}

function stripHtmlToText(html) {
  return String(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function setSafeHtml(el, html) {
  const cleaned = sanitizeHtml(html);
  const payload = cleaned || stripHtmlToText(html);
  if (!payload) return;
  if (ttPolicy) {
    el.innerHTML = ttPolicy.createHTML(payload);
  } else {
    el.innerHTML = payload;
  }
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
  const theme = document.documentElement.getAttribute("data-theme") || "dark";
  const key = theme === "dark" ? "theme.label_light" : "theme.label_dark";
  const label = t(lang, key);
  document.querySelectorAll(".theme-btn").forEach((btn) => {
    if (label) {
      btn.setAttribute("aria-label", label);
      btn.setAttribute("title", label);
    }
  });
}

function setTheme(theme) {
  if (!isAllowedTheme(theme)) theme = "dark";
  document.documentElement.setAttribute("data-theme", theme);
  document.querySelectorAll(".theme-btn").forEach((btn) => {
    btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    btn.textContent = theme === "dark" ? "\u2600" : "\u263E";
  });
  try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
  updateThemeButtonLabel(document.documentElement.lang || DEFAULT_LANG);
}

function getInitialTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (isAllowedTheme(saved)) return saved;
  } catch (_) {}
  try {
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
      return "light";
    }
  } catch (_) {}
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

let __lgBootDone = false;

function bootI18n() {
  if (__lgBootDone) return;
  __lgBootDone = true;
  if (__lgSriOk) {
    purgeServiceWorkers();
    installDomGuard();
  }
  document.addEventListener("click", (e) => {
    const themeBtn = e.target.closest(".theme-btn");
    if (themeBtn) {
      e.preventDefault();
      const cur = document.documentElement.getAttribute("data-theme") || "dark";
      setTheme(cur === "dark" ? "light" : "dark");
      return;
    }
    const btn = e.target.closest(".lang-btn");
    if (!btn || !isAllowedLang(btn.dataset.lang)) return;
    e.preventDefault();
    setLang(btn.dataset.lang);
  });
  setTheme(getInitialTheme());
  setLang(getInitialLang());
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootI18n);
} else {
  bootI18n();
}
