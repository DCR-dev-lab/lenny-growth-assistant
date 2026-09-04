"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, MessageSquare, Trash2, PanelLeftClose, PanelLeft, Sparkles, Activity } from "lucide-react";
import ChatPane from "../components/Chat/ChatPane";
import ArtifactViewer from "../components/Artifact/ArtifactViewer";
import { useChatStream } from "../hooks/useChatStream";
import { fetchSessions, createSession, fetchSession, deleteSession, fetchHealth } from "../lib/api";

export default function Home() {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activeArtifact, setActiveArtifact] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentProvider, setCurrentProvider] = useState("ollama");
  const [currentMode, setCurrentMode] = useState("default");
  const [healthData, setHealthData] = useState(null);

  // Poll / check health probe on mount
  useEffect(() => {
    fetchHealth()
      .then((data) => {
        setHealthData(data);
        if (data.llm_providers?.default) {
          setCurrentProvider(data.llm_providers.default);
        }
      })
      .catch((err) => console.warn("Backend not yet connected or starting:", err));
  }, []);

  // Load existing sessions on mount
  const loadSessions = useCallback(async () => {
    try {
      const data = await fetchSessions();
      setSessions(data);
      if (data.length > 0 && !currentSessionId) {
        selectSession(data[0].id);
      } else if (data.length === 0) {
        handleNewSession();
      }
    } catch (err) {
      console.warn("Could not load sessions:", err);
    }
  }, [currentSessionId]);

  useEffect(() => {
    loadSessions();
  }, []);

  const selectSession = async (sessionId) => {
    setCurrentSessionId(sessionId);
    try {
      const detail = await fetchSession(sessionId);
      setMessages(detail.messages || []);
      // If there are artifacts in the conversation, preview the latest one
      const allArtifacts = [];
      detail.messages.forEach((m) => {
        if (m.artifacts && m.artifacts.length > 0) {
          allArtifacts.push(...m.artifacts);
        }
      });
      if (allArtifacts.length > 0) {
        setActiveArtifact(allArtifacts[allArtifacts.length - 1]);
      }
    } catch (err) {
      console.error("Failed to fetch session detail:", err);
    }
  };

  const handleNewSession = async () => {
    try {
      const newSess = await createSession("New Conversation");
      setSessions((prev) => [newSess, ...prev]);
      setCurrentSessionId(newSess.id);
      setMessages([]);
      setActiveArtifact(null);
    } catch (err) {
      console.error("Failed to create new session:", err);
    }
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    try {
      await deleteSession(sessionId);
      const remaining = sessions.filter((s) => s.id !== sessionId);
      setSessions(remaining);
      if (currentSessionId === sessionId) {
        if (remaining.length > 0) {
          selectSession(remaining[0].id);
        } else {
          handleNewSession();
        }
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  // Chat Streaming Hook
  const { sendMessage, isStreaming, streamingText, streamStatus, currentSources } = useChatStream({
    onMessageComplete: (completedMsg) => {
      setMessages((prev) => [...prev, completedMsg]);
      loadSessions(); // refresh session titles
    },
    onArtifactReceived: (art) => {
      setActiveArtifact(art);
    },
  });

  const handleSendMessage = async (text) => {
    if (!currentSessionId) {
      const newSess = await createSession(text.slice(0, 30));
      setCurrentSessionId(newSess.id);
      setSessions((prev) => [newSess, ...prev]);
      setMessages([{ role: "user", content: text }]);
      sendMessage({
        sessionId: newSess.id,
        message: text,
        mode: currentMode,
        provider: currentProvider,
      });
      return;
    }

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    sendMessage({
      sessionId: currentSessionId,
      message: text,
      mode: currentMode,
      provider: currentProvider,
    });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100">
      {/* Collapsible Session Navigation Drawer */}
      <div
        className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-200 z-20 shrink-0 ${
          sidebarOpen ? "w-64" : "w-0 border-r-0 overflow-hidden"
        }`}
      >
        <div className="p-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-brand-600 flex items-center justify-center text-white font-bold text-xs">
              L
            </div>
            <span className="font-bold text-xs text-slate-800 tracking-tight">Lenny Assistant</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3">
          <button
            onClick={handleNewSession}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Conversations
          </div>
          {sessions.map((s) => {
            const isSelected = s.id === currentSessionId;
            return (
              <div
                key={s.id}
                onClick={() => selectSession(s.id)}
                className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-brand-50 text-brand-900 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-brand-600" : "text-slate-400"}`} />
                  <span className="truncate">{s.title || "New Conversation"}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteSession(e, s.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition-opacity"
                  title="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Ingestion & DB Status footer */}
        <div className="p-3 border-t border-slate-200 text-[11px] text-slate-500 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Vector Knowledge</span>
            </span>
            <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded">
              {healthData?.pgvector?.chunk_count || "8 Episodes"}
            </span>
          </div>
        </div>
      </div>

      {/* Reopen Sidebar Toggle when collapsed */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="absolute left-3 top-3 z-30 p-2 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
          title="Open sidebar"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
      )}

      {/* Main Center Area: Chat Pane */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <ChatPane
          messages={messages}
          isStreaming={isStreaming}
          streamingText={streamingText}
          streamStatus={streamStatus}
          currentSources={currentSources}
          onSendMessage={handleSendMessage}
          onOpenArtifact={(art) => setActiveArtifact(art)}
          currentProvider={currentProvider}
          onSelectProvider={setCurrentProvider}
          healthData={healthData}
          currentMode={currentMode}
          onChangeMode={setCurrentMode}
        />
      </main>

      {/* Right Side: Claude-Style Side-by-Side Artifact Viewer */}
      {activeArtifact && (
        <ArtifactViewer
          artifact={activeArtifact}
          onClose={() => setActiveArtifact(null)}
        />
      )}
    </div>
  );
}
