"use client";

import { Canvas } from "@react-three/fiber";
import ParticleField from "./ParticleField";

export default function Scene() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 620], fov: 60, far: 4000 }}
      >
        <ParticleField />
      </Canvas>
    </div>
  );
}
