"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  Clock,
  Plus,
  Briefcase,
  FileCheck,
  Award,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ResearchProject, StudentContribution } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";

export default function ContributionsPage() {
  const { user, role } = useAuth();
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [taskName, setTaskName] = useState("");
  const [deliverableSummary, setDeliverableSummary] = useState("");
  const [hoursLogged, setHoursLogged] = useState(10);
  const [isLogging, setIsLogging] = useState(false);
  const [loggedItems, setLoggedItems] = useState<StudentContribution[]>([
    {
      id: "demo-contrib-1",
      student_id: user?.id || "00000000-0000-0000-0000-000000000003",
      project_id: "demo-proj-1",
      task_name: "Asynchronous API & Database Benchmarking",
      deliverable_summary: "Designed stress-test harness executing 500 req/sec benchmark across distributed worker nodes with 99th percentile latency metrics.",
      hours_logged: 15,
      verified_by_professor: true,
      created_at: new Date().toISOString(),
      project_title: "High-Throughput Distributed Storage",
    },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const projs = await api.getProjects();
        const safeProjs = Array.isArray(projs) ? projs : [];
        setProjects(safeProjs);
        if (safeProjs.length > 0) {
          setSelectedProjectId(safeProjs[0].id);
        }

        const studentId = user?.id || "00000000-0000-0000-0000-000000000003";
        try {
          const portfolio = await api.getContributionPortfolio(studentId);
          if (portfolio && Array.isArray(portfolio.verified_tasks) && portfolio.verified_tasks.length > 0) {
            setLoggedItems(portfolio.verified_tasks.map((t: any) => ({
              ...t,
              verified_by_professor: t.status === "verified" || !!t.verified_by_professor,
            })));
          }
        } catch {
          // Keep demo seed if portfolio not yet populated
        }
      } catch (err) {
        console.error("Failed to load projects for contribution logging:", err);
      }
    }
    loadData();
  }, [user]);

  const handleLogContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim() || !deliverableSummary.trim() || !selectedProjectId) {
      alert("Please select a project and provide both a task title and deliverable summary.");
      return;
    }
    if (taskName.trim().length < 3) {
      alert("Task name must be at least 3 characters.");
      return;
    }
    if (deliverableSummary.trim().length < 10) {
      alert("Deliverable summary must be at least 10 characters.");
      return;
    }

    setIsLogging(true);
    try {
      const created = await api.logContribution({
        project_id: selectedProjectId,
        task_name: taskName,
        deliverable_summary: deliverableSummary,
        hours_logged: Number(hoursLogged),
      });

      const matchedProj = projects.find((p) => p.id === selectedProjectId);
      setLoggedItems((prev) => [
        { 
          ...created, 
          project_title: matchedProj?.title || "Research Project",
          verified_by_professor: created.status === "verified" || !!created.verified_by_professor,
        },
        ...(Array.isArray(prev) ? prev : []),
      ]);
      setIsModalOpen(false);
      setTaskName("");
      setDeliverableSummary("");
    } catch (err: any) {
      alert(err.message || "Failed to log contribution");
    } finally {
      setIsLogging(false);
    }
  };

  const safeLoggedItems = Array.isArray(loggedItems) ? loggedItems : [];
  const totalHours = safeLoggedItems.reduce((acc, curr) => acc + (curr.hours_logged || 0), 0);
  const verifiedCount = safeLoggedItems.filter((i) => i.verified_by_professor || (i as any).status === "verified").length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-2 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Verified Research Deliverables</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-900 to-cyan-700 dark:from-white dark:via-indigo-200 dark:to-cyan-300 bg-clip-text text-transparent">
            Contribution &amp; Impact Tracker
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Build an immutable, verifiable academic record of completed research tasks, technical deliverables, and faculty-confirmed laboratory hours.
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="text-xs gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Log Research Deliverable</span>
        </Button>
      </div>

      {/* Summary Metrics: 3 Vibrant Gradient Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border border-blue-200 dark:border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-white/90 to-blue-500/5 dark:from-blue-950/60 dark:via-slate-900/80 dark:to-blue-900/40 shadow-xl shadow-blue-500/5 dark:shadow-blue-950/30">
          <p className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
            Total Research Hours
          </p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{totalHours} hrs</p>
        </Card>

        <Card className="p-4 border border-emerald-200 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-white/90 to-teal-500/5 dark:from-emerald-950/60 dark:via-slate-900/80 dark:to-teal-900/40 shadow-xl shadow-emerald-500/5 dark:shadow-emerald-950/30">
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
            Faculty Verified Deliverables
          </p>
          <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">{verifiedCount}</p>
        </Card>

        <Card className="p-4 border border-teal-200 dark:border-teal-500/30 bg-gradient-to-br from-teal-500/10 via-white/90 to-cyan-500/5 dark:from-teal-950/60 dark:via-slate-900/80 dark:to-cyan-900/40 shadow-xl shadow-teal-500/5 dark:shadow-teal-950/30">
          <p className="text-xs font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider">
            Active Research Projects
          </p>
          <p className="text-2xl font-extrabold text-cyan-700 dark:text-cyan-300 mt-1">
            {new Set(safeLoggedItems.map((i) => i.project_id)).size}
          </p>
        </Card>
      </div>

      {/* Contributions Timeline List */}
      <Card className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-2xl">
        <CardHeader className="border-b border-slate-200/80 dark:border-white/10">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Verified Deliverables Transcript</CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            Chronological academic record certified by supervising faculty
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-slate-200/80 dark:divide-white/5 p-0">
          {safeLoggedItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
              No research deliverables recorded yet. Click "Log Research Deliverable" above to start your verified record.
            </div>
          ) : (
            safeLoggedItems.map((item) => (
              <div key={item.id} className="p-5 space-y-2 hover:bg-slate-100/60 dark:hover:bg-white/5 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {item.task_name}
                    </h3>
                    <Badge variant={item.verified_by_professor ? "success" : "warning"} withDot className="text-[10px] font-bold">
                      {item.verified_by_professor ? "Faculty Certified" : "Pending Review"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-cyan-700 dark:text-cyan-300">{item.hours_logged} hours</span>
                    <span>•</span>
                    <span>{formatDate(item.created_at)}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.deliverable_summary}
                </p>

                {item.project_title && (
                  <div className="pt-1 flex items-center gap-1.5 text-[11px] text-cyan-700 dark:text-cyan-400 font-semibold">
                    <Briefcase className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>{item.project_title}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Log Contribution Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Completed Research Deliverable"
        description="Record technical progress, datasets processed, or software components shipped."
        maxWidth="md"
      >
        <form onSubmit={handleLogContribution} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Associated Research Project
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              required
            >
              {(Array.isArray(projects) ? projects : []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Task / Milestone Name
            </label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="e.g. Implemented Custom CUDA FlashAttention Kernel"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Deliverable Summary &amp; Results
            </label>
            <textarea
              value={deliverableSummary}
              onChange={(e) => setDeliverableSummary(e.target.value)}
              rows={3}
              placeholder="Detail benchmarks, pull request links, experimental error bounds, or papers drafted..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Hours Dedicated
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={hoursLogged}
              onChange={(e) => setHoursLogged(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-white/10">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isLogging}>
              Log Milestone
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
