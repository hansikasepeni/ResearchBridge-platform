"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  Building,
  Mail,
  ExternalLink,
  BookOpen,
  Briefcase,
  Send,
  Sparkles,
  CheckCircle,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  ProfessorProfile,
  Publication,
  ResearchProject,
} from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";

export default function ProfessorDetailPage() {
  const params = useParams();
  const profId = params.id as string;

  const [professor, setProfessor] = useState<ProfessorProfile | null>(null);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "publications" | "projects">("overview");
  const [isLoading, setIsLoading] = useState(true);

  // Application Modal State
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [motivation, setMotivation] = useState("");
  const [skills, setSkills] = useState("");
  const [hours, setHours] = useState(15);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [existingApplication, setExistingApplication] = useState<any | null>(null);

  useEffect(() => {
    async function fetchProfessorData() {
      setIsLoading(true);
      try {
        const [profData, pubData, projData, reqData] = await Promise.allSettled([
          api.getProfessor(profId),
          api.getProfessorPublications(profId),
          api.getProjects(),
          api.getResearchRequests(),
        ]);

        if (profData.status === "fulfilled") setProfessor(profData.value);
        if (pubData.status === "fulfilled") {
          const val = pubData.value;
          setPublications(Array.isArray(val) ? val : (val as any)?.items || []);
        }
        if (projData.status === "fulfilled") {
          const val = projData.value;
          const list = Array.isArray(val) ? val : (val as any)?.items || [];
          const profProjects = list.filter(
            (p: any) => p.professor_id === profId
          );
          setProjects(profProjects);
        }
        if (reqData.status === "fulfilled") {
          const reqs = Array.isArray(reqData.value) ? reqData.value : (reqData.value as any)?.items || [];
          const matched = reqs.find((r: any) => r.professor_id === profId);
          if (matched) setExistingApplication(matched);
        }
      } catch (err) {
        console.error("Failed to load professor detail:", err);
      } finally {
        setIsLoading(false);
      }
    }
    if (profId) fetchProfessorData();
  }, [profId]);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !motivation.trim()) {
      setSubmitError("Please fill in both the subject and motivation statement.");
      return;
    }
    if (subject.trim().length < 3) {
      setSubmitError("Subject must be at least 3 characters.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await api.submitResearchRequest({
        professor_id: profId,
        project_id: selectedProjectId || undefined,
        subject,
        motivation_statement: motivation,
        student_skills: skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        proposed_availability_hours: Number(hours),
      });

      setSubmitSuccess("Your research application was successfully submitted!");
      setExistingApplication({ status: "submitted" });
      setTimeout(() => {
        setIsApplyModalOpen(false);
        setSubmitSuccess(null);
        setSubject("");
        setMotivation("");
        setSkills("");
      }, 2500);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-6">
        <div className="h-40 bg-slate-800/60 rounded-2xl animate-pulse"></div>
        <div className="h-64 bg-slate-800/40 rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  if (!professor) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <p className="text-slate-400 text-sm">Faculty profile could not be found.</p>
        <Link href="/professors">
          <Button variant="outline" size="sm">
            Return to Directory
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Back button */}
      <Link
        href="/professors"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Faculty Directory</span>
      </Link>

      {/* Professor Header Card */}
      <Card className="p-4 sm:p-8 bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6">
          <div className="flex items-start gap-3 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white font-bold text-xl sm:text-2xl flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/25">
              {(professor.full_name || professor.profiles?.full_name || "P").charAt(0)}
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                  {professor.full_name || professor.profiles?.full_name || "Faculty Supervisor"}
                </h1>
                <Badge
                  variant={professor.open_to_applications ? "success" : "secondary"}
                  withDot
                  className="text-xs font-bold shrink-0"
                >
                  {professor.open_to_applications ? "Open to Students" : "At Capacity"}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-cyan-700 dark:text-cyan-300 font-medium">
                {professor.academic_title || professor.title || "Professor"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 sm:gap-2">
                <Building className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <span className="truncate">
                  {professor.lab_name || "Research Group"} •{" "}
                  {professor.office_location || "Campus Office"}
                </span>
              </p>
            </div>
          </div>

          {existingApplication ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <div className="px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                <span>
                  Application Submitted (
                  {(existingApplication.status || "under_review").replace(/_/g, " ")}
                  )
                </span>
              </div>
              <Link href="/requests" className="w-full sm:w-auto">
                <Button size="sm" variant="outline" className="w-full sm:w-auto text-xs border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white">
                  View in Applications →
                </Button>
              </Link>
            </div>
          ) : (
            <Button
              size="md"
              variant="primary"
              onClick={() => setIsApplyModalOpen(true)}
              className="w-full sm:w-auto text-xs gap-1.5 shadow-lg shadow-indigo-500/25 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Apply for Research Supervision</span>
            </Button>
          )}
        </div>

        {/* Tab Navigation - with horizontal scroll on small devices */}
        <div className="flex gap-2 sm:gap-4 border-b border-slate-200/80 dark:border-white/10 mt-6 sm:mt-8 text-xs font-semibold overflow-x-auto whitespace-nowrap scrollbar-none pb-0">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 px-2 sm:px-1 transition-colors border-b-2 cursor-pointer shrink-0 ${
              activeTab === "overview"
                ? "border-cyan-500 dark:border-cyan-400 text-cyan-700 dark:text-cyan-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Academic Overview
          </button>
          <button
            onClick={() => setActiveTab("publications")}
            className={`pb-3 px-2 sm:px-1 transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "publications"
                ? "border-cyan-500 dark:border-cyan-400 text-cyan-700 dark:text-cyan-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span>Publications</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {(Array.isArray(publications) ? publications : []).length}
            </Badge>
          </button>
          <button
            onClick={() => setActiveTab("projects")}
            className={`pb-3 px-2 sm:px-1 transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "projects"
                ? "border-cyan-500 dark:border-cyan-400 text-cyan-700 dark:text-cyan-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span>Open Projects</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {(Array.isArray(projects) ? projects : []).length}
            </Badge>
          </button>
        </div>
      </Card>

      {/* Tab 1: Academic Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-2xl">
              <CardHeader className="border-b border-slate-200/80 dark:border-white/10">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Biography &amp; Research Vision</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line p-6">
                {professor.bio ||
                  professor.profiles?.bio ||
                  "Conducting foundational and applied scientific research in modern computer systems and artificial intelligence."}
              </CardContent>
            </Card>

            <Card className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-2xl">
              <CardHeader className="border-b border-slate-200/80 dark:border-white/10">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Research Focus Areas</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(professor.research_interests) ? professor.research_interests : []).map((ri: any, idx: number) => (
                    <div
                      key={typeof ri === "string" ? `${ri}-${idx}` : (ri.id || ri.name || idx)}
                      className="px-3 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-xs font-medium"
                    >
                      {typeof ri === "string" ? ri : ri.name}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-2xl">
              <CardHeader className="border-b border-slate-200/80 dark:border-white/10">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Supervision Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs p-6">
                <div className="flex justify-between py-1 border-b border-slate-200/80 dark:border-white/10">
                  <span className="text-slate-500 dark:text-slate-400">Active Students</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {professor.current_supervision_count || 1} / {professor.max_capacity || 4}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/80 dark:border-white/10">
                  <span className="text-slate-500 dark:text-slate-400">Weekly Commitment</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    ~{professor.preferred_weekly_hours || 12} hrs/week
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 dark:text-slate-400">Application Status</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {professor.open_to_applications ? "Accepting Applicants" : "Full Capacity"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Publications */}
      {activeTab === "publications" && (
        <Card className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-2xl">
          <CardHeader className="border-b border-slate-200/80 dark:border-white/10">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Authored Academic Papers</CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Peer-reviewed articles, conference proceedings, and technical preprints
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-slate-200/80 dark:divide-white/5 p-6">
            {(Array.isArray(publications) ? publications : []).length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                No publications listed yet.
              </div>
            ) : (
              (Array.isArray(publications) ? publications : []).map((pub) => (
                <div key={pub.id} className="py-4 space-y-1.5">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                    {pub.title}
                  </h4>
                  <p className="text-xs text-cyan-700 dark:text-cyan-300">
                    {pub.venue ? `${pub.venue} ` : ""}
                    {pub.year ? `(${pub.year})` : ""}
                    {pub.doi ? ` • DOI: ${pub.doi}` : ""}
                  </p>
                  {pub.abstract && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1 line-clamp-3">
                      {pub.abstract}
                    </p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Ongoing Research Projects */}
      {activeTab === "projects" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Array.isArray(projects) ? projects : []).length === 0 ? (
            <Card className="col-span-2 p-12 text-center text-slate-500 dark:text-slate-400 text-xs bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10">
              No active project openings currently listed. You can still submit a general research inquiry!
            </Card>
          ) : (
            (Array.isArray(projects) ? projects : []).map((proj) => (
              <Card key={proj.id} className="p-5 space-y-3 flex flex-col justify-between bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 hover:border-cyan-500/50 dark:hover:border-cyan-400/50 hover:shadow-xl hover:shadow-cyan-500/15">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{proj.title}</h4>
                    <Badge variant="teal" withDot className="text-[10px] font-bold">
                      {proj.openings_count} Openings
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                    {proj.summary}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">{proj.weekly_hours} hrs/week</span>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setSelectedProjectId(proj.id);
                      setSubject(`Application for: ${proj.title}`);
                      setIsApplyModalOpen(true);
                    }}
                    className="text-xs"
                  >
                    Apply to Project
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Structured Research Application Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title={`Apply for Research Collaboration with ${professor?.full_name || professor?.profiles?.full_name || "Faculty Supervisor"}`}
        description="Submit a formal academic inquiry detailing your background, motivation, and availability."
        maxWidth="xl"
      >
        {submitSuccess ? (
          <div className="p-6 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-base font-bold text-white">Application Submitted!</h4>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">{submitSuccess}</p>
          </div>
        ) : (
          <form onSubmit={handleApplySubmit} className="space-y-4 text-xs">
            {submitError && (
              <div className="p-3 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30">
                {submitError}
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Undergraduate Research Inquiry — Machine Learning Lab"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/15 focus:outline-none focus:border-cyan-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                required
              />
            </div>

            {(Array.isArray(projects) ? projects : []).length > 0 && (
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Associated Project Opening (Optional)
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/15 focus:outline-none focus:border-cyan-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">General Lab Inquiry (No specific project)</option>
                  {(Array.isArray(projects) ? projects : []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Motivation Statement &amp; Background
              </label>
              <textarea
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                rows={4}
                placeholder="Explain why you want to work with this lab, what specific papers or problems interest you, and your relevant coursework/projects..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/15 focus:outline-none focus:border-cyan-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Demonstrated Skills (Comma separated)
                </label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="Python, PyTorch, C++, Linear Algebra"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/15 focus:outline-none focus:border-cyan-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Available Weekly Hours
                </label>
                <input
                  type="number"
                  min={5}
                  max={40}
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/15 focus:outline-none focus:border-cyan-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-white/10">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsApplyModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Submit Research Application
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
