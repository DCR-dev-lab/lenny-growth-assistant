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
        handleOpenArtifact(allArtifacts[allArtifacts.length - 1]);
      }
    } catch (err) {
      console.error("Failed to fetch session detail:", err);
    }
  };

  const handleOpenArtifact = (art) => {
    setActiveArtifact(art);
    // When viewing canvas side-by-side on typical desktop/laptop screens,
    // auto-collapse sidebar so Chat and Canvas have comfortable room
    if (typeof window !== "undefined" && window.innerWidth < 1360) {
      setSidebarOpen(false);
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
      handleOpenArtifact(art);
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
        {/* Brand Header */}
        <div className="p-3.5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-brand-700 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
              L
            </div>
            <div>
              <span className="font-bold text-xs text-slate-900 tracking-tight block leading-none">Lenny Assistant</span>
              <span className="text-[10px] text-brand-600 font-medium">Forward Deployed v1.0</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={handleNewSession}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer hover:shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Conversation</span>
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Conversations
          </div>
          {sessions.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-slate-400">
              No conversations yet.
            </div>
          ) : (
            sessions.map((s) => {
              const isSelected = s.id === currentSessionId;
              return (
                <div
                  key={s.id}
                  onClick={() => selectSession(s.id)}
                  className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-all ${
                    isSelected
                      ? "bg-brand-50 text-brand-900 font-bold shadow-2xs border border-brand-200/70"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate min-w-0 pr-1">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-brand-600" : "text-slate-400"}`} />
                    <span className="truncate">{s.title || "New Conversation"}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(e, s.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded-md transition-opacity"
                    title="Delete chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Ingestion & DB Status footer */}
        <div className="p-3 border-t border-slate-200 text-[11px] text-slate-500 bg-slate-50/70 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 live-pulse-dot" />
              <span>pgvector Archive</span>
            </span>
            <span className="font-mono text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded">
              {healthData?.pgvector?.chunk_count || 293} chunks
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>PostgreSQL 16</span>
            <span>BGE 384d</span>
          </div>
        </div>
      </div>

      {/* Main Center Area: Chat Pane */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
        <ChatPane
          messages={messages}
          isStreaming={isStreaming}
          streamingText={streamingText}
          streamStatus={streamStatus}
          currentSources={currentSources}
          onSendMessage={handleSendMessage}
          onOpenArtifact={handleOpenArtifact}
          currentProvider={currentProvider}
          onSelectProvider={setCurrentProvider}
          healthData={healthData}
          currentMode={currentMode}
          onChangeMode={setCurrentMode}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          isArtifactOpen={!!activeArtifact}
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
