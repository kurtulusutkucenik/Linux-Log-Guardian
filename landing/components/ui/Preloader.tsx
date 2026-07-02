"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Homepage boot screen: brand logo, Turkish flag underneath, a thin progress
 * line counting to 100, then a clean fade.
 */
export default function Preloader({ onDone }: { onDone?: () => void }) {
  const [pct, setPct] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    document.body.style.overflow = visible ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  useEffect(() => {
    const start = performance.now();
    const dur = 1300;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setPct(Math.round(eased * 100));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        window.setTimeout(() => {
          setVisible(false);
          onDone?.();
        }, 300);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="preloader"
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          aria-label="Yükleniyor"
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_45%,rgba(255,59,59,0.08),transparent_70%)]"
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="relative flex flex-col items-center"
          >
            <Image
              src="/logo-cenik.png"
              alt="Linux Log Guardian"
              width={320}
              height={320}
              priority
              className="h-36 w-36 object-contain md:h-44 md:w-44"
            />

            <Image
              src="/flag-tr.svg"
              alt="Türk bayrağı"
              width={72}
              height={48}
              className="mt-6 h-8 w-auto rounded-sm border border-white/10 shadow-[0_0_20px_rgba(227,10,23,0.35)]"
            />

            <p className="mt-4 font-display text-lg font-bold tracking-tight text-white">
              Linux Log Guardian
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.35em] text-neutral-500">
              Türk yapımı · self-hosted güvenlik
            </p>

            <div className="mt-8 flex items-center gap-3">
              <div className="h-px w-44 overflow-hidden bg-white/10 md:w-60">
                <div
                  className="h-full bg-neon transition-[width] duration-100"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-8 text-right font-mono text-xs tabular-nums text-neutral-400">
                {pct}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
