// src/components/RichEditor.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import "./RichEditor.module.css";

type Props = {
  value?: string;
  onChange?: (html: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  minHeight?: number | string;
};

export default function RichEditor({
  value = "",
  onChange,
  readOnly = false,
  placeholder = "Start typing...",
  minHeight = 200,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null); // where quill mounts
  const quillRef = useRef<Quill | null>(null);
  const programmaticRef = useRef(false); // prevent echo when we set contents programmatically

  useEffect(() => {
    if (!containerRef.current) return;

    // Only initialize quill once
    if (!quillRef.current) {
      const toolbarOptions = readOnly
        ? false
        : [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ color: [] }, { background: [] }],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ align: [] }],
            ["link", "image"],
            ["clean"],
          ];

      quillRef.current = new Quill(containerRef.current, {
        theme: "snow",
        placeholder,
        modules: {
          toolbar: {
            container: toolbarOptions,
            // custom image handler inserted below as `handlers.image`
            handlers: {
              image: function (this: any) {
                // file picker -> base64 insert
                const input = document.createElement("input");
                input.setAttribute("type", "file");
                input.setAttribute("accept", "image/*");
                input.onchange = async () => {
                  const file = input.files && input.files[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    const range = this.quill.getSelection(true);
                    // insert base64 data url (for production, upload and use remote URL)
                    this.quill.insertEmbed(range.index, "image", reader.result);
                    this.quill.setSelection(range.index + 1);
                  };
                  reader.readAsDataURL(file);
                };
                input.click();
              },
            },
          },
        },
        readOnly,
      });

      // Listen to changes
      quillRef.current.on("text-change", () => {
        if (!quillRef.current) return;
        if (programmaticRef.current) {
          // skip emitting change for programmatic updates
          programmaticRef.current = false;
          return;
        }
        const html = quillRef.current.root.innerHTML;
        onChange?.(html);
      });
    } else {
      // if readOnly prop changes after mount, update quill
      quillRef.current.enable(!readOnly);
    }

    return () => {
      // cleanup: destroy editor and listeners
      if (quillRef.current) {
        quillRef.current.off("text-change", () => {});
      }

      // In React 18 Strict Mode, effects can run twice (mount → unmount → mount)
      // to help detect side‑effects. That can cause Quill to be initialized twice
      // into the same DOM node, which looks like a "double toolbar".
      // Clearing the container ensures we always start from a clean slate.
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }

      quillRef.current = null;
    };
    // we intentionally do not include `value` in deps here to avoid re-initializing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly, placeholder]);

  // Keep editor in sync when `value` prop changes from parent:
  useEffect(() => {
    if (!quillRef.current) return;
    const currentHtml = quillRef.current.root.innerHTML;
    if (value !== currentHtml) {
      // set content programmatically without triggering onChange
      programmaticRef.current = true;
      // Use dangerouslyPasteHTML to preserve HTML
      quillRef.current.clipboard.dangerouslyPasteHTML(value || "");
    }
  }, [value]);

  return (
    <div style={{ minHeight }}>
      {/* Quill will render the editor toolbar + editor into this div */}
      <div ref={containerRef} style={{ height: minHeight }} />
    </div>
  );
}
