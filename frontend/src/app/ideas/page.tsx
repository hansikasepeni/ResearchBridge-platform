"use client";

import React, { useState, useEffect } from "react";
import {
  Lightbulb,
  Plus,
  Send,
  Sparkles,
  CheckCircle,
  Clock,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ResearchIdea } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";

export default function IdeasPage() {
  const { role } = useAuth();
  const [ideas, setIdeas] = useState<ResearchIdea[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create Idea Modal (Professor)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newProblem, setNewProblem] = useState("");
  const [newVision, setNewVision] = useState("");
  const [isSubmittingIdea, setIsSubmittingIdea] = useState(false);

  // Submit Proposal Modal (Student)
  const [selectedIdea, setSelectedIdea] = useState<ResearchIdea | null>(null);
  const [proposalTitle, setProposalTitle] = useState("");
  const [approach, setApproach] = useState("");
  const [contributorRole, setContributorRole] = useState("Graduate Researcher");
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);
  const [proposalSuccess, setProposalSuccess] = useState<string | null>(null);

  const loadIdeas = async () => {
    setIsLoading(true);
    try {
      const data = await api.getPipelineIdeas();
      setIdeas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load ideas:", err);
      setIdeas([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIdeas();
  }, []);

  const handleCreateIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim().length < 5) {
      alert("Research initiative title must be at least 5 characters.");
      return;
    }
    if (newProblem.trim().length < 20 || newVision.trim().length < 20) {
      alert("Both the problem statement and vision description must be at least 20 characters.");
      return;
    }
    setIsSubmittingIdea(true);
    try {
      const created = await api.createPipelineIdea({
        title: newTitle,
        problem_statement: newProblem,
        vision_description: newVision,
      });
      setIdeas((prev) => [created, ...(Array.isArray(prev) ? prev : [])]);
      setIsCreateModalOpen(false);
      setNewTitle("");
      setNewProblem("");
      setNewVision("");
    } catch (err: any) {
      alert(err.message || "Failed to post idea");
    } finally {
      setIsSubmittingIdea(false);
    }
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIdea) return;
    if (proposalTitle.trim().length < 5) {
      alert("Proposal title must be at least 5 characters.");
      return;
    }
    if (approach.trim().length < 20) {
      alert("Proposed approach must be at least 20 characters.");
      return;
    }

    setIsSubmittingProposal(true);
    try {
      await api.submitIdeaProposal(selectedIdea.id, {
        proposal_title: proposalTitle,
        proposed_approach: approach,
        contributor_role: contributorRole,
      });
      setProposalSuccess("Your prototype proposal was submitted to the principal investigator!");
      setTimeout(() => {
        setSelectedIdea(null);
        setProposalSuccess(null);
        setProposalTitle("");
        setApproach("");
      }, 2000);
    } catch (err: any) {
      alert(err.message || "Failed to submit proposal");
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold mb-2 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
            <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Early-Stage Exploration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-900 to-cyan-700 dark:from-white dark:via-indigo-200 dark:to-cyan-300 bg-clip-text text-transparent">
            Research Idea-to-Prototype Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Faculty pitch early-stage hypotheses and unanswered research questions; students propose technical approaches to build the first prototype.
          </p>
        </div>

        {role === "professor" && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            className="text-xs gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Pitch Research Concept</span>
          </Button>
        )}
      </div>

      {/* Ideas Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 animate-pulse space-y-3 bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10">
              <div className="w-1/2 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="w-full h-12 bg-slate-100 dark:bg-slate-800/60 rounded"></div>
            </Card>
          ))}
        </div>
      ) : (Array.isArray(ideas) ? ideas : []).length === 0 ? (
        <Card className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10">
          No early concepts open for proposals right now.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Array.isArray(ideas) ? ideas : []).map((idea: any) => (
            <Card
              key={idea.id}
              className="p-5 flex flex-col justify-between bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 hover:border-amber-500/50 dark:hover:border-amber-400/50 hover:shadow-xl hover:shadow-amber-500/15 transition-all space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {idea.title}
                    </h3>
                    {idea.professor_name && (
                      <p className="text-[11px] text-cyan-700 dark:text-cyan-300 font-medium mt-0.5">
                        PI: {idea.professor_name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {idea.is_beginner_friendly && (
                      <Badge variant="outline" className="text-[9px] text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border-emerald-500/30">
                        Beginner Friendly
                      </Badge>
                    )}
                    <Badge variant="teal" withDot className="text-[10px] capitalize font-bold">
                      {(idea.status || idea.stage || "open_for_proposals").replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-300">Problem Statement:</span>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">{idea.problem_statement}</p>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-300">Prototype Vision:</span>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed italic">{idea.vision_description}</p>
                  </div>

                  {Array.isArray(idea.required_disciplines) && idea.required_disciplines.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {idea.required_disciplines.map((d: string, idx: number) => (
                        <span key={idx} className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/10 dark:bg-white/5 border border-cyan-500/20 dark:border-white/10 text-cyan-700 dark:text-cyan-300 font-medium">
                          {d}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">{formatDate(idea.created_at)}</span>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setSelectedIdea(idea);
                    setProposalTitle(`Prototype Proposal for ${idea.title}`);
                  }}
                  className="text-xs"
                >
                  Submit Proposal
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pitch Idea Modal (Professor) */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Pitch Early-Stage Research Concept"
        description="Share a research hypothesis or unexplored problem to invite student prototype proposals."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateIdea} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Concept Title
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Neuromorphic Sensor Benchmarking for Edge Computing"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Problem Statement
            </label>
            <textarea
              value={newProblem}
              onChange={(e) => setNewProblem(e.target.value)}
              rows={3}
              placeholder="What core scientific or engineering bottleneck needs to be investigated?"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Vision for Prototype / Desired Outcome
            </label>
            <textarea
              value={newVision}
              onChange={(e) => setNewVision(e.target.value)}
              rows={3}
              placeholder="What would a successful 8-week demonstration look like?"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-white/10">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmittingIdea}>
              Publish Concept
            </Button>
          </div>
        </form>
      </Modal>

      {/* Submit Proposal Modal (Student) */}
      <Modal
        isOpen={!!selectedIdea}
        onClose={() => setSelectedIdea(null)}
        title={`Submit Prototype Proposal for: ${selectedIdea?.title}`}
        description="Describe your proposed approach, architecture, and expected deliverables."
        maxWidth="lg"
      >
        {proposalSuccess ? (
          <div className="p-6 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <p className="text-sm font-bold text-slate-900 dark:text-white">{proposalSuccess}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmitProposal} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Proposal Title
              </label>
              <input
                type="text"
                value={proposalTitle}
                onChange={(e) => setProposalTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/15 focus:outline-none focus:border-cyan-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Proposed Technical Approach &amp; Milestones
              </label>
              <textarea
                value={approach}
                onChange={(e) => setApproach(e.target.value)}
                rows={4}
                placeholder="Detail your algorithms, datasets, benchmark methods, and weekly plan..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/15 focus:outline-none focus:border-cyan-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Your Role in the Prototype
              </label>
              <input
                type="text"
                value={contributorRole}
                onChange={(e) => setContributorRole(e.target.value)}
                placeholder="e.g. Lead Machine Learning Engineer"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/15 focus:outline-none focus:border-cyan-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-white/10">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSelectedIdea(null)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmittingProposal}>
                Submit Proposal
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
