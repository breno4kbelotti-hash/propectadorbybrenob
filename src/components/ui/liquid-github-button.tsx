"use client";
import { useState } from "react";
import { Github, Star } from "lucide-react";
import { Liquid, DEFAULT_LIQUID_COLORS } from "./button-1";

type Props = {
  onClick?: () => void;
  label?: string;
  disabled?: boolean;
};

export function LiquidGithubButton({ onClick, label = "Github", disabled }: Props) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* camadas de brilho */}
      <div className="absolute inset-0 -z-10 rounded-full blur-2xl opacity-70">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,#0017E9,transparent_60%)]" />
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_70%_70%,#7D7BF4,transparent_60%)]" />
      </div>

      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative isolate inline-flex h-11 items-center gap-2 overflow-hidden rounded-full border border-white/20 px-6 text-sm font-semibold tracking-wide text-white shadow-[0_8px_30px_-8px_rgba(11,6,252,0.8)] transition-transform duration-300 hover:scale-[1.03] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Liquid isHovered={isHovered} colors={DEFAULT_LIQUID_COLORS} id="gh-liquid" />

        {/* brilho superior de vidro */}
        <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/35 via-transparent to-black/25" />
        <span className="pointer-events-none absolute inset-x-4 top-0 h-px bg-white/60" />

        {/* estrelinhas */}
        <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star
              key={i}
              className="absolute h-2 w-2 fill-white/70 text-white/70 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                left: `${12 + i * 18}%`,
                top: i % 2 === 0 ? "18%" : "62%",
                transitionDelay: `${i * 90}ms`,
              }}
            />
          ))}
        </span>

        <span className="relative z-10 inline-flex items-center gap-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
          <Github className="h-4 w-4" />
          {label}
        </span>
      </button>
    </div>
  );
}
