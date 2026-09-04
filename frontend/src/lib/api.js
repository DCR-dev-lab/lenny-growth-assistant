const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchSessions() {
  const res = await fetch(`${API_BASE}/api/sessions`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch sessions");
  return res.json();
}

export async function createSession(title = "New Conversation") {
  const res = await fetch(`${API_BASE}/api/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to create session");
  return res.json();
}

export async function fetchSession(sessionId) {
  const res = await fetch(`${API_BASE}/api/sessions/${sessionId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch session detail");
  return res.json();
}

export async function deleteSession(sessionId) {
  const res = await fetch(`${API_BASE}/api/sessions/${sessionId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete session");
  return true;
}

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/api/health`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch health probe");
  return res.json();
}
