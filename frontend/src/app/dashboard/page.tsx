"use client";

import type { ReactElement } from "react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const agents = [
  {
    href: "/dashboard/notes",
    label: "Notes Agent",
    tag: "01",
    description: "Extract key points, definitions and smart notes instantly.",
    color: "#00d4ff",
    glow: "rgba(0,212,255,0.2)",
    border: "rgba(0,212,255,0.3)",
  },
  {
    href: "/dashboard/quiz",
    label: "Quiz Agent",
    tag: "02",
    description: "Generate MCQs with multiple difficulty levels and explanations.",
    color: "#C77DFF",
    glow: "rgba(157,78,221,0.2)",
    border: "rgba(157,78,221,0.3)",
  },
  {
    href: "/dashboard/doubt",
    label: "Doubt Agent",
    tag: "03",
    description: "Ask doubts and get intelligent answers from your document.",
    color: "#00D9FF",
    glow: "rgba(0,217,255,0.2)",
    border: "rgba(0,217,255,0.3)",
  },
  {
    href: "/dashboard/planner",
    label: "Planner Agent",
    tag: "04",
    description: "Create personalized day-by-day study schedules.",
    color: "#00FF9C",
    glow: "rgba(0,255,156,0.2)",
    border: "rgba(0,255,156,0.3)",
  },
  {
    href: "/dashboard/revision",
    label: "Revision Agent",
    tag: "05",
    description: "Identify weak topics and generate focused revision plans.",
    color: "#FFB000",
    glow: "rgba(255,176,0,0.2)",
    border: "rgba(255,176,0,0.3)",
  },
];

/* ================================================================== */
/*  Icons (lucide-style strokes, inline, zero new deps)                 */
/* ================================================================== */
const Icon = {
  ArrowLeft: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  ),
  Brain: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 22} height={p.size ?? 22} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44A2.5 2.5 0 0 1 4.5 17a2.5 2.5 0 0 1-2.4-3.04A2.5 2.5 0 0 1 3 9.5a2.5 2.5 0 0 1 1.5-4.41A2.5 2.5 0 0 1 7 2.5a2.5 2.5 0 0 1 2.5-.5Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44A2.5 2.5 0 0 0 19.5 17a2.5 2.5 0 0 0 2.4-3.04A2.5 2.5 0 0 0 21 9.5a2.5 2.5 0 0 0-1.5-4.41A2.5 2.5 0 0 0 17 2.5a2.5 2.5 0 0 0-2.5-.5Z" />
    </svg>
  ),
  Book: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 26} height={p.size ?? 26} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  MessageSquare: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 26} height={p.size ?? 26} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Calendar: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 26} height={p.size ?? 26} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  FileEdit: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 26} height={p.size ?? 26} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" /><path d="m12 13.5 2 2L18.5 11l-2-2L12 13.5Z" />
    </svg>
  ),
  ArrowRight: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 14} height={p.size ?? 14} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  ),
  FileText: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" /><path d="M9 13h6M9 17h6M9 9h2" />
    </svg>
  ),
  UploadCloud: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 32} height={p.size ?? 32} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 16l-4-4-4 4" /><path d="M12 12v9" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  ),
  CheckCircle: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 26} height={p.size ?? 26} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
    </svg>
  ),
  Users: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 14} height={p.size ?? 14} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Cpu: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 14} height={p.size ?? 14} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" />
    </svg>
  ),
  Database: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 14} height={p.size ?? 14} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14a9 3 0 0 0 18 0V5" /><path d="M3 12a9 3 0 0 0 18 0" />
    </svg>
  ),
  Wifi: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 14} height={p.size ?? 14} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0" /><circle cx="12" cy="20" r="1" />
    </svg>
  ),
  LogOut: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" />
    </svg>
  ),
};

const iconForAgent: Record<string, (p: { size?: number; color?: string }) => ReactElement> = {
  "Notes Agent": Icon.Book,
  "Quiz Agent": Icon.Brain,
  "Doubt Agent": Icon.MessageSquare,
  "Planner Agent": Icon.Calendar,
  "Revision Agent": Icon.FileEdit,
};

/* ================================================================== */
/*  Floating symbols background                                        */
/* ================================================================== */
const FLOAT_SYMBOLS = ["•", "⬡", "AI", "PDF"];

function FloatingSymbols() {
  const [mounted, setMounted] = useState(false);
  const [symbols, setSymbols] = useState<
    { id: number; char: string; left: number; top: number; duration: number; delay: number; size: number }[]
  >([]);

  useEffect(() => {
    setSymbols(
      Array.from({ length: 16 }).map((_, i) => ({
        id: i,
        char: FLOAT_SYMBOLS[Math.floor(Math.random() * FLOAT_SYMBOLS.length)],
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: 20 + Math.random() * 16,
        delay: Math.random() * 8,
        size: 12 + Math.random() * 14,
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
          className="dash-symbol-float"
          style={{
            position: "absolute",
            left: `${s.left}%`,
            top: `${s.top}%`,
            fontSize: `${s.size}px`,
            fontFamily: "var(--font-jetbrains-mono, monospace)",
            color: "#00d4ff",
            opacity: 0.08,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
            textShadow: "0 0 14px rgba(0,212,255,0.5)",
          }}
        >
          {s.char}
        </span>
      ))}
      <style jsx global>{`
        @keyframes dashFloatWander {
          0% { transform: translate(0,0) rotate(0deg); }
          25% { transform: translate(36px,-54px) rotate(12deg); }
          50% { transform: translate(-26px,-98px) rotate(-9deg); }
          75% { transform: translate(52px,-36px) rotate(7deg); }
          100% { transform: translate(0,0) rotate(0deg); }
        }
        .dash-symbol-float {
          animation-name: dashFloatWander;
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
function Sidebar({ router }: { router: ReturnType<typeof useRouter> }) {
  const steps = [
    { n: 1, icon: Icon.FileText, title: "Upload Document", desc: "Upload your PDF or study material." },
    { n: 2, icon: Icon.Cpu, title: "AI Processing", desc: "Agents analyze and understand content." },
    { n: 3, icon: Icon.CheckCircle, title: "Get Results", desc: "Get smart notes, quizzes, plans and more." },
  ];

  return (
    <aside className="hidden lg:flex flex-col shrink-0 sticky top-0 h-screen" style={{ width: 280 }}>
      <div
        className="flex flex-col h-full m-4 rounded-2xl overflow-y-auto"
        style={{
          background: "rgba(5,11,24,0.8)",
          border: "1px solid rgba(0,212,255,0.16)",
          boxShadow: "0 0 40px rgba(0,212,255,0.04), inset 0 1px 0 rgba(255,255,255,0.03)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="px-6 pt-6 pb-2">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300"
            style={{
              fontFamily: "var(--font-rajdhani, sans-serif)",
              fontSize: 14,
              fontWeight: 700,
              background: "rgba(0,212,255,0.06)",
              border: "1px solid rgba(0,212,255,0.2)",
              color: "#00d4ff",
            }}
          >
            <Icon.ArrowLeft size={15} color="#00d4ff" />
            BACK
          </button>
        </div>

        <div className="px-6 pt-6 pb-7" style={{ borderBottom: "1px solid rgba(0,212,255,0.1)" }}>
          <div className="mb-4">
            <div
              className="flex items-center justify-center"
              style={{
                width: 60,
                height: 60,
                clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                background: "linear-gradient(135deg, rgba(0,212,255,0.14), rgba(167,139,250,0.1))",
                border: "1px solid rgba(0,212,255,0.35)",
                boxShadow: "0 0 24px rgba(0,212,255,0.2)",
              }}
            >
              <Icon.Brain size={26} color="#00d4ff" />
            </div>
          </div>
          <h1
            className="font-black text-xl leading-tight tracking-tight mb-3"
            style={{
              fontFamily: "var(--font-orbitron, sans-serif)",
              background: "linear-gradient(135deg, #00d4ff, #ffffff, #a78bfa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            NeuroStudy AI
          </h1>
          <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 14.5, lineHeight: 1.5, color: "#4a7a9b" }}>
            Your intelligent learning companion powered by advanced AI agents.
          </p>
        </div>

        <div className="px-6 pt-7 flex-1">
          <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 10.5, letterSpacing: "0.12em", color: "#2a5a7a" }}>
            HOW IT WORKS
          </span>
          <div className="mt-4 space-y-5">
            {steps.map((s, i) => (
              <div key={s.n} className="flex items-start gap-3.5 relative">
                {i < steps.length - 1 && (
                  <div
                    className="absolute left-[19px] top-[40px] w-px"
                    style={{ height: 36, background: "linear-gradient(180deg, rgba(0,212,255,0.3), transparent)" }}
                  />
                )}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.22)" }}
                >
                  <s.icon size={17} color="#00d4ff" />
                </div>
                <div>
                  <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 14.5, fontWeight: 700, color: "#e8f4fd" }}>
                    {s.n}. {s.title}
                  </p>
                  <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 12.5, color: "#4a7a9b", lineHeight: 1.4, marginTop: 2 }}>
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 pb-6 pt-6 mt-auto">
          <div
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl"
            style={{ background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.15)" }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
              style={{
                fontFamily: "var(--font-orbitron, sans-serif)",
                background: "linear-gradient(135deg, #00d4ff, #a78bfa)",
                color: "#020812",
                boxShadow: "0 0 18px rgba(0,212,255,0.45)",
              }}
            >
              N
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, color: "#8ab4cc" }}>NeuroStudy AI</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#00ff88", boxShadow: "0 0 8px #00ff88" }} />
                <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 10.5, color: "#00ff88", letterSpacing: "0.04em" }}>ALL SYSTEMS ONLINE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ================================================================== */
/*  Agent card — FIXED dimensions, no stretch, no flex-grow on self      */
/* ================================================================== */
function AgentCard({ agent }: { agent: typeof agents[number] }) {
  const AgentIcon = iconForAgent[agent.label] ?? Icon.Brain;

  return (
    <Link
      href={agent.href}
      className="group relative rounded-3xl flex flex-col transition-all duration-300 hover:-translate-y-1.5"
      style={{
        background: "linear-gradient(160deg, rgba(13,24,42,0.7), rgba(5,11,24,0.85))",
        border: `1px solid ${agent.border}`,
        boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)",
        backdropFilter: "blur(16px)",
        textDecoration: "none",
        padding: "26px 24px",
        height: 260,
        width: "100%",
        maxWidth: 360,
        minWidth: 280,
        margin: "0 auto",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 0 44px ${agent.glow}, 0 8px 32px rgba(0,0,0,0.3)`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)";
      }}
    >
      <div
        className="w-13 h-13 rounded-2xl flex items-center justify-center mb-4 shrink-0 transition-transform duration-300 group-hover:scale-110"
        style={{ width: 52, height: 52, background: agent.glow, border: `1px solid ${agent.border}` }}
      >
        <AgentIcon size={24} color={agent.color} />
      </div>

      <h3
        className="font-bold mb-1.5 shrink-0"
        style={{ fontFamily: "var(--font-orbitron, sans-serif)", fontSize: 17, color: agent.color, lineHeight: 1.2 }}
      >
        {agent.label}
      </h3>

      <span
        className="inline-block self-start px-2.5 py-1 rounded-full mb-3 shrink-0"
        style={{
          fontFamily: "var(--font-jetbrains-mono, monospace)",
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: "0.04em",
          background: agent.glow,
          color: agent.color,
        }}
      >
        AGENT {agent.tag}
      </span>

      <p
        className="overflow-hidden"
        style={{
          fontFamily: "var(--font-rajdhani, sans-serif)",
          fontSize: 14,
          color: "#7a9ab4",
          lineHeight: 1.5,
          flex: 1,
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
        }}
      >
        {agent.description}
      </p>

      <div
        className="flex items-center gap-1.5 mt-3 shrink-0 transition-all duration-300 group-hover:gap-2.5"
        style={{ fontFamily: "var(--font-orbitron, sans-serif)", fontSize: 11.5, fontWeight: 700, letterSpacing: "0.04em", color: agent.color }}
      >
        LAUNCH AGENT
        <Icon.ArrowRight size={12} color={agent.color} />
      </div>
    </Link>
  );
}

/* ================================================================== */
/*  Main dashboard page                                                  */
/* ================================================================== */
export default function DashboardPage() {
 
  const [user] = useAuthState(auth);
  const router = useRouter();

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut(auth);
      router.push("/");
    } catch {
      setLoggingOut(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (file.type !== "application/pdf") { setUploadError("Only PDF files are supported."); return; }
    if (file.size > 100 * 1024 * 1024) { setUploadError("File exceeds 100MB limit."); return; }
    setUploading(true); setUploadError(null); setUploadSuccess(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("user_id", user?.uid || "test_user");
      const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed.");
      setUploadSuccess(`"${file.name}" uploaded — ready for any agent.`);
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  return (
    <div className="min-h-screen flex" style={{ background: "radial-gradient(circle at 20% 0%, #0a1830 0%, #020812 55%)" }}>
      <FloatingSymbols />
      <Sidebar router={router} />

      <div className="flex-1 relative min-w-0" style={{ zIndex: 1 }}>
        <div
          className="min-h-screen"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        >
          <div className="mx-auto" style={{ maxWidth: 1280, padding: "48px 32px 56px", position: "relative" }}>

            {/* ---- Logout button (top right) ---- */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2 transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50"
              style={{
                position: "absolute",
                top: 32,
                right: 32,
                fontFamily: "var(--font-rajdhani, sans-serif)",
                fontSize: 14,
                fontWeight: 700,
                padding: "10px 18px",
                borderRadius: 12,
                background: "rgba(255,51,102,0.06)",
                border: "1px solid rgba(255,51,102,0.25)",
                color: "#ff3366",
                zIndex: 2,
              }}
            >
              {loggingOut ? (
                <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Icon.LogOut size={15} color="#ff3366" />
              )}
              {loggingOut ? "LOGGING OUT..." : "LOGOUT"}
            </button>

            {/* ---- Hero header ---- */}
            <div className="text-center" style={{ marginBottom: 48 }}>
              {user && (
                <div className="flex items-center justify-center gap-2 mb-5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#00ff88", boxShadow: "0 0 8px #00ff88" }} />
                  <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11.5, letterSpacing: "0.1em", color: "#00d4ff", opacity: 0.6 }}>
                    SYSTEM ONLINE · {(user.displayName || "STUDENT").toUpperCase()}
                  </span>
                </div>
              )}

              <h1
                className="font-black mb-3"
                style={{
                  fontFamily: "var(--font-orbitron, sans-serif)",
                  fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
                  background: "linear-gradient(135deg, #00d4ff 0%, #ffffff 45%, #a78bfa 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "-0.02em",
                }}
              >
                NeuroStudy AI
              </h1>

              <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 18, color: "#4a7a9b", lineHeight: 1.6, maxWidth: 560, margin: "0 auto" }}>
                Your intelligent learning companion powered by advanced AI agents
              </p>

              <div className="flex items-center justify-center gap-3 mt-7">
                <div className="h-px w-20" style={{ background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.5))" }} />
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-1 h-1 rounded-full" style={{ background: "#00d4ff", opacity: 0.3 + i * 0.3 }} />
                  ))}
                </div>
                <div className="h-px w-20" style={{ background: "linear-gradient(90deg, rgba(0,212,255,0.5), transparent)" }} />
              </div>
            </div>

            {/* ---- Agent cards grid: SINGLE grid, auto-fit produces 3-then-2 centered layout natively ---- */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 360px))",
                justifyContent: "center",
                gap: 24,
                marginBottom: 32,
              }}
            >
              {agents.map((agent) => <AgentCard key={agent.href} agent={agent} />)}
            </div>

            {/* ---- Shared upload card ---- */}
            <div
              className="rounded-3xl"
              style={{
                marginBottom: 32,
                width: "100%",
                background: "linear-gradient(160deg, rgba(13,24,42,0.7), rgba(5,11,24,0.85))",
                border: "1px solid rgba(0,212,255,0.16)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)",
                backdropFilter: "blur(16px)",
              }}
            >
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer transition-all duration-300 group mx-auto flex flex-col items-center justify-center text-center"
                style={{
                  width: "92%",
                  minHeight: 240,
                  margin: "32px auto",
                  borderRadius: 30,
                  border: `2px dashed ${isDragging ? "#00BFFF" : "rgba(0,191,255,0.28)"}`,
                  background: isDragging
                    ? "rgba(0,191,255,0.07)"
                    : "linear-gradient(160deg, rgba(0,191,255,0.03), rgba(5,11,24,0.4))",
                  boxShadow: isDragging ? "0 0 48px rgba(0,191,255,0.25)" : "none",
                  padding: "32px",
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
                  className="rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{ width: 64, height: 64, background: "rgba(0,191,255,0.1)", border: "1px solid rgba(0,191,255,0.3)", boxShadow: "0 0 24px rgba(0,191,255,0.16)" }}
                >
                  {uploading ? (
                    <span className="inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: "#00BFFF" }} />
                  ) : (
                    <Icon.UploadCloud size={28} color="#00BFFF" />
                  )}
                </div>

                <p className="font-bold mb-1.5" style={{ fontFamily: "var(--font-orbitron, sans-serif)", fontSize: 18, color: "#e8f4fd" }}>
                  {uploading ? "UPLOADING..." : "Upload PDF"}
                </p>
                <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 15, color: "#4a7a9b", marginBottom: 24 }}>
                  Add documents to power all agents
                </p>

                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  disabled={uploading}
                  className="flex items-center gap-2.5 transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50"
                  style={{
                    fontFamily: "var(--font-orbitron, sans-serif)",
                    fontSize: 12.5,
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    color: "#020812",
                    padding: "14px 32px",
                    borderRadius: 14,
                    background: "linear-gradient(90deg, #00BFFF, #00D9FF)",
                    boxShadow: "0 0 24px rgba(0,191,255,0.4)",
                  }}
                >
                  <Icon.UploadCloud size={15} color="#020812" />
                  CHOOSE PDF FILE
                </button>

                <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 13.5, color: "#3a6a8a", marginTop: 18 }}>
                  or drag and drop your file here
                </p>
              </div>
            </div>

            {(uploadError || uploadSuccess) && (
              <div
                className="rounded-2xl"
                style={{
                  marginBottom: 32,
                  padding: "16px 20px",
                  fontFamily: "var(--font-jetbrains-mono, monospace)",
                  fontSize: 12.5,
                  background: uploadError ? "rgba(255,51,102,0.08)" : "rgba(0,255,136,0.05)",
                  border: `1px solid ${uploadError ? "rgba(255,51,102,0.2)" : "rgba(0,255,136,0.2)"}`,
                  color: uploadError ? "#ff3366" : "#00ff88",
                }}
              >
                {uploadError ? `⚠ ${uploadError}` : `✓ ${uploadSuccess}`}
              </div>
            )}

            {/* ---- Status bar ---- */}
            <div
              className="rounded-2xl flex items-center justify-center flex-wrap"
              style={{ padding: "16px 24px", gap: 32, background: "rgba(0,212,255,0.03)", border: "1px solid rgba(0,212,255,0.1)" }}
            >
              {[
                { label: "AGENTS", value: "05 ACTIVE", icon: Icon.Users },
                { label: "MODEL", value: "LLaMA 3.3", icon: Icon.Cpu },
                { label: "DATABASE", value: "MONGODB", icon: Icon.Database },
                { label: "STATUS", value: "ALL ONLINE", icon: Icon.Wifi },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2.5">
                  <s.icon size={14} color="#00d4ff" />
                  <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11.5, color: "#3a6a8a" }}>{s.label}:</span>
                  <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11.5, fontWeight: 700, color: s.label === "STATUS" ? "#00ff88" : "#00d4ff" }}>
                    {s.value}
                  </span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}