"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Minimal, premium cursor: a crisp dot that tracks precisely plus a soft
 * trailing ring that eases behind it and gently expands over interactive
 * targets. No tactical readouts — restrained and serious.
 */
export default function Cursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;

    gsap.set([ring, dot], { xPercent: -50, yPercent: -50 });

    const ringX = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });
    const dotX = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power2" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power2" });

    const move = (e: PointerEvent) => {
      ringX(e.clientX);
      ringY(e.clientY);
      dotX(e.clientX);
      dotY(e.clientY);
    };

    let isHover = false;
    const over = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      const hit = Boolean(
        t?.closest("a, button, .interactive, input, [role='button']")
      );
      if (hit === isHover) return;
      isHover = hit;
      gsap.to(ring, {
        scale: hit ? 1.8 : 1,
        opacity: hit ? 1 : 0.6,
        borderColor: hit ? "rgba(232,234,237,0.9)" : "rgba(232,234,237,0.4)",
        duration: 0.3,
        ease: "power3",
      });
      gsap.to(dot, { scale: hit ? 0 : 1, duration: 0.3, ease: "power3" });
    };

    const leave = () => gsap.to([ring, dot], { opacity: 0, duration: 0.3 });
    const enter = () => gsap.to([ring, dot], { opacity: 1, duration: 0.3 });

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    document.addEventListener("pointerleave", leave);
    document.addEventListener("pointerenter", enter);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      document.removeEventListener("pointerleave", leave);
      document.removeEventListener("pointerenter", enter);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[200] hidden md:block" aria-hidden="true">
      <div
        ref={ringRef}
        className="absolute left-0 top-0 h-8 w-8 rounded-full border"
        style={{ borderColor: "rgba(232,234,237,0.4)", opacity: 0.6 }}
      />
      <div
        ref={dotRef}
        className="absolute left-0 top-0 h-1.5 w-1.5 rounded-full bg-white"
      />
    </div>
  );
}
