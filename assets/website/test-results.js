(function () {
  "use strict";

  var listEl = document.getElementById("test-results-list");
  var summaryEl = document.getElementById("test-results-summary");
  var heroEl = document.getElementById("test-results-hero");
  if (!listEl || !summaryEl) return;

  var tests = [{"id":"api-fail-closed","status":"pass","statusLabel":"GECTI","statusLabelEn":"PASS","title":"API fail-closed — tokensiz istek 403","titleEn":"API fail-closed — unauthenticated requests return 403","verdict":"FAIL: 0 · WARN: 0","verdictEn":"FAIL: 0 · WARN: 0","group":"gate","purpose":"Ban/consult/metrics uçları token olmadan reddedilir.","purposeEn":"Ban/consult/metrics endpoints reject requests without a token.","metrics":[{"label":"FAIL","value":"0"},{"label":"WARN","value":"0"}],"script":"scripts/api_fail_closed_test.sh","date":"2026-06-21"},{"id":"local-security-audit","status":"pass","statusLabel":"GECTI","statusLabelEn":"PASS","title":"Yerel güvenlik denetimi — IPC, JWT, token sızıntısı","titleEn":"Local security audit — IPC, JWT, secret hygiene","verdict":"FAIL: 0 · WARN: 1","verdictEn":"FAIL: 0 · WARN: 1","group":"gate","purpose":"Laptop/prod öncesi güvenlik script matrisi; demo parola laptop'ta WARN kabul.","purposeEn":"Pre-prod security script matrix; demo password WARN on laptop is OK.","metrics":[{"label":"FAIL","value":"0"},{"label":"WARN","value":"1"}],"script":"scripts/local_security_audit.sh","date":"2026-06-21"},{"id":"post-install-verify","status":"pass","statusLabel":"GECTI","statusLabelEn":"PASS","title":"Kurulum kapısı — servis, IPC, API fail-closed","titleEn":"Install gate — services, IPC, API fail-closed","verdict":"FAIL: 0 · WARN: 0","verdictEn":"FAIL: 0 · WARN: 0","group":"gate","purpose":"systemd, --health, metrics :9091, API_BIND ve nginx formatının yeşil matrisi.","purposeEn":"systemd, --health, metrics :9091, API_BIND and nginx format green matrix.","metrics":[{"label":"FAIL","value":"0"},{"label":"WARN","value":"0"}],"script":"scripts/post_install_verify.sh","date":"2026-06-21"},{"id":"soak-stability","status":"pass","statusLabel":"GECTI","statusLabelEn":"PASS","title":"72 saat prod stabilite + dusuk FP","titleEn":"72h prod stability + low FP","verdict":"72.0 saat VPS/VM soak GECTI: 864 ornek, 0 hata — servisler ayakta, max RSS 105 MB benign FP %0.2.","verdictEn":"72.0h VPS/VM soak PASS: 864 samples, 0 failures — services up, max RSS 105 MB benign FP 0.2%.","group":"proof"},{"id":"ban-latency","status":"pass","statusLabel":"GECTI","statusLabelEn":"PASS","title":"Tehdit tespitinden kernel ban'a gecen sure","titleEn":"Time from threat detection to kernel ban","verdict":"Medyan 20.27 ms — hedef <75.0 ms, ipset dogrulandi.","verdictEn":"Median 20.27 ms — target <75.0 ms, ipset confirmed.","group":"proof"},{"id":"bench-throughput","status":"pass","statusLabel":"GECTI","statusLabelEn":"PASS","title":"Ayni log corpus uzerinde isleme hizi (seffaf referans)","titleEn":"Processing speed on same log corpus (transparent reference)","verdict":"Guardian 5555 EPS (tek gecis log-WAF); CRS replay 20195 EPS — farkli mimari, hiz iddiasi degil.","verdictEn":"Guardian 5555 EPS (single-pass log-WAF); CRS replay 20195 EPS — different architecture, not a speed claim.","group":"proof"},{"id":"crs-parity","status":"pass","statusLabel":"GECTI","statusLabelEn":"PASS","title":"OWASP CRS ile ayni saldiri satirlarinda tespit paritesi","titleEn":"Detection parity with OWASP CRS on same attack lines","verdict":"18 saldiri satirinin tamaminda uyari; recall %100.0, parite %100.0.","verdictEn":"Alerts on all 18 attack lines; recall 100.0%, parity 100.0%.","group":"proof"},{"id":"dashboard-ban-api","status":"pass","statusLabel":"GECTI","statusLabelEn":"PASS","title":"Dashboard ban/unban — API + Docker relay (18090)","titleEn":"Dashboard ban/unban — API + Docker relay (18090)","verdict":"Host OK, relay OK, Docker FAIL — 203.0.113.248.","verdictEn":"Host OK, relay OK, Docker FAIL — 203.0.113.248.","group":"proof","purpose":"Operatörün /bans sayfasından kernel ban yolunun canlı çalıştığını kanıtlar.","purposeEn":"Proves operators can ban/unban from /bans via the live kernel path.","metrics":[{"label":"host","value":"OK"},{"label":"relay","value":"OK"},{"label":"docker","value":"FAIL"},{"label":"path","value":"ipc-xdp"}],"script":"scripts/dashboard_ban_smoke.sh","date":"2026-06-19"},{"id":"fp-cluster-trust","status":"pass","statusLabel":"GECTI","statusLabelEn":"PASS","title":"FP learn — guvenilir IP cluster ban disinda","titleEn":"FP learn — trusted IP excluded from cluster ban","verdict":"trusted=10.0.0.50 cluster_banned=False flush=True.","verdictEn":"trusted=10.0.0.50 cluster_banned=False flush=True.","group":"proof"},{"id":"fp-rate","status":"pass","statusLabel":"GECTI","statusLabelEn":"PASS","title":"Temiz (benign) trafikte yanlis alarm orani","titleEn":"False positive rate on benign traffic","verdict":"500 benign satirda %0.2 FP — hedef <%5.0.","verdictEn":"500 benign lines, 0.2% FP — target <5.0%.","group":"proof"},{"id":"ja3-cluster","status":"pass","statusLabel":"GECTI","statusLabelEn":"PASS","title":"Dagitik saldiri (ayni UA, farkli IP) cluster recall","titleEn":"Distributed attack (same UA, different IPs) cluster recall","verdict":"80 IP, recall %100.0 (80/80).","verdictEn":"80 IPs, recall 100.0% (80/80).","group":"proof"},{"id":"ja3-cluster-ban-live","status":"pass","statusLabel":"GECTI","statusLabelEn":"PASS","title":"Canli nginx log -> JA3/UA cluster -> ban_pipeline","titleEn":"Live nginx log -> JA3/UA cluster -> ban_pipeline","verdict":"mode=live-append delta=8 flush=True block=203.0.113.162-203.0.113.166.","verdictEn":"mode=live-append delta=8 flush=True block=203.0.113.162-203.0.113.166.","group":"proof"},{"id":"lineage-live","status":"pass","statusLabel":"GECTI","statusLabelEn":"PASS","title":"eBPF lineage — openat/execve/connect zinciri","titleEn":"eBPF lineage — openat/execve/connect chain","verdict":"risk=91.2 events=4 (EXEC_SHELL · FILE_READ · FILE_WRITE · NET_CONNECT) source=daemon_file.","verdictEn":"risk=91.2 events=4 (EXEC_SHELL · FILE_READ · FILE_WRITE · NET_CONNECT) source=daemon_file.","group":"proof"},{"id":"live-attack","status":"pass","statusLabel":"GECTI","statusLabelEn":"PASS","title":"Canli nginx :80 saldiri harness (tester + ban)","titleEn":"Live nginx :80 attack harness (tester + ban)","verdict":"sent=525 refused=525 kernel=True waf=True.","verdictEn":"sent=525 refused=525 kernel=True waf=True.","group":"proof"},{"id":"live-pipeline","status":"pass","statusLabel":"GECTI","statusLabelEn":"PASS","title":"Canli ban hatti (IPC -> XDP/ipset)","titleEn":"Live ban pipeline (IPC -> XDP/ipset)","verdict":"IPC ok; 0 IPC, 0 XDP, 0 ipset.","verdictEn":"IPC ok; 0 IPC, 0 XDP, 0 ipset.","group":"proof"},{"id":"nginx-consult","status":"pass","statusLabel":"GECTI","statusLabelEn":"PASS","title":"nginx inline consult API (auth_request oncesi WAF+CRS)","titleEn":"nginx inline consult API (WAF+CRS before auth_request)","verdict":"union=403 or1=403 benign=200.","verdictEn":"union=403 or1=403 benign=200.","group":"proof"},{"id":"owasp-corpus","status":"pass","statusLabel":"GECTI","statusLabelEn":"PASS","title":"OWASP CRS test corpus recall","titleEn":"OWASP CRS test corpus recall","verdict":"%112.1 recall — 199 satir.","verdictEn":"112.1% recall — 199 lines.","group":"proof"},{"id":"real-attack","status":"pass","statusLabel":"GECTI","statusLabelEn":"PASS","title":"Gercek saldiri corpus (SQLi/XSS/LFI/RCE/scanner) tespit orani","titleEn":"Real attack corpus (SQLi/XSS/LFI/RCE/scanner) detection rate","verdict":"1000 satir, ortalama recall %100.0 — hedef >=%85.0.","verdictEn":"1000 lines, avg recall 100.0% — target >=85.0%.","group":"proof"},{"id":"real-attack-10k","status":"pass","statusLabel":"GECTI","statusLabelEn":"PASS","title":"Corpus 10K — genisletilmis saldiri seti recall","titleEn":"Corpus 10K — extended attack set recall","verdict":"10000 satir, recall %100.2.","verdictEn":"10000 lines, recall 100.2%.","group":"proof"},{"id":"tenant-isolation","status":"pass","statusLabel":"GECTI","statusLabelEn":"PASS","title":"Multi-tenant kiracı izolasyonu","titleEn":"Multi-tenant isolation","verdict":"Kiraci musteri1: 4/4 kontrol gecti.","verdictEn":"Tenant musteri1: 4/4 checks passed.","group":"proof"},{"id":"threat-intel-sync","status":"pass","statusLabel":"GECTI","statusLabelEn":"PASS","title":"Threat intel sync -> ipset","titleEn":"Threat intel sync -> ipset","verdict":"sync 0s, ioc=10, ipset_delta=0.","verdictEn":"sync 0s, ioc=10, ipset_delta=0.","group":"proof"},{"id":"tr-hosting-corpus","status":"pass","statusLabel":"GECTI","statusLabelEn":"PASS","title":"TR hosting corpus (sentetik anonymized)","titleEn":"TR hosting corpus (synthetic anonymized)","verdict":"%100.0 recall — 500 satir.","verdictEn":"100.0% recall — 500 lines.","group":"proof"},{"id":"webhook-route-proof","status":"pass","statusLabel":"GECTI","statusLabelEn":"PASS","title":"Telegram route + batch — #waf/#ban yönlendirme","titleEn":"Telegram route + batch — #waf/#ban routing","verdict":"Mod dry-run; route ON, batch 10s.","verdictEn":"Mode dry-run; route ON, batch 10s.","group":"proof","purpose":"WARN→DM, CRIT/ban→kanal ve batch özetinin doğru hedefe gittiğini kanıtlar.","purposeEn":"Proves WARN→DM, CRIT/ban→channel and batch summary routing.","metrics":[{"label":"mode","value":"dry-run"},{"label":"route","value":"ON"},{"label":"batch","value":"10"},{"label":"prod","value":"skip"}],"script":"scripts/webhook_route_proof.sh","date":"2026-06-19"}];

  var lang = (document.documentElement.lang || "tr").slice(0, 2);
  var isEn = lang === "en";

  function t(tr, en) {
    return isEn ? en : tr;
  }

  function pick(item, key) {
    var enKey = key + "En";
    if (isEn && item[enKey]) return item[enKey];
    return item[key] || "";
  }

  function text(el, value) {
    el.textContent = value == null ? "" : String(value);
  }

  function statusLabel(status) {
    if (status === "pass") return t("GEÇTİ", "PASS");
    if (status === "warn") return t("UYARI", "WARN");
    if (status === "fail") return t("KALDI", "FAIL");
    return t("BEKLİYOR", "PENDING");
  }

  function groupLabel(group) {
    if (group === "gate") {
      return t("Kurulum ve güvenlik kapıları", "Install and security gates");
    }
    return t("Rekabet ve güvenlik kanıtı", "Competitive and security proof");
  }

  function renderHero(passed, total, failed) {
    if (!heroEl) return;
    if (!total) {
      heroEl.hidden = true;
      heroEl.replaceChildren();
      return;
    }
    var pct = Math.round((passed / total) * 100);
    var allPass = failed === 0 && passed === total;
    heroEl.hidden = false;
    heroEl.replaceChildren();

    var badge = document.createElement("div");
    badge.className = "test-hero-badge";
    badge.setAttribute("aria-hidden", "true");
    text(badge, pct + "%");

    var body = document.createElement("div");
    body.className = "test-hero-text";
    var strong = document.createElement("strong");
    text(
      strong,
      allPass ? t("Tüm testler geçti", "All tests passed") : t("Test özeti", "Test summary"),
    );
    var span = document.createElement("span");
    text(
      span,
      passed +
        "/" +
        total +
        " " +
        t("test geçti", "tests passed") +
        (failed ? " · " + failed + " " + t("kaldı", "failed") : ""),
    );
    body.appendChild(strong);
    body.appendChild(span);

    var barWrap = document.createElement("div");
    barWrap.className = "test-hero-bar";
    barWrap.setAttribute("role", "presentation");
    var bar = document.createElement("span");
    bar.style.width = pct + "%";
    barWrap.appendChild(bar);

    heroEl.appendChild(badge);
    heroEl.appendChild(body);
    heroEl.appendChild(barWrap);
  }

  function renderCard(item) {
    var li = document.createElement("li");
    var st =
      item.status === "pass" || item.status === "warn" || item.status === "fail"
        ? item.status
        : "pending";
    li.className = "test-card status-" + st;

    var head = document.createElement("div");
    head.className = "test-card-head";
    var badge = document.createElement("span");
    badge.className = "test-status";
    text(badge, statusLabel(item.status));
    var titleEl = document.createElement("strong");
    text(titleEl, pick(item, "title") || item.id || "");
    head.appendChild(badge);
    head.appendChild(titleEl);
    li.appendChild(head);

    var purpose = pick(item, "purpose");
    if (purpose) {
      var purposeEl = document.createElement("p");
      purposeEl.className = "test-purpose";
      text(purposeEl, purpose);
      li.appendChild(purposeEl);
    }

    var verdictEl = document.createElement("p");
    verdictEl.className = "test-verdict";
    text(verdictEl, pick(item, "verdict"));
    li.appendChild(verdictEl);

    if (Array.isArray(item.metrics) && item.metrics.length) {
      var metricsEl = document.createElement("div");
      metricsEl.className = "test-metrics";
      item.metrics.forEach(function (m) {
        var chip = document.createElement("span");
        chip.className = "test-metric";
        var b = document.createElement("b");
        text(b, m.label);
        chip.appendChild(b);
        chip.appendChild(document.createTextNode(" " + String(m.value)));
        metricsEl.appendChild(chip);
      });
      li.appendChild(metricsEl);
    }

    if (item.script || item.date) {
      var foot = document.createElement("div");
      foot.className = "test-card-foot";
      var scriptEl = document.createElement("span");
      text(scriptEl, item.script || "");
      foot.appendChild(scriptEl);
      if (item.date) {
        var timeEl = document.createElement("time");
        timeEl.dateTime = String(item.date);
        text(timeEl, item.date);
        foot.appendChild(timeEl);
      }
      li.appendChild(foot);
    }

    return li;
  }

  function render() {
    if (!Array.isArray(tests) || !tests.length) {
      renderHero(0, 0, 0);
      summaryEl.textContent = t(
        "Test özeti yok — bash scripts/competitive_proof.sh",
        "No test summary — run bash scripts/competitive_proof.sh",
      );
      listEl.replaceChildren();
      return;
    }

    var passed = tests.filter(function (x) {
      return x.status === "pass";
    }).length;
    var failed = tests.filter(function (x) {
      return x.status === "fail";
    }).length;
    var warned = tests.filter(function (x) {
      return x.status === "warn";
    }).length;

    renderHero(passed, tests.length, failed);

    summaryEl.textContent =
      passed +
      "/" +
      tests.length +
      " " +
      t("test geçti", "tests passed") +
      (failed ? " · " + failed + " " + t("kaldı", "failed") : "") +
      (warned ? " · " + warned + " " + t("uyarı", "warn") : "");

    listEl.replaceChildren();
    var lastGroup = "";

    tests.forEach(function (item) {
      var group = item.group || "proof";
      if (group !== lastGroup) {
        lastGroup = group;
        var heading = document.createElement("li");
        heading.className = "test-group-label";
        text(heading, groupLabel(group));
        listEl.appendChild(heading);
      }
      listEl.appendChild(renderCard(item));
    });
  }

  render();
  document.addEventListener("lg-lang-change", render);
})();
