"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  ChevronDown,
  Minimize2,
  Maximize2,
  BookOpen,
  HelpCircle,
  Lightbulb,
} from "lucide-react";
import { api } from "@/lib/api";
import { AiChatMessage } from "@/types/api";

interface FloatingAiAssistantProps {
  contextType?: "paper" | "professor" | "project" | "general";
  contextId?: string;
  contextTitle?: string;
}

export function FloatingAiAssistant({
  contextType = "general",
  contextId,
  contextTitle,
}: FloatingAiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I am your ResearchBridge Academic Guide. I can help you evaluate papers, break down unfamiliar research methodologies, prep for professor inquiries, and plan your research roadmap. What would you like to explore today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    setInput("");
    const userMsg: AiChatMessage = { role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await api.sendAiChat({
        message: textToSend,
        conversation_id: conversationId,
        context_type: contextType,
        context_id: contextId,
      });

      const replyText = res.reply || res.message || "I have analyzed your research inquiry.";
      setConversationId(res.conversation_id);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: replyText },
      ]);
    } catch (e: any) {
      console.warn("AI chat error:", e);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm currently operating in academic offline mode. Based on standard research group practices: ensure your inquiry explicitly references the professor's recent publications, highlights your concrete technical skills (e.g. PyTorch, systems architecture), and proposes a realistic 10–15 hour weekly commitment.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    "How should I email a professor about research?",
    "Explain the typical undergraduate research timeline",
    "What are good questions to ask during an interview?",
  ];

  return (
    <aside
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end max-w-[calc(100vw-2rem)]"
      aria-label="Academic Assistant"
    >
      {/* Floating Launcher Trigger */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center justify-center w-11 h-11 sm:w-auto sm:h-auto sm:gap-2 sm:px-4 sm:py-3 rounded-full bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.45)] hover:shadow-[0_0_30px_rgba(99,102,241,0.7)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-white/30"
          title="Open Academic AI Guide"
          aria-label="Open Academic AI Guide"
        >
          <div className="relative flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/20 text-white shrink-0">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin-slow" />
          </div>
          <span className="hidden sm:inline text-xs sm:text-sm font-bold pr-1 tracking-wide">Academic AI Guide</span>
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400"></span>
          </span>
        </button>
      )}

      {/* Assistant Modal Window */}
      {isOpen && (
        <div
          className={`bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-200/90 dark:border-white/20 overflow-hidden flex flex-col transition-all duration-200 ${
            isMinimized
              ? "w-[calc(100vw-1.5rem)] sm:w-80 h-14"
              : "w-[calc(100vw-1.5rem)] sm:w-[420px] h-[480px] sm:h-[560px] max-h-[85vh]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50/90 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/30">
                <Sparkles className="w-4 h-4 animate-spin-slow" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide flex items-center gap-1.5">
                  <span>ResearchBridge Assistant</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                </h3>
                {contextTitle && (
                  <p className="text-[10px] text-cyan-600 dark:text-cyan-300 truncate max-w-[200px]">
                    Context: {contextTitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title={isMinimized ? "Maximize" : "Minimize"}
              >
                {isMinimized ? (
                  <Maximize2 className="w-3.5 h-3.5" />
                ) : (
                  <Minimize2 className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Message History */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/70 dark:bg-slate-950/70 text-xs">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2.5 ${
                      m.role === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        m.role === "user"
                          ? "bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-sm"
                          : "bg-gradient-to-tr from-cyan-500 to-teal-600 text-white shadow-sm"
                      }`}
                    >
                      {m.role === "user" ? (
                        <User className="w-3.5 h-3.5" />
                      ) : (
                        <Bot className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div
                      className={`p-3 rounded-2xl max-w-[82%] leading-relaxed ${
                        m.role === "user"
                          ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-tr-none shadow-md shadow-indigo-500/20"
                          : "bg-white dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 shadow-md dark:shadow-lg rounded-tl-none whitespace-pre-line"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-teal-600 text-white flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 rounded-2xl rounded-tl-none text-cyan-600 dark:text-cyan-300 flex items-center gap-1.5 shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-bounce"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts Suggestions */}
              {messages.length <= 2 && (
                <div className="px-3 py-2 bg-slate-50/90 dark:bg-slate-900/80 border-t border-slate-200/80 dark:border-white/10 flex flex-wrap gap-1.5">
                  {quickPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(prompt)}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-500/20 hover:text-cyan-900 dark:hover:text-white border border-slate-200 dark:border-white/10 transition-all cursor-pointer text-left shadow-xs"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {/* Chat Input */}
              <div className="p-3 bg-white/95 dark:bg-slate-900/90 border-t border-slate-200/80 dark:border-white/10">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about papers, professors, or skills..."
                    className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity cursor-pointer shadow-md shadow-cyan-500/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  );
}
