"use client";

import { useEffect, useRef } from "react";

/** Sekme görünürken interval; arka planda durur — CPU/network tasarrufu. */
export function useVisibleInterval(
  fn: () => void | Promise<void>,
  ms: number,
  enabled = true,
) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!enabled || ms <= 0) return;

    let timer: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      if (document.visibilityState === "visible") {
        void fnRef.current();
      }
    };

    const start = () => {
      if (timer) return;
      tick();
      timer = setInterval(tick, ms);
    };

    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const onVis = () => {
      if (document.visibilityState === "visible") start();
      else stop();
    };

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [ms, enabled]);
}
