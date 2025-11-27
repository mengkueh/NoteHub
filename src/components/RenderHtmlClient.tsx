// src/components/RenderHtmlClient.tsx
"use client";

import DOMPurify from "dompurify";

type Props = { html: string; className?: string };

export default function RenderHtmlClient({ html, className }: Props) {
  const clean = DOMPurify.sanitize(html || "");
  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}
