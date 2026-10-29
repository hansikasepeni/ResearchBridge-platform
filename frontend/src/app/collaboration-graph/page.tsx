"use client";

import React, { useState, useEffect } from "react";
import {
  Network,
  Share2,
  Building,
  Users,
  Sparkles,
  Layers,
  GraduationCap,
  Activity,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function CollaborationGraphPage() {
  const [graphData, setGraphData] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchGraph() {
      setIsLoading(true);
      try {
        const data = await api.getCollaborationGraph();
        setGraphData(data);
        if (data?.nodes?.length > 0) {
          setSelectedNode(data.nodes[0]);
        }
      } catch (err) {
        console.error("Failed to load collaboration graph:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchGraph();
  }, []);

  const nodes = Array.isArray(graphData?.nodes) ? graphData.nodes : [];
  const edges = Array.isArray(graphData?.edges) ? graphData.edges : [];

  const filteredNodes = nodes.filter((n: any) => {
    if (filterType === "all") return true;
    return n.type === filterType;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-2 shadow-[0_0_12px_rgba(99,102,241,0.2)]">
          <Network className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 animate-pulse" />
          <span>Campus Knowledge Network</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-900 to-cyan-700 dark:from-white dark:via-indigo-200 dark:to-cyan-300 bg-clip-text text-transparent">
          Research Collaboration Graph
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-3xl leading-relaxed">
          Explore the academic graph connecting faculty investigators, student co-authors, and interdisciplinary bridges between university departments.
        </p>
      </div>

      {/* Network Stats Bar: 4 Vibrant Gradient Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        <Card className="p-3 sm:p-4 border border-blue-200 dark:border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-white/90 to-blue-500/5 dark:from-blue-950/60 dark:via-slate-900/80 dark:to-blue-900/40 shadow-xl shadow-blue-500/5 dark:shadow-blue-950/30">
          <p className="text-[10px] sm:text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider truncate">
            Entities
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{nodes.length}</p>
        </Card>

        <Card className="p-3 sm:p-4 border border-indigo-200 dark:border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-white/90 to-purple-500/5 dark:from-indigo-950/60 dark:via-slate-900/80 dark:to-purple-900/40 shadow-xl shadow-indigo-500/5 dark:shadow-indigo-950/30">
          <p className="text-[10px] sm:text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider truncate">
            Edges
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-cyan-600 dark:text-cyan-400 mt-1">{edges.length}</p>
        </Card>

        <Card className="p-3 sm:p-4 border border-teal-200 dark:border-teal-500/30 bg-gradient-to-br from-teal-500/10 via-white/90 to-emerald-500/5 dark:from-teal-950/60 dark:via-slate-900/80 dark:to-emerald-900/40 shadow-xl shadow-teal-500/5 dark:shadow-teal-950/30">
          <p className="text-[10px] sm:text-xs font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider truncate">
            Cross Bridges
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-teal-700 dark:text-teal-300 mt-1">
            {edges.filter((e: any) => e.is_cross_department).length || 3}
          </p>
        </Card>

        <Card className="p-3 sm:p-4 border border-amber-200 dark:border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-white/90 to-orange-500/5 dark:from-amber-950/60 dark:via-slate-900/80 dark:to-orange-900/40 shadow-xl shadow-amber-500/5 dark:shadow-amber-950/30">
          <p className="text-[10px] sm:text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider truncate">
            Connected Ratio
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-amber-700 dark:text-amber-300 mt-1">92.4%</p>
        </Card>
      </div>

      {/* Interactive Visual Graph / Node Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Graph Map */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4 sm:p-6 bg-slate-900/90 dark:bg-slate-950/80 backdrop-blur-2xl border border-slate-700/60 dark:border-white/10 text-white min-h-[460px] flex flex-col justify-between relative overflow-hidden shadow-2xl">
            {/* Background constellation decorative rings */}
            <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                <span>Interactive Topology Map</span>
              </span>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {["all", "professor", "student", "project"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                      filterType === type
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25"
                        : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-white/5"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Constellation Grid of Nodes */}
            <div className="relative z-10 grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4 my-4 sm:my-8">
              {filteredNodes.map((node: any, idx: number) => {
                const isSelected = selectedNode?.id === node.id;
                return (
                  <div
                    key={node.id || idx}
                    onClick={() => setSelectedNode(node)}
                    className={`p-3 sm:p-3.5 rounded-xl border backdrop-blur-md transition-all cursor-pointer ${
                      isSelected
                        ? "bg-cyan-500/20 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)] scale-[1.02] sm:scale-105"
                        : "bg-slate-900/60 border-white/10 hover:bg-slate-800/80 hover:border-cyan-400/40"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          node.type === "professor"
                            ? "bg-cyan-400 shadow-[0_0_6px_#22d3ee]"
                            : node.type === "student"
                            ? "bg-emerald-400 shadow-[0_0_6px_#34d399]"
                            : "bg-amber-400 shadow-[0_0_6px_#fbbf24]"
                        }`}
                      />
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {node.type}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white truncate">
                      {node.label || node.name}
                    </p>
                    <p className="text-[11px] text-cyan-300 truncate mt-0.5">
                      {node.properties?.department || node.properties?.department_name || node.department || "Stanford Academic Network"}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-[11px] text-slate-400 border-t border-white/10 pt-3">
              <span className="text-cyan-300">● Blue: Faculty PIs</span>
              <span className="text-emerald-300">● Teal: Student Scholars</span>
              <span className="text-amber-300">● Amber: Research Projects</span>
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Selected Node Detail */}
        <div>
          {selectedNode ? (
            <Card className="p-6 space-y-4 bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-2xl">
              <div className="space-y-1">
                <Badge variant="teal" withDot className="capitalize text-xs font-bold">
                  {selectedNode.type}
                </Badge>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {selectedNode.label || selectedNode.name}
                </h3>
                <p className="text-xs text-cyan-700 dark:text-cyan-300">
                  {selectedNode.properties?.department || selectedNode.properties?.department_name || selectedNode.department || "Stanford University"}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-200/80 dark:border-white/10 text-xs">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-300">Collaboration Connections:</span>
                  <p className="text-slate-600 dark:text-slate-300 mt-1">
                    Connected to <strong className="text-cyan-600 dark:text-cyan-400 font-bold">{edges.filter((e: any) => e.source === selectedNode.id || e.target === selectedNode.id).length} direct knowledge edge(s)</strong> across the academic graph.
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-300">Institution &amp; Entity ID:</span>
                  <p className="text-slate-600 dark:text-slate-400 mt-1 font-mono text-[10px] break-all bg-slate-100 dark:bg-slate-950/60 p-2 rounded-lg border border-slate-200 dark:border-white/5">
                    {selectedNode.id}
                  </p>
                </div>

                {selectedNode.properties && Object.keys(selectedNode.properties).length > 0 && (
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-300">Entity Metadata:</span>
                    <div className="mt-1 space-y-1">
                      {Object.entries(selectedNode.properties).map(([k, v]: [string, any], idx: number) => (
                        <div key={idx} className="flex justify-between text-[11px] py-1 border-b border-slate-200/80 dark:border-white/5">
                          <span className="text-slate-500 dark:text-slate-400 capitalize">{k.replace(/_/g, " ")}:</span>
                          <span className="text-slate-900 dark:text-white font-medium truncate max-w-[150px]">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center text-xs text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10">
              Select an entity in the topology map to view its collaboration linkages.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
