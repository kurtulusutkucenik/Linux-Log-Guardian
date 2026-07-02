"use client";

import { useEffect, useRef, useState, type ElementType } from "react";

interface DecryptTextProps {
  text: string;
  as?: ElementType;
  className?: string;
  threshold?: number;
}

/**
 * Clean, premium reveal: text fades + de-blurs + rises once it scrolls into
 * view. (Replaces the earlier scramble effect for a calmer, serious tone.)
 */
export default function DecryptText({
  text,
  as: Tag = "span",
  className = "",
  threshold = 0.2,
}: DecryptTextProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        });
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  const Comp = Tag as React.ElementType;
  return (
    <Comp
      ref={ref}
      className={`${className} transition-[opacity,filter,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        shown ? "opacity-100 blur-0 translate-y-0" : "translate-y-3 opacity-0 blur-[8px]"
      }`}
    >
      {text}
    </Comp>
  );
}
