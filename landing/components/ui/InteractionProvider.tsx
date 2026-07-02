"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Cursor from "./Cursor";
import NoiseOverlay from "./NoiseOverlay";
import Preloader from "./Preloader";
import AudioToggle from "./AudioToggle";
import { useDynamicContext } from "@/hooks/useDynamicContext";

// WebGL is client-only; never SSR the canvas.
const Scene = dynamic(() => import("@/components/canvas/Scene"), { ssr: false });

export default function InteractionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [entered, setEntered] = useState(false);

  /* hot mouse/scroll → shared ref loop (drives WebGL + cursor at 60fps) */
  useEffect(() => {
    const r = useDynamicContext.getState().ref;
    r.mouse.tx = r.mouse.x = window.innerWidth / 2;
    r.mouse.ty = r.mouse.y = window.innerHeight / 2;

    const onMove = (e: PointerEvent) => {
      r.mouse.tx = e.clientX;
      r.mouse.ty = e.clientY;
    };
    const onScroll = () => {
      r.scroll.target = window.scrollY;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    let raf = 0;
    const loop = () => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      r.mouse.x += (r.mouse.tx - r.mouse.x) * 0.1;
      r.mouse.y += (r.mouse.ty - r.mouse.y) * 0.1;
      r.mouse.nx = (r.mouse.x / w) * 2 - 1;
      r.mouse.ny = -((r.mouse.y / h) * 2 - 1);
      const prev = r.scroll.current;
      r.scroll.current += (r.scroll.target - r.scroll.current) * 0.12;
      r.scroll.velocity = r.scroll.current - prev;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* lock scroll only during the brief loader */
  useEffect(() => {
    document.body.style.overflow = entered ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [entered]);

  return (
    <>
      {entered && <Scene />}
      <NoiseOverlay />
      <Cursor />
      <AudioToggle />
      {children}
      {!entered && <Preloader onDone={() => setEntered(true)} />}
    </>
  );
}
