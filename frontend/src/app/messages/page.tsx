"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  User,
  Clock,
  CheckCheck,
  Briefcase,
  GraduationCap,
  ArrowLeft,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ResearchRequest, RequestMessage } from "@/types/api";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatTimeAgo } from "@/lib/utils";

export default function MessagesPage() {
  const { user, role } = useAuth();
  const [requests, setRequests] = useState<ResearchRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [messages, setMessages] = useState<RequestMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load user's active requests
  useEffect(() => {
    async function loadConversations() {
      setIsLoadingRequests(true);
      try {
        const reqs = await api.getResearchRequests();
        const list = Array.isArray(reqs) ? reqs : (reqs as any)?.items || [];
        setRequests(list);
        if (list.length > 0 && !selectedRequestId) {
          setSelectedRequestId(list[0].id);
        }
      } catch (err) {
        console.error("Failed to load conversation requests:", err);
      } finally {
        setIsLoadingRequests(false);
      }
    }
    loadConversations();
  }, [role, user]);

  // Load messages for selected request
  useEffect(() => {
    if (!selectedRequestId) return;
    async function loadThread() {
      setIsLoadingMessages(true);
      try {
        const res: any = await api.getMessages(selectedRequestId!);
        const threadMsgs = res?.messages || res?.items || (Array.isArray(res) ? res : []);
        setMessages(Array.isArray(threadMsgs) ? threadMsgs : []);
        await api.markMessagesRead(selectedRequestId!);
      } catch (err) {
        console.error("Failed to load thread messages:", err);
      } finally {
        setIsLoadingMessages(false);
      }
    }
    loadThread();

    // Poll every 5s for realtime updates
    const timer = setInterval(loadThread, 5000);
    return () => clearInterval(timer);
  }, [selectedRequestId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedRequestId || isSending) return;

    const text = messageInput.trim();
    setMessageInput("");
    setIsSending(true);

    try {
      const newMsg = await api.sendMessage(selectedRequestId, text);
      setMessages((prev) => [...prev, newMsg]);
    } catch (err: any) {
      alert(err.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const safeRequests = Array.isArray(requests) ? requests : [];
  const selectedRequest = safeRequests.find((r) => r.id === selectedRequestId);

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col space-y-4 pb-4">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-xs font-semibold mb-2 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
          <MessageSquare className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span>Realtime Collaboration Channel</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-900 to-cyan-700 dark:from-white dark:via-indigo-200 dark:to-cyan-300 bg-clip-text text-transparent">
          Research Collaboration Messaging
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
          Secure communication channel scoped to specific research applications.
        </p>
      </div>

      {/* Main 2-Panel Messenger */}
      <Card className="flex-1 flex overflow-hidden bg-white/85 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 shadow-2xl">
        {/* Left Column: Conversation List */}
        <div className={`w-full md:w-80 border-r border-slate-200/80 dark:border-white/10 flex-col bg-slate-50 dark:bg-slate-950/60 shrink-0 ${selectedRequestId ? "hidden md:flex" : "flex"}`}>
          <div className="p-3.5 border-b border-slate-200/80 dark:border-white/10 bg-slate-100 dark:bg-slate-900/60 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Conversations ({safeRequests.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-200/80 dark:divide-white/5">
            {isLoadingRequests ? (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                Loading conversations...
              </div>
            ) : safeRequests.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                No active collaboration threads.
              </div>
            ) : (
              safeRequests.map((req) => (
                <button
                  key={req.id}
                  onClick={() => setSelectedRequestId(req.id)}
                  className={`w-full text-left p-3.5 transition-colors cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 ${
                    selectedRequestId === req.id ? "bg-indigo-50 dark:bg-indigo-600/20 border-r-2 border-r-cyan-500 dark:border-r-cyan-400" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {role === "professor" ? (req.student_name || "Applicant") : (req.professor_name || "Supervisor")}
                    </span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 capitalize text-cyan-700 dark:text-cyan-300">
                      {req.status?.replace("_", " ") || "submitted"}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 truncate font-medium">
                    {req.subject}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-1">
                    {formatTimeAgo(req.created_at)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Chat History & Input */}
        <div className={`flex-1 flex-col bg-slate-50/50 dark:bg-slate-900/40 min-w-0 ${selectedRequestId ? "flex" : "hidden md:flex"}`}>
          {selectedRequest ? (
            <>
              {/* Thread Header */}
              <div className="p-3 sm:p-4 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between bg-slate-100 dark:bg-slate-950/60 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={() => setSelectedRequestId(null)}
                    className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                    title="Back to conversation list"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {selectedRequest.subject}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                      Participant:{" "}
                      <strong className="text-cyan-700 dark:text-cyan-300">
                        {role === "professor"
                          ? selectedRequest.student_name || "Student Applicant"
                          : selectedRequest.professor_name || "Professor"}
                      </strong>
                    </p>
                  </div>
                </div>
                <Badge variant="teal" withDot className="text-[10px] sm:text-xs capitalize font-bold shrink-0">
                  {selectedRequest.status?.replace("_", " ") || "submitted"}
                </Badge>
              </div>

              {/* Message Bubbles Container */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-100/50 dark:bg-slate-950/50">
                {isLoadingMessages && messages.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-500 dark:text-slate-400">
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-500 dark:text-slate-400">
                    No messages yet in this conversation. Send the first message below!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isCurrentUser = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex items-start gap-2.5 ${
                          isCurrentUser ? "flex-row-reverse" : "flex-row"
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                            isCurrentUser
                              ? "bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-sm"
                              : "bg-slate-200 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 border border-slate-300 dark:border-white/10"
                          }`}
                        >
                          {msg.sender_role === "professor" ? "P" : "S"}
                        </div>
                        <div
                          className={`p-3 rounded-2xl max-w-[70%] text-xs leading-relaxed ${
                            isCurrentUser
                              ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-tr-none shadow-md shadow-indigo-500/20"
                              : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 shadow-sm rounded-tl-none"
                          }`}
                        >
                          <p>{msg.message_body}</p>
                          <span
                            className={`text-[9px] block text-right mt-1 ${
                              isCurrentUser ? "text-cyan-200" : "text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {formatTimeAgo(msg.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer */}
              <div className="p-3 border-t border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-950/70">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type your message to collaborator..."
                    className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/15 focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={!messageInput.trim() || isSending}
                    isLoading={isSending}
                    className="p-2.5 rounded-xl"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
              Select a collaboration conversation to begin chatting.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
