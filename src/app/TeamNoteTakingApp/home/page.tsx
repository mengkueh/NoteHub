"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./main.module.css";
import { useLockBodyScroll } from "../useLockBodyScroll";
import { useLanguage } from "../context/LanguageContext"
// import { getSessionFromCookie } from "@/lib/auth";
import RenderHtmlClient from "@/components/RenderHtmlClient";

type Note = { id: number; title: string; content: string; createdAt?: string; tags?: Array<{ tag: { id: number; name: string } }>; };

export default function Dashboard() {
  // const session = await getSessionFromCookie();
  const router = useRouter();
  const [owned, setOwned] = useState<Note[]>([]);
  const [, setShared] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Note | null>(null);
  const [, setError] = useState<string | null>(null);
  const [notLoggedIn, setNotLoggedIn] = useState(false);
  const [, setDeleting] = useState<number | null>(null);
  const [, setLoggingOut] = useState(false);
  const {lang } = useLanguage();

  // if (!session) {
  //   router.push("/TeamNoteTakingApp");
  // }
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

const ownedFiltered = query.trim()
    ? owned.filter((n) =>
        (n.title + " " + n.content).toLowerCase().includes(query.trim().toLowerCase())
      )
    : owned;

// const sharedFiltered = query.trim()
//     ?shared.filter((m) =>
//         (m.title + " " + m.content).toLowerCase().includes(query.trim().toLowerCase())
//       )
//     : shared; 
    

  // async function handleDelete(id: number) {
  //   if (!confirm("Delete note?")) return;
  //   setDeleting(id);
  //   try {
  //     const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
  //     if (!res.ok) {
  //       const err = await res.json().catch(() => ({ error: "Unknown" }));
  //       alert(err.error || "Failed to delete");
  //       return;
  //     }
  //     setOwned((prev) => prev.filter((n) => n.id !== id));
  //     setShared((prev) => prev.filter((n) => n.id !== id));
  //   } catch (err) {
  //     console.error(err);
  //     alert("Network error");
  //   } finally {
  //     setDeleting(null);
  //   }
  // }

  async function handleTrash(noteId: number) {
  if (!confirm("Move this note to Trash?")) return;

  setDeleting(noteId); // you already have this state

  try {
    const res = await fetch(`/api/notes/${noteId}/trash`, { method: "POST" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Unknown" }));
      alert(err.error || "Failed to move to trash");
      return;
    }

    // Remove note from local lists so UI updates without refresh
    setOwned((prev) => prev.filter((n) => n.id !== noteId));
    setShared((prev) => prev.filter((n) => n.id !== noteId));

    // If the trashed note was the active preview, close it
    setActive((prev) => (prev && prev.id === noteId ? null : prev));
  } catch (err) {
    console.error("trash error:", err);
    alert("Network error");
  } finally {
    setDeleting(null);
  }
}


  
  // async function handleLogout() {
  //   setLoggingOut(true);
  //   try {
  //     const res = await fetch("/api/logout", { method: "POST" });
  //     if (res.ok) {
  //       // redirect to login
  //       router.push("/TeamNoteTakingApp");
  //     } else {
  //       alert("Failed to logout");
  //       setLoggingOut(false);
  //     }
  //   } catch (err) {
  //     console.error(err);
  //     alert("Network error");
  //     setLoggingOut(false);
  //   }
  // }

  return (
    <main className={styles.dashboard}>
      
      {/* Sidebar */}
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

      {/* Notes list */}
      <section className={styles.listPane}>
        <div className={styles.listHeader}>
          <input
            className={styles.search}
            placeholder={lang === "en" ? "Search Note" : "搜索笔记"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className={styles.list}>
          {loading ? (
            <div className={styles.noteMeta}>{lang === "en" ? "Loading notes…" : "正在加载"}</div>
          ) : ownedFiltered.length === 0 ? (
            <div className={styles.noteMeta}>{lang === "en" ? "No Notes" : "没有笔记"}</div>
          ) : (
            ownedFiltered.map((n) => (
              <div
                key={n.id}
                className={styles.noteItem}
                onClick={() => setActive(n)}
                role="button"
              >
                <h3 className={styles.noteTitle}>{n.title || "Untitled"}</h3>
                <div className={styles.notePreview}>
                  <RenderHtmlClient
                    html={n.content || "<p>No content</p>"}
                    className="quill-content"
                  />
                </div>
                {n.tags && n.tags.length > 0 && (
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "8px" }}>
                  {n.tags.map((t) => (
                    <span key={t.tag.id} style={{
                      backgroundColor: "#e0e7ff",
                      color: "#3730a3",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: "500"
                    }}>
                      #{t.tag.name}
                    </span>
                  ))}
                </div>
              )}


                <div className={styles.noteMeta}>
                  {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                </div>
              </div>
            ))
            
          )}
        </div>

        {/* <div>
          <h4 style={{ margin: "8px 0" }}>Shared With Me</h4>
          {sharedFiltered.length === 0 ? (
            <div className={styles.noteMeta}>No shared notes</div>
          ) : (
            sharedFiltered.map((m) => (
              <div key={`shared-${m.id}`} className={styles.noteItem} onClick={() => setActive(m)} role="button">
                <h3 className={styles.noteTitle}>{m.title || "Untitled"}</h3>
                <div className={styles.notePreview}>{m.content || "No content"}</div>
                <div className={styles.noteMeta}>{m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}</div>
              </div>
            ))
          )}
        </div> */}
      </section>

      {/* Content preview (right) */}
      <section className={styles.contentPane}>
        <div className={styles.contentHeader}>
          <div className={styles.contentTitle}>
            {active?.title || (lang === "en" ? "Select a note" : "选择一个笔记")}
          </div>
          {active && (
            <div className={styles.row}>
              <Link href={`/TeamNoteTakingApp/note/${active.id}`}>
                {lang === "en" ? "Edit" : "编辑"}
              </Link>
              <button className={styles.row} onClick={() => handleTrash(active.id)} style={{ color: "#ff6b6b" }}>
                {lang === "en" ? "Delete" : "删除"}
              </button>
            </div>
          )}
        </div>
        <div className={styles.contentBody}>
          {!active ? (
            <div className={styles.emptyState}>{lang === "en" ? "Choose a note from the list to view its contents." : "从旁边选择一个笔记来查看"}</div>
          ) : (
            <div className={styles.surface}>
              <RenderHtmlClient
                html={active.content || "<p>No content</p>"}
                className="quill-content"
              />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
