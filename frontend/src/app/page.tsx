"use client";

import { signInWithRedirect } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

const agentList = [
  { icon: "📄", label: "Notes Agent", desc: "Auto-generates smart notes from any PDF" },
  { icon: "🧠", label: "Quiz Agent", desc: "Creates MCQs with difficulty levels" },
  { icon: "📅", label: "Planner Agent", desc: "Builds your personalized study timetable" },
  { icon: "🤖", label: "Doubt Agent", desc: "Answers your questions instantly" },
  { icon: "🔔", label: "Revision Agent", desc: "Tracks weak topics and revision schedule" },
];

const featureStrip = [
  { icon: "🛡️", label: "Secure & Private", desc: "Your data is encrypted and always protected" },
  { icon: "⚡", label: "Save Time", desc: "Automate tasks and study smarter" },
  { icon: "🎯", label: "Stay Focused", desc: "Personalized tools to achieve your goals" },
  { icon: "📈", label: "Track Progress", desc: "Monitor your learning and improve daily" },
];

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);
  const handleGoogleLogin = async () => {
  try {
    console.log("Login started...");
    await signInWithRedirect(auth, googleProvider);
  } catch (error: any) {
    console.log(error);
  }
};

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#050B1F" }}>
        <p className="text-lg" style={{ color: "#8B5CF6" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #050B1F 0%, #0A1440 100%)" }}
    >
      {/* Background glow blobs */}
      <div className="absolute rounded-full pointer-events-none" style={{
        width: "600px", height: "600px", top: "-200px", left: "-200px",
        background: "radial-gradient(circle, rgba(139,92,246,0.18), transparent 70%)", filter: "blur(60px)",
      }} />
      <div className="absolute rounded-full pointer-events-none" style={{
        width: "550px", height: "550px", top: "10%", right: "-200px",
        background: "radial-gradient(circle, rgba(236,72,153,0.14), transparent 70%)", filter: "blur(60px)",
      }} />
      <div className="absolute rounded-full pointer-events-none" style={{
        width: "500px", height: "500px", bottom: "-150px", left: "20%",
        background: "radial-gradient(circle, rgba(139,92,246,0.1), transparent 70%)", filter: "blur(60px)",
      }} />

      <div className="relative z-10 max-w-[1400px] mx-auto px-10">

        {/* ============ HEADER — height 90px, top-left only ============ */}
        <header style={{ height: "90px" }} className="flex flex-col justify-center fade-in-up">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧠</span>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: "#ffffff" }}>
              NeuroStudy <span style={{ color: "#8B5CF6" }}>AI</span>
            </h1>
          </div>
          <p className="text-xs mt-1 ml-9" style={{ color: "#9CA3AF" }}>
            Your Multi-Agent AI Study Companion
          </p>
        </header>

        {/* ============ MAIN — 45% / 55% grid, side by side ============ */}
        <main
          style={{
            display: "grid",
            gridTemplateColumns: "45% 55%",
            gap: "50px",
            marginTop: "20px",
          }}
        >
          {/* ---------- LEFT PANEL (45%) ---------- */}
          <div
            className="flex flex-col items-center fade-in-up fade-in-up-1"
            style={{ gap: "32px" }}
          >
            {/* Welcome text */}
            <div className="w-full" style={{ maxWidth: "550px" }}>
              <h2 className="text-4xl font-bold mb-3" style={{ color: "#ffffff" }}>
                Welcome back! 👋
              </h2>
              <p className="text-lg" style={{ color: "#9CA3AF" }}>
                Sign in to access your AI study agents
              </p>
            </div>

            {/* Login Card — FIXED 550x300 */}
            <div
              className="flex flex-col justify-center"
              style={{
                width: "550px",
                height: "300px",
                maxWidth: "100%",
                borderRadius: "24px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                boxShadow: "0 8px 32px rgba(139,92,246,0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
                padding: "32px 40px",
              }}
            >
              <p className="text-center text-sm mb-4" style={{ color: "#9CA3AF" }}>
                Continue with
              </p>

              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300"
                style={{ height: "54px" }}
              >
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.4 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C40.8 36.3 44 30.7 44 24c0-1.3-.1-2.7-.4-3.5z"/>
                </svg>
                <span className="text-sm">Continue with Google</span>
              </button>

              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
                <span className="text-xs" style={{ color: "#6B7280" }}>or</span>
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
              </div>

              <button
                className="w-full flex items-center justify-center gap-3 rounded-xl font-medium transition-all duration-300"
                style={{
                  height: "54px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#D1D5DB",
                }}
              >
                <span>✉</span>
                <span className="text-sm">Continue with Email</span>
              </button>

              <p className="text-xs text-center mt-4" style={{ color: "#6B7280" }}>
                By signing in you agree to our{" "}
                <span style={{ color: "#8B5CF6" }}>terms of service</span>
              </p>
            </div>

            {/* Brain Illustration — 300px, centered */}
            <div
              className="relative flex items-center justify-center"
              style={{ width: "300px", height: "300px" }}
            >
              <div className="absolute rounded-full" style={{
                width: "260px", height: "90px", bottom: "20px",
                border: "1px solid rgba(139,92,246,0.3)",
                boxShadow: "0 0 40px rgba(139,92,246,0.25), inset 0 0 20px rgba(139,92,246,0.1)",
              }} />
              <div className="absolute rounded-full" style={{
                width: "180px", height: "55px", bottom: "30px",
                background: "radial-gradient(ellipse, rgba(139,92,246,0.35), transparent 70%)",
                filter: "blur(10px)",
              }} />
              <div
                className="relative z-10"
                style={{
                  fontSize: "90px",
                  filter: "drop-shadow(0 0 35px rgba(236,72,153,0.55)) drop-shadow(0 0 60px rgba(139,92,246,0.45))",
                  animation: "floatBrain 4s ease-in-out infinite",
                }}
              >
                🧠
              </div>
              {[
                { icon: "📄", style: { top: "15px", left: "10px" } },
                { icon: "📅", style: { top: "15px", right: "10px" } },
                { icon: "🤖", style: { bottom: "65px", left: "-15px" } },
                { icon: "🔔", style: { bottom: "65px", right: "-15px" } },
              ].map((item, i) => (
                <div
                  key={i}
                  className="absolute w-11 h-11 rounded-xl flex items-center justify-center text-lg"
                  style={{
                    ...item.style,
                    background: "rgba(139,92,246,0.08)",
                    border: "1px solid rgba(139,92,246,0.25)",
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 0 18px rgba(139,92,246,0.2)",
                    animation: `floatIcon 3s ease-in-out infinite`,
                    animationDelay: `${i * 0.4}s`,
                  }}
                >
                  {item.icon}
                </div>
              ))}
            </div>
          </div>

          {/* ---------- RIGHT PANEL (55%) ---------- */}
          <div className="flex flex-col fade-in-up fade-in-up-2">
            {/* Section title */}
            <div className="mb-6">
              <h3 className="text-3xl font-bold mb-2" style={{ color: "#ffffff" }}>
                Your AI Study Agents
              </h3>
              <p className="text-lg" style={{ color: "#9CA3AF" }}>
                Powerful agents to supercharge your learning
              </p>
            </div>

            {/* 5 agent cards — vertical stack, 24px gap, each 100px tall */}
            <div className="flex flex-col" style={{ gap: "24px" }}>
              {agentList.map((agent, i) => (
                <div
                  key={agent.label}
                  className="group flex items-center justify-between cursor-pointer transition-all duration-300 fade-in-up"
                  style={{
                    width: "100%",
                    height: "100px",
                    borderRadius: "24px",
                    padding: "0 24px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    animationDelay: `${0.1 * i}s`,
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.transform = "translateY(-3px) scale(1.01)";
                    el.style.borderColor = "rgba(139,92,246,0.45)";
                    el.style.boxShadow = "0 10px 35px rgba(139,92,246,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.transform = "none";
                    el.style.borderColor = "rgba(255,255,255,0.1)";
                    el.style.boxShadow = "none";
                  }}
                >
                  {/* icon */}
                  <div
                    className="flex items-center justify-center shrink-0 rounded-xl text-2xl"
                    style={{
                      width: "56px", height: "56px",
                      background: "linear-gradient(135deg, rgba(139,92,246,0.22), rgba(236,72,153,0.12))",
                      border: "1px solid rgba(139,92,246,0.25)",
                    }}
                  >
                    {agent.icon}
                  </div>

                  {/* title + description */}
                  <div className="flex-1 min-w-0 px-5">
                    <p className="font-semibold text-base" style={{ color: "#ffffff" }}>
                      {agent.label}
                    </p>
                    <p className="text-sm mt-1" style={{ color: "#9CA3AF" }}>
                      {agent.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* ============ BOTTOM FEATURE BAR — below main, mt-80px, h-160px ============ */}
        <section style={{ marginTop: "80px" }} className="fade-in-up fade-in-up-3">
          <div
            style={{
              minHeight: "160px",
              borderRadius: "24px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              padding: "32px",
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "24px",
              alignItems: "center",
            }}
          >
            {featureStrip.map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <span className="text-2xl shrink-0" style={{ filter: "drop-shadow(0 0 8px rgba(139,92,246,0.5))" }}>
                  {f.icon}
                </span>
                <div>
                  <p className="font-semibold text-sm mb-1" style={{ color: "#ffffff" }}>
                    {f.label}
                  </p>
                  <p className="text-xs leading-snug" style={{ color: "#9CA3AF" }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============ FOOTER ============ */}
        <footer className="text-center fade-in-up fade-in-up-4" style={{ marginTop: "40px", paddingBottom: "32px" }}>
          <p className="text-sm" style={{ color: "#6B7280" }}>
            © 2024 NeuroStudy AI. All rights reserved.
          </p>
        </footer>
      </div>

      <style jsx>{`
        @keyframes floatBrain {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
        @keyframes floatIcon {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @media (max-width: 1024px) {
          main {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}