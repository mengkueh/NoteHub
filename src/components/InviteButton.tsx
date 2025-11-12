"use client";

import { useState } from "react";
import InviteModal from "./InviteModal";

export default function InviteButton({ noteId }: { noteId: number }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ padding: "8px 12px", borderRadius: 6 }}>
        Invite
      </button>

      {open && (
        <InviteModal
          noteId={noteId}
          onClose={() => setOpen(false)}
          onSent={() => {
            // optional: refresh or show toast
            console.log("Invite sent for note", noteId);
          }}
        />
      )}
    </>
  );
}
