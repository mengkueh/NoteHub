// src/components/ShareByEmail.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import {useLanguage} from "@/app/TeamNoteTakingApp/context/LanguageContext"

export default function ShareByEmail({
  noteId,
  onDone,
}: {
  noteId: string;
  onDone?: (accesses: any[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [loading, setLoading] = useState(false);
  const {lang, setLang } = useLanguage();

  async function handleShare() {
    if (!email.trim()) return alert("Please enter an email.");
    setLoading(true);
    try {
      const res = await fetch(`/api/notes/${noteId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), role }),
      });
      const data = await res.json().catch(() => ({ error: "Invalid response" }));
      if (!res.ok) {
        alert(data?.error || "Failed to share");
      } else {
        alert("Access granted.");
        setEmail("");
        setOpen(false);
        if (onDone) onDone(data.accesses ?? []);
      }
    } catch (err) {
      console.error("share error:", err);
      alert("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ padding: "6px 10px", borderRadius: 6 }}>
        {lang === "en" ? "Invite" : "邀请用户"}
      </button>

      {open && (
        <div style={{
          position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.4)", zIndex: 9999
        }}>
          <div style={{ width: 420, padding: 16, borderRadius: 8, background: "#fff" }}>
            <h3 style={{ margin: 0 }}>{lang === "en" ? "Invite User By Email" : "请通过邮箱地址邀请"}</h3>
            <p style={{ marginTop: 8 }}>{lang === "en" ? "Enter the email of the user (must be registered)." : "请输入用户的邮箱地址 (请确保该用户已注册)"}</p>

            <input
              type="email"
              placeholder="invitee@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", padding: 8, marginBottom: 8 }}
            />

            <div style={{ marginBottom: 12 }}>
              <label style={{ marginRight: 8 }}>
                <input type="radio" checked={role === "editor"} onChange={() => setRole("editor")} /> {lang === "en" ? "Editor" : "编辑"}
              </label>
              <label>
                <input type="radio" checked={role === "viewer"} onChange={() => setRole("viewer")} /> {lang === "en" ? "Viewer" : "查看者"}
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setOpen(false)} disabled={loading}>{lang === "en" ? "Cancel" : "取消"}</button>
              <button onClick={handleShare} disabled={loading}>
                {loading ? (lang === "en" ? "Sharing..." : "分享中...") : (lang === "en" ? "Share" : "分享")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
