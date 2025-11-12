"use client";

import { useState } from "react";

type Props = {
  noteId: number;
  onClose?: () => void;
  onSent?: () => void;
};

export default function InviteModal({ noteId, onClose, onSent }: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!email.trim()) return alert("Please enter an email.");
    setSending(true);
    try {
      const res = await fetch(`/api/notes/${noteId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: "Unknown" }));
        alert(e.error || "Failed to send invite");
      } else {
        alert("Invite sent!");
        setEmail("");
        if (onSent) onSent();
        if (onClose) onClose();
      }
    } catch (err) {
      console.error("invite send error:", err);
      alert("Network error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.4)", zIndex: 9999
    }}>
      <div style={{ width: 420, padding: 16, borderRadius: 8, background: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
        <h3 style={{ margin: 0 }}>Invite Member</h3>
        <p style={{ marginTop: 8, marginBottom: 12 }}>Enter the email of the person you want to invite.</p>

        <input
          type="email"
          placeholder="invitee@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: 8, marginBottom: 8 }}
        />

        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <label>
            <input type="radio" checked={role === "editor"} onChange={() => setRole("editor")} /> Editor
          </label>
          <label>
            <input type="radio" checked={role === "viewer"} onChange={() => setRole("viewer")} /> Viewer
          </label>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" onClick={() => onClose?.()} disabled={sending}>Cancel</button>
          <button type="button" onClick={handleSend} disabled={sending}>
            {sending ? "Sending…" : "Send Invite"}
          </button>
        </div>
      </div>
    </div>
  );
}
