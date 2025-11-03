// src/app/TeamNoteTakingApp/note/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Tag = { id: number; name: string };
type NoteDetail = { id: number; title: string; content: string; tags: { tag: Tag }[] };

export default function EditNotePage() {
  const { id } = useParams();
  const router = useRouter();
  const [note, setNote] = useState<NoteDetail | null>(null);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // load all tags
    fetch("/api/tags").then((r) => r.json()).then((t) => setAllTags(t)).catch(() => null);

    // load note
    fetch(`/api/notes/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data: NoteDetail) => {
        setNote(data);
        const tagIds = (data.tags ?? []).map((x) => x.tag.id);
        setSelected(tagIds);
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to load note");
      });
  }, [id]);

  function toggleTag(idNum: number) {
    setSelected((prev) => (prev.includes(idNum) ? prev.filter((x) => x !== idNum) : [...prev, idNum]));
  }

  async function handleSave() {
    if (!note) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: note.title, content: note.content, tagIds: selected }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => null);
        alert(e?.error || "Failed to save");
        return;
      }
      router.push("/TeamNoteTakingApp/home");
    } catch (err) {
      console.error(err);
      alert("Network error");
    } finally {
      setSaving(false);
    }
  }

  if (!note) return <p>Loading...</p>;

  return (
    <main style={{ padding: 20, maxWidth: 800, margin: "0 auto" }}>
      <h1>Edit Note</h1>
      <div style={{ marginBottom: 12 }}>
        <input value={note.title} onChange={(e) => setNote({ ...note, title: e.target.value })} placeholder="Title" style={{ width: "100%", padding: 8 }} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <textarea value={note.content} onChange={(e) => setNote({ ...note, content: e.target.value })} rows={6} style={{ width: "100%", padding: 8 }} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <h4>Tags</h4>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {allTags.map((t) => (
            <button
              key={t.id}
              onClick={() => toggleTag(t.id)}
              style={{
                padding: "6px 10px",
                borderRadius: 6,
                border: selected.includes(t.id) ? "2px solid #111" : "1px solid #ccc",
                background: selected.includes(t.id) ? "#eee" : "#fff",
              }}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
        <button onClick={() => router.push("/TeamNoteTakingApp/home")} style={{ marginLeft: 8 }}>Cancel</button>
      </div>
    </main>
  );
}
