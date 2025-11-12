// export default function HelloWorld() {
//   return (
//     <div className="flex items-center justify-center min-h-screen bg-white">
//       <img src="/download.jpg" alt="Hello" className="w-64 h-auto mr-4" />
//       <h1 className="text-4xl font-bold text-black">Hello, World!</h1>
//     </div>
//   );
// }


// app/dashboard/page.tsx
// import { cookies } from "next/headers";
// import { prisma } from "@/lib/prisma";

// export default async function DashboardPage() {
//   try {
//     const cookieStore = await cookies();
//     const sessionCookie = cookieStore.get("session")?.value ?? null;

//     if (!sessionCookie) {
//       return (
//         <main style={{ padding: 20 }}>
//           <h1>Dashboard</h1>
//           <p>Not logged in.</p>
//         </main>
//       );
//     }

//     const notes = await prisma.$transaction(async (tx) => {
//       const session = await tx.session.findUnique({
//         where: { id: sessionCookie },
//         include: { post: true },
//       });

//       if (!session || session.expiresAt < new Date()) {
//         return null;
//       }

//       return tx.note.findMany({
//         where: { postId: session.postId },
//         orderBy: { createdAt: "desc" },
//       });
//     });

//     if (!notes) {
//       return (
//         <main style={{ padding: 20 }}>
//           <h1>Dashboard</h1>
//           <p>Session expired or invalid. Please log in again.</p>
//         </main>
//       );
//     }

//     return (
//       <main style={{ padding: 20 }}>
//         <h1>Dashboard</h1>
//         <p>Welcome, {notes[0].post.email}</p>

//         {notes.length === 0 ? (
//           <p>No notes yet.</p>
//         ) : (
//           <ul>
//             {notes.map((n) => (
//               <li key={n.id}>
//                 <h1>{n.title}</h1> — {n.content}
//               </li>
//             ))}
//           </ul>
//         )}
//       </main>
//     );
//   } catch (error) {
//     console.error("Dashboard error:", error);
//     return (
//       <main style={{ padding: 20 }}>
//         <h1>Dashboard</h1>
//         <p>An error occurred. Please try again later.</p>
//       </main>
//     );
//   }
// }


// src/app/TeamNoteTakingApp/dashboard/page.tsx
// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import Link from "next/link";

// type Note = {
//   id: number; // 如果你的 id 是 string（cuid/uuid），把这里改成 `string`
//   title: string;
//   content: string;
//   createdAt?: string;
// };

// export default function DashboardPage() {
//   const router = useRouter();
//   const [notes, setNotes] = useState<Note[]>([]);
//   const [loadingNotes, setLoadingNotes] = useState<boolean>(true);
//   const [title, setTitle] = useState("");
//   const [content, setContent] = useState("");
//   const [saving, setSaving] = useState(false);

//   // load notes
//   useEffect(() => {
//     let mounted = true;
//     setLoadingNotes(true);
//     fetch("/api/notes")
//       .then(async (res) => {
//         if (res.status === 401) {
//           // not authorized → redirect to login
//           router.push("/TeamNoteTakingApp/login");
//           return [];
//         }
//         if (!res.ok) throw new Error(await res.text());
//         return res.json();
//       })
//       .then((data: Note[] | undefined) => {
//         if (!mounted) return;
//         if (Array.isArray(data)) setNotes(data);
//       })
//       .catch((err) => {
//         console.error("Failed to load notes:", err);
//         setNotes([]);
//       })
//       .finally(() => {
//         if (mounted) setLoadingNotes(false);
//       });

//     return () => {
//       mounted = false;
//     };
//   }, [router]);

//   // add note
//   async function handleAdd() {
//     if (!title.trim() || !content.trim()) {
//       alert("Please enter title and content.");
//       return;
//     }
//     setSaving(true);
//     try {
//       const res = await fetch("/api/notes", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ title: title.trim(), content: content.trim() }),
//       });
//       if (res.status === 401) {
//         router.push("/TeamNoteTakingApp/login");
//         return;
//       }
//       if (!res.ok) {
//         const err = await res.json().catch(() => ({ error: "Unknown" }));
//         alert(err.error || "Failed to add note");
//         return;
//       }
//       const newNote = (await res.json()) as Note;
//       setNotes((prev) => [newNote, ...prev]);
//       setTitle("");
//       setContent("");
//     } catch (err) {
//       console.error("Add note error:", err);
//       alert("Network error");
//     } finally {
//       setSaving(false);
//     }
//   }

//   // delete note
//   async function handleDelete(id: number) {
//     if (!confirm("Delete this note?")) return;
//     try {
//       const res = await fetch("/api/notes", {
//         method: "DELETE",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ id }),
//       });
//       if (res.status === 401) {
//         router.push("/TeamNoteTakingApp/login");
//         return;
//       }
//       if (!res.ok) {
//         const err = await res.json().catch(() => ({ error: "Unknown" }));
//         alert(err.error || "Failed to delete");
//         return;
//       }
//       setNotes((prev) => prev.filter((n) => n.id !== id));
//     } catch (err) {
//       console.error("Delete error:", err);
//       alert("Network error");
//     }
//   }

//   return (
//     <main style={{ padding: 20, maxWidth: 800, margin: "0 auto" }}>
//       <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
//         <h1>NoteHub</h1>
//         <Link href="/TeamNoteTakingApp">Logout</Link>
//       </header>

//     <div style={{display: "grid", gridTemplateColumns: "100px 1fr"}}>
//       <section className='display-flex weight-full'style={{ marginBottom: 24 }}>
//         <h1 className="text-5xl">🔘</h1>
//         <h2>New Note</h2>
//         <input
//           value={title}
//           onChange={(e) => setTitle(e.target.value)}
//           placeholder="Title"
//           style={{ width: "100%", padding: 8, marginBottom: 8 }}
//         />
//         <textarea
//           value={content}
//           onChange={(e) => setContent(e.target.value)}
//           placeholder="Content"
//           rows={4}
//           style={{ width: "100%", padding: 8, marginBottom: 8 }}
//         />
//         <div>
//           <button onClick={handleAdd} disabled={saving}>
//             {saving ? "Saving..." : "Add Note"}
//           </button>
//         </div>
//       </section>

//       <section>
//         <h2>Your Notes</h2>
//         {loadingNotes ? (
//           <p>Loading...</p>
//         ) : notes.length === 0 ? (
//           <p>No notes yet.</p>
//         ) : (
//           <ul style={{display: "inline-grid", gridTemplateColumns: "100px 2fr", listStyle: "none", padding: 0 }}>
//             {notes.map((n) => (
//               <li key={n.id} style={{ border: "1px solid #e5e7eb", padding: 12, marginBottom: 12, borderRadius: 6 }}>
//                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
//                   <div>
//                     <div style={{ fontWeight: 700 }}>{n.title}</div>
//                     <div style={{ marginTop: 6 }}>{n.content}</div>
//                     <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
//                       {n.createdAt ? new Date(n.createdAt).toLocaleString() : null}
//                     </div>
//                   </div>

//                   <div style={{ marginLeft: 12, display: "flex", flexDirection: "column", gap: 8 }}>
//                     <Link href={`/TeamNoteTakingApp/note/${n.id}`}>
//                       <button>Edit</button>
//                     </Link>
//                     <button onClick={() => handleDelete(n.id)} style={{ color: "red" }}>
//                       Delete
//                     </button>
//                   </div>
//                 </div>
//               </li>
//             ))}
//           </ul>
//         )}
//       </section>
//       </div>
//     </main>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

type Note = { id: number; title: string; content: string; createdAt?: string };

export default function Dashboard() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Note | null>(null);

  // load all notes (initially all)
  useEffect(() => {
    setLoading(true);
    fetch("/api/notes")
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data: Note[]) => setNotes(data || []))
      .catch((e) => {
        console.error("load notes err:", e);
        setNotes([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = query.trim()
    ? notes.filter((n) =>
        (n.title + " " + n.content).toLowerCase().includes(query.trim().toLowerCase())
      )
    : notes;

  async function handleDelete(id: number) {
    if (!confirm("Delete note?")) return;
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown" }));
        alert(err.error || "Failed to delete");
        return;
      }
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error(err);
      alert("Network error");
    }
  }

  return (
    <main className={styles.dashboard}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span>NoteHub</span>
          <div className={styles.spacer} />
          <Link href="/TeamNoteTakingApp" className={styles.logoutButton}>Logout</Link>
        </div>
        <div className={styles.sidebarActions}>
          <button className={styles.sidebarButton} onClick={() => router.push("/TeamNoteTakingApp/note/new")}>
            <span>＋</span>
            <span>New Note</span>
          </button>
          <button className={styles.sidebarButton} onClick={() => router.push("/TeamNoteTakingApp/tags")}>
            <span>#</span>
            <span>Tags</span>
          </button>
          <button className={styles.sidebarButton} onClick={() => router.push("/TeamNoteTakingApp/settings")}>
            <span>⚙</span>
            <span>Settings</span>
          </button>
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
            <div className={styles.noteMeta}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div className={styles.noteMeta}>No notes</div>
          ) : (
            filtered.map((n) => (
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
              <button onClick={() => handleDelete(active.id)} style={{ color: "#ff6b6b" }}>
                Delete
              </button>
            </div>
          )}
        </div>
        <div className={styles.contentBody}>
          {active ? (
            active.content
          ) : (
            <div className={styles.emptyState}>Choose a note from the list to view its contents.</div>
          )}
        </div>
      </section>
    </main>
  );
}
