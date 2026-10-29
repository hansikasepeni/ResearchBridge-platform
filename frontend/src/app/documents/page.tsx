"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Upload,
  Sparkles,
  Download,
  BookOpen,
  CheckCircle,
  Clock,
  ChevronRight,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";
import { api } from "@/lib/api";
import { DocumentRecord, PaperSummary } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  const [summary, setSummary] = useState<PaperSummary | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadScope, setUploadScope] = useState("public");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const loadDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const docs = await api.getDocuments();
      const safeDocs = Array.isArray(docs) ? docs : [];
      setDocuments(safeDocs);
      if (safeDocs.length > 0 && !selectedDoc) {
        handleSelectDocument(safeDocs[0]);
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
      setDocuments([]);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleSelectDocument = async (doc: DocumentRecord) => {
    setSelectedDoc(doc);
    setSummary(null);
    try {
      const existingSummary = await api.getDocumentSummary(doc.id);
      setSummary(existingSummary);
    } catch {
      // Summary not generated yet
    }
  };

  const handleGenerateSummary = async () => {
    if (!selectedDoc) return;
    setIsSummarizing(true);
    try {
      const sum = await api.summarizeDocument(selectedDoc.id);
      setSummary(sum);
    } catch (err: any) {
      alert(err.message || "Failed to generate AI paper summary");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !uploadTitle.trim()) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", uploadTitle);
      formData.append("access_scope", uploadScope);

      const created = await api.uploadDocument(formData);
      setIsUploadModalOpen(false);
      setUploadTitle("");
      setFile(null);
      await loadDocuments();
      handleSelectDocument(created);
    } catch (err: any) {
      alert(err.message || "Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-xs font-semibold mb-2 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
            <BookOpen className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>AI Scientific Synthesis</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-900 to-cyan-700 dark:from-white dark:via-indigo-200 dark:to-cyan-300 bg-clip-text text-transparent">
            Academic Research Paper Library &amp; AI Summaries
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Upload scientific manuscripts and preprints to generate structured, plain-language summaries powered by Gemini.
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={() => setIsUploadModalOpen(true)}
          className="text-xs gap-1.5 shrink-0"
        >
          <Upload className="w-4 h-4" />
          <span>Upload PDF Paper</span>
        </Button>
      </div>

      {/* Main 2-Panel View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Document List */}
        <div className="space-y-4">
          <Card className="bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-2xl">
            <CardHeader className="pb-3 border-b border-slate-200/80 dark:border-white/10">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                <span>Paper Repository</span>
                <span className="text-xs text-cyan-700 dark:text-cyan-400">({(Array.isArray(documents) ? documents : []).length})</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Stored in private university Supabase storage
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-slate-200/80 dark:divide-white/5 p-0">
              {isLoadingDocs ? (
                <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  Loading repository...
                </div>
              ) : (Array.isArray(documents) ? documents : []).length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  No papers uploaded yet. Upload a PDF paper above!
                </div>
              ) : (
                (Array.isArray(documents) ? documents : []).map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleSelectDocument(doc)}
                    className={`w-full text-left p-4 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer flex items-start gap-3 ${
                      selectedDoc?.id === doc.id
                        ? "bg-indigo-50 dark:bg-indigo-600/20 border-l-2 border-l-cyan-500 dark:border-l-cyan-400"
                        : ""
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-500/30">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {doc.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {doc.file_name} • {(doc.byte_size / 1024).toFixed(0)} KB
                      </p>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 mt-1 capitalize text-cyan-700 dark:text-cyan-300">
                        {doc.access_scope}
                      </Badge>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Active Document Summary Viewer */}
        <div className="lg:col-span-2">
          {selectedDoc ? (
            <Card className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-2xl">
              {/* Document Overview Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-200/80 dark:border-white/10">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                      {selectedDoc.title}
                    </h2>
                    <Badge variant="teal" withDot className="text-xs font-bold shrink-0">
                      {selectedDoc.mime_type}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    Uploaded {formatDate(selectedDoc.created_at)} • File: {selectedDoc.file_name}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!summary && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={handleGenerateSummary}
                      isLoading={isSummarizing}
                      className="text-xs gap-1.5 shadow-md shadow-indigo-500/25 w-full sm:w-auto"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
                      <span>Generate AI Summary</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Summary Presentation */}
              {summary ? (
                <div className="space-y-6 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                  {/* One-Sentence Takeaway */}
                  <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/30 text-indigo-900 dark:text-indigo-200 space-y-1 shadow-sm">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-cyan-700 dark:text-cyan-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Key Research Takeaway</span>
                    </div>
                    <p className="text-xs font-semibold leading-relaxed text-slate-900 dark:text-white">
                      {summary.one_sentence_takeaway}
                    </p>
                  </div>

                  {/* Executive / Plain Language Overview */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      Overview &amp; Executive Summary
                    </h4>
                    <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                      {summary.plain_language_overview || summary.executive_summary || summary.one_sentence_takeaway || "Summary available upon generation."}
                    </p>
                  </div>

                  {/* Problem & Methodology Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/10 space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">Research Problem</h4>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        {summary.research_problem || summary.problem_statement || "Specific research problem addressed by this paper."}
                      </p>
                      {summary.research_question && (
                        <p className="text-xs text-cyan-700 dark:text-cyan-300 font-semibold pt-1">
                          Core Hypothesis: {summary.research_question}
                        </p>
                      )}
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/10 space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">Methodology &amp; Techniques</h4>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        {summary.methodology || (Array.isArray(summary.methodology_breakdown) ? summary.methodology_breakdown.join("\n") : "Experimental methodology detailed in paper.")}
                      </p>
                      {summary.techniques_models && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                          Models/Tools: {summary.techniques_models}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Key Findings & Contributions */}
                  <div className="p-4 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 space-y-2">
                    <h4 className="font-bold text-emerald-800 dark:text-emerald-300">Key Scientific Findings &amp; Contributions</h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-200 leading-relaxed whitespace-pre-line">
                      {summary.findings_contributions || (Array.isArray(summary.key_findings) ? summary.key_findings.join(". ") : "Empirical contributions and experimental results validated by the authors.")}
                    </p>
                  </div>

                  {/* Key Terminology */}
                  {Array.isArray(summary.key_terminology) && summary.key_terminology.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">Key Scientific Terminology</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {summary.key_terminology.map((t, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-slate-800/40">
                            <span className="font-bold text-cyan-700 dark:text-cyan-300 text-xs block">{t.term}</span>
                            <span className="text-[11px] text-slate-600 dark:text-slate-300">{t.definition}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Professor Discussion Questions */}
                  {((Array.isArray(summary.discussion_questions) && summary.discussion_questions.length > 0) ||
                    (Array.isArray(summary.discussion_prompts) && summary.discussion_prompts.length > 0)) && (
                    <div className="p-4 rounded-xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/30 space-y-2 text-amber-800 dark:text-amber-200">
                      <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300">
                        <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span>Prompts &amp; Questions to Discuss with Professor</span>
                      </div>
                      <ul className="list-disc pl-4 space-y-1 text-amber-700 dark:text-amber-200 text-xs">
                        {(summary.discussion_questions || summary.discussion_prompts || []).map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16 space-y-3">
                  <BookOpen className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Click <strong>"Generate AI Summary"</strong> above to extract structured methodology, takeaways, and discussion points.
                  </p>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-16 text-center text-xs text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10">
              Select a research paper from the repository to view its AI summary.
            </Card>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Academic Manuscript / Preprint (PDF)"
        description="PDF documents will be stored securely and analyzed by the Gemini research assistant."
        maxWidth="md"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Paper Title
            </label>
            <input
              type="text"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="e.g. Attention Is All You Need"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Access Scope
            </label>
            <select
              value={uploadScope}
              onChange={(e) => setUploadScope(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="public">Public (All University Researchers)</option>
              <option value="institution">Institution Only</option>
              <option value="private">Private (Only You)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select PDF File
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-600 dark:text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
              required
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-200/80 dark:border-white/10">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsUploadModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isUploading}>
              Upload Document
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
