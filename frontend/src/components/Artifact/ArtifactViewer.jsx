"use client";

import React, { useState } from "react";
import { X, Copy, Check, Maximize2, Minimize2, Code, Eye } from "lucide-react";
import SandboxedIframe from "./SandboxedIframe";
import MarkdownArtifact from "./MarkdownArtifact";

export default function ArtifactViewer({ artifact, onClose }) {
  const [activeTab, setActiveTab] = useState("preview"); // 'preview' | 'code'
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!artifact) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(artifact.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const isHtml = (artifact.type || artifact.artifact_type) === "html";

  return (
    <aside
      aria-label="Artifact preview viewer"
      className={`flex flex-col bg-slate-100 border-l border-slate-200 transition-all duration-200 ${
        isFullscreen
          ? "fixed inset-0 z-50 w-full h-full"
          : "w-full md:w-[48%] lg:w-[45%] h-full relative"
      }`}
    >
      {/* Top Action Bar */}
      <div className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded bg-brand-100 text-brand-700 border border-brand-200">
            {isHtml ? "HTML Widget" : "Markdown"}
          </span>
          <h2 className="text-sm font-semibold text-slate-800 truncate max-w-[240px]">
            {artifact.title || "Generated Artifact"}
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Tab Switcher for HTML artifacts */}
          {isHtml && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 mr-2 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeTab === "preview"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Preview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("code")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeTab === "code"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                Code
              </button>
            </div>
          )}

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
            title="Copy content"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
            title="Close viewer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden p-3">
        {isHtml ? (
          activeTab === "preview" ? (
            <SandboxedIframe content={artifact.content} title={artifact.title} />
          ) : (
            <div className="h-full bg-slate-900 text-slate-100 p-4 rounded-lg overflow-auto font-mono text-xs leading-relaxed">
              <pre><code>{artifact.content}</code></pre>
            </div>
          )
        ) : (
          <div className="h-full bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            <MarkdownArtifact content={artifact.content} />
          </div>
        )}
      </div>
    </aside>
  );
}
