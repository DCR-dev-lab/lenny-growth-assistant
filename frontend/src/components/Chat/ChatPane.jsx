"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, BookOpen, PenTool, Loader2, Radio, Database, Zap, Rocket, FileText, Calculator, ShieldAlert } from "lucide-react";
import MessageItem from "./MessageItem";
import ModelSelector from "./ModelSelector";

const FEATURED_OPERATORS = [
  "Adam Fishman",
  "Elena Verna",
  "Shreyas Doshi",
  "Brian Chesky",
  "Gustaf Alströmer",
  "Casey Winters",
  "Bob Moesta",
  "Gibson Biddle",
];

const QUICK_PROMPTS = [
  {
    mode: "default",
    category: "Tactical Onboarding",
    label: "Onboarding as a Growth Lever",
    icon: Rocket,
    iconColor: "text-purple-600 bg-purple-50 border-purple-100",
    categoryColor: "text-purple-700 bg-purple-50 border-purple-200",
    prompt: "What does Adam Fishman say about why onboarding is the most critical part of the product experience?",
  },
  {
    mode: "ship30",
    category: "Executive Essay",
    label: "Ship 30: High-Agency PMs",
    icon: FileText,
    iconColor: "text-amber-600 bg-amber-50 border-amber-100",
    categoryColor: "text-amber-700 bg-amber-50 border-amber-200",
    prompt: "Write a Ship 30 for 30 essay on Shreyas Doshi's LNO framework and high-agency product management.",
  },
  {
    mode: "default",
    category: "Interactive Tool",
    label: "Interactive Viral Calculator",
    icon: Calculator,
    iconColor: "text-indigo-600 bg-indigo-50 border-indigo-100",
    categoryColor: "text-indigo-700 bg-indigo-50 border-indigo-200",
    prompt: "Generate an interactive HTML/CSS viral growth loop calculator for modeling activation and K-factor.",
  },
  {
    mode: "default",
    category: "Refusal Guardrail",
    label: "Out-of-Domain Guardrail Test",
    icon: ShieldAlert,
    iconColor: "text-rose-600 bg-rose-50 border-rose-100",
    categoryColor: "text-rose-700 bg-rose-50 border-rose-200",
    prompt: "What is the best temperature and recipe for baking a sourdough bread loaf?",
  },
];

export default function ChatPane({
  messages,
  isStreaming,
  streamingText,
  streamStatus,
  currentSources,
  onSendMessage,
  onOpenArtifact,
  currentProvider,
  onSelectProvider,
  healthData,
  currentMode,
  onChangeMode,
}) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, streamStatus]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming) return;
    onSendMessage(input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const chunkCount = healthData?.pgvector?.chunk_count || 293;

  return (
    <div className="flex flex-col h-full bg-slate-50 relative flex-1 overflow-hidden">
      {/* Top Header */}
      <header className="h-14 bg-white border-b border-slate-200/80 px-4 flex items-center justify-between shrink-0 shadow-2xs z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-700 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              <Radio className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-slate-900 leading-none">The Lenny Growth Assistant</h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 live-pulse-dot" />
                  <span>{chunkCount} Chunks (HNSW)</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Operational PM &amp; Growth Intelligence</p>
            </div>
          </div>

          {/* Mode Selector Pill */}
          <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 ml-4 text-xs">
            <button
              onClick={() => onChangeMode("default")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all ${
                currentMode === "default"
                  ? "bg-white text-brand-700 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Standard conversational QA with strict citations"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Grounded QA
            </button>
            <button
              onClick={() => onChangeMode("ship30")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all ${
                currentMode === "ship30"
                  ? "bg-white text-brand-700 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="High-retention ~1,250-word essay adhering to Ship 30 for 30 heuristics"
            >
              <PenTool className="w-3.5 h-3.5" />
              Ship 30 for 30
            </button>
          </div>
        </div>

        {/* Model Selector & Health Status */}
        <div className="flex items-center gap-2">
          <ModelSelector
            currentProvider={currentProvider}
            onSelectProvider={onSelectProvider}
            healthData={healthData}
          />
        </div>
      </header>

      {/* Messages Scroll Area - Full width scroll container so scrollbar is at the edge of the pane */}
      <div className="flex-1 overflow-y-auto w-full">
        <div className="max-w-4xl w-full mx-auto px-4 py-6 md:px-8">
          {messages.length === 0 && (
            <div className="mt-4 mb-8 text-center animate-in fade-in duration-300">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-50 to-indigo-50 border border-brand-200 text-brand-600 flex items-center justify-center mx-auto mb-3.5 shadow-sm">
                <Sparkles className="w-7 h-7 text-brand-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">The Lenny Growth Assistant</h2>
              <p className="text-xs text-slate-500 max-w-lg mx-auto mt-1.5 mb-4 leading-relaxed">
                Verifiable product management and growth tactics unlocked from <strong>Lenny&apos;s Podcast</strong> transcripts. Strictly grounded citations, Ship 30 for 30 essays, and Claude-style interactive artifacts.
              </p>

              {/* Operator Chips */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-xl mx-auto mb-6">
                <span className="text-[11px] text-slate-400 font-medium mr-1">Episodes:</span>
                {FEATURED_OPERATORS.map((op, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-medium bg-white text-slate-600 border border-slate-200/90 px-2.5 py-0.5 rounded-full shadow-2xs"
                  >
                    {op}
                  </span>
                ))}
              </div>

              {/* Quick Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto text-left">
                {QUICK_PROMPTS.map((qp, i) => {
                  const CardIcon = qp.icon;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        onChangeMode(qp.mode);
                        onSendMessage(qp.prompt);
                      }}
                      className="p-4 bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-brand-300 rounded-2xl transition-all duration-200 text-xs group shadow-2xs hover:shadow-xs hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${qp.iconColor}`}>
                              <CardIcon className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-bold text-slate-900 group-hover:text-brand-700 transition-colors">
                              {qp.label}
                            </span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-medium border ${qp.categoryColor}`}>
                            {qp.category}
                          </span>
                        </div>
                        <p className="text-slate-500 line-clamp-2 leading-relaxed text-[11px]">{qp.prompt}</p>
                      </div>
                      <span className="text-[10px] text-brand-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity mt-2.5 flex items-center gap-1">
                        <span>Click to run query</span> &rarr;
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Conversation Turns */}
          {messages.map((msg, index) => (
            <MessageItem
              key={msg.id || index}
              message={msg}
              onOpenArtifact={onOpenArtifact}
            />
          ))}

          {/* Live Streaming Assistant Message */}
          {isStreaming && (
            <div className="flex gap-3.5 justify-start mb-6 animate-in fade-in duration-150">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-700 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="max-w-[85%] flex-1">
                {streamStatus && (
                  <div className="flex items-center gap-2 text-xs text-brand-700 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-xl mb-2.5 font-medium w-fit shadow-2xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{streamStatus}</span>
                  </div>
                )}
                {streamingText && (
                  <MessageItem
                    message={{
                      role: "assistant",
                      content: streamingText,
                      sources: currentSources,
                      artifacts: [],
                    }}
                    onOpenArtifact={onOpenArtifact}
                  />
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bottom Fixed Prompt Bar */}
      <div className="p-4 bg-white/95 backdrop-blur-xs border-t border-slate-200 shrink-0">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                currentMode === "ship30"
                  ? "Enter a topic for a Ship 30 for 30 essay (e.g. Elena Verna on B2B product-led growth)..."
                  : "Ask a product or growth question grounded in Lenny's podcast archive..."
              }
              className="auto-grow-input w-full pl-4 pr-36 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white resize-none shadow-2xs placeholder:text-slate-400 leading-relaxed transition-all"
            />
            <div className="absolute right-2.5 flex items-center gap-2">
              {/* Quick Inline Mode Indicator / Toggle */}
              <button
                type="button"
                onClick={() => onChangeMode(currentMode === "default" ? "ship30" : "default")}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentMode === "ship30"
                    ? "bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs"
                    : "bg-brand-50 text-brand-700 border border-brand-200 shadow-2xs"
                }`}
                title={`Current mode: ${currentMode === "default" ? "Grounded QA" : "Ship 30 for 30"}. Click to toggle.`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${currentMode === "ship30" ? "bg-amber-500" : "bg-brand-600"}`} />
                <span>{currentMode === "ship30" ? "Ship 30" : "QA"}</span>
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className="p-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white disabled:opacity-40 hover:from-brand-700 hover:to-indigo-700 transition-all shadow-xs cursor-pointer"
                title="Send message (Enter)"
              >
                {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </form>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
            <span>
              Mode: <strong className="text-slate-700 font-semibold">{currentMode === "ship30" ? "Ship 30 for 30 Essay" : "Grounded QA"}</strong> &bull; Press <kbd className="font-mono bg-slate-100 border border-slate-200 px-1 py-0.2 rounded text-[10px] text-slate-600">Enter</kbd> to send, <kbd className="font-mono bg-slate-100 border border-slate-200 px-1 py-0.2 rounded text-[10px] text-slate-600">Shift+Enter</kbd> for newline
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>Attributed citations &bull; Strict refusal on unverified queries</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
