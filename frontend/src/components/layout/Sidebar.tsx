"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "⬡",
    color: "cyan",
    description: "Overview"
  },
  {
    href: "/dashboard/notes",
    label: "Notes Agent",
    icon: "◈",
    color: "blue",
    description: "Smart notes"
  },
  {
    href: "/dashboard/quiz",
    label: "Quiz Agent",
    icon: "◉",
    color: "purple",
    description: "MCQ practice"
  },
  {
    href: "/dashboard/doubt",
    label: "Doubt Agent",
    icon: "◎",
    color: "cyan",
    description: "Ask anything"
  },
  {
    href: "/dashboard/planner",
    label: "Planner Agent",
    icon: "◫",
    color: "green",
    description: "Study schedule"
  },
  {
    href: "/dashboard/revision",
    label: "Revision Agent",
    icon: "◬",
    color: "amber",
    description: "Weak topics"
  },
];

const colorMap: Record<string, string> = {
  cyan: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
  blue: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  purple: "text-purple-400 border-purple-500/30 bg-purple-500/10",
  green: "text-green-400 border-green-500/30 bg-green-500/10",
  amber: "text-amber-400 border-amber-500/30 bg-amber-500/10",
};

const glowMap: Record<string, string> = {
  cyan: "shadow-[0_0_15px_rgba(0,212,255,0.3)]",
  blue: "shadow-[0_0_15px_rgba(59,130,246,0.3)]",
  purple: "shadow-[0_0_15px_rgba(124,58,237,0.3)]",
  green: "shadow-[0_0_15px_rgba(0,255,136,0.3)]",
  amber: "shadow-[0_0_15px_rgba(255,170,0,0.3)]",
};

export default function Sidebar() {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <aside
      className="w-64 min-h-screen flex flex-col fixed left-0 top-0 z-50"
      style={{
        background: "linear-gradient(180deg, #020c18 0%, #030f1e 100%)",
        borderRight: "1px solid rgba(0, 212, 255, 0.1)",
      }}
    >
      {/* Scan line effect */}
      <div className="scan-line" />

      {/* Logo */}
      <div className="px-6 py-6 border-b border-cyan-500/10">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-lg pulse-cyan"
            style={{
              background: "linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,136,204,0.1))",
              border: "1px solid rgba(0,212,255,0.4)",
            }}
          >
            🧠
          </div>
          <div>
            <h1
              className="font-orbitron font-bold text-sm tracking-widest"
              style={{ color: "#00d4ff" }}
            >
              NEURO<span style={{ color: "#ffffff" }}>STUDY</span>
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="status-dot" />
              <span className="font-mono-jet text-xs" style={{ color: "#2a6a8a" }}>
                SYSTEM ONLINE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Agent label */}
      <div className="px-6 pt-5 pb-2">
        <span
          className="font-mono-jet text-xs tracking-widest uppercase"
          style={{ color: "#2a5a7a" }}
        >
          // AI AGENTS
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const isHovered = hoveredItem === item.href;
          const colorClass = colorMap[item.color];

          return (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={() => setHoveredItem(item.href)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`
                relative flex items-center gap-3 px-3 py-2.5 rounded-lg
                transition-all duration-300 group overflow-hidden
                ${isActive
                  ? `${colorClass} ${glowMap[item.color]} border`
                  : "text-gray-500 hover:text-gray-200 border border-transparent"
                }
              `}
              style={isActive ? {} : (isHovered ? {
                background: "rgba(0, 212, 255, 0.03)",
                borderColor: "rgba(0, 212, 255, 0.08)",
              } : {})}
            >
              {/* Active indicator line */}
              {isActive && (
                <div
                  className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full"
                  style={{ background: "#00d4ff", boxShadow: "0 0 8px #00d4ff" }}
                />
              )}

              {/* Hover shimmer */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.03), transparent)",
                }}
              />

              {/* Icon */}
              <span
                className={`text-lg font-bold transition-all duration-300 ${
                  isActive ? "" : "text-gray-600 group-hover:text-cyan-500"
                }`}
              >
                {item.icon}
              </span>

              {/* Label */}
              <div className="flex-1 min-w-0">
                <p
                  className={`font-rajdhani font-600 text-sm transition-all duration-300 ${
                    isActive ? "font-bold" : ""
                  }`}
                  style={{ fontWeight: isActive ? 700 : 500 }}
                >
                  {item.label}
                </p>
                <p
                  className="font-mono-jet text-xs truncate"
                  style={{ color: isActive ? "rgba(0,212,255,0.5)" : "#1a3a5a" }}
                >
                  {item.description}
                </p>
              </div>

              {/* Active arrow */}
              {isActive && (
                <span style={{ color: "#00d4ff", fontSize: "10px" }}>▶</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom info */}
      <div
        className="mx-3 mb-4 p-3 rounded-lg"
        style={{
          background: "rgba(0, 212, 255, 0.03)",
          border: "1px solid rgba(0, 212, 255, 0.08)",
        }}
      >
        <p
          className="font-mono-jet text-xs text-center"
          style={{ color: "#1a4a6a" }}
        >
          GOOGLE CLOUD
        </p>
        <p
          className="font-mono-jet text-xs text-center mt-0.5"
          style={{ color: "#00d4ff", opacity: 0.5 }}
        >
          RAPID AGENT HACKATHON
        </p>
      </div>
    </aside>
  );
}