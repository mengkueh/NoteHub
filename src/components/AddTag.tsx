"use client";

import { useState } from "react";
import mainStyles from "@/app/TeamNoteTakingApp/home/main.module.css";

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
    <div className={mainStyles.modalOverlay}>
      <div
        className={mainStyles.modalCard}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-tag-title"
      >
        <h3 id="add-tag-title" className={mainStyles.modalTitle}>
          Create a new tag
        </h3>
        <form onSubmit={handleCreate}>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tag name"
            className={mainStyles.modalInput}
          />

          {error ? <div className={mainStyles.modalError}>{error}</div> : null}

          <div className={mainStyles.modalActions}>
            <button
              type="button"
              className={mainStyles.button}
              onClick={() => {
                setName("");
                setError(null);
                onClose();
              }}
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${mainStyles.button} ${mainStyles.buttonPrimary}`}
              disabled={creating}
            >
              {creating ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
