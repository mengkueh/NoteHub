"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./settingspage.module.css";
import styles2 from "../login&register.module.css";
import { useLanguage } from "../context/LanguageContext"

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
  const [isLoading] = useState(false);
  const [items, setItems] = useState<TrashedNote[]>([]);
  const {lang, setLang } = useLanguage();
 
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

        <h1 className={styles.settingsTitle}>{lang === "en" ? "Setting" : "设置"}</h1>

        <button
          onClick={handleLogout}
          disabled={loading}
          className={styles.logoutButton}
        >
          {loading ? (lang === "en" ? "Loggin Out..." : "正在登出") : (lang === "en" ? "Logout" : "登出")}
        </button>
        <div>
      <h2>{lang === "en" ? "Recently Deleted Trash" : "最近删除的笔记"}</h2>
      {items.length === 0 ? <div>{lang === "en" ? "No Recently Deleted Notes." : "没有最近删除的笔记"}</div> : null}
      <ul>
        {items.map((it) => (
          <li key={it.id}>
            <b>{it.title}</b> {lang === "en" ? "- Deleted At: " : "- 删除日期"} {new Date(it.deletedAt).toLocaleString()} {lang === "en" ? "- Purges In" : "删除倒数"} {it.daysLeft} day(s)
            <div>
              <button onClick={() => restore(it.id)}>{lang === "en" ? "Restore" : "恢复"}</button>
              <button onClick={() => permanentDelete(it.id)}>{lang === "en" ? "Delete Permanently" : "永久删除"}</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
      </div>
      <div>
        <h1>{lang === "en" ? "Home" : "主页"}</h1>

      <button onClick={() => setLang("en")}>English</button>
      <button onClick={() => setLang("zh")}>中文</button>
      </div>
    </main>
  );
}
