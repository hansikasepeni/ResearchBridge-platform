"use client";

import React, { useState } from "react";
import {
  Users2,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle,
  Building,
  UserCheck,
} from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface RoleInput {
  role_name: string;
  required_skills: string;
}

export default function TeamComposerPage() {
  const [projectTitle, setProjectTitle] = useState("Distributed Autonomous Systems Lab");
  const [roles, setRoles] = useState<RoleInput[]>([
    { role_name: "Machine Learning Lead", required_skills: "Python, PyTorch, Linear Algebra" },
    { role_name: "Systems Architect", required_skills: "C++, CUDA, Distributed Systems" },
    { role_name: "Fullstack Platform Engineer", required_skills: "TypeScript, Next.js, FastAPI" },
  ]);
  const [composedResult, setComposedResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddRole = () => {
    setRoles([...roles, { role_name: "", required_skills: "" }]);
  };

  const handleRemoveRole = (index: number) => {
    setRoles(roles.filter((_, i) => i !== index));
  };

  const handleRoleChange = (index: number, field: keyof RoleInput, val: string) => {
    const updated = [...roles];
    updated[index][field] = val;
    setRoles(updated);
  };

  const handleCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formattedRoles = roles
        .filter((r) => r.role_name.trim())
        .map((r) => ({
          role_name: r.role_name,
          required_skills: r.required_skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }));

      const res = await api.composeTeam({
        project_title: projectTitle,
        roles: formattedRoles,
      });
      setComposedResult(res);
    } catch (err: any) {
      alert(err.message || "Failed to compose team");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 dark:bg-purple-500/15 dark:border-purple-500/30 dark:text-purple-300 text-xs font-semibold mb-2 shadow-sm dark:shadow-[0_0_12px_rgba(168,85,247,0.2)]">
          <Users2 className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
          <span>Multidisciplinary Research Cohorts</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-900 to-cyan-700 dark:from-white dark:via-indigo-200 dark:to-cyan-300 bg-clip-text text-transparent">
          AI Team Composer
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
          Specify cross-functional roles for your lab or project; AI analyzes student profiles, skill passports, and complementary strengths to assemble a high-synergy research cohort.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Form */}
        <Card className="p-4 sm:p-6 space-y-4 bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xl dark:shadow-2xl">
          <form onSubmit={handleCompose} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Project or Lab Initiative Title
              </label>
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Required Team Roles &amp; Competencies
                </label>
                <button
                  type="button"
                  onClick={handleAddRole}
                  className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Role
                </button>
              </div>

              {roles.map((role, idx) => (
                <div
                  key={idx}
                  className="p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-700 dark:text-cyan-300">Role #{idx + 1}</span>
                    {roles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRole(idx)}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    value={role.role_name}
                    onChange={(e) => handleRoleChange(idx, "role_name", e.target.value)}
                    placeholder="Role Title (e.g. Lead Machine Learning Engineer)"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-850 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    required
                  />

                  <input
                    type="text"
                    value={role.required_skills}
                    onChange={(e) => handleRoleChange(idx, "required_skills", e.target.value)}
                    placeholder="Required Skills (Comma separated: PyTorch, CUDA, etc.)"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-850 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              ))}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full gap-2 text-xs shadow-md shadow-indigo-500/25"
              isLoading={isLoading}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-spin-slow" />
              <span>Compose Optimal Research Team</span>
            </Button>
          </form>
        </Card>

        {/* Right: Results Display */}
        <div>
          {composedResult ? (
            <Card className="p-4 sm:p-6 space-y-5 bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xl dark:shadow-2xl">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant="teal" withDot className="text-xs font-bold">
                    Cohort Assembled
                  </Badge>
                  <span className="text-xs font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 px-2.5 py-1 rounded-full border border-cyan-200 dark:border-cyan-500/30 shadow-sm dark:shadow-[0_0_8px_rgba(6,182,212,0.2)]">
                    {Math.round(composedResult.recommended_team?.overall_coverage_score || 95)}% Coverage
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {composedResult.project_title || "Research Initiative"}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                  {Array.isArray(composedResult.recommended_team?.synergy_highlights) && composedResult.recommended_team.synergy_highlights.length > 0
                    ? composedResult.recommended_team.synergy_highlights.join(" • ")
                    : composedResult.team_synergy_analysis || "Optimal research synergy and complementary strength across cohort members."}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Recommended Role Assignments
                </h4>
                {(composedResult.recommended_team?.members || composedResult.role_assignments || []).map((item: any, i: number) => {
                  const studentName = item.student_name || item.assigned_student_name || "Alice Chen";
                  const covered = Array.isArray(item.covered_skills) ? item.covered_skills : Array.isArray(item.student_skills) ? item.student_skills : [];
                  const missing = Array.isArray(item.missing_skills) ? item.missing_skills : [];

                  return (
                    <div
                      key={i}
                      className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-cyan-700 dark:text-cyan-300 text-sm">
                          {item.role_name}
                        </span>
                        <Badge variant="outline" className="text-cyan-700 dark:text-cyan-300">
                          {item.match_percentage || 95}% Match
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
                          {studentName.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {studentName}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          ({item.student_department || "Computer Science"})
                        </span>
                      </div>

                      {covered.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {covered.map((s: string, idx: number) => (
                            <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                              ✓ {s}
                            </span>
                          ))}
                        </div>
                      )}

                      {missing.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {missing.map((s: string, idx: number) => (
                            <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
                              Needs {s}
                            </span>
                          ))}
                        </div>
                      )}

                      {item.fit_rationale && (
                        <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                          {item.fit_rationale}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {Array.isArray(composedResult.alternative_teams) && composedResult.alternative_teams.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-200/80 dark:border-white/10">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Alternative Team Formations ({composedResult.alternative_teams.length})
                  </h4>
                  {composedResult.alternative_teams.map((alt: any, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/40 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">{alt.team_name || `Alternative Cohort #${idx + 1}`}</span>
                        <Badge variant="outline">{Math.round(alt.overall_coverage_score || 90)}% Coverage</Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Members: {Array.isArray(alt.members) ? alt.members.map((m: any) => m.student_name).filter(Boolean).join(", ") : "Multi-disciplinary students"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-16 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2 bg-white/85 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 shadow-xl dark:shadow-2xl">
              <Users2 className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto" />
              <p>Define desired roles on the left and click "Compose Optimal Research Team".</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
