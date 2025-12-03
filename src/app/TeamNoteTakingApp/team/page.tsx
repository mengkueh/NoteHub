"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../home/main.module.css";
import { useLockBodyScroll } from "../useLockBodyScroll";
import { useLanguage } from "../context/LanguageContext";
import RenderHtmlClient from "@/components/RenderHtmlClient";
import NotLoggedIn from "@/components/NotLoggedIn";

type Access = { id: number; role: string; user: { id: string; email: string; displayName?: string } };
type NoteListItem = { id: number; title: string; content: string; createdAt?: string; userId?: string };
type NoteDetail = {
  id: number;
  title: string;
  content: string;
  createdAt?: string;
  user?: { id: string; email: string; displayName?: string };
  accesses?: Access[];
};

export default function TeamPage() {
  const router = useRouter();
  const [owned, setOwned] = useState<NoteListItem[]>([]);
  const [shared, setShared] = useState<NoteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingNote, setLoadingNote] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<NoteDetail | null>(null);
  const [notLoggedIn, setNotLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { lang } = useLanguage();

  useLockBodyScroll();

  // load all notes (owned + shared lists)
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setNotLoggedIn(false);
    setError(null);

    fetch("/api/notes")
      .then(async (res) => {
        if (!mounted) return null;

        if (res.status === 401) {
          setNotLoggedIn(true);
          setLoading(false);
          return null;
        }
        if (!res.ok) {
          const txt = await res.text().catch(() => "Failed to load notes");
          throw new Error(txt);
        }
        return res.json();
      })
      .then((data) => {
        if (!mounted || !data) return;
        setOwned(Array.isArray(data.owned) ? data.owned : []);
        setShared(Array.isArray(data.shared) ? data.shared : []);
      })
      .catch((e) => {
        console.error("load notes err:", e);
        if (mounted) setError((e as Error).message || "Unknown error");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [router]);

  // fetch full note (owner + accesses) when clicking a note
  async function handleSelect(noteId: number) {
    setLoadingNote(true);
    setError(null);
    try {
      const res = await fetch(`/api/notes/${noteId}`);
      if (!res.ok) {
        const txt = await res.text().catch(() => "Failed to load note");
        throw new Error(txt);
      }
      const data: NoteDetail = await res.json();
      setActive(data);
    } catch (err) {
      console.error("load note err:", err);
      setError("Failed to load note.");
      setActive(null);
    } finally {
      setLoadingNote(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete note?")) return;
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown" }));
        alert(err.error || "Failed to delete");
        return;
      }
      setOwned((prev) => prev.filter((n) => n.id !== id));
      setShared((prev) => prev.filter((n) => n.id !== id));
      if (active?.id === id) setActive(null);
    } catch (err) {
      console.error(err);
      alert("Network error");
    }
  }

  // filter shared notes by query
  const sharedFiltered = query.trim()
    ? shared.filter((m) => (m.title + " " + m.content).toLowerCase().includes(query.trim().toLowerCase()))
    : shared;

  // derive owner email and collaborators for currently active note
  const ownerEmail = active?.user?.email ?? "Unknown";
  const collaborators = (active?.accesses ?? [])
    .map((a) => a.user?.email ?? null)
    .filter((e) => e && e !== ownerEmail) as string[];

  // "not logged in" message
  if (notLoggedIn) {
    return <NotLoggedIn />;
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
            <span>{lang === "en" ? "Settings" : "设置"}</span>
          </Link>
        </div>
      </aside>

      <section className={styles.listPane}>
        <div className={styles.listHeader}>
          <input
            className={styles.search}
            placeholder={lang === "en" ? "Search All Notes" : "搜索笔记"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className={styles.list}>
          <h4 className={styles.sectionTitle}>{lang === "en" ? "Shared Notes" : "分享的笔记"}</h4>

          {loading ? (
            <div className={styles.noteMeta}>{lang === "en" ? "Loading…" : "加载中…"}</div>
          ) : sharedFiltered.length === 0 ? (
            <div className={styles.noteMeta}>{lang === "en" ? "No Shared Note." : "没有分享的笔记"}</div>
          ) : (
            sharedFiltered.map((m) => (
              <div
                key={`shared-${m.id}`}
                className={styles.noteItem}
                onClick={() => handleSelect(m.id)}
                role="button"
              >
                <h3 className={styles.noteTitle}>{m.title || "Untitled"}</h3>
                <div className={styles.notePreview}>
                  <RenderHtmlClient
                  html={m.content || "<p>No content</p>"}
                  className="quill-content"
                />
                </div>
                <div className={styles.noteMeta}>{m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}</div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className={styles.contentPane}>
        <div className={styles.contentHeader}>
          <div className={styles.contentTitle}>{active?.title || (loadingNote ? (lang === "en" ? "Loading…" : "加载中…") : (lang === "en" ? "Select A Note" : "请选择一个笔记"))}</div>
          {active && (
            <div className={styles.row}>
              <Link href={`/TeamNoteTakingApp/note/${active.id}`}>{lang === "en" ? "Edit" : "编辑"}</Link>
              <button className={styles.buttonDestructive}>{lang === "en" ? "Delete" : "删除"}</button>
            </div>
          )}
        </div>

        <div className={styles.contentBody}>
          {!active ? (
            <div className={styles.emptyState}>{lang === "en" ? "Choose a note from the list to view its contents." : "请选择一个笔记来查看内容"}</div>
          ) : (
            <div className={styles.surface}>
              <div className={styles.fieldGroup}>
                <strong>{lang === "en" ? "Owner: " : "作者: "}</strong><span>{ownerEmail}</span>
                <div>
                  <strong>{lang === "en" ? "Collaborators: " : "协作者: "}</strong><span>{collaborators.length ? collaborators.join(", ") : (lang === "en" ? "None" : "无")}</span>
                </div>
              </div>
              <div className={styles.contentBody}>
                <RenderHtmlClient
                  html={active.content || "<p>No content</p>"}
                  className="quill-content"
                />
              </div>
            </div>
          )}
          {error ? <div className={styles.modalError}>{error}</div> : null}
        </div>
      </section>
    </main>
  );
}
