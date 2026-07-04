import type { Locale } from "../locales";
import type { PipelineStepDeep } from "./types";
import { STEPS_EXTRA_BY_LOCALE } from "./localeStepsExtra";

/** Localized step bodies (labels are in labels.ts). tr/en live in steps.ts; extras in localeStepsExtra.ts. */
export const STEPS_DE: PipelineStepDeep[] = [
  {
    what:
      "Liest die nginx-Access-Log-Datei, die Sie bereits schreiben, in Echtzeit. Kein extra Reverse Proxy, Sidecar oder Cloud-Agent — die Logzeile auf Ihrem Server ist der Start einer einzigen Kette.",
    advantages: [
      "Funktioniert ohne nginx zu ersetzen; nur eine Logformat-Anpassung nötig",
      "log_guardian-Format liefert URI, Method, XFF und Body in einem Schema",
      "Keine Logs in die Cloud — voll self-hosted, Daten bleiben auf Ihrem Server",
      "Sofortige Verarbeitung pro Zeile; Setup in ~15 Minuten",
    ],
    lg: "Ein Binary liest nginx-Logs — kein separates Fail2ban/CrowdSec-Agent-Setup.",
    rivals:
      "CrowdSec braucht einen separaten Agent plus zentrale API. Fail2ban liest Logs, erreicht aber nie eine WAF-Schicht — stückweise Architektur.",
    proof: "75 automatische Tests · Install-Gate PASS",
  },
  {
    what:
      "Wandelt jede Logzeile in ein normalisiertes Schema um: URI, HTTP-Methode, X-Forwarded-For, User-Agent und optional Body. WAF-, Ban- und Metrikschichten teilen dieselbe Struktur.",
    advantages: [
      "Ein Schema — kein Formatkonflikt zwischen Parser, WAF und Ban-Pipeline",
      "XFF und Proxy-Ketten normalisiert für korrekte Client-IP",
      "Hoher Durchsatz in Zeilen/Sekunde — in Benchmarks gemessen",
      "Strict-Mod fängt fehlende Felder bei Install-Gates ab",
    ],
    lg: "Log → normalisieren → WAF in einem Prozess; kein Zwischenformat oder ETL.",
    rivals:
      "ModSecurity läuft inline in nginx, aber logbasiertes Bannen braucht separate Fail2ban-Integration. CrowdSec nutzt anderen Parser plus Signalnetz.",
    proof: "280.373 EPS · 16,93× ModSec (bench-vs-modsec.json)",
  },
  {
    what:
      "Bewertet Angriffsmuster mit 121 OWASP-CRS-Regeln, PCRE2-JIT und OpenAPI/Schema- plus BOLA-Validierung. Gemessene 100%-Parität mit ModSecurity auf demselben Korpus.",
    advantages: [
      "121 OWASP-CRS-Regeln — branchenübliche WAF-Abdeckung",
      "PCRE2-JIT für hohen Durchsatz; 280.373 EPS gemessen",
      "Schema/BOLA-Schicht erkennt API-Missbrauch",
      "100% Recall echter Angriffe · 0,2% False Positives (1500-Zeilen-Korpus)",
    ],
    lg: "WAF + CRS in einem Produkt — kein separates ModSecurity-Modul. 16,93× schneller als ModSec bei denselben 121 Regeln.",
    rivals:
      "ModSecurity + CRS ist ein separates Modul an nginx — blockiert die erste Anfrage inline, hat aber keine Log→Ban-Kette. Fail2ban führt keine WAF-Bewertung durch.",
    proof: "CRS-Parität 100% · Recall 100% · FP 0,2%",
  },
  {
    what:
      "Nach einem WAF-Treffer vereinen Tenant-Policy, Ban-Schwelle, FP-Trust-Score und Operator-Bestätigung in einem Entscheidungspfad. Fehlban-Risiko ist durch gemessene Gates begrenzt.",
    advantages: [
      "Policy + Tenant + FP Trust in einer Pipeline — kein separates Fail2ban-Jail-Tuning",
      "0,2% FP bei 500 benignen Zeilen — gemessenes Gate",
      "Multi-Tenant-Labels fließen zu Prometheus und Dashboard",
      "IPC-Auth fail-closed; unbefugte Ban-Befehle werden abgelehnt",
    ],
    lg: "~20 ms Median von der Logzeile zur Ban-Entscheidung; Policy, Tenant und FP Trust in einem Codepfad.",
    rivals:
      "Fail2ban feuert nur Regex/Jail-Bans; FP Trust und Tenant leben in anderen Systemen. CrowdSec braucht zentrale Entscheidung plus verteilte Agenten.",
    proof: "~20 ms Median-Ban · 21 Proben (bench-ban-latency.json)",
  },
  {
    what:
      "Wendet den Ban auf Kernel-Ebene via ipset und optional XDP/eBPF an, sobald die Entscheidung steht. Der Userspace→Kernel-Sprung in gemessen ~20 ms Median.",
    advantages: [
      "Ban auf Kernel-Ebene — iptables/nftables + ipset; Umgehung aus Userspace schwerer",
      "Optionales XDP-Paket-Drop; auf Laptop/VM reicht --no-xdp + ipset",
      "~20 ms Median von Logzeile bis Ban (21 Proben)",
      "Verteilte Angriffe: JA3-Cluster + Ban pro IP — 100% im 80-IP-Livetest",
    ],
    lg: "Log → Kernel-Ban in einer Kette, ~20 ms. Fail2ban/CrowdSec bleiben bei Sekunden–Minuten.",
    rivals:
      "Fail2ban-Ban-Latenz: Sekunden bis Minuten. CrowdSec hängt am Signalnetz; Kernel-Ban ist weitere Integration. ModSecurity blockiert inline, hat aber keine persistente ipset-Ban-Pipeline.",
    proof: "72h-Soak · 864 Proben · 0 Fehler",
  },
  {
    what:
      "Jeder Schritt schreibt tenant-markierte Prometheus-Metriken, Grafana-Dashboards und die :8443-SOC-Timeline. Operatoren steuern Telegram-Alerts und Ein-Klick-Ack im selben Panel.",
    advantages: [
      "tenant_id-markierte loganalyzer_*-Metriken — Multi-Tenant-Observability",
      "SOC-Timeline, Attack Map und /tests-Nachweismatrix in einem Dashboard",
      "Self-hosted :8443 — keine Daten an Drittanbieter-Cloud",
      "14-Dateien-Nachweispaket synchronisiert automatisch",
    ],
    lg: "Metriken + Dashboard + Nachweis in einem Produkt — keine CrowdSec-SaaS-Konsole oder stückweiser Grafana-Stack.",
    rivals:
      "Fail2ban hat begrenzte Metriken/Export. CrowdSec will Managed SaaS oder stückweises Self-hosted-Setup. ModSecurity erzeugt Logs, aber keine SOC-Timeline oder automatisches Nachweispaket.",
    proof: "75 Tests · competitive-proof.json · Dashboard /tests",
  },
];

export const STEPS_FR: PipelineStepDeep[] = [
  {
    what:
      "Lit le fichier access log nginx que vous écrivez déjà, en temps réel. Pas de reverse proxy, sidecar ou agent cloud — la ligne de log sur votre serveur est le début d'une seule chaîne.",
    advantages: [
      "Fonctionne sans remplacer nginx ; seul un réglage de format de log suffit",
      "Le format log_guardian expose URI, méthode, XFF et body dans un seul schéma",
      "Pas d'envoi de logs vers le cloud — entièrement self-hosted",
      "Traitement instantané par ligne ; installation en ~15 minutes",
    ],
    lg: "Un seul binaire lit les logs nginx — pas d'agent Fail2ban/CrowdSec séparé.",
    rivals:
      "CrowdSec exige un agent séparé plus une API centrale. Fail2ban lit les logs mais n'atteint jamais une couche WAF — architecture fragmentée.",
    proof: "75 tests automatiques · gate d'installation PASS",
  },
  {
    what:
      "Transforme chaque ligne en schéma normalisé : URI, méthode HTTP, X-Forwarded-For, User-Agent et body optionnel. WAF, ban et métriques partagent la même structure.",
    advantages: [
      "Un schéma — pas d'incompatibilité entre parser, WAF et pipeline de ban",
      "XFF et chaînes proxy normalisés pour une IP client correcte",
      "Débit élevé en lignes/seconde — mesuré en benchmark",
      "Mode strict détecte les champs manquants aux gates d'installation",
    ],
    lg: "Log → normalisation → WAF dans un seul processus ; pas de format intermédiaire ni ETL.",
    rivals:
      "ModSecurity tourne inline dans nginx mais le ban basé sur les logs exige Fail2ban à part. CrowdSec utilise un parser différent plus un réseau de signaux.",
    proof: "280 373 EPS · 16,93× ModSec (bench-vs-modsec.json)",
  },
  {
    what:
      "Évalue les motifs d'attaque avec 121 règles OWASP CRS, compilation PCRE2 JIT et validation OpenAPI/schema + BOLA. Parité mesurée à 100 % avec ModSecurity sur le même corpus.",
    advantages: [
      "121 règles OWASP CRS — couverture WAF standard",
      "PCRE2 JIT pour un débit élevé ; 280 373 EPS mesurés",
      "Couche schema/BOLA détecte les abus d'API",
      "100 % recall attaques réelles · 0,2 % faux positifs (corpus 1500 lignes)",
    ],
    lg: "WAF + CRS dans un seul produit — pas de module ModSecurity séparé. 16,93× plus rapide que ModSec sur les mêmes 121 règles.",
    rivals:
      "ModSecurity + CRS est un module séparé sur nginx — bloque la première requête inline mais sans chaîne log→ban. Fail2ban ne fait pas d'évaluation WAF.",
    proof: "Parité CRS 100 % · recall 100 % · FP 0,2 %",
  },
  {
    what:
      "Après un match WAF, politique tenant, seuil de ban, score FP trust et acquittement opérateur fusionnent en un seul chemin de décision. Le risque de mauvais ban est limité par des gates mesurés.",
    advantages: [
      "Policy + tenant + FP trust dans un pipeline — pas de jails Fail2ban séparés",
      "0,2 % FP sur 500 lignes benignes — gate mesuré",
      "Labels multi-tenant vers Prometheus et dashboard",
      "Auth IPC fail-closed ; commandes de ban non autorisées rejetées",
    ],
    lg: "~20 ms médian de la ligne de log à la décision de ban ; policy, tenant et FP trust partagent un code path.",
    rivals:
      "Fail2ban ne déclenche que des bans regex/jail ; FP trust et tenant sont ailleurs. CrowdSec exige décision centrale plus agents distribués.",
    proof: "~20 ms ban médian · 21 échantillons (bench-ban-latency.json)",
  },
  {
    what:
      "Applique le ban au niveau noyau via ipset et XDP/eBPF optionnel dès la décision. Le saut userspace→noyau en ~20 ms médian mesuré.",
    advantages: [
      "Ban niveau noyau — iptables/nftables + ipset ; contournement userspace plus difficile",
      "Drop XDP optionnel ; sur laptop/VM --no-xdp + ipset suffit",
      "~20 ms médian de la ligne de log au ban (21 échantillons)",
      "Attaques distribuées : cluster JA3 + ban par IP — 100 % sur test live 80 IP",
    ],
    lg: "Log → ban noyau en une chaîne, ~20 ms. Fail2ban/CrowdSec restent en secondes–minutes.",
    rivals:
      "Latence de ban Fail2ban : secondes à minutes. CrowdSec dépend du réseau de signaux ; ban noyau est une autre intégration. ModSecurity bloque inline sans pipeline ipset persistant.",
    proof: "Soak 72h · 864 échantillons · 0 erreur",
  },
  {
    what:
      "Chaque étape écrit des métriques Prometheus tenant, des dashboards Grafana et la timeline SOC :8443. Les opérateurs gèrent alertes Telegram et ack en un clic depuis le même panel.",
    advantages: [
      "Métriques loganalyzer_* avec tenant_id — observabilité multi-tenant",
      "Timeline SOC, attack map et matrice /tests dans un dashboard",
      "Self-hosted :8443 — pas de données vers un cloud tiers",
      "Pack de preuves PDF/JSON 14 fichiers synchronisé automatiquement",
    ],
    lg: "Métriques + dashboard + preuve en un produit — pas de console SaaS CrowdSec ni stack Grafana fragmentée.",
    rivals:
      "Fail2ban : métriques/export limités. CrowdSec veut SaaS managé ou setup self-hosted morcelé. ModSecurity émet des logs sans timeline SOC ni pack de preuve automatique.",
    proof: "75 tests · competitive-proof.json · dashboard /tests",
  },
];

export const STEPS_ES: PipelineStepDeep[] = [
  {
    what:
      "Lee el access log de nginx que ya escribes, en tiempo real. Sin reverse proxy, sidecar ni agente en la nube — la línea de log en tu servidor es el inicio de una sola cadena.",
    advantages: [
      "Funciona sin reemplazar nginx; solo un ajuste de formato de log",
      "El formato log_guardian expone URI, método, XFF y body en un esquema",
      "Sin enviar logs a la nube — totalmente self-hosted",
      "Procesamiento instantáneo por línea; instalación en ~15 minutos",
    ],
    lg: "Un solo binario lee logs nginx — sin instalar agentes Fail2ban/CrowdSec aparte.",
    rivals:
      "CrowdSec necesita agente separado más API central. Fail2ban lee logs pero no llega a una capa WAF — arquitectura fragmentada.",
    proof: "75 pruebas automáticas · gate de instalación PASS",
  },
  {
    what:
      "Convierte cada línea en un esquema normalizado: URI, método HTTP, X-Forwarded-For, User-Agent y body opcional. WAF, ban y métricas comparten la misma estructura.",
    advantages: [
      "Un esquema — sin desajuste entre parser, WAF y pipeline de ban",
      "XFF y cadenas proxy normalizados para IP cliente correcta",
      "Alto throughput en líneas/segundo — medido en benchmarks",
      "Modo strict detecta campos faltantes en gates de instalación",
    ],
    lg: "Log → normalizar → WAF en un proceso; sin formato intermedio ni ETL.",
    rivals:
      "ModSecurity corre inline en nginx pero el ban por logs exige Fail2ban aparte. CrowdSec usa otro parser más red de señales.",
    proof: "280.373 EPS · 16,93× ModSec (bench-vs-modsec.json)",
  },
  {
    what:
      "Evalúa patrones de ataque con 121 reglas OWASP CRS, compilación PCRE2 JIT y validación OpenAPI/schema + BOLA. Paridad medida al 100 % con ModSecurity en el mismo corpus.",
    advantages: [
      "121 reglas OWASP CRS — cobertura WAF estándar",
      "PCRE2 JIT para alto throughput; 280.373 EPS medidos",
      "Capa schema/BOLA detecta abuso de API",
      "100 % recall ataques reales · 0,2 % falsos positivos (corpus 1500 líneas)",
    ],
    lg: "WAF + CRS en un producto — sin módulo ModSecurity separado. 16,93× más rápido que ModSec en las mismas 121 reglas.",
    rivals:
      "ModSecurity + CRS es módulo aparte en nginx — bloquea la primera petición inline pero sin cadena log→ban. Fail2ban no evalúa WAF.",
    proof: "Paridad CRS 100 % · recall 100 % · FP 0,2 %",
  },
  {
    what:
      "Tras un match WAF, política tenant, umbral de ban, score FP trust y ack del operador se unen en un solo camino de decisión. El riesgo de ban erróneo está acotado por gates medidos.",
    advantages: [
      "Policy + tenant + FP trust en un pipeline — sin jails Fail2ban separados",
      "0,2 % FP en 500 líneas benignas — gate medido",
      "Etiquetas multi-tenant hacia Prometheus y dashboard",
      "Auth IPC fail-closed; comandos de ban no autorizados rechazados",
    ],
    lg: "~20 ms mediano de línea de log a decisión de ban; policy, tenant y FP trust en un code path.",
    rivals:
      "Fail2ban solo dispara bans regex/jail; FP trust y tenant viven en otros sistemas. CrowdSec exige decisión central más agentes distribuidos.",
    proof: "~20 ms ban mediano · 21 muestras (bench-ban-latency.json)",
  },
  {
    what:
      "Aplica el ban a nivel kernel vía ipset y XDP/eBPF opcional en el momento de la decisión. Salto userspace→kernel en ~20 ms mediano medido.",
    advantages: [
      "Ban a nivel kernel — iptables/nftables + ipset; más difícil eludir desde userspace",
      "Drop XDP opcional; en laptop/VM basta --no-xdp + ipset",
      "~20 ms mediano de línea de log a ban (21 muestras)",
      "Ataques distribuidos: cluster JA3 + ban por IP — 100 % en test live 80 IP",
    ],
    lg: "Log → ban kernel en una cadena, ~20 ms. Fail2ban/CrowdSec quedan en segundos–minutos.",
    rivals:
      "Latencia de ban Fail2ban: segundos a minutos. CrowdSec depende de red de señales; ban kernel es otra integración. ModSecurity bloquea inline sin pipeline ipset persistente.",
    proof: "Soak 72h · 864 muestras · 0 errores",
  },
  {
    what:
      "Cada paso escribe métricas Prometheus con tenant, dashboards Grafana y timeline SOC :8443. Operadores gestionan alertas Telegram y ack en un clic desde el mismo panel.",
    advantages: [
      "Métricas loganalyzer_* con tenant_id — observabilidad multi-tenant",
      "Timeline SOC, attack map y matriz /tests en un dashboard",
      "Self-hosted :8443 — sin datos a nube de terceros",
      "Pack de prueba PDF/JSON 14 archivos sincronizado automáticamente",
    ],
    lg: "Métricas + dashboard + prueba en un producto — sin consola SaaS CrowdSec ni stack Grafana fragmentado.",
    rivals:
      "Fail2ban: métricas/export limitados. CrowdSec quiere SaaS gestionado o setup self-hosted fragmentado. ModSecurity emite logs sin timeline SOC ni pack de prueba automático.",
    proof: "75 pruebas · competitive-proof.json · dashboard /tests",
  },
];

export const STEPS_RU: PipelineStepDeep[] = [
  {
    what:
      "Читает access-лог nginx, который вы уже пишете, в реальном времени. Без reverse proxy, sidecar или облачного агента — строка лога на сервере — начало одной цепочки.",
    advantages: [
      "Работает без замены nginx; достаточно настроить формат лога",
      "Формат log_guardian даёт URI, method, XFF и body в одной схеме",
      "Без отправки логов в облако — полностью self-hosted",
      "Мгновенная обработка каждой строки; установка ~15 минут",
    ],
    lg: "Один бинарник читает логи nginx — без отдельного агента Fail2ban/CrowdSec.",
    rivals:
      "CrowdSec требует отдельный агент и центральный API. Fail2ban читает логи, но не доходит до WAF — фрагментарная архитектура.",
    proof: "75 автотестов · install gate PASS",
  },
  {
    what:
      "Превращает каждую строку в нормализованную схему: URI, HTTP method, X-Forwarded-For, User-Agent и опционально body. WAF, ban и метрики используют одну структуру.",
    advantages: [
      "Одна схема — нет рассинхрона между parser, WAF и ban pipeline",
      "XFF и цепочки proxy нормализованы для корректного IP клиента",
      "Высокий throughput строк/с — измерен в бенчмарках",
      "Strict mode ловит пропущенные поля на install gates",
    ],
    lg: "Log → normalize → WAF в одном процессе; без промежуточного формата и ETL.",
    rivals:
      "ModSecurity inline в nginx, но ban по логам требует отдельный Fail2ban. CrowdSec — другой parser и сеть сигналов.",
    proof: "280 373 EPS · 16,93× ModSec (bench-vs-modsec.json)",
  },
  {
    what:
      "Оценивает атаки 121 правилом OWASP CRS, PCRE2 JIT и OpenAPI/schema + BOLA. Измеренная 100% паритетность с ModSecurity на том же корпусе.",
    advantages: [
      "121 правило OWASP CRS — отраслевой стандарт WAF",
      "PCRE2 JIT для высокого throughput; 280 373 EPS измерено",
      "Слой schema/BOLA ловит злоупотребление API",
      "100% recall реальных атак · 0,2% FP (кorpus 1500 строк)",
    ],
    lg: "WAF + CRS в одном продукте — без отдельного ModSecurity. 16,93× быстрее ModSec на тех же 121 правилах.",
    rivals:
      "ModSecurity + CRS — отдельный модуль nginx; блокирует первый запрос inline, но без цепочки log→ban. Fail2ban не делает WAF.",
    proof: "CRS parity 100% · recall 100% · FP 0,2%",
  },
  {
    what:
      "После WAF match политика tenant, порог ban, FP trust и ack оператора сходятся в одном decision path. Риск ошибочного ban ограничен измеренными gates.",
    advantages: [
      "Policy + tenant + FP trust в одном pipeline — без отдельных jail Fail2ban",
      "0,2% FP на 500 benign строк — измеренный gate",
      "Multi-tenant labels идут в Prometheus и dashboard",
      "IPC auth fail-closed; неавторизованные ban-команды отклоняются",
    ],
    lg: "~20 ms медиана от строки лога до решения о ban; policy, tenant и FP trust в одном code path.",
    rivals:
      "Fail2ban только regex/jail ban; FP trust и tenant — в других системах. CrowdSec — центральное решение и распределённые агенты.",
    proof: "~20 ms median ban · 21 образец (bench-ban-latency.json)",
  },
  {
    what:
      "Применяет ban на уровне ядра через ipset и опционально XDP/eBPF сразу после решения. Переход userspace→kernel за измеренные ~20 ms медианы.",
    advantages: [
      "Ban на уровне ядра — iptables/nftables + ipset; сложнее обойти из userspace",
      "Опциональный XDP drop; на laptop/VM достаточно --no-xdp + ipset",
      "~20 ms медиана от строки лога до ban (21 образец)",
      "Распределённые атаки: JA3 cluster + ban по IP — 100% на live-тесте 80 IP",
    ],
    lg: "Log → kernel ban в одной цепочке, ~20 ms. Fail2ban/CrowdSec — секунды–минуты.",
    rivals:
      "Задержка ban Fail2ban — секунды–минуты. CrowdSec зависит от сети сигналов; kernel ban — отдельная интеграция. ModSecurity inline без persistent ipset pipeline.",
    proof: "72h soak · 864 образца · 0 ошибок",
  },
  {
    what:
      "Каждый шаг пишет Prometheus-метрики с tenant, Grafana dashboards и SOC timeline :8443. Операторы управляют Telegram alerts и ack в одном panel.",
    advantages: [
      "Метрики loganalyzer_* с tenant_id — multi-tenant observability",
      "SOC timeline, attack map и матрица /tests в одном dashboard",
      "Self-hosted :8443 — без данных в стороннее облако",
      "14-файловый PDF/JSON evidence pack синхронизируется автоматически",
    ],
    lg: "Метрики + dashboard + proof в одном продукте — без SaaS CrowdSec и фрагментированного Grafana.",
    rivals:
      "Fail2ban: ограниченные метрики/export. CrowdSec хочет managed SaaS или piecemeal self-hosted. ModSecurity — логи без SOC timeline и auto proof pack.",
    proof: "75 тестов · competitive-proof.json · dashboard /tests",
  },
];

export const STEPS_ZH: PipelineStepDeep[] = [
  {
    what:
      "实时读取您已在写入的 nginx 访问日志。无需额外反向代理、sidecar 或云端 agent — 服务器上的日志行就是单一链路的起点。",
    advantages: [
      "无需替换 nginx，仅调整日志格式即可",
      "log_guardian 格式在一个 schema 中提供 URI、method、XFF 和 body",
      "日志不上云 — 完全 self-hosted，数据留在您的服务器",
      "逐行即时处理；约 15 分钟完成安装",
    ],
    lg: "单一二进制读取 nginx 日志 — 无需单独安装 Fail2ban/CrowdSec agent。",
    rivals:
      "CrowdSec 需要独立 agent 和 central API。Fail2ban 读日志但到不了 WAF 层 — 架构零散。",
    proof: "75 项自动化测试 · 安装 gate PASS",
  },
  {
    what:
      "将每行日志转为统一 schema：URI、HTTP method、X-Forwarded-For、User-Agent 及可选 body。WAF、封禁与指标层共享同一结构。",
    advantages: [
      "单一 schema — parser、WAF 与 ban pipeline 无格式冲突",
      "XFF 与 proxy 链规范化以提取正确客户端 IP",
      "高行/秒吞吐 — 基准测试已测量",
      "Strict 模式在安装 gate 捕获缺失字段",
    ],
    lg: "Log → 规范化 → WAF 同一进程；无中间格式或 ETL。",
    rivals:
      "ModSecurity 在 nginx 内联运行，但基于日志的封禁需单独 Fail2ban。CrowdSec 使用不同 parser 与信号网络。",
    proof: "280,373 EPS · 16.93× ModSec (bench-vs-modsec.json)",
  },
  {
    what:
      "用 121 条 OWASP CRS 规则、PCRE2 JIT 及 OpenAPI/schema + BOLA 校验评估攻击模式。在同一 corpus 上与 ModSecurity 测得 100% parity。",
    advantages: [
      "121 条 OWASP CRS — 行业标准 WAF 覆盖",
      "PCRE2 JIT 高吞吐；测得 280,373 EPS",
      "Schema/BOLA 层捕获 API 滥用",
      "真实攻击 recall 100% · 误报 0.2%（1500 行 corpus）",
    ],
    lg: "WAF + CRS 同一产品 — 无需单独 ModSecurity 模块。相同 121 规则比 ModSec 快 16.93×。",
    rivals:
      "ModSecurity + CRS 是 nginx 独立模块 — 内联拦截首请求但无 log→ban 链。Fail2ban 不做 WAF 评估。",
    proof: "CRS parity 100% · recall 100% · FP 0.2%",
  },
  {
    what:
      "WAF 匹配后，tenant 策略、封禁阈值、FP trust 分数与操作员确认合并在一条决策路径。错误封禁风险由实测 gate 约束。",
    advantages: [
      "Policy + tenant + FP trust 同一 pipeline — 无需单独 Fail2ban jail",
      "500 行 benign 上 FP 0.2% — 实测 gate",
      "Multi-tenant 标签流入 Prometheus 与 dashboard",
      "IPC auth fail-closed；未授权 ban 命令被拒绝",
    ],
    lg: "日志行到 ban 决策中位 ~20 ms；policy、tenant 与 FP trust 同一代码路径。",
    rivals:
      "Fail2ban 仅 regex/jail ban；FP trust 与 tenant 在其他系统。CrowdSec 需 central 决策与分布式 agent。",
    proof: "中位 ban ~20 ms · 21 个样本 (bench-ban-latency.json)",
  },
  {
    what:
      "决策瞬间通过 ipset 与可选 XDP/eBPF 在内核级执行封禁。userspace→kernel 跳转测得中位 ~20 ms。",
    advantages: [
      "内核级封禁 — iptables/nftables + ipset；userspace 更难绕过",
      "可选 XDP 丢包；笔记本/VM 上 --no-xdp + ipset 即可",
      "日志行到 ban 中位 ~20 ms（21 样本）",
      "分布式攻击：JA3 cluster + 按 IP ban — 80 IP  live 测试 100%",
    ],
    lg: "Log → kernel ban 单一链路 ~20 ms。Fail2ban/CrowdSec 仍在秒–分钟级。",
    rivals:
      "Fail2ban 封禁延迟为秒–分钟。CrowdSec 依赖信号网络；kernel ban 是另一集成。ModSecurity 内联拦截但无持久 ipset pipeline。",
    proof: "72h soak · 864 样本 · 0 错误",
  },
  {
    what:
      "每一步写入带 tenant 标签的 Prometheus 指标、Grafana 面板与 :8443 SOC dashboard timeline。操作员在同一面板管理 Telegram 告警与一键 ack。",
    advantages: [
      "tenant_id 标签的 loganalyzer_* 指标 — 多租户可观测性",
      "SOC timeline、attack map 与 /tests 证明矩阵同一 dashboard",
      "Self-hosted :8443 — 数据不上第三方云",
      "14 文件 PDF/JSON 证据包自动同步",
    ],
    lg: "指标 + dashboard + 证明同一产品 — 无需 CrowdSec SaaS 控制台或零散 Grafana。",
    rivals:
      "Fail2ban 指标/export 有限。CrowdSec 要 managed SaaS 或零散 self-hosted。ModSecurity 产日志但无 SOC timeline 与自动证据包。",
    proof: "75 测试 · competitive-proof.json · dashboard /tests",
  },
];

export const STEPS_JA: PipelineStepDeep[] = [
  {
    what:
      "すでに書き込んでいる nginx アクセスログをリアルタイムで読み取ります。追加のリバースプロキシ、サイドカー、クラウド agent は不要 — サーバー上のログ行が単一チェーンの起点です。",
    advantages: [
      "nginx を置き換えずに動作；ログ形式の調整のみ",
      "log_guardian 形式で URI、method、XFF、body を単一スキーマに",
      "ログをクラウドに送らない — 完全 self-hosted",
      "行ごとに即時処理；セットアップ約15分",
    ],
    lg: "単一バイナリが nginx ログを読む — Fail2ban/CrowdSec agent の別途インストール不要。",
    rivals:
      "CrowdSec は別 agent と central API が必要。Fail2ban はログを読むが WAF 層に到達しない — 断片的アーキテクチャ。",
    proof: "75 自動テスト · インストール gate PASS",
  },
  {
    what:
      "各行を URI、HTTP method、X-Forwarded-For、User-Agent、任意 body の正規化スキーマに変換。WAF、ban、メトリクス層が同じ構造を共有。",
    advantages: [
      "単一スキーマ — parser、WAF、ban pipeline 間の形式不一致なし",
      "XFF と proxy チェーンを正規化して正しいクライアント IP",
      "高い行/秒スループット — ベンチマークで測定",
      "Strict モードでインストール gate が欠落フィールドを検出",
    ],
    lg: "Log → 正規化 → WAF を同一プロセス内；中間形式や ETL なし。",
    rivals:
      "ModSecurity は nginx 内 inline だが、ログベース ban には別 Fail2ban が必要。CrowdSec は別 parser と信号ネットワーク。",
    proof: "280,373 EPS · 16.93× ModSec (bench-vs-modsec.json)",
  },
  {
    what:
      "121 OWASP CRS ルール、PCRE2 JIT、OpenAPI/schema + BOLA 検証で攻撃パターンを評価。同一 corpus で ModSecurity と 100% parity を測定。",
    advantages: [
      "121 OWASP CRS ルール — 業界標準 WAF カバレッジ",
      "PCRE2 JIT で高スループット；280,373 EPS 測定",
      "Schema/BOLA 層が API 悪用を検出",
      "実攻撃 recall 100% · FP 0.2%（1500行 corpus）",
    ],
    lg: "WAF + CRS を単一製品に — ModSecurity モジュール不要。同じ121ルールで ModSec の16.93倍速。",
    rivals:
      "ModSecurity + CRS は nginx 別モジュール — 最初のリクエストを inline ブロックするが log→ban チェーンなし。Fail2ban は WAF 評価なし。",
    proof: "CRS parity 100% · recall 100% · FP 0.2%",
  },
  {
    what:
      "WAF マッチ後、tenant ポリシー、ban 閾値、FP trust スコア、オペレータ ack を単一 decision path に統合。誤 ban リスクは測定 gate で制限。",
    advantages: [
      "Policy + tenant + FP trust を単一 pipeline — Fail2ban jail 別設定不要",
      "500 benign 行で FP 0.2% — 測定 gate",
      "Multi-tenant ラベルが Prometheus と dashboard へ",
      "IPC auth は fail-closed；未認可 ban コマンドは拒否",
    ],
    lg: "ログ行から ban 決定まで中央値 ~20 ms；policy、tenant、FP trust が同一 code path。",
    rivals:
      "Fail2ban は regex/jail ban のみ；FP trust と tenant は別システム。CrowdSec は central 決定と分散 agent が必要。",
    proof: "中央値 ban ~20 ms · 21 サンプル (bench-ban-latency.json)",
  },
  {
    what:
      "決定と同時に ipset と任意 XDP/eBPF でカーネルレベル ban を適用。userspace→kernel 遷移は測定中央値 ~20 ms。",
    advantages: [
      "カーネルレベル ban — iptables/nftables + ipset；userspace からの回避が困難",
      "任意 XDP パケット drop；ラップトップ/VM では --no-xdp + ipset で十分",
      "ログ行から ban まで中央値 ~20 ms（21 サンプル）",
      "分散攻撃：JA3 cluster + IP ごと ban — 80 IP live テスト 100%",
    ],
    lg: "Log → kernel ban を単一チェーン ~20 ms。Fail2ban/CrowdSec は秒–分レベル。",
    rivals:
      "Fail2ban ban 遅延は秒–分。CrowdSec は信号ネットワーク依存；kernel ban は別統合。ModSecurity は inline ブロックだが永続 ipset pipeline なし。",
    proof: "72h soak · 864 サンプル · 0 エラー",
  },
  {
    what:
      "各ステップが tenant タグ付き Prometheus メトリクス、Grafana ダッシュボード、:8443 SOC timeline に書き込み。オペレータは同一 panel で Telegram アラートとワンクリック ack を管理。",
    advantages: [
      "tenant_id タグの loganalyzer_* メトリクス — マルチテナント observability",
      "SOC timeline、attack map、/tests 証明マトリクスを同一 dashboard",
      "Self-hosted :8443 — 第三者クラウドへデータ送信なし",
      "14 ファイル PDF/JSON 証拠パックを自動同期",
    ],
    lg: "メトリクス + dashboard + 証明を単一製品 — CrowdSec SaaS コンソールや断片 Grafana 不要。",
    rivals:
      "Fail2ban はメトリクス/export 限定的。CrowdSec は managed SaaS や断片 self-hosted を要求。ModSecurity はログのみで SOC timeline と自動証明パックなし。",
    proof: "75 テスト · competitive-proof.json · dashboard /tests",
  },
];

export const STEPS_KO: PipelineStepDeep[] = [
  {
    what:
      "이미 기록 중인 nginx access log를 실시간으로 읽습니다. 추가 reverse proxy, sidecar, 클라우드 agent 불필요 — 서버의 log line이 단일 체인의 시작입니다.",
    advantages: [
      "nginx 교체 없이 동작; log format 조정만 필요",
      "log_guardian format으로 URI, method, XFF, body를 단일 schema에",
      "log를 클라우드로 보내지 않음 — 완전 self-hosted",
      "line별 즉시 처리; 설치 ~15분",
    ],
    lg: "단일 binary가 nginx log 읽음 — Fail2ban/CrowdSec agent 별도 설치 없음.",
    rivals:
      "CrowdSec는 별도 agent + central API 필요. Fail2ban은 log만 읽고 WAF layer까지 가지 않음 — 조각난 architecture.",
    proof: "75 자동 테스트 · install gate PASS",
  },
  {
    what:
      "각 log line을 URI, HTTP method, X-Forwarded-For, User-Agent, 선택 body의 normalize schema로 변환. WAF, ban, metrics layer가 동일 구조 공유.",
    advantages: [
      "단일 schema — parser, WAF, ban pipeline 간 format 불일치 없음",
      "XFF와 proxy chain normalize로 올바른 client IP",
      "높은 line/sec throughput — benchmark 측정",
      "Strict mode가 install gate에서 누락 field 포착",
    ],
    lg: "Log → normalize → WAF 단일 process; 중간 format·ETL 없음.",
    rivals:
      "ModSecurity는 nginx inline이나 log 기반 ban은 별도 Fail2ban 필요. CrowdSec는 다른 parser + signal network.",
    proof: "280,373 EPS · 16.93× ModSec (bench-vs-modsec.json)",
  },
  {
    what:
      "121 OWASP CRS rule, PCRE2 JIT, OpenAPI/schema + BOLA validation으로 attack pattern 평가. 동일 corpus에서 ModSecurity와 100% parity 측정.",
    advantages: [
      "121 OWASP CRS rule — industry-standard WAF coverage",
      "PCRE2 JIT 고 throughput; 280,373 EPS 측정",
      "Schema/BOLA layer가 API abuse 포착",
      "real attack recall 100% · FP 0.2% (1500-line corpus)",
    ],
    lg: "WAF + CRS 단일 product — ModSecurity module 별도 설치 없음. 동일 121 rule에서 ModSec 대비 16.93× 빠름.",
    rivals:
      "ModSecurity + CRS는 nginx 별도 module — 첫 request inline block하나 log→ban chain 없음. Fail2ban은 WAF evaluation 없음.",
    proof: "CRS parity 100% · recall 100% · FP 0.2%",
  },
  {
    what:
      "WAF match 후 tenant policy, ban threshold, FP trust score, operator ack가 단일 decision path로 병합. wrong-ban risk는 measured gate로 제한.",
    advantages: [
      "Policy + tenant + FP trust 단일 pipeline — Fail2ban jail 별도 tuning 없음",
      "500 benign line에서 FP 0.2% — measured gate",
      "Multi-tenant label이 Prometheus·dashboard로",
      "IPC auth fail-closed; unauthorized ban command 거부",
    ],
    lg: "log line→ban decision median ~20 ms; policy, tenant, FP trust 단일 code path.",
    rivals:
      "Fail2ban은 regex/jail ban만; FP trust·tenant는 다른 system. CrowdSec는 central decision + distributed agent 필요.",
    proof: "median ban ~20 ms · 21 samples (bench-ban-latency.json)",
  },
  {
    what:
      "결정 즉시 ipset·optional XDP/eBPF로 kernel-level ban 적용. userspace→kernel hop measured median ~20 ms.",
    advantages: [
      "Kernel-level ban — iptables/nftables + ipset; userspace bypass 어려움",
      "Optional XDP packet drop; laptop/VM에서 --no-xdp + ipset 충분",
      "log line→ban median ~20 ms (21 samples)",
      "Distributed attack: JA3 cluster + per-IP ban — 80 IP live test 100%",
    ],
    lg: "Log → kernel ban 단일 chain ~20 ms. Fail2ban/CrowdSec는 seconds–minutes.",
    rivals:
      "Fail2ban ban latency seconds–minutes. CrowdSec signal network 의존; kernel ban 별도 integration. ModSecurity inline block, persistent ipset pipeline 없음.",
    proof: "72h soak · 864 samples · 0 errors",
  },
  {
    what:
      "각 step이 tenant-tagged Prometheus metrics, Grafana dashboard, :8443 SOC timeline에 기록. operator가 동일 panel에서 Telegram alert·one-click ack 관리.",
    advantages: [
      "tenant_id tagged loganalyzer_* metrics — multi-tenant observability",
      "SOC timeline, attack map, /tests proof matrix 단일 dashboard",
      "Self-hosted :8443 — third-party cloud로 data 미전송",
      "14-file PDF/JSON evidence pack 자동 sync",
    ],
    lg: "Metrics + dashboard + proof 단일 product — CrowdSec SaaS console·piecemeal Grafana 불필요.",
    rivals:
      "Fail2ban metrics/export 제한. CrowdSec managed SaaS·piecemeal self-hosted 요구. ModSecurity log만, SOC timeline·auto proof pack 없음.",
    proof: "75 tests · competitive-proof.json · dashboard /tests",
  },
];

export const STEPS_AR: PipelineStepDeep[] = [
  {
    what:
      "يقرأ ملف access log لـ nginx الذي تكتبه بالفعل في الوقت الفعلي. لا حاجة لـ reverse proxy أو sidecar أو agent سحابي — سطر السجل على خادمك هو بداية سلسلة واحدة.",
    advantages: [
      "يعمل دون استبدال nginx؛ يكفي ضبط تنسيق السجل",
      "تنسيق log_guardian يعرض URI وmethod وXFF وbody في schema واحد",
      "لا إرسال للسجلات إلى السحابة — self-hosted بالكامل",
      "معالجة فورية لكل سطر؛ التثبيت ~15 دقيقة",
    ],
    lg: "binary واحد يقرأ سجلات nginx — دون agent منفصل Fail2ban/CrowdSec.",
    rivals:
      "CrowdSec يحتاج agent منفصل وAPI مركزي. Fail2ban يقرأ السجلات لكن لا يصل لطبقة WAF — بنية مجزّأة.",
    proof: "75 اختبارًا آليًا · gate التثبيت PASS",
  },
  {
    what:
      "يحوّل كل سطر إلى schema موحّد: URI وHTTP method وX-Forwarded-For وUser-Agent وbody اختياري. طبقات WAF والban والمقاييس تشترك البنية نفسها.",
    advantages: [
      "schema واحد — لا تعارض بين parser وWAF وban pipeline",
      "XFF وسلاسل proxy موحّدة لاستخراج IP العميل الصحيح",
      "throughput عالٍ بالأسطر/ث — مقاس في benchmarks",
      "وضع strict يلتقط الحقول الناقصة عند gates التثبيت",
    ],
    lg: "Log → normalize → WAF في process واحد؛ دون format وسيط أو ETL.",
    rivals:
      "ModSecurity inline في nginx لكن الحظر من السجل يحتاج Fail2ban منفصل. CrowdSec parser مختلف + شبكة إشارات.",
    proof: "280,373 EPS · 16.93× ModSec (bench-vs-modsec.json)",
  },
  {
    what:
      "يقيّم أنماط الهجوم بـ 121 قاعدة OWASP CRS وPCRE2 JIT وOpenAPI/schema + BOLA. parité 100% مع ModSecurity على نفس corpus.",
    advantages: [
      "121 قاعدة OWASP CRS — تغطية WAF معيارية",
      "PCRE2 JIT لـ throughput عالٍ؛ 280,373 EPS مقاس",
      "طبقة schema/BOLA تلتقط إساءة API",
      "recall 100% للهجمات الحقيقية · FP 0.2% (corpus 1500 سطر)",
    ],
    lg: "WAF + CRS في منتج واحد — دون module ModSecurity منفصل. أسرع 16.93× من ModSec على نفس 121 قاعدة.",
    rivals:
      "ModSecurity + CRS module منفصل على nginx — يحظر الطلب الأول inline لكن بلا سلسلة log→ban. Fail2ban لا يقيّم WAF.",
    proof: "CRS parity 100% · recall 100% · FP 0.2%",
  },
  {
    what:
      "بعد تطابق WAF، policy المستأجر وعتبة الحظر وFP trust وack المشغّل تندمج في مسار قرار واحد. خطر الحظر الخاطئ محدود بـ gates مقاسة.",
    advantages: [
      "Policy + tenant + FP trust في pipeline واحد — دون jails Fail2ban منفصلة",
      "FP 0.2% على 500 سطر benign — gate مقاس",
      "تسميات multi-tenant إلى Prometheus وdashboard",
      "IPC auth fail-closed؛ أوامر ban غير المصرّح بها مرفوضة",
    ],
    lg: "median ~20 ms من سطر السجل إلى قرار الحظر؛ policy وtenant وFP trust في code path واحد.",
    rivals:
      "Fail2ban يطلق bans regex/jail فقط؛ FP trust وtenant في أنظمة أخرى. CrowdSec يحتاج قرارًا مركزيًا وagents موزّعة.",
    proof: "median ban ~20 ms · 21 عينة (bench-ban-latency.json)",
  },
  {
    what:
      "يطبّق الحظر على مستوى النواة عبر ipset وXDP/eBPF اختياري لحظة القرار. انتقال userspace→kernel بmedian ~20 ms مقاس.",
    advantages: [
      "حظر مستوى النواة — iptables/nftables + ipset؛ تجاوز userspace أصعب",
      "XDP drop اختياري؛ على laptop/VM يكفي --no-xdp + ipset",
      "median ~20 ms من سطر السجل إلى ban (21 عينة)",
      "هجمات موزّعة: JA3 cluster + ban لكل IP — 100% في اختبار live 80 IP",
    ],
    lg: "Log → kernel ban في سلسلة واحدة ~20 ms. Fail2ban/CrowdSec يبقيان بالثواني–الدقائق.",
    rivals:
      "latency ban Fail2ban ثوانٍ–دقائق. CrowdSec يعتمد شبكة الإشارات؛ kernel ban تكامل آخر. ModSecurity inline بلا ipset pipeline دائم.",
    proof: "72h soak · 864 عينة · 0 خطأ",
  },
  {
    what:
      "كل خطوة تكتب مقاييس Prometheus بوسم tenant وdashboards Grafana وtimeline SOC :8443. المشغّلون يديرون تنبيهات Telegram وack بنقرة من نفس panel.",
    advantages: [
      "مقاييس loganalyzer_* بوسم tenant_id — observability متعدد المستأجرين",
      "timeline SOC وattack map ومصفوفة /tests في dashboard واحد",
      "Self-hosted :8443 — لا بيانات لسحابة طرف ثالث",
      "حزمة دليل PDF/JSON 14 ملفًا تتزامن تلقائيًا",
    ],
    lg: "مقاييس + dashboard + دليل في منتج واحد — دون console SaaS CrowdSec أو Grafana مجزّأ.",
    rivals:
      "Fail2ban مقاييس/export محدود. CrowdSec يريد SaaS مُدار أو self-hosted مجزّأ. ModSecurity ينتج سجلات بلا timeline SOC أو حزمة دليل تلقائية.",
    proof: "75 اختبار · competitive-proof.json · dashboard /tests",
  },
];

export const STEPS_AZ: PipelineStepDeep[] = [
  {
    what:
      "Artıq yazdığınız nginx access log faylını real vaxtda oxuyur. Əlavə reverse proxy, sidecar və ya bulud agent lazım deyil — serverdəki log sətri tək zəncirin başlanğıcıdır.",
    advantages: [
      "Mövcud nginx quraşdırmasına toxunmadan işləyir; yalnız log formatı kifayətdir",
      "log_guardian formatı ilə URI, method, XFF və body tək sxemada",
      "Logları buluda göndərmir — tam self-hosted",
      "Sətir başına ani emal; quraşdırma ~15 dəqiqə",
    ],
    lg: "Tək binary nginx logunu oxuyur; ayrı Fail2ban/CrowdSec agent yoxdur.",
    rivals:
      "CrowdSec ayrı agent + mərkəzi API istəyir. Fail2ban log oxuyur amma WAF qatına çatmır — parçalı memarlıq.",
    proof: "75 avtomatik test · quraşdırma gate PASS",
  },
  {
    what:
      "Hər log sətirini URI, HTTP method, X-Forwarded-For, User-Agent və istəyə görə body ilə tək normalize sxemaya çevirir. WAF, ban və metrik qatları eyni strukturu paylaşır.",
    advantages: [
      "Tək sxema — parser, WAF və ban pipeline arasında format uyğunsuzluğu yoxdur",
      "XFF və proxy zənciri düzgün IP üçün normalize edilir",
      "Yüksək sətir/saniyə throughput — bench ilə ölçülüb",
      "Strict rejim quraşdırma gate-də boş sahələri tutur",
    ],
    lg: "Log → normalize → WAF eyni prosesdə; ara format və ya ETL yoxdur.",
    rivals:
      "ModSecurity nginx-də inline işləyir amma log əsaslı ban üçün ayrı Fail2ban lazımdır. CrowdSec fərqli parser + siqnal şəbəkəsi.",
    proof: "280.373 EPS · 16,93× ModSec (bench-vs-modsec.json)",
  },
  {
    what:
      "121 OWASP CRS qaydası, PCRE2 JIT və OpenAPI/schema + BOLA ilə hücum nümunələrini qiymətləndirir. Eyni corpusta ModSecurity ilə 100% paritet ölçülüb.",
    advantages: [
      "121 OWASP CRS qaydası — sənaye standartı WAF əhatəsi",
      "PCRE2 JIT yüksək throughput; 280.373 EPS ölçülüb",
      "Schema/BOLA qatı API sui-istifadəsini tutur",
      "Real hücum recall 100% · FP 0,2% (1500 sətir corpus)",
    ],
    lg: "WAF + CRS tək məhsulda; ayrı ModSecurity modulu yox. Eyni 121 qaydada ModSec-dən 16,93× sürətli.",
    rivals:
      "ModSecurity + CRS ayrı modul — ilk sorğunu inline bloklayır amma log→ban zənciri yoxdur. Fail2ban WAF qiymətləndirməsi etmir.",
    proof: "CRS paritet 100% · recall 100% · FP 0,2%",
  },
  {
    what:
      "WAF uyğunluğundan sonra tenant siyasəti, ban həddi, FP trust skoru və operator təsdiqi tək qərar yolunda birləşir. Səhv ban riski ölçülü gate-lərlə məhdudlaşır.",
    advantages: [
      "Policy + tenant + FP trust tək pipeline — ayrı Fail2ban jail yox",
      "500 benign sətirdə 0,2% FP — ölçülü gate",
      "Multi-tenant etiketlər Prometheus və dashboard-a gedir",
      "IPC auth fail-closed; icazəsiz ban əmrləri rədd edilir",
    ],
    lg: "Log sətirindən ban qərarına ~20 ms median; policy, tenant və FP trust eyni code path-də.",
    rivals:
      "Fail2ban yalnız regex/jail ban atır; FP trust və tenant başqa sistemlərdə. CrowdSec mərkəzi qərar + paylanmış agent istəyir.",
    proof: "~20 ms median ban · 21 ölçüm (bench-ban-latency.json)",
  },
  {
    what:
      "Qərar anında ipset və istəyə görə XDP/eBPF ilə kernel səviyyəsində ban tətbiq edir. Userspace→kernel keçidi ölçülü ~20 ms median.",
    advantages: [
      "Kernel səviyyəli ban — iptables/nftables + ipset",
      "XDP paket drop opsional; laptop/VM-də --no-xdp + ipset kifayətdir",
      "Log sətirindən bana ~20 ms median (21 ölçüm)",
      "Paylanmış hücum: JA3 klaster + IP başına ban — 80 IP testdə 100%",
    ],
    lg: "Log → kernel ban tək zəncirdə ~20 ms. Fail2ban/CrowdSec saniyə–dəqiqə səviyyəsində qalır.",
    rivals:
      "Fail2ban ban gecikməsi saniyələr–dəqiqələr. CrowdSec siqnal şəbəkəsinə bağlıdır; kernel ban ayrı inteqrasiya. ModSecurity inline bloklayır amma davamlı ipset pipeline yoxdur.",
    proof: "72s soak · 864 nümunə · 0 xəta",
  },
  {
    what:
      "Hər addım tenant etiketli Prometheus metrikləri, Grafana panelləri və :8443 SOC timeline-a yazır. Operator Telegram alert və bir klik ack eyni paneldən idarə edir.",
    advantages: [
      "tenant_id etiketli loganalyzer_* metrikləri",
      "SOC timeline, attack map və /tests sübut matrisi eyni dashboard-da",
      "Self-hosted :8443 — məlumat üçüncü tərəf buluda getmir",
      "14 fayllıq PDF/JSON sübut paketi avtomatik sinxron",
    ],
    lg: "Metrik + dashboard + sübut tək məhsulda; CrowdSec SaaS konsolu və ya parçalı Grafana lazım deyil.",
    rivals:
      "Fail2ban metrik/export məhdud. CrowdSec managed SaaS və ya parçalı self-hosted. ModSecurity log verir amma SOC timeline və avtomatik sübut paketi yoxdur.",
    proof: "75 test · competitive-proof.json · dashboard /tests",
  },
];

export const STEPS_KK: PipelineStepDeep[] = [
  {
    what:
      "Сіз жазып жатқан nginx access log файлын нақты уақытта оқиды. Қос reverse proxy, sidecar немесе бұлт agent қажет емес — сервердегі log жолы бір тізбектің басы.",
    advantages: [
      "nginx-ті ауыстырмай жұмыс істейді; тек log форматын реттеу керек",
      "log_guardian форматы URI, method, XFF және body-ді бір schema-да береді",
      "Logтарды бұлтқа жібермейді — толық self-hosted",
      "Жol бойынша лезде өңдеу; орнату ~15 минут",
    ],
    lg: "Бір binary nginx log-ын оқиды — бөлек Fail2ban/CrowdSec agent жоқ.",
    rivals:
      "CrowdSec бөлек agent + орталық API керек. Fail2ban log оқиды бірақ WAF қабатына жетпейді — бөлшек архитектура.",
    proof: "75 автоматты тест · орнату gate PASS",
  },
  {
    what:
      "Әр log жолын URI, HTTP method, X-Forwarded-For, User-Agent және опционал body-мен бір normalize schema-ға айналдырады. WAF, ban және метрика қабаттары бір құрылымды paydalanады.",
    advantages: [
      "Бір schema — parser, WAF және ban pipeline арасында формат сәйкessizдігі жоқ",
      "XFF және proxy тізбектері дұрыс client IP үшін normalize",
      "Жоғары жол/сек throughput — benchmark-та өлшенген",
      "Strict mode орнату gate-терінде өрістерді ұстайды",
    ],
    lg: "Log → normalize → WAF бір process-те; ara format немесе ETL жоқ.",
    rivals:
      "ModSecurity nginx-те inline, бірақ log негізіндегі ban үшін бөлек Fail2ban керек. CrowdSec басқа parser + signal network.",
    proof: "280 373 EPS · 16,93× ModSec (bench-vs-modsec.json)",
  },
  {
    what:
      "121 OWASP CRS ережесі, PCRE2 JIT және OpenAPI/schema + BOLA арқылы шабуыл үлгілерін бағалайды. Сол corpusta ModSecurity-пен 100% parity өлшенген.",
    advantages: [
      "121 OWASP CRS ережесі — индустрия стандарты WAF",
      "PCRE2 JIT жоғары throughput; 280 373 EPS өлшенген",
      "Schema/BOLA қабаты API зиянды пайдалануын ұстайды",
      "Нағыз шабуыл recall 100% · FP 0,2% (1500 жол corpus)",
    ],
    lg: "WAF + CRS бір өнімде — бөлек ModSecurity модулі жоқ. Сол 121 ереже бойынша ModSec-ten 16,93× жылдам.",
    rivals:
      "ModSecurity + CRS бөлек nginx модулі — бірінші сұранысты inline блоктайды бірақ log→ban тізбегі жоқ. Fail2ban WAF бағалауын орындамайды.",
    proof: "CRS parity 100% · recall 100% · FP 0,2%",
  },
  {
    what:
      "WAF match-тен кейін tenant саясаты, ban порогы, FP trust score және operator ack бір decision path-те біріктіріледі. Қате ban тәуекелі өлшенген gate-термен шектелген.",
    advantages: [
      "Policy + tenant + FP trust бір pipeline-да — бөлек Fail2ban jail жоқ",
      "500 benign жолда 0,2% FP — өлшенген gate",
      "Multi-tenant label-дар Prometheus пен dashboard-қа ағады",
      "IPC auth fail-closed; рұқсатсыз ban командалары қабылданбайды",
    ],
    lg: "Log жолынан ban шешіміне ~20 ms median; policy, tenant және FP trust бір code path-те.",
    rivals:
      "Fail2ban тек regex/jail ban; FP trust және tenant басқа жүйелerde. CrowdSec орталық шешім + таратылған agent керек.",
    proof: "~20 ms median ban · 21 үлgi (bench-ban-latency.json)",
  },
  {
    what:
      "Шешім сәтінде ipset және опционал XDP/eBPF арқылы kernel деңгейінде ban қолданады. Userspace→kernel өтуі ~20 ms median өлшенген.",
    advantages: [
      "Kernel деңgей ban — iptables/nftables + ipset",
      "XDP packet drop опционал; laptop/VM-де --no-xdp + ipset жеткілікті",
      "Log жолынан ban-ға ~20 ms median (21 үлgi)",
      "Таратылған шабуыл: JA3 cluster + IP бойынша ban — 80 IP live test 100%",
    ],
    lg: "Log → kernel ban бір тізбекте ~20 ms. Fail2ban/CrowdSec секунд–минут деңгейінде.",
    rivals:
      "Fail2ban ban кідірісі секунд–минут. CrowdSec signal network-ке тәуелді; kernel ban бөлек интеграция. ModSecurity inline, persistent ipset pipeline жоқ.",
    proof: "72 сағ soak · 864 үлgi · 0 қате",
  },
  {
    what:
      "Әр қadam tenant белгісі бар Prometheus метрикалары, Grafana dashboard-тары және :8443 SOC timeline-ға жазады. Operator Telegram alert және бір басу ack бір panelден.",
    advantages: [
      "tenant_id белгісі бар loganalyzer_* метрикалары",
      "SOC timeline, attack map және /tests дәлел матрицасы бір dashboard-та",
      "Self-hosted :8443 — деректер үшінші тарап бұлтына gitmez",
      "14 файлдық PDF/JSON дәлел пакеті автоматты синхрон",
    ],
    lg: "Метрика + dashboard + дәлел бір өнімде — CrowdSec SaaS консолі немесе бөлшек Grafana қажет емес.",
    rivals:
      "Fail2ban метрика/export шектеулі. CrowdSec managed SaaS немесе бөлшек self-hosted. ModSecurity log береді бірақ SOC timeline және auto proof pack жоқ.",
    proof: "75 тест · competitive-proof.json · dashboard /tests",
  },
];

export const STEPS_BY_LOCALE: Partial<Record<Locale, PipelineStepDeep[]>> = {
  de: STEPS_DE,
  fr: STEPS_FR,
  es: STEPS_ES,
  ru: STEPS_RU,
  zh: STEPS_ZH,
  ja: STEPS_JA,
  ko: STEPS_KO,
  ar: STEPS_AR,
  az: STEPS_AZ,
  kk: STEPS_KK,
  ...STEPS_EXTRA_BY_LOCALE,
};
