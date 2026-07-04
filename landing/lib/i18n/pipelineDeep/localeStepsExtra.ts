import type { PipelineStepDeep } from "./types";

export const STEPS_PT: PipelineStepDeep[] = [
  {
    what:
      "Lê o access log do nginx que você já grava, em tempo real. Sem reverse proxy, sidecar ou agente na nuvem — a linha de log no seu servidor é o início de uma única cadeia.",
    advantages: [
      "Funciona sem substituir o nginx; basta ajustar o formato do log",
      "O formato log_guardian expõe URI, method, XFF e body num único schema",
      "Sem enviar logs para a nuvem — totalmente self-hosted",
      "Processamento instantâneo por linha; instalação em ~15 minutos",
    ],
    lg: "Um único binário lê logs nginx — sem agente Fail2ban/CrowdSec separado.",
    rivals:
      "CrowdSec exige agente separado e API central. Fail2ban lê logs mas não chega à camada WAF — arquitetura fragmentada.",
    proof: "75 testes automáticos · gate de instalação PASS",
  },
  {
    what:
      "Converte cada linha num schema normalizado: URI, método HTTP, X-Forwarded-For, User-Agent e body opcional. WAF, ban e métricas partilham a mesma estrutura.",
    advantages: [
      "Um schema — sem incompatibilidade entre parser, WAF e pipeline de ban",
      "XFF e cadeias proxy normalizados para IP cliente correto",
      "Alto throughput em linhas/segundo — medido em benchmarks",
      "Modo strict deteta campos em falta nos gates de instalação",
    ],
    lg: "Log → normalizar → WAF num único processo; sem formato intermédio nem ETL.",
    rivals:
      "ModSecurity corre inline no nginx mas ban por logs exige Fail2ban à parte. CrowdSec usa outro parser e rede de sinais.",
    proof: "280.373 EPS · 16,93× ModSec (bench-vs-modsec.json)",
  },
  {
    what:
      "Avalia padrões de ataque com 121 regras OWASP CRS, compilação PCRE2 JIT e validação OpenAPI/schema + BOLA. Paridade medida de 100% com ModSecurity no mesmo corpus.",
    advantages: [
      "121 regras OWASP CRS — cobertura WAF padrão da indústria",
      "PCRE2 JIT para alto throughput; 280.373 EPS medidos",
      "Camada schema/BOLA deteta abuso de API",
      "100% recall de ataques reais · 0,2% falsos positivos (corpus 1500 linhas)",
    ],
    lg: "WAF + CRS num único produto — sem módulo ModSecurity separado. 16,93× mais rápido que ModSec nas mesmas 121 regras.",
    rivals:
      "ModSecurity + CRS é módulo aparte no nginx — bloqueia o primeiro pedido inline mas sem cadeia log→ban. Fail2ban não faz avaliação WAF.",
    proof: "Paridade CRS 100% · recall 100% · FP 0,2%",
  },
  {
    what:
      "Após match WAF, política tenant, limiar de ban, score FP trust e confirmação do operador unem-se num único caminho de decisão. Risco de ban errado limitado por gates medidos.",
    advantages: [
      "Policy + tenant + FP trust num pipeline — sem jails Fail2ban separados",
      "0,2% FP em 500 linhas benignas — gate medido",
      "Etiquetas multi-tenant fluem para Prometheus e dashboard",
      "Auth IPC fail-closed; comandos de ban não autorizados rejeitados",
    ],
    lg: "~20 ms mediano da linha de log à decisão de ban; policy, tenant e FP trust no mesmo code path.",
    rivals:
      "Fail2ban só dispara bans regex/jail; FP trust e tenant vivem noutros sistemas. CrowdSec exige decisão central e agentes distribuídos.",
    proof: "~20 ms ban mediano · 21 amostras (bench-ban-latency.json)",
  },
  {
    what:
      "Aplica o ban ao nível kernel via ipset e XDP/eBPF opcional no momento da decisão. Salto userspace→kernel em ~20 ms mediano medido.",
    advantages: [
      "Ban ao nível kernel — iptables/nftables + ipset; mais difícil contornar do userspace",
      "Drop XDP opcional; em laptop/VM basta --no-xdp + ipset",
      "~20 ms mediano da linha de log ao ban (21 amostras)",
      "Ataques distribuídos: cluster JA3 + ban por IP — 100% em teste live 80 IP",
    ],
    lg: "Log → ban kernel numa cadeia, ~20 ms. Fail2ban/CrowdSec ficam em segundos–minutos.",
    rivals:
      "Latência de ban Fail2ban: segundos a minutos. CrowdSec depende da rede de sinais; ban kernel é outra integração. ModSecurity bloqueia inline sem pipeline ipset persistente.",
    proof: "Soak 72h · 864 amostras · 0 erros",
  },
  {
    what:
      "Cada passo escreve métricas Prometheus com tenant, dashboards Grafana e timeline SOC :8443. Operadores gerem alertas Telegram e ack num clique no mesmo painel.",
    advantages: [
      "Métricas loganalyzer_* com tenant_id — observabilidade multi-tenant",
      "Timeline SOC, attack map e matriz /tests num dashboard",
      "Self-hosted :8443 — sem dados para cloud de terceiros",
      "Pack de prova PDF/JSON 14 ficheiros sincronizado automaticamente",
    ],
    lg: "Métricas + dashboard + prova num produto — sem consola SaaS CrowdSec nem stack Grafana fragmentada.",
    rivals:
      "Fail2ban: métricas/export limitados. CrowdSec quer SaaS gerido ou setup self-hosted fragmentado. ModSecurity emite logs sem timeline SOC nem pack de prova automático.",
    proof: "75 testes · competitive-proof.json · dashboard /tests",
  },
];

export const STEPS_NL: PipelineStepDeep[] = [
  {
    what:
      "Leest het nginx-accesslogbestand dat u al schrijft, in realtime. Geen extra reverse proxy, sidecar of cloud-agent — de logregel op uw server is het begin van één keten.",
    advantages: [
      "Werkt zonder nginx te vervangen; alleen een logformaat-aanpassing nodig",
      "log_guardian-formaat levert URI, method, XFF en body in één schema",
      "Geen logs naar de cloud — volledig self-hosted",
      "Directe verwerking per regel; setup in ~15 minuten",
    ],
    lg: "Eén binary leest nginx-logs — geen aparte Fail2ban/CrowdSec-agent.",
    rivals:
      "CrowdSec vereist aparte agent plus centrale API. Fail2ban leest logs maar bereikt nooit een WAF-laag — versnipperde architectuur.",
    proof: "75 geautomatiseerde tests · install-gate PASS",
  },
  {
    what:
      "Zet elke logregel om in één genormaliseerd schema: URI, HTTP-methode, X-Forwarded-For, User-Agent en optionele body. WAF-, ban- en metrieklagen delen dezelfde structuur.",
    advantages: [
      "Eén schema — geen formatconflict tussen parser, WAF en ban-pipeline",
      "XFF en proxyketens genormaliseerd voor correct client-IP",
      "Hoge regels/sec-throughput — gemeten in benchmarks",
      "Strict-modus vangt ontbrekende velden bij install-gates",
    ],
    lg: "Log → normaliseren → WAF in één proces; geen tussenformaat of ETL.",
    rivals:
      "ModSecurity draait inline in nginx maar loggebaseerd bannen vereist aparte Fail2ban. CrowdSec gebruikt andere parser plus signaalnetwerk.",
    proof: "280.373 EPS · 16,93× ModSec (bench-vs-modsec.json)",
  },
  {
    what:
      "Evalueert aanvalspatronen met 121 OWASP CRS-regels, PCRE2-JIT-compilatie en OpenAPI/schema + BOLA-validatie. Gemeten 100% pariteit met ModSecurity op dezelfde corpus.",
    advantages: [
      "121 OWASP CRS-regels — industriestandaard WAF-dekking",
      "PCRE2 JIT voor hoge throughput; 280.373 EPS gemeten",
      "Schema/BOLA-laag detecteert API-misbruik",
      "100% recall echte aanvallen · 0,2% false positives (1500-regels corpus)",
    ],
    lg: "WAF + CRS in één product — geen apart ModSecurity-module. 16,93× sneller dan ModSec op dezelfde 121 regels.",
    rivals:
      "ModSecurity + CRS is apart module op nginx — blokkeert eerste verzoek inline maar geen log→ban-keten. Fail2ban doet geen WAF-evaluatie.",
    proof: "CRS-pariteit 100% · recall 100% · FP 0,2%",
  },
  {
    what:
      "Na WAF-match vloeien tenant-beleid, ban-drempel, FP-trustscore en operator-ack samen in één beslispad. Foutban-risico begrensd door gemeten gates.",
    advantages: [
      "Policy + tenant + FP trust in één pipeline — geen aparte Fail2ban-jails",
      "0,2% FP op 500 benigne regels — gemeten gate",
      "Multi-tenant-labels naar Prometheus en dashboard",
      "IPC-auth fail-closed; ongeautoriseerde ban-commando's geweigerd",
    ],
    lg: "~20 ms mediaan van logregel tot ban-beslissing; policy, tenant en FP trust in één code path.",
    rivals:
      "Fail2ban vuurt alleen regex/jail-bans af; FP trust en tenant zitten elders. CrowdSec vereist centrale beslissing plus gedistribueerde agents.",
    proof: "~20 ms mediaan-ban · 21 monsters (bench-ban-latency.json)",
  },
  {
    what:
      "Past ban op kernelniveau toe via ipset en optionele XDP/eBPF op het moment van beslissing. Userspace→kernel-sprong in gemeten ~20 ms mediaan.",
    advantages: [
      "Ban op kernelniveau — iptables/nftables + ipset; moeilijker te omzeilen vanuit userspace",
      "Optionele XDP packet drop; op laptop/VM volstaat --no-xdp + ipset",
      "~20 ms mediaan van logregel tot ban (21 monsters)",
      "Gedistribueerde aanvallen: JA3-cluster + ban per IP — 100% op 80-IP-livetest",
    ],
    lg: "Log → kernel-ban in één keten, ~20 ms. Fail2ban/CrowdSec blijven op seconden–minuten.",
    rivals:
      "Fail2ban-banlatentie: seconden tot minuten. CrowdSec hangt af van signaalnetwerk; kernel-ban is extra integratie. ModSecurity inline zonder persistent ipset-pipeline.",
    proof: "72u soak · 864 monsters · 0 fouten",
  },
  {
    what:
      "Elke stap schrijft tenant-gelabelde Prometheus-metrieken, Grafana-dashboards en :8443 SOC-timeline. Operatoren beheren Telegram-alerts en one-click ack vanuit hetzelfde panel.",
    advantages: [
      "tenant_id-gelabelde loganalyzer_*-metrieken — multi-tenant observability",
      "SOC-timeline, attack map en /tests-bewijsmatrix in één dashboard",
      "Self-hosted :8443 — geen data naar cloud van derden",
      "14-bestanden PDF/JSON-bewijspakket synchroniseert automatisch",
    ],
    lg: "Metrieken + dashboard + bewijs in één product — geen CrowdSec SaaS-console of versnipperde Grafana-stack.",
    rivals:
      "Fail2ban: beperkte metrieken/export. CrowdSec wil managed SaaS of versnipperde self-hosted setup. ModSecurity levert logs zonder SOC-timeline of automatisch bewijspakket.",
    proof: "75 tests · competitive-proof.json · dashboard /tests",
  },
];

export const STEPS_UZ: PipelineStepDeep[] = [
  {
    what:
      "Allaqachon yozayotgan nginx access log faylini real vaqtda o'qiydi. Qo'shimcha reverse proxy, sidecar yoki bulut agent kerak emas — serverdagi log qatori yagona zanjirning boshi.",
    advantages: [
      "Mavjud nginx o'rnatmasiga tegmasdan ishlaydi; faqat log formati yetarli",
      "log_guardian formati URI, method, XFF va body-ni bitta sxemada beradi",
      "Loglarni bulutga yubormaydi — to'liq self-hosted",
      "Qator bo'yicha darhol qayta ishlash; o'rnatish ~15 daqiqa",
    ],
    lg: "Bitta binary nginx logini o'qiydi — alohida Fail2ban/CrowdSec agent yo'q.",
    rivals:
      "CrowdSec alohida agent + markaziy API talab qiladi. Fail2ban log o'qiydi lekin WAF qatlamiga yetmaydi — bo'lak arxitektura.",
    proof: "75 avtomatik test · o'rnatish gate PASS",
  },
  {
    what:
      "Har bir log qatorini URI, HTTP method, X-Forwarded-For, User-Agent va ixtiyoriy body bilan bitta normalizatsiya qilingan sxemaga aylantiradi. WAF, ban va metrika qatlamlari bir strukturani baham ko'radi.",
    advantages: [
      "Bitta sxema — parser, WAF va ban pipeline o'rtasida format nomuvofiqligi yo'q",
      "XFF va proxy zanjiri to'g'ri IP uchun normalizatsiya qilinadi",
      "Yuqori qator/sekund throughput — bench bilan o'lchangan",
      "Strict rejim o'rnatish gate-da yetishmayotgan maydonlarni ushlaydi",
    ],
    lg: "Log → normalizatsiya → WAF bitta jarayonda; oraliq format yoki ETL yo'q.",
    rivals:
      "ModSecurity nginx-da inline ishlaydi lekin log asosidagi ban uchun alohida Fail2ban kerak. CrowdSec boshqa parser + signal tarmog'i.",
    proof: "280.373 EPS · 16,93× ModSec (bench-vs-modsec.json)",
  },
  {
    what:
      "121 OWASP CRS qoidasi, PCRE2 JIT va OpenAPI/schema + BOLA bilan hujum namunalarini baholaydi. Bir xil corpusta ModSecurity bilan 100% paritet o'lchangan.",
    advantages: [
      "121 OWASP CRS qoidasi — sanoat standarti WAF qamrovi",
      "PCRE2 JIT yuqori throughput; 280.373 EPS o'lchangan",
      "Schema/BOLA qatlami API suiiste'mol qilinishini ushlaydi",
      "Haqiqiy hujum recall 100% · FP 0,2% (1500 qator corpus)",
    ],
    lg: "WAF + CRS bitta mahsulotda; alohida ModSecurity moduli yo'q. Bir xil 121 qoidada ModSec-dan 16,93× tezroq.",
    rivals:
      "ModSecurity + CRS alohida modul — birinchi so'rovni inline bloklaydi lekin log→ban zanjiri yo'q. Fail2ban WAF baholash qilmaydi.",
    proof: "CRS paritet 100% · recall 100% · FP 0,2%",
  },
  {
    what:
      "WAF mos kelishidan keyin tenant siyosati, ban chegarasi, FP trust balli va operator tasdiqi bitta qaror yo'lida birlashtiriladi. Noto'g'ri ban xavfi o'lchangan gate-lar bilan cheklangan.",
    advantages: [
      "Policy + tenant + FP trust bitta pipeline-da — alohida Fail2ban jail yo'q",
      "500 benign qatorda 0,2% FP — o'lchangan gate",
      "Multi-tenant yorliqlari Prometheus va dashboard-ga oqadi",
      "IPC auth fail-closed; ruxsatsiz ban buyruqlari rad etiladi",
    ],
    lg: "Log qatoridan ban qaroriga ~20 ms median; policy, tenant va FP trust bir code path-da.",
    rivals:
      "Fail2ban faqat regex/jail ban beradi; FP trust va tenant boshqa tizimlarda. CrowdSec markaziy qaror + tarqatilgan agent talab qiladi.",
    proof: "~20 ms median ban · 21 o'lchov (bench-ban-latency.json)",
  },
  {
    what:
      "Qaror paytida ipset va ixtiyoriy XDP/eBPF orqali kernel darajasida ban qo'llaydi. Userspace→kernel o'tishi o'lchangan ~20 ms median.",
    advantages: [
      "Kernel darajasida ban — iptables/nftables + ipset",
      "XDP paket drop ixtiyoriy; laptop/VM-da --no-xdp + ipset yetarli",
      "Log qatoridan banga ~20 ms median (21 o'lchov)",
      "Tarqatilgan hujum: JA3 klaster + IP bo'yicha ban — 80 IP testda 100%",
    ],
    lg: "Log → kernel ban bitta zanjirda ~20 ms. Fail2ban/CrowdSec soniya–daqiqa darajasida qoladi.",
    rivals:
      "Fail2ban ban kechikishi soniyalar–daqiqalar. CrowdSec signal tarmog'iga bog'liq; kernel ban alohida integratsiya. ModSecurity inline bloklaydi lekin doimiy ipset pipeline yo'q.",
    proof: "72s soak · 864 namuna · 0 xato",
  },
  {
    what:
      "Har bir qadam tenant yorliqli Prometheus metrikalari, Grafana panellari va :8443 SOC timeline-ga yozadi. Operator Telegram alert va bir bosish ack-ni bir paneldan boshqaradi.",
    advantages: [
      "tenant_id yorliqli loganalyzer_* metrikalari",
      "SOC timeline, attack map va /tests isbot matritsasi bir dashboard-da",
      "Self-hosted :8443 — ma'lumot uchinchi tomon bulutiga ketmaydi",
      "14 faylli PDF/JSON isbot paketi avtomatik sinxron",
    ],
    lg: "Metrika + dashboard + isbot bitta mahsulotda; CrowdSec SaaS konsoli yoki bo'lak Grafana kerak emas.",
    rivals:
      "Fail2ban metrika/export cheklangan. CrowdSec managed SaaS yoki bo'lak self-hosted. ModSecurity log beradi lekin SOC timeline va avtomatik isbot paketi yo'q.",
    proof: "75 test · competitive-proof.json · dashboard /tests",
  },
];

export const STEPS_KY: PipelineStepDeep[] = [
  {
    what:
      "Сиз жазып жаткан nginx access log файлын real убакытта окуйт. Кошумча reverse proxy, sidecar же bulut agent керек эмес — сервердеги log сабы бир тизбектин башы.",
    advantages: [
      "nginx-ти алмаштырбай иштейт; log форматын гана тууралоо керек",
      "log_guardian форматы URI, method, XFF жана body-ди бир schema-да берет",
      "Logдорду bulutка жибербейт — толук self-hosted",
      "Саб боюнча дароо иштетүү; орнотуу ~15 мүнөт",
    ],
    lg: "Бир binary nginx log-ун окуйт — айрым Fail2ban/CrowdSec agent жок.",
    rivals:
      "CrowdSec айрым agent + борбордук API талап кылат. Fail2ban log окуйт бирок WAF катмарына жетпейт — бөлүк архитектура.",
    proof: "75 автomatтык тест · орнотуу gate PASS",
  },
  {
    what:
      "Ар бир log сабын URI, HTTP method, X-Forwarded-For, User-Agent жана опционал body менен бир normalize schema-га айландырат. WAF, ban жана метрика катмарлары бир структураны бөлüşөт.",
    advantages: [
      "Бир schema — parser, WAF жана ban pipeline ортосунда формат дал келбестик жок",
      "XFF жана proxy чындыктarı туура client IP үчүн normalize",
      "Жогорку саб/сек throughput — benchmark-та өлчөнгөн",
      "Strict mode орнотуу gate-теринде талааларды кармайт",
    ],
    lg: "Log → normalize → WAF бир process-те; ara format же ETL жок.",
    rivals:
      "ModSecurity nginx-те inline, бирок log негизиндеги ban үчүн айрым Fail2ban керек. CrowdSec башка parser + signal network.",
    proof: "280 373 EPS · 16,93× ModSec (bench-vs-modsec.json)",
  },
  {
    what:
      "121 OWASP CRS эрежеси, PCRE2 JIT жана OpenAPI/schema + BOLA менен чабуул үлгүлөрүн баалайт. Ошол corpusta ModSecurity менен 100% parity өлчөнгөн.",
    advantages: [
      "121 OWASP CRS эрежеси — индустрия стандарты WAF",
      "PCRE2 JIT жогорку throughput; 280 373 EPS өлчөнгөн",
      "Schema/BOLA катмары API зыяндуу колдонууну кармайт",
      "Чыныгы чабуул recall 100% · FP 0,2% (1500 саб corpus)",
    ],
    lg: "WAF + CRS бир продуктта — айрым ModSecurity модулу жок. Ошол 121 эреже боюнча ModSec-ten 16,93× тез.",
    rivals:
      "ModSecurity + CRS айрым nginx модулу — биринчи суроону inline блоктойт бирок log→ban тизбеги жок. Fail2ban WAF баалоо кылбайт.",
    proof: "CRS parity 100% · recall 100% · FP 0,2%",
  },
  {
    what:
      "WAF match-тен кийин tenant саясаты, ban босого, FP trust score жана operator ack бир decision path-те бирикет. Ката ban тобокелдigi өлчөнгөн gate-тер менен чектелген.",
    advantages: [
      "Policy + tenant + FP trust бир pipeline-да — айрым Fail2ban jail жок",
      "500 benign сабда 0,2% FP — өлчөнгөн gate",
      "Multi-tenant label-дар Prometheus жана dashboard-ка агат",
      "IPC auth fail-closed; уруксатсыз ban командалары четке кагылат",
    ],
    lg: "Log сабынан ban чечимине ~20 ms median; policy, tenant жана FP trust бир code path-те.",
    rivals:
      "Fail2ban regex/jail ban гана; FP trust жана tenant башка системаларда. CrowdSec борбордук чечим + таратылган agent керек.",
    proof: "~20 ms median ban · 21 үлгү (bench-ban-latency.json)",
  },
  {
    what:
      "Чечим учуруnda ipset жана опционал XDP/eBPF аркылуу kernel деңгээлинде ban колдонот. Userspace→kernel өтүүсү ~20 ms median өлчөнгөн.",
    advantages: [
      "Kernel деңгээлинде ban — iptables/nftables + ipset",
      "XDP packet drop опционал; laptop/VM-де --no-xdp + ipset жетиштүү",
      "Log сабынан ban-га ~20 ms median (21 үлгү)",
      "Таратылган чабуул: JA3 cluster + IP боюнча ban — 80 IP live test 100%",
    ],
    lg: "Log → kernel ban бир тизбекте ~20 ms. Fail2ban/CrowdSec секунда–мүнөт деңгээлинде.",
    rivals:
      "Fail2ban ban кечигүүсү секунда–мүнөт. CrowdSec signal network-ке көз карандылуу; kernel ban айрым интеграция. ModSecurity inline, persistent ipset pipeline жок.",
    proof: "72 саат soak · 864 үлгү · 0 ката",
  },
  {
    what:
      "Ар бир кadam tenant белгиси бар Prometheus метрикалары, Grafana dashboard-тары жана :8443 SOC timeline-га жазат. Operator Telegram alert жана бир басуу ack бир panelден.",
    advantages: [
      "tenant_id белгиси бар loganalyzer_* метрикалары",
      "SOC timeline, attack map жана /tests далил матрицасы бир dashboard-та",
      "Self-hosted :8443 — маалыматтар үчүнчү тарап bulutuna gitпейт",
      "14 файлдык PDF/JSON далил пакети автоматтык синхрон",
    ],
    lg: "Метрика + dashboard + далил бир продуктта — CrowdSec SaaS консоли же бөлүк Grafana керек эмес.",
    rivals:
      "Fail2ban метрика/export чектелген. CrowdSec managed SaaS же бөлүк self-hosted. ModSecurity log берет бирок SOC timeline жана auto proof pack жок.",
    proof: "75 тест · competitive-proof.json · dashboard /tests",
  },
];

export const STEPS_TK: PipelineStepDeep[] = [
  {
    what:
      "Eýýäm ýazýan nginx access log faýlyny real wagtda okaýar. Goşmaça reverse proxy, sidecar ýa-da bulut agent gerek däl — serwerdäki log setiri ýeke zynjyryň başlangyjy.",
    advantages: [
      "Bar nginx gurnamasy bilen işleýär; diňe log formaty ýeterlik",
      "log_guardian formaty bilen URI, method, XFF we body bir schema-da",
      "Loglary buluda ibermez — doly self-hosted",
      "Setir boýunça dessine işlemek; gurnama ~15 minut",
    ],
    lg: "Bir binary nginx loguny okaýar; aýratyn Fail2ban/CrowdSec agent ýok.",
    rivals:
      "CrowdSec aýratyn agent + merkezi API talap edýär. Fail2ban log okaýar ýöne WAF gatlagyna çenli gitmeýär — bölek arhitektura.",
    proof: "75 awtomatik test · gurnama gate PASS",
  },
  {
    what:
      "Her log setirini URI, HTTP method, X-Forwarded-For, User-Agent we islege görä body bilen bir normalizasiýa schema-na öwürýär. WAF, ban we metrika gatlaklary bir strukturany paýlaşýar.",
    advantages: [
      "Bir schema — parser, WAF we ban pipeline arasynda format gabat gelmezligi ýok",
      "XFF we proxy zynjyry dogry IP üçin normalizasiýa edilýär",
      "Ýokary setir/sekunt throughput — bench bilen ölçelen",
      "Strict re mode gurnama gate-de ýitik meýdanlary tutýar",
    ],
    lg: "Log → normalizasiýa → WAF bir prosesde; ara format ýa-da ETL ýok.",
    rivals:
      "ModSecurity nginx-de inline işleýär ýöne log esasyndaky ban üçin aýratyn Fail2ban gerek. CrowdSec başga parser + signal toruny.",
    proof: "280.373 EPS · 16,93× ModSec (bench-vs-modsec.json)",
  },
  {
    what:
      "121 OWASP CRS düzgünleri, PCRE2 JIT we OpenAPI/schema + BOLA bilen hüjüm nusgalaryny bahalandyrýar. Şol corpusta ModSecurity bilen 100% paritet ölçelen.",
    advantages: [
      "121 OWASP CRS düzgünleri — senagat standarty WAF",
      "PCRE2 JIT ýokary throughput; 280.373 EPS ölçelen",
      "Schema/BOLA gatlagy API sui-istimal edilmegini tutýar",
      "Hakyky hüjüm recall 100% · FP 0,2% (1500 setir corpus)",
    ],
    lg: "WAF + CRS bir önümde; aýratyn ModSecurity moduly ýok. Şol 121 düzgünde ModSec-den 16,93× çalt.",
    rivals:
      "ModSecurity + CRS aýratyn modul — birinji soragy inline bloklaýar ýöne log→ban zynjyry ýok. Fail2ban WAF bahalandyrma etmeýär.",
    proof: "CRS paritet 100% · recall 100% · FP 0,2%",
  },
  {
    what:
      "WAF gabat gelenden soň tenant syýasaty, ban çägi, FP trust baly we operator tassyklamasy bir karar ýolunda birleşýär. Ýalňyş ban howpy ölçelen gate-ler bilen çeklenýär.",
    advantages: [
      "Policy + tenant + FP trust bir pipeline-da — aýratyn Fail2ban jail ýok",
      "500 benign setirde 0,2% FP — ölçelen gate",
      "Multi-tenant bellikler Prometheus we dashboard-a akýar",
      "IPC auth fail-closed; rugsatsyz ban buýruklary ret edilýär",
    ],
    lg: "Log setirinden ban kararyna ~20 ms median; policy, tenant we FP trust bir code path-de.",
    rivals:
      "Fail2ban diňe regex/jail ban berýär; FP trust we tenant başga ulgamlarda. CrowdSec merkezi karar + paýlanan agent talap edýär.",
    proof: "~20 ms median ban · 21 ölçeg (bench-ban-latency.json)",
  },
  {
    what:
      "Karar pursadynda ipset we islege görä XDP/eBPF bilen kernel derejesinde ban ulanýar. Userspace→kernel geçişi ölçelen ~20 ms median.",
    advantages: [
      "Kernel derejesinde ban — iptables/nftables + ipset",
      "XDP paket drop opsional; laptop/VM-de --no-xdp + ipset ýeterlik",
      "Log setirinden bana ~20 ms median (21 ölçeg)",
      "Paýlanan hüjüm: JA3 klaster + IP boýunça ban — 80 IP testde 100%",
    ],
    lg: "Log → kernel ban bir zynjyryda ~20 ms. Fail2ban/CrowdSec sekunt–minut derejesinde galýar.",
    rivals:
      "Fail2ban ban gijikmesi sekuntlar–minutlar. CrowdSec signal toruna bagly; kernel ban aýratyn integrasiýa. ModSecurity inline bloklaýar ýöne dowamly ipset pipeline ýok.",
    proof: "72s soak · 864 nusga · 0 ýalňyşlyk",
  },
  {
    what:
      "Her ädim tenant bellikli Prometheus metrikalary, Grafana panelleri we :8443 SOC timeline-a ýazýar. Operator Telegram alert we bir basmak ack bir panelden dolandyrýar.",
    advantages: [
      "tenant_id bellikli loganalyzer_* metrikalary",
      "SOC timeline, attack map we /tests subutnama matrisasy bir dashboard-da",
      "Self-hosted :8443 — maglumat üçünji tarap buludyna gitmeýär",
      "14 faýllyk PDF/JSON subutnama paketi awtomatik sinhron",
    ],
    lg: "Metrika + dashboard + subutnama bir önümde; CrowdSec SaaS konsoly ýa-da bölek Grafana gerek däl.",
    rivals:
      "Fail2ban metrika/export çäkli. CrowdSec managed SaaS ýa-da bölek self-hosted. ModSecurity log berýär ýöne SOC timeline we awtomatik subutnama paketi ýok.",
    proof: "75 test · competitive-proof.json · dashboard /tests",
  },
];

export const STEPS_CRH: PipelineStepDeep[] = [
  {
    what:
      "Artıq yazğan nginx access log faylını real vaqıtta oqıy. Qo'sımça reverse proxy, sidecar ya da bulut agent kerek degil — serverdaki log satırı tek zıncırnıñ başlangıcı.",
    advantages: [
      "Mevcut nginx quraşdırmasına dokunmadan işley — yalnız log formatı kifayet",
      "log_guardian formatı ile URI, method, XFF ve body tek sxemada",
      "Loglarnı bulutka yubarmay — tam self-hosted",
      "Satır başına anında işlem; quraşdırma ~15 daqiqa",
    ],
    lg: "Tek binary nginx logını oqıy — ayrı Fail2ban/CrowdSec agent yoq.",
    rivals:
      "CrowdSec ayrı agent + merkezi API ister. Fail2ban log oqıy amma WAF qatına yetmez — parçalı mimari.",
    proof: "75 avtomatik test · quraşdırma gate PASS",
  },
  {
    what:
      "Er log satırını URI, HTTP method, X-Forwarded-For, User-Agent ve ihtiyarî body ile tek normalize sxemaya çevirir. WAF, ban ve metrik qatları aynı strukturayı paylaşır.",
    advantages: [
      "Tek sxema — parser, WAF ve ban pipeline arasında format uyumsuzluğı yoq",
      "XFF ve proxy zıncırı doğru IP içün normalize",
      "Yüksek satır/saniye throughput — bench ile ölçüldü",
      "Strict rejim quraşdırma gate-de eksik alanlarnı tutar",
    ],
    lg: "Log → normalize → WAF aynı prosesde; ara format ya da ETL yoq.",
    rivals:
      "ModSecurity nginx-de inline işley amma log esaslı ban içün ayrı Fail2ban kerek. CrowdSec başqa parser + sinyal ağı.",
    proof: "280.373 EPS · 16,93× ModSec (bench-vs-modsec.json)",
  },
  {
    what:
      "121 OWASP CRS qaidası, PCRE2 JIT ve OpenAPI/schema + BOLA ile hücum namunalarını bahalandırır. Aynı corpusta ModSecurity ile 100% paritet ölçüldü.",
    advantages: [
      "121 OWASP CRS qaidası — sanayi standartı WAF qapsamı",
      "PCRE2 JIT yüksek throughput; 280.373 EPS ölçüldü",
      "Schema/BOLA qatı API sui-istimalini tutar",
      "Gerçek hücum recall 100% · FP 0,2% (1500 satır corpus)",
    ],
    lg: "WAF + CRS tek mahsulatta; ayrı ModSecurity modulü yoq. Aynı 121 qaidada ModSec-den 16,93× tez.",
    rivals:
      "ModSecurity + CRS ayrı modul — ilk sorğunı inline bloklar amma log→ban zıncırı yoq. Fail2ban WAF bahalandırması yapmaz.",
    proof: "CRS paritet 100% · recall 100% · FP 0,2%",
  },
  {
    what:
      "WAF uygunluğından soñ tenant siyaseti, ban eşiği, FP trust skoru ve operator tasdıqı tek qarar yolunda birleşir. Yanlış ban riski ölçülü gate-ler ile sınırlanır.",
    advantages: [
      "Policy + tenant + FP trust tek pipeline — ayrı Fail2ban jail yoq",
      "500 benign satırda 0,2% FP — ölçülü gate",
      "Multi-tenant etiketler Prometheus ve dashboard-a gider",
      "IPC auth fail-closed; izinsiz ban emirleri reddedilir",
    ],
    lg: "Log satırından ban qararına ~20 ms median; policy, tenant ve FP trust aynı code path-de.",
    rivals:
      "Fail2ban yalnız regex/jail ban atar; FP trust ve tenant başqa sistemlerde. CrowdSec merkezi qarar + dağıtılmış agent ister.",
    proof: "~20 ms median ban · 21 ölçüm (bench-ban-latency.json)",
  },
  {
    what:
      "Qarar anında ipset ve ihtiyarî XDP/eBPF ile kernel seviyesinde ban uygular. Userspace→kernel geçişi ölçülü ~20 ms median.",
    advantages: [
      "Kernel seviyesinde ban — iptables/nftables + ipset",
      "XDP paket drop opsional; laptop/VM-de --no-xdp + ipset kifayet",
      "Log satırından bana ~20 ms median (21 ölçüm)",
      "Dağıtılmış hücum: JA3 klaster + IP başına ban — 80 IP testte 100%",
    ],
    lg: "Log → kernel ban tek zıncırda ~20 ms. Fail2ban/CrowdSec saniye–daqiqa seviyesinde qalır.",
    rivals:
      "Fail2ban ban gecikmesi saniyeler–daqiqalar. CrowdSec sinyal ağına bağlı; kernel ban ayrı integrasyon. ModSecurity inline bloklar amma kalıcı ipset pipeline yoq.",
    proof: "72s soak · 864 numune · 0 hata",
  },
  {
    what:
      "Er adım tenant etiketli Prometheus metrikleri, Grafana panelleri ve :8443 SOC timeline-a yazar. Operator Telegram alert ve bir tık ack aynı panelden idare etilir.",
    advantages: [
      "tenant_id etiketli loganalyzer_* metrikleri",
      "SOC timeline, attack map ve /tests delil matrisi aynı dashboard-da",
      "Self-hosted :8443 — veri üçüncü taraf bulutka gitmez",
      "14 fayllık PDF/JSON delil paketi avtomatik sinhron",
    ],
    lg: "Metrik + dashboard + delil tek mahsulatta; CrowdSec SaaS konsolu ya da parçalı Grafana kerek degil.",
    rivals:
      "Fail2ban metrik/export sınırlı. CrowdSec managed SaaS ya da parçalı self-hosted. ModSecurity log verir amma SOC timeline ve avtomatik delil paketi yoq.",
    proof: "75 test · competitive-proof.json · dashboard /tests",
  },
];

export const STEPS_GAG: PipelineStepDeep[] = [
  {
    what:
      "Artı yazılan nginx access log dosyası real vakitte okunur. Ek reverse proxy, sidecar veya bulut agent gerekmez — serverdeki log satırı tek zincirnın başlangıcı.",
    advantages: [
      "Mevcut nginx kurulumuna dokunmadan çalışır; yalnız log formatı yeterli",
      "log_guardian formatı ile URI, method, XFF ve body tek şemada",
      "Logları buluta göndermez — tam self-hosted",
      "Satır başına anında işlem; kurulum ~15 dakika",
    ],
    lg: "Tek binary nginx logunu okur; ayrı Fail2ban/CrowdSec agent kurulumu yok.",
    rivals:
      "CrowdSec ayrı agent + merkezi API ister. Fail2ban log okur amma WAF katmanına geçmez — parçalı mimari.",
    proof: "75 otomatik test · kurulum gate PASS",
  },
  {
    what:
      "Her log satırını URI, HTTP method, X-Forwarded-For, User-Agent ve isteğe bağlı body ile tek normalize şemaya dönüştürür. WAF, ban ve metrik katmanları aynı yapıyı paylaşır.",
    advantages: [
      "Tek şema — parser, WAF ve ban pipeline arasında format uyumsuzluğu yok",
      "XFF ve proxy zinciri doğru IP çıkarımı için normalize edilir",
      "Yüksek hacimde satır/saniye işleme; bench ile ölçülmüş throughput",
      "Strict mod ile eksik alanlar kurulum gate'inde yakalanır",
    ],
    lg: "Log → normalize → WAF aynı process içinde; ara format veya ETL yok.",
    rivals:
      "ModSecurity nginx modülü inline çalışır amma log tabanlı ban için Fail2ban'a ayrı entegrasyon gerekir. CrowdSec farklı parser + sinyal ağı kullanır.",
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

export const STEPS_TT: PipelineStepDeep[] = [
  {
    what:
      "Siz artıq yazğan nginx access log файлын real вакытта уkyа. Өстәмә reverse proxy, sidecar яки bulud agent кирәк түгел — сервердәге log юлы бер тizbekнең башы.",
    advantages: [
      "nginx-ны алмаштырмый эшли; log форматын гына көйләргә кifayət",
      "log_guardian форматы URI, method, XFF һәм body-не бер schema-да бирә",
      "Logларны bulutка җибәрми — тулы self-hosted",
      "Юл буенча тиз эшкərtү; урнаштыру ~15 минут",
    ],
    lg: "Ber binary nginx log-ын ukyа — ayrı Fail2ban/CrowdSec agent юк.",
    rivals:
      "CrowdSec ayrı agent + үзәк API таләп итә. Fail2ban log ukyа, amma WAF катlamına җитми — өлешле архитектура.",
    proof: "75 автomat test · урнаштыру gate PASS",
  },
  {
    what:
      "Hər log юлын URI, HTTP method, X-Forwarded-For, User-Agent һәм опционал body белән ber normalize schema-га әверeltә.",
    advantages: [
      "Ber schema — parser, WAF һәм ban pipeline arasında format uyğunsızlığı юк",
      "XFF һәм proxy zynjyry дөрес IP өчен normalize",
      "Yuqarı юл/сек throughput — benchmark-та ölçelgän",
      "Strict mode урнаштыру gate-larında юлларны tuta",
    ],
    lg: "Log → normalize → WAF ber process-tä; ara format яки ETL юк.",
    rivals:
      "ModSecurity nginx-tä inline, amma log neгezендә ban өчен ayrı Fail2ban кирәк. CrowdSec başqa parser + signal toru.",
    proof: "280 373 EPS · 16,93× ModSec (bench-vs-modsec.json)",
  },
  {
    what:
      "121 OWASP CRS qaydası, PCRE2 JIT һәм OpenAPI/schema + BOLA белән hücum nusgaların bahalay.",
    advantages: [
      "121 OWASP CRS qaydası — senagat standartı WAF",
      "PCRE2 JIT yuqarı throughput; 280 373 EPS ölçelgän",
      "Schema/BOLA qatlamı API sui-istimalen tuta",
      "Real hücum recall 100% · FP 0,2% (1500 юл corpus)",
    ],
    lg: "WAF + CRS ber önəmdä; ayrı ModSecurity moduly юк. Ber xil 121 qaydada ModSec-dan 16,93× tiz.",
    rivals:
      "ModSecurity + CRS ayrı modul — berenchi sorawnı inline bloklay, amma log→ban tizbegе юк. Fail2ban WAF bahalay.",
    proof: "CRS parity 100% · recall 100% · FP 0,2%",
  },
  {
    what:
      "WAF uyğunlığından soñ tenant siyasäte, ban chegäse, FP trust ballı häm operator tasdığı ber qarar yolında berləşә.",
    advantages: [
      "Policy + tenant + FP trust ber pipeline-da — ayrı Fail2ban jail юк",
      "500 benign юлда 0,2% FP — ölçelgän gate",
      "Multi-tenant etiketlär Prometheus häm dashboard-ka ağa",
      "IPC auth fail-closed; ruxsatsız ban buyruqları radd itelә",
    ],
    lg: "Log юлыннан ban qararına ~20 ms median; policy, tenant häm FP trust ber code path-tä.",
    rivals:
      "Fail2ban yalnız regex/jail ban; FP trust häm tenant başqa sistemlärдә. CrowdSec үzәk qarar + taratu agent.",
    proof: "~20 ms median ban · 21 ölçem (bench-ban-latency.json)",
  },
  {
    what:
      "Qarar anında ipset häm opsional XDP/eBPF белән kernel däräcäsendä ban qullaya.",
    advantages: [
      "Kernel däräcäsendä ban — iptables/nftables + ipset",
      "XDP paket drop opsional; laptop/VM-dä --no-xdp + ipset kifayät",
      "Log юлыннан bana ~20 ms median (21 ölçem)",
      "Taratu hücum: JA3 klaster + IP boença ban — 80 IP test 100%",
    ],
    lg: "Log → kernel ban ber tizbekte ~20 ms. Fail2ban/CrowdSec sekund–minut däräcäsendä.",
    rivals:
      "Fail2ban ban gecikmäse sekundlar–minutlar. CrowdSec signal toruna bağlı; kernel ban ayrı integratsiya.",
    proof: "72s soak · 864 numune · 0 xata",
  },
  {
    what:
      "Här ädim tenant etiketle Prometheus metrikaları, Grafana panelläre häm :8443 SOC timeline-a yazа.",
    advantages: [
      "tenant_id etiketle loganalyzer_* metrikaları",
      "SOC timeline, attack map häm /tests delil matrisasy ber dashboard-da",
      "Self-hosted :8443 — mäğlumat üçüncü tarap buludına gitmäy",
      "14 fayllıq PDF/JSON delil paketi avtomatik sinhron",
    ],
    lg: "Metrika + dashboard + delil ber önəmdä; CrowdSec SaaS konsoly ya da öleşle Grafana kirek tügel.",
    rivals:
      "Fail2ban metrika/export cheklän. CrowdSec managed SaaS ya da öleşle self-hosted. ModSecurity log verä, amma SOC timeline yoq.",
    proof: "75 test · competitive-proof.json · dashboard /tests",
  },
];

export const STEPS_BA: PipelineStepDeep[] = [
  {
    what:
      "Siz яҙған nginx access log файлы real ваҡытта уҡыла. Өҫтәмә reverse proxy, sidecar йәки bulut agent кәрәк түгел — серверҙағы log юлы бер tizbekte башlanır.",
    advantages: [
      "nginx-ты алмаштырмай эшләй; log форматын генә көйләргә kifayət",
      "log_guardian форматы URI, method, XFF һәм body-не ber schema-da бирә",
      "Loglarnı bulutka eбәрmi — туллы self-hosted",
      "Юл буенса tez эшкərtү; урынлаштырыу ~15 минут",
    ],
    lg: "Ber binary nginx log-ын uky — ayrı Fail2ban/CrowdSec agent юҡ.",
    rivals:
      "CrowdSec ayrı agent + үҙәк API talap iter. Fail2ban log uky, amma WAF qatlamına yetmi — öleşle arxitektura.",
    proof: "75 avtomat test · урынлаштырыу gate PASS",
  },
  {
    what:
      "Hər log юлын URI, HTTP method, X-Forwarded-For, User-Agent һәм opsional body meн ber normalize schema-ға aylandırır.",
    advantages: [
      "Ber schema — parser, WAF һәм ban pipeline arasında format uyğunsuzlığı yoq",
      "XFF һәм proxy zynjyry düzgün IP öçen normalize",
      "Yuqarı юл/сек throughput — benchmark-та ölçelgän",
      "Strict mode урынлаштырыу gate-larında meydanlarnı tuta",
    ],
    lg: "Log → normalize → WAF ber process-tä; ara format yoq.",
    rivals:
      "ModSecurity nginx-tä inline, amma log neгezendä ban öçen ayrı Fail2ban kirek. CrowdSec başqa parser + signal tory.",
    proof: "280 373 EPS · 16,93× ModSec (bench-vs-modsec.json)",
  },
  {
    what:
      "121 OWASP CRS qaydasy, PCRE2 JIT һәм OpenAPI/schema + BOLA meн hücum nusgaların bahalay.",
    advantages: [
      "121 OWASP CRS qaydasy — senagat standartı WAF",
      "PCRE2 JIT yuqarı throughput; 280 373 EPS ölçelgän",
      "Schema/BOLA qatlamy API sui-istimalen tuta",
      "Real hücum recall 100% · FP 0,2%",
    ],
    lg: "WAF + CRS ber önömdä; ayrı ModSecurity moduly yoq. Ber xil 121 qaydada ModSec-dan 16,93× tez.",
    rivals:
      "ModSecurity + CRS ayrı modul — berenchi sorawnı inline bloklay, amma log→ban tizbegе yoq.",
    proof: "CRS parity 100% · recall 100% · FP 0,2%",
  },
  {
    what:
      "WAF uyğunlığından soñ tenant siyasäte, ban chegäse, FP trust ballı häm operator tasdığı ber qarar yolında berləşә. Yalňyş ban howpy ölçelgän gate-lar megnände.",
    advantages: [
      "Policy + tenant + FP trust ber pipeline-da — ayrı Fail2ban jail yoq",
      "500 benign юлda 0,2% FP — ölçelgän gate",
      "Multi-tenant etiketlär Prometheus häm dashboard-ka ağa",
      "IPC auth fail-closed; ruxsatsız ban buyruqları radd itelә",
    ],
    lg: "Log юлынnan ban qararına ~20 ms median; policy, tenant häm FP trust ber code path-tä.",
    rivals:
      "Fail2ban diňe regex/jail ban; FP trust häm tenant başqa sistemlärдә. CrowdSec mərkəzi qarar häm taratu agent talap iter.",
    proof: "~20 ms median ban · 21 ölçem (bench-ban-latency.json)",
  },
  {
    what:
      "Qarar anında ipset häm opsional XDP/eBPF meн kernel däräcäsendä ban qullay. Userspace→kernel keçеше ölçelgän ~20 ms median.",
    advantages: [
      "Kernel däräcäsendä ban — iptables/nftables + ipset; userspace-dan aydaw qiyin",
      "XDP paket drop opsional; laptop/VM-dä --no-xdp + ipset kifayät",
      "Log юлынnan bana ~20 ms median (21 ölçem)",
      "Taratu hücum: JA3 klaster + IP boença ban — 80 IP test 100%",
    ],
    lg: "Log → kernel ban ber tizbekte ~20 ms. Fail2ban/CrowdSec sekund–minut däräcäsendä qalır.",
    rivals:
      "Fail2ban ban gecikmäse sekundlar–minutlar. CrowdSec signal toryna bağlı; kernel ban ayrı integratsiya. ModSecurity inline bloklay, amma daimi ipset pipeline yoq.",
    proof: "72s soak · 864 numune · 0 xata",
  },
  {
    what:
      "Här ädim tenant etiketle Prometheus metrikaları, Grafana panelläre häm :8443 SOC timeline-a yazа. Operator Telegram alert häm bir basu ack ber paneldän idarä itelә.",
    advantages: [
      "tenant_id etiketle loganalyzer_* metrikaları — köp kiracılı gözlemlenebilirlik",
      "SOC timeline, attack map häm /tests delil matrisasy ber dashboard-da",
      "Self-hosted :8443 — mäğlumat өçünсü tarap buludına gitmäy",
      "14 fayllıq PDF/JSON delil paketi avtomatik sinhron",
    ],
    lg: "Metrika + dashboard + delil ber önömdä; CrowdSec SaaS konsoly ya da öleşle Grafana kirek tügel.",
    rivals:
      "Fail2ban metrika/export cheklän. CrowdSec managed SaaS ya da öleşle self-hosted. ModSecurity log verä, amma SOC timeline häm avtomatik delil paketi yoq.",
    proof: "75 test · competitive-proof.json · dashboard /tests",
  },
];

export const STEPS_CV: PipelineStepDeep[] = [
  {
    what:
      "San yazsa nginx access log файлĕ real вăхăтра укăнать. Тата reverse proxy, sidecar е bulut agent кирлĕ мар — серверти log йĕрки тĕрĕс тĕрĕ tizbek пуçламăшĕ.",
    advantages: [
      "nginx-ă smenalemesen ĕşлеп кăна; log formatĕ yeterli",
      "log_guardian formatĕ URI, method, XFF tata body-ĕ pĕr schema-ra",
      "Logsem bulutka yatran — pĕrleh self-hosted",
      "Yĕrke pĕr-e şuăna işleş; lăser ~15 minut",
    ],
    lg: "Pĕr binary nginx log-ă uklat — ayră Fail2ban/CrowdSec agent çuk.",
    rivals:
      "CrowdSec ayră agent + tĕp API kiret. Fail2ban log uklat, numai WAF katĕ çenmeççĕ — pĕş-pĕşe arhitektura.",
    proof: "75 avtomat test · lăser gate PASS",
  },
  {
    what:
      "Mĕn push log yĕrkin URI, HTTP method, X-Forwarded-For, User-Agent tata kălă opsional body pĕr normalize schema-ra çăvărtать.",
    advantages: [
      "Pĕr schema — parser, WAF tata ban pipeline arăççĕ format uyumsuzlığı çuk",
      "XFF tata proxy zynjyry tĕrĕs IP valli normalize",
      "Yuqarı yĕr/sek throughput — bench-ra ölçen",
      "Strict reim lăser gate-ĕnçe yitmeşsen yĕrkinsem tuta",
    ],
    lg: "Log → normalize → WAF pĕr process-ra; ara format çuk.",
    rivals:
      "ModSecurity nginx-ra inline, numai log neşĕ ban valli ayră Fail2ban kiret. CrowdSec yat parser + signal tory.",
    proof: "280 373 EPS · 16,93× ModSec",
  },
  {
    what:
      "121 OWASP CRS jurnă, PCRE2 JIT tata OpenAPI/schema + BOLA păh hücum nusgăsen bahalay.",
    advantages: [
      "121 OWASP CRS jurnă — senagat standart WAF",
      "PCRE2 JIT yuqarı throughput; 280 373 EPS ölçen",
      "Schema/BOLA katĕ API sui-istimalen tuta",
      "Chăn hücum recall 100% · FP 0,2%",
    ],
    lg: "WAF + CRS pĕr produkt-ra; ayră ModSecurity moduly çuk. Pĕr tĕrĕ 121 jurnăran ModSec-ten 16,93× tez.",
    rivals:
      "ModSecurity + CRS ayră modul — berenchi sorawnı inline bloklay, numai log→ban tizbegĕ çuk. Fail2ban WAF bahalandirmi.",
    proof: "CRS parity 100% · recall 100% · FP 0,2%",
  },
  {
    what:
      "WAF potănăçĕ hunăn tenant siyasăte, ban chegĕ, FP trust tata operator tasdı pĕr karar yolĕnçe pĕrleşet. Şăl ban tăvăllĕhĕ ölçen gate-сен çĕтлĕ.",
    advantages: [
      "Policy + tenant + FP trust pĕr pipeline-ra — ayră Fail2ban jail çuk",
      "500 benign yĕrke 0,2% FP — ölçen gate",
      "Multi-tenant etiketsem Prometheus tata dashboard-ka",
      "IPC auth fail-closed; ruhsat çuk ban buyruklari tăvăllĕ",
    ],
    lg: "Log yĕrkinĕn ban kararĕne ~20 ms median; policy, tenant tata FP trust pĕr code path-ra.",
    rivals:
      "Fail2ban regex/jail ban kăna; FP trust tata tenant yat sistemsem. CrowdSec tĕp karar tata taratu agent kiret.",
    proof: "~20 ms median ban · 21 ölçem (bench-ban-latency.json)",
  },
  {
    what:
      "Karar văhătĕn ipset tata opsional XDP/eBPF păh kernel dăshĕnçe ban lăseret. Userspace→kernel çavăn ~20 ms median ölçen.",
    advantages: [
      "Kernel dăsh ban — iptables/nftables + ipset; userspace-rahtan ajanallahtav çyn",
      "XDP paket drop opsional; laptop/VM-ra --no-xdp + ipset yeterli",
      "Log yĕrkinĕn bana ~20 ms median (21 ölçem)",
      "Taratu hücum: JA3 klaster + IP păh ban — 80 IP test 100%",
    ],
    lg: "Log → kernel ban pĕr tizbek ~20 ms. Fail2ban/CrowdSec sekund–minut dăshĕnçe.",
    rivals:
      "Fail2ban ban gijikmĕ sekund–minut. CrowdSec signal toryna tăvan; kernel ban yată integratsi. ModSecurity inline, permanent ipset pipeline çuk.",
    proof: "72s soak · 864 numune · 0 hata",
  },
  {
    what:
      "Mĕn push ädem tenant etiketle Prometheus metrikăsem, Grafana panellĕre tata :8443 SOC timeline-a yazat. Operator Telegram alert tata bir basım ack pĕr paneltan.",
    advantages: [
      "tenant_id etiketle loganalyzer_* metrikăsem — multi-tenant observability",
      "SOC timeline, attack map tata /tests delil matrisi pĕr dashboard-ra",
      "Self-hosted :8443 — data üçünçi tarap buludina yatmay",
      "14 fayl PDF/JSON delil paketĕ avtomatik sinhron",
    ],
    lg: "Metrika + dashboard + delil pĕr produkt-ra; CrowdSec SaaS konsoly ya da pĕş-pĕşe Grafana kirek mar.",
    rivals:
      "Fail2ban metrika/export cheklĕ. CrowdSec managed SaaS ya da pĕş-pĕşe self-hosted. ModSecurity log parat, numai SOC timeline tata avtomatik delil paketĕ çuk.",
    proof: "75 test · competitive-proof.json · dashboard /tests",
  },
];

export const STEPS_UG: PipelineStepDeep[] = [
  {
    what:
      "Siz يازغان nginx access log ھۆججىتىن real ۋاقىtta ئوقۇيدۇ. قo'shimcha reverse proxy، sidecar ياكى bulut agent كېرەك ئەمەس — serverdiki log قۇرى بىر زەنجىرنىڭ باشلىنىشى.",
    advantages: [
      "nginx نى almashturmasdan ishlaydi؛ پەقەت log formati yetarli",
      "log_guardian formati URI، method، XFF va body ni bitta schema da",
      "Loglarni bulutka yubormaydi — to'liq self-hosted",
      "Qator bo'yicha darhol qayta ishlash؛ o'rnatish ~15 daqiqa",
    ],
    lg: "Bitta binary nginx logini o'qiydi — alohida Fail2ban/CrowdSec agent yo'q.",
    rivals:
      "CrowdSec alohida agent + markaziy API talab qiladi. Fail2ban log o'qiydi lekin WAF qatlamiga yetmaydi.",
    proof: "75 avtomatik test · o'rnatish gate PASS",
  },
  {
    what:
      "Har bir log qatorini URI، HTTP method، X-Forwarded-For، User-Agent va ixtiyoriy body bilan bitta normalizatsiya qilingan sxemaga aylantiradi.",
    advantages: [
      "Bitta sxema — parser، WAF va ban pipeline o'rtasida format nomuvofiqligi yo'q",
      "XFF va proxy zanjiri to'g'ri IP uchun normalizatsiya",
      "Yuqori qator/sekund throughput",
      "Strict rejim o'rnatish gate da yetishmayotgan maydonlarni ushlaydi",
    ],
    lg: "Log → normalizatsiya → WAF bitta jarayonda; oraliq format yoki ETL yo'q.",
    rivals:
      "ModSecurity nginx-da inline ishlaydi lekin log asosidagi ban uchun alohida Fail2ban kerak. CrowdSec boshqa parser + signal tarmog'i ishlatadi.",
    proof: "280.373 EPS · 16,93× ModSec (bench-vs-modsec.json)",
  },
  {
    what:
      "121 OWASP CRS qoidasi, PCRE2 JIT va OpenAPI/schema + BOLA bilan hujum namunalarini baholaydi. Bir xil corpusta ModSecurity bilan 100% paritet o'lchangan.",
    advantages: [
      "121 OWASP CRS qoidasi — sanoat standarti WAF qamrovi",
      "PCRE2 JIT yuqori throughput; 280.373 EPS o'lchangan",
      "Schema/BOLA qatlami API suiiste'mol qilinishini ushlaydi",
      "Haqiqiy hujum recall 100% · FP 0,2% (1500 qator corpus)",
    ],
    lg: "WAF + CRS bitta mahsulotda; alohida ModSecurity moduli yo'q. Bir xil 121 qoidada ModSec-dan 16,93× tezroq.",
    rivals:
      "ModSecurity + CRS alohida modul — birinchi so'rovni inline bloklaydi lekin log→ban zanjiri yo'q. Fail2ban WAF baholash qilmaydi.",
    proof: "CRS paritet 100% · recall 100% · FP 0,2%",
  },
  {
    what:
      "WAF mos kelishidan keyin tenant siyosati, ban chegarasi, FP trust balli va operator tasdiqi bitta qaror yo'lida birlashtiriladi. Noto'g'ri ban xavfi o'lchangan gate-lar bilan cheklangan.",
    advantages: [
      "Policy + tenant + FP trust bitta pipeline-da — alohida Fail2ban jail yo'q",
      "500 benign qatorda 0,2% FP — o'lchangan gate",
      "Multi-tenant yorliqlari Prometheus va dashboard-ga oqadi",
      "IPC auth fail-closed; ruxsatsiz ban buyruqlari rad etiladi",
    ],
    lg: "Log qatoridan ban qaroriga ~20 ms median; policy, tenant va FP trust bir code path-da.",
    rivals:
      "Fail2ban faqat regex/jail ban beradi; FP trust va tenant boshqa tizimlarda. CrowdSec markaziy qaror + tarqatilgan agent talab qiladi.",
    proof: "~20 ms median ban · 21 o'lchov (bench-ban-latency.json)",
  },
  {
    what:
      "Qaror paytida ipset va ixtiyoriy XDP/eBPF orqali kernel darajasida ban qo'llaydi. Userspace→kernel o'tishi o'lchangan ~20 ms median.",
    advantages: [
      "Kernel darajasida ban — iptables/nftables + ipset; userspace-dan chetlashish qiyin",
      "XDP paket drop ixtiyoriy; laptop/VM-da --no-xdp + ipset yetarli",
      "Log qatoridan banga ~20 ms median (21 o'lchov)",
      "Tarqatilgan hujum: JA3 klaster + IP bo'yicha ban — 80 IP testda 100%",
    ],
    lg: "Log → kernel ban bitta zanjirda ~20 ms. Fail2ban/CrowdSec soniya–daqiqa darajasida qoladi.",
    rivals:
      "Fail2ban ban kechikishi soniyalar–daqiqalar. CrowdSec signal tarmog'iga bog'liq; kernel ban alohida integratsiya. ModSecurity inline bloklaydi lekin doimiy ipset pipeline yo'q.",
    proof: "72s soak · 864 namuna · 0 xato",
  },
  {
    what:
      "Har bir qadam tenant yorliqli Prometheus metrikalari, Grafana panellari va :8443 SOC timeline ga yozadi. Operator Telegram alert va bir bosish ack-ni bir paneldan boshqaradi.",
    advantages: [
      "tenant_id yorliqli loganalyzer_* metrikalari — ko'p ijarachi kuzatuvi",
      "SOC timeline, attack map va /tests isbot matritsasi bir dashboard-da",
      "Self-hosted :8443 — ma'lumot uchinchi tomon bulutiga ketmaydi",
      "14 faylli PDF/JSON isbot paketi avtomatik sinxron",
    ],
    lg: "Metrika + dashboard + isbot bitta mahsulotda; CrowdSec SaaS konsoli yoki bo'lak Grafana kerak emas.",
    rivals:
      "Fail2ban metrika/export cheklangan. CrowdSec managed SaaS yoki bo'lak self-hosted. ModSecurity log beradi lekin SOC timeline va avtomatik isbot paketi yo'q.",
    proof: "75 test · competitive-proof.json · dashboard /tests",
  },
];

export const STEPS_SAH: PipelineStepDeep[] = [
  {
    what:
      "Эн nginx access log файлын real вакытта олус. Эбии reverse proxy, sidecar эбэтэр bulut agent кэриэкпэт — server log сабы биир tizbek начала.",
    advantages: [
      "nginx алмаспаттан дьайар; log форматын настройкала",
      "log_guardian формат URI, method, XFF, body биир schema-га",
      "Log bulutка илбэт — толорoon self-hosted",
      "Саб барытын instant обработка; установка ~15 минут",
    ],
    lg: "Биир binary nginx log олор — Fail2ban/CrowdSec agent бэйэ.",
    rivals:
      "CrowdSec бэйэ agent + централь API. Fail2ban log олор, WAF катmanна барбат — бөлüк архитектура.",
    proof: "75 автомат тест · установка gate PASS",
  },
  {
    what:
      "Бар log сабын URI, HTTP method, X-Forwarded-For, User-Agent, body биир normalize schema-га хайдаар.",
    advantages: [
      "Биир schema — parser, WAF, ban pipeline ортотунан format mismatch суох",
      "XFF, proxy zynjyr туох IP normalize",
      "Yukarı throughput — benchmark-та ölçülгэн",
      "Strict mode установка gate-та field-тар tutar",
    ],
    lg: "Log → normalize → WAF биир process-та; ara format эбэтэр ETL суох.",
    rivals:
      "ModSecurity nginx-та inline, нo log негизinde ban ват Fail2ban бэйэ. CrowdSec бaska parser + signal network.",
    proof: "280 373 EPS · 16,93× ModSec (bench-vs-modsec.json)",
  },
  {
    what:
      "121 OWASP CRS, PCRE2 JIT, OpenAPI/schema + BOLA атак pattern-нарын баар. Ол corpusta ModSecurity билиэн 100% parity ölçülгэн.",
    advantages: [
      "121 OWASP CRS — industry WAF стандарт",
      "PCRE2 JIT; 280 373 EPS ölçülгэн",
      "Schema/BOLA API abuse tutar",
      "Чыныы attack recall 100% · FP 0,2% (1500 саб corpus)",
    ],
    lg: "WAF + CRS биир продукт; 16,93× ModSec-тан тэрис. Бэйэ ModSecurity модуль кэриэкпэт.",
    rivals:
      "ModSecurity + CRS бэйэ модуль — inline блок, нo log→ban chain суох. Fail2ban WAF баар.",
    proof: "CRS parity 100% · recall 100% · FP 0,2%",
  },
  {
    what:
      "WAF match кэннитэ tenant policy, ban threshold, FP trust биир decision path-та. Сорук ban тобокелдигэ ölçülгэн gate-тар чогдот.",
    advantages: [
      "Policy + tenant + FP trust биир pipeline — бэйэ Fail2ban jail суох",
      "500 benign саб 0,2% FP — ölçülгэн gate",
      "Multi-tenant labels Prometheus, dashboard-ка",
      "IPC auth fail-closed; уруксаттаах ban команда отторуллар",
    ],
    lg: "Log сабынан ban ~20 ms median; policy, tenant, FP trust биир code path-та.",
    rivals:
      "Fail2ban regex/jail кэлин; FP trust, tenant бaska системаларда. CrowdSec централь decision + distributed agent.",
    proof: "~20 ms median ban · 21 sample (bench-ban-latency.json)",
  },
  {
    what:
      "Решение моментун ipset, XDP/eBPF kernel ban. Userspace→kernel ~20 ms median ölçülгэн.",
    advantages: [
      "Kernel ban — iptables/nftables + ipset; userspace-тан aydarsan qiyin",
      "XDP optional; laptop/VM-га --no-xdp + ipset yet",
      "~20 ms median log сабынан ban-га (21 sample)",
      "Distributed attack: JA3 cluster + IP ban — 80 IP test 100%",
    ],
    lg: "Log → kernel ban биир chain ~20 ms. Fail2ban/CrowdSec секунд–минут.",
    rivals:
      "Fail2ban ban seconds–minutes. CrowdSec signal network-ка tиэн; kernel ban бэйэ integratsiya. ModSecurity inline, persistent ipset pipeline суох.",
    proof: "72h soak · 864 sample · 0 error",
  },
  {
    what:
      "Бар step tenant Prometheus metrics, Grafana dashboard, :8443 SOC timeline-га yazar. Operator Telegram alert + bir bası ack биир paneltan.",
    advantages: [
      "tenant_id loganalyzer_* metrics — multi-tenant observability",
      "SOC timeline, attack map, /tests proof matrix биир dashboard-та",
      "Self-hosted :8443 — data үçünсü tarap bulutка барбат",
      "14 file PDF/JSON proof pack avtomatik sync",
    ],
    lg: "Metrics + dashboard + proof биир продукт; CrowdSec SaaS console эбэтэр piecemeal Grafana кэриэкпэт.",
    rivals:
      "Fail2ban metrics/export чого. CrowdSec managed SaaS эбэтэр piecemeal self-hosted. ModSecurity log, нo SOC timeline эбэтэр auto proof pack суох.",
    proof: "75 test · competitive-proof.json · dashboard /tests",
  },
];

export const STEPS_EXTRA_BY_LOCALE = {
  pt: STEPS_PT,
  nl: STEPS_NL,
  uz: STEPS_UZ,
  ky: STEPS_KY,
  tk: STEPS_TK,
  crh: STEPS_CRH,
  gag: STEPS_GAG,
  tt: STEPS_TT,
  ba: STEPS_BA,
  cv: STEPS_CV,
  ug: STEPS_UG,
  sah: STEPS_SAH,
} as const;
