// src/components/EditMembers.tsx
"use client";

import React, { useState } from "react";

type Access = {
  id: number;
  role: "viewer" | "editor";
  user: { id: string; email: string; displayName?: string | null };
};

export default function EditMembers({
  open,
  onClose,
  noteId,
  ownerEmail,
  accesses,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  noteId: string | number;
  ownerEmail?: string;
  accesses: Access[]; // includes all accesses (including owner maybe) — component will ignore owner for edits
  onDone?: () => void; // called after success so parent can refresh
}) {
  const [localAccesses, setLocalAccesses] = useState<Access[]>(accesses ?? []);
  const [busyFor, setBusyFor] = useState<string | null>(null); // userId busy
  React.useEffect(() => setLocalAccesses(accesses ?? []), [accesses]);

  if (!open) return null;

  async function changeRole(userId: string, newRole: "viewer" | "editor") {
    if (!confirm(`Change role of ${userId} → ${newRole}?`)) return;
    setBusyFor(userId);
    try {
      const res = await fetch(`/api/notes/${noteId}/accesses`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: "Unknown" }));
        alert(e.error || "Failed to change role");
        return;
      }
      // optimistic update
      setLocalAccesses((prev) => prev.map((a) => (a.user.id === userId ? { ...a, role: newRole } : a)));
      onDone?.();
    } catch (err) {
      console.error("changeRole err:", err);
      alert("Network error");
    } finally {
      setBusyFor(null);
    }
  }

  async function removeMember(userId: string) {
    if (!confirm(`Remove ${userId} from this note?`)) return;
    setBusyFor(userId);
    try {
      const res = await fetch(`/api/notes/${noteId}/accesses`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: "Unknown" }));
        alert(e.error || "Failed to remove member");
        return;
      }
      // optimistic remove
      setLocalAccesses((prev) => prev.filter((a) => a.user.id !== userId));
      onDone?.();
    } catch (err) {
      console.error("removeMember err:", err);
      alert("Network error");
    } finally {
      setBusyFor(null);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 9999
    }}>
      <div style={{ width: 720, maxWidth: "95%", background: "#fff", borderRadius: 8, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Edit members</h3>
          <div>
            <button onClick={onClose} style={{ padding: "6px 10px" }}>Close</button>
          </div>
        </div>

        <div style={{ marginBottom: 8 }}>
          <strong>Owner</strong>
          <div style={{ padding: "8px 6px", background: "#f5f5f5", borderRadius: 6 }}>
            {ownerEmail ?? "Unknown"}
          </div>
        </div>

        <div>
          <strong>Collaborators</strong>
          {localAccesses.length === 0 ? (
            <div style={{ marginTop: 8 }}>No collaborators</div>
          ) : (
            <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
              {localAccesses.map((a) => {
                // skip owner entry if present
                const email = a.user?.email ?? a.user?.id;
                if (email === ownerEmail) return null;
                return (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{a.user.displayName ?? email}</div>
                      <div style={{ fontSize: 12, color: "#555" }}>{email}</div>
                    </div>

                    <div>
                      <select
                        value={a.role}
                        disabled={busyFor !== null}
                        onChange={(e) => changeRole(a.user.id, e.target.value as "viewer" | "editor")}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                      </select>
                    </div>

                    <div>
                      <button
                        onClick={() => removeMember(a.user.id)}
                        disabled={busyFor !== null}
                        style={{ color: "#fff", background: "#ff6b6b", border: "none", padding: "6px 10px", borderRadius: 6 }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ marginTop: 16, textAlign: "right" }}>
          <button onClick={onClose} style={{ padding: "6px 10px" }}>Done</button>
        </div>
      </div>
    </div>
  );
}
