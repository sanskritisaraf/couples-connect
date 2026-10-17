"use client";

import { useRouter } from "next/navigation";

export function CityFilter({ value, options }: { value: string; options: string[] }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted">City</span>
      <select
        className="field w-auto py-2"
        value={value || "all"}
        onChange={(e) => router.push(`/discover?city=${encodeURIComponent(e.target.value)}`)}
      >
        <option value="all">All cities</option>
        {options.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    </label>
  );
}
