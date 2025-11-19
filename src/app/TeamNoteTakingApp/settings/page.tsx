"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type TrashedNote = {
  id: number;
  title: string;
  content: string;
  deletedAt: string;
  willBePermanentlyDeletedAt: string;
  daysLeft: number;
};


export default function SettingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<TrashedNote[]>([]);
  useEffect(() => {
    fetch("/api/trash")
      .then((r) => r.json())
      .then(setItems)
      .catch((e) => console.error(e));
  }, []);

  async function restore(id: number) {
    const r = await fetch(`/api/notes/${id}/restore`, { method: "POST" });
    if (r.ok) setItems((s) => s.filter((x) => x.id !== id));
    else alert("Restore failed");
  }
  async function permanentDelete(id: number) {
    if (!confirm("Delete permanently? This cannot be undone.")) return;
    const r = await fetch(`/api/notes/${id}/permanent`, { method: "DELETE" });
    if (r.ok) setItems((s) => s.filter((x) => x.id !== id));
    else alert("Permanent delete failed");
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
    <main style={{ padding: 20 }}>
      <h1>Settings</h1>

      <button
        onClick={handleLogout}
        disabled={loading}
        style={{
          padding: "10px 20px",
          backgroundColor: "#f44",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          marginTop: "20px",
        }}
      >
        {loading ? "Logging out..." : "Logout"}
      </button>
      <div>
      <h2>Trash</h2>
      {items.length === 0 ? <div>No recently deleted notes.</div> : null}
      <ul>
        {items.map((it) => (
          <li key={it.id}>
            <b>{it.title}</b> — deleted {new Date(it.deletedAt).toLocaleString()} — purges in {it.daysLeft} day(s)
            <div>
              <button onClick={() => restore(it.id)}>Restore</button>
              <button onClick={() => permanentDelete(it.id)}>Delete permanently</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
    </main>
  );
}
