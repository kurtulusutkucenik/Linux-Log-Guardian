/* Enter curtain + Trusted Types (i18n.js'den once) */
(function () {
  "use strict";

  if (window.trustedTypes && window.trustedTypes.createPolicy && !window.__lgTrustPolicy) {
    try {
      window.__lgTrustPolicy = window.trustedTypes.createPolicy("lgI18n", {
        createHTML: function (input) {
          return String(input);
        },
      });
    } catch (_) {
      try {
        window.__lgTrustPolicy = window.trustedTypes.getExistingPolicy("lgI18n");
      } catch (_2) {}
    }
  }

  if (document.body && document.body.classList.contains("page-home")) {
    document.body.classList.add("lg-atmosphere-live");
  }

  var ENTER_KEY = "lg_enter_rev6";
  var body = document.body;
  if (!body || !body.classList.contains("lg-booting")) return;
  var enter = document.getElementById("lg-motion-enter");
  var counter = document.getElementById("lg-motion-counter");
  var skipBtn = document.getElementById("lg-motion-enter-skip");
  var goBtn = document.getElementById("lg-motion-enter-go");
  var actions = document.getElementById("lg-motion-enter-actions");
  if (!enter || !counter) {
    body.classList.remove("lg-booting");
    body.classList.add("lg-ready", "lg-enter-done", "lg-atmosphere-live");
    if (body.classList.contains("page-home")) body.classList.add("lg-immersive");
    return;
  }

  var reduced = false;
  try {
    reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (_) {}

  var forceEnter = /[?&]enter=1(?:&|$)/.test(window.location.search || "");
  var seen = false;
  try {
    seen = !forceEnter && sessionStorage.getItem(ENTER_KEY) === "1";
  } catch (_) {}

  var isTests = body.classList.contains("page-tests");
  var duration = isTests ? 2800 : 5500;
  var hardMax = duration + 1400;
  var finishTimer = 0;

  function easeOut(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function setEnterGoReady() {
    if (actions) actions.classList.add("lg-motion-enter-ready");
    if (goBtn) {
      goBtn.disabled = false;
      goBtn.removeAttribute("aria-disabled");
    }
  }

  function finishEnter(instant) {
    if (window.__lgEnterBoot && window.__lgEnterBoot.done) return;
    if (!window.__lgEnterBoot) window.__lgEnterBoot = {};
    window.__lgEnterBoot.done = true;
    window.__lgEnterBoot.active = false;
    window.clearTimeout(finishTimer);
    counter.textContent = "100%";
    counter.classList.add("lg-motion-counter-done");
    enter.classList.add("lg-motion-enter-out");
    body.classList.remove("lg-booting");
    body.classList.add("lg-ready", "lg-enter-done", "lg-atmosphere-live");
    if (body.classList.contains("page-home")) {
      body.classList.add("lg-immersive");
    }
    try {
      sessionStorage.setItem(ENTER_KEY, "1");
    } catch (_) {}
    if (instant) {
      enter.setAttribute("aria-hidden", "true");
      document.dispatchEvent(new CustomEvent("lg-enter-complete"));
      return;
    }
    window.setTimeout(function () {
      enter.setAttribute("aria-hidden", "true");
      document.dispatchEvent(new CustomEvent("lg-enter-complete"));
    }, 1100);
  }

  if (seen) {
    finishEnter(true);
    return;
  }

  window.__lgEnterBoot = { active: true, done: false };

  function skip(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    finishEnter();
  }

  if (skipBtn) skipBtn.addEventListener("click", skip);
  if (goBtn) {
    goBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (!goBtn.disabled) finishEnter();
    });
  }
  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape") skip(e);
    if (e.key === "Enter" && goBtn && !goBtn.disabled) skip(e);
  });
  finishTimer = window.setTimeout(finishEnter, hardMax);

  if (reduced) {
    finishEnter(true);
    return;
  }

  var start = performance.now();
  var done = false;
  var goReady = false;
  function tick(now) {
    if (done) return;
    var p = Math.min(1, (now - start) / duration);
    counter.textContent = Math.round(easeOut(p) * 100) + "%";
    if (p >= 0.72 && !goReady) {
      goReady = true;
      setEnterGoReady();
    }
    if (p < 1) requestAnimationFrame(tick);
    else {
      done = true;
      setEnterGoReady();
      window.setTimeout(finishEnter, 520);
    }
  }
  requestAnimationFrame(tick);
  window.setInterval(function () {
    if (done) return;
    var p = Math.min(1, (performance.now() - start) / duration);
    counter.textContent = Math.round(easeOut(p) * 100) + "%";
    if (p >= 0.72 && !goReady) {
      goReady = true;
      setEnterGoReady();
    }
    if (p >= 1) {
      done = true;
      setEnterGoReady();
      window.setTimeout(finishEnter, 520);
    }
  }, 80);
})();
