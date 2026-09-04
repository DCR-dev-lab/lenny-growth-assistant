"use client";

import { useState, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function useChatStream({ onMessageComplete, onArtifactReceived }) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamStatus, setStreamStatus] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [currentSources, setCurrentSources] = useState([]);

  const sendMessage = useCallback(
    async ({ sessionId, message, mode = "default", provider = "ollama" }) => {
      if (!sessionId || !message.trim()) return;

      setIsStreaming(true);
      setStreamStatus("Connecting...");
      setStreamingText("");
      setCurrentSources([]);

      try {
        const response = await fetch(`${API_BASE}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            message: message.trim(),
            mode,
            provider,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let accumulated = "";
        let sourcesAcc = [];
        let artifactsAcc = [];

        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const block of lines) {
            const trimmed = block.trim();
            if (!trimmed.startsWith("data: ")) continue;

            const rawData = trimmed.slice(6).trim();
            if (rawData === "[DONE]") {
              setIsStreaming(false);
              setStreamStatus("");
              break;
            }

            try {
              const parsed = JSON.parse(rawData);
              if (parsed.type === "status") {
                setStreamStatus(parsed.content);
              } else if (parsed.type === "sources") {
                sourcesAcc = parsed.content;
                setCurrentSources(parsed.content);
              } else if (parsed.type === "token") {
                accumulated += parsed.content;
                setStreamingText(accumulated);
              } else if (parsed.type === "artifact") {
                artifactsAcc.push(parsed.content);
                if (onArtifactReceived) {
                  onArtifactReceived(parsed.content);
                }
              }
            } catch (err) {
              console.warn("Error parsing SSE payload:", err, rawData);
            }
          }
        }

        if (onMessageComplete) {
          onMessageComplete({
            role: "assistant",
            content: accumulated,
            sources: sourcesAcc,
            artifacts: artifactsAcc,
          });
        }
      } catch (err) {
        console.error("Stream error:", err);
        setStreamingText((prev) => prev + `\n\n[Connection Error: ${err.message}]`);
      } finally {
        setIsStreaming(false);
        setStreamStatus("");
      }
    },
    [onMessageComplete, onArtifactReceived]
  );

  return {
    sendMessage,
    isStreaming,
    streamStatus,
    streamingText,
    currentSources,
  };
}
