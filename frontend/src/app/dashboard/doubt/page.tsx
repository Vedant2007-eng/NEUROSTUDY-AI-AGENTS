"use client";

import { useState, useEffect, useRef } from "react";
import { auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Document { _id: string; filename: string; }
interface ChatMsg { role: "user" | "ai"; content: string; }

/* ================================================================== */
/*  Icons (lucide-style strokes, inline, zero new deps)                 */
/* ================================================================== */
const Icon = {
  HelpHex: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 20} height={p.size ?? 20} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" />
    </svg>
  ),
  FileText: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" /><path d="M9 13h6M9 17h6M9 9h2" />
    </svg>
  ),
  FileCheck: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" /><path d="m9 15 2 2 4-4" />
    </svg>
  ),
  MessageSquare: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Brain: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44A2.5 2.5 0 0 1 4.5 17a2.5 2.5 0 0 1-2.4-3.04A2.5 2.5 0 0 1 3 9.5a2.5 2.5 0 0 1 1.5-4.41A2.5 2.5 0 0 1 7 2.5a2.5 2.5 0 0 1 2.5-.5Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44A2.5 2.5 0 0 0 19.5 17a2.5 2.5 0 0 0 2.4-3.04A2.5 2.5 0 0 0 21 9.5a2.5 2.5 0 0 0-1.5-4.41A2.5 2.5 0 0 0 17 2.5a2.5 2.5 0 0 0-2.5-.5Z" />
    </svg>
  ),
  UploadCloud: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 32} height={p.size ?? 32} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 16l-4-4-4 4" /><path d="M12 12v9" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
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
  Info: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 14} height={p.size ?? 14} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
    </svg>
  ),
  Trash: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 13} height={p.size ?? 13} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
    </svg>
  ),
  Send: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
    </svg>
  ),
};

const FLOAT_SYMBOLS = ["?", "+", "!", "#"];

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
          className="doubt-symbol-float"
          style={{
            position: "absolute",
            left: `${s.left}%`,
            top: `${s.top}%`,
            fontSize: `${s.size}px`,
            fontFamily: "var(--font-jetbrains-mono, monospace)",
            color: "#00D9FF",
            opacity: 0.1,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
            textShadow: "0 0 14px rgba(0,217,255,0.5)",
          }}
        >
          {s.char}
        </span>
      ))}
      <style jsx global>{`
        @keyframes doubtFloatWander {
          0% { transform: translate(0,0) rotate(0deg); }
          25% { transform: translate(36px,-54px) rotate(12deg); }
          50% { transform: translate(-26px,-98px) rotate(-9deg); }
          75% { transform: translate(52px,-36px) rotate(7deg); }
          100% { transform: translate(0,0) rotate(0deg); }
        }
        .doubt-symbol-float {
          animation-name: doubtFloatWander;
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
function Sidebar({ hasDoc }: { hasDoc: boolean }) {
  const steps = [
    { n: 1, icon: Icon.FileCheck, title: "Upload PDF", desc: "Select a PDF document to get started." },
    { n: 2, icon: Icon.Brain, title: "AI Processing", desc: "Our AI reads and understands your document." },
    { n: 3, icon: Icon.HelpHex, title: "Ask & Get Answers", desc: "Ask any doubt and get clear explanations." },
  ];

  return (
    <aside className="hidden lg:flex flex-col shrink-0 sticky top-0 h-screen" style={{ width: 300 }}>
      <div
        className="flex flex-col h-full m-4 rounded-2xl overflow-y-auto"
        style={{
          background: "rgba(5,11,24,0.8)",
          border: "1px solid rgba(0,217,255,0.16)",
          boxShadow: "0 0 40px rgba(0,217,255,0.04), inset 0 1px 0 rgba(255,255,255,0.03)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Brand */}
        <div className="px-6 pt-8 pb-7" style={{ borderBottom: "1px solid rgba(0,217,255,0.1)" }}>
          <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, color: "#2a5a7a", letterSpacing: "0.08em" }}>
            // AGENT_03
          </span>
          <div className="mt-3 mb-3">
            <div
              className="flex items-center justify-center"
              style={{
                width: 56,
                height: 56,
                clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                background: "rgba(0,217,255,0.1)",
                border: "1px solid rgba(0,217,255,0.35)",
                boxShadow: "0 0 20px rgba(0,217,255,0.2)",
              }}
            >
              <Icon.HelpHex size={24} color="#00D9FF" />
            </div>
          </div>
          <h1
            className="font-black text-xl leading-tight tracking-tight mb-3"
            style={{
              fontFamily: "var(--font-orbitron, sans-serif)",
              background: "linear-gradient(135deg, #00D9FF, #ffffff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            DOUBT AGENT
          </h1>
          <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 14.5, lineHeight: 1.5, color: "#4a7a9b" }}>
            Upload your document and get instant answers to your doubts.
          </p>
        </div>

        {/* Nav */}
        <div className="px-4 pt-7">
          <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 10.5, letterSpacing: "0.12em", color: "#2a5a7a", paddingLeft: 12 }}>
            NAVIGATION
          </span>
          <nav className="mt-3 flex flex-col gap-2">
            {[
              { label: "Select Document", sub: "Upload your PDF to begin", icon: Icon.UploadCloud, active: !hasDoc },
              { label: "Ask Doubts", sub: "Get answers instantly", icon: Icon.MessageSquare, active: hasDoc },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-start gap-3 px-4 py-3.5 rounded-xl transition-all duration-300"
                style={{
                  background: item.active ? "linear-gradient(135deg, rgba(0,217,255,0.14), rgba(0,217,255,0.03))" : "transparent",
                  borderLeft: item.active ? "3px solid #00D9FF" : "3px solid transparent",
                  boxShadow: item.active ? "0 0 24px rgba(0,217,255,0.08)" : "none",
                }}
              >
                <item.icon size={17} color={item.active ? "#00D9FF" : "#3a6a8a"} />
                <div>
                  <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 15, fontWeight: 700, color: item.active ? "#eaf6ff" : "#4a7a9b" }}>
                    {item.label}
                  </p>
                  <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 12.5, color: "#3a6a8a" }}>
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
            style={{ background: "rgba(0,217,255,0.03)", border: "1px solid rgba(0,217,255,0.1)" }}
          >
            <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 10.5, letterSpacing: "0.1em", color: "#00D9FF" }}>
              HOW IT WORKS
            </span>
            <div className="mt-4 space-y-4">
              {steps.map((s) => (
                <div key={s.n} className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "rgba(0,217,255,0.08)", border: "1px solid rgba(0,217,255,0.2)" }}
                  >
                    <s.icon size={14} color="#00D9FF" />
                  </div>
                  <div>
                    <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 14, fontWeight: 700, color: "#eaf6ff" }}>
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
        </div>

        {/* Agent status */}
        <div className="px-4 pb-6 pt-6 mt-auto">
          <div
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl"
            style={{ background: "rgba(0,217,255,0.05)", border: "1px solid rgba(0,217,255,0.15)" }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
              style={{
                fontFamily: "var(--font-orbitron, sans-serif)",
                background: "linear-gradient(135deg, #00D9FF, #0066ff)",
                color: "#020812",
                boxShadow: "0 0 18px rgba(0,217,255,0.45)",
              }}
            >
              N
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, color: "#8ab4cc" }}>AGENT_03</p>
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
/*  Glass card wrapper                                                   */
/* ================================================================== */
function GlassCard({ children, className = "", padding = "p-8" }: { children: React.ReactNode; className?: string; padding?: string }) {
  return (
    <div
      className={`rounded-3xl ${padding} ${className}`}
      style={{
        background: "linear-gradient(160deg, rgba(8,18,32,0.7), rgba(2,8,18,0.85))",
        border: "1px solid rgba(0,217,255,0.14)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)",
        backdropFilter: "blur(16px)",
      }}
    >
      {children}
    </div>
  );
}

/* ================================================================== */
/*  Document selection screen (pre-chat)                                */
/* ================================================================== */
function SelectDocumentScreen({
  documents, docsLoading, selectedDoc, setSelectedDoc, setMessages,
  uploading, uploadError, isDragging, setIsDragging, onDrop, fileInputRef, onChooseFile,
}: {
  documents: Document[];
  docsLoading: boolean;
  selectedDoc: string;
  setSelectedDoc: (id: string) => void;
  setMessages: (m: ChatMsg[]) => void;
  uploading: boolean;
  uploadError: string | null;
  isDragging: boolean;
  setIsDragging: (b: boolean) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onChooseFile: (f: File) => void;
}) {
  return (
    <div className="mx-auto" style={{ maxWidth: 1280, padding: "48px 40px 64px" }}>
      {/* Header */}
      <GlassCard className="mb-9" padding="p-9">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(0,217,255,0.1)", border: "1px solid rgba(0,217,255,0.3)" }}
            >
              <Icon.FileText size={20} color="#00D9FF" />
            </div>
            <div>
              <h2
                className="font-black tracking-tight mb-2"
                style={{
                  fontFamily: "var(--font-orbitron, sans-serif)",
                  fontSize: 28,
                  background: "linear-gradient(135deg, #00D9FF, #ffffff)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                SELECT PDF TO BEGIN
              </h2>
              <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 16, color: "#4a7a9b" }}>
                Choose a document and let our AI help you solve your doubts.
              </p>
            </div>
          </div>
          <div
            className="hidden sm:flex w-14 h-14 rounded-2xl items-center justify-center shrink-0"
            style={{ background: "rgba(0,217,255,0.06)", border: "1px solid rgba(0,217,255,0.2)" }}
          >
            <Icon.FileText size={24} color="#00D9FF" />
          </div>
        </div>
      </GlassCard>

      {/* Upload hero */}
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
            border: `2px dashed ${isDragging ? "#00D9FF" : "rgba(0,217,255,0.28)"}`,
            background: isDragging
              ? "rgba(0,217,255,0.08)"
              : "linear-gradient(160deg, rgba(0,217,255,0.04), rgba(2,8,18,0.4))",
            boxShadow: isDragging ? "0 0 56px rgba(0,217,255,0.3)" : "none",
            padding: "0 40px",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onChooseFile(f); }}
          />

          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-7 transition-transform duration-300 group-hover:scale-110"
            style={{ background: "rgba(0,217,255,0.1)", border: "1px solid rgba(0,217,255,0.32)", boxShadow: "0 0 28px rgba(0,217,255,0.18)" }}
          >
            {uploading ? (
              <span className="inline-block w-7 h-7 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: "#00D9FF" }} />
            ) : (
              <Icon.UploadCloud size={32} color="#00D9FF" />
            )}
          </div>

          <p className="font-bold mb-2.5" style={{ fontFamily: "var(--font-orbitron, sans-serif)", fontSize: 19, color: "#eaf6ff" }}>
            {uploading ? "UPLOADING DOCUMENT..." : "SELECT A DOCUMENT TO BEGIN"}
          </p>
          <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 16, color: "#4a7a9b", marginBottom: 30 }}>
            Upload a PDF file to start asking doubts
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
              background: "linear-gradient(90deg, #00BFFF, #00D9FF)",
              boxShadow: "0 0 28px rgba(0,217,255,0.4)",
            }}
          >
            <Icon.UploadCloud size={16} color="#020812" />
            CHOOSE PDF FILE
          </button>

          <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 14.5, color: "#3a6a8a", marginTop: 20 }}>
            or drag and drop your file here
          </p>
        </div>
      </GlassCard>

      {uploadError && (
        <div className="mb-9 px-5 py-4 rounded-2xl" style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12.5, background: "rgba(255,51,102,0.08)", border: "1px solid rgba(255,51,102,0.2)", color: "#ff3366" }}>
          ⚠ {uploadError}
        </div>
      )}

      {/* Document picker (existing docs) */}
      <GlassCard className="mb-9" padding="p-7">
        <div className="flex items-center gap-3 mb-5">
          <Icon.FileText size={16} color="#00D9FF" />
          <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, letterSpacing: "0.08em", color: "#00D9FF", opacity: 0.75 }}>
            OR CHOOSE AN EXISTING DOCUMENT
          </span>
          <div className="flex-1 h-px" style={{ background: "rgba(0,217,255,0.12)" }} />
        </div>

        {docsLoading ? (
          <p style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 14, color: "#2a5a7a" }}>
            <span className="cursor-blink">█</span> LOADING DOCUMENTS...
          </p>
        ) : documents.length === 0 ? (
          <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 16, color: "#4a7a9b" }}>
            No documents yet. Upload a PDF above to get started.
          </p>
        ) : (
          <select
            value={selectedDoc}
            onChange={(e) => { setSelectedDoc(e.target.value); setMessages([]); }}
            className="w-full outline-none"
            style={{
              fontFamily: "var(--font-rajdhani, sans-serif)",
              fontSize: 15.5,
              padding: "15px 18px",
              borderRadius: 14,
              background: "rgba(2,8,18,0.7)",
              border: "1px solid rgba(0,217,255,0.2)",
              color: "#e8f4fd",
            }}
          >
            <option value="">-- SELECT PDF TO BEGIN --</option>
            {documents.map((d) => <option key={d._id} value={d._id}>{d.filename}</option>)}
          </select>
        )}
      </GlassCard>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-9">
        {[
          { icon: Icon.Shield, title: "Secure & Private", desc: "Your documents are encrypted and completely secure." },
          { icon: Icon.Bolt, title: "Instant Processing", desc: "AI processes your document in seconds." },
          { icon: Icon.Brain, title: "Smart Understanding", desc: "Advanced AI understands context and details." },
        ].map((f) => (
          <GlassCard key={f.title} padding="p-6" className="transition-all duration-300 hover:scale-[1.02]">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
              style={{ background: "rgba(0,217,255,0.1)", border: "1px solid rgba(0,217,255,0.25)" }}
            >
              <f.icon size={19} color="#00D9FF" />
            </div>
            <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 17, fontWeight: 700, color: "#eaf6ff", marginBottom: 6 }}>
              {f.title}
            </p>
            <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 14.5, color: "#4a7a9b", lineHeight: 1.5 }}>
              {f.desc}
            </p>
          </GlassCard>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2">
        <Icon.Info size={14} color="#3a6a8a" />
        <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12.5, color: "#3a6a8a" }}>
          Supported format: <span style={{ color: "#00D9FF" }}>PDF (Max 100MB)</span>
        </span>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Main page                                                            */
/* ================================================================== */
export default function DoubtPage() {
  const [user] = useAuthState(auth);

  // ---- preserved state / logic ----
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [docsLoading, setDocsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ---- new: upload UI state ----
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  useEffect(() => {
    if (!selectedDoc) return;
    const f = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/doubt/history/${selectedDoc}?user_id=${user?.uid || "test_user"}`);
        const data = await res.json();
        if (data.success && data.messages?.length > 0) {
          const formatted: ChatMsg[] = [];
          data.messages.forEach((m: { question: string; answer: string }) => {
            formatted.push({ role: "user", content: m.question });
            formatted.push({ role: "ai", content: m.answer });
          });
          setMessages(formatted);
        } else { setMessages([]); }
      } catch { setMessages([]); }
    };
    f();
  }, [selectedDoc, user]);

  const handleSend = async () => {
    if (!input.trim() || !selectedDoc || loading) return;
    const q = input.trim();
    setInput(""); setError(null);
    setMessages(prev => [...prev, { role: "user", content: q }]);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/doubt/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: selectedDoc, user_id: user?.uid || "test_user", question: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed.");
      setMessages(prev => [...prev, { role: "ai", content: data.answer }]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
      setMessages(prev => prev.slice(0, -1));
    } finally { setLoading(false); }
  };

  const handleClear = async () => {
    if (!selectedDoc) return;
    setClearing(true);
    try {
      await fetch(`${API_BASE}/api/doubt/history/${selectedDoc}?user_id=${user?.uid || "test_user"}`, { method: "DELETE" });
      setMessages([]);
    } catch { }
    finally { setClearing(false); }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (file.type !== "application/pdf") { setUploadError("Only PDF files are supported."); return; }
    if (file.size > 100 * 1024 * 1024) { setUploadError("File exceeds 100MB limit."); return; }
    setUploading(true); setUploadError(null);
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
      if (newDocId) { setSelectedDoc(newDocId); setMessages([]); }
    } catch (e: unknown) { setUploadError(e instanceof Error ? e.message : "Upload failed."); }
    finally { setUploading(false); }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const docName = documents.find(d => d._id === selectedDoc)?.filename || "";

  return (
    <div className="min-h-screen flex" style={{ background: "radial-gradient(circle at 20% 0%, #0a1830 0%, #020812 55%)" }}>
      <FloatingSymbols />
      <Sidebar hasDoc={!!selectedDoc} />

      <div className="flex-1 relative min-w-0 flex flex-col" style={{ zIndex: 1, height: "100vh" }}>
        {!selectedDoc ? (
          <div
            className="overflow-y-auto flex-1"
            style={{
              backgroundImage:
                "linear-gradient(rgba(0,217,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(0,217,255,0.035) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          >
            <SelectDocumentScreen
              documents={documents}
              docsLoading={docsLoading}
              selectedDoc={selectedDoc}
              setSelectedDoc={setSelectedDoc}
              setMessages={setMessages}
              uploading={uploading}
              uploadError={uploadError}
              isDragging={isDragging}
              setIsDragging={setIsDragging}
              onDrop={onDrop}
              fileInputRef={fileInputRef}
              onChooseFile={handleFileUpload}
            />
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Chat header */}
            <div
              className="px-8 py-5 flex items-center justify-between flex-wrap gap-3"
              style={{ background: "linear-gradient(135deg, rgba(0,217,255,0.04), rgba(2,8,18,0.95))", borderBottom: "1px solid rgba(0,217,255,0.1)" }}
            >
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, color: "#2a5a7a" }}>// AGENT_03</span>
                    {messages.length > 0 && <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#00ff88", boxShadow: "0 0 8px #00ff88" }} />}
                  </div>
                  <h1
                    className="font-black text-xl"
                    style={{
                      fontFamily: "var(--font-orbitron, sans-serif)",
                      background: "linear-gradient(135deg, #00D9FF, #ffffff)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    DOUBT AGENT
                  </h1>
                </div>
                <span
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg"
                  style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, color: "#00D9FF", background: "rgba(0,217,255,0.06)", border: "1px solid rgba(0,217,255,0.18)" }}
                >
                  <Icon.FileText size={13} color="#00D9FF" /> {docName}
                </span>
                <button
                  onClick={() => { setSelectedDoc(""); setMessages([]); }}
                  style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11.5, color: "#4a7a9b" }}
                  className="underline-offset-2 hover:underline"
                >
                  change document
                </button>
              </div>

              {messages.length > 0 && (
                <button
                  onClick={handleClear}
                  disabled={clearing}
                  className="flex items-center gap-2 transition-all duration-200"
                  style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, padding: "9px 16px", borderRadius: 10, color: "#ff3366", background: "rgba(255,51,102,0.06)", border: "1px solid rgba(255,51,102,0.2)" }}
                >
                  <Icon.Trash size={12} color="#ff3366" />
                  {clearing ? "CLEARING..." : "CLEAR CHAT"}
                </button>
              )}
            </div>

            {/* Chat body */}
            <div
              className="flex-1 overflow-y-auto px-8 py-7 space-y-4"
              style={{
                backgroundImage: "linear-gradient(rgba(0,217,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,217,255,0.03) 1px, transparent 1px)",
                backgroundSize: "44px 44px",
              }}
            >
              {messages.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: "rgba(0,217,255,0.08)", border: "1px solid rgba(0,217,255,0.25)" }}
                  >
                    <Icon.HelpHex size={28} color="#00D9FF" />
                  </div>
                  <p style={{ fontFamily: "var(--font-orbitron, sans-serif)", fontSize: 14, color: "#4a7a9b", letterSpacing: "0.04em" }}>READY TO ANSWER</p>
                  <p style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, color: "#2a5a7a", marginTop: 10 }}>
                    // Ask anything about {docName}
                  </p>
                  <p style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, color: "#2a5a7a", marginTop: 4 }}>
                    // Press Enter to send
                  </p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div
                    className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-bold"
                    style={msg.role === "user"
                      ? { fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, background: "rgba(0,217,255,0.15)", border: "1px solid rgba(0,217,255,0.35)", color: "#00D9FF" }
                      : { fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, background: "rgba(157,78,221,0.15)", border: "1px solid rgba(157,78,221,0.35)", color: "#C77DFF" }
                    }
                  >
                    {msg.role === "user" ? "U" : "AI"}
                  </div>
                  <div
                    className="max-w-[75%] px-5 py-3.5 rounded-2xl"
                    style={msg.role === "user"
                      ? {
                          fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 15.5, lineHeight: 1.6,
                          background: "linear-gradient(135deg, rgba(0,217,255,0.14), rgba(0,136,204,0.08))",
                          border: "1px solid rgba(0,217,255,0.25)", color: "#eaf6ff", borderTopRightRadius: 6,
                        }
                      : {
                          fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 15.5, lineHeight: 1.6,
                          background: "linear-gradient(135deg, rgba(157,78,221,0.08), rgba(2,8,18,0.9))",
                          border: "1px solid rgba(157,78,221,0.18)", color: "#a8c4d8", borderTopLeftRadius: 6,
                        }
                    }
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-start gap-3">
                  <div
                    className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-bold"
                    style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, background: "rgba(157,78,221,0.15)", border: "1px solid rgba(157,78,221,0.35)", color: "#C77DFF" }}
                  >
                    AI
                  </div>
                  <div className="px-5 py-3.5 rounded-2xl" style={{ background: "rgba(157,78,221,0.06)", border: "1px solid rgba(157,78,221,0.15)" }}>
                    <div className="flex gap-1.5 items-center">
                      {[0, 150, 300].map(delay => (
                        <span key={delay} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#C77DFF", animationDelay: `${delay}ms` }} />
                      ))}
                      <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11.5, color: "#6a5a8a", marginLeft: 6 }}>PROCESSING...</span>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="px-5 py-3.5 rounded-xl" style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12.5, background: "rgba(255,51,102,0.06)", border: "1px solid rgba(255,51,102,0.2)", color: "#ff3366" }}>
                  ⚠ {error}
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div
              className="px-8 py-5"
              style={{ background: "linear-gradient(135deg, rgba(0,217,255,0.03), rgba(2,8,18,0.95))", borderTop: "1px solid rgba(0,217,255,0.08)" }}
            >
              <div className="flex items-end gap-3">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  disabled={!selectedDoc || loading}
                  placeholder="Ask a question... (Enter to send)"
                  rows={1}
                  className="flex-1 outline-none resize-none transition-all"
                  style={{
                    fontFamily: "var(--font-rajdhani, sans-serif)",
                    fontSize: 15.5,
                    padding: "14px 18px",
                    borderRadius: 14,
                    background: "rgba(2,8,18,0.8)",
                    border: "1px solid rgba(0,217,255,0.18)",
                    color: "#e8f4fd",
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = "rgba(0,217,255,0.45)"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(0,217,255,0.18)"}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || !selectedDoc || loading}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-[1.05] active:scale-[0.97] shrink-0"
                  style={{
                    background: !input.trim() || !selectedDoc || loading ? "rgba(0,217,255,0.08)" : "linear-gradient(135deg, #00D9FF, #0088cc)",
                    border: "1px solid rgba(0,217,255,0.3)",
                    boxShadow: !input.trim() || !selectedDoc || loading ? "none" : "0 0 18px rgba(0,217,255,0.4)",
                  }}
                >
                  <Icon.Send size={18} color={!input.trim() || !selectedDoc || loading ? "#2a5a7a" : "#020812"} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}