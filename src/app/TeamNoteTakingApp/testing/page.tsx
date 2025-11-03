// import { useEffect, useState } from 'react';

// export default function Testing(){

//     const [email, setEmail] = useState('');

//     async function fetchTesting{
//         setEmail(Post.email)
//     }
// return (
//     <main>
// <ul>
//         {Post.map(note => (
//           <li key={note.id} className="border-b py-2">
//             <strong>{note.title}</strong> — {note.content}
//           </li>
//         ))}
//       </ul>
// </main>
//     )
// }


// import { prisma } from "@/lib/prisma";

// export default async function Testing() {
//   const email = ""
//   const posts = await prisma.post.findMany();

//   return (
//     <main>
//       <h1>All Posts</h1>
//       {posts.map((post) => (
//         <p>{post.email}</p>
//       ))}
//       <ul>
//         {posts.map((post) => (
//         <li key={post.id}>
//           <b>{post.email}</b></li>
//         ))} 

//         {posts.map((post) => (
//           <li key={post.id}>
//             <b>{post.email}</b> — {post.password}
//           </li>
//         ))}
//       </ul>
//     </main>
//   );
// }
// src/app/page.tsx
// app/testing/page.tsx
"use client";
import { useState } from "react";

export default function Testing() {
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState<any[]>([]);
  const [raw, setRaw] = useState<string>("");
  const [status, setStatus] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotes([]);
    setRaw("");
    setStatus(null);

    try {
      const res = await fetch("/api/testing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      setStatus(res.status);
      const text = await res.text();
      setRaw(text);

      // 试着 parse JSON，如果失败就抛出，方便看内容
      let data;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (parseErr) {
        // throw new Error("Invalid JSON response: " + parseErr.message);
      }

      if (!res.ok) {
        throw new Error(data?.error || `Request failed with status ${res.status}`);
      }

      setNotes(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message || "Unknown error");
    }
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Find Notes by Email</h1>

      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email"
          className="border px-2 py-1 mr-2"
        />
        <button type="submit" className="bg-blue-500 text-white px-3 py-1 rounded">
          Search
        </button>
      </form>

      {/* <div className="mb-4">
        
        <pre style={{ whiteSpace: "pre-wrap", background: "#f3f3f3", padding: 8 }}>{raw || "—"}</pre>
        {error && <div style={{ color: "red" }}><b>Error:</b> {error}</div>}
      </div> */}

      <div>
        <h2 className="text-xl font-semibold mb-2">Notes</h2>
        {notes.length > 0 ? (
          <ul className="list-disc ml-6">
            {notes.map((n: any) => (
              <li key={n.id}>
                <b>{n.title}</b> — {n.content}
              </li>
            ))}
          </ul>
        ) : (
          <p>No notes found.</p>
        )}
      </div>
    </main>
  );
}
