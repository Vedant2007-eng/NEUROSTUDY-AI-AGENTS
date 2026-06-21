"use client";

import { useState, useEffect, useRef } from "react";
import { auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Document { _id: string; filename: string; }
interface ImportantTerm { term: string; definition: string; }
interface NotesContent {
  summary: string;
  key_points: string[];
  important_terms: ImportantTerm[];
  quick_revision: string[];
  difficulty_level: string;
  estimated_read_time: string;
  topic_tags: string[];
}

const MATH_SYMBOLS = ["+", "−", "×", "÷", "%", "#", "@", "$"];

/* ================================================================== */
/*  Icons (lucide-style strokes, inline so this file has zero deps)    */
/* ================================================================== */
const Icon = {
  FileText: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" /><path d="M9 13h6M9 17h6M9 9h2" />
    </svg>
  ),
  ListChecks: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 7 2 2 4-4" /><path d="m3 17 2 2 4-4" />
      <path d="M13 6h8M13 18h8M13 12h8" />
    </svg>
  ),
  UploadCloud: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 32} height={p.size ?? 32} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 16l-4-4-4 4" /><path d="M12 12v9" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  ),
  Sparkles: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 20} height={p.size ?? 20} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="m6.34 6.34 1.42 1.42M16.24 16.24l1.42 1.42M6.34 17.66l1.42-1.42M16.24 7.76l1.42-1.42" />
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
  Bolt: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 14} height={p.size ?? 14} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 3 14h7l-1 8 10-12h-7z" />
    </svg>
  ),
};

/* ================================================================== */
/*  Floating math symbols (full-viewport, fixed, low-opacity)          */
/* ================================================================== */
function FloatingSymbols() {
  const [mounted, setMounted] = useState(false);
  const [symbols, setSymbols] = useState<
    { id: number; char: string; left: number; top: number; duration: number; delay: number; size: number }[]
  >([]);

  useEffect(() => {
    setSymbols(
      Array.from({ length: 14 }).map((_, i) => ({
        id: i,
        char: MATH_SYMBOLS[Math.floor(Math.random() * MATH_SYMBOLS.length)],
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
          className="math-symbol-float"
          style={{
            position: "absolute",
            left: `${s.left}%`,
            top: `${s.top}%`,
            fontSize: `${s.size}px`,
            fontFamily: "var(--font-jetbrains-mono, monospace)",
            color: "#00d4ff",
            opacity: 0.1,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
            textShadow: "0 0 14px rgba(0,212,255,0.5)",
          }}
        >
          {s.char}
        </span>
      ))}
      <style jsx global>{`
        @keyframes mathFloatWander {
          0% { transform: translate(0,0) rotate(0deg); }
          25% { transform: translate(36px,-54px) rotate(12deg); }
          50% { transform: translate(-26px,-98px) rotate(-9deg); }
          75% { transform: translate(52px,-36px) rotate(7deg); }
          100% { transform: translate(0,0) rotate(0deg); }
        }
        .math-symbol-float {
          animation-name: mathFloatWander;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  );
}

/* ================================================================== */
/*  Sidebar                                                             */
/* ================================================================== */
function Sidebar({ step }: { step: 1 | 2 | 3 }) {
  return (
    <aside
      className="hidden lg:flex flex-col shrink-0 sticky top-0 h-screen"
      style={{ width: 300 }}
    >
      <div
        className="flex flex-col h-full m-4 rounded-2xl"
        style={{
          background: "rgba(8,16,32,0.75)",
          border: "1px solid rgba(0,191,255,0.16)",
          boxShadow: "0 0 40px rgba(0,191,255,0.04), inset 0 1px 0 rgba(255,255,255,0.03)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Brand */}
        <div className="px-6 pt-8 pb-7" style={{ borderBottom: "1px solid rgba(0,191,255,0.10)" }}>
          <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, color: "#3a6a8a", letterSpacing: "0.08em" }}>
            // AGENT_01
          </span>
          <div className="flex items-center gap-3 mt-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(0,191,255,0.10)", border: "1px solid rgba(0,191,255,0.3)", boxShadow: "0 0 16px rgba(0,191,255,0.15)" }}
            >
              <Icon.FileText size={19} color="#00d4ff" />
            </div>
            <h1
              className="font-black text-lg leading-tight tracking-tight"
              style={{
                fontFamily: "var(--font-orbitron, sans-serif)",
                background: "linear-gradient(135deg, #7dc4ff, #ffffff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              NOTES AGENT
            </h1>
          </div>
          <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 14.5, lineHeight: 1.5, color: "#5588a8" }}>
            Upload a PDF → AI extracts smart notes, key points &amp; definitions
          </p>
        </div>

        {/* Nav */}
        <div className="px-4 pt-7 flex-1">
          <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 10.5, letterSpacing: "0.12em", color: "#3a6a8a", paddingLeft: 12 }}>
            NAVIGATION
          </span>
          <nav className="mt-3 flex flex-col gap-2">
            {[
              { label: "Select Document", icon: Icon.UploadCloud, active: step >= 1 },
              { label: "Generate Notes", icon: Icon.Sparkles, active: step === 3 },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300"
                style={{
                  fontFamily: "var(--font-rajdhani, sans-serif)",
                  fontSize: 15,
                  fontWeight: 600,
                  color: item.active ? "#eaf6ff" : "#4a7a9b",
                  background: item.active ? "linear-gradient(135deg, rgba(0,191,255,0.14), rgba(0,191,255,0.03))" : "transparent",
                  borderLeft: item.active ? "3px solid #00BFFF" : "3px solid transparent",
                  boxShadow: item.active ? "0 0 24px rgba(0,191,255,0.08)" : "none",
                }}
              >
                <item.icon size={17} color={item.active ? "#00d4ff" : "#3a6a8a"} />
                {item.label}
              </div>
            ))}
          </nav>
        </div>

        {/* Agent status */}
        <div className="px-4 pb-6 pt-4">
          <div
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl"
            style={{ background: "rgba(0,191,255,0.05)", border: "1px solid rgba(0,191,255,0.15)" }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
              style={{
                fontFamily: "var(--font-orbitron, sans-serif)",
                background: "linear-gradient(135deg, #00d4ff, #0066ff)",
                color: "#020812",
                boxShadow: "0 0 18px rgba(0,191,255,0.4)",
              }}
            >
              N
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, color: "#8ab4cc" }}>AGENT_01</p>
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
/*  Step progress tracker                                              */
/* ================================================================== */
function StepTracker({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "Select Document" },
    { n: 2, label: "Review & Confirm" },
    { n: 3, label: "Generate Notes" },
  ];

  return (
    <div className="flex items-start justify-center w-full mb-10">
      {steps.map((s, i) => {
        const active = s.n === step;
        const done = s.n < step;
        return (
          <div key={s.n} className="flex items-start" style={{ flex: i < steps.length - 1 ? 1 : "0 0 auto", maxWidth: i < steps.length - 1 ? 220 : "none" }}>
            <div className="flex flex-col items-center gap-2.5 shrink-0" style={{ width: 120 }}>
              <div
                className="flex items-center justify-center font-bold transition-all duration-300"
                style={{
                  fontFamily: "var(--font-orbitron, sans-serif)",
                  fontSize: 13,
                  width: 42,
                  height: 42,
                  borderRadius: "14px",
                  background: active || done ? "linear-gradient(135deg, #00d4ff, #0066ff)" : "rgba(96,165,250,0.06)",
                  color: active || done ? "#020812" : "#4a7a9b",
                  boxShadow: active ? "0 0 22px rgba(0,191,255,0.55)" : "none",
                  border: active || done ? "none" : "1px solid rgba(96,165,250,0.18)",
                }}
              >
                {done ? <Icon.Check size={16} color="#020812" /> : s.n}
              </div>
              <span
                className="text-center"
                style={{
                  fontFamily: "var(--font-jetbrains-mono, monospace)",
                  fontSize: 11,
                  letterSpacing: "0.02em",
                  color: active ? "#00d4ff" : done ? "#5588a8" : "#3a6a8a",
                  lineHeight: 1.3,
                }}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="h-px mt-[20px] transition-all duration-500"
                style={{
                  flex: 1,
                  minWidth: 40,
                  background: done ? "linear-gradient(90deg, #00d4ff, rgba(0,212,255,0.25))" : "rgba(96,165,250,0.14)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ================================================================== */
/*  Glass card wrapper — single source of truth for card chrome        */
/* ================================================================== */
function GlassCard({ children, className = "", padding = "p-8" }: { children: React.ReactNode; className?: string; padding?: string }) {
  return (
    <div
      className={`rounded-3xl ${padding} ${className}`}
      style={{
        background: "linear-gradient(160deg, rgba(13,24,42,0.7), rgba(5,11,24,0.85))",
        border: "1px solid rgba(0,191,255,0.14)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)",
        backdropFilter: "blur(16px)",
      }}
    >
      {children}
    </div>
  );
}

/* ================================================================== */
/*  Collapsible output section panel (logic untouched)                 */
/* ================================================================== */
function SectionPanel({
  title, prefix, children, color = "cyan",
}: {
  title: string; prefix: string; children: React.ReactNode; color?: string;
}) {
  const [open, setOpen] = useState(true);
  const colors: Record<string, { border: string; text: string; bg: string }> = {
    cyan: { border: "rgba(0,212,255,0.2)", text: "#00d4ff", bg: "rgba(0,212,255,0.04)" },
    blue: { border: "rgba(59,130,246,0.2)", text: "#60a5fa", bg: "rgba(59,130,246,0.04)" },
    green: { border: "rgba(0,255,136,0.2)", text: "#00ff88", bg: "rgba(0,255,136,0.04)" },
    amber: { border: "rgba(255,170,0,0.2)", text: "#ffaa00", bg: "rgba(255,170,0,0.04)" },
  };
  const c = colors[color];

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${c.border}`, background: c.bg }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, color: c.text, opacity: 0.6 }}>{prefix}</span>
          <span style={{ fontFamily: "var(--font-orbitron, sans-serif)", fontSize: 12.5, fontWeight: 700, letterSpacing: "0.06em", color: c.text }}>
            {title}
          </span>
        </div>
        <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, color: c.text, opacity: 0.4 }}>
          {open ? "[ − ]" : "[ + ]"}
        </span>
      </button>
      {open && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
}

/* ================================================================== */
/*  Main page                                                           */
/* ================================================================== */
export default function NotesPage() {
  const [user] = useAuthState(auth);

  // ---- preserved state / logic ----
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState("");
  const [notes, setNotes] = useState<NotesContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [docsLoading, setDocsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const step: 1 | 2 | 3 = notes ? 3 : selectedDoc ? 2 : 1;

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(`${API_BASE}/documents?user_id=${user?.uid || "test_user"}`);
        const data = await res.json();
        setDocuments(data.documents || []);
      } catch { setError("Failed to load documents."); }
      finally { setDocsLoading(false); }
    };
    fetch_();
  }, [user]);

  const handleGenerate = async () => {
    if (!selectedDoc) return;
    setLoading(true); setError(null); setNotes(null); setSuccess(null);
    try {
      const res = await fetch(`${API_BASE}/api/notes/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: selectedDoc, user_id: user?.uid || "test_user" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed.");
      setNotes(data.notes);
      setSuccess(data.message);
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

  const diffColor = (d: string) => {
    if (d === "Beginner") return { color: "#00ff88", bg: "rgba(0,255,136,0.1)", border: "rgba(0,255,136,0.3)" };
    if (d === "Advanced") return { color: "#ff3366", bg: "rgba(255,51,102,0.1)", border: "rgba(255,51,102,0.3)" };
    return { color: "#ffaa00", bg: "rgba(255,170,0,0.1)", border: "rgba(255,170,0,0.3)" };
  };

  return (
    <div className="min-h-screen flex" style={{ background: "radial-gradient(circle at 20% 0%, #0a1830 0%, #050B18 55%)" }}>
      <FloatingSymbols />
      <Sidebar step={step} />

      {/* Main column */}
      <div className="flex-1 relative min-w-0" style={{ zIndex: 1 }}>
        <div
          className="min-h-screen"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,191,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(0,191,255,0.035) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        >
          <div className="mx-auto" style={{ maxWidth: 1280, padding: "48px 40px 64px" }}>

            {/* ---- Header card ---- */}
            <GlassCard className="mb-9" padding="p-9">
              <div className="flex items-center justify-between gap-6 flex-wrap">
                <div>
                  <h2
                    className="font-black tracking-tight mb-2.5"
                    style={{
                      fontFamily: "var(--font-orbitron, sans-serif)",
                      fontSize: 30,
                      background: "linear-gradient(135deg, #7dc4ff, #ffffff)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    GENERATE NOTES
                  </h2>
                  <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 16.5, color: "#5588a8" }}>
                    Extract key points, definitions and smart notes from your document.
                  </p>
                </div>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(0,191,255,0.08)", border: "1px solid rgba(0,191,255,0.25)", boxShadow: "0 0 24px rgba(0,191,255,0.1)" }}
                >
                  <Icon.Sparkles size={24} color="#00d4ff" />
                </div>
              </div>
            </GlassCard>

            {/* ---- Step tracker ---- */}
            <StepTracker step={step} />

            {/* ---- Upload hero card (MAIN FOCUS) ---- */}
            <GlassCard className="mb-9" padding="p-0">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer transition-all duration-300 group mx-auto"
                style={{
                  width: "86%",
                  minHeight: 380,
                  margin: "44px auto",
                  borderRadius: 30,
                  border: `2px dashed ${isDragging ? "#00d4ff" : "rgba(0,191,255,0.28)"}`,
                  background: isDragging
                    ? "rgba(0,191,255,0.08)"
                    : "linear-gradient(160deg, rgba(0,191,255,0.04), rgba(5,11,24,0.4))",
                  boxShadow: isDragging ? "0 0 56px rgba(0,191,255,0.3)" : "none",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
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
                  style={{ background: "rgba(0,191,255,0.10)", border: "1px solid rgba(0,191,255,0.32)", boxShadow: "0 0 28px rgba(0,191,255,0.18)" }}
                >
                  {uploading ? (
                    <span className="inline-block w-7 h-7 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: "#00d4ff" }} />
                  ) : (
                    <Icon.UploadCloud size={32} color="#00d4ff" />
                  )}
                </div>

                <p
                  className="font-bold mb-2.5"
                  style={{ fontFamily: "var(--font-orbitron, sans-serif)", fontSize: 19, color: "#eaf6ff" }}
                >
                  {uploading ? "UPLOADING DOCUMENT..." : "Upload your PDF document"}
                </p>
                <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 16, color: "#5588a8", marginBottom: 32 }}>
                  Drag &amp; drop your file here or click to browse
                </p>

                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  disabled={uploading}
                  className="transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50"
                  style={{
                    fontFamily: "var(--font-orbitron, sans-serif)",
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    color: "#020812",
                    padding: "15px 38px",
                    borderRadius: 14,
                    background: "linear-gradient(90deg, #009dff, #00d4ff)",
                    boxShadow: "0 0 28px rgba(0,191,255,0.4)",
                  }}
                >
                  CHOOSE PDF FILE
                </button>

                <div className="flex items-center gap-1.5 mt-7">
                  <Icon.Info size={13} color="#3a6a8a" />
                  <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, color: "#3a6a8a" }}>
                    Supports PDF files up to 100MB
                  </span>
                </div>
              </div>
            </GlassCard>

            {uploadError && (
              <div
                className="mb-9 px-5 py-4 rounded-2xl"
                style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12.5, background: "rgba(255,51,102,0.08)", border: "1px solid rgba(255,51,102,0.2)", color: "#ff3366" }}
              >
                ⚠ {uploadError}
              </div>
            )}

            {/* ---- Review & confirm card ---- */}
            <GlassCard className="mb-9" padding="p-8">
              <div className="flex items-center gap-3 mb-6">
                <Icon.ListChecks size={16} color="#60a5fa" />
                <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, letterSpacing: "0.08em", color: "#60a5fa", opacity: 0.75 }}>
                  REVIEW &amp; CONFIRM
                </span>
                <div className="flex-1 h-px" style={{ background: "rgba(96,165,250,0.12)" }} />
              </div>

              {docsLoading ? (
                <p style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 14, color: "#3a6a8a" }}>
                  <span className="cursor-blink">█</span> LOADING DOCUMENTS...
                </p>
              ) : documents.length === 0 ? (
                <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 16, color: "#5588a8" }}>
                  No documents yet. Upload a PDF above to get started.
                </p>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  <select
                    value={selectedDoc}
                    onChange={(e) => { setSelectedDoc(e.target.value); setNotes(null); setError(null); }}
                    className="flex-1 outline-none"
                    style={{
                      fontFamily: "var(--font-rajdhani, sans-serif)",
                      fontSize: 15.5,
                      padding: "15px 18px",
                      borderRadius: 14,
                      background: "rgba(2,8,18,0.7)",
                      border: "1px solid rgba(96,165,250,0.2)",
                      color: "#e8f4fd",
                    }}
                  >
                    <option value="">-- SELECT PDF --</option>
                    {documents.map((d) => (
                      <option key={d._id} value={d._id}>{d.filename}</option>
                    ))}
                  </select>

                  <button
                    onClick={handleGenerate}
                    disabled={!selectedDoc || loading}
                    className="flex items-center justify-center gap-2.5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                    style={{
                      fontFamily: "var(--font-orbitron, sans-serif)",
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      color: "#020812",
                      padding: "15px 30px",
                      borderRadius: 14,
                      background: "linear-gradient(90deg, #009dff, #00d4ff)",
                      boxShadow: "0 0 24px rgba(0,191,255,0.32)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        PROCESSING...
                      </>
                    ) : (
                      <>
                        <Icon.Sparkles size={15} color="#020812" />
                        GENERATE NOTES
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
              {success && !error && (
                <div className="mt-5 px-5 py-3.5 rounded-xl" style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12.5, background: "rgba(0,255,136,0.05)", border: "1px solid rgba(0,255,136,0.2)", color: "#00ff88" }}>
                  ✓ {success}
                </div>
              )}
            </GlassCard>

            {/* ---- Loading skeleton ---- */}
            {loading && (
              <div className="space-y-4 animate-pulse mb-9">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="rounded-2xl" style={{ height: 64, background: "rgba(96,165,250,0.04)", border: "1px solid rgba(96,165,250,0.08)" }} />
                ))}
              </div>
            )}

            {/* ---- Notes output ---- */}
            {notes && !loading && (
              <GlassCard padding="p-8">
                <div className="flex flex-wrap items-center gap-3 mb-5">
                  {(() => { const c = diffColor(notes.difficulty_level); return (
                    <span className="px-3.5 py-1.5 rounded-lg" style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, color: c.color, background: c.bg, border: `1px solid ${c.border}` }}>
                      {notes.difficulty_level.toUpperCase()}
                    </span>
                  ); })()}
                  <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, color: "#3a6a8a" }}>⏱ {notes.estimated_read_time}</span>
                  <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, color: "#3a6a8a" }}>◈ {notes.key_points.length} KEY POINTS</span>
                </div>

                <div className="flex flex-wrap gap-2.5 mb-7">
                  {notes.topic_tags.map((tag) => (
                    <span key={tag} className="px-3 py-1.5 rounded-lg" style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, color: "#00d4ff", background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.15)" }}>
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="space-y-4">
                  <SectionPanel title="SUMMARY" prefix="01." color="cyan">
                    <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 16, lineHeight: 1.7, color: "#8ab4cc" }}>
                      {notes.summary}
                    </p>
                  </SectionPanel>

                  <SectionPanel title="KEY POINTS" prefix="02." color="blue">
                    <ul className="space-y-3">
                      {notes.key_points.map((pt, i) => (
                        <li key={i} className="flex items-start gap-3.5">
                          <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, color: "#60a5fa", marginTop: 3, flexShrink: 0 }}>
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 15.5, color: "#8ab4cc" }}>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </SectionPanel>

                  <SectionPanel title="IMPORTANT TERMS" prefix="03." color="green">
                    <div className="space-y-4">
                      {notes.important_terms.map((item, i) => (
                        <div key={i} className="pl-4" style={{ borderLeft: "2px solid rgba(0,255,136,0.3)" }}>
                          <p className="mb-1" style={{ fontFamily: "var(--font-orbitron, sans-serif)", fontSize: 13, fontWeight: 700, color: "#00ff88" }}>{item.term}</p>
                          <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 15, color: "#5588a8" }}>{item.definition}</p>
                        </div>
                      ))}
                    </div>
                  </SectionPanel>

                  <SectionPanel title="QUICK REVISION" prefix="04." color="amber">
                    <ul className="space-y-3">
                      {notes.quick_revision.map((fact, i) => (
                        <li key={i} className="flex items-start gap-2.5" style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 15.5, color: "#8ab4cc" }}>
                          <Icon.Bolt size={14} color="#ffaa00" />
                          {fact}
                        </li>
                      ))}
                    </ul>
                  </SectionPanel>
                </div>
              </GlassCard>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}