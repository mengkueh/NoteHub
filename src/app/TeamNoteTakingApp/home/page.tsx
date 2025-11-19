"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { useLockBodyScroll } from "../useLockBodyScroll";

type Note = { id: number; title: string; content: string; createdAt?: string };

export default function Dashboard() {
  const router = useRouter();
  const [owned, setOwned] = useState<Note[]>([]);
  const [shared, setShared] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Note | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notLoggedIn, setNotLoggedIn] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

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

const sharedFiltered = query.trim()
    ?shared.filter((m) =>
        (m.title + " " + m.content).toLowerCase().includes(query.trim().toLowerCase())
      )
    : shared; 
    

  async function handleDelete(id: number) {
    if (!confirm("Delete note?")) return;
    setDeleting(id);
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
    } finally {
      setDeleting(null);
    }
  }
  
  async function handleLogout() {
    setLoggingOut(true);
    try {
      const res = await fetch("/api/logout", { method: "POST" });
      if (res.ok) {
        // redirect to login
        router.push("/TeamNoteTakingApp");
      } else {
        alert("Failed to logout");
        setLoggingOut(false);
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
      setLoggingOut(false);
    }
  }

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

      {/* Notes list */}
      <section className={styles.listPane}>
        <div className={styles.listHeader}>
          <input
            className={styles.search}
            placeholder="Search all notes"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className={styles.list}>
          {loading ? (
            <div className={styles.noteMeta}>Loading notes…</div>
          ) : ownedFiltered.length === 0 ? (
            <div className={styles.noteMeta}>No notes</div>
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
                  {n.content || "No content"}
                </div>
                <div className={styles.noteMeta}>
                  {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                </div>
              </div>
            ))
            
          )}
        </div>

        <div>
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
              </div>
      </section>

      {/* Content preview (right) */}
      <section className={styles.contentPane}>
        <div className={styles.contentHeader}>
          <div className={styles.contentTitle}>
            {active?.title || "Select a note"}
          </div>
          {active && (
            <div className={styles.row}>
              <Link href={`/TeamNoteTakingApp/note/${active.id}`}>
                Edit
              </Link>
              <button onClick={() => handleDelete(active.id)} disabled={deleting === active.id} style={{ color: "#ff6b6b", cursor: deleting === active.id ? 'wait' : 'pointer' }}>
                {deleting === active.id ? "Deleting…" : "Delete"}
              </button>
            </div>
          )}
        </div>
        <div className={styles.contentBody}>
          {!active ? (
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
