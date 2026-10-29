"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Briefcase,
  Send,
  Users,
  FileText,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Building,
  ChevronRight,
  TrendingUp,
  Award,
  BookOpen,
  Compass,
  ShieldCheck,
  Users2,
  Network,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  ProfessorProfile,
  ResearchProject,
  ResearchRequest,
  OpportunityRadarAlert,
} from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const { user, role, activePersona } = useAuth();
  const [professors, setProfessors] = useState<ProfessorProfile[]>([]);
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [requests, setRequests] = useState<ResearchRequest[]>([]);
  const [radarAlerts, setRadarAlerts] = useState<OpportunityRadarAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [profData, projData, reqData, radarData] = await Promise.allSettled([
          api.getProfessors({ limit: 4 }),
          api.getProjects({ limit: 4 } as any),
          api.getResearchRequests(),
          api.getOpportunityRadar(),
        ]);

        if (profData.status === "fulfilled") {
          const val = profData.value;
          setProfessors(Array.isArray(val) ? val : (val as any)?.items || []);
        }
        if (projData.status === "fulfilled") {
          const val = projData.value;
          setProjects(Array.isArray(val) ? val : (val as any)?.items || []);
        }
        if (reqData.status === "fulfilled") {
          const val = reqData.value;
          setRequests(Array.isArray(val) ? val : (val as any)?.items || []);
        }
        if (radarData.status === "fulfilled") {
          const res: any = radarData.value;
          const alerts = res?.radar_opportunities || (Array.isArray(res) ? res : []);
          setRadarAlerts(Array.isArray(alerts) ? alerts : []);
        }
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [role, user]);

  const currentUserName = mounted
    ? (activePersona?.name || user?.full_name || (role === "admin" ? "Dr. Eleanor Vance" : role === "professor" ? "Dr. Marcus Thorne" : "Alice Chen"))
    : "Scholar";

  // Dynamic role-tailored quick action buttons
  const roleActions = role === "admin"
    ? [
        { name: "Admin Governance", href: "/admin", icon: ShieldCheck, color: "text-emerald-300" },
        { name: "Faculty Directory", href: "/professors", icon: Users, color: "text-cyan-300" },
        { name: "Research Openings", href: "/projects", icon: Briefcase, color: "text-teal-300" },
        { name: "Collab Topology", href: "/collaboration-graph", icon: Network, color: "text-purple-300" },
      ]
    : role === "professor"
    ? [
        { name: "Applicant Inquiries", href: "/requests", icon: Send, color: "text-cyan-300" },
        { name: "Manage Openings", href: "/projects", icon: Briefcase, color: "text-teal-300" },
        { name: "Team Composer", href: "/teams", icon: Users2, color: "text-purple-300" },
        { name: "Faculty Directory", href: "/professors", icon: Users, color: "text-amber-300" },
      ]
    : [
        { name: "Faculty Directory", href: "/professors", icon: Users, color: "text-cyan-300" },
        { name: "Research Openings", href: "/projects", icon: Briefcase, color: "text-teal-300" },
        { name: "AI Matcher", href: "/talent-matcher", icon: Sparkles, color: "text-purple-300" },
        { name: "Skill Passport", href: "/skills", icon: Award, color: "text-amber-300" },
      ];

  return (
    <div className="space-y-5 sm:space-y-8 max-w-7xl mx-auto pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 dark:from-slate-950 dark:via-indigo-950/90 dark:to-slate-900 p-4 sm:p-9 text-white shadow-xl shadow-indigo-600/15 dark:shadow-2xl border border-indigo-400/30 dark:border-white/10">
        {/* Ambient glow in banner */}
        <div className="absolute top-0 right-0 w-[450px] h-[300px] bg-cyan-400/20 dark:bg-cyan-500/15 rounded-full blur-[90px] pointer-events-none animate-pulse-glow" />
        <div className="absolute bottom-0 left-1/3 w-[350px] h-[200px] bg-purple-400/20 dark:bg-purple-500/15 rounded-full blur-[80px] pointer-events-none animate-float" />

        <div className="relative z-10 max-w-3xl space-y-2 sm:space-y-3">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full bg-white/20 dark:bg-cyan-500/20 border border-white/30 dark:border-cyan-400/40 text-white dark:text-cyan-200 text-[11px] sm:text-xs font-semibold backdrop-blur-md shadow-xs max-w-full">
            <span className="w-2 h-2 rounded-full bg-cyan-300 dark:bg-cyan-400 animate-pulse shrink-0" />
            <span className="truncate" suppressHydrationWarning>
              Live Session: {currentUserName} ({mounted ? (role || "student") : "student"})
            </span>
          </div>

          <h1 className="text-xl xs:text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight" suppressHydrationWarning>
            Welcome to ResearchBridge, {currentUserName}
          </h1>

          <p className="text-xs sm:text-sm text-indigo-100 dark:text-slate-200 leading-relaxed max-w-2xl">
            {role === "professor"
              ? "Supervise active laboratory grant openings, review prospective student applicants, and evaluate candidates with explainable AI."
              : role === "admin"
              ? "Oversee university research governance, verify professor credentials, and monitor campus-wide academic safety and equity."
              : "Discover faculty advisors, review funded research openings, explore peer-reviewed literature, and build your verified Skill Passport."}
          </p>
        </div>

        {/* Quick Actions Bar - Role-Tailored & High Contrast */}
        <div className="mt-4 sm:mt-6 grid grid-cols-2 xs:flex xs:flex-wrap items-center gap-2 pt-3.5 sm:pt-5 border-t border-white/20 dark:border-white/15 relative z-10">
          {roleActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.name} href={action.href} className="w-full xs:w-auto">
                <button
                  type="button"
                  className="w-full xs:w-auto px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/30 text-white font-semibold text-xs border border-white/25 hover:border-white/40 shadow-sm backdrop-blur-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <Icon className={`w-3.5 h-3.5 ${action.color} shrink-0`} />
                  <span className="text-white drop-shadow-xs">{action.name}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Metrics Row: 4 Vibrant Gradient Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <Card hoverable className="p-3 sm:p-5 border border-blue-200 dark:border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-white/90 to-blue-500/5 dark:from-blue-950/60 dark:via-slate-900/80 dark:to-blue-900/40 shadow-xl shadow-blue-500/5 dark:shadow-blue-950/30 hover:border-blue-400 hover:shadow-blue-500/20 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-[11px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider truncate">
              {role === "professor" ? "Inquiries" : "Applications"}
            </p>
            <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-blue-500/30 shrink-0">
              <Send className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-lg xs:text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1.5 sm:mt-2 tracking-tight">
            {(Array.isArray(requests) ? requests : []).length}
          </p>
          <p className="text-[10px] sm:text-[11px] text-blue-600 dark:text-blue-200 mt-1 flex items-center gap-1.5 font-medium truncate">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse shrink-0" />
            <span>Tracked live</span>
          </p>
        </Card>

        <Card hoverable className="p-3 sm:p-5 border border-teal-200 dark:border-teal-500/30 bg-gradient-to-br from-teal-500/10 via-white/90 to-emerald-500/5 dark:from-teal-950/60 dark:via-slate-900/80 dark:to-emerald-900/40 shadow-xl shadow-teal-500/5 dark:shadow-teal-950/30 hover:border-teal-400 hover:shadow-teal-500/20 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-[11px] font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider truncate">
              Lab Openings
            </p>
            <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-teal-500/30 shrink-0">
              <Briefcase className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-lg xs:text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1.5 sm:mt-2 tracking-tight">
            {(Array.isArray(projects) ? projects : []).length}
          </p>
          <p className="text-[10px] sm:text-[11px] text-teal-600 dark:text-teal-200 mt-1 flex items-center gap-1.5 font-medium truncate">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-teal-500 dark:bg-teal-400 animate-pulse shrink-0" />
            <span>Active openings</span>
          </p>
        </Card>

        <Card hoverable className="p-3 sm:p-5 border border-purple-200 dark:border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-white/90 to-pink-500/5 dark:from-purple-950/60 dark:via-slate-900/80 dark:to-pink-900/40 shadow-xl shadow-purple-500/5 dark:shadow-purple-950/30 hover:border-purple-400 hover:shadow-purple-500/20 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider truncate">
              Faculty
            </p>
            <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-tr from-purple-600 via-pink-600 to-rose-500 text-white flex items-center justify-center shadow-md shadow-purple-500/30 shrink-0">
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-lg xs:text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1.5 sm:mt-2 tracking-tight">
            {(Array.isArray(professors) ? professors : []).length > 0
              ? (Array.isArray(professors) ? professors : []).length
              : 1}
          </p>
          <p className="text-[10px] sm:text-[11px] text-purple-600 dark:text-purple-200 mt-1 flex items-center gap-1.5 font-medium truncate">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-purple-500 dark:bg-purple-400 animate-pulse shrink-0" />
            <span>Supervisors</span>
          </p>
        </Card>

        <Card hoverable className="p-3 sm:p-5 border border-amber-200 dark:border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-white/90 to-orange-500/5 dark:from-amber-950/60 dark:via-slate-900/80 dark:to-orange-900/40 shadow-xl shadow-amber-500/5 dark:shadow-amber-950/30 hover:border-amber-400 hover:shadow-amber-500/20 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider truncate">
              Radar Alerts
            </p>
            <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30 shrink-0">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-lg xs:text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1.5 sm:mt-2 tracking-tight">
            {(Array.isArray(radarAlerts) ? radarAlerts : []).length}
          </p>
          <p className="text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-200 mt-1 flex items-center gap-1.5 font-medium truncate">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse shrink-0" />
            <span>AI matches</span>
          </p>
        </Card>
      </div>

      {/* Main Content Sections: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Applications & Openings (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Research Applications */}
          <Card hoverable>
            <CardHeader className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 pb-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Send className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>
                    {role === "professor" ? "Recent Applicant Inquiries" : "My Research Applications"}
                  </span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {role === "professor"
                    ? "Students applying to your research group with tracked evaluation stages"
                    : "Status updates and decision history from supervising professors"}
                </CardDescription>
              </div>
              <Link href="/requests" className="self-start xs:self-auto">
                <Button variant="ghost" size="sm" className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 gap-1 px-2 py-1">
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="divide-y divide-slate-200/80 dark:divide-white/10">
              {(Array.isArray(requests) ? requests : []).length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center justify-center mx-auto">
                    <Send className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">No applications recorded yet</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Explore active faculty openings and submit collaboration requests.
                  </p>
                  <Link href="/projects" className="inline-block pt-1">
                    <Button size="xs" variant="primary">
                      Explore Openings
                    </Button>
                  </Link>
                </div>
              ) : (
                (Array.isArray(requests) ? requests : []).slice(0, 3).map((req) => (
                  <div key={req.id} className="py-3 sm:py-3.5 flex flex-col xs:flex-row xs:items-center justify-between gap-2.5 sm:gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[200px] xs:max-w-[240px] sm:max-w-none">
                          {req.subject}
                        </p>
                        <Badge
                          variant={
                            req.status === "accepted"
                              ? "success"
                              : req.status === "rejected"
                              ? "destructive"
                              : req.status === "needs_information"
                              ? "warning"
                              : "default"
                          }
                          withDot
                          className="capitalize text-[10px]"
                        >
                          {req.status?.replace("_", " ") || "submitted"}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {role === "professor"
                          ? `Applicant: ${req.student_name || "Student"}`
                          : `Professor: ${req.professor_name || "Faculty Supervisor"}`}
                        {" • "}
                        {formatDate(req.created_at)}
                      </p>
                    </div>
                    <Link href={`/requests`} className="self-end xs:self-auto shrink-0">
                      <Button size="xs" variant="outline" className="border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white">
                        Details
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Featured Research Projects */}
          <Card hoverable>
            <CardHeader className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 pb-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>Advertised Research Openings</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Supervised laboratory vacancies actively accepting applications
                </CardDescription>
              </div>
              <Link href="/projects" className="self-start xs:self-auto">
                <Button variant="ghost" size="sm" className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-500 dark:hover:text-teal-300 gap-1 px-2 py-1">
                  <span>Browse All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {(Array.isArray(projects) ? projects : []).length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No active projects advertised at the moment.
                </div>
              ) : (
                (Array.isArray(projects) ? projects : []).slice(0, 2).map((proj) => (
                  <div
                    key={proj.id}
                    className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:border-cyan-500/40 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                        {proj.title}
                      </h4>
                      <Badge variant="teal" withDot className="text-[10px] shrink-0 font-semibold">
                        {proj.openings_count || 1} Openings
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {proj.summary}
                    </p>
                    <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1.5 pt-1 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200/80 dark:border-white/10">
                      <span>{proj.weekly_hours} hrs/week • {proj.work_arrangement}</span>
                      <Link href={`/projects`}>
                        <span className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer">
                          <span>Apply Now</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Faculty & Radar (1 Col) */}
        <div className="space-y-6">
          {/* Faculty Profiles Quick View */}
          <Card hoverable>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Featured Faculty Supervisors</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Verified principal investigators &amp; lab directors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(Array.isArray(professors) ? professors : []).slice(0, 3).map((prof: any) => (
                <div
                  key={prof.id}
                  className="p-3 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800/80 transition-all flex items-start gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-md shadow-cyan-500/20">
                    {(prof.full_name || prof.profiles?.full_name || "P").charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {prof.full_name || prof.profiles?.full_name || "Faculty Member"}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {prof.academic_title || prof.title || "Professor"}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(Array.isArray(prof.research_interests) ? prof.research_interests : []).slice(0, 2).map((ri: any, idx: number) => (
                        <span
                          key={typeof ri === "string" ? `${ri}-${idx}` : (ri.id || ri.name || idx)}
                          className="text-[9px] px-1.5 py-0.5 rounded-md bg-cyan-500/10 dark:bg-white/5 border border-cyan-500/20 dark:border-white/10 text-cyan-700 dark:text-cyan-300 font-medium"
                        >
                          {typeof ri === "string" ? ri : ri.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              <Link href="/professors" className="block pt-1">
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white">
                  Browse Faculty Directory
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* AI Opportunity Radar Highlights */}
          <Card hoverable className="bg-gradient-to-br from-indigo-50/90 via-white to-teal-50/90 dark:from-indigo-950/80 dark:via-slate-900/90 dark:to-teal-950/80 border border-cyan-300/60 dark:border-cyan-500/30 shadow-2xl shadow-cyan-500/10 dark:shadow-cyan-950/40 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-400/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />

            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-cyan-700 dark:text-cyan-300 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 animate-pulse" />
                  <span>AI Opportunity Radar</span>
                </div>

                {/* Animated Live Radar Beacon */}
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-[10px] text-cyan-700 dark:text-cyan-300 font-bold shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500 dark:bg-cyan-400"></span>
                  </span>
                  <span>Scanning</span>
                </div>
              </div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Personalized Research Matches</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-3">
              {radarAlerts.length > 0 ? (
                radarAlerts.slice(0, 2).map((alert, idx) => (
                  <div
                    key={alert.project_id || idx}
                    className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 hover:border-cyan-500 dark:hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/15 text-slate-700 dark:text-slate-300 shadow-sm space-y-1.5 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{alert.project_title}</p>
                      {alert.radar_score && (
                        <Badge variant="teal" withDot className="text-[10px] px-2 py-0.5 shrink-0 shadow-xs font-bold">
                          {Math.round(alert.radar_score > 1 ? alert.radar_score : alert.radar_score * 100)}% Match
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                      {alert.potential_explanation}
                    </p>
                    <p className="text-[10px] text-cyan-700 dark:text-cyan-400 font-semibold pt-0.5 flex items-center gap-1">
                      <span className="text-slate-500 dark:text-slate-400">Supervisor:</span>
                      <span className="text-slate-900 dark:text-white">{alert.professor_name}</span>
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  Add verified skills to your Skill Passport to unlock proactive radar match notifications.
                </div>
              )}
              <Link href="/projects" className="block pt-1">
                <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer">
                  <span>View All Openings &amp; Opportunities</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
