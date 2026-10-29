"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Sparkles,
  Search,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users2,
  Send,
  Atom,
  TrendingUp,
  BrainCircuit,
  Award,
  ChevronRight,
  UserCheck,
  Shield,
  Layers,
  FileText,
  Zap,
  Network,
  Compass,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export default function LandingPage() {
  const router = useRouter();
  const { switchPersona } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleQuickDemoLaunch = (personaId: string) => {
    switchPersona(personaId);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white relative overflow-hidden transition-colors duration-300">
      {/* Immersive Animated Aurora Mesh Lights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[600px] bg-gradient-to-b from-blue-500/20 dark:from-blue-600/25 via-indigo-500/15 dark:via-indigo-600/15 to-transparent rounded-full blur-[150px] pointer-events-none animate-pulse-glow" />
      <div className="absolute top-1/4 left-[-100px] w-[600px] h-[600px] bg-teal-400/20 dark:bg-teal-500/15 rounded-full blur-[140px] pointer-events-none animate-float" />
      <div className="absolute top-1/3 right-[-100px] w-[600px] h-[600px] bg-purple-400/20 dark:bg-purple-600/18 rounded-full blur-[150px] pointer-events-none animate-float" style={{ animationDelay: "2.5s" }} />
      <div className="absolute bottom-1/4 left-1/3 w-[500px] h-[400px] bg-rose-400/15 dark:bg-rose-500/10 rounded-full blur-[130px] pointer-events-none animate-pulse-glow" />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(100, 116, 139, 0.45) 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />

      {/* Top Glass Navigation */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50 shadow-md dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-all duration-300">
              <GraduationCap className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </div>
            <div>
              <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1">
                Research<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500 dark:from-blue-400 dark:to-teal-300">Bridge</span>
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 block -mt-1 font-semibold tracking-widest">
                ACADEMIC NETWORK
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button - Always on the right side */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 sm:w-9 sm:h-9 p-0 rounded-xl border border-slate-200/80 dark:border-white/15 bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 hover:border-amber-400/50 transition-all cursor-pointer shadow-xs active:scale-95 flex items-center justify-center group shrink-0"
              title={mounted && theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme"
            >
              {mounted && theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:-rotate-12 transition-transform duration-300" />
              )}
            </button>

            {/* Desktop Only Buttons: Sign In & Launch Platform */}
            <Link
              href="/login"
              className="hidden sm:flex px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 hover:border-blue-500/60 transition-all items-center gap-1.5 shadow-xs hover:shadow-blue-500/10 shrink-0"
            >
              <UserCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Demo Roles &amp; Sign In</span>
            </Link>
            <Link
              href="/dashboard"
              className="hidden sm:flex px-4 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white transition-all shadow-lg shadow-blue-600/30 hover:shadow-cyan-500/40 items-center gap-1.5 group shrink-0 active:scale-95"
            >
              <span>Launch Platform</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-8 sm:pt-20 pb-12 sm:pb-20 px-3 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-4 sm:space-y-7">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-blue-500/15 via-purple-500/15 to-teal-500/15 border border-blue-500/30 text-blue-700 dark:text-blue-300 text-[11px] sm:text-xs font-semibold shadow-lg shadow-blue-500/10 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
            <span>Stanford University Academic Network • Version 2.0</span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15]">
            Connecting Students &amp; Faculty for{" "}
            <span className="shimmer-text">
              Breakthrough Academic Discovery
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Eliminate cold emails and scattered lab vacancies. Discover verified faculty supervisors,
            explore funded research projects, analyze publications with Gemini AI, and apply with a verified Skill Passport.
          </p>

          {/* Mobile Only: Sign In & Launch Platform Separately */}
          <div className="flex sm:hidden flex-col xs:flex-row items-center justify-center gap-2 pt-1 max-w-xs mx-auto w-full">
            <Link
              href="/login"
              className="w-full xs:w-1/2 py-2 px-3 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/15 shadow-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <UserCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Sign In</span>
            </Link>
            <Link
              href="/dashboard"
              className="w-full xs:w-1/2 py-2 px-3 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 text-white shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <span>To Platform</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Quick 1-Click Persona Launchpad - Compact & Neat on Mobile */}
          <div className="pt-2 sm:pt-4 max-w-3xl mx-auto">
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider sm:tracking-widest mb-2 sm:mb-3 flex items-center justify-center gap-1.5 sm:gap-2">
              <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 dark:text-amber-400" />
              <span>Experience ResearchBridge with 1-Click Demo Profiles</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              {/* Student */}
              <button
                onClick={() => handleQuickDemoLaunch("00000000-0000-0000-0000-000000000003")}
                className="py-2.5 px-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-gradient-to-b dark:from-slate-900/90 dark:to-blue-950/40 border border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:shadow-[0_0_30px_rgba(59,130,246,0.25)] transition-all duration-300 text-left flex items-center justify-between group cursor-pointer shadow-xs sm:shadow-md hover:-translate-y-0.5 sm:hover:-translate-y-1"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-sm sm:shadow-md shadow-blue-500/30 group-hover:scale-105 transition-transform shrink-0">
                    <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors truncate">
                      Alice Chen
                    </p>
                    <p className="text-[10px] text-blue-600 dark:text-blue-300/80 font-medium truncate">Student Researcher</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0" />
              </button>

              {/* Professor */}
              <button
                onClick={() => handleQuickDemoLaunch("00000000-0000-0000-0000-000000000002")}
                className="py-2.5 px-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-gradient-to-b dark:from-slate-900/90 dark:to-teal-950/40 border border-slate-200 dark:border-slate-800 hover:border-teal-400 hover:shadow-[0_0_30px_rgba(20,184,166,0.25)] transition-all duration-300 text-left flex items-center justify-between group cursor-pointer shadow-xs sm:shadow-md hover:-translate-y-0.5 sm:hover:-translate-y-1"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-sm sm:shadow-md shadow-teal-500/30 group-hover:scale-105 transition-transform shrink-0">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors truncate">
                      Prof. Alan Turing
                    </p>
                    <p className="text-[10px] text-teal-600 dark:text-teal-300/80 font-medium truncate">Faculty PI / Chair</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-teal-500 group-hover:translate-x-1 transition-all shrink-0" />
              </button>

              {/* Admin */}
              <button
                onClick={() => handleQuickDemoLaunch("00000000-0000-0000-0000-000000000001")}
                className="py-2.5 px-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-gradient-to-b dark:from-slate-900/90 dark:to-purple-950/40 border border-slate-200 dark:border-slate-800 hover:border-purple-400 hover:shadow-[0_0_30px_rgba(168,85,247,0.25)] transition-all duration-300 text-left flex items-center justify-between group cursor-pointer shadow-xs sm:shadow-md hover:-translate-y-0.5 sm:hover:-translate-y-1"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-sm sm:shadow-md shadow-purple-500/30 group-hover:scale-105 transition-transform shrink-0">
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors truncate">
                      Dr. Eleanor Vance
                    </p>
                    <p className="text-[10px] text-purple-600 dark:text-purple-300/80 font-medium truncate">Admin Governance</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all shrink-0" />
              </button>
            </div>
          </div>
        </div>

        {/* Live Academic Network Metrics Ticker */}
        <div className="max-w-5xl mx-auto mt-16 p-5 rounded-3xl bg-white/85 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/90 backdrop-blur-xl grid grid-cols-2 md:grid-cols-4 gap-4 text-center shadow-xl shadow-slate-200/50 dark:shadow-xl">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">100%</div>
            <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 font-medium">Verified Stanford Labs</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-blue-500/20 hover:border-blue-500/40 transition-colors">
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">24+</div>
            <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 font-medium">Active Funded Openings</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-teal-500/20 hover:border-teal-500/40 transition-colors">
            <div className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-400 tracking-tight">98.4%</div>
            <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 font-medium">Talent Match Precision</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-purple-500/20 hover:border-purple-500/40 transition-colors">
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400 tracking-tight">Gemini 2.5</div>
            <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 font-medium">Contextual AI Assistant</div>
          </div>
        </div>

        {/* Bento Grid Features */}
        <div className="max-w-6xl mx-auto mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          {/* Card 1: Vectorized Talent Matcher & Radar */}
          <div className="md:col-span-2 p-8 rounded-3xl bg-white/90 dark:bg-gradient-to-br dark:from-slate-900/90 dark:via-slate-900/60 dark:to-blue-950/30 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 backdrop-blur-xl space-y-5 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(59,130,246,0.15)] flex flex-col justify-between shadow-xl group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <span className="text-[11px] px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-500/30">
                  Embeddings &amp; Radar
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                Vectorized Talent Matcher &amp; Opportunity Radar
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                Faculty PIs can evaluate student applicants against custom lab skill requirements,
                coursework prerequisites, and research publications with explainable match rationales.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 transition-colors space-y-1">
                <div className="text-xs font-bold text-blue-700 dark:text-blue-300">Semantic Matching</div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Analyzes research interests &amp; code skills</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 hover:border-teal-500/40 transition-colors space-y-1">
                <div className="text-xs font-bold text-teal-700 dark:text-teal-300">Opportunity Radar</div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Automated candidate recommendation</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 hover:border-purple-500/40 transition-colors space-y-1">
                <div className="text-xs font-bold text-purple-700 dark:text-purple-300">Skill Passport</div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Verifiable laboratory achievements</p>
              </div>
            </div>
          </div>

          {/* Card 2: AI Paper Review */}
          <div className="p-8 rounded-3xl bg-white/90 dark:bg-gradient-to-br dark:from-slate-900/90 dark:via-slate-900/60 dark:to-teal-950/30 border border-slate-200 dark:border-slate-800 hover:border-teal-500/50 backdrop-blur-xl space-y-5 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(20,184,166,0.15)] flex flex-col justify-between shadow-xl group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-400 text-white flex items-center justify-center shadow-lg shadow-teal-500/30">
                  <Atom className="w-6 h-6 animate-spin-slow" />
                </div>
                <span className="text-[11px] px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 font-semibold border border-teal-200 dark:border-teal-500/30">
                  Gemini Flash
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors">
                Explainable Literature AI
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Break down complex academic papers into executive abstracts, research questions, methodologies, and critiques.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-gradient-to-r dark:from-teal-500/10 dark:to-emerald-500/10 border border-teal-200 dark:border-teal-500/30 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-500 dark:bg-teal-400 animate-ping" />
                <span className="text-xs font-bold text-teal-700 dark:text-teal-300">Gemini Academic Engine</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30 font-medium">
                  Summarize Papers
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30 font-medium">
                  Extract Citations
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Formal Applications */}
          <div className="p-8 rounded-3xl bg-white/90 dark:bg-gradient-to-br dark:from-slate-900/90 dark:via-slate-900/60 dark:to-indigo-950/30 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 backdrop-blur-xl space-y-5 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(99,102,241,0.15)] flex flex-col justify-between shadow-xl group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <Send className="w-6 h-6" />
                </div>
                <span className="text-[11px] px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-500/30">
                  Workflow
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                Structured Application Cycle
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Replaces cluttered inboxes with clear application statuses (Submitted, Under Review, Interview, Accepted).
              </p>
            </div>

            <Link
              href="/requests"
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold flex items-center gap-1.5 pt-2 group-hover:translate-x-1 transition-transform"
            >
              <span>Explore Application System</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 4: Collaboration Graph */}
          <div className="md:col-span-2 p-8 rounded-3xl bg-white/90 dark:bg-gradient-to-br dark:from-slate-900/90 dark:via-slate-900/60 dark:to-purple-950/30 border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 backdrop-blur-xl space-y-5 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(168,85,247,0.15)] flex flex-col justify-between shadow-xl group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Users2 className="w-6 h-6" />
                </div>
                <span className="text-[11px] px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-500/30">
                  Knowledge Graph
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                Multi-Disciplinary Team Composer &amp; Knowledge Graph
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                Visualize co-authorship networks, identify complementary research groups across engineering and medicine,
                and compose balanced student teams for major grant proposals.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-[11px] px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-900/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 font-medium">
                Interactive Co-Authorship Graph
              </span>
              <span className="text-[11px] px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-900/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 font-medium">
                Grant Team Builder
              </span>
              <span className="text-[11px] px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-900/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 font-medium">
                Department Governance
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Section with Ambient Glow */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-slate-900 relative">
        <div className="max-w-4xl mx-auto rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-blue-900 via-purple-900 to-teal-900 border border-blue-400/30 backdrop-blur-2xl text-center space-y-6 relative overflow-hidden shadow-[0_20px_60px_rgba(37,99,235,0.25)] text-white">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-teal-400/15 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/15 rounded-full blur-[80px] pointer-events-none" />

          <div className="space-y-3 relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to Pioneer Breakthrough Research?
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 max-w-xl mx-auto leading-relaxed">
              Step into the platform today. Choose any role, test the AI assistants, and explore faculty opportunities.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 relative z-10">
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white shadow-xl shadow-blue-600/40 hover:shadow-cyan-500/50 transition-all duration-300 flex items-center justify-center gap-2 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-teal-300" />
              <span>Sign In with Demo Credentials</span>
            </Link>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <GraduationCap className="w-4 h-4 text-blue-400" />
              <span>Direct Dashboard Access</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-900 py-8 px-4 text-center text-xs text-slate-500">
        <p>ResearchBridge — Stanford University Academic Network &amp; Collaboration Platform.</p>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-600">Built with Next.js 16, FastAPI, Supabase, and Google Gemini AI.</p>
      </footer>
    </div>
  );
}
