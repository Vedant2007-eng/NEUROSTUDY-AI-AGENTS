"use client";

import { useState, useEffect, useRef } from "react";
import { auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Document { _id: string; filename: string; }
interface WeakTopic {
  topic: string; reason: string; priority: string;
  revision_time: string; key_points: string[];
  practice_questions: string[]; revision_tip: string;
}
interface RevisionSession { session: number; topic: string; duration: string; activity: string; }
interface RevisionContent {
  revision_title: string; total_topics: number; estimated_time: string;
  weak_topics: WeakTopic[]; revision_schedule: RevisionSession[]; general_tips: string[];
}

const priorityConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
  High: { color: "#ff3366", bg: "rgba(255,51,102,0.08)", border: "rgba(255,51,102,0.25)", label: "HIGH" },
  Medium: { color: "#ffaa00", bg: "rgba(255,170,0,0.08)", border: "rgba(255,170,0,0.25)", label: "MED" },
  Low: { color: "#00ff88", bg: "rgba(0,255,136,0.08)", border: "rgba(0,255,136,0.25)", label: "LOW" },
};

/* ================================================================== */
/*  Icons (lucide-style strokes, inline, zero new deps)                 */
/* ================================================================== */
const Icon = {
  Brain: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44A2.5 2.5 0 0 1 4.5 17a2.5 2.5 0 0 1-2.4-3.04A2.5 2.5 0 0 1 3 9.5a2.5 2.5 0 0 1 1.5-4.41A2.5 2.5 0 0 1 7 2.5a2.5 2.5 0 0 1 2.5-.5Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44A2.5 2.5 0 0 0 19.5 17a2.5 2.5 0 0 0 2.4-3.04A2.5 2.5 0 0 0 21 9.5a2.5 2.5 0 0 0-1.5-4.41A2.5 2.5 0 0 0 17 2.5a2.5 2.5 0 0 0-2.5-.5Z" />
    </svg>
  ),
  FileEdit: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" /><path d="m12 13.5 2 2L18.5 11l-2-2L12 13.5Z" />
    </svg>
  ),
  Calendar: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  UploadCloud: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 32} height={p.size ?? 32} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 16l-4-4-4 4" /><path d="M12 12v9" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  ),
  ListChecks: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 7 2 2 4-4" /><path d="m3 17 2 2 4-4" /><path d="M13 6h8M13 18h8M13 12h8" />
    </svg>
  ),
  Clock: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
    </svg>
  ),
  Sliders: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" />
      <path d="M1 14h6M9 8h6M17 16h6" />
    </svg>
  ),
  Target: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" />
    </svg>
  ),
  Shield: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" />
    </svg>
  ),
  Bolt: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 3 14h7l-1 8 10-12h-7z" />
    </svg>
  ),
  Lock: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
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

const FLOAT_SYMBOLS = ["⚡", "✓", "#", "%"];

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
          className="revision-symbol-float"
          style={{
            position: "absolute",
            left: `${s.left}%`,
            top: `${s.top}%`,
            fontSize: `${s.size}px`,
            fontFamily: "var(--font-jetbrains-mono, monospace)",
            color: "#FFB000",
            opacity: 0.1,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
            textShadow: "0 0 14px rgba(255,176,0,0.5)",
          }}
        >
          {s.char}
        </span>
      ))}
      <style jsx global>{`
        @keyframes revisionFloatWander {
          0% { transform: translate(0,0) rotate(0deg); }
          25% { transform: translate(36px,-54px) rotate(12deg); }
          50% { transform: translate(-26px,-98px) rotate(-9deg); }
          75% { transform: translate(52px,-36px) rotate(7deg); }
          100% { transform: translate(0,0) rotate(0deg); }
        }
        .revision-symbol-float {
          animation-name: revisionFloatWander;
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
    { n: 1, icon: Icon.UploadCloud, title: "Upload PDF", desc: "Upload your study material (PDF format)." },
    { n: 2, icon: Icon.Brain, title: "AI Analysis", desc: "AI scans your content and identifies weak topics." },
    { n: 3, icon: Icon.Target, title: "Generate Plan", desc: "Get a focused revision plan to improve efficiently." },
  ];

  return (
    <aside className="hidden lg:flex flex-col shrink-0 sticky top-0 h-screen" style={{ width: 300 }}>
      <div
        className="flex flex-col h-full m-4 rounded-2xl overflow-y-auto"
        style={{
          background: "rgba(18,10,2,0.8)",
          border: "1px solid rgba(255,176,0,0.18)",
          boxShadow: "0 0 40px rgba(255,176,0,0.04), inset 0 1px 0 rgba(255,255,255,0.03)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Brand */}
        <div className="px-6 pt-8 pb-7" style={{ borderBottom: "1px solid rgba(255,176,0,0.1)" }}>
          <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, color: "#8a5a2a", letterSpacing: "0.08em" }}>
            // AGENT_05
          </span>
          <div className="mt-3 mb-3">
            <div
              className="flex items-center justify-center"
              style={{
                width: 56,
                height: 56,
                clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                background: "rgba(255,176,0,0.1)",
                border: "1px solid rgba(255,176,0,0.35)",
                boxShadow: "0 0 20px rgba(255,176,0,0.2)",
              }}
            >
              <Icon.Brain size={24} color="#FFB000" />
            </div>
          </div>
          <h1
            className="font-black text-xl leading-tight tracking-tight mb-3"
            style={{
              fontFamily: "var(--font-orbitron, sans-serif)",
              background: "linear-gradient(135deg, #FFB000, #ffffff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            REVISION AGENT
          </h1>
          <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 14.5, lineHeight: 1.5, color: "#a87a3a" }}>
            Identify weak topics and generate a focused revision plan.
          </p>
        </div>

        {/* Nav */}
        <div className="px-4 pt-7">
          <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 10.5, letterSpacing: "0.12em", color: "#8a5a2a", paddingLeft: 12 }}>
            NAVIGATION
          </span>
          <nav className="mt-3 flex flex-col gap-2">
            {[
              { label: "Configure Revision", sub: "Upload PDF & set options", icon: Icon.FileEdit, active: step <= 2 },
              { label: "My Revision Plan", sub: "View your plan", icon: Icon.Calendar, active: step === 3 },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-start gap-3 px-4 py-3.5 rounded-xl transition-all duration-300"
                style={{
                  background: item.active ? "linear-gradient(135deg, rgba(255,176,0,0.14), rgba(255,176,0,0.03))" : "transparent",
                  borderLeft: item.active ? "3px solid #FFB000" : "3px solid transparent",
                  boxShadow: item.active ? "0 0 24px rgba(255,176,0,0.08)" : "none",
                }}
              >
                <item.icon size={17} color={item.active ? "#FFB000" : "#7a5a2a"} />
                <div>
                  <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 15, fontWeight: 700, color: item.active ? "#fff4e0" : "#a87a3a" }}>
                    {item.label}
                  </p>
                  <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 12.5, color: "#7a5a2a" }}>
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
            style={{ background: "rgba(255,176,0,0.03)", border: "1px solid rgba(255,176,0,0.1)" }}
          >
            <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 10.5, letterSpacing: "0.1em", color: "#FFB000" }}>
              HOW IT WORKS
            </span>
            <div className="mt-4 space-y-4">
              {steps.map((s) => (
                <div key={s.n} className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "rgba(255,176,0,0.08)", border: "1px solid rgba(255,176,0,0.2)" }}
                  >
                    <s.icon size={14} color="#FFB000" />
                  </div>
                  <div>
                    <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 14, fontWeight: 700, color: "#fff4e0" }}>
                      {s.n}. {s.title}
                    </p>
                    <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 12.5, color: "#a87a3a", lineHeight: 1.4, marginTop: 2 }}>
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
            style={{ background: "rgba(255,176,0,0.05)", border: "1px solid rgba(255,176,0,0.15)" }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
              style={{
                fontFamily: "var(--font-orbitron, sans-serif)",
                background: "linear-gradient(135deg, #FFA500, #cc7700)",
                color: "#020812",
                boxShadow: "0 0 18px rgba(255,176,0,0.45)",
              }}
            >
              N
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, color: "#cba36a" }}>AGENT_05</p>
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
    { n: 1, label: "SELECT DOCUMENT", sub: "Upload your study material" },
    { n: 2, label: "SET PREFERENCES", sub: "Choose weak topics & options" },
    { n: 3, label: "GENERATE PLAN", sub: "AI creates your plan" },
  ];

  return (
    <div
      className="flex items-center justify-between mb-9 px-7 py-6 rounded-3xl"
      style={{
        background: "linear-gradient(160deg, rgba(20,12,2,0.7), rgba(10,6,1,0.85))",
        border: "1px solid rgba(255,176,0,0.16)",
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
                  background: active || done ? "linear-gradient(135deg, #FFA500, #cc7700)" : "rgba(255,176,0,0.06)",
                  color: active || done ? "#020812" : "#8a5a2a",
                  boxShadow: active ? "0 0 24px rgba(255,176,0,0.6)" : "none",
                  border: active || done ? "none" : "1px solid rgba(255,176,0,0.2)",
                }}
              >
                {done ? <Icon.Check size={17} color="#020812" /> : s.n}
              </div>
              <div className="hidden md:block" style={{ maxWidth: 190 }}>
                <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 14, fontWeight: 700, color: active ? "#fff4e0" : done ? "#cba36a" : "#8a5a2a" }}>
                  {s.label}
                </p>
                <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 12.5, color: "#7a5a2a", lineHeight: 1.35 }}>
                  {s.sub}
                </p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div
                className="h-px mx-5 transition-all duration-500 hidden sm:block"
                style={{ flex: 1, minWidth: 24, background: done ? "linear-gradient(90deg, #FFB000, rgba(255,176,0,0.25))" : "rgba(255,176,0,0.14)" }}
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
        background: "linear-gradient(160deg, rgba(22,14,3,0.7), rgba(10,6,1,0.85))",
        border: "1px solid rgba(255,176,0,0.16)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)",
        backdropFilter: "blur(16px)",
      }}
    >
      {children}
    </div>
  );
}

/* ================================================================== */
/*  Weak topic card (logic untouched, re-themed)                         */
/* ================================================================== */
function WeakTopicCard({ topic, index }: { topic: WeakTopic; index: number }) {
  const [open, setOpen] = useState(false);
  const pc = priorityConfig[topic.priority] || priorityConfig.Medium;

  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-300" style={{
      background: "linear-gradient(135deg, rgba(255,51,102,0.03), rgba(10,6,1,0.9))",
      border: `1px solid rgba(255,51,102,0.12)`,
    }}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
        <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, color: "#ff3366", opacity: 0.6, flexShrink: 0 }}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="flex-1 text-left min-w-0">
          <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontWeight: 700, fontSize: 15, color: "#fff4e0" }}>{topic.topic}</p>
          <p className="truncate" style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11.5, color: "#7a5a3a", marginTop: 2 }}>{topic.reason}</p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="px-2.5 py-1 rounded" style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, color: pc.color, background: pc.bg, border: `1px solid ${pc.border}` }}>
            {pc.label}
          </span>
          <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11.5, color: "#7a5a2a" }}>⏱ {topic.revision_time}</span>
          <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, color: "#ff3366", opacity: 0.4 }}>
            {open ? "[ − ]" : "[ + ]"}
          </span>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4">
          <div>
            <p style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, color: "#60a5fa", opacity: 0.8, marginBottom: 8 }}>// KEY_POINTS</p>
            <ul className="space-y-1.5">
              {topic.key_points.map((pt, i) => (
                <li key={i} className="flex items-start gap-2" style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 14.5, color: "#a87a5a" }}>
                  <span style={{ color: "#60a5fa" }}>›</span> {pt}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, color: "#a78bfa", opacity: 0.8, marginBottom: 8 }}>// PRACTICE_QUESTIONS</p>
            <ul className="space-y-2">
              {topic.practice_questions.map((q, i) => (
                <li key={i} className="flex items-start gap-2 px-3.5 py-2.5 rounded-xl" style={{
                  background: "rgba(167,139,250,0.04)", border: "1px solid rgba(167,139,250,0.12)"
                }}>
                  <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11.5, color: "#a78bfa", marginTop: 2, flexShrink: 0 }}>Q{i + 1}.</span>
                  <span style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 14.5, color: "#a87a5a" }}>{q}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-start gap-2.5 px-4 py-3.5 rounded-xl" style={{
            background: "rgba(255,176,0,0.05)", border: "1px solid rgba(255,176,0,0.15)"
          }}>
            <span className="text-xs">💡</span>
            <div>
              <p style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, color: "#FFB000", opacity: 0.7, marginBottom: 3 }}>REVISION_TIP</p>
              <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 14, color: "#a8825a" }}>{topic.revision_tip}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Main page                                                            */
/* ================================================================== */
export default function RevisionPage() {
  const [user] = useAuthState(auth);

  // ---- preserved state / logic ----
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState("");
  const [weakInput, setWeakInput] = useState("");
  const [revision, setRevision] = useState<RevisionContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [docsLoading, setDocsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---- new: upload UI state ----
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const step: 1 | 2 | 3 = revision ? 3 : selectedDoc ? 2 : 1;

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
    setLoading(true); setError(null); setRevision(null);
    const weak = weakInput.split(",").map(t => t.trim()).filter(Boolean);
    try {
      const res = await fetch(`${API_BASE}/api/revision/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: selectedDoc, user_id: user?.uid || "test_user", weak_topics: weak }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed.");
      setRevision(data.revision);
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
    <div className="min-h-screen flex" style={{ background: "radial-gradient(circle at 20% 0%, #2a1a05 0%, #0a0601 55%)" }}>
      <FloatingSymbols />
      <Sidebar step={step} />

      <div className="flex-1 relative min-w-0" style={{ zIndex: 1 }}>
        <div
          className="min-h-screen"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,176,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,176,0,0.03) 1px, transparent 1px)",
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
                    style={{ background: "rgba(255,176,0,0.1)", border: "1px solid rgba(255,176,0,0.3)" }}
                  >
                    <Icon.FileEdit size={20} color="#FFB000" />
                  </div>
                  <div>
                    <h2
                      className="font-black tracking-tight mb-2"
                      style={{
                        fontFamily: "var(--font-orbitron, sans-serif)",
                        fontSize: 28,
                        background: "linear-gradient(135deg, #FFB000, #ffffff)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      CONFIGURE REVISION
                    </h2>
                    <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 16, color: "#a87a3a" }}>
                      Upload your PDF and let AI create a focused revision plan.
                    </p>
                  </div>
                </div>
                <div
                  className="hidden sm:flex w-14 h-14 rounded-2xl items-center justify-center shrink-0"
                  style={{ background: "rgba(255,176,0,0.06)", border: "1px solid rgba(255,176,0,0.2)" }}
                >
                  <Icon.FileEdit size={24} color="#FFB000" />
                </div>
              </div>
            </GlassCard>

            {/* ---- Step tracker ---- */}
            <StepTracker step={step} />

            {!revision && (
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
                      minHeight: 400,
                      margin: "44px auto",
                      borderRadius: 30,
                      border: `2px dashed ${isDragging ? "#FFB000" : "rgba(255,176,0,0.3)"}`,
                      background: isDragging
                        ? "rgba(255,176,0,0.08)"
                        : "linear-gradient(160deg, rgba(255,176,0,0.04), rgba(10,6,1,0.4))",
                      boxShadow: isDragging ? "0 0 56px rgba(255,176,0,0.3)" : "none",
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
                      style={{ background: "rgba(255,176,0,0.1)", border: "1px solid rgba(255,176,0,0.32)", boxShadow: "0 0 28px rgba(255,176,0,0.18)" }}
                    >
                      {uploading ? (
                        <span className="inline-block w-7 h-7 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: "#FFB000" }} />
                      ) : (
                        <Icon.UploadCloud size={32} color="#FFB000" />
                      )}
                    </div>

                    <p className="font-bold mb-2.5" style={{ fontFamily: "var(--font-orbitron, sans-serif)", fontSize: 19, color: "#fff4e0" }}>
                      {uploading ? "UPLOADING DOCUMENT..." : "UPLOAD YOUR PDF"}
                    </p>
                    <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 16, color: "#a87a3a", marginBottom: 30 }}>
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
                        background: "linear-gradient(90deg, #FFA500, #FFB000)",
                        boxShadow: "0 0 28px rgba(255,176,0,0.4)",
                      }}
                    >
                      <Icon.UploadCloud size={16} color="#020812" />
                      CHOOSE PDF FILE
                    </button>

                    <div className="flex items-center gap-1.5 mt-7">
                      <span style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 14.5, color: "#7a5a2a" }}>
                        Supports PDF files up to 100MB
                      </span>
                      <Icon.Info size={14} color="#7a5a2a" />
                    </div>
                  </div>
                </GlassCard>

                {uploadError && (
                  <div className="mb-9 px-5 py-4 rounded-2xl" style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12.5, background: "rgba(255,51,102,0.08)", border: "1px solid rgba(255,51,102,0.2)", color: "#ff3366" }}>
                    ⚠ {uploadError}
                  </div>
                )}

                {/* ---- Revision preferences card ---- */}
                <GlassCard className="mb-9" padding="p-8">
                  <div className="flex items-center gap-3 mb-7">
                    <Icon.Sliders size={16} color="#FFB000" />
                    <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, letterSpacing: "0.08em", color: "#FFB000", opacity: 0.8 }}>
                      REVISION PREFERENCES
                    </span>
                    <div className="flex-1 h-px" style={{ background: "rgba(255,176,0,0.12)" }} />
                  </div>

                  {docsLoading ? (
                    <p style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 14, color: "#7a5a2a" }}>
                      <span className="cursor-blink">█</span> LOADING DOCUMENTS...
                    </p>
                  ) : documents.length === 0 ? (
                    <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 16, color: "#a87a3a" }}>
                      No documents yet. Upload a PDF above to get started.
                    </p>
                  ) : (
                    <div className="space-y-6">
                      <select
                        value={selectedDoc}
                        onChange={(e) => setSelectedDoc(e.target.value)}
                        className="w-full outline-none"
                        style={{
                          fontFamily: "var(--font-rajdhani, sans-serif)",
                          fontSize: 15.5,
                          padding: "15px 18px",
                          borderRadius: 14,
                          background: "rgba(10,6,1,0.7)",
                          border: "1px solid rgba(255,176,0,0.2)",
                          color: "#fff4e0",
                        }}
                      >
                        <option value="">-- SELECT DOCUMENT --</option>
                        {documents.map((d) => <option key={d._id} value={d._id}>{d.filename}</option>)}
                      </select>

                      {/* Weak topics */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Icon.ListChecks size={14} color="#FFB000" />
                          <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 14.5, fontWeight: 700, color: "#fff4e0" }}>
                            Weak Topics <span style={{ fontWeight: 400, color: "#7a5a2a" }}>(optional)</span>
                          </p>
                        </div>
                        <input
                          type="text"
                          value={weakInput}
                          onChange={(e) => setWeakInput(e.target.value)}
                          placeholder="e.g. Functions, OOP, Exception Handling"
                          className="w-full outline-none transition-colors"
                          style={{
                            fontFamily: "var(--font-rajdhani, sans-serif)",
                            fontSize: 15,
                            padding: "13px 16px",
                            borderRadius: 12,
                            background: "rgba(10,6,1,0.7)",
                            border: "1px solid rgba(255,176,0,0.16)",
                            color: "#fff4e0",
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = "rgba(255,176,0,0.5)"}
                          onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,176,0,0.16)"}
                        />
                        <p style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11.5, color: "#5a4a2a", marginTop: 8 }}>
                          // Leave empty → AI identifies weak topics automatically
                        </p>
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
                          background: !selectedDoc || loading ? "rgba(255,176,0,0.1)" : "linear-gradient(90deg, #FFA500, #FFB000)",
                          border: "1px solid rgba(255,176,0,0.4)",
                          color: !selectedDoc || loading ? "#6a4a2a" : "#020812",
                          boxShadow: !selectedDoc || loading ? "none" : "0 0 28px rgba(255,176,0,0.4)",
                        }}
                      >
                        {loading ? (
                          <>
                            <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ANALYZING...
                          </>
                        ) : (
                          <>
                            <Icon.Target size={15} color="#020812" />
                            GENERATE REVISION PLAN
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-9">
                  {[
                    { icon: Icon.Brain, title: "Smart AI Analysis", desc: "AI scans your document line-by-line for accurate results." },
                    { icon: Icon.Bolt, title: "Focused & Efficient", desc: "Get a focused plan that saves time and improves productivity." },
                    { icon: Icon.Lock, title: "Private & Secure", desc: "Your documents are safe and never shared with anyone." },
                  ].map((f) => (
                    <GlassCard key={f.title} padding="p-6" className="transition-all duration-300 hover:scale-[1.02]">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                        style={{ background: "rgba(255,176,0,0.1)", border: "1px solid rgba(255,176,0,0.25)" }}
                      >
                        <f.icon size={19} color="#FFB000" />
                      </div>
                      <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 17, fontWeight: 700, color: "#fff4e0", marginBottom: 6 }}>
                        {f.title}
                      </p>
                      <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 14.5, color: "#a87a3a", lineHeight: 1.5 }}>
                        {f.desc}
                      </p>
                    </GlassCard>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-2 mb-2">
                  <Icon.Info size={14} color="#7a5a2a" />
                  <span style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 14.5, color: "#7a5a2a" }}>
                    Make sure your PDF is clear and readable for best results.
                  </span>
                </div>
              </>
            )}

            {/* ---- Loading skeleton ---- */}
            {loading && (
              <div className="space-y-4 animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-2xl" style={{ height: 80, background: "rgba(255,176,0,0.03)", border: "1px solid rgba(255,176,0,0.06)" }} />
                ))}
              </div>
            )}

            {/* ---- Revision output ---- */}
            {revision && !loading && (
              <div className="space-y-9">
                <GlassCard padding="p-7">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <h2 style={{ fontFamily: "var(--font-orbitron, sans-serif)", fontSize: 15, fontWeight: 700, color: "#FFB000" }}>
                        {revision.revision_title.toUpperCase()}
                      </h2>
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, color: "#7a5a2a" }}>⚠ {revision.total_topics} WEAK TOPICS</span>
                        <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, color: "#7a5a2a" }}>⏱ {revision.estimated_time}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => { setRevision(null); setSelectedDoc(""); setWeakInput(""); }}
                      className="flex items-center gap-2 transition-all duration-200 hover:scale-[1.03]"
                      style={{
                        fontFamily: "var(--font-orbitron, sans-serif)",
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "10px 20px",
                        borderRadius: 12,
                        background: "rgba(255,176,0,0.1)",
                        border: "1px solid rgba(255,176,0,0.3)",
                        color: "#FFB000",
                      }}
                    >
                      <Icon.Refresh size={13} color="#FFB000" />
                      NEW PLAN
                    </button>
                  </div>
                </GlassCard>

                {/* Weak topics */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, color: "#ff3366", opacity: 0.7 }}>
                      // WEAK_TOPICS_IDENTIFIED
                    </span>
                    <div className="flex-1 h-px" style={{ background: "rgba(255,51,102,0.1)" }} />
                  </div>
                  <div className="space-y-3">
                    {revision.weak_topics.map((t, i) => <WeakTopicCard key={i} topic={t} index={i} />)}
                  </div>
                </div>

                {/* Revision schedule */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, color: "#60a5fa", opacity: 0.7 }}>
                      // REVISION_SCHEDULE
                    </span>
                    <div className="flex-1 h-px" style={{ background: "rgba(96,165,250,0.1)" }} />
                  </div>
                  <div className="space-y-2.5">
                    {revision.revision_schedule.map((s, i) => (
                      <div key={i} className="flex items-center gap-4 px-5 py-4 rounded-2xl" style={{
                        background: "rgba(96,165,250,0.04)", border: "1px solid rgba(96,165,250,0.12)"
                      }}>
                        <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black"
                          style={{ fontFamily: "var(--font-orbitron, sans-serif)", fontSize: 14, background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.25)", color: "#60a5fa" }}>
                          {s.session}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontWeight: 700, fontSize: 15, color: "#fff4e0" }}>{s.topic}</p>
                          <p className="truncate" style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11.5, color: "#5a7a9a" }}>{s.activity}</p>
                        </div>
                        <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11.5, color: "#5a7a9a", flexShrink: 0 }}>⏱ {s.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* General tips */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, color: "#00ff88", opacity: 0.7 }}>
                      // GENERAL_TIPS
                    </span>
                    <div className="flex-1 h-px" style={{ background: "rgba(0,255,136,0.1)" }} />
                  </div>
                  <div className="space-y-2.5">
                    {revision.general_tips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-3 px-4 py-3.5 rounded-xl" style={{
                        background: "rgba(0,255,136,0.03)", border: "1px solid rgba(0,255,136,0.1)"
                      }}>
                        <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11.5, color: "#00ff88", opacity: 0.6, marginTop: 2, flexShrink: 0 }}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 15, color: "#7a9a8a" }}>{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}