"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, BookOpen, PenTool, Loader2 } from "lucide-react";
import MessageItem from "./MessageItem";
import ModelSelector from "./ModelSelector";

const QUICK_PROMPTS = [
  {
    mode: "default",
    label: "Onboarding as a Growth Lever",
    prompt: "What does Adam Fishman say about why onboarding is the most critical part of the product experience?",
  },
  {
    mode: "ship30",
    label: "Ship 30 for 30: High-Agency PMs",
    prompt: "Write a Ship 30 for 30 essay on Shreyas Doshi's LNO framework and high-agency product management.",
  },
  {
    mode: "default",
    label: "Interactive Viral Calculator",
    prompt: "Generate an interactive HTML/CSS viral growth loop calculator for modeling activation and K-factor.",
  },
  {
    mode: "default",
    label: "Out-of-Domain Guardrail Test",
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
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative flex-1 overflow-hidden">
      {/* Top Header */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 shadow-xs z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              L
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800 leading-none">The Lenny Growth Assistant</h1>
              <p className="text-[11px] text-slate-500 mt-0.5">Operational PM &amp; Growth Intelligence</p>
            </div>
          </div>

          {/* Mode Selector Pill */}
          <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 ml-4 text-xs">
            <button
              onClick={() => onChangeMode("default")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all ${
                currentMode === "default"
                  ? "bg-white text-brand-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Grounded QA
            </button>
            <button
              onClick={() => onChangeMode("ship30")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all ${
                currentMode === "ship30"
                  ? "bg-white text-brand-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
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

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 max-w-4xl w-full mx-auto">
        {messages.length === 0 && (
          <div className="mt-8 mb-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">What would you like to build or unlock today?</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
              Answers strictly retrieved from Lenny&apos;s Podcast transcripts. Grounded citations, Ship 30 for 30 essays, and interactive Claude-style artifacts.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-2xl mx-auto text-left">
              {QUICK_PROMPTS.map((qp, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onChangeMode(qp.mode);
                    onSendMessage(qp.prompt);
                  }}
                  className="p-3 bg-white hover:bg-brand-50/40 border border-slate-200 hover:border-brand-200 rounded-xl transition-all text-xs group shadow-2xs"
                >
                  <div className="font-semibold text-slate-700 group-hover:text-brand-700 flex items-center justify-between mb-1">
                    <span>{qp.label}</span>
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                      {qp.mode === "ship30" ? "Ship 30" : "QA"}
                    </span>
                  </div>
                  <p className="text-slate-500 line-clamp-2">{qp.prompt}</p>
                </button>
              ))}
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
          <div className="flex gap-3.5 justify-start mb-6">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="max-w-[85%]">
              {streamStatus && (
                <div className="flex items-center gap-2 text-xs text-brand-700 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-lg mb-2 font-medium w-fit animate-pulse">
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

      {/* Bottom Fixed Prompt Bar */}
      <div className="p-4 bg-white border-t border-slate-200 shrink-0">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                currentMode === "ship30"
                  ? "Enter a topic for a Ship 30 for 30 essay (e.g. Elena Verna on B2B product-led growth)..."
                  : "Ask a product or growth question grounded in Lenny's podcast archive..."
              }
              className="w-full pl-4 pr-24 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white resize-none shadow-2xs placeholder:text-slate-400"
            />
            <div className="absolute right-2 flex items-center gap-1">
              <button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className="p-2 rounded-lg bg-brand-600 text-white disabled:opacity-40 hover:bg-brand-700 transition-colors shadow-xs"
                title="Send message (Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
            <span>
              Mode: <strong className="text-slate-600 uppercase font-mono">{currentMode}</strong> &bull; Press <strong>Enter</strong> to send, <strong>Shift+Enter</strong> for newline
            </span>
            <span>Grounded strictly on Lenny&apos;s Podcast transcripts</span>
          </div>
        </div>
      </div>
    </div>
  );
}
