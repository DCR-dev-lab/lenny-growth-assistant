"use client";

import React, { useState } from "react";
import { Cpu, Cloud, ChevronDown, CheckCircle2, AlertCircle } from "lucide-react";

const PROVIDERS = [
  {
    id: "ollama",
    name: "Ollama (Local LLM)",
    description: "llama3.2:3b / llama3.1:8b (Evaluator mandatory)",
    icon: Cpu,
  },
  {
    id: "claude",
    name: "Anthropic Claude",
    description: "claude-3-5-sonnet-20241022",
    icon: Cloud,
  },
  {
    id: "openai",
    name: "OpenAI GPT-4o",
    description: "gpt-4o cloud model",
    icon: Cloud,
  },
  {
    id: "mock",
    name: "Resilient Demo Mode",
    description: "Offline high-fidelity demo with fallback",
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
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 shadow-sm transition-colors"
      >
        <Icon className="w-3.5 h-3.5 text-brand-600" />
        <span className="font-semibold text-slate-800">{selected.name}</span>
        
        {/* Status dot */}
        {selected.id === "ollama" && (
          <span
            className={`w-2 h-2 rounded-full ${
              isOllamaOnline ? "bg-emerald-500" : "bg-amber-500"
            }`}
            title={isOllamaOnline ? "Ollama daemon connected" : "Ollama offline (will use resilient fallback)"}
          />
        )}
        <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 divide-y divide-slate-100">
            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Runtime Model Provider
            </div>
            <div className="py-1">
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
                    className={`w-full px-3 py-2 text-left flex items-start gap-2.5 hover:bg-slate-50 transition-colors ${
                      isSelected ? "bg-brand-50/50" : ""
                    }`}
                  >
                    <PIcon className={`w-4 h-4 mt-0.5 ${isSelected ? "text-brand-600" : "text-slate-400"}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${isSelected ? "text-brand-700" : "text-slate-800"}`}>
                          {p.name}
                        </span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{p.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
