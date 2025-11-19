"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import styles from "../../home/page.module.css";
import { useLockBodyScroll } from "../../useLockBodyScroll";

type Note = { id: number; title: string; content: string; createdAt?: string };
type Tag = { id: number; name: string };

export default function TagNotesPage() {
  const { id } = useParams();
  const router = useRouter();
  const slug = Array.isArray(id) ? id[0] : id ?? "";
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Note | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tagName, setTagName] = useState<string>("");
  const [tagId, setTagId] = useState<number | null>(null);

  useLockBodyScroll();

  // Helper function to create URL-friendly slug from tag name
  const createSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
  };

  // Find tag by slug and update URL if needed
  useEffect(() => {
    if (!slug) return;
    let mounted = true;

    fetch("/api/tags")
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((tags: Tag[]) => {
        if (!mounted) return;
        // Try to find tag by slug (for new format) or by ID (for backwards compatibility)
        let tag: Tag | null = null;
        
        // First, try to match by slug
        if (slug && !/^\d+$/.test(slug)) {
          tag = Array.isArray(tags) 
            ? tags.find((t) => createSlug(t.name) === slug) || null
            : null;
        }
        
        // If not found and slug is a number, try by ID (backwards compatibility)
        if (!tag && /^\d+$/.test(slug)) {
          tag = Array.isArray(tags) 
            ? tags.find((t) => t.id === Number(slug)) || null
            : null;
        }
        
        if (tag) {
          setTagName(tag.name);
          setTagId(tag.id);
          // Update URL to use slug format if it's still using ID
          const expectedSlug = createSlug(tag.name);
          if (slug !== expectedSlug && /^\d+$/.test(slug)) {
            router.replace(`/TeamNoteTakingApp/tags/${expectedSlug}`, { scroll: false });
          }
        } else {
          setError("Tag not found");
          setLoading(false);
        }
      })
      .catch((e) => {
        console.error("load tag name err:", e);
        if (!mounted) return;
        setError("Unable to load tag.");
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [slug, router]);

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
        setActive(null);
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

  const tagLabel = useMemo(() => {
    if (!slug) return "Tag";
    return tagName ? `Tag: ${tagName}` : "Tag: ...";
  }, [slug, tagName]);

  return (
    <main className={styles.dashboard}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span>NoteHub</span>
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
          </div>
          <div className={styles.spacer} />
            <Link href="/TeamNoteTakingApp/tags" className={`${styles.button} ${styles.refreshButton}`}>Back to tags</Link>
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
                <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{active.content || "No content"}</div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
