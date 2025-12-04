// src/components/EditMembers.tsx
"use client";

import React, { useState } from "react";
import mainStyles from "@/app/TeamNoteTakingApp/home/main.module.css";
import { useLanguage } from "@/app/TeamNoteTakingApp/context/LanguageContext";

type Access = {
  id: number;
  role: "viewer" | "editor";
  user: { id: string; email: string; displayName?: string | null };
};

export default function EditMembers({
  open,
  onClose,
  noteId,
  ownerEmail,
  accesses,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  noteId: string | number;
  ownerEmail?: string;
  accesses: Access[]; // includes all accesses (including owner maybe) — component will ignore owner for edits
  onDone?: () => void; // called after success so parent can refresh
}) {
  const [localAccesses, setLocalAccesses] = useState<Access[]>(accesses ?? []);
  const [busyFor, setBusyFor] = useState<string | null>(null); // userId busy
  const { lang } = useLanguage();
  React.useEffect(() => setLocalAccesses(accesses ?? []), [accesses]);

  if (!open) return null;

  async function changeRole(userId: string, newRole: "viewer" | "editor") {
    if (!confirm(`Change role of ${userId} → ${newRole}?`)) return;
    setBusyFor(userId);
    try {
      const res = await fetch(`/api/notes/${noteId}/accesses`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: "Unknown" }));
        alert(e.error || "Failed to change role");
        return;
      }
      // optimistic update
      setLocalAccesses((prev) => prev.map((a) => (a.user.id === userId ? { ...a, role: newRole } : a)));
      onDone?.();
    } catch (err) {
      console.error("changeRole err:", err);
      alert("Network error");
    } finally {
      setBusyFor(null);
    }
  }

  async function removeMember(userId: string) {
    if (!confirm(`Remove ${userId} from this note?`)) return;
    setBusyFor(userId);
    try {
      const res = await fetch(`/api/notes/${noteId}/accesses`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: "Unknown" }));
        alert(e.error || "Failed to remove member");
        return;
      }
      // optimistic remove
      setLocalAccesses((prev) => prev.filter((a) => a.user.id !== userId));
      onDone?.();
    } catch (err) {
      console.error("removeMember err:", err);
      alert("Network error");
    } finally {
      setBusyFor(null);
    }
  }

  return (
    <div className={mainStyles.modalOverlay}>
      <div className={mainStyles.modalCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 className={mainStyles.modalTitle}>{lang === "en" ? "Edit Members" : "编辑队员"}</h3>
          <div>
            <button onClick={onClose} className={`${mainStyles.button} ${mainStyles.buttonPrimary}`}>{lang === "en" ? "Close" : "关闭"}</button>
          </div>
        </div>

        <div style={{ marginBottom: 8 }}>
          <strong>{lang === "en" ? "Owner" : "作者"}</strong>
          <div className={mainStyles.modalTitle}>
            - {ownerEmail ?? "Unknown"}
          </div>
        </div>

        <div>
          <strong>{lang === "en" ? "Collaborators" : "共享者"}</strong>
          {localAccesses.length === 0 ? (
            <div style={{ marginTop: 8 }}>No collaborators</div>
          ) : (
            <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
              {localAccesses.map((a) => {
                // skip owner entry if present
                const email = a.user?.email ?? a.user?.id;
                if (email === ownerEmail) return null;
                return (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>- {a.user.displayName ?? email}</div>
                      
                    </div>

                    <div>
                      <select
                        value={a.role}
                        disabled={busyFor !== null}
                        onChange={(e) => changeRole(a.user.id, e.target.value as "viewer" | "editor")}
                      >
                        <option value="viewer">{lang === "en" ? "View Only" : "只能查看"}</option>
                        <option value="editor">{lang === "en" ? "Editor" : "编辑"}</option>
                      </select>
                    </div>

                    <div>
                      <button
                        onClick={() => removeMember(a.user.id)}
                        disabled={busyFor !== null}
                        style={{ color: "#fff", background: "#ff6b6b", border: "none", padding: "6px 10px", borderRadius: 6 }}
                      >
                        {lang === "en" ? "Remove" : "移除"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ marginTop: 16, textAlign: "right" }}>
          <button onClick={onClose} style={{ padding: "6px 10px" }}>{lang === "en" ? "Done" : "完成"}</button>
        </div>
      </div>
    </div>
  );
}
