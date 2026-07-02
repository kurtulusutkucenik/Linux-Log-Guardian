/* nudot tarzı WebGL sonsuz grid + parallax — CSP uyumlu, harici bağımlılık yok */
(function () {
  "use strict";
  var canvas = document.getElementById("lg-scene-canvas");
  if (!canvas) return;

  var reduced = false;
  try {
    reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (_) {}

  var gl = null;
  try {
    gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false });
  } catch (_) {}

  if (!gl || reduced) {
    canvas.classList.add("lg-scene-fallback");
    return;
  }

  var vertSrc =
    "attribute vec2 aPos;void main(){gl_Position=vec4(aPos,0.,1.);}";
  var fragSrc = [
    "precision highp float;",
    "uniform vec2 uRes;",
    "uniform float uTime;",
    "uniform vec2 uMouse;",
    "void main(){",
    "vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;",
    "uv.x+=uMouse.x*.22;",
    "float z=1./(uv.y+.62);",
    "float x=uv.x*z;",
    "vec2 g=abs(fract(vec2(x*1.15,z-uTime*.35))-.5);",
    "float line=1.-smoothstep(0.,.035,min(g.x,g.y));",
    "float fade=smoothstep(-.05,.45,uv.y);",
    "float glow=line*fade*min(z*.09,1.);",
    "vec3 bg=vec3(.027,.027,.035);",
    "vec3 r=vec3(.88,.11,.14);",
    "vec3 c=vec3(.0,.9,1.);",
    "vec3 col=bg;",
    "col+=r*glow;",
    "col+=c*glow*.35*(.6+.4*sin(z*.4+uTime));",
    "float vig=1.-length(uv*vec2(.55,1.))*.35;",
    "col*=vig;",
    "gl_FragColor=vec4(col,1.);",
    "}",
  ].join("");

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
    return s;
  }

  var vs = compile(gl.VERTEX_SHADER, vertSrc);
  var fs = compile(gl.FRAGMENT_SHADER, fragSrc);
  if (!vs || !fs) {
    canvas.classList.add("lg-scene-fallback");
    return;
  }

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    canvas.classList.add("lg-scene-fallback");
    return;
  }

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var aPos = gl.getAttribLocation(prog, "aPos");
  var uRes = gl.getUniformLocation(prog, "uRes");
  var uTime = gl.getUniformLocation(prog, "uTime");
  var uMouse = gl.getUniformLocation(prog, "uMouse");

  var mx = 0;
  var my = 0;
  var tmx = 0;
  var tmy = 0;
  window.addEventListener(
    "pointermove",
    function (e) {
      tmx = (e.clientX / window.innerWidth - 0.5) * 2;
      tmy = (e.clientY / window.innerHeight - 0.5) * 2;
    },
    { passive: true }
  );

  var w = 0;
  var h = 0;
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.floor(window.innerWidth * dpr);
    h = Math.floor(window.innerHeight * dpr);
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
  }
  resize();
  window.addEventListener("resize", resize);

  var scrollY = 0;
  window.addEventListener("scroll", function () {
    scrollY = window.scrollY;
  }, { passive: true });

  var t0 = performance.now();
  function frame(now) {
    mx += (tmx - mx) * 0.06;
    my += (tmy - my) * 0.06;
    var t = (now - t0) * 0.001 + scrollY * 0.0004;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(uRes, w, h);
    gl.uniform1f(uTime, t);
    gl.uniform2f(uMouse, mx, my + scrollY * 0.0008);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
