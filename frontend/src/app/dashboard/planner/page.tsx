"use client";

import { useState, useEffect, useRef } from "react";
import { auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Document { _id: string; filename: string; }
interface TopicPlan { topic: string; duration: string; priority: string; study_tip: string; }
interface StudyDay { day: number; title: string; topics: TopicPlan[]; daily_goal: string; total_time: string; }
interface PlannerContent {
  plan_title: string; total_days: number; total_hours: string;
  difficulty_level: string; days: StudyDay[];
}

const dayAccents = [
  { color: "#00d4ff", bg: "rgba(0,212,255,0.06)", border: "rgba(0,212,255,0.2)" },
  { color: "#a78bfa", bg: "rgba(167,139,250,0.06)", border: "rgba(167,139,250,0.2)" },
  { color: "#00ff88", bg: "rgba(0,255,136,0.05)", border: "rgba(0,255,136,0.18)" },
  { color: "#ffaa00", bg: "rgba(255,170,0,0.06)", border: "rgba(255,170,0,0.2)" },
  { color: "#60a5fa", bg: "rgba(96,165,250,0.06)", border: "rgba(96,165,250,0.2)" },
  { color: "#f472b6", bg: "rgba(244,114,182,0.06)", border: "rgba(244,114,182,0.18)" },
  { color: "#34d399", bg: "rgba(52,211,153,0.06)", border: "rgba(52,211,153,0.18)" },
];

const priorityStyle: Record<string, { color: string; bg: string }> = {
  High: { color: "#ff3366", bg: "rgba(255,51,102,0.1)" },
  Medium: { color: "#ffaa00", bg: "rgba(255,170,0,0.1)" },
  Low: { color: "#00ff88", bg: "rgba(0,255,136,0.1)" },
};

/* ================================================================== */
/*  Icons (lucide-style strokes, inline, zero new deps)                 */
/* ================================================================== */
const Icon = {
  Calendar: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 20} height={p.size ?? 20} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  ClipboardList: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M9 12h6M9 16h6M9 8h2" />
    </svg>
  ),
  FileText: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" /><path d="M9 13h6M9 17h6M9 9h2" />
    </svg>
  ),
  Atom: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" />
      <ellipse cx="12" cy="12" rx="10" ry="4.5" />
      <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(120 12 12)" />
    </svg>
  ),
  Target: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" />
    </svg>
  ),
  Clock: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
    </svg>
  ),
  TrendingUp: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m23 6-9.5 9.5-5-5L1 18" /><path d="M17 6h6v6" />
    </svg>
  ),
  Shield: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" />
    </svg>
  ),
  UploadCloud: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 32} height={p.size ?? 32} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 16l-4-4-4 4" /><path d="M12 12v9" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  ),
  Info: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 14} height={p.size ?? 14} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
    </svg>
  ),
  Check: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 14} height={p.size ?? 14} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  Refresh: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 14} height={p.size ?? 14} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" />
    </svg>
  ),
};

const FLOAT_SYMBOLS = ["#", "%", "✓"];

/* ================================================================== */
/*  Floating symbols background                                        */
/* ================================================================== */
function FloatingSymbols() {
  const [mounted, setMounted] = useState(false);
  const [symbols, setSymbols] = useState<
    { id: number; char: string; left: number; top: number; duration: number; delay: number; size: number }[]
  >([]);

  useEffect(() => {
    setSymbols(
      Array.from({ length: 12 }).map((_, i) => ({
        id: i,
        char: FLOAT_SYMBOLS[Math.floor(Math.random() * FLOAT_SYMBOLS.length)],
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: 20 + Math.random() * 16,
        delay: Math.random() * 8,
        size: 14 + Math.random() * 16,
      }))
    );
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {symbols.map((s) => (
        <span
          key={s.id}
          className="planner-symbol-float"
          style={{
            position: "absolute",
            left: `${s.left}%`,
            top: `${s.top}%`,
            fontSize: `${s.size}px`,
            fontFamily: "var(--font-jetbrains-mono, monospace)",
            color: "#00FF9C",
            opacity: 0.1,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
            textShadow: "0 0 14px rgba(0,255,156,0.5)",
          }}
        >
          {s.char}
        </span>
      ))}
      <style jsx global>{`
        @keyframes plannerFloatWander {
          0% { transform: translate(0,0) rotate(0deg); }
          25% { transform: translate(36px,-54px) rotate(12deg); }
          50% { transform: translate(-26px,-98px) rotate(-9deg); }
          75% { transform: translate(52px,-36px) rotate(7deg); }
          100% { transform: translate(0,0) rotate(0deg); }
        }
        .planner-symbol-float {
          animation-name: plannerFloatWander;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  );
}

/* ================================================================== */
/*  Sidebar                                                              */
/* ================================================================== */
function Sidebar({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, icon: Icon.FileText, title: "Upload PDF", desc: "Upload your study material in PDF format." },
    { n: 2, icon: Icon.Atom, title: "AI Analysis", desc: "Our AI analyzes your content and learning goals." },
    { n: 3, icon: Icon.Target, title: "Get Study Plan", desc: "Receive a personalized day-by-day study schedule." },
  ];

  return (
    <aside className="hidden lg:flex flex-col shrink-0 sticky top-0 h-screen" style={{ width: 300 }}>
      <div
        className="flex flex-col h-full m-4 rounded-2xl overflow-y-auto"
        style={{
          background: "rgba(4,16,12,0.8)",
          border: "1px solid rgba(0,255,156,0.18)",
          boxShadow: "0 0 40px rgba(0,255,156,0.04), inset 0 1px 0 rgba(255,255,255,0.03)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Brand */}
        <div className="px-6 pt-8 pb-7" style={{ borderBottom: "1px solid rgba(0,255,156,0.1)" }}>
          <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, color: "#2a7a5a", letterSpacing: "0.08em" }}>
            // AGENT_04
          </span>
          <div className="mt-3 mb-3">
            <div
              className="flex items-center justify-center"
              style={{
                width: 56,
                height: 56,
                clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                background: "rgba(0,255,156,0.1)",
                border: "1px solid rgba(0,255,156,0.35)",
                boxShadow: "0 0 20px rgba(0,255,156,0.2)",
              }}
            >
              <Icon.Calendar size={24} color="#00FF9C" />
            </div>
          </div>
          <h1
            className="font-black text-xl leading-tight tracking-tight mb-3"
            style={{
              fontFamily: "var(--font-orbitron, sans-serif)",
              background: "linear-gradient(135deg, #00FF9C, #ffffff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            PLANNER AGENT
          </h1>
          <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 14.5, lineHeight: 1.5, color: "#4a9a7a" }}>
            AI generates a personalized day-by-day study schedule from your PDF.
          </p>
        </div>

        {/* Nav */}
        <div className="px-4 pt-7">
          <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 10.5, letterSpacing: "0.12em", color: "#2a7a5a", paddingLeft: 12 }}>
            NAVIGATION
          </span>
          <nav className="mt-3 flex flex-col gap-2">
            {[
              { label: "Configure Plan", sub: "Upload PDF & set plan", icon: Icon.ClipboardList, active: step <= 2 },
              { label: "My Study Plan", sub: "View your generated plan", icon: Icon.FileText, active: step === 3 },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-start gap-3 px-4 py-3.5 rounded-xl transition-all duration-300"
                style={{
                  background: item.active ? "linear-gradient(135deg, rgba(0,255,156,0.14), rgba(0,255,156,0.03))" : "transparent",
                  borderLeft: item.active ? "3px solid #00FF9C" : "3px solid transparent",
                  boxShadow: item.active ? "0 0 24px rgba(0,255,156,0.08)" : "none",
                }}
              >
                <item.icon size={17} color={item.active ? "#00FF9C" : "#3a8a6a"} />
                <div>
                  <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 15, fontWeight: 700, color: item.active ? "#e6fff4" : "#4a9a7a" }}>
                    {item.label}
                  </p>
                  <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 12.5, color: "#3a8a6a" }}>
                    {item.sub}
                  </p>
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* How it works */}
        <div className="px-4 pt-7">
          <div
            className="rounded-2xl p-4"
            style={{ background: "rgba(0,255,156,0.03)", border: "1px solid rgba(0,255,156,0.1)" }}
          >
            <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 10.5, letterSpacing: "0.1em", color: "#00FF9C" }}>
              HOW IT WORKS
            </span>
            <div className="mt-4 space-y-4">
              {steps.map((s) => (
                <div key={s.n} className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "rgba(0,255,156,0.08)", border: "1px solid rgba(0,255,156,0.2)" }}
                  >
                    <s.icon size={14} color="#00FF9C" />
                  </div>
                  <div>
                    <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 14, fontWeight: 700, color: "#e6fff4" }}>
                      {s.n}. {s.title}
                    </p>
                    <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 12.5, color: "#4a9a7a", lineHeight: 1.4, marginTop: 2 }}>
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Agent status */}
        <div className="px-4 pb-6 pt-6 mt-auto">
          <div
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl"
            style={{ background: "rgba(0,255,156,0.05)", border: "1px solid rgba(0,255,156,0.15)" }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
              style={{
                fontFamily: "var(--font-orbitron, sans-serif)",
                background: "linear-gradient(135deg, #00E676, #009955)",
                color: "#020812",
                boxShadow: "0 0 18px rgba(0,255,156,0.45)",
              }}
            >
              N
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, color: "#8acbb4" }}>AGENT_04</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#00ff88", boxShadow: "0 0 8px #00ff88" }} />
                <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, color: "#00ff88", letterSpacing: "0.05em" }}>ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ================================================================== */
/*  Step tracker                                                         */
/* ================================================================== */
function StepTracker({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "SELECT PDF", sub: "Upload your study material" },
    { n: 2, label: "SET PREFERENCES", sub: "Set study duration & goals" },
    { n: 3, label: "GENERATE PLAN", sub: "AI generates your plan" },
  ];

  return (
    <div
      className="flex items-center justify-between mb-9 px-7 py-6 rounded-3xl"
      style={{
        background: "linear-gradient(160deg, rgba(4,20,14,0.7), rgba(2,10,7,0.85))",
        border: "1px solid rgba(0,255,156,0.16)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      {steps.map((s, i) => {
        const active = s.n === step;
        const done = s.n < step;
        return (
          <div key={s.n} className="flex items-center" style={{ flex: i < steps.length - 1 ? 1 : "0 0 auto" }}>
            <div className="flex items-center gap-3.5 shrink-0">
              <div
                className="flex items-center justify-center font-bold transition-all duration-300 shrink-0"
                style={{
                  fontFamily: "var(--font-orbitron, sans-serif)",
                  fontSize: 15,
                  width: 48,
                  height: 48,
                  clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  background: active || done ? "linear-gradient(135deg, #00E676, #009955)" : "rgba(0,255,156,0.06)",
                  color: active || done ? "#020812" : "#4a9a7a",
                  boxShadow: active ? "0 0 24px rgba(0,255,156,0.6)" : "none",
                  border: active || done ? "none" : "1px solid rgba(0,255,156,0.2)",
                }}
              >
                {done ? <Icon.Check size={17} color="#020812" /> : s.n}
              </div>
              <div className="hidden md:block" style={{ maxWidth: 190 }}>
                <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 14, fontWeight: 700, color: active ? "#e6fff4" : done ? "#8acbb4" : "#4a9a7a" }}>
                  {s.label}
                </p>
                <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 12.5, color: "#3a8a6a", lineHeight: 1.35 }}>
                  {s.sub}
                </p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div
                className="h-px mx-5 transition-all duration-500 hidden sm:block"
                style={{ flex: 1, minWidth: 24, background: done ? "linear-gradient(90deg, #00FF9C, rgba(0,255,156,0.25))" : "rgba(0,255,156,0.14)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ================================================================== */
/*  Glass card wrapper                                                   */
/* ================================================================== */
function GlassCard({ children, className = "", padding = "p-8" }: { children: React.ReactNode; className?: string; padding?: string }) {
  return (
    <div
      className={`rounded-3xl ${padding} ${className}`}
      style={{
        background: "linear-gradient(160deg, rgba(6,22,16,0.7), rgba(2,10,7,0.85))",
        border: "1px solid rgba(0,255,156,0.16)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)",
        backdropFilter: "blur(16px)",
      }}
    >
      {children}
    </div>
  );
}

/* ================================================================== */
/*  Day card (logic untouched — re-themed border on container only)      */
/* ================================================================== */
function DayCard({ day, index }: { day: StudyDay; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const accent = dayAccents[index % dayAccents.length];

  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-300" style={{
      background: accent.bg, border: `1px solid ${accent.border}`,
    }}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
        <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm"
          style={{ fontFamily: "var(--font-orbitron, sans-serif)", background: `${accent.color}15`, border: `1px solid ${accent.color}40`, color: accent.color }}>
          D{String(day.day).padStart(2, "0")}
        </div>
        <div className="flex-1 text-left">
          <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontWeight: 700, fontSize: 15, color: "#e6fff4" }}>{day.title}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11.5, color: accent.color, opacity: 0.7 }}>
              ⏱ {day.total_time}
            </span>
            <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11.5, color: "#2a6a5a" }}>
              ◈ {day.topics.length} topics
            </span>
          </div>
        </div>
        <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, color: accent.color, opacity: 0.4 }}>
          {open ? "[ − ]" : "[ + ]"}
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4">
          <div className="flex items-start gap-2 px-4 py-3 rounded-lg" style={{
            background: "rgba(2,10,7,0.5)", border: "1px solid rgba(255,255,255,0.05)"
          }}>
            <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, color: accent.color, marginTop: 2, flexShrink: 0 }}>▶</span>
            <div>
              <p style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, color: accent.color, opacity: 0.7, marginBottom: 2 }}>DAILY_GOAL</p>
              <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 14.5, color: "#5aaa8a" }}>{day.daily_goal}</p>
            </div>
          </div>

          {day.topics.map((t, i) => {
            const ps = priorityStyle[t.priority] || priorityStyle.Medium;
            return (
              <div key={i} className="rounded-xl p-4" style={{
                background: "rgba(2,10,7,0.6)", border: "1px solid rgba(255,255,255,0.04)"
              }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontWeight: 700, fontSize: 15, color: "#e6fff4" }}>{t.topic}</p>
                  <span className="px-2.5 py-1 rounded shrink-0"
                    style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, color: ps.color, background: ps.bg }}>
                    {t.priority.toUpperCase()}
                  </span>
                </div>
                <p style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11.5, color: "#2a6a5a", marginBottom: 12 }}>⏱ {t.duration}</p>
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg" style={{
                  background: "rgba(255,170,0,0.04)", border: "1px solid rgba(255,170,0,0.12)"
                }}>
                  <span className="text-xs shrink-0">💡</span>
                  <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 13, color: "#7a9a8a" }}>{t.study_tip}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Main page                                                            */
/* ================================================================== */
export default function PlannerPage() {
  const [user] = useAuthState(auth);

  // ---- preserved state / logic ----
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState("");
  const [studyDays, setStudyDays] = useState(7);
  const [planner, setPlanner] = useState<PlannerContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [docsLoading, setDocsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---- new: upload UI state ----
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const step: 1 | 2 | 3 = planner ? 3 : selectedDoc ? 2 : 1;

  useEffect(() => {
    const f = async () => {
      try {
        const res = await fetch(`${API_BASE}/documents?user_id=${user?.uid || "test_user"}`);
        const data = await res.json();
        setDocuments(data.documents || []);
      } catch { }
      finally { setDocsLoading(false); }
    };
    f();
  }, [user]);

  const handleGenerate = async () => {
    if (!selectedDoc) return;
    setLoading(true); setError(null); setPlanner(null);
    try {
      const res = await fetch(`${API_BASE}/api/planner/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: selectedDoc, user_id: user?.uid || "test_user", study_days: studyDays }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed.");
      setPlanner(data.planner);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setLoading(false); }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (file.type !== "application/pdf") { setUploadError("Only PDF files are supported."); return; }
    if (file.size > 100 * 1024 * 1024) { setUploadError("File exceeds 100MB limit."); return; }
    setUploading(true); setUploadError(null); setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("user_id", user?.uid || "test_user");
      const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed.");
      const refreshed = await fetch(`${API_BASE}/documents?user_id=${user?.uid || "test_user"}`);
      const refreshedData = await refreshed.json();
      const docs: Document[] = refreshedData.documents || [];
      setDocuments(docs);
      const newDocId = data.document_id || data._id || docs[0]?._id;
      if (newDocId) setSelectedDoc(newDocId);
    } catch (e: unknown) { setUploadError(e instanceof Error ? e.message : "Upload failed."); }
    finally { setUploading(false); }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  return (
    <div className="min-h-screen flex" style={{ background: "radial-gradient(circle at 20% 0%, #0a2a1c 0%, #020a07 55%)" }}>
      <FloatingSymbols />
      <Sidebar step={step} />

      <div className="flex-1 relative min-w-0" style={{ zIndex: 1 }}>
        <div
          className="min-h-screen"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,255,156,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,156,0.035) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        >
          <div className="mx-auto" style={{ maxWidth: 1280, padding: "48px 40px 64px" }}>

            {/* ---- Header card ---- */}
            <GlassCard className="mb-9" padding="p-9">
              <div className="flex items-center justify-between gap-6 flex-wrap">
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(0,255,156,0.1)", border: "1px solid rgba(0,255,156,0.3)" }}
                  >
                    <Icon.Calendar size={20} color="#00FF9C" />
                  </div>
                  <div>
                    <h2
                      className="font-black tracking-tight mb-2"
                      style={{
                        fontFamily: "var(--font-orbitron, sans-serif)",
                        fontSize: 28,
                        background: "linear-gradient(135deg, #00FF9C, #ffffff)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      CONFIGURE STUDY PLAN
                    </h2>
                    <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 16, color: "#4a9a7a" }}>
                      Upload your PDF and let AI create your personalized study schedule.
                    </p>
                  </div>
                </div>
                <div
                  className="hidden sm:flex w-14 h-14 rounded-2xl items-center justify-center shrink-0"
                  style={{ background: "rgba(0,255,156,0.06)", border: "1px solid rgba(0,255,156,0.2)" }}
                >
                  <Icon.Calendar size={24} color="#00FF9C" />
                </div>
              </div>
            </GlassCard>

            {/* ---- Step tracker ---- */}
            <StepTracker step={step} />

            {!planner && (
              <>
                {/* ---- Upload hero ---- */}
                <GlassCard className="mb-9" padding="p-0">
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer transition-all duration-300 group mx-auto flex flex-col items-center justify-center text-center"
                    style={{
                      width: "86%",
                      minHeight: 420,
                      margin: "44px auto",
                      borderRadius: 30,
                      border: `2px dashed ${isDragging ? "#00FF9C" : "rgba(0,255,156,0.28)"}`,
                      background: isDragging
                        ? "rgba(0,255,156,0.08)"
                        : "linear-gradient(160deg, rgba(0,255,156,0.04), rgba(2,10,7,0.4))",
                      boxShadow: isDragging ? "0 0 56px rgba(0,255,156,0.3)" : "none",
                      padding: "0 40px",
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
                    />

                    <div
                      className="w-20 h-20 rounded-3xl flex items-center justify-center mb-7 transition-transform duration-300 group-hover:scale-110"
                      style={{ background: "rgba(0,255,156,0.1)", border: "1px solid rgba(0,255,156,0.32)", boxShadow: "0 0 28px rgba(0,255,156,0.18)" }}
                    >
                      {uploading ? (
                        <span className="inline-block w-7 h-7 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: "#00FF9C" }} />
                      ) : (
                        <Icon.UploadCloud size={32} color="#00FF9C" />
                      )}
                    </div>

                    <p className="font-bold mb-2.5" style={{ fontFamily: "var(--font-orbitron, sans-serif)", fontSize: 19, color: "#e6fff4" }}>
                      {uploading ? "UPLOADING DOCUMENT..." : "UPLOAD YOUR PDF"}
                    </p>
                    <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 16, color: "#4a9a7a", marginBottom: 30 }}>
                      Drag &amp; drop your file here or click to browse
                    </p>

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      disabled={uploading}
                      className="flex items-center gap-2.5 transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50"
                      style={{
                        fontFamily: "var(--font-orbitron, sans-serif)",
                        fontSize: 13,
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                        color: "#020812",
                        padding: "16px 38px",
                        borderRadius: 14,
                        background: "linear-gradient(90deg, #00E676, #00FF9C)",
                        boxShadow: "0 0 28px rgba(0,255,156,0.4)",
                      }}
                    >
                      <Icon.UploadCloud size={16} color="#020812" />
                      CHOOSE PDF FILE
                    </button>

                    <div className="flex items-center gap-1.5 mt-7">
                      <span style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 14.5, color: "#3a8a6a" }}>
                        Supports PDF files up to 100MB
                      </span>
                      <Icon.Info size={14} color="#3a8a6a" />
                    </div>
                  </div>
                </GlassCard>

                {uploadError && (
                  <div className="mb-9 px-5 py-4 rounded-2xl" style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12.5, background: "rgba(255,51,102,0.08)", border: "1px solid rgba(255,51,102,0.2)", color: "#ff3366" }}>
                    ⚠ {uploadError}
                  </div>
                )}

                {/* ---- Configure: document + study days + generate ---- */}
                <GlassCard className="mb-9" padding="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Icon.ClipboardList size={16} color="#00FF9C" />
                    <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, letterSpacing: "0.08em", color: "#00FF9C", opacity: 0.75 }}>
                      CONFIGURE_PLAN
                    </span>
                    <div className="flex-1 h-px" style={{ background: "rgba(0,255,156,0.12)" }} />
                  </div>

                  {docsLoading ? (
                    <p style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 14, color: "#2a7a5a" }}>
                      <span className="cursor-blink">█</span> LOADING DOCUMENTS...
                    </p>
                  ) : documents.length === 0 ? (
                    <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 16, color: "#4a9a7a" }}>
                      No documents yet. Upload a PDF above to get started.
                    </p>
                  ) : (
                    <div className="space-y-5">
                      <select
                        value={selectedDoc}
                        onChange={(e) => setSelectedDoc(e.target.value)}
                        className="w-full outline-none"
                        style={{
                          fontFamily: "var(--font-rajdhani, sans-serif)",
                          fontSize: 15.5,
                          padding: "15px 18px",
                          borderRadius: 14,
                          background: "rgba(2,10,7,0.7)",
                          border: "1px solid rgba(0,255,156,0.2)",
                          color: "#e6fff4",
                        }}
                      >
                        <option value="">-- SELECT DOCUMENT --</option>
                        {documents.map((d) => <option key={d._id} value={d._id}>{d.filename}</option>)}
                      </select>

                      <div className="flex items-center gap-3 flex-wrap">
                        <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12.5, color: "#4a9a7a" }}>STUDY_DAYS:</span>
                        {[3, 5, 7, 10, 14].map((n) => (
                          <button
                            key={n}
                            onClick={() => setStudyDays(n)}
                            className="rounded-xl font-bold transition-all duration-200"
                            style={{
                              fontFamily: "var(--font-orbitron, sans-serif)",
                              fontSize: 14,
                              width: 44,
                              height: 44,
                              background: studyDays === n ? "linear-gradient(135deg, #00E676, #009955)" : "rgba(2,10,7,0.7)",
                              border: studyDays === n ? "1px solid rgba(0,255,156,0.6)" : "1px solid rgba(0,255,156,0.16)",
                              color: studyDays === n ? "#020812" : "#4a9a7a",
                              boxShadow: studyDays === n ? "0 0 18px rgba(0,255,156,0.4)" : "none",
                            }}
                          >
                            {n}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={handleGenerate}
                        disabled={!selectedDoc || loading}
                        className="w-full flex items-center justify-center gap-2.5 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:hover:scale-100"
                        style={{
                          fontFamily: "var(--font-orbitron, sans-serif)",
                          fontSize: 13.5,
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          padding: "16px",
                          borderRadius: 14,
                          background: !selectedDoc || loading ? "rgba(0,255,156,0.1)" : "linear-gradient(90deg, #00E676, #00FF9C)",
                          border: "1px solid rgba(0,255,156,0.4)",
                          color: !selectedDoc || loading ? "#3a7a5a" : "#020812",
                          boxShadow: !selectedDoc || loading ? "none" : "0 0 28px rgba(0,255,156,0.4)",
                        }}
                      >
                        {loading ? (
                          <>
                            <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            GENERATING PLAN...
                          </>
                        ) : (
                          <>
                            <Icon.Calendar size={15} color="#020812" />
                            GENERATE STUDY PLAN
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {error && (
                    <div className="mt-5 px-5 py-3.5 rounded-xl" style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12.5, background: "rgba(255,51,102,0.08)", border: "1px solid rgba(255,51,102,0.2)", color: "#ff3366" }}>
                      ⚠ {error}
                    </div>
                  )}
                </GlassCard>

                {/* ---- Feature cards ---- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-9">
                  {[
                    { icon: Icon.Target, title: "Personalized Plan", desc: "AI creates a plan tailored to your content." },
                    { icon: Icon.Clock, title: "Day-by-Day Schedule", desc: "Get a detailed day-by-day study plan." },
                    { icon: Icon.TrendingUp, title: "Smart Optimization", desc: "Optimized for better learning and retention." },
                    { icon: Icon.Shield, title: "Secure & Private", desc: "Your documents are safe and encrypted." },
                  ].map((f) => (
                    <GlassCard key={f.title} padding="p-6" className="transition-all duration-300 hover:scale-[1.02]">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                        style={{ background: "rgba(0,255,156,0.1)", border: "1px solid rgba(0,255,156,0.25)" }}
                      >
                        <f.icon size={19} color="#00FF9C" />
                      </div>
                      <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 16.5, fontWeight: 700, color: "#e6fff4", marginBottom: 6 }}>
                        {f.title}
                      </p>
                      <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 14, color: "#4a9a7a", lineHeight: 1.5 }}>
                        {f.desc}
                      </p>
                    </GlassCard>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-2 mb-2">
                  <Icon.Info size={14} color="#3a8a6a" />
                  <span style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 14.5, color: "#3a8a6a" }}>
                    Make sure your PDF is clear and readable for best results.
                  </span>
                </div>
              </>
            )}

            {/* ---- Loading skeleton ---- */}
            {loading && (
              <div className="space-y-4 animate-pulse">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="rounded-2xl" style={{ height: 80, background: "rgba(0,255,156,0.03)", border: "1px solid rgba(0,255,156,0.06)" }} />
                ))}
              </div>
            )}

            {/* ---- Plan output ---- */}
            {planner && !loading && (
              <div>
                <GlassCard className="mb-7" padding="p-7">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <h2 style={{ fontFamily: "var(--font-orbitron, sans-serif)", fontSize: 15, fontWeight: 700, color: "#00FF9C" }}>
                        {planner.plan_title.toUpperCase()}
                      </h2>
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, color: "#3a8a6a" }}>◫ {planner.total_days} DAYS</span>
                        <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, color: "#3a8a6a" }}>⏱ {planner.total_hours}</span>
                        <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, color: "#3a8a6a" }}>▲ {planner.difficulty_level.toUpperCase()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => { setPlanner(null); setSelectedDoc(""); }}
                      className="flex items-center gap-2 transition-all duration-200 hover:scale-[1.03]"
                      style={{
                        fontFamily: "var(--font-orbitron, sans-serif)",
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "10px 20px",
                        borderRadius: 12,
                        background: "rgba(0,255,156,0.1)",
                        border: "1px solid rgba(0,255,156,0.3)",
                        color: "#00FF9C",
                      }}
                    >
                      <Icon.Refresh size={13} color="#00FF9C" />
                      NEW PLAN
                    </button>
                  </div>
                </GlassCard>

                <div className="space-y-4">
                  {planner.days.map((day, i) => <DayCard key={day.day} day={day} index={i} />)}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}