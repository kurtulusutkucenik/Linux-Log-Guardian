/* Linux Log Guardian — premium görsel motor v2.1
 * Renkli mouse-reaktif mesh-gradient arka plan + dönen 3D ikosahedron + parçacık alanı
 * + cursor takip çizgisi + preloader + magnetik butonlar + Iron-Man montaj revealları.
 * CSP/Trusted Types güvenli: yalnızca canvas, textContent, classList, CSSOM. innerHTML/eval yok.
 * Dayanıklılık: preloader EN ÖNCE çalışır, her efekt try/catch ile izole — biri patlasa bile giriş perdesi kalkar.
 */
(function () {
  "use strict";

  var reduce = false;
  try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (_) {}

  var DPR = Math.min(window.devicePixelRatio || 1, 1.75);
  var vw = window.innerWidth, vh = window.innerHeight;
  var mouse = { x: vw * 0.5, y: vh * 0.5, tx: vw * 0.5, ty: vh * 0.5 };

  window.addEventListener("pointermove", function (e) {
    mouse.tx = e.clientX; mouse.ty = e.clientY;
  }, { passive: true });
  window.addEventListener("resize", function () {
    vw = window.innerWidth; vh = window.innerHeight;
    DPR = Math.min(window.devicePixelRatio || 1, 1.75);
  }, { passive: true });

  function fit(canvas) {
    var ctx = canvas.getContext("2d");
    function size() {
      canvas.width = Math.floor(window.innerWidth * DPR);
      canvas.height = Math.floor(window.innerHeight * DPR);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    size();
    window.addEventListener("resize", size, { passive: true });
    return ctx;
  }

  function lerp(a, b, t) { return a + (b - a) * t; }
  function fin(n) { return isFinite(n) ? n : 0; }

  /* =================== Preloader (EN ÖNCE) =================== */
  function initPreloader() {
    var enter = document.getElementById("lg-enter");
    if (!enter) return;
    var countEl = enter.querySelector("[data-lg-pct]");
    var bar = enter.querySelector(".lg-enter-bar");
    var pct = 0, done = false;
    function finish() {
      if (done) return;
      done = true;
      enter.classList.add("lg-enter-out");
      setTimeout(function () { if (enter.parentNode) enter.parentNode.removeChild(enter); }, 1100);
    }
    if (reduce) { finish(); return; }
    var start = Date.now();
    (function tick() {
      var target = Math.min(100, Math.floor(((Date.now() - start) / 1600) * 100));
      pct += (target - pct) * 0.2;
      var shown = Math.min(100, Math.round(pct));
      if (countEl) countEl.textContent = shown + "%";
      if (bar) bar.style.transform = "scaleX(" + (shown / 100) + ")";
      if (shown >= 100) { finish(); return; }
      requestAnimationFrame(tick);
    })();
    setTimeout(finish, 3400);
  }

  /* =================== Katman 1: renkli mesh-gradient =================== */
  function startBackdrop() {
    var c = document.getElementById("lg-bg-cells");
    if (!c) return;
    var ctx = fit(c);
    var time = 0;
    var blobs = [
      { col: "20, 30, 90",   ox: 0.22, oy: 0.28, r: 0.62, sx: 0.00018, sy: 0.00013, a: 0.9 },
      { col: "120, 20, 60",  ox: 0.80, oy: 0.22, r: 0.55, sx: 0.00021, sy: 0.00017, a: 0.85 },
      { col: "200, 60, 30",  ox: 0.72, oy: 0.82, r: 0.50, sx: 0.00015, sy: 0.00022, a: 0.7 },
      { col: "30, 90, 120",  ox: 0.20, oy: 0.78, r: 0.58, sx: 0.00019, sy: 0.00012, a: 0.75 },
      { col: "90, 40, 130",  ox: 0.50, oy: 0.50, r: 0.45, sx: 0.00024, sy: 0.00016, a: 0.65 }
    ];
    function draw() {
      var w = window.innerWidth, h = window.innerHeight;
      time += 16;
      var nmx = (mouse.x / w) - 0.5;
      var nmy = (mouse.y / h) - 0.5;
      var base = ctx.createLinearGradient(0, 0, 0, h);
      base.addColorStop(0, "#0a0e22");
      base.addColorStop(0.5, "#120a26");
      base.addColorStop(1, "#08060f");
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (var i = 0; i < blobs.length; i++) {
        var b = blobs[i];
        var bx = fin((b.ox + Math.sin(time * b.sx + i) * 0.07 + nmx * (0.06 + i * 0.015)) * w);
        var by = fin((b.oy + Math.cos(time * b.sy + i) * 0.07 + nmy * (0.06 + i * 0.015)) * h);
        var rad = Math.max(1, b.r * Math.max(w, h));
        var g = ctx.createRadialGradient(bx, by, 0, bx, by, rad);
        g.addColorStop(0, "rgba(" + b.col + "," + (0.32 * b.a).toFixed(3) + ")");
        g.addColorStop(0.5, "rgba(" + b.col + "," + (0.10 * b.a).toFixed(3) + ")");
        g.addColorStop(1, "rgba(" + b.col + ",0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
      ctx.globalCompositeOperation = "source-over";
      var vig = ctx.createRadialGradient(w * 0.5, h * 0.45, Math.min(w, h) * 0.3, w * 0.5, h * 0.5, Math.max(w, h) * 0.8);
      vig.addColorStop(0, "rgba(8, 6, 16, 0)");
      vig.addColorStop(1, "rgba(6, 5, 14, 0.55)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);
    }
    if (reduce) { draw(); return; }
    (function loop() { draw(); requestAnimationFrame(loop); })();
  }

  /* =================== Katman 2: 3D ikosahedron + parçacıklar =================== */
  function startScene() {
    var c = document.getElementById("lg-bg-lattice");
    if (!c) return;
    var ctx = fit(c);
    var T = (1 + Math.sqrt(5)) / 2;
    var V = [
      [-1, T, 0], [1, T, 0], [-1, -T, 0], [1, -T, 0],
      [0, -1, T], [0, 1, T], [0, -1, -T], [0, 1, -T],
      [T, 0, -1], [T, 0, 1], [-T, 0, -1], [-T, 0, 1]
    ];
    var E = [
      [0, 1], [0, 5], [0, 7], [0, 10], [0, 11], [1, 5], [1, 7], [1, 8], [1, 9],
      [2, 3], [2, 4], [2, 6], [2, 10], [2, 11], [3, 4], [3, 6], [3, 8], [3, 9],
      [4, 5], [4, 9], [4, 11], [5, 9], [5, 11], [6, 7], [6, 8], [6, 10],
      [7, 8], [7, 10], [8, 9], [10, 11]
    ];
    var N = Math.max(50, Math.min(110, Math.floor(window.innerWidth / 14)));
    var SPREAD = 1300, FOCAL = 760;
    var pts = [];
    for (var i = 0; i < N; i++) {
      pts.push({ x: (Math.random() - 0.5) * SPREAD, y: (Math.random() - 0.5) * SPREAD, z: (Math.random() - 0.5) * SPREAD });
    }
    var rx = 0, ry = 0, spin = 0;
    function rotate(p, cx, sx, cy, sy) {
      var x1 = p[0] * cy - p[2] * sy;
      var z1 = p[0] * sy + p[2] * cy;
      var y1 = p[1] * cx - z1 * sx;
      var z2 = p[1] * sx + z1 * cx;
      return [x1, y1, z2];
    }
    function draw() {
      var w = window.innerWidth, h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      var nmx = (mouse.x / w) - 0.5;
      var nmy = (mouse.y / h) - 0.5;
      rx = lerp(rx, nmy * 0.8, 0.06);
      ry = lerp(ry, nmx * 1.0, 0.06);
      spin += 0.0022;
      var cx = Math.cos(rx), sx = Math.sin(rx);
      var cy = Math.cos(ry + spin), sy = Math.sin(ry + spin);
      var ox = w * 0.5, oy = h * 0.46;

      var pr = [];
      for (var k = 0; k < N; k++) {
        var p = pts[k];
        var r = rotate([p.x, p.y, p.z], cx, sx, cy, sy);
        var d = FOCAL / (FOCAL + r[2] + SPREAD * 0.5 + 200);
        pr.push({ x: fin(ox + r[0] * d), y: fin(oy + r[1] * d), d: d });
      }
      for (var a = 0; a < N; a++) {
        var pa = pr[a];
        for (var b = a + 1; b < N; b++) {
          var pb = pr[b];
          var dx = pa.x - pb.x, dy = pa.y - pb.y;
          var dd = dx * dx + dy * dy;
          if (dd < 13000) {
            ctx.strokeStyle = "rgba(150, 170, 255," + ((1 - dd / 13000) * 0.18 * Math.min(pa.d, pb.d)).toFixed(3) + ")";
            ctx.lineWidth = 0.6;
            ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
          }
        }
      }
      for (var n = 0; n < N; n++) {
        var pp = pr[n];
        ctx.beginPath();
        ctx.arc(pp.x, pp.y, Math.max(0.4, pp.d * 1.8), 0, Math.PI * 2);
        ctx.fillStyle = "rgba(200, 210, 255," + (pp.d * 0.4).toFixed(3) + ")";
        ctx.fill();
      }

      var scale = Math.min(w, h) * 0.30;
      var proj = [];
      for (var v = 0; v < V.length; v++) {
        var rr = rotate(V[v], cx, sx, cy, sy);
        var dz = FOCAL / (FOCAL + rr[2] * scale * 0.04 + 300);
        proj.push({ x: fin(ox + rr[0] * scale * dz), y: fin(oy + rr[1] * scale * dz), d: dz });
      }
      for (var e = 0; e < E.length; e++) {
        var v1 = proj[E[e][0]], v2 = proj[E[e][1]];
        var depth = (v1.d + v2.d) * 0.5;
        var grad = ctx.createLinearGradient(v1.x, v1.y, v2.x, v2.y);
        grad.addColorStop(0, "rgba(225, 29, 36," + (depth * 0.85).toFixed(3) + ")");
        grad.addColorStop(0.5, "rgba(255, 184, 0," + (depth * 0.7).toFixed(3) + ")");
        grad.addColorStop(1, "rgba(54, 214, 255," + (depth * 0.85).toFixed(3) + ")");
        ctx.strokeStyle = grad;
        ctx.lineWidth = depth * 1.6;
        ctx.beginPath(); ctx.moveTo(v1.x, v1.y); ctx.lineTo(v2.x, v2.y); ctx.stroke();
      }
      ctx.shadowBlur = 14; ctx.shadowColor = "rgba(225, 29, 36, 0.8)";
      for (var vv = 0; vv < proj.length; vv++) {
        var pv = proj[vv];
        ctx.beginPath();
        ctx.arc(pv.x, pv.y, pv.d * 3.2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255," + (pv.d * 0.9).toFixed(3) + ")";
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }
    if (reduce) { draw(); return; }
    var running = true;
    document.addEventListener("visibilitychange", function () { running = !document.hidden; if (running) loop(); });
    (function loop() {
      if (!running) return;
      mouse.x = lerp(mouse.x, mouse.tx, 0.08);
      mouse.y = lerp(mouse.y, mouse.ty, 0.08);
      draw();
      requestAnimationFrame(loop);
    })();
  }

  /* =================== Cursor takip çizgisi =================== */
  function startCursor() {
    var c = document.getElementById("lg-cursor");
    if (!c || reduce) return;
    var ctx = fit(c);
    var trail = [], MAX = 20, hovering = false;
    window.addEventListener("pointermove", function (e) {
      trail.push({ x: e.clientX, y: e.clientY });
      if (trail.length > MAX) trail.shift();
    }, { passive: true });
    document.addEventListener("pointerover", function (e) {
      var t = e.target;
      hovering = !!(t && t.closest && t.closest("a, button, .btn, .lg-magnetic, .test-card, .lg-stat, .lg-why-card"));
    }, { passive: true });
    (function loop() {
      var w = window.innerWidth, h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      for (var i = 1; i < trail.length; i++) {
        var p0 = trail[i - 1], p1 = trail[i], t = i / trail.length;
        ctx.strokeStyle = "rgba(255, 184, 0," + (t * 0.85).toFixed(3) + ")";
        ctx.lineWidth = t * 2.4; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
      }
      var last = trail[trail.length - 1];
      if (last) {
        var rad = hovering ? 13 : 5;
        ctx.beginPath(); ctx.arc(last.x, last.y, rad, 0, Math.PI * 2);
        ctx.strokeStyle = hovering ? "rgba(54, 214, 255, 0.95)" : "rgba(225, 29, 36, 0.95)";
        ctx.lineWidth = 1.5; ctx.stroke();
        ctx.beginPath(); ctx.arc(last.x, last.y, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.95)"; ctx.fill();
      }
      requestAnimationFrame(loop);
    })();
  }

  /* =================== Magnetik butonlar =================== */
  function initMagnetic() {
    if (reduce) return;
    var els = document.querySelectorAll(".lg-magnetic");
    for (var i = 0; i < els.length; i++) {
      (function (el) {
        el.addEventListener("pointermove", function (e) {
          var r = el.getBoundingClientRect();
          var x = e.clientX - r.left - r.width / 2;
          var y = e.clientY - r.top - r.height / 2;
          el.style.transform = "translate(" + (x * 0.28).toFixed(1) + "px," + (y * 0.4).toFixed(1) + "px)";
        }, { passive: true });
        el.addEventListener("pointerleave", function () { el.style.transform = ""; }, { passive: true });
      })(els[i]);
    }
  }

  /* =================== Iron-Man montaj reveal =================== */
  function initAssembly() {
    if (reduce || typeof IntersectionObserver === "undefined") return;
    var groups = document.querySelectorAll("[data-assemble]");
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var kids = en.target.children;
        for (var i = 0; i < kids.length; i++) {
          (function (k, idx) {
            setTimeout(function () { k.classList.add("lg-assembled"); }, idx * 90);
          })(kids[i], i);
        }
        obs.unobserve(en.target);
      });
    }, { threshold: 0.2 });
    for (var g = 0; g < groups.length; g++) obs.observe(groups[g]);
  }

  /* =================== Çalıştırıcı — preloader önce, her parça izole =================== */
  function safe(fn) {
    try { fn(); } catch (e) { if (window.console && console.error) console.error("lg-fx:", e); }
  }
  function run() {
    safe(initPreloader);
    safe(startBackdrop);
    safe(startScene);
    safe(startCursor);
    safe(initMagnetic);
    safe(initAssembly);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
