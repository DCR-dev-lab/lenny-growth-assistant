"use client";

import React, { useMemo } from "react";
import DOMPurify from "dompurify";
import { ShieldCheck } from "lucide-react";

export default function SandboxedIframe({ content, title = "Artifact Preview" }) {
  // Sanitize markup while preserving styles and scripts for interactive execution
  const cleanHtml = useMemo(() => {
    if (!content) return "";
    return DOMPurify.sanitize(content, {
      WHOLE_DOCUMENT: true,
      ADD_TAGS: ["style", "link", "script"],
      ADD_ATTR: ["target", "oninput", "onclick", "onchange"],
    });
  }, [content]);

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-lg overflow-hidden border border-slate-200 shadow-sm">
      <div className="bg-slate-50 border-b border-slate-200 px-3 py-1.5 flex items-center justify-between text-xs text-slate-500">
        <span className="font-medium text-slate-700 truncate">{title}</span>
        <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>sandbox=&quot;allow-scripts&quot;</span>
        </div>
      </div>
      <iframe
        title={title}
        srcDoc={cleanHtml}
        // Strict security isolation: allows execution of calculator/animation scripts,
        // but omits allow-same-origin to prevent access to parent cookies, localStorage, or DOM.
        sandbox="allow-scripts"
        className="w-full h-full border-none flex-1 bg-white"
      />
    </div>
  );
}
