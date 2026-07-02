"use client";

import { useEffect, useRef, useState } from "react";

/** Turkish-safe scramble alphabet (includes İ ı Ş ş Ğ ğ Ü ü Ç ç Ö ö + matrix glyphs). */
export const GLITCH_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789İIŞĞÜÇÖşğüçöı#%&/<>*+=:".split("");

/**
 * Cyber-decryption reveal: characters cycle random (Turkish-safe) glyphs,
 * then resolve left-to-right once the element scrolls into view.
 */
export function useGlitchText(text: string, opts?: { threshold?: number }) {
  const ref = useRef<HTMLElement | null>(null);
  const [display, setDisplay] = useState(text);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;

    const run = () => {
      const chars = Array.from(text);
      const total = chars.length;
      const duration = 650 + total * 32;
      const start = performance.now();

      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / duration);
        const revealed = Math.floor(p * total);
        let out = "";
        for (let i = 0; i < total; i++) {
          const ch = chars[i];
          if (ch === " ") {
            out += " ";
          } else if (i < revealed) {
            out += ch;
          } else {
            out += GLITCH_CHARS[(Math.random() * GLITCH_CHARS.length) | 0];
          }
        }
        setDisplay(out);
        if (p < 1) raf = requestAnimationFrame(tick);
        else setDisplay(text);
      };
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !started.current) {
            started.current = true;
            run();
            io.disconnect();
          }
        });
      },
      { threshold: opts?.threshold ?? 0.35 }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [text, opts?.threshold]);

  return { ref, display };
}
