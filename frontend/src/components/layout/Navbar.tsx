"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Search,
  UserCheck,
  ChevronDown,
  LogOut,
  Sparkles,
  Shield,
  BookOpen,
  Menu,
  X,
  Mail,
  Lock,
  UserPlus,
  Sun,
  Moon,
  LayoutDashboard,
  Users,
  Briefcase,
  Award,
  Lightbulb,
  Users2,
  CheckCircle,
  Network,
  Send,
  MessageSquare,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { useAuth, DEMO_PERSONAS } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { usePathname } from "next/navigation";
import { UserRole } from "@/types/api";

export function Navbar() {
  const { user, role, activePersona, switchPersona, signInWithEmail, signUpWithEmail, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isPersonaOpen, setIsPersonaOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Custom Email Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authFullName, setAuthFullName] = useState("");
  const [authRole, setAuthRole] = useState<UserRole>("student");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmittingAuth(true);

    try {
      if (authMode === "login") {
        const res = await signInWithEmail(authEmail, authPassword);
        if (!res.success) {
          setAuthError(res.error || "Failed to sign in");
        } else {
          setIsAuthModalOpen(false);
          setAuthPassword("");
        }
      } else {
        const res = await signUpWithEmail(authEmail, authPassword, authFullName, authRole);
        if (!res.success) {
          setAuthError(res.error || "Failed to create account");
        } else {
          setIsAuthModalOpen(false);
          setAuthPassword("");
        }
      }
    } catch (err: any) {
      setAuthError(err.message || "Authentication error occurred");
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["student", "professor", "admin"] },
    { name: "Faculty Directory", href: "/professors", icon: Users, roles: ["student", "professor", "admin"] },
    { name: "Research Openings", href: "/projects", icon: Briefcase, roles: ["student", "professor", "admin"] },
    { name: "Talent Matcher", href: "/talent-matcher", icon: Sparkles, roles: ["professor", "admin", "student"] },
    { name: "Skill Passport", href: "/skills", icon: Award, roles: ["student", "professor", "admin"] },
    { name: "Idea Pipeline", href: "/ideas", icon: Lightbulb, roles: ["student", "professor", "admin"] },
    { name: "Team Composer", href: "/teams", icon: Users2, roles: ["professor", "admin"] },
    { name: "Contributions", href: "/contributions", icon: CheckCircle, roles: ["student", "professor", "admin"] },
    { name: "Collab Graph", href: "/collaboration-graph", icon: Network, roles: ["student", "professor", "admin"] },
    { name: role === "professor" ? "Student Applications" : "My Applications", href: "/requests", icon: Send, roles: ["student", "professor", "admin"] },
    { name: "Messages & Collab", href: "/messages", icon: MessageSquare, roles: ["student", "professor", "admin"] },
    { name: "Paper Library", href: "/documents", icon: FileText, roles: ["student", "professor", "admin"] },
    { name: "Admin Governance", href: "/admin", icon: ShieldCheck, roles: ["admin"] },
  ];

  const permittedNav = navigation.filter(
    (item) => !item.roles || item.roles.includes(role || "student")
  );

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-b border-slate-200/80 dark:border-white/10 shadow-lg dark:shadow-2xl shadow-slate-200/40 dark:shadow-black/40 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand Identity & Campus Pill */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link href="/dashboard" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 group-hover:scale-105 group-hover:shadow-cyan-500/40 transition-all shrink-0">
              <GraduationCap className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </div>
            <div>
              <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-0.5 sm:gap-1">
                Research<span className="text-cyan-600 dark:text-cyan-400">Bridge</span>
              </span>
              <span className="hidden sm:block text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 -mt-1 font-semibold tracking-wider">
                ACADEMIC NETWORK
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold border border-emerald-200 dark:border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            <span>Stanford University Live</span>
          </div>
        </div>

        {/* Right: Controls & User Profile - Clean, spacious touch targets */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Notifications Center */}
          <NotificationCenter />

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-slate-200/80 dark:border-white/15 bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 hover:border-amber-400/50 transition-all cursor-pointer shadow-xs active:scale-95 flex items-center justify-center group shrink-0"
            title={mounted && theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle theme"
          >
            {mounted && theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:-rotate-12 transition-transform duration-300" />
            )}
          </button>

          {/* Persona Switcher / Login Button - Desktop (md+) */}
          {user ? (
            <div className="relative hidden md:block">
              <button
                onClick={() => setIsPersonaOpen(!isPersonaOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/15 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-cyan-500/50 transition-all shadow-sm cursor-pointer"
                title="Switch demo persona for testing"
              >
                <div
                  className={`w-6 h-6 rounded-lg font-bold text-[11px] flex items-center justify-center text-white shrink-0 shadow-xs ${
                    role === "admin"
                      ? "bg-gradient-to-tr from-rose-600 to-red-500"
                      : role === "professor"
                      ? "bg-gradient-to-tr from-teal-600 to-emerald-500"
                      : "bg-gradient-to-tr from-cyan-500 to-blue-600"
                  }`}
                >
                  {(activePersona?.name || user?.full_name || "A").charAt(0)}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 dark:text-slate-400">Role:</span>
                  <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[100px] lg:max-w-none" suppressHydrationWarning>
                    {mounted ? (activePersona?.name || user?.full_name || "Alice Chen") : "Alice Chen"}
                  </span>
                  <Badge
                    variant={
                      role === "admin"
                        ? "destructive"
                        : role === "professor"
                        ? "teal"
                        : "default"
                    }
                    withDot
                    className="text-[9px] px-1.5 py-0 capitalize hidden lg:inline-flex shrink-0"
                  >
                    {role}
                  </Badge>
                  <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                </div>
              </button>

              {isPersonaOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-200/90 dark:border-white/15 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-slate-900 dark:text-slate-100"
                  onClick={() => setIsPersonaOpen(false)}
                >
                  <div className="px-3.5 py-2.5 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Quick Demo Roles
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Switch accounts instantly
                      </p>
                    </div>
                    <Link
                      href="/login"
                      className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-semibold"
                    >
                      Login Page →
                    </Link>
                  </div>
                  {DEMO_PERSONAS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => switchPersona(p.id)}
                      className={`w-full text-left px-3.5 py-2 flex items-start gap-2.5 text-xs hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer ${
                        activePersona?.id === p.id
                          ? "bg-indigo-50 dark:bg-indigo-600/20 border-l-2 border-cyan-500 dark:border-cyan-400 text-indigo-900 dark:text-white"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 flex items-center justify-center shrink-0 font-bold text-[10px]">
                        {p.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900 dark:text-white truncate">
                            {p.name}
                          </span>
                          <Badge
                            variant={
                              p.role === "admin"
                                ? "destructive"
                                : p.role === "professor"
                                ? "teal"
                                : "default"
                            }
                            className="text-[9px] px-1.5 py-0 capitalize"
                          >
                            {p.role}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {p.title}
                        </p>
                      </div>
                    </button>
                  ))}

                  {/* Email Sign-In / Register Option */}
                  <div className="p-2 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-slate-950/60 space-y-1.5">
                    <Link
                      href="/login"
                      className="w-full py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Role Portal / Custom Login</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="hidden sm:inline-flex">
              <Button size="sm" variant="primary" className="text-xs px-2.5 py-1.5 gap-1.5 shadow-md">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Button>
            </Link>
          )}

          {/* Desktop User Logout Button */}
          {user && (
            <div className="hidden md:flex items-center">
              <div className="h-6 w-[1px] bg-slate-200 dark:bg-white/10 mx-1" />
              <button
                onClick={async () => {
                  await signOut();
                  window.location.href = "/login";
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-transparent hover:border-rose-500/30 hover:bg-rose-500/10 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold transition-colors cursor-pointer"
                title="Sign out of account"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}

          {/* Mobile Navigation Drawer Trigger (Hamburger / Close) - Clean on right edge */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-slate-200/80 dark:border-white/15 bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-xs active:scale-95"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-4.5 h-4.5 text-rose-500" /> : <Menu className="w-4.5 h-4.5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl px-3.5 py-3.5 shadow-2xl animate-in fade-in slide-in-from-top duration-150 max-h-[calc(100vh-3.5rem)] overflow-y-auto text-slate-900 dark:text-slate-100 space-y-3">
          
          {/* User Profile Card & Quick Role Switcher at TOP of Drawer */}
          {user ? (
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl font-bold text-sm flex items-center justify-center text-white shrink-0 shadow-md ${
                      role === "admin"
                        ? "bg-gradient-to-tr from-rose-600 to-red-500"
                        : role === "professor"
                        ? "bg-gradient-to-tr from-teal-600 to-emerald-500"
                        : "bg-gradient-to-tr from-cyan-500 to-blue-600"
                    }`}
                  >
                    {(activePersona?.name || user?.full_name || "A").charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white text-xs truncate">
                      {activePersona?.name || user?.full_name || "Scholar"}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {user?.email || "academic@stanford.edu"}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    role === "admin"
                      ? "destructive"
                      : role === "professor"
                      ? "teal"
                      : "default"
                  }
                  withDot
                  className="text-[10px] px-2 py-0.5 capitalize shrink-0"
                >
                  {role}
                </Badge>
              </div>

              {/* 1-Tap Quick Switch Role Pills */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-white/10">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Switch Demo Persona:
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {DEMO_PERSONAS.map((p) => {
                    const isCurrent = activePersona?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          switchPersona(p.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold flex items-center justify-center transition-all cursor-pointer border ${
                          isCurrent
                            ? "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/50 shadow-xs"
                            : "bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-cyan-400/40"
                        }`}
                      >
                        <span className="capitalize">{p.role}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 border border-blue-500/20">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold text-xs shadow-md flex items-center justify-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" />
                <span>Sign In / Choose Role</span>
              </Link>
            </div>
          )}

          {/* Navigation Links Grid */}
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1 mb-1.5">
              Navigation:
            </p>
            <nav className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {permittedNav.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold shadow-md shadow-indigo-500/25"
                        : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-cyan-600 dark:text-cyan-400"}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Sign Out Button in Drawer */}
          {user && (
            <div className="pt-2 border-t border-slate-200/80 dark:border-white/10">
              <button
                onClick={async () => {
                  await signOut();
                  setIsMobileMenuOpen(false);
                  window.location.href = "/login";
                }}
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Account</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Custom Email / Password Authentication Modal */}
      <Modal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        title={authMode === "login" ? "Sign In to ResearchBridge" : "Create University Account"}
        description={
          authMode === "login"
            ? "Enter your academic email and password to access your persistent research profile."
            : "Register as an undergraduate researcher, graduate student, or faculty principal investigator."
        }
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-white/10 pb-2 gap-4">
            <button
              onClick={() => {
                setAuthMode("login");
                setAuthError(null);
              }}
              className={`pb-1 font-semibold transition-colors cursor-pointer ${
                authMode === "login"
                  ? "border-b-2 border-cyan-400 text-cyan-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setAuthMode("register");
                setAuthError(null);
              }}
              className={`pb-1 font-semibold transition-colors cursor-pointer ${
                authMode === "register"
                  ? "border-b-2 border-cyan-400 text-cyan-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Register New Account
            </button>
          </div>

          {authError && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 leading-relaxed">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-3.5">
            {authMode === "register" && (
              <>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={authFullName}
                    onChange={(e) => setAuthFullName(e.target.value)}
                    placeholder="e.g. Dr. Maya Lin or Alex Rivera"
                    className="w-full px-3 py-2 rounded-lg border border-white/15 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Select Academic Role
                  </label>
                  <select
                    value={authRole}
                    onChange={(e) => setAuthRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-lg border border-white/15 bg-slate-800 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="student">Student / Research Scholar</option>
                    <option value="professor">Professor / Principal Investigator</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Institutional Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="yourname@stanford.edu"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-white/15 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-white/15 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-white/10">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAuthModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmittingAuth}>
                {authMode === "login" ? "Sign In" : "Create Account"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </header>
  );
}
