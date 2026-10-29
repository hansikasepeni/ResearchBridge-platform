"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Shield,
  BookOpen,
  ArrowRight,
  Sparkles,
  Lock,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Eye,
  EyeOff,
  UserPlus,
  ArrowLeft,
  Building,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth, DEMO_PERSONAS } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { UserRole } from "@/types/api";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const { signInWithEmail, signUpWithEmail, signInAsDemo, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("alice.student@stanford.edu");
  const [password, setPassword] = useState("password123");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Role info metadata
  const roleCards = [
    {
      role: "student" as UserRole,
      title: "Student Researcher",
      icon: GraduationCap,
      badge: "Student",
      badgeVariant: "default" as const,
      color: "from-blue-600 to-indigo-600",
      description: "Search professors, apply to active lab openings, track requests, and build an evidence-based skill passport.",
      demoPersona: DEMO_PERSONAS[0], // Alice Chen
    },
    {
      role: "professor" as UserRole,
      title: "Faculty / Professor",
      icon: BookOpen,
      badge: "Faculty PI",
      badgeVariant: "teal" as const,
      color: "from-teal-600 to-emerald-600",
      description: "Advertise research grants, review student applications, compose AI teams, and evaluate candidates with Talent Matcher.",
      demoPersona: DEMO_PERSONAS[1], // Alan Turing
    },
    {
      role: "admin" as UserRole,
      title: "Platform Administrator",
      icon: Shield,
      badge: "Governance",
      badgeVariant: "destructive" as const,
      color: "from-slate-700 to-slate-900",
      description: "Manage institution departments, approve faculty onboarding requests, inspect audit logs, and oversee campus security.",
      demoPersona: DEMO_PERSONAS[2], // Eleanor Vance
    },
  ];

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError(null);
    // Autofill with the role's demo credentials as helpful default
    const persona = DEMO_PERSONAS.find((p) => p.role === role);
    if (persona && authMode === "login") {
      setEmail(persona.email);
      setPassword(persona.password || "password123");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (authMode === "login") {
        if (!email.trim() || !password.trim()) {
          setError("Please enter your email and password.");
          setIsSubmitting(false);
          return;
        }

        const res = await signInWithEmail(email, password, selectedRole);
        if (res.success) {
          router.push("/dashboard");
        } else {
          setError(res.error || "Invalid login credentials. Please check your email and password.");
        }
      } else {
        if (!fullName.trim() || !email.trim() || !password.trim()) {
          setError("Please complete all registration fields.");
          setIsSubmitting(false);
          return;
        }

        const res = await signUpWithEmail(email, password, fullName, selectedRole);
        if (res.success) {
          router.push("/dashboard");
        } else {
          setError(res.error || "Failed to register account.");
        }
      }
    } catch (err: any) {
      setError(err.message || "An authentication error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handle1ClickDemoLogin = async (personaId: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await signInAsDemo(personaId);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign in with demo role.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutofillDemo = (persona: typeof DEMO_PERSONAS[0]) => {
    setSelectedRole(persona.role);
    setEmail(persona.email);
    setPassword(persona.password || "password123");
    setAuthMode("login");
    setError(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(text);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white transition-colors duration-300">
      {/* Top Header */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-500 transition-colors shrink-0">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Research<span className="text-blue-600 dark:text-blue-400">Bridge</span>
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 block -mt-1 font-medium tracking-wider">
                ACADEMIC NETWORK
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Switcher Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200/80 dark:border-white/15 bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 hover:border-amber-400/50 transition-all cursor-pointer shadow-xs active:scale-95 flex items-center justify-center group shrink-0"
              title={mounted && theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme"
            >
              {mounted && theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:-rotate-12 transition-transform duration-300" />
              )}
            </button>

            <Link
              href="/"
              className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1.5 transition-colors shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back to </span>Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 w-full space-y-6 sm:space-y-10">
        {/* Hero Section */}
        <div className="text-center space-y-2.5 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Academic Portal • Multi-Role Access</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Sign In to ResearchBridge
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed px-1">
            Select your academic role to proceed with your institutional email, or use
            the pre-configured demo credentials below for instant role evaluation.
          </p>
        </div>

        {/* STEP 1: Role Selection Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>Step 1: Select Your Academic Role</span>
            </h2>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Active: <strong className="text-blue-600 dark:text-blue-400 capitalize">{selectedRole}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {roleCards.map((rc) => {
              const Icon = rc.icon;
              const isSelected = selectedRole === rc.role;

              return (
                <div
                  key={rc.role}
                  onClick={() => handleRoleSelect(rc.role)}
                  className={`relative p-5 rounded-2xl cursor-pointer transition-all duration-300 border text-left flex flex-col justify-between ${
                    isSelected
                      ? rc.role === "student"
                        ? "bg-white dark:bg-gradient-to-b dark:from-slate-900/95 dark:to-blue-950/60 border-blue-500 shadow-xl shadow-blue-500/15 dark:shadow-blue-500/20 ring-2 ring-blue-500/50 -translate-y-0.5"
                        : rc.role === "professor"
                        ? "bg-white dark:bg-gradient-to-b dark:from-slate-900/95 dark:to-teal-950/60 border-teal-500 shadow-xl shadow-teal-500/15 dark:shadow-teal-500/20 ring-2 ring-teal-500/50 -translate-y-0.5"
                        : "bg-white dark:bg-gradient-to-b dark:from-slate-900/95 dark:to-purple-950/60 border-purple-500 shadow-xl shadow-purple-500/15 dark:shadow-purple-500/20 ring-2 ring-purple-500/50 -translate-y-0.5"
                      : "bg-white/80 dark:bg-slate-900/50 border-slate-200/90 dark:border-slate-800/80 hover:bg-white dark:hover:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:-translate-y-1"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${rc.color} text-white flex items-center justify-center shadow-md`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <Badge variant={rc.badgeVariant} className="text-[10px]">
                        {rc.badge}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                        {rc.title}
                      </h3>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {rc.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-700/50 flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 dark:text-slate-300">
                      Default Demo:{" "}
                      <strong className="text-slate-900 dark:text-white font-semibold">{rc.demoPersona.name}</strong>
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        isSelected ? "text-blue-600 dark:text-blue-400" : "text-slate-400"
                      }`}
                    >
                      {isSelected ? "Selected ✓" : "Click to Select"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP 2: Email & Password Form + Step 3: Demo Roles Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Email & Password Form (5 Cols) */}
          <div className="lg:col-span-5 bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-6 text-slate-900 dark:text-slate-100 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {authMode === "login" ? "Sign In with Email" : "Register Account"}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-300">
                  Role: <span className="text-blue-600 dark:text-blue-400 font-semibold capitalize">{selectedRole}</span>
                </p>
              </div>

              {/* Mode Toggle */}
              <div className="flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setError(null);
                  }}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    authMode === "login"
                      ? "bg-blue-600 text-white font-semibold shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("register");
                    setError(null);
                  }}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    authMode === "register"
                      ? "bg-blue-600 text-white font-semibold shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {authMode === "register" && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Full Name &amp; Title
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. John von Neumann"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Institutional Email ID
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="name@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center justify-between">
                  <span>Password</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                    (Use <strong className="text-slate-900 dark:text-white font-semibold">password123</strong> for demo accounts)
                  </span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full text-xs font-semibold shadow-md shadow-blue-600/30 gap-1.5 mt-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span>Authenticating...</span>
                ) : authMode === "login" ? (
                  <>
                    <span>Sign In as {selectedRole.toUpperCase()}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Create {selectedRole.toUpperCase()} Account</span>
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Right Column: Pre-Seeded Demo Credentials Grid (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-500 dark:text-teal-400" />
                  <span>Pre-Seeded Demo Accounts (1-Click Login)</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Click any account below to instantly log in or autofill the credentials above.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {DEMO_PERSONAS.map((persona) => {
                const isCurrentRole = selectedRole === persona.role;

                return (
                  <div
                    key={persona.id}
                    className="bg-white/95 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 space-y-3.5 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 flex flex-col justify-between shadow-md hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-xl font-bold text-sm flex items-center justify-center shrink-0 shadow-md ${
                              persona.role === "student"
                                ? "bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-blue-500/25"
                                : persona.role === "professor"
                                ? "bg-gradient-to-tr from-teal-600 to-emerald-400 text-white shadow-teal-500/25"
                                : "bg-gradient-to-tr from-purple-600 to-pink-500 text-white shadow-purple-500/25"
                            }`}
                          >
                            {persona.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">
                              {persona.name}
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-300 font-medium line-clamp-1">
                              {persona.title}
                            </p>
                          </div>
                        </div>

                        <Badge
                          variant={
                            persona.role === "admin"
                              ? "destructive"
                              : persona.role === "professor"
                              ? "teal"
                              : "default"
                          }
                          className="text-[9px] capitalize shrink-0"
                        >
                          {persona.role}
                        </Badge>
                      </div>

                      {/* Credentials Display Box */}
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700/80 space-y-1.5 text-[11px] font-mono">
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">EMAIL:</span>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-slate-900 dark:text-white font-semibold select-all break-all text-[10px] sm:text-[11px] truncate max-w-[140px] xs:max-w-[190px] sm:max-w-none">{persona.email}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(persona.email)}
                              className="text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                              title="Copy email"
                            >
                              {copiedEmail === persona.email ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">PASSWORD:</span>
                          <span className="text-slate-900 dark:text-white font-semibold">{persona.password || "password123"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        onClick={() => handle1ClickDemoLogin(persona.id)}
                        disabled={isSubmitting}
                        className="flex-1 text-[11px] py-1.5 font-semibold"
                      >
                        <span>1-Click Sign In</span>
                        <ArrowRight className="w-3 h-3" />
                      </Button>

                      <button
                        type="button"
                        onClick={() => handleAutofillDemo(persona)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:bg-slate-300 dark:active:bg-slate-600 text-slate-800 dark:text-white font-semibold text-[11px] border border-slate-300 dark:border-slate-600 transition-all cursor-pointer shadow-xs select-none"
                      >
                        Autofill
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-6 px-4 text-center text-xs text-slate-500">
        <p>ResearchBridge — Stanford University Academic Network &amp; Collaboration Platform.</p>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-600">
          Role-governed environment for students, faculty supervisors, and institutional administrators.
        </p>
      </footer>
    </div>
  );
}
