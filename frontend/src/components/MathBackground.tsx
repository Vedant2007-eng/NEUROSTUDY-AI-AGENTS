"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

const SYMBOLS = ["+", "-", "×", "÷", "=", "%", "@", "#", "$", "^", "&", "*", "(", ")", "π", "∑", "∆", "∞"];

const COLORS = [
  "rgba(34,211,238,VAR)",   // cyan-400
  "rgba(96,165,250,VAR)",   // blue-400
  "rgba(167,139,250,VAR)",  // purple-400
];

// Multi-waypoint "wander" keyframes — symbols drift in irregular, non-linear paths
const ANIM_TYPES = ["mathWander1", "mathWander2", "mathWander3", "mathWander4"];

interface SymbolConfig {
  id: number;
  symbol: string;
  left: number;
  top: number;
  size: number;
  color: string;
  opacity: number;
  duration: number;
  delay: number;
  anim: string;
  rotate: number;
}

function generateSymbols(count: number): SymbolConfig[] {
  const configs: SymbolConfig[] = [];
  for (let i = 0; i < count; i++) {
    const opacity = 0.10 + Math.random() * 0.15; // 0.10 - 0.25 (subtle premium look)
    const colorTemplate = COLORS[Math.floor(Math.random() * COLORS.length)];
    configs.push({
      id: i,
      symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: [14, 18, 20, 24, 28, 32][Math.floor(Math.random() * 6)],
      color: colorTemplate.replace("VAR", opacity.toFixed(2)),
      opacity,
      // Random duration AND random animation choice per symbol = no two move the same way
      duration: 12 + Math.random() * 22, // 12s - 34s, varied speed
      delay: Math.random() * -25,         // negative delay = random start point in the path
      anim: ANIM_TYPES[Math.floor(Math.random() * ANIM_TYPES.length)],
      rotate: Math.random() * 40 - 20,
    });
  }
  return configs;
}

export default function MathBackground({ count = 32 }: { count?: number }) {
  const [symbols, setSymbols] = useState<SymbolConfig[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setSymbols(generateSymbols(count));
    setMounted(true);
  }, [count]);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none select-none"
      style={{ zIndex: 50 }}
      aria-hidden="true"
    >
      {symbols.map((s) => {
        const style: CSSProperties & Record<string, string | number> = {
          left: `${s.left}%`,
          top: `${s.top}%`,
          fontSize: `${s.size}px`,
          color: s.color,
          opacity: s.opacity,
          textShadow: `0 0 8px ${s.color}, 0 0 16px ${s.color}`,
          animationName: s.anim,
          animationDuration: `${s.duration}s`,
          animationTimingFunction: "ease-in-out",
          animationDelay: `${s.delay}s`,
          animationIterationCount: "infinite",
          "--rot": `${s.rotate}deg`,
        };
        return (
          <span key={s.id} className="math-symbol" style={style}>
            {s.symbol}
          </span>
        );
      })}
    </div>
  );
}