"use client";

import { useState, useEffect, useRef } from "react";
import { auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Document { _id: string; filename: string; }
interface MCQQuestion {
  question_number: number;
  question: string;
  options: Record<string, string>;
  correct_answer: string;
  explanation: string;
  difficulty: string;
}
interface QuizContent {
  quiz_title: string;
  total_questions: number;
  questions: MCQQuestion[];
}

/* ================================================================== */
/*  Icons (lucide-style strokes, inline, zero new deps)                 */
/* ================================================================== */
const Icon = {
  Brain: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 20} height={p.size ?? 20} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44A2.5 2.5 0 0 1 4.5 17a2.5 2.5 0 0 1-2.4-3.04A2.5 2.5 0 0 1 3 9.5a2.5 2.5 0 0 1 1.5-4.41A2.5 2.5 0 0 1 7 2.5a2.5 2.5 0 0 1 2.5-.5Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44A2.5 2.5 0 0 0 19.5 17a2.5 2.5 0 0 0 2.4-3.04A2.5 2.5 0 0 0 21 9.5a2.5 2.5 0 0 0-1.5-4.41A2.5 2.5 0 0 0 17 2.5a2.5 2.5 0 0 0-2.5-.5Z" />
    </svg>
  ),
  FileText: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" /><path d="M9 13h6M9 17h6M9 9h2" />
    </svg>
  ),
  HelpCircle: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" />
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
  Bulb: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6M10 22h4M15.09 14c.39-.39.85-.84 1.18-1.36A6 6 0 1 0 7.73 12.6c.33.52.79.97 1.18 1.36.4.39.79 1.04.79 1.79v.25h4.6v-.25c0-.75.39-1.4.79-1.79Z" />
    </svg>
  ),
  Refresh: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 14} height={p.size ?? 14} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" />
    </svg>
  ),
};

const FLOAT_SYMBOLS = ["?", "!", "+", "#"];

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
      Array.from({ length: 14 }).map((_, i) => ({
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
          className="quiz-symbol-float"
          style={{
            position: "absolute",
            left: `${s.left}%`,
            top: `${s.top}%`,
            fontSize: `${s.size}px`,
            fontFamily: "var(--font-jetbrains-mono, monospace)",
            color: "#9D4EDD",
            opacity: 0.1,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
            textShadow: "0 0 14px rgba(157,78,221,0.5)",
          }}
        >
          {s.char}
        </span>
      ))}
      <style jsx global>{`
        @keyframes quizFloatWander {
          0% { transform: translate(0,0) rotate(0deg); }
          25% { transform: translate(36px,-54px) rotate(12deg); }
          50% { transform: translate(-26px,-98px) rotate(-9deg); }
          75% { transform: translate(52px,-36px) rotate(7deg); }
          100% { transform: translate(0,0) rotate(0deg); }
        }
        .quiz-symbol-float {
          animation-name: quizFloatWander;
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
  return (
    <aside className="hidden lg:flex flex-col shrink-0 sticky top-0 h-screen" style={{ width: 300 }}>
      <div
        className="flex flex-col h-full m-4 rounded-2xl"
        style={{
          background: "rgba(10,8,24,0.75)",
          border: "1px solid rgba(157,78,221,0.18)",
          boxShadow: "0 0 40px rgba(157,78,221,0.05), inset 0 1px 0 rgba(255,255,255,0.03)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Brand */}
        <div className="px-6 pt-8 pb-7" style={{ borderBottom: "1px solid rgba(157,78,221,0.1)" }}>
          <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, color: "#6a4a8a", letterSpacing: "0.08em" }}>
            // AGENT_02
          </span>
          <div className="flex items-center gap-3 mt-3 mb-3">
            <div
              className="w-12 h-12 flex items-center justify-center shrink-0"
              style={{
                background: "rgba(157,78,221,0.12)",
                border: "1px solid rgba(157,78,221,0.35)",
                borderRadius: 14,
                boxShadow: "0 0 18px rgba(157,78,221,0.2)",
              }}
            >
              <Icon.Brain size={22} color="#C77DFF" />
            </div>
          </div>
          <h1
            className="font-black text-xl leading-tight tracking-tight mb-3"
            style={{
              fontFamily: "var(--font-orbitron, sans-serif)",
              background: "linear-gradient(135deg, #C77DFF, #ffffff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            QUIZ AGENT
          </h1>
          <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 14.5, lineHeight: 1.5, color: "#8a6aa8" }}>
            AI-generated MCQs with difficulty levels and explanations.
          </p>
        </div>

        {/* Nav */}
        <div className="px-4 pt-7 flex-1">
          <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 10.5, letterSpacing: "0.12em", color: "#6a4a8a", paddingLeft: 12 }}>
            NAVIGATION
          </span>
          <nav className="mt-3 flex flex-col gap-2">
            {[
              { label: "Configure Quiz", sub: "Select document & settings", icon: Icon.FileText, active: step <= 2 },
              { label: "Questions", sub: "View & manage questions", icon: Icon.HelpCircle, active: step === 3 },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-start gap-3 px-4 py-3.5 rounded-xl transition-all duration-300"
                style={{
                  background: item.active ? "linear-gradient(135deg, rgba(157,78,221,0.16), rgba(157,78,221,0.03))" : "transparent",
                  border: item.active ? "1px solid rgba(157,78,221,0.4)" : "1px solid transparent",
                  boxShadow: item.active ? "0 0 24px rgba(157,78,221,0.1)" : "none",
                }}
              >
                <item.icon size={17} color={item.active ? "#C77DFF" : "#5a4a7a"} />
                <div>
                  <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 15, fontWeight: 700, color: item.active ? "#eee6ff" : "#6a5a8a" }}>
                    {item.label}
                  </p>
                  <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 12.5, color: "#5a4a7a" }}>
                    {item.sub}
                  </p>
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Agent status */}
        <div className="px-4 pb-6 pt-4">
          <div
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl"
            style={{ background: "rgba(157,78,221,0.06)", border: "1px solid rgba(157,78,221,0.18)" }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
              style={{
                fontFamily: "var(--font-orbitron, sans-serif)",
                background: "linear-gradient(135deg, #9D4EDD, #6a2cb8)",
                color: "#ffffff",
                boxShadow: "0 0 18px rgba(157,78,221,0.45)",
              }}
            >
              N
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, color: "#a78bc4" }}>AGENT_02</p>
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
/*  Step tracker (hexagon, 3-step, horizontal label layout)             */
/* ================================================================== */
function StepTracker({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "SELECT DOCUMENT", sub: "Upload or choose a document" },
    { n: 2, label: "CONFIGURE QUIZ", sub: "Set difficulty, question types & count" },
    { n: 3, label: "GENERATE QUIZ", sub: "AI will generate MCQs with explanations" },
  ];

  return (
    <div
      className="flex items-center justify-between mb-9 px-7 py-6 rounded-3xl"
      style={{
        background: "linear-gradient(160deg, rgba(13,10,30,0.7), rgba(5,3,16,0.85))",
        border: "1px solid rgba(157,78,221,0.16)",
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
                  background: active || done ? "linear-gradient(135deg, #9D4EDD, #6a2cb8)" : "rgba(157,78,221,0.06)",
                  color: active || done ? "#ffffff" : "#6a5a8a",
                  boxShadow: active ? "0 0 24px rgba(157,78,221,0.6)" : "none",
                  border: active || done ? "none" : "1px solid rgba(157,78,221,0.2)",
                }}
              >
                {done ? <Icon.Check size={17} color="#fff" /> : s.n}
              </div>
              <div className="hidden md:block" style={{ maxWidth: 190 }}>
                <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 14, fontWeight: 700, color: active ? "#eee6ff" : done ? "#a78bc4" : "#6a5a8a" }}>
                  {s.label}
                </p>
                <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 12.5, color: "#5a4a7a", lineHeight: 1.35 }}>
                  {s.sub}
                </p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div
                className="h-px mx-5 transition-all duration-500 hidden sm:block"
                style={{ flex: 1, minWidth: 24, background: done ? "linear-gradient(90deg, #9D4EDD, rgba(157,78,221,0.25))" : "rgba(157,78,221,0.14)" }}
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
        background: "linear-gradient(160deg, rgba(18,12,36,0.7), rgba(8,5,18,0.85))",
        border: "1px solid rgba(157,78,221,0.16)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)",
        backdropFilter: "blur(16px)",
      }}
    >
      {children}
    </div>
  );
}

/* ================================================================== */
/*  Question card (logic untouched — visuals re-themed to violet)        */
/* ================================================================== */
function QuestionCard({ question, index, onAnswer, userAnswer }: {
  question: MCQQuestion;
  index: number;
  onAnswer: (qNum: number, ans: string) => void;
  userAnswer?: string;
}) {
  const opts = ["A", "B", "C", "D"];
  const diffColors: Record<string, { color: string; bg: string; border: string }> = {
    Easy: { color: "#00ff88", bg: "rgba(0,255,136,0.08)", border: "rgba(0,255,136,0.25)" },
    Medium: { color: "#ffaa00", bg: "rgba(255,170,0,0.08)", border: "rgba(255,170,0,0.25)" },
    Hard: { color: "#ff3366", bg: "rgba(255,51,102,0.08)", border: "rgba(255,51,102,0.25)" },
  };
  const dc = diffColors[question.difficulty] || diffColors.Medium;

  const getOptStyle = (opt: string) => {
    if (!userAnswer) return {
      background: "rgba(8,5,18,0.6)",
      border: "1px solid rgba(157,78,221,0.14)",
      color: "#8a6aa8",
      cursor: "pointer",
    };
    if (opt === question.correct_answer) return {
      background: "rgba(0,255,136,0.08)",
      border: "1px solid rgba(0,255,136,0.4)",
      color: "#00ff88",
      cursor: "default",
    };
    if (opt === userAnswer && opt !== question.correct_answer) return {
      background: "rgba(255,51,102,0.08)",
      border: "1px solid rgba(255,51,102,0.4)",
      color: "#ff3366",
      cursor: "default",
    };
    return {
      background: "rgba(8,5,18,0.3)",
      border: "1px solid rgba(157,78,221,0.06)",
      color: "#4a3a5a",
      cursor: "default",
    };
  };

  return (
    <div className="rounded-2xl p-6 transition-all duration-300" style={{
      background: "linear-gradient(135deg, rgba(157,78,221,0.04), rgba(8,5,18,0.9))",
      border: "1px solid rgba(157,78,221,0.14)",
    }}>
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-start gap-3.5">
          <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, color: "#C77DFF", opacity: 0.6, marginTop: 2, flexShrink: 0 }}>
            Q{String(index + 1).padStart(2, "0")}
          </span>
          <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 16.5, fontWeight: 600, color: "#eee6ff", lineHeight: 1.5 }}>
            {question.question}
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-lg shrink-0" style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11.5, color: dc.color, background: dc.bg, border: `1px solid ${dc.border}` }}>
          {question.difficulty.toUpperCase()}
        </span>
      </div>

      <div className="space-y-2.5 ml-9">
        {opts.map((opt) => {
          const style = getOptStyle(opt);
          return (
            <button
              key={opt}
              onClick={() => !userAnswer && onAnswer(question.question_number, opt)}
              disabled={!!userAnswer}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-left transition-all duration-200"
              style={style}
              onMouseEnter={(e) => {
                if (!userAnswer) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(157,78,221,0.4)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#eee6ff";
                }
              }}
              onMouseLeave={(e) => {
                if (!userAnswer) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(157,78,221,0.14)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#8a6aa8";
                }
              }}
            >
              <span className="w-5 h-5 rounded flex items-center justify-center shrink-0" style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, border: "1px solid currentColor", opacity: 0.7 }}>
                {opt}
              </span>
              <span style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 15 }}>{question.options[opt]}</span>
              {userAnswer && opt === question.correct_answer && (
                <span className="ml-auto" style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, color: "#00ff88" }}>✓ CORRECT</span>
              )}
              {userAnswer && opt === userAnswer && opt !== question.correct_answer && (
                <span className="ml-auto" style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, color: "#ff3366" }}>✗ WRONG</span>
              )}
            </button>
          );
        })}
      </div>

      {userAnswer && (
        <div className="mt-4 ml-9 px-4 py-3.5 rounded-xl" style={{ background: "rgba(157,78,221,0.05)", border: "1px solid rgba(157,78,221,0.16)" }}>
          <p style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 11, color: "#C77DFF", opacity: 0.7, marginBottom: 4 }}>// EXPLANATION</p>
          <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 14.5, color: "#8a6aa8" }}>{question.explanation}</p>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Main page                                                            */
/* ================================================================== */
export default function QuizPage() {
  const [user] = useAuthState(auth);

  // ---- preserved state / logic ----
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState("");
  const [numQ, setNumQ] = useState(5);
  const [quiz, setQuiz] = useState<QuizContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [docsLoading, setDocsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  // ---- new: upload UI state ----
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const step: 1 | 2 | 3 = quiz ? 3 : selectedDoc ? 2 : 1;

  useEffect(() => {
    const f = async () => {
      try {
        const res = await fetch(`${API_BASE}/documents?user_id=${user?.uid || "test_user"}`);
        const data = await res.json();
        setDocuments(data.documents || []);
      } catch { setError("Failed to load documents."); }
      finally { setDocsLoading(false); }
    };
    f();
  }, [user]);

  const handleGenerate = async () => {
    if (!selectedDoc) return;
    setLoading(true); setError(null); setQuiz(null); setAnswers({});
    try {
      const res = await fetch(`${API_BASE}/api/quiz/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: selectedDoc, user_id: user?.uid || "test_user", num_questions: numQ }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed.");
      setQuiz(data.quiz);
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

  const score = quiz ? quiz.questions.filter(q => answers[q.question_number] === q.correct_answer).length : 0;
  const answeredAll = quiz ? Object.keys(answers).length === quiz.total_questions : false;
  const pct = quiz ? Math.round((score / quiz.total_questions) * 100) : 0;

  return (
    <div className="min-h-screen flex" style={{ background: "radial-gradient(circle at 20% 0%, #160c2e 0%, #050316 55%)" }}>
      <FloatingSymbols />
      <Sidebar step={step} />

      <div className="flex-1 relative min-w-0" style={{ zIndex: 1 }}>
        <div
          className="min-h-screen"
          style={{
            backgroundImage:
              "linear-gradient(rgba(157,78,221,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(157,78,221,0.035) 1px, transparent 1px)",
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
                      background: "linear-gradient(135deg, #C77DFF, #ffffff)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    CONFIGURE QUIZ
                  </h2>
                  <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 16.5, color: "#8a6aa8" }}>
                    Select a document and set your preferences to generate a quiz.
                  </p>
                </div>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(157,78,221,0.1)", border: "1px solid rgba(157,78,221,0.3)", boxShadow: "0 0 24px rgba(157,78,221,0.12)" }}
                >
                  <Icon.FileText size={24} color="#C77DFF" />
                </div>
              </div>
            </GlassCard>

            {/* ---- Step tracker ---- */}
            <StepTracker step={step} />

            {!quiz && (
              <>
                {/* ---- Select Document + Upload card ---- */}
                <GlassCard className="mb-9" padding="p-9">
                  <div className="flex items-start justify-between gap-6 flex-wrap mb-7">
                    <div className="flex items-start gap-3.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: "rgba(157,78,221,0.1)", border: "1px solid rgba(157,78,221,0.3)" }}
                      >
                        <Icon.FileText size={18} color="#C77DFF" />
                      </div>
                      <div>
                        <h3 style={{ fontFamily: "var(--font-orbitron, sans-serif)", fontSize: 16, fontWeight: 700, color: "#eee6ff" }}>
                          SELECT DOCUMENT
                        </h3>
                        <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 15, color: "#8a6aa8", marginTop: 4 }}>
                          Upload a document to generate AI-powered quiz questions.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 13.5, color: "#6a5a8a" }}>
                        Supported: PDF (Max 100MB)
                      </span>
                      <Icon.Info size={15} color="#6a5a8a" />
                    </div>
                  </div>

                  {/* Upload zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer transition-all duration-300 group flex flex-col items-center justify-center text-center"
                    style={{
                      minHeight: 300,
                      borderRadius: 26,
                      border: `2px dashed ${isDragging ? "#9D4EDD" : "rgba(157,78,221,0.3)"}`,
                      background: isDragging
                        ? "rgba(157,78,221,0.08)"
                        : "linear-gradient(160deg, rgba(157,78,221,0.04), rgba(8,5,18,0.4))",
                      boxShadow: isDragging ? "0 0 56px rgba(157,78,221,0.3)" : "none",
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
                      className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
                      style={{ background: "rgba(157,78,221,0.12)", border: "1px solid rgba(157,78,221,0.35)", boxShadow: "0 0 28px rgba(157,78,221,0.2)" }}
                    >
                      {uploading ? (
                        <span className="inline-block w-7 h-7 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: "#C77DFF" }} />
                      ) : (
                        <Icon.UploadCloud size={32} color="#C77DFF" />
                      )}
                    </div>

                    <p className="font-bold mb-1.5" style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 21, color: "#eee6ff" }}>
                      {uploading ? "Uploading document..." : "Drag & drop your PDF here"}
                    </p>
                    <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 15, color: "#8a6aa8", marginBottom: 28 }}>
                      or click to browse files
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
                        color: "#ffffff",
                        padding: "15px 36px",
                        borderRadius: 14,
                        background: "linear-gradient(90deg, #9D4EDD, #C77DFF)",
                        boxShadow: "0 0 28px rgba(157,78,221,0.45)",
                      }}
                    >
                      <Icon.UploadCloud size={16} color="#fff" />
                      CHOOSE PDF FILE
                    </button>
                  </div>

                  {uploadError && (
                    <div className="mt-5 px-5 py-3.5 rounded-xl" style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12.5, background: "rgba(255,51,102,0.08)", border: "1px solid rgba(255,51,102,0.2)", color: "#ff3366" }}>
                      ⚠ {uploadError}
                    </div>
                  )}

                  {/* Document select + question count + generate */}
                  <div className="mt-8 pt-8" style={{ borderTop: "1px solid rgba(157,78,221,0.1)" }}>
                    {docsLoading ? (
                      <p style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 14, color: "#5a4a7a" }}>
                        <span className="cursor-blink">█</span> LOADING DOCUMENTS...
                      </p>
                    ) : documents.length === 0 ? (
                      <p style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 16, color: "#8a6aa8" }}>
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
                            background: "rgba(8,5,18,0.7)",
                            border: "1px solid rgba(157,78,221,0.22)",
                            color: "#eee6ff",
                          }}
                        >
                          <option value="">-- SELECT DOCUMENT --</option>
                          {documents.map((d) => <option key={d._id} value={d._id}>{d.filename}</option>)}
                        </select>

                        <div className="flex items-center gap-3 flex-wrap">
                          <span style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12.5, color: "#8a6aa8" }}>QUESTIONS:</span>
                          {[5, 10, 15].map((n) => (
                            <button
                              key={n}
                              onClick={() => setNumQ(n)}
                              className="rounded-xl font-bold transition-all duration-200"
                              style={{
                                fontFamily: "var(--font-orbitron, sans-serif)",
                                fontSize: 14,
                                width: 44,
                                height: 44,
                                background: numQ === n ? "linear-gradient(135deg, #9D4EDD, #6a2cb8)" : "rgba(8,5,18,0.7)",
                                border: numQ === n ? "1px solid rgba(157,78,221,0.6)" : "1px solid rgba(157,78,221,0.16)",
                                color: numQ === n ? "#ffffff" : "#6a5a8a",
                                boxShadow: numQ === n ? "0 0 18px rgba(157,78,221,0.4)" : "none",
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
                            background: !selectedDoc || loading ? "rgba(157,78,221,0.14)" : "linear-gradient(90deg, #9D4EDD, #C77DFF)",
                            border: "1px solid rgba(157,78,221,0.4)",
                            color: !selectedDoc || loading ? "#5a4a7a" : "#ffffff",
                            boxShadow: !selectedDoc || loading ? "none" : "0 0 28px rgba(157,78,221,0.4)",
                          }}
                        >
                          {loading ? (
                            <>
                              <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              GENERATING QUIZ...
                            </>
                          ) : (
                            <>
                              <Icon.HelpCircle size={15} />
                              GENERATE QUIZ
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
                  </div>
                </GlassCard>

                {/* ---- Quick tips card ---- */}
                <GlassCard padding="p-8">
                  <div className="flex items-center gap-3 mb-5">
                    <Icon.Bulb size={17} color="#C77DFF" />
                    <span style={{ fontFamily: "var(--font-orbitron, sans-serif)", fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", color: "#eee6ff" }}>
                      QUICK TIPS
                    </span>
                  </div>
                  <ul className="space-y-3">
                    {[
                      "Upload a clear and readable PDF for best results.",
                      "AI will generate MCQs with multiple difficulty levels.",
                      "Each question comes with a detailed explanation.",
                    ].map((tip, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="rounded-full mt-2 shrink-0" style={{ width: 5, height: 5, background: "#C77DFF" }} />
                        <span style={{ fontFamily: "var(--font-rajdhani, sans-serif)", fontSize: 15.5, color: "#8a6aa8" }}>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              </>
            )}

            {/* ---- Loading skeleton ---- */}
            {loading && (
              <div className="space-y-4 animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-2xl" style={{ height: 128, background: "rgba(157,78,221,0.04)", border: "1px solid rgba(157,78,221,0.08)" }} />
                ))}
              </div>
            )}

            {/* ---- Quiz output ---- */}
            {quiz && !loading && (
              <div>
                <GlassCard className="mb-7" padding="p-7">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <h2 style={{ fontFamily: "var(--font-orbitron, sans-serif)", fontSize: 15, fontWeight: 700, color: "#C77DFF" }}>
                        {quiz.quiz_title.toUpperCase()}
                      </h2>
                      <p style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, color: "#8a6aa8", marginTop: 6 }}>
                        {quiz.total_questions} QUESTIONS · {Object.keys(answers).length} ANSWERED
                      </p>
                    </div>
                    <button
                      onClick={() => { setQuiz(null); setAnswers({}); setSelectedDoc(""); }}
                      className="flex items-center gap-2 transition-all duration-200 hover:scale-[1.03]"
                      style={{
                        fontFamily: "var(--font-orbitron, sans-serif)",
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "10px 20px",
                        borderRadius: 12,
                        background: "rgba(157,78,221,0.1)",
                        border: "1px solid rgba(157,78,221,0.3)",
                        color: "#C77DFF",
                      }}
                    >
                      <Icon.Refresh size={13} color="#C77DFF" />
                      NEW QUIZ
                    </button>
                  </div>
                </GlassCard>

                {answeredAll && (
                  <GlassCard className="mb-7" padding="p-7">
                    <div className="flex items-center gap-5">
                      <div
                        className="font-black"
                        style={{
                          fontFamily: "var(--font-orbitron, sans-serif)",
                          fontSize: 42,
                          color: pct >= 70 ? "#00ff88" : "#ffaa00",
                          textShadow: pct >= 70 ? "0 0 22px rgba(0,255,136,0.6)" : "0 0 22px rgba(255,170,0,0.6)",
                        }}
                      >
                        {pct}%
                      </div>
                      <div>
                        <p style={{ fontFamily: "var(--font-orbitron, sans-serif)", fontSize: 15, fontWeight: 700, color: "#eee6ff" }}>
                          {score}/{quiz.total_questions} CORRECT
                        </p>
                        <p style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12, color: "#8a6aa8", marginTop: 5 }}>
                          {pct === 100 ? "// PERFECT_SCORE 🎉" : pct >= 70 ? "// GOOD_JOB 💪" : "// KEEP_PRACTICING 📚"}
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                )}

                <div className="space-y-4">
                  {quiz.questions.map((q, i) => (
                    <QuestionCard
                      key={q.question_number}
                      question={q}
                      index={i}
                      onAnswer={(qNum, ans) => setAnswers(prev => ({ ...prev, [qNum]: ans }))}
                      userAnswer={answers[q.question_number]}
                    />
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}