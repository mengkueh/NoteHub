"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { useLockBodyScroll } from "../useLockBodyScroll";
import { useLanguage } from "../context/LanguageContext"

type Note = { id: number; title: string; content: string; createdAt?: string };

export default function TeamPage() {
    
const router = useRouter();
  const [owned, setOwned] = useState<Note[]>([]);
  const [shared, setShared] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Note | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notLoggedIn, setNotLoggedIn] = useState(false);
  const {lang, setLang } = useLanguage();

  useLockBodyScroll();

  // load all notes (initially all)
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setNotLoggedIn(false);
    setError(null);

    fetch("/api/notes")
      .then(async (res) => {
        if (!mounted) return null;

        if (res.status === 401) {
          // OPTION A: redirect to login immediately:
          // router.push("/TeamNoteTakingApp/login");
          // return null;

          // OPTION B: show friendly "not logged in" message in this page:
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
        // setNotes(data);
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

  // If we detected no session, show friendly message and link to login
  if (notLoggedIn) {
    return (
      <main style={{ padding: 20, maxWidth: 800, margin: "0 auto", textAlign: "center"}}>
        <h1>Trying to key in the url to look inside?</h1>
        <Link href={`/TeamNoteTakingApp`}><button className="cursor-pointer border-1 px-10 ">Go Back To Login NOW!</button></Link>
      </main>
    );
  }

    const sharedFiltered = query.trim()
    ?shared.filter((m) =>
        (m.title + " " + m.content).toLowerCase().includes(query.trim().toLowerCase())
      )
    : shared;


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
    } catch (err) {
      console.error(err);
      alert("Network error");
    }
  }

  
    async function handleLogout() {
    setLoading(true);
    try {
      const res = await fetch("/api/logout", { method: "POST" });
      if (res.ok) {
        // redirect to login
        router.push("/TeamNoteTakingApp");
      } else {
        alert("Failed to logout");
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    } finally {
      setLoading(false);
    }
  }
    return (
        <main className={styles.dashboard}>
    <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span>NoteHub</span>
          <div className={styles.spacer} />
          <Link href="/TeamNoteTakingApp" className={styles.logoutButton} onClick={handleLogout}>{lang === "en" ? "Logout" : "登出"}</Link>
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
          <input
            className={styles.search}
            placeholder={lang === "en" ? "Search All Notes" : "搜索笔记"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div>
          <h4 style={{ margin: "8px 0" }}>{lang === "en" ? "Shared Notes" : "分享的笔记"}</h4>
          {sharedFiltered.length === 0 ? (
            <div className={styles.noteMeta}>{lang === "en" ? "No Shared Note." : "没有分享的笔记"}</div>
          ) : (
            sharedFiltered.map((m) => (
              <div key={`shared-${m.id}`} className={styles.noteItem} onClick={() => setActive(m)} role="button">
                <h3 className={styles.noteTitle}>{m.title || "Untitled"}</h3>
                <div className={styles.notePreview}>{m.content || "No content"}</div>
                <div className={styles.noteMeta}>{m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}</div>
              </div>
            ))
          )}
        </div>
        </section>

        <section className={styles.contentPane}>
        <div className={styles.contentHeader}>
          <div className={styles.contentTitle}>
            {active?.title || (lang === "en" ? "Select A Note" : "请选择一个笔记")}
          </div>
          {active && (
            <div className={styles.row}>
              <Link href={`/TeamNoteTakingApp/note/${active.id}`}>
                {lang === "en" ? "Edit" : "编辑"}
              </Link>
              <button onClick={() => handleDelete(active.id)} style={{ color: "#ff6b6b" }}>
                {lang === "en" ? "Delete" : "删除"}
              </button>
            </div>
          )}
        </div>
        <div className={styles.contentBody}>
          {!active ? (
            <div className={styles.emptyState}>{lang === "en" ? "Choose a note from the list to view its contents." : "请选择一个笔记来查看内容"}</div>
          ) : (
            <div className={styles.surface}>
                <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{active.content || "No content"}</div>
            </div>
          )}
        </div>
      </section>

        </main>
    )
}