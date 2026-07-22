"use client";
import { motion } from "motion/react";

type ColorKey =
  | "color1" | "color2" | "color3" | "color4" | "color5" | "color6"
  | "color7" | "color8" | "color9" | "color10" | "color11" | "color12"
  | "color13" | "color14" | "color15" | "color16" | "color17";

export type Colors = Record<ColorKey, string>;

const svgOrder = ["svg1", "svg2", "svg3", "svg4", "svg3", "svg2", "svg1"] as const;
type SvgKey = (typeof svgOrder)[number];

type Stop = { offset: number; stopColor: string };
type SvgState = { gradientTransform: string; stops: Stop[] };
type SvgStates = Record<Exclude<SvgKey, never>, SvgState>;

function createStopsArray(svgStates: SvgStates, order: readonly SvgKey[], maxStops: number): Stop[][] {
  const stopsArray: Stop[][] = [];
  for (let i = 0; i < maxStops; i++) {
    const configs = order.map((k) => {
      const svg = svgStates[k];
      return svg.stops[i] || svg.stops[svg.stops.length - 1];
    });
    stopsArray.push(configs);
  }
  return stopsArray;
}

const GradientSvg: React.FC<{ id: string; isHovered: boolean; colors: Colors }> = ({ id, isHovered, colors }) => {
  const svgStates: SvgStates = {
    svg1: {
      gradientTransform: "translate(287.5 280) rotate(-29.0546) scale(689.807 1000)",
      stops: [
        { offset: 0, stopColor: colors.color1 },
        { offset: 0.188423, stopColor: colors.color2 },
        { offset: 0.260417, stopColor: colors.color3 },
        { offset: 0.328792, stopColor: colors.color4 },
        { offset: 0.328892, stopColor: colors.color5 },
        { offset: 0.328992, stopColor: colors.color1 },
        { offset: 0.442708, stopColor: colors.color6 },
        { offset: 0.537556, stopColor: colors.color7 },
        { offset: 0.631738, stopColor: colors.color1 },
        { offset: 0.725645, stopColor: colors.color8 },
        { offset: 0.817779, stopColor: colors.color9 },
        { offset: 0.84375, stopColor: colors.color10 },
        { offset: 0.90569, stopColor: colors.color1 },
        { offset: 1, stopColor: colors.color11 },
      ],
    },
    svg2: {
      gradientTransform: "translate(126.5 418.5) rotate(-64.756) scale(533.444 773.324)",
      stops: [
        { offset: 0, stopColor: colors.color1 },
        { offset: 0.104167, stopColor: colors.color12 },
        { offset: 0.182292, stopColor: colors.color13 },
        { offset: 0.28125, stopColor: colors.color1 },
        { offset: 0.328792, stopColor: colors.color4 },
        { offset: 0.328892, stopColor: colors.color5 },
        { offset: 0.453125, stopColor: colors.color6 },
        { offset: 0.515625, stopColor: colors.color7 },
        { offset: 0.631738, stopColor: colors.color1 },
        { offset: 0.692708, stopColor: colors.color8 },
        { offset: 0.75, stopColor: colors.color14 },
        { offset: 0.817708, stopColor: colors.color9 },
        { offset: 0.869792, stopColor: colors.color10 },
        { offset: 1, stopColor: colors.color1 },
      ],
    },
    svg3: {
      gradientTransform: "translate(264.5 339.5) rotate(-42.3022) scale(946.451 1372.05)",
      stops: [
        { offset: 0, stopColor: colors.color1 },
        { offset: 0.188423, stopColor: colors.color2 },
        { offset: 0.307292, stopColor: colors.color1 },
        { offset: 0.328792, stopColor: colors.color4 },
        { offset: 0.328892, stopColor: colors.color5 },
        { offset: 0.442708, stopColor: colors.color15 },
        { offset: 0.537556, stopColor: colors.color16 },
        { offset: 0.631738, stopColor: colors.color1 },
        { offset: 0.725645, stopColor: colors.color17 },
        { offset: 0.817779, stopColor: colors.color9 },
        { offset: 0.84375, stopColor: colors.color10 },
        { offset: 0.90569, stopColor: colors.color1 },
        { offset: 1, stopColor: colors.color11 },
      ],
    },
    svg4: {
      gradientTransform: "translate(860.5 420) rotate(-153.984) scale(957.528 1388.11)",
      stops: [
        { offset: 0.109375, stopColor: colors.color11 },
        { offset: 0.171875, stopColor: colors.color2 },
        { offset: 0.260417, stopColor: colors.color13 },
        { offset: 0.328792, stopColor: colors.color4 },
        { offset: 0.328892, stopColor: colors.color5 },
        { offset: 0.328992, stopColor: colors.color1 },
        { offset: 0.442708, stopColor: colors.color6 },
        { offset: 0.515625, stopColor: colors.color7 },
        { offset: 0.631738, stopColor: colors.color1 },
        { offset: 0.692708, stopColor: colors.color8 },
        { offset: 0.817708, stopColor: colors.color9 },
        { offset: 0.869792, stopColor: colors.color10 },
        { offset: 1, stopColor: colors.color11 },
      ],
    },
  };

  const maxStops = Math.max(...Object.values(svgStates).map((s) => s.stops.length));
  const stopsAnimationArray = createStopsArray(svgStates, svgOrder, maxStops);
  const gradientTransforms = svgOrder.map((k) => svgStates[k].gradientTransform);

  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1000 700"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <motion.radialGradient
          id={id}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          animate={{ gradientTransform: gradientTransforms }}
          transition={{ duration: isHovered ? 6 : 20, repeat: Infinity, ease: "linear" }}
        >
          {stopsAnimationArray.map((configs, i) => (
            <motion.stop
              key={i}
              animate={{
                offset: configs.map((c) => c.offset),
                stopColor: configs.map((c) => c.stopColor),
              }}
              transition={{ duration: isHovered ? 6 : 20, repeat: Infinity, ease: "linear" }}
            />
          ))}
        </motion.radialGradient>
      </defs>
      <rect x="0" y="0" width="1000" height="700" fill={`url(#${id})`} />
    </svg>
  );
};

export const Liquid: React.FC<{ isHovered: boolean; colors: Colors; id?: string }> = ({
  isHovered,
  colors,
  id = "liquid-grad",
}) => {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-full">
      <GradientSvg id={id} isHovered={isHovered} colors={colors} />
    </div>
  );
};

export const DEFAULT_LIQUID_COLORS: Colors = {
  color1: "#FFFFFF",
  color2: "#1E10C5",
  color3: "#9089E2",
  color4: "#FCFCFE",
  color5: "#F9F9FD",
  color6: "#B2B8E7",
  color7: "#0E2DCB",
  color8: "#0017E9",
  color9: "#4743EF",
  color10: "#7D7BF4",
  color11: "#0B06FC",
  color12: "#C5C1EA",
  color13: "#1403DE",
  color14: "#B6BAF6",
  color15: "#C1BEEB",
  color16: "#290ECB",
  color17: "#3F4CC0",
};
