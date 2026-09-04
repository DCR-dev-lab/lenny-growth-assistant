"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { User, Sparkles, Layout, ChevronDown, ChevronUp, Quote } from "lucide-react";

export default function MessageItem({ message, onOpenArtifact }) {
  const isUser = message.role === "user";
  const [showSources, setShowSources] = useState(false);

  // Clean artifact tags from conversational bubble text
  const cleanContent = (message.content || "").replace(
    /<artifact\s+type=["'][^"']+["']\s+title=["']([^"']+)["']>[\s\S]*?<\/artifact>/gi,
    ""
  ).trim();

  const artifacts = message.artifacts || [];
  const sources = message.sources || [];

  return (
    <div className={`flex gap-3.5 ${isUser ? "justify-end" : "justify-start"} mb-6`}>
      {/* Assistant Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
      )}

      {/* Message Bubble Container */}
      <div className={`max-w-[85%] ${isUser ? "order-1" : "order-2"}`}>
        <div
          className={`px-4 py-3.5 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "bg-brand-600 text-white shadow-sm rounded-br-none"
              : "bg-white text-slate-800 border border-slate-200 shadow-sm rounded-bl-none"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-slate prose-sm max-w-none prose-p:my-1.5 prose-headings:font-bold prose-headings:text-slate-900 prose-ul:my-1.5 prose-li:my-0.5">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {cleanContent || message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Artifact Trigger Cards */}
        {artifacts.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {artifacts.map((art, idx) => (
              <button
                key={art.id || idx}
                type="button"
                onClick={() => onOpenArtifact(art)}
                className="flex items-center gap-2 px-3 py-2 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-xl text-xs font-semibold text-brand-800 shadow-sm transition-all hover:shadow"
              >
                <Layout className="w-4 h-4 text-brand-600" />
                <span>View Artifact: {art.title || "Interactive Component"}</span>
                <span className="text-[10px] bg-brand-200/60 text-brand-800 px-1.5 py-0.5 rounded uppercase">
                  {art.artifact_type || art.type}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Grounding Source Citations Accordion */}
        {sources.length > 0 && (
          <div className="mt-2 text-xs">
            <button
              type="button"
              onClick={() => setShowSources(!showSources)}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-medium py-1 transition-colors"
            >
              <Quote className="w-3.5 h-3.5 text-brand-600" />
              <span>{sources.length} Grounded Transcript Sources</span>
              {showSources ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showSources && (
              <div className="mt-1.5 space-y-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
                {sources.map((src, i) => (
                  <div key={i} className="text-[11px] border-b border-slate-200/60 pb-2 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between text-slate-700 font-semibold mb-0.5">
                      <span>{src.guest || "Guest"} ({src.timestamp || "00:00:00"})</span>
                      {src.score && (
                        <span className="text-slate-400 font-mono text-[10px]">
                          relevance: {Math.round(src.score * 100)}%
                        </span>
                      )}
                    </div>
                    <div className="text-slate-500 italic truncate text-[11px]">
                      {src.episode}
                    </div>
                    {src.snippet && (
                      <p className="text-slate-600 mt-1 line-clamp-2 bg-white p-1.5 rounded border border-slate-100">
                        &ldquo;{src.snippet}&rdquo;
                      </p>
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
        <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-700 shrink-0 shadow-sm mt-0.5">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
