// src/app/TeamNoteTakingApp/note/new/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Tag = { id: number; name: string };

export default function NewNotePage() {
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingTags, setLoadingTags] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoadingTags(true);

    fetch("/api/tags")
      .then(async (r) => {
        const txt = await r.text();
        // try parse if it is JSON string
        try {
          return { ok: r.ok, body: JSON.parse(txt) as unknown };
        } catch {
          // not JSON — return raw text as unknown
          return { ok: r.ok, body: txt as unknown };
        }
      })
      .then(({ ok, body }: { ok: boolean; body: unknown }) => {
        if (!mounted) return;
        // Debug: print what backend returned
        console.log("/api/tags response:", body);

        // If backend returns an array (direct)
        if (Array.isArray(body)) {
          // assume Tag[]
          setTags(body as Tag[]);
          return;
        }

        // If backend returned an object, check for fields like { tags: [...] } or { data: [...] }
        if (typeof body === "object" && body !== null) {
          const obj = body as Record<string, unknown>;
          if (Array.isArray(obj.tags)) {
            setTags(obj.tags as Tag[]);
            return;
          }
          if (Array.isArray(obj.data)) {
            setTags(obj.data as Tag[]);
            return;
          }
        }

        // fallback: empty array
        setTags([]);
      })
      .catch((e) => {
        console.error("fetch /api/tags error:", e);
        setTags([]);
      })
      .finally(() => {
        if (mounted) setLoadingTags(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  function toggleTag(id: number) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleCreate() {
    if (!title.trim() || !content.trim()) return alert("Please fill title and content");
    setSaving(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content: content.trim(), tagIds: selected }),
      });
      if (!res.ok) {
        // type the error shape instead of using `any`
        const e = (await res.json().catch(() => null)) as { error?: string } | null;
        alert(e?.error || "Failed to create");
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

  return (
    <main style={{ padding: 20, maxWidth: 800, margin: "0 auto" }}>
      <h1>New Note</h1>

      <div style={{ marginBottom: 12 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" style={{ width: "100%", padding: 8 }} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Content" rows={6} style={{ width: "100%", padding: 8 }} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <h4>Select tags</h4>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {loadingTags ? (
            <div>Loading tags...</div>
          ) : tags.length === 0 ? (
            <div>No tags available.</div>
          ) : (
            tags.map((t) => (
              <button
                key={t.id}
                onClick={() => toggleTag(t.id)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: selected.includes(t.id) ? "2px solid #111" : "1px solid #ccc",
                  background: selected.includes(t.id) ? "#eee" : "#fff",
                }}
                type="button"
              >
                {t.name}
              </button>
            ))
          )}
        </div>
      </div>

      <div>
        <button onClick={handleCreate} disabled={saving}>
          {saving ? "Creating..." : "Create Note"}
        </button>
        <button onClick={() => router.push("/TeamNoteTakingApp/home")} style={{ marginLeft: 8 }}>
          Cancel
        </button>
      </div>
    </main>
  );
}
