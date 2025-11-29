// src/app/TeamNoteTakingApp/tags/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../home/page.module.css";
import { useLockBodyScroll } from "../useLockBodyScroll";
import { useLanguage } from "../context/LanguageContext"



type Tag = { id: number; name: string; notes?: { note: { id: number; title: string } }[] };
type Note = { id: number; title: string; content?: string };

export default function TagsPage() {
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  // const [notes, setNotes] = useState<Note[]>([]);
  const [owned, setOwned] = useState<Note[]>([]);
  const [shared, setShared] = useState<Note[]>([]);
  const [loadingTags, setLoadingTags] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [tagName, setTagName] = useState("");
  const [selectedNoteIds, setSelectedNoteIds] = useState<number[]>([]);
  const [creating, setCreating] = useState(false);
  const {lang} = useLanguage();

  
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
      setOwned(Array.isArray(data.owned) ? data.owned : []);
      setShared(Array.isArray(data.shared) ? data.shared : []);
    } catch (err) {
      console.error("fetch notes err:", err);
      setOwned([]);
      setShared([]);
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
      if (created?.id && created?.name) {
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
        const slug = createSlug(created.name);
        router.push(`/TeamNoteTakingApp/tags/${slug}`);
      }
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
        </div>
        <div className={styles.sidebarActions}>
          <Link href="/TeamNoteTakingApp/home" className={styles.sidebarButton}>
            <span>📝</span>
            <span>{lang === "en" ? "Dashboard" : "主页"}</span>
          </Link>
          <Link href="/TeamNoteTakingApp/note/new" className={styles.sidebarButton}>
            <span>＋</span>
            <span>{lang === "en" ? "New Note" : "新笔记"}</span>
          </Link>
          <Link href="/TeamNoteTakingApp/tags" className={styles.sidebarButton}>
            <span>#</span>
            <span>{lang === "en" ? "Tag" : "标签"}</span>
          </Link>
          <Link href="/TeamNoteTakingApp/team" className={styles.sidebarButton}>
            <span>#</span>
            <span>{lang === "en" ? "Team" : "队员"}</span>
          </Link>
          <Link href="/TeamNoteTakingApp/settings" className={styles.sidebarButton}>
            <span>⚙</span>
            <span>{lang === "en" ? "Setting" : "设置"}</span>
          </Link>
        </div>
      </aside>

      <section className={styles.listPane}>
        <div className={styles.listHeader}>
          <div>
            <p className={styles.sectionTitle}>{lang === "en" ? "All Tags" : "所有标签"}</p>
            <p className={styles.sectionSubtitle}>
              {loadingTags ? (lang === "en" ? "Loading" : "正在加载") : tagCount === 0 ? (lang === "en" ? "No Tags Yet." : "没有标签.") : `${tagCount} ${tagCount === 1 ? "" : (lang === "en" ? "Tags" : "个标签")}`}
            </p>
          </div>
          <div className={styles.spacer} />
            <button type="button" className={`${styles.button} ${styles.refreshButton}`} onClick={refreshTags} disabled={loadingTags}>
              {lang === "en" ? "Refresh" : "刷新"}
            </button>
        </div>

        <div className={styles.list}>
          {loadingTags ? (
            <div className={styles.listEmpty}>{lang === "en" ? "Loading Tags..." : "正在加载标签"}</div>
          ) : tags.length === 0 ? (
            <div className={styles.listEmpty}>{lang === "en" ? "No tags yet. Create one from the Tags page!" : "您还没有标签， 去标签页创造一个吧！"}</div>
          ) : (
            tags
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((tag) => {
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
                const slug = createSlug(tag.name);
                return (
                  <Link
                    key={tag.id}
                    href={`/TeamNoteTakingApp/tags/${slug}`}
                    className={styles.tagOption}
                  >
                    <span className={styles.tagOptionLabel}>{tag.name}</span>
                    <span className={styles.tagOptionCount}>
                      {(tag.notes?.length ?? 0) === 1
                        ? (lang === "en" ? "1 Note" : "一个笔记")
                        : `${tag.notes?.length ?? 0} ${lang === "en" ? "Notes" : "个笔记"}`}
                    </span>
                  </Link>
                );
              })
          )}
        </div>
      </section>

      <section className={styles.contentPane}>
        <div className={styles.contentHeader}>
          <div className={styles.contentTitle}>{lang === "en" ? "Create a Tag" : "创新标签"}</div>
        </div>

        <div className={`${styles.contentBody} ${styles.contentScroll}`}>
          <div className={styles.surface}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="tag-name-input">
                {lang === "en" ? "Tag Name" : "标签名字"}
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
              <span className={styles.fieldLabel}>{lang === "en" ? "Attached Note:" : "选择的笔记"}</span>
              <div className={`${styles.surface} ${styles.surfaceDense}`} style={{ maxHeight: 280, overflow: "auto" }}>
                {loadingNotes ? (
                  <div className={styles.listEmpty}>{lang === "en" ? "Loading notes..." : "正在加载笔记"}</div>
                ) : owned.length === 0 ? (
                  <div className={styles.listEmpty}>{lang === "en" ? "No notes yet. Create one first." : "还没有笔记, 去创新一个吧!"}</div>
                ) : (
                  owned.map((note) => {
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

                <span className={styles.fieldLabel}>Shared notes</span>
                <div className={`${styles.surface} ${styles.surfaceDense}`} style={{ maxHeight: 280, overflow: "auto" }}>
                  {loadingNotes ? (
                    <div className={styles.listEmpty}>Loading notes…</div>
                  ) : shared.length === 0 ? (
                    <div className={styles.listEmpty}>No notes yet. Create one first.</div>
                  ) : (
                    shared.map((note) => {
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
            </div>

            <div className={styles.buttonRow}>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={handleCreateTag}
                disabled={creating}
              >
                {creating ? "Creating…" : (lang === "en" ? "Create Tag" : "创建标签")}
              </button>
              <button
                type="button"
                className={styles.button}
                onClick={resetForm}
                disabled={creating}
              >
                {lang === "en" ? "Reset" : "重置"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
