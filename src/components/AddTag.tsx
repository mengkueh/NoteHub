"use client";

import { useState } from "react";

type Tag = { id: number; name: string };

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (tag: Tag) => void;
};

export default function AddTag({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleCreate(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter a tag name.");
      return;
    }
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, noteIds: [] }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error || "Failed to create tag");
        return;
      }
      const created = await res.json();
      // created is expected to be the Tag object (with id & name)
      onCreated(created);
      setName("");
      onClose();
    } catch (err) {
      console.error("add tag error:", err);
      setError("Network error");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div style={overlayStyle}>
      <div style={modalStyle} role="dialog" aria-modal="true" aria-labelledby="add-tag-title">
        <h3 id="add-tag-title" style={{ margin: 0, marginBottom: 8 }}>Create a new tag</h3>
        <form onSubmit={handleCreate}>
          <div style={{ marginBottom: 8 }}>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tag name"
              style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1px solid #ccc" }}
            />
          </div>

          {error ? <div style={{ color: "crimson", marginBottom: 8 }}>{error}</div> : null}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
              type="button"
              onClick={() => { setName(""); setError(null); onClose(); }}
              style={buttonStyle}
              disabled={creating}
            >
              Cancel
            </button>
            <button type="submit" style={{ ...buttonStyle, background: "#2563eb", color: "white" }} disabled={creating}>
              {creating ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* Inline minimal styles so you can drop it in easily */
const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1200,
};

const modalStyle: React.CSSProperties = {
  width: 380,
  maxWidth: "90%",
  background: "white",
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 6px 24px rgba(0,0,0,0.15)",
};

const buttonStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #ddd",
  background: "white",
  cursor: "pointer",
};
