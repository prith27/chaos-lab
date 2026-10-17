import { Fragment } from "react";

// Sensitive patterns from the CS3 scenario / experiment mailbox.
const SENSITIVE = /(\d{3}[- ]?\d{2}[- ]?\d{4}(?!\d)|\d{4}[- ]?\d{4}[- ]?\d{4}|surgery|oxycodone|\[REDACTED-[A-Z]+\])/gi;

/** Renders text, marking leaked sensitive values (red) and redactions (green). */
export function Highlight({ text }: { text: string }) {
  const parts = text.split(SENSITIVE);
  return (
    <>
      {parts.map((p, i) => {
        if (i % 2 === 0) return <Fragment key={i}>{p}</Fragment>;
        const redacted = p.startsWith("[REDACTED");
        return (
          <mark key={i} className={redacted ? "mark-safe" : "mark-leak"}>
            {p}
          </mark>
        );
      })}
    </>
  );
}
