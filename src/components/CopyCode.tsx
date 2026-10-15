"use client";

import { useState } from "react";

export function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
      className="mx-auto mt-6 flex items-center gap-3 rounded-2xl border-2 border-dashed border-clay/50 bg-cream px-6 py-4"
    >
      <span className="font-mono text-3xl font-bold tracking-[0.3em]">{code}</span>
      <span className="text-xs font-semibold text-clay">{copied ? "Copied!" : "Copy"}</span>
    </button>
  );
}
