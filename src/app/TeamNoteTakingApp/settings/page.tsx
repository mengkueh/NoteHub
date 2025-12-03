"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./settingspage.module.css";
import registerStyles from "../login&register.module.css";
import mainStyles from "../home/main.module.css";
import { useLanguage } from "../context/LanguageContext";
import Link from "next/link";
import NotLoggedIn from "@/components/NotLoggedIn";

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
  const { lang, setLang } = useLanguage();
  const [notLoggedIn, setNotLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setError(null);
    setNotLoggedIn(false);

    fetch("/api/trash")
      .then(async (r) => {
        if (!mounted) return null;

        if (r.status === 401) {
          // follow the home/page.tsx behaviour: show friendly not-logged-in message
          setNotLoggedIn(true);
          return null;
        }

        if (!r.ok) {
          const txt = await r.text().catch(() => "Failed to load trash");
          throw new Error(txt);
        }

        return r.json();
      })
      .then((data) => {
        if (!mounted || !data) return;
        setItems(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        console.error("load trash err:", e);
        if (mounted) setError((e as Error).message || "Unknown error");
      });

    return () => {
      mounted = false;
    };
  }, [router]);

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
  
  // If we detected no session, show friendly message and link to login (same as home/page.tsx)
  if (notLoggedIn) {
    return <NotLoggedIn />;
  }

  return (
    <main className={styles.settingsContainer}>
      <div className={styles.settingsCard}>
        {/* Back Button */}
        <button
          className={registerStyles.backButton}
          onClick={() => router.back()}
          disabled={isLoading}
          aria-label="Back"
        >
          ←
        </button>

        {/* Title */}
        <h1 className={styles.settingsTitle}>
          {lang === "en" ? "Settings" : "设置"}
        </h1>

        {/* Language Selector */}
        <div className={styles.languageContainer}>
          <label className={styles.sectionTitle}>
            {lang === "en" ? "Language" : "语言"}
          </label>

          <div className={mainStyles.languageToggleGroup}>
            <button
              onClick={() => setLang("en")}
              className={`${mainStyles.languageToggleButton} ${
                lang === "en" ? mainStyles.languageToggleButtonActive : ""
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLang("zh")}
              className={`${mainStyles.languageToggleButton} ${
                lang === "zh" ? mainStyles.languageToggleButtonActive : ""
              }`}
            >
              中文
            </button>
          </div>
        </div>

        {/* Trash List */}
        <div className={styles.trashSection}>
          <label className={styles.sectionTitle}>
            {lang === "en" ? "Recently Deleted Trash" : "最近删除的笔记"}
          </label>

          {items.length === 0 ? (
            <div className={styles.emptyTrashText}>
              {lang === "en"
                ? "No Recently Deleted Notes."
                : "没有最近删除的笔记"}
            </div>
          ) : null}

          <ul className={styles.trashList}>
            {items.map((it) => (
              <li className={styles.trashItem} key={it.id}>
                <div className={styles.trashItemHeader}>
                  <b>{it.title}</b>
                </div>

                <div className={styles.trashMeta}>
                  {lang === "en" ? "Deleted At: " : "删除日期: "}
                  {new Date(it.deletedAt).toLocaleString()}
                  {" • "}
                  {lang === "en" ? "Purges In " : "删除倒数 "}
                  {it.daysLeft} {lang === "en" ? "day(s)" : "天"}
                </div>

                <div className={styles.trashButtons}>
                  <button
                    className={styles.restoreButton}
                    onClick={() => restore(it.id)}
                  >
                    {lang === "en" ? "Restore" : "恢复"}
                  </button>

                  <button
                    className={styles.deleteButton}
                    onClick={() => permanentDelete(it.id)}
                  >
                    {lang === "en" ? "Delete Permanently" : "永久删除"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={loading}
          className={styles.logoutButton}
        >
          {loading
            ? lang === "en"
              ? "Logging Out..."
              : "正在登出"
            : lang === "en"
            ? "Logout"
            : "登出"}
        </button>

      </div>
    </main>
  );
}
