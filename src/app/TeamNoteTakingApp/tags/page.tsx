// src/app/TeamNoteTakingApp/tags/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../home/page.module.css";
import { useLockBodyScroll } from "../useLockBodyScroll";

type Tag = { id: number; name: string; notes?: { note: { id: number; title: string } }[] };
type Note = { id: number; title: string; content?: string };

export default function TagsPage() {
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loadingTags, setLoadingTags] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [tagName, setTagName] = useState("");
  const [selectedNoteIds, setSelectedNoteIds] = useState<number[]>([]);
  const [creating, setCreating] = useState(false);

  useLockBodyScroll();

  useEffect(() => {
    refreshTags();
    refreshNotes();
  }, []);

  async function refreshTags() {
    setLoadingTags(true);
    try {
      const res = await fetch("/api/tags");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setTags(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("fetch tags err:", err);
      setTags([]);
    } finally {
      setLoadingTags(false);
    }
  }

  async function refreshNotes() {
    setLoadingNotes(true);
    try {
      const res = await fetch("/api/notes");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("fetch notes err:", err);
      setNotes([]);
    } finally {
      setLoadingNotes(false);
    }
  }

  function toggleNoteSelect(id: number) {
    setSelectedNoteIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function resetForm() {
    setTagName("");
    setSelectedNoteIds([]);
  }

  async function handleCreateTag() {
    const name = tagName.trim();
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
      setTags((prev) => {
        const exists = prev.find((t) => t.id === created.id || t.name === created.name);
        if (exists) return prev;
        return [...prev, created].sort((a, b) => a.name.localeCompare(b.name));
      });
      resetForm();
      if (created?.id) router.push(`/TeamNoteTakingApp/tags/${created.id}`);
    } catch (err) {
      console.error("create tag err:", err);
      alert("Network error");
    } finally {
      setCreating(false);
    }
  }

  const tagCount = useMemo(() => tags.length, [tags]);

  return (
    <main className={styles.dashboard}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span>NoteHub</span>
          <div className={styles.spacer} />
          <Link href="/TeamNoteTakingApp" className={styles.logoutButton}>
            Logout
          </Link>
        </div>
        <div className={styles.sidebarActions}>
          <Link href="/TeamNoteTakingApp/home" className={styles.sidebarButton}>
            <span>📝</span>
            <span>Dashboard</span>
          </Link>
          <Link href="/TeamNoteTakingApp/note/new" className={styles.sidebarButton}>
            <span>＋</span>
            <span>New Note</span>
          </Link>
          <Link href="/TeamNoteTakingApp/tags" className={styles.sidebarButton}>
            <span>#</span>
            <span>Tags</span>
          </Link>
          <Link href="/TeamNoteTakingApp/settings" className={styles.sidebarButton}>
            <span>⚙</span>
            <span>Settings</span>
          </Link>
        </div>
      </aside>

      <section className={styles.listPane}>
        <div className={styles.listHeader}>
          <div>
            <p className={styles.sectionTitle}>All tags</p>
            <p className={styles.sectionSubtitle}>
              {loadingTags ? "Loading…" : tagCount === 0 ? "No tags yet" : `${tagCount} tag${tagCount === 1 ? "" : "s"}`}
            </p>
          </div>
          <button
            type="button"
            className={styles.button}
            onClick={refreshTags}
            disabled={loadingTags}
          >
            Refresh
          </button>
        </div>

        <div className={styles.list}>
          {loadingTags ? (
            <div className={styles.listEmpty}>Loading tags…</div>
          ) : tags.length === 0 ? (
            <div className={styles.listEmpty}>No tags yet. Create one on the right.</div>
          ) : (
            tags
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((tag) => (
                <Link
                  key={tag.id}
                  href={`/TeamNoteTakingApp/tags/${tag.id}`}
                  className={styles.tagOption}
                >
                  <span className={styles.tagOptionLabel}>{tag.name}</span>
                  <span className={styles.tagOptionCount}>
                    {(tag.notes?.length ?? 0) === 1
                      ? "1 note"
                      : `${tag.notes?.length ?? 0} notes`}
                  </span>
                </Link>
              ))
          )}
        </div>
      </section>

      <section className={styles.contentPane}>
        <div className={styles.contentHeader}>
          <div className={styles.contentTitle}>Create a tag</div>
        </div>

        <div className={`${styles.contentBody} ${styles.contentScroll}`}>
          <div className={styles.surface}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="tag-name-input">
                Tag name
              </label>
              <input
                id="tag-name-input"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                className={styles.input}
                placeholder="e.g. Project Atlas"
                maxLength={80}
              />
            </div>

            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Attach notes (optional)</span>
              <div className={`${styles.surface} ${styles.surfaceDense}`} style={{ maxHeight: 280, overflow: "auto" }}>
                {loadingNotes ? (
                  <div className={styles.listEmpty}>Loading notes…</div>
                ) : notes.length === 0 ? (
                  <div className={styles.listEmpty}>No notes yet. Create one first.</div>
                ) : (
                  notes.map((note) => {
                    const isChecked = selectedNoteIds.includes(note.id);
                    const preview =
                      note.content && note.content.length > 100
                        ? `${note.content.slice(0, 100)}…`
                        : note.content;
                    return (
                      <label
                        key={note.id}
                        className={`${styles.checkRow} ${isChecked ? styles.checkRowActive : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleNoteSelect(note.id)}
                        />
                        <div>
                          <div className={styles.checkRowTitle}>{note.title || "Untitled note"}</div>
                          {preview ? (
                            <div className={styles.checkRowPreview}>{preview}</div>
                          ) : null}
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div className={styles.buttonRow}>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={handleCreateTag}
                disabled={creating}
              >
                {creating ? "Creating…" : "Create tag"}
              </button>
              <button
                type="button"
                className={styles.button}
                onClick={resetForm}
                disabled={creating}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
