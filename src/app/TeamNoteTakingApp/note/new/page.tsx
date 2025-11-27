// src/app/TeamNoteTakingApp/note/new/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../../home/page.module.css";
import { useLockBodyScroll } from "../../useLockBodyScroll";
import { useLanguage } from "../../context/LanguageContext"
import AddTag from "@/components/AddTag";
import RichEditor from "@/components/RichEditor";
import RenderHtmlClient from "@/components/RenderHtmlClient";

type Tag = { id: number; name: string };

export default function NewNotePage() {
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingTags, setLoadingTags] = useState(true);
  const [showAddTag, setShowAddTag] = useState(false);
  const {lang, setLang } = useLanguage();
  const [isClient, setIsClient] = useState(false);

  
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


  function onTagCreated(tag: Tag) {
    // append to tags list and mark selected
    setTags((prev) => {
      // avoid duplicates
      if (prev.some((t) => t.id === tag.id)) return prev;
      return [...prev, tag].sort((a, b) => a.name.localeCompare(b.name));
    });
    setSelected((prev) => (prev.includes(tag.id) ? prev : [...prev, tag.id]));
  }


  const selectedTags = useMemo(
    () => tags.filter((tag) => selected.includes(tag.id)),
    [tags, selected]
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <main className={styles.dashboard}>
      <AddTag open={showAddTag} onClose={() => setShowAddTag(false)} onCreated={onTagCreated} />
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
            <p className={styles.sectionTitle}>{lang === "en" ? "Tag Your Note" : "标签您的笔记"}</p>
            {/* <p className={styles.sectionSubtitle}>Optional - helps organize later</p> */}
          </div>
          <div>
            <button type="button" onClick={() => setShowAddTag(true)}>{lang === "en" ? "Add New Tag" : "添加新标签"}</button>
          </div>
        </div>
        <div className={styles.list}>
          {loadingTags ? (
            <div className={styles.listEmpty}>Loading tags…</div>
          ) : tags.length === 0 ? (
            <div className={styles.listEmpty}>{lang === "en" ? "No tags yet. Create one from the Tags page!" : "您还没有标签， 去标签页创造一个吧！"}</div>
          ) : (
            tags.map((tag) => {
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
          <div className={styles.contentTitle}>{lang === "en" ? "New Note" : "创建新笔记"}</div>
        </div>

        <div className={`${styles.contentBody} ${styles.contentScroll}`}>
          <div className={styles.surface}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="new-note-title">
                {lang === "en" ? "Title" : "标题"}
              </label>
              <input
                id="new-note-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={styles.input}
                maxLength={120}
                placeholder={lang === "en" ? "Give Your Note a Title" : "给您的笔记起个标题"}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="new-note-content">
                {lang === "en" ? "Content" : "内容"}
              </label>
              
              {isClient && <RichEditor value={content} onChange={(html) => setContent(html)}/>}
            </div>

            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>{lang === "en" ? "Selected Tags" : "选择的标签"}</span>
              {selectedTags.length === 0 ? (
                <span className={styles.sectionSubtitle}>{lang === "en" ? "You can add tags now or later." : "您也可以稍后在添加标签"}</span>
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
              {saving ? "Creating…" : (lang === "en" ? "Create Note" : "创建笔记")}
            </button>
            <button
              type="button"
              className={styles.button}
              onClick={() => router.push("/TeamNoteTakingApp/home")}
              disabled={saving}
            >
              {lang === "en" ? "Cancel" : "取消"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
