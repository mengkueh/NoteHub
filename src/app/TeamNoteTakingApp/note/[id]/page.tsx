// src/app/TeamNoteTakingApp/note/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "../../home/main.module.css";
import { useLockBodyScroll } from "../../useLockBodyScroll";
import ShareByEmail from "@/components/ShareByEmail";
import { useLanguage } from "../../context/LanguageContext"
import RichEditor from "@/components/RichEditor";

type Tag = { id: number; name: string };
type Access = { id: number; role: string; user: { id: string; email: string; displayName?: string } };
type NoteDetail = {
  id: number;
  title: string;
  content: string;
  tags: { tag: Tag }[];
  user?: { id: string; email: string; displayName?: string };
  accesses?: Access[];
};

export default function EditNotePage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id;
  const noteId = Array.isArray(rawId) ? rawId[0] : rawId ?? "";

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loadingNote, setLoadingNote] = useState(true);
  const [loadingTags, setLoadingTags] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [noteDetail, setNoteDetail] = useState<NoteDetail | null>(null);
  const {lang } = useLanguage();
  useLockBodyScroll();

  // load tags (for the tag selector)
  useEffect(() => {
    let mounted = true;
    setLoadingTags(true);

    fetch("/api/tags")
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((tags: Tag[]) => {
        if (!mounted) return;
        setAllTags(Array.isArray(tags) ? tags : []);
      })
      .catch((err) => {
        console.error("load tags err:", err);
        if (!mounted) return;
        setAllTags([]);
      })
      .finally(() => {
        if (mounted) setLoadingTags(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // load note (including owner and accesses)
  useEffect(() => {
    if (!noteId) return;
    let mounted = true;
    setLoadingNote(true);
    setError(null);

    fetch(`/api/notes/${noteId}`)
      .then(async (res) => {
        if (!res.ok) {
          const txt = await res.text().catch(() => "Failed to load note");
          throw new Error(txt);
        }
        return res.json();
      })
      .then((data: NoteDetail) => {
        if (!mounted) return;
        setNoteDetail(data);
        setTitle(data.title ?? "");
        setContent(data.content ?? "");
        const tagIds = (data.tags ?? []).map((x) => x.tag.id);
        setSelected(tagIds);
      })
      .catch((err) => {
        console.error("load note err:", err);
        if (!mounted) return;
        setError("Failed to load note.");
      })
      .finally(() => {
        if (mounted) setLoadingNote(false);
      });

    return () => {
      mounted = false;
    };
  }, [noteId]);

  function toggleTag(idNum: number) {
    setSelected((prev) => (prev.includes(idNum) ? prev.filter((x) => x !== idNum) : [...prev, idNum]));
  }

  async function handleSave() {
    if (!noteId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content: content.trim(), tagIds: selected }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => null);
        alert(e?.error || "Failed to save");
        return;
      }
      // refetch updated note details after save
      const updated = await fetch(`/api/notes/${noteId}`).then((r) => r.json());
      setNoteDetail(updated);
      router.push("/TeamNoteTakingApp/home");
    } catch (err) {
      console.error(err);
      alert("Network error");
    } finally {
      setSaving(false);
    }
  }

  const selectedTags = useMemo(() => allTags.filter((tag) => selected.includes(tag.id)), [allTags, selected]);

  // derive owner & collaborators safely
  const ownerEmail = noteDetail?.user?.email ?? "Unknown";
  const collaborators = (noteDetail?.accesses ?? [])
    .map((a) => a.user?.email ?? null)
    .filter((e) => e && e !== ownerEmail) as string[];

  // refresh accesses (call after invite)
  async function refreshNote() {
    if (!noteId) return;
    try {
      const data = await fetch(`/api/notes/${noteId}`).then((r) => r.json());
      setNoteDetail(data);
    } catch (err) {
      console.error("refresh note failed", err);
    }
  }

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

          {/* Invite button / component: ShareByEmail should POST to /api/notes/[id]/share or similar */}
          <ShareByEmail
            noteId={noteId}
            onDone={async (accesses?: unknown) => {
              // after invite completes, refresh note to show new collaborators
              await refreshNote();
              console.log("invited, accesses:", accesses);
            }}
          />
        </div>
      </aside>

      <section className={styles.listPane}>
        <div className={styles.listHeader}>
          <div>
            <p className={styles.sectionTitle}>{lang === "en" ? "Tags" : "标签"}</p>
            <p className={styles.sectionSubtitle}>{lang === "en" ? "Choose Tags For This Note" : "为此笔记选择标签"}</p>
          </div>
        </div>

        <div className={styles.list}>
          {loadingTags ? (
            <div className={styles.listEmpty}>{lang === "en" ? "Loading Tags..." : "正在加载标签..."}</div>
          ) : allTags.length === 0 ? (
            <div className={styles.listEmpty}>{lang === "en" ? "No tags yet. Create one from the Tags page!" : "您还没有标签， 去标签页创造一个吧！"}</div>
          ) : (
            allTags.map((tag) => {
              const isSelected = selected.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`${styles.tagOption} ${isSelected ? styles.tagOptionSelected : ""}`}
                >
                  <span className={styles.tagOptionLabel}>{tag.name}</span>
                  <span className={styles.tagOptionCount}>{isSelected ? (lang === "en" ? "Selected" : "已选择") : (lang === "en" ? "Tap To Add" : "点击以选择")}</span>
                </button>
              );
            })
          )}
        </div>
      </section>

      <section className={styles.contentPane}>
        <div className={styles.contentHeader}>
          <div className={styles.contentTitle}>{lang === "en" ? "Edit Note" : "编辑笔记"}</div>
        </div>

        <div className={`${styles.contentBody} ${styles.contentScroll}`}>
          {error ? (
            <div className={styles.listEmpty}>{error}</div>
          ) : loadingNote ? (
            <div className={styles.listEmpty}>{lang === "en" ? "Loading Notes..." : "正在加载笔记..."}</div>
          ) : (
            <>
              <div className={styles.surface}>
                {/* <div style={{ marginBottom: 12 }}>
                  <strong>{lang === "en" ? "Owner: " : "作者: "}</strong> <span>{ownerEmail}</span>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <strong>{lang === "en" ? "Collaborators: " : "合作者: "}</strong>{" "}
                  {collaborators.length === 0 ? <span>{lang === "en" ? "None" : "无"}</span> : <span>{collaborators.join(", ")}</span>}
                </div> */}

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="note-title">
                    {lang === "en" ? "Title" : "标题"}
                  </label>
                  <input
                    id="note-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={styles.input}
                    placeholder="Untitled note"
                    maxLength={120}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="note-content">
                    {lang === "en" ? "Content" : "内容"}
                  </label>
                  <RichEditor value={content} onChange={(html) => setContent(html)}/>
                  
                  {/* <textarea
                    id="note-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className={styles.textarea}
                    rows={12}
                    placeholder="Add your details here…"
                  /> */}
                </div>

                <div className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>{lang === "en" ? "Selected Tags" : "已选择的标签"}</span>
                  {selectedTags.length === 0 ? (
                    <span className={styles.sectionSubtitle}>{lang === "en" ? "No Tags Selected Yet." : "没有选择的标签"}</span>
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
                <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : (lang === "en" ? "Save Note" : "保存")}
                </button>
                <button type="button" className={styles.button} onClick={() => router.push("/TeamNoteTakingApp/home")} disabled={saving}>
                  {lang === "en" ? "Cancel" : "取消"}
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
