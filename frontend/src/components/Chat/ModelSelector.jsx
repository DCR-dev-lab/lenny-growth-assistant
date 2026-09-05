"use client";

import React, { useState } from "react";
import { Cpu, Cloud, ChevronDown, CheckCircle2, AlertCircle } from "lucide-react";

const PROVIDERS = [
  {
    id: "ollama",
    name: "Ollama (Local LLM)",
    tag: "Local Inference",
    tagColor: "bg-purple-100 text-purple-700 border-purple-200",
    description: "llama3.2:3b • Evaluator mandatory • Zero data egress",
    icon: Cpu,
  },
  {
    id: "claude",
    name: "Anthropic Claude",
    tag: "Cloud API",
    tagColor: "bg-amber-100 text-amber-700 border-amber-200",
    description: "claude-3-5-sonnet-20241022 • High reasoning power",
    icon: Cloud,
  },
  {
    id: "openai",
    name: "OpenAI GPT-4o",
    tag: "Cloud API",
    tagColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    description: "gpt-4o • Enterprise multimodal model",
    icon: Cloud,
  },
  {
    id: "mock",
    name: "Resilient Demo Mode",
    tag: "Offline Fallback",
    tagColor: "bg-blue-100 text-blue-700 border-blue-200",
    description: "High-fidelity mock generator with grounded sources & artifacts",
    icon: Cpu,
  },
];

export default function ModelSelector({ currentProvider, onSelectProvider, healthData }) {
  const [isOpen, setIsOpen] = useState(false);

  const selected = PROVIDERS.find((p) => p.id === currentProvider) || PROVIDERS[0];
  const Icon = selected.icon;

  const isOllamaOnline = healthData?.llm_providers?.ollama?.available;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/80 text-xs font-medium text-slate-700 shadow-2xs hover:border-slate-300 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        title="Switch LLM runtime provider"
      >
        <div className="w-5 h-5 rounded-md bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
          <Icon className="w-3 h-3" />
        </div>
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-800 tracking-tight">{selected.name}</span>
            {selected.id === "ollama" && (
              <span
                className={`w-2 h-2 rounded-full ${
                  isOllamaOnline ? "bg-emerald-500 live-pulse-dot" : "bg-amber-500"
                }`}
                title={isOllamaOnline ? "Ollama running & connected" : "Ollama offline (mock fallback active)"}
              />
            )}
          </div>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-40 divide-y divide-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3.5 py-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Runtime LLM Provider
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                Zero-Code Toggle
              </span>
            </div>
            <div className="py-1.5 px-1.5 space-y-1">
              {PROVIDERS.map((p) => {
                const PIcon = p.icon;
                const isSelected = p.id === currentProvider;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectProvider(p.id);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl text-left flex items-start gap-3 transition-all ${
                      isSelected
                        ? "bg-brand-50 border border-brand-200 shadow-2xs"
                        : "hover:bg-slate-50 border border-transparent"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500"
                    }`}>
                      <PIcon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-bold truncate ${isSelected ? "text-brand-900" : "text-slate-800"}`}>
                          {p.name}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono shrink-0 ${p.tagColor}`}>
                          {p.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">{p.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="px-3 py-2 bg-slate-50/70 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Selected for evaluation demo</span>
              <strong className="font-mono text-slate-700">{selected.id}</strong>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
