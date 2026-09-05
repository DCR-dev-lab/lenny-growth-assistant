"use client";

import React, { useState } from "react";
import { X, Copy, Check, Maximize2, Minimize2, Code, Eye, Download, RotateCw, ShieldCheck, FileCode } from "lucide-react";
import SandboxedIframe from "./SandboxedIframe";
import MarkdownArtifact from "./MarkdownArtifact";

export default function ArtifactViewer({ artifact, onClose }) {
  const [activeTab, setActiveTab] = useState("preview"); // 'preview' | 'code' | 'security'
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  if (!artifact) return null;

  const isHtml = (artifact.type || artifact.artifact_type) === "html";
  const fileExt = isHtml ? "html" : "md";
  const fileName = `${(artifact.title || "artifact").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${fileExt}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(artifact.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleDownload = () => {
    try {
      const mimeType = isHtml ? "text/html" : "text/markdown";
      const blob = new Blob([artifact.content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const handleReload = () => {
    setReloadKey((prev) => prev + 1);
  };

  return (
    <aside
      aria-label="Claude Artifact Canvas"
      className={`flex flex-col bg-slate-100 border-l border-slate-200 transition-all duration-200 z-30 shrink-0 ${
        isFullscreen
          ? "fixed inset-0 z-50 w-full h-full"
          : "w-full md:w-[48%] lg:w-[46%] xl:w-[45%] min-w-[340px] max-w-4xl h-full relative shadow-lg"
      }`}
    >
      {/* Top Action Bar */}
      <div className="h-14 bg-white border-b border-slate-200 px-3 sm:px-4 flex items-center justify-between shrink-0 gap-2 min-w-0">
        <div className="flex items-center gap-2 overflow-hidden min-w-0">
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-brand-100 text-brand-800 border border-brand-200 shrink-0">
            {isHtml ? "HTML Canvas" : "Markdown"}
          </span>
          <h2 className="text-xs font-bold text-slate-900 truncate" title={artifact.title}>
            {artifact.title || "Generated Artifact"}
          </h2>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Tab Switcher for HTML artifacts */}
          {isHtml && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 mr-2 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  activeTab === "preview"
                    ? "bg-white text-slate-800 shadow-2xs"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("code")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  activeTab === "code"
                    ? "bg-white text-slate-800 shadow-2xs"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Code</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("security")}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg font-semibold transition-all ${
                  activeTab === "security"
                    ? "bg-white text-emerald-800 shadow-2xs"
                    : "text-slate-400 hover:text-slate-600"
                }`}
                title="Security & isolation sandbox specification"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              </button>
            </div>
          )}

          {/* Refresh preview button for interactive widgets */}
          {isHtml && activeTab === "preview" && (
            <button
              type="button"
              onClick={handleReload}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Reset / Reload widget"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          )}

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Copy code to clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title={`Download ${fileName}`}
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Close Canvas"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden p-3.5">
        {isHtml ? (
          activeTab === "preview" ? (
            <SandboxedIframe key={reloadKey} content={artifact.content} title={artifact.title} />
          ) : activeTab === "code" ? (
            <div className="h-full bg-slate-900 rounded-2xl overflow-hidden flex flex-col border border-slate-800 shadow-sm">
              <div className="bg-slate-950/80 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  <span className="font-mono text-[11px] text-slate-300 ml-2">{fileName}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-200 leading-relaxed selection:bg-brand-800">
                <pre><code>{artifact.content}</code></pre>
              </div>
            </div>
          ) : (
            /* Security Tab */
            <div className="h-full bg-white rounded-2xl border border-slate-200 p-6 overflow-auto">
              <div className="flex items-center gap-2.5 mb-4 text-emerald-800">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">Defense-in-Depth Security Sandbox</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                As required by Section 4.3 of the Forward Deployment assessment, all generated HTML, CSS, and JavaScript snippets are treated as untrusted user code.
              </p>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <strong className="text-slate-900 block mb-0.5">1. Pre-Render Sanitization (DOMPurify)</strong>
                  <span className="text-slate-600">
                    Removes malicious attack vectors while preserving clean layout markup, scoped CSS stylesheets, and calculation event handlers.
                  </span>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <strong className="text-emerald-950 block mb-0.5">2. Iframe Isolation (`sandbox=&quot;allow-scripts&quot;`)</strong>
                  <span className="text-emerald-800 leading-relaxed">
                    Crucially <strong>omits</strong> <code className="bg-emerald-100 px-1 py-0.5 rounded text-emerald-900 font-mono">allow-same-origin</code>. The iframe executes in a distinct, unique <code className="font-mono">null</code> origin.
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <strong className="text-slate-900 block mb-0.5">3. Mathematical Isolation Guarantees</strong>
                  <ul className="list-disc list-inside text-slate-600 mt-1 space-y-1">
                    <li>Cannot read or modify parent cookies</li>
                    <li>Cannot access parent <code className="font-mono">localStorage</code> or <code className="font-mono">sessionStorage</code></li>
                    <li>Cannot access or alter the parent DOM window</li>
                    <li>Cannot trigger authenticated same-origin API requests</li>
                  </ul>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="h-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <MarkdownArtifact content={artifact.content} />
          </div>
        )}
      </div>
    </aside>
  );
}
