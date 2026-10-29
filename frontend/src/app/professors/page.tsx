"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  GraduationCap,
  Building,
  BookOpen,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronRight,
  Briefcase,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";
import { ProfessorProfile, Department } from "@/types/api";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function ProfessorsPage() {
  const [professors, setProfessors] = useState<ProfessorProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [appliedProfIds, setAppliedProfIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadInitial() {
      try {
        const [profData, deptData, reqData] = await Promise.allSettled([
          api.getProfessors(),
          api.getDepartments(),
          api.getResearchRequests(),
        ]);
        if (profData.status === "fulfilled") setProfessors(profData.value || []);
        if (deptData.status === "fulfilled") setDepartments(deptData.value || []);
        if (reqData.status === "fulfilled") {
          const list = Array.isArray(reqData.value) ? reqData.value : (reqData.value as any)?.items || [];
          setAppliedProfIds(new Set(list.map((r: any) => r.professor_id)));
        }
      } catch (err) {
        console.error("Failed to load professors:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitial();
  }, []);

  const handleSearch = async (overrideDept?: string) => {
    setIsLoading(true);
    const deptToUse = typeof overrideDept === "string" ? overrideDept : selectedDept;
    try {
      const data = await api.getProfessors({
        search: search || undefined,
        department_id: deptToUse || undefined,
      });
      setProfessors(Array.isArray(data) ? data : (data as any)?.items || []);
    } catch (err) {
      console.error("Filter error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProfessors = (Array.isArray(professors) ? professors : []).filter((p: any) => {
    if (availabilityFilter === "open" && !p.open_to_applications) return false;
    if (availabilityFilter === "full" && p.open_to_applications) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-xs font-semibold mb-2 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
          <Users className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span>Faculty Directory</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-900 to-cyan-700 dark:from-white dark:via-indigo-200 dark:to-cyan-300 bg-clip-text text-transparent">
          Faculty &amp; Principal Investigator Directory
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
          Explore verified university researchers, ongoing laboratory grants, publications, and supervision availability.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-3 sm:p-4 bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xl">
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search faculty name, research interest, or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/15 focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 shadow-md"
            />
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 sm:flex gap-2">
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                handleSearch(e.target.value);
              }}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/15 focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
            >
              <option value="">All Departments</option>
              {(Array.isArray(departments) ? departments : []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/15 focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
            >
              <option value="all">Any Availability</option>
              <option value="open">Open to Applications</option>
              <option value="full">At Full Capacity</option>
            </select>

            <Button size="sm" onClick={() => handleSearch()} className="text-xs xs:col-span-2 sm:col-span-1">
              Apply Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Results Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6 animate-pulse space-y-3 bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10">
              <div className="w-1/3 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="w-2/3 h-3 bg-slate-100 dark:bg-slate-800/80 rounded"></div>
              <div className="w-full h-12 bg-slate-100/60 dark:bg-slate-800/40 rounded"></div>
            </Card>
          ))}
        </div>
      ) : filteredProfessors.length === 0 ? (
        <Card className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10">
          No faculty members match your criteria. Try adjusting your search query or department filter.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProfessors.map((prof) => (
            <Card
              key={prof.id}
              hoverable
              className="flex flex-col justify-between bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 hover:border-cyan-500/50 dark:hover:border-cyan-400/50 hover:shadow-xl hover:shadow-cyan-500/15"
            >
              <CardContent className="p-4 sm:p-6 space-y-3.5 sm:space-y-4">
                <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2.5 sm:gap-3">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white font-bold text-sm sm:text-base flex items-center justify-center shrink-0 shadow-md shadow-cyan-500/25">
                      {(prof.full_name || prof.profiles?.full_name || "P").charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                        {prof.full_name || prof.profiles?.full_name || "Faculty Member"}
                      </h3>
                      <p className="text-xs text-cyan-700 dark:text-cyan-300 font-medium truncate">{prof.academic_title || prof.title || "Professor"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end xs:self-auto">
                    {appliedProfIds.has(prof.id) && (
                      <Badge variant="teal" withDot className="text-[10px] gap-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                        <span>Applied</span>
                      </Badge>
                    )}
                    <Badge
                      variant={prof.open_to_applications ? "success" : "secondary"}
                      withDot
                      className="text-[10px] shrink-0 font-semibold"
                    >
                      {prof.open_to_applications
                        ? "Open to Students"
                        : "Capacity Full"}
                    </Badge>
                  </div>
                </div>

                {(prof.bio || prof.profiles?.bio) && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {prof.bio || prof.profiles?.bio}
                  </p>
                )}

                {/* Laboratory Info & Research Interests */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <Building className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                    <span className="truncate">
                      {prof.lab_name || "Computer Science Research Group"}
                      {prof.office_location ? ` • ${prof.office_location}` : ""}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(Array.isArray(prof.research_interests) ? prof.research_interests : []).map((ri: any, idx: number) => (
                      <span
                        key={typeof ri === "string" ? `${ri}-${idx}` : (ri.id || ri.name || idx)}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 dark:bg-white/5 border border-cyan-500/20 dark:border-white/10 text-cyan-700 dark:text-cyan-300 font-medium"
                      >
                        {typeof ri === "string" ? ri : ri.name}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>

              {/* Card Footer / Action */}
              <div className="px-4 sm:px-5 py-3 bg-slate-50/90 dark:bg-slate-950/60 border-t border-slate-200/80 dark:border-white/10 rounded-b-2xl flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3">
                  <span>
                    Supervising:{" "}
                    <strong className="text-cyan-700 dark:text-cyan-300">
                      {prof.current_supervision_count || 1}/{prof.max_capacity || 4}
                    </strong>
                  </span>
                </div>
                <Link href={`/professors/${prof.id}`} className="w-full xs:w-auto">
                  <Button
                    size="sm"
                    variant={appliedProfIds.has(prof.id) ? "outline" : "primary"}
                    className="w-full xs:w-auto text-xs gap-1"
                  >
                    <span>{appliedProfIds.has(prof.id) ? "View Application" : "View Profile"}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
