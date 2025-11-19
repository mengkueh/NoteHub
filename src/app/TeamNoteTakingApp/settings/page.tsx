"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SettingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
          backgroundColor: "black",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: loading ? "wait" : "pointer",
          marginTop: "20px",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "Logging out..." : "Logout"}
      </button>
    </main>
  );
}
