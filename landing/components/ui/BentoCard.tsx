import { type ReactNode } from "react";

type Glow = "emerald" | "blue" | "purple" | "none";

const GLOW: Record<Glow, string> = {
  emerald: "hover:border-emerald-500/30",
  blue: "hover:border-blue-500/30",
  purple: "hover:border-purple-500/30",
  none: "hover:border-slate-700",
};

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  glow?: Glow;
}

/**
 * Lando Norris style grid cell — clean heavy border, glass surface, glowing hover edge.
 */
export default function BentoCard({
  children,
  className = "",
  glow = "none",
}: BentoCardProps) {
  return (
    <div
      className={`interactive group relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/40 backdrop-blur-sm transition-all duration-300 ${GLOW[glow]} ${className}`}
    >
      {children}
    </div>
  );
}
