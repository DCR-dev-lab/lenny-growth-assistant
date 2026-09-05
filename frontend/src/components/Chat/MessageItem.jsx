"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { User, Sparkles, Layout, ChevronDown, ChevronUp, Quote, Copy, Check, ExternalLink, FileText } from "lucide-react";

export default function MessageItem({ message, onOpenArtifact }) {
  const isUser = message.role === "user";
  const [showSources, setShowSources] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedSnippetIdx, setCopiedSnippetIdx] = useState(null);

  // Clean artifact tags from conversational bubble text
  const cleanContent = (message.content || "").replace(
    /<artifact\s+type=["'][^"']+["']\s+title=["']([^"']+)["']>[\s\S]*?<\/artifact>/gi,
    ""
  ).trim();

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(cleanContent || message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleCopySnippet = async (snippet, idx) => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopiedSnippetIdx(idx);
      setTimeout(() => setCopiedSnippetIdx(null), 2000);
    } catch (err) {
      console.error("Failed to copy snippet:", err);
    }
  };

  const artifacts = message.artifacts || [];
  const sources = message.sources || [];

  // Detect if this message contains a Ship 30 for 30 formatted essay
  const isShip30Essay = !isUser && (
    cleanContent.includes("The Hidden Levers") ||
    cleanContent.includes("The 7-Day Operational Checklist") ||
    cleanContent.includes("Ship 30") ||
    (cleanContent.startsWith("# ") && cleanContent.includes("---"))
  );

  return (
    <div className={`group flex gap-3.5 ${isUser ? "justify-end" : "justify-start"} mb-6`}>
      {/* Assistant Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-700 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
      )}

      {/* Message Bubble Container */}
      <div className={`max-w-[85%] relative ${isUser ? "order-1" : "order-2"}`}>
        {/* Assistant Header & Actions */}
        {!isUser && (
          <div className="flex items-center justify-between px-1 mb-1.5 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600">Lenny Assistant</span>
              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-mono">
                Grounded RAG
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyMessage}
              className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-slate-400 hover:text-slate-700 px-1.5 py-0.5 rounded hover:bg-slate-200/60"
              title="Copy answer"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-600 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Ship 30 Header Badge if detected */}
        {isShip30Essay && (
          <div className="mb-2 flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-200/80 rounded-xl text-xs text-brand-900 font-semibold shadow-2xs">
            <FileText className="w-4 h-4 text-brand-600" />
            <span>Ship 30 for 30 Essay Framework</span>
            <span className="text-[10px] font-mono text-brand-600 bg-white/80 px-2 py-0.5 rounded-md border border-brand-200/60 ml-auto">
              ~1,250 Words • High Retention
            </span>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`px-5 py-4 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "bg-brand-600 text-white shadow-sm rounded-tr-xs"
              : "bg-white text-slate-800 border border-slate-200/90 shadow-2xs rounded-tl-xs"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-slate prose-sm max-w-none prose-p:my-2 prose-headings:font-bold prose-headings:text-slate-900 prose-ul:my-2 prose-li:my-0.5 prose-strong:text-slate-900 prose-strong:font-bold">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {cleanContent || message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Artifact Trigger Cards */}
        {artifacts.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2.5">
            {artifacts.map((art, idx) => (
              <button
                key={art.id || idx}
                type="button"
                onClick={() => onOpenArtifact(art)}
                className="group/art flex items-center gap-2.5 px-3.5 py-2.5 bg-gradient-to-r from-brand-50/80 to-purple-50/80 hover:from-brand-100/90 hover:to-purple-100/90 border border-brand-200 rounded-xl text-xs font-semibold text-brand-900 shadow-2xs transition-all hover:shadow-xs cursor-pointer"
              >
                <div className="w-6 h-6 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-xs group-hover/art:scale-105 transition-transform">
                  <Layout className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800">{art.title || "Interactive Component"}</span>
                    <span className="text-[10px] bg-brand-200/70 text-brand-800 px-1.5 py-0.2 rounded font-mono uppercase">
                      {art.artifact_type || art.type}
                    </span>
                  </div>
                  <span className="text-[11px] text-brand-600 font-normal">Click to render in Claude-style Canvas &rarr;</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Grounding Source Citations Accordion */}
        {sources.length > 0 && (
          <div className="mt-2.5 text-xs">
            <button
              type="button"
              onClick={() => setShowSources(!showSources)}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-semibold py-1 transition-colors group/src"
            >
              <Quote className="w-3.5 h-3.5 text-brand-600 group-hover/src:rotate-12 transition-transform" />
              <span>{sources.length} Grounded Transcript Citations</span>
              {showSources ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showSources && (
              <div className="mt-2 space-y-2.5 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 shadow-inner">
                {sources.map((src, i) => (
                  <div key={i} className="text-[11px] border-b border-slate-200/70 pb-2.5 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between text-slate-800 font-bold mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-600" />
                        <span>{src.guest || "Guest"}</span>
                        <span className="font-mono text-[10px] text-slate-400 font-normal">({src.timestamp || "00:00:00"})</span>
                      </div>
                      {src.score && (
                        <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold ${
                          src.score >= 0.75
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-blue-100 text-blue-800 border border-blue-200"
                        }`}>
                          {Math.round(src.score * 100)}% match
                        </span>
                      )}
                    </div>
                    <div className="text-slate-500 italic truncate text-[11px] mb-1">
                      {src.episode}
                    </div>
                    {src.snippet && (
                      <div className="relative group/snip">
                        <p className="text-slate-600 bg-white p-2 rounded-lg border border-slate-200/80 leading-relaxed font-sans">
                          &ldquo;{src.snippet}&rdquo;
                        </p>
                        <button
                          type="button"
                          onClick={() => handleCopySnippet(src.snippet, i)}
                          className="absolute right-2 top-2 opacity-0 group-hover/snip:opacity-100 p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-opacity"
                          title="Copy quote"
                        >
                          {copiedSnippetIdx === i ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-slate-300 flex items-center justify-center text-slate-700 shrink-0 shadow-sm mt-0.5">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
