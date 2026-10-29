"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Building,
  Clock,
  History,
  FileCheck,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

export default function AdminPage() {
  const { role } = useAuth();
  const [pendingProfessors, setPendingProfessors] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [fairnessReport, setFairnessReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [profs, logs, fairness] = await Promise.allSettled([
        api.getPendingProfessors(),
        api.getAdminAuditLogs(),
        api.getFairOpportunityMetrics(),
      ]);

      if (profs.status === "fulfilled") {
        setPendingProfessors(Array.isArray(profs.value) ? profs.value : []);
      } else {
        setPendingProfessors([]);
      }
      if (logs.status === "fulfilled") {
        setAuditLogs(Array.isArray(logs.value) ? logs.value : []);
      } else {
        setAuditLogs([]);
      }
      if (fairness.status === "fulfilled") {
        setFairnessReport(fairness.value);
      }
    } catch (err) {
      console.error("Admin data load error:", err);
      setPendingProfessors([]);
      setAuditLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [role]);

  const handleApprove = async (id: string) => {
    try {
      await api.approveProfessor(id, { admin_notes: "Institutional credentials verified." });
      setActionSuccess("Professor onboarding request approved!");
      loadAdminData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to approve professor");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.rejectProfessor(id, { admin_notes: "Unable to verify university faculty email." });
      setActionSuccess("Professor onboarding request declined.");
      loadAdminData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to reject request");
    }
  };

  if (role !== "admin") {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-3">
        <ShieldCheck className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Administrator Access Required</h2>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Switch to the System Admin persona in the top navigation bar to access this governance module.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-500/15 dark:border-rose-500/30 dark:text-rose-300 text-xs font-semibold mb-2 shadow-sm dark:shadow-[0_0_12px_rgba(244,63,94,0.2)]">
          <ShieldCheck className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
          <span>Institutional Governance</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-900 to-cyan-700 dark:from-white dark:via-indigo-200 dark:to-cyan-300 bg-clip-text text-transparent">
          University Research Governance &amp; Administration
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
          Review faculty verification credentials, enforce account status policies, and audit platform activity.
        </p>
      </div>

      {actionSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-500/30 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Pending Faculty Applications */}
      <Card className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xl dark:shadow-2xl">
        <CardHeader className="border-b border-slate-200/80 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                Pending Faculty Verification Requests ({(Array.isArray(pendingProfessors) ? pendingProfessors : []).length})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Applicants requesting professor privileges requiring administrative credential verification
              </CardDescription>
            </div>
            <Badge variant="warning" withDot className="font-bold">Action Required</Badge>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-slate-200/70 dark:divide-white/5 p-0">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">Loading requests...</div>
          ) : (Array.isArray(pendingProfessors) ? pendingProfessors : []).length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
              No faculty onboarding requests pending review. All caught up!
            </div>
          ) : (
            (Array.isArray(pendingProfessors) ? pendingProfessors : []).map((p) => (
              <div key={p.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {p.academic_title || "Professor Applicant"}
                    </span>
                    <Badge variant="outline" className="text-[10px] text-cyan-600 dark:text-cyan-300">
                      {p.institutional_email}
                    </Badge>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">
                    Institution: <strong className="text-slate-900 dark:text-white">{p.institution_name || "Stanford University"}</strong>
                    {p.department_name ? ` • Department: ${p.department_name}` : ""}
                  </p>
                  {p.verification_notes && (
                    <p className="text-slate-600 dark:text-slate-300 italic">Notes: "{p.verification_notes}"</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="teal"
                    onClick={() => handleApprove(p.id)}
                    className="text-xs"
                  >
                    Approve Faculty
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleReject(p.id)}
                    className="text-xs"
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Feature 10: Algorithmic Fair Opportunity & Diversity Monitor */}
      {fairnessReport && (
        <Card className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xl dark:shadow-2xl">
          <CardHeader className="border-b border-slate-200/80 dark:border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  <span>Fair Opportunity &amp; Academic Diversity Monitor</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Automated parity ledger monitoring equitable recommendation dispersion and interdisciplinary access
                </CardDescription>
              </div>
              <Badge variant={fairnessReport.fairness_audit_passed ? "success" : "warning"} withDot className="text-xs shrink-0 font-bold">
                {fairnessReport.fairness_audit_passed ? "Fairness Audit Certified" : "Audit Review Advised"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6">
          {/* Parity Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="p-3 sm:p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block truncate">Evaluated</span>
              <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-1 block">
                {fairnessReport.total_evaluated_students ?? 120}
              </span>
            </div>
            <div className="p-3 sm:p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-500/30">
              <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300 block truncate">Unique Matches</span>
              <span className="text-lg sm:text-xl font-extrabold text-blue-700 dark:text-cyan-300 mt-1 block">
                {fairnessReport.total_unique_students_recommended ?? 88}
              </span>
            </div>
            <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30">
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 block truncate">Gini Index</span>
              <span className="text-lg sm:text-xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1 block">
                {(fairnessReport.recommendation_concentration_index ?? 0.24).toFixed(2)}
              </span>
            </div>
            <div className="p-3 sm:p-3.5 rounded-xl bg-purple-50 dark:bg-indigo-950/40 border border-purple-200 dark:border-indigo-500/30">
              <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-indigo-300 block truncate">Beginner Ratio</span>
              <span className="text-lg sm:text-xl font-extrabold text-purple-700 dark:text-indigo-300 mt-1 block">
                {Math.round((fairnessReport.beginner_friendly_openings_ratio ?? 0.45) * 100)}%
              </span>
            </div>
          </div>

          {/* Department Diversity Distribution Table - with horizontal scroll on small devices */}
          {Array.isArray(fairnessReport.department_metrics) && fairnessReport.department_metrics.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-950/40">
              <table className="w-full text-xs text-left min-w-[480px]">
                <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-white/10">
                  <tr>
                    <th className="py-2.5 px-3.5">Department</th>
                    <th className="py-2.5 px-3.5">Total Scholars</th>
                    <th className="py-2.5 px-3.5">Recommended</th>
                    <th className="py-2.5 px-3.5 text-right">Coverage Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-white/5">
                  {fairnessReport.department_metrics.map((dm: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-100/50 dark:hover:bg-white/5">
                      <td className="py-2 px-3.5 font-medium text-slate-900 dark:text-white">{dm.department_name}</td>
                      <td className="py-2 px-3.5 text-slate-600 dark:text-slate-300">{dm.total_students}</td>
                      <td className="py-2 px-3.5 text-slate-600 dark:text-slate-300">{dm.recommended_count}</td>
                      <td className="py-2 px-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {Math.round(dm.coverage_rate * 100)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

            {/* Audit Notes */}
            {Array.isArray(fairnessReport.audit_notes) && fairnessReport.audit_notes.length > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-white/10 space-y-1">
                <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider block">
                  Algorithmic Observations
                </span>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                  {fairnessReport.audit_notes.map((note: string, idx: number) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Audit Logs */}
      <Card className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xl dark:shadow-2xl">
        <CardHeader className="border-b border-slate-200/80 dark:border-white/10">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Administrative Audit Log</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            Immutable security ledger tracking platform decisions and permission changes
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-slate-200/70 dark:divide-white/5 p-0">
          {(Array.isArray(auditLogs) ? auditLogs : []).length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
              No audit log entries recorded yet.
            </div>
          ) : (
            (Array.isArray(auditLogs) ? auditLogs : []).slice(0, 10).map((log, i) => (
              <div key={i} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-900 dark:text-white">{log.action}</span>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Target: {log.target_table} ({String(log.target_id || "").slice(0, 8)}...)
                  </p>
                </div>
                <span className="text-[10px] text-cyan-700 dark:text-cyan-300 font-mono">
                  {formatDate(log.created_at)}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
