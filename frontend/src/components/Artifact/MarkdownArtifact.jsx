"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownArtifact({ content }) {
  return (
    <div className="h-full overflow-y-auto p-6 bg-white text-slate-800 leading-relaxed">
      <div className="prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:my-2 prose-ul:my-2 prose-li:my-0.5">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
