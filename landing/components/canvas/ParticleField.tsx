"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { dynamicRef } from "@/hooks/useDynamicContext";

const COUNT = 1600;
const SPREAD = 1300;

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;       // normalized device coords -1..1
  uniform float uVelocity;   // scroll velocity (hyperspace warp)
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uAudio;      // overall audio energy 0..1
  uniform float uBass;       // low-band energy 0..1
  attribute float aRandom;
  varying float vGlow;
  varying float vAudio;

  void main() {
    vec3 p = position;
    // organic drift, amplified by the music
    float amp = 14.0 + uAudio * 26.0;
    p.x += sin(uTime * 0.18 + aRandom * 6.2831) * amp;
    p.y += cos(uTime * 0.15 + aRandom * 6.2831) * amp;
    // bass pushes the cloud outward (breathing core)
    p += normalize(p + 0.0001) * uBass * 40.0 * aRandom;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);

    // project to NDC for cursor gravity
    vec4 clip = projectionMatrix * mv;
    vec2 ndc = clip.xy / clip.w;
    vec2 d = ndc - uMouse;
    float dist = length(d);
    float force = smoothstep(0.5, 0.0, dist);

    // gentle cursor attraction (calm, not a sonar blast) + soft Z drift on scroll
    mv.xy += normalize(d + 0.0001) * force * 34.0;
    mv.z += uVelocity * (aRandom + 0.3) * 34.0;

    vGlow = force;
    vAudio = uAudio;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPixelRatio * (1.0 + force * 1.4 + uBass * 0.8) * (320.0 / -mv.z);
  }
`;

const fragmentShader = /* glsl */ `
  precision mediump float;
  varying float vGlow;
  varying float vAudio;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    if (r > 0.5) discard;
    float alpha = smoothstep(0.5, 0.0, r);
    vec3 base = vec3(0.40, 0.45, 0.55);    // muted slate
    vec3 accent = vec3(0.86, 0.89, 0.94);  // soft platinum
    vec3 col = mix(base, accent, vGlow * 0.8 + vAudio * 0.3);
    gl_FragColor = vec4(col, alpha * (0.12 + vGlow * 0.45 + vAudio * 0.12));
  }
`;

export default function ParticleField() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const velRef = useRef(0);

  const { positions, randoms } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const randoms = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * SPREAD;
      positions[i * 3 + 1] = (Math.random() - 0.5) * SPREAD;
      positions[i * 3 + 2] = (Math.random() - 0.5) * (SPREAD * 0.7) - 200;
      randoms[i] = Math.random();
    }
    return { positions, randoms };
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uVelocity: { value: 0 },
      uSize: { value: 18 },
      uPixelRatio: { value: typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1 },
      uAudio: { value: 0 },
      uBass: { value: 0 },
    }),
    []
  );

  const audioRef = useRef(0);
  const bassRef = useRef(0);

  useFrame((state) => {
    const r = dynamicRef();
    const u = uniforms;
    u.uTime.value = state.clock.elapsedTime;
    // smooth mouse already lerped in provider
    u.uMouse.value.set(r.mouse.nx, r.mouse.ny);
    // damped scroll velocity → hyperspace warp
    velRef.current += (r.scroll.velocity * 0.05 - velRef.current) * 0.1;
    u.uVelocity.value = THREE.MathUtils.clamp(velRef.current, -6, 6);
    // smoothed audio-reactivity (adds click "beat" spikes)
    const targetA = Math.min(1, r.audio.level + r.audio.beat * 0.6);
    audioRef.current += (targetA - audioRef.current) * 0.18;
    bassRef.current += (r.audio.bass - bassRef.current) * 0.22;
    u.uAudio.value = audioRef.current;
    u.uBass.value = bassRef.current;
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aRandom" args={[randoms, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
