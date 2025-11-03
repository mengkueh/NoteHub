// src/app/TeamNoteTakingApp/tags/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Tag = { id: number; name: string; notes?: { note: { id: number; title: string } }[] };
type Note = { id: number; title: string; content?: string };

export default function TagsPage() {
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  // modal state
  const [showAdd, setShowAdd] = useState(false);
  const [tagName, setTagName] = useState("");
  const [selectedNoteIds, setSelectedNoteIds] = useState<number[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTags();
    fetchNotes();
  }, []);

  async function fetchTags() {
    try {
      const res = await fetch("/api/tags");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setTags(data || []);
    } catch (err) {
      console.error("fetch tags err:", err);
      setTags([]);
    }
  }

  async function fetchNotes() {
    setLoading(true);
    try {
      const res = await fetch("/api/notes");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setNotes(data || []);
    } catch (err) {
      console.error("fetch notes err:", err);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }

  function toggleNoteSelect(id: number) {
    setSelectedNoteIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function openAdd() {
    setTagName("");
    setSelectedNoteIds([]);
    setShowAdd(true);
  }
  function closeAdd() {
    setShowAdd(false);
    setTagName("");
    setSelectedNoteIds([]);
    setCreating(false);
  }

  async function handleCreateTag() {
    const name = String(tagName || "").trim();
    if (!name) {
      alert("Please enter a tag name");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, noteIds: selectedNoteIds }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => null);
        alert(e?.error || "Failed to create tag");
        setCreating(false);
        return;
      }
      const created = (await res.json()) as Tag;

      // update list (avoid duplicates)
      setTags((prev) => {
        const exists = prev.find((t) => t.id === created.id || t.name === created.name);
        if (exists) return prev;
        return [...prev, created].sort((a, b) => a.name.localeCompare(b.name));
      });

      closeAdd();

      // optional: navigate to the created tag's page (if you have /tags/[id])
      if (created?.id) router.push(`/TeamNoteTakingApp/tags/${created.id}`);
    } catch (err) {
      console.error("create tag err:", err);
      alert("Network error");
      setCreating(false);
    }
  }

  return (
    <main style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Tags</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/TeamNoteTakingApp/home"><button>Back</button></Link>
          <Link href="/TeamNoteTakingApp/note/new"><button>New Note</button></Link>
          <button onClick={openAdd}>Add Tag</button>
        </div>
      </header>

      <section style={{ marginTop: 18 }}>
        {loading ? <p>Loading notes...</p> : null}

        <div style={{ marginTop: 12 }}>
          {tags.length === 0 ? (
            <p>No tags yet.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {tags.map((t) => (
                <li key={t.id} style={{ border: "1px solid #eee", padding: 12, marginBottom: 10, borderRadius: 6, display: "flex", justifyContent: "space-between" }}>
                  <div>{t.name}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => router.push(`/TeamNoteTakingApp/tags/${t.id}`)}>View notes</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Add Tag modal */}
      {showAdd && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={closeAdd}
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.35)",
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 720, background: "#fff", padding: 18, borderRadius: 8, boxShadow: "0 8px 30px rgba(0,0,0,0.15)" }}
          >
            <h3 style={{ marginTop: 0 }}>Add Tag</h3>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", marginBottom: 6 }}>Tag name</label>
              <input value={tagName} onChange={(e) => setTagName(e.target.value)} placeholder="e.g. Work" style={{ width: "100%", padding: 8 }} autoFocus />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", marginBottom: 8 }}>Select notes to include</label>
              <div style={{ maxHeight: 280, overflow: "auto", border: "1px solid #eee", padding: 8, borderRadius: 6 }}>
                {notes.length === 0 ? (
                  <p style={{ margin: 0 }}>No notes available.</p>
                ) : (
                  notes.map((n) => (
                    <div key={n.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px", borderBottom: "1px solid #fafafa" }}>
                      <input type="checkbox" checked={selectedNoteIds.includes(n.id)} onChange={() => toggleNoteSelect(n.id)} />
                      <div>
                        <div style={{ fontWeight: 700 }}>{n.title}</div>
                        <div style={{ fontSize: 12, color: "#666" }}>{n.content ? (n.content.length > 80 ? n.content.slice(0, 80) + "…" : n.content) : null}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={closeAdd} disabled={creating}>Cancel</button>
              <button onClick={handleCreateTag} disabled={creating}>{creating ? "Creating..." : "Create"}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
