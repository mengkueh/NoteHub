"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import styles from "../../home/main.module.css";
import { useLockBodyScroll } from "../../useLockBodyScroll";
import { useLanguage } from "../../context/LanguageContext"
import RenderHtmlClient from "@/components/RenderHtmlClient";

type Note = { id: number; title: string; content: string; createdAt?: string };
type Tag = { id: number; name: string };

export default function TagNotesPage() {
  const { id } = useParams();
  const router = useRouter();
  const slug = Array.isArray(id) ? id[0] : id ?? "";
  const [owned, setOwned] = useState<Note[]>([]);
  const [, setShared] = useState<Note[]>([]);
  // const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Note | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tagName, setTagName] = useState<string>("");
  const [tagId, setTagId] = useState<number | null>(null);
  const {lang } = useLanguage();


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
      if (!mounted) return null;
      if (res.status === 401) {
        // not logged in -> redirect or show message
        router.push("/TeamNoteTakingApp"); // 或者 setError + show login link
        return null;
      }
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    })
    .then((data) => {
      if (!mounted || !data) return;
      // expect { owned: Note[], shared: Note[] }
      setOwned(Array.isArray(data.owned) ? data.owned : []);
      setShared(Array.isArray(data.shared) ? data.shared : []);
      setActive(null);
    })
    .catch((e) => {
      console.error("load tagged notes err:", e);
      if (!mounted) return;
      setOwned([]);
      setShared([]);
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
    if (!slug) return (lang === "en" ? "Tag: " : "标签名称: ");
    return tagName ? `${lang === "en" ? "Tag: " : "标签名称: "} ${tagName}` : (lang === "en" ? "Tag: " : "标签名称: ");
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
            <p className={styles.sectionTitle}>{tagLabel}</p>
          </div>
          <div className={styles.spacer} />
            <Link href="/TeamNoteTakingApp/tags" className={`${styles.button} ${styles.refreshButton}`}>{lang === "en" ? "Back To Tags" : "返回"}</Link>
        </div>

        <div className={styles.list}>
          {loading ? (
            <div className={styles.listEmpty}>{lang === "en" ? "Loading Notes..." : "正在加载笔记..."}</div>
          ) : error ? (
            <div className={styles.listEmpty}>{error}</div>
          ) : owned.length === 0 ? (
            <div className={styles.listEmpty}>{lang === "en" ? "No Notes in Tags Yet" : "标签里还没有笔记"}</div>
          ) : (
            owned.map((note) => (
              <div
                key={note.id}
                className={styles.noteItem}
                onClick={() => setActive(note)}
                role="button"
              >
                <h3 className={styles.noteTitle}>
                  {note.title || "Untitled"}
                </h3>
                <div className={styles.notePreview}>
                  <RenderHtmlClient
                    html={note.content || (lang === "en" ? "No Content" : "没有内容")}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className={styles.contentPane}>
        <div className={styles.contentHeader}>
          <div className={styles.contentTitle}>
            {active?.title || (loading ? (lang === "en" ? "Loading ..." : "正在加载...") : (lang === "en" ? "Select A Note" : "请选择一个笔记"))}
          </div>
          <div className={styles.row}>
            {active ? (
              <Link href={`/TeamNoteTakingApp/note/${active.id}`}>{lang === "en" ? "Edit Note" : "编辑笔记"}</Link>
            ) : null}
          </div>
        </div>

        <div className={styles.contentBody}>
          {loading ? (
            <div className={styles.listEmpty}>{lang === "en" ? "Loading Notes..." : "正在加载笔记..."}</div>
          ) : error ? (
            <div className={styles.listEmpty}>{error}</div>
          ) : !active ? (
            <div className={styles.emptyState}>{lang === "en" ? "Choose a note from the list to view its contents." : "请选着一个笔记来查看内容"}</div>
          ) : (
            <div className={styles.surface}>
                <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                  <RenderHtmlClient
                    html={active.content || (lang === "en" ? "No Content" : "没有内容")}
                  />
                </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
