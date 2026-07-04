import type { PipelineStepDeep } from "./types";

export const STEPS_TR: PipelineStepDeep[] = [
  {
    what:
      "nginx'in zaten yazdığı access log dosyasını gerçek zamanlı okur. Ek reverse proxy, sidecar veya bulut agent'ı gerekmez — sunucudaki log satırı tek zincirin başlangıcıdır.",
    advantages: [
      "Mevcut nginx kurulumuna dokunmadan çalışır; yalnızca log formatı ayarı yeterli",
      "log_guardian formatı ile URI, method, XFF ve body tek şemada hazır",
      "Cloud'a log gönderimi yok — tam self-hosted, veri sunucunuzda kalır",
      "Satır başına anlık işleme; kurulum ~15 dakika",
    ],
    lg: "Tek binary nginx logunu okur; ayrı Fail2ban/CrowdSec agent kurulumu yok.",
    rivals:
      "CrowdSec ayrı agent + merkezi API ister. Fail2ban log okur ama WAF katmanına geçmez — parçalı mimari.",
    proof: "75 otomatik test · kurulum gate PASS",
  },
  {
    what:
      "Her log satırını URI, HTTP method, X-Forwarded-For, User-Agent ve isteğe bağlı body ile tek bir normalize şemaya dönüştürür. WAF, ban ve metrik katmanları aynı yapıyı paylaşır.",
    advantages: [
      "Tek şema — parser, WAF ve ban pipeline arasında format uyumsuzluğu yok",
      "XFF ve proxy zinciri doğru IP çıkarımı için normalize edilir",
      "Yüksek hacimde satır/saniye işleme; bench ile ölçülmüş throughput",
      "Strict mod ile eksik alanlar kurulum gate'inde yakalanır",
    ],
    lg: "Log → normalize → WAF aynı process içinde; ara format veya ETL yok.",
    rivals:
      "ModSecurity nginx modülü inline çalışır ama log tabanlı ban için Fail2ban'a ayrı entegrasyon gerekir. CrowdSec farklı parser + sinyal ağı kullanır.",
    proof: "280.373 EPS · 16,93× ModSec (bench-vs-modsec.json)",
  },
  {
    what:
      "OWASP CRS 121 kural, PCRE2 JIT derlemesi ve OpenAPI/schema + BOLA doğrulaması ile saldırı desenlerini değerlendirir. ModSecurity ile aynı corpus'ta %100 parity ölçülmüştür.",
    advantages: [
      "121 OWASP CRS kuralı — endüstri standardı WAF kapsamı",
      "PCRE2 JIT ile yüksek throughput; 280.373 EPS ölçülmüş",
      "Schema/BOLA katmanı API kötüye kullanımını yakalar",
      "Gerçek saldırı recall %100 · false positive %0,2 (1500 satır corpus)",
    ],
    lg: "WAF + CRS tek üründe; ayrı ModSecurity modülü kurulumu yok. Aynı 121 kuralda ModSec'ten 16,93× hızlı.",
    rivals:
      "ModSecurity + CRS ayrı modül, nginx'e inline takılır — ilk istek anında bloklar ama log→ban zinciri yok. Fail2ban WAF değerlendirmesi yapmaz.",
    proof: "CRS parity %100 · recall %100 · FP %0,2",
  },
  {
    what:
      "WAF eşleşmesinden sonra tenant politikası, ban eşiği, false-positive trust skoru ve operatör onayı tek karar hattında birleşir. Yanlış ban riski ölçülmüş kapılarla sınırlanır.",
    advantages: [
      "Policy + tenant + FP trust tek pipeline — ayrı Fail2ban jail yapılandırması yok",
      "500 benign satırda %0,2 FP — ölçülmüş kapı",
      "Multi-tenant etiketleme Prometheus ve dashboard'a taşınır",
      "IPC auth fail-closed; yetkisiz ban komutu reddedilir",
    ],
    lg: "Log satırından ban kararı ~20 ms medyan; policy, tenant ve FP trust aynı kod yolunda.",
    rivals:
      "Fail2ban yalnızca regex/jail ban atar; FP trust ve tenant ayrı sistemlerde. CrowdSec merkezi karar + dağıtık agent ister.",
    proof: "~20 ms medyan ban · 21 ölçüm (bench-ban-latency.json)",
  },
  {
    what:
      "Karar anında ipset ve isteğe bağlı XDP/eBPF ile kernel seviyesinde ban uygular. Kullanıcı alanından kernel'e geçiş ölçülmüş ~20 ms medyan gecikmeyle tamamlanır.",
    advantages: [
      "Kernel seviyesi ban — iptables/nftables + ipset; rootkit bypass zorlaşır",
      "XDP ile paket düşürme opsiyonel; laptop/VM'de --no-xdp + ipset yeterli",
      "Medyan ~20 ms log satırından ban'a (21 ölçüm)",
      "Dağıtık saldırı: JA3 cluster + IP başına ban — 80 IP testte %100",
    ],
    lg: "Log → kernel ban tek zincir, ~20 ms. Fail2ban/CrowdSec saniye–dakika aralığında kalır.",
    rivals:
      "Fail2ban ban gecikmesi saniyeler–dakikalar. CrowdSec sinyal ağına bağımlı; kernel ban ayrı entegrasyon. ModSecurity inline bloklar ama kalıcı ipset ban pipeline'ı yok.",
    proof: "72h soak · 864 örnek · 0 hata",
  },
  {
    what:
      "Her adım tenant etiketli Prometheus metriklerine, Grafana panolarına ve :8443 SOC dashboard timeline'ına yazar. Operatör Telegram alert + tek tık onay akışını aynı panelden yönetir.",
    advantages: [
      "tenant_id etiketli loganalyzer_* metrikleri — çok kiracılı gözlemlenebilirlik",
      "SOC timeline, attack map ve /tests kanıt matrisi aynı dashboard'da",
      "Self-hosted :8443 — veri üçüncü taraf buluta gitmez",
      "14 dosyalık PDF/JSON kanıt paketi otomatik senkron",
    ],
    lg: "Metrik + dashboard + kanıt tek üründe; CrowdSec SaaS konsolu veya parçalı Grafana kurulumu gerekmez.",
    rivals:
      "Fail2ban metrik/export sınırlı. CrowdSec managed SaaS konsolu veya self-hosted parça kurulum. ModSecurity log üretir ama SOC timeline ve otomatik kanıt paketi sunmaz.",
    proof: "75 test · competitive-proof.json · dashboard /tests",
  },
];

export const STEPS_EN: PipelineStepDeep[] = [
  {
    what:
      "Reads the nginx access log file you already write, in real time. No extra reverse proxy, sidecar or cloud agent — the log line on your server is the start of a single chain.",
    advantages: [
      "Works without replacing nginx; only a log format tweak is needed",
      "log_guardian format exposes URI, method, XFF and body in one schema",
      "No shipping logs to the cloud — fully self-hosted, data stays on your server",
      "Per-line instant processing; setup in ~15 minutes",
    ],
    lg: "One binary reads nginx logs — no separate Fail2ban/CrowdSec agent install.",
    rivals:
      "CrowdSec needs a separate agent plus central API. Fail2ban reads logs but never reaches a WAF layer — piecemeal architecture.",
    proof: "75 automated tests · install gate PASS",
  },
  {
    what:
      "Turns each log line into one normalized schema: URI, HTTP method, X-Forwarded-For, User-Agent and optional body. WAF, ban and metrics layers all share the same structure.",
    advantages: [
      "One schema — no format mismatch between parser, WAF and ban pipeline",
      "XFF and proxy chains normalized for correct client IP extraction",
      "High lines/sec throughput — measured in benchmarks",
      "Strict mode catches missing fields at install gates",
    ],
    lg: "Log → normalize → WAF in one process; no intermediate format or ETL.",
    rivals:
      "ModSecurity runs inline in nginx but log-based banning needs separate Fail2ban integration. CrowdSec uses a different parser plus signal network.",
    proof: "280,373 EPS · 16.93× ModSec (bench-vs-modsec.json)",
  },
  {
    what:
      "Evaluates attack patterns with 121 OWASP CRS rules, PCRE2 JIT compilation and OpenAPI/schema + BOLA validation. Measured 100% parity with ModSecurity on the same corpus.",
    advantages: [
      "121 OWASP CRS rules — industry-standard WAF coverage",
      "PCRE2 JIT for high throughput; 280,373 EPS measured",
      "Schema/BOLA layer catches API abuse",
      "100% real-attack recall · 0.2% false positive (1500-line corpus)",
    ],
    lg: "WAF + CRS in one product — no separate ModSecurity module. 16.93× faster than ModSec on the same 121 rules.",
    rivals:
      "ModSecurity + CRS is a separate module bolted onto nginx — blocks the first request inline but has no log→ban chain. Fail2ban does not run WAF evaluation.",
    proof: "CRS parity 100% · recall 100% · FP 0.2%",
  },
  {
    what:
      "After a WAF match, tenant policy, ban threshold, false-positive trust score and operator ack merge in one decision path. Wrong-ban risk is bounded by measured gates.",
    advantages: [
      "Policy + tenant + FP trust in one pipeline — no separate Fail2ban jail tuning",
      "0.2% FP on 500 benign lines — measured gate",
      "Multi-tenant labels flow to Prometheus and dashboard",
      "IPC auth is fail-closed; unauthorized ban commands are rejected",
    ],
    lg: "~20 ms median from log line to ban decision; policy, tenant and FP trust share one code path.",
    rivals:
      "Fail2ban only fires regex/jail bans; FP trust and tenant live in other systems. CrowdSec needs central decision plus distributed agents.",
    proof: "~20 ms median ban · 21 samples (bench-ban-latency.json)",
  },
  {
    what:
      "Applies the ban at kernel level via ipset and optional XDP/eBPF the moment the decision is made. The userspace→kernel hop completes in a measured ~20 ms median.",
    advantages: [
      "Kernel-level ban — iptables/nftables + ipset; harder to bypass from userspace",
      "Optional XDP packet drop; on laptop/VM --no-xdp + ipset is enough",
      "~20 ms median from log line to ban (21 samples)",
      "Distributed attacks: JA3 cluster + per-IP ban — 100% on 80-IP live test",
    ],
    lg: "Log → kernel ban in one chain, ~20 ms. Fail2ban/CrowdSec stay in seconds–minutes.",
    rivals:
      "Fail2ban ban latency is seconds to minutes. CrowdSec depends on its signal network; kernel ban is another integration. ModSecurity blocks inline but has no persistent ipset ban pipeline.",
    proof: "72h soak · 864 samples · 0 errors",
  },
  {
    what:
      "Every step writes tenant-tagged Prometheus metrics, Grafana dashboards and the :8443 SOC dashboard timeline. Operators manage Telegram alerts and one-click ack from the same panel.",
    advantages: [
      "tenant_id-tagged loganalyzer_* metrics — multi-tenant observability",
      "SOC timeline, attack map and /tests proof matrix in one dashboard",
      "Self-hosted :8443 — no data sent to third-party cloud",
      "14-file PDF/JSON evidence pack syncs automatically",
    ],
    lg: "Metrics + dashboard + proof in one product — no CrowdSec SaaS console or piecemeal Grafana stack.",
    rivals:
      "Fail2ban has limited metrics/export. CrowdSec wants managed SaaS or self-hosted piecemeal setup. ModSecurity emits logs but no SOC timeline or automatic proof pack.",
    proof: "75 tests · competitive-proof.json · dashboard /tests",
  },
];
