"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  Plus,
  ExternalLink,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { SkillPassport } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export default function SkillPassportPage() {
  const { user, role } = useAuth();
  const [skills, setSkills] = useState<SkillPassport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add Skill Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newLevel, setNewLevel] = useState("intermediate");
  const [newEvidenceUrl, setNewEvidenceUrl] = useState("https://github.com/alicechen/scaling-impl");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Endorsement Modal (Professor)
  const [endorsingSkill, setEndorsingSkill] = useState<SkillPassport | null>(null);
  const [endorsementNotes, setEndorsementNotes] = useState("");
  const [isEndorsing, setIsEndorsing] = useState(false);

  const loadSkills = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSkillPassport();
      setSkills(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load skills:", err);
      setSkills([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSkills();
  }, []);

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await api.addSkillPassport({
        skill_name: newSkillName,
        proficiency_level: newLevel,
        verification_tier: "project_supported",
        evidence_url: newEvidenceUrl,
      });
      setSkills((prev) => [created, ...(Array.isArray(prev) ? prev : [])]);
      setIsAddModalOpen(false);
      setNewSkillName("");
    } catch (err: any) {
      alert(err.message || "Failed to add skill");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndorse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!endorsingSkill) return;

    setIsEndorsing(true);
    try {
      const updated = await api.endorseSkill(endorsingSkill.id, {
        endorsement_notes: endorsementNotes || "Verified code quality and research contribution.",
        verified_proficiency: "expert",
      });
      setSkills((prev) =>
        (Array.isArray(prev) ? prev : []).map((s) => (s.id === updated.id ? updated : s))
      );
      setEndorsingSkill(null);
      setEndorsementNotes("");
    } catch (err: any) {
      alert(err.message || "Failed to endorse skill");
    } finally {
      setIsEndorsing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-xs font-semibold mb-2 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
            <Award className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Evidence-Based Credentials</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-900 to-cyan-700 dark:from-white dark:via-indigo-200 dark:to-cyan-300 bg-clip-text text-transparent">
            Academic Skill Passport
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Demonstrate your scientific and engineering competence through linked GitHub repositories, project deliverables, and faculty endorsements.
          </p>
        </div>

        {role === "student" && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            className="text-xs gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Verified Skill</span>
          </Button>
        )}
      </div>

      {/* Skills Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 animate-pulse space-y-3 bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10">
              <div className="w-1/2 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="w-full h-8 bg-slate-100 dark:bg-slate-800/60 rounded"></div>
            </Card>
          ))}
        </div>
      ) : (Array.isArray(skills) ? skills : []).length === 0 ? (
        <Card className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10">
          No skills registered in your passport yet. Click "Add Verified Skill" to showcase your work!
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {(Array.isArray(skills) ? skills : []).map((skill) => (
            <Card
              key={skill.id}
              className="p-5 flex flex-col justify-between bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 hover:border-cyan-500/50 dark:hover:border-cyan-400/50 hover:shadow-xl hover:shadow-cyan-500/15 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {skill.skill_name}
                  </h3>
                  <Badge variant="teal" withDot className="capitalize text-[10px] font-bold">
                    {skill.proficiency_level}
                  </Badge>
                </div>

                <Badge variant="outline" className="text-[10px] capitalize">
                  Tier: {(skill.verification_tier || "self_reported").replace(/_/g, " ")}
                </Badge>

                {skill.evidence_url && (
                  <a
                    href={skill.evidence_url.startsWith("http") ? skill.evidence_url : `https://${skill.evidence_url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 hover:underline truncate max-w-full font-medium"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Repository Evidence</span>
                  </a>
                )}

                {skill.endorsement_notes ? (
                  <div className="p-3 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-700 dark:text-emerald-300 space-y-1">
                    <div className="flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                      <span>Faculty Endorsed</span>
                    </div>
                    <p className="italic text-slate-600 dark:text-slate-300">"{skill.endorsement_notes}"</p>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Pending faculty verification
                  </p>
                )}
              </div>

              {role === "professor" && !skill.endorsement_notes && (
                <div className="pt-3 mt-3 border-t border-slate-200/80 dark:border-white/10">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEndorsingSkill(skill)}
                    className="w-full text-xs text-emerald-700 dark:text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/15"
                  >
                    Endorse Competence
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Add Skill Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Skill with Evidence"
        description="Provide external proof (GitHub repo, live implementation, or paper DOI) to verify competence."
        maxWidth="md"
      >
        <form onSubmit={handleAddSkill} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Skill Name
            </label>
            <input
              type="text"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              placeholder="e.g. PyTorch, CUDA, React, Rust, Systems Benchmarking"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Proficiency Level
            </label>
            <select
              value={newLevel}
              onChange={(e) => setNewLevel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="beginner">Beginner (Completed Coursework)</option>
              <option value="intermediate">Intermediate (Shipped Project)</option>
              <option value="advanced">Advanced (Production / Research Quality)</option>
              <option value="expert">Expert (Published / Contributed to Core)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Evidence URL (GitHub / Demo / Manuscript)
            </label>
            <input
              type="url"
              value={newEvidenceUrl}
              onChange={(e) => setNewEvidenceUrl(e.target.value)}
              placeholder="https://github.com/username/repository"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-white/10">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Add to Passport
            </Button>
          </div>
        </form>
      </Modal>

      {/* Endorse Skill Modal (Professor) */}
      <Modal
        isOpen={!!endorsingSkill}
        onClose={() => setEndorsingSkill(null)}
        title={`Endorse ${endorsingSkill?.skill_name}`}
        description="Verify this student's code and technical performance for the academic network."
        maxWidth="md"
      >
        <form onSubmit={handleEndorse} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Endorsement Statement
            </label>
            <textarea
              value={endorsementNotes}
              onChange={(e) => setEndorsementNotes(e.target.value)}
              rows={3}
              placeholder="e.g. Reviewed student's implementation of distributed attention layers. Code quality and execution were excellent."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-white/10">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEndorsingSkill(null)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isEndorsing}>
              Confirm Endorsement
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
