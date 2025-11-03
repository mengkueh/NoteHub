"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Note = { id: number; title: string; content: string; createdAt?: string };

export default function TagNotesPage() {
  const { id } = useParams();
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/notes?tagId=${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data: Note[]) => setNotes(data || []))
      .catch((e) => {
        console.error("load tagged notes err:", e);
        setNotes([]);
      })
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <main style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h1>Notes in Tag</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/TeamNoteTakingApp/tags"><button>Back to tags</button></Link>
          <Link href="/TeamNoteTakingApp/home"><button>Dashboard</button></Link>
        </div>
      </header>

      {loading ? (
        <p>Loading notes...</p>
      ) : notes.length === 0 ? (
        <p>No notes in this tag.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {notes.map((n) => (
            <li key={n.id} style={{ border: "1px solid #eee", padding: 12, marginBottom: 10, borderRadius: 6 }}>
              <div style={{ fontWeight: 700 }}>{n.title}</div>
              <div style={{ marginTop: 6 }}>{n.content}</div>
              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                <Link href={`/TeamNoteTakingApp/note/${n.id}`}><button>Edit</button></Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
