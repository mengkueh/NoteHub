// src/components/ShareByEmail.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";

export default function ShareByEmail({
  noteId,
  onDone,
}: {
  noteId: string;
  onDone?: (accesses: any[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [loading, setLoading] = useState(false);

  async function handleShare() {
    if (!email.trim()) return alert("Please enter an email.");
    setLoading(true);
    try {
      const res = await fetch(`/api/notes/${noteId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), role }),
      });
      const data = await res.json().catch(() => ({ error: "Invalid response" }));
      if (!res.ok) {
        alert(data?.error || "Failed to share");
      } else {
        alert("Access granted.");
        setEmail("");
        setOpen(false);
        if (onDone) onDone(data.accesses ?? []);
      }
    } catch (err) {
      console.error("share error:", err);
      alert("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ padding: "6px 10px", borderRadius: 6 }}>
        Invite
      </button>

      {open && (
        <div style={{
          position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.4)", zIndex: 9999
        }}>
          <div style={{ width: 420, padding: 16, borderRadius: 8, background: "#fff" }}>
            <h3 style={{ margin: 0 }}>Invite user by email</h3>
            <p style={{ marginTop: 8 }}>Enter the email of the user (must be registered).</p>

            <input
              type="email"
              placeholder="invitee@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", padding: 8, marginBottom: 8 }}
            />

            <div style={{ marginBottom: 12 }}>
              <label style={{ marginRight: 8 }}>
                <input type="radio" checked={role === "editor"} onChange={() => setRole("editor")} /> Editor
              </label>
              <label>
                <input type="radio" checked={role === "viewer"} onChange={() => setRole("viewer")} /> Viewer
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setOpen(false)} disabled={loading}>Cancel</button>
              <button onClick={handleShare} disabled={loading}>
                {loading ? "Sharing..." : "Share"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
