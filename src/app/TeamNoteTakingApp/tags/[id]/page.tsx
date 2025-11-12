"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import styles from "../../home/page.module.css";
import { useLockBodyScroll } from "../../useLockBodyScroll";

type Note = { id: number; title: string; content: string; createdAt?: string };

export default function TagNotesPage() {
  const { id } = useParams();
  const router = useRouter();
  const tagId = Array.isArray(id) ? id[0] : id ?? "";
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Note | null>(null);
  const [error, setError] = useState<string | null>(null);

  useLockBodyScroll();

  useEffect(() => {
    if (!tagId) return;
    let mounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/notes?tagId=${tagId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data: Note[]) => {
        if (!mounted) return;
        const safeNotes = Array.isArray(data) ? data : [];
        setNotes(safeNotes);
        setActive((prev) => prev && safeNotes.some((n) => n.id === prev.id) ? prev : safeNotes[0] ?? null);
      })
      .catch((e) => {
        console.error("load tagged notes err:", e);
        if (!mounted) return;
        setNotes([]);
        setActive(null);
        setError("Unable to load notes for this tag.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [tagId]);

  const tagLabel = useMemo(() => (tagId ? `Tag ${tagId}` : "Tag"), [tagId]);

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
            <p className={styles.sectionTitle}>{tagLabel}</p>
            <p className={styles.sectionSubtitle}>
              {loading
                ? "Loading notes…"
                : notes.length === 0
                ? "No notes yet"
                : `${notes.length} note${notes.length === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>

        <div className={styles.list}>
          {loading ? (
            <div className={styles.listEmpty}>Loading notes…</div>
          ) : error ? (
            <div className={styles.listEmpty}>{error}</div>
          ) : notes.length === 0 ? (
            <div className={styles.listEmpty}>No notes in this tag yet.</div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className={styles.noteItem}
                onClick={() => setActive(note)}
                role="button"
              >
                <h3 className={styles.noteTitle}>{note.title || "Untitled"}</h3>
                <div className={styles.notePreview}>
                  {note.content || "No content"}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className={styles.contentPane}>
        <div className={styles.contentHeader}>
          <div className={styles.contentTitle}>
            {active?.title || (loading ? "Loading…" : "Select a note")}
          </div>
          <div className={styles.row}>
            <Link href="/TeamNoteTakingApp/tags">Back to tags</Link>
            {active ? (
              <Link href={`/TeamNoteTakingApp/note/${active.id}`}>Edit note</Link>
            ) : null}
          </div>
        </div>

        <div className={styles.contentBody}>
          {loading ? (
            <div className={styles.listEmpty}>Loading notes…</div>
          ) : error ? (
            <div className={styles.listEmpty}>{error}</div>
          ) : !active ? (
            <div className={styles.emptyState}>Choose a note from the list to view its contents.</div>
          ) : (
            <div className={styles.surface}>
              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Title</span>
                <div>{active.title || "Untitled note"}</div>
              </div>
              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Content</span>
                <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{active.content || "No content"}</div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
