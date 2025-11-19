"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./settingspage.module.css";
import styles2 from "../login&register.module.css";


export default function SettingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      </div>
    </main>
  );
}
