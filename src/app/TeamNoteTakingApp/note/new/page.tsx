// src/app/TeamNoteTakingApp/note/new/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../../home/page.module.css";
import { useLockBodyScroll } from "../../useLockBodyScroll";

type Tag = { id: number; name: string };

export default function NewNotePage() {
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingTags, setLoadingTags] = useState(true);

  useLockBodyScroll();

  useEffect(() => {
    let mounted = true;
    setLoadingTags(true);

    fetch("/api/tags")
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((data: Tag[]) => {
        if (!mounted) return;
        setTags(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        console.error("fetch /api/tags error:", e);
        if (!mounted) return;
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
    if (!title.trim() || !content.trim()) {
      alert("Please add a title and some content before saving.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content: content.trim(), tagIds: selected }),
      });
      if (!res.ok) {
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

  const selectedTags = useMemo(
    () => tags.filter((tag) => selected.includes(tag.id)),
    [tags, selected]
  );

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
            <p className={styles.sectionTitle}>Tag your note</p>
            <p className={styles.sectionSubtitle}>Optional – helps organize later</p>
          </div>
        </div>
        <div className={styles.list}>
          {loadingTags ? (
            <div className={styles.listEmpty}>Loading tags…</div>
          ) : tags.length === 0 ? (
            <div className={styles.listEmpty}>No tags yet. Create tags from the Tags page.</div>
          ) : (
            tags.map((tag) => {
              const isSelected = selected.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`${styles.tagOption} ${isSelected ? styles.tagOptionActive : ""}`}
                >
                  <span className={styles.tagOptionLabel}>{tag.name}</span>
                  <span className={styles.tagOptionCount}>{isSelected ? "Selected" : "Tap to add"}</span>
                </button>
              );
            })
          )}
        </div>
      </section>

      <section className={styles.contentPane}>
        <div className={styles.contentHeader}>
          <div className={styles.contentTitle}>New Note</div>
        </div>

        <div className={`${styles.contentBody} ${styles.contentScroll}`}>
          <div className={styles.surface}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="new-note-title">
                Title
              </label>
              <input
                id="new-note-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={styles.input}
                maxLength={120}
                placeholder="Give your note a title"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="new-note-content">
                Content
              </label>
              <textarea
                id="new-note-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={styles.textarea}
                rows={12}
                placeholder="What do you need to remember?"
              />
            </div>

            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Selected tags</span>
              {selectedTags.length === 0 ? (
                <span className={styles.sectionSubtitle}>You can add tags now or later.</span>
              ) : (
                <div className={styles.pillGrid}>
                  {selectedTags.map((tag) => (
                    <span key={tag.id} className={styles.pill}>
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.buttonRow}>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonPrimary}`}
              onClick={handleCreate}
              disabled={saving}
            >
              {saving ? "Creating…" : "Create Note"}
            </button>
            <button
              type="button"
              className={styles.button}
              onClick={() => router.push("/TeamNoteTakingApp/home")}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
