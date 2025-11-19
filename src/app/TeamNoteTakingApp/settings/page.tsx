"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./settingspage.module.css";
import styles2 from "../login&register.module.css";

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
  const [isLoading, setIsLoading] = useState(false);
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
     <main className={styles.settingsContainer}>
      <div className={styles.settingsCard}>
        {/* Back button */}
        <button
          className={styles2.backButton}
          onClick={() => router.back()}
          disabled={isLoading}
          aria-label="Back"
        >
          ←
        </button>

        <h1 className={styles.settingsTitle}>Settings</h1>

        <button
          onClick={handleLogout}
          disabled={loading}
          className={styles.logoutButton}
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
      </div>
    </main>
  );
}
