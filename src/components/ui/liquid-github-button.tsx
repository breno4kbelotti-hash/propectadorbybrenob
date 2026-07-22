"use client";
import { useState } from "react";
import { Github } from "lucide-react";
import { Liquid, DEFAULT_LIQUID_COLORS } from "./button-1";

type Props = {
  onClick?: () => void;
  label?: string;
  disabled?: boolean;
};

export function LiquidGithubButton({ onClick, label = "GitHub", disabled }: Props) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="relative isolate inline-flex items-center gap-2 overflow-hidden rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_40px_-10px_rgba(11,6,252,0.6)] transition disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Liquid isHovered={hover} colors={DEFAULT_LIQUID_COLORS} id="gh-liquid" />
      <span className="relative z-10 inline-flex items-center gap-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
        <Github className="h-4 w-4" />
        {label}
      </span>
    </button>
  );
}
