"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/discover", label: "Discover" },
  { href: "/matches", label: "Matches" },
  { href: "/profile", label: "Our profile" },
];

export function NavLinks() {
  const path = usePathname();
  return (
    <ul className="flex justify-around gap-1 md:justify-center">
      {LINKS.map((l) => {
        const active = path.startsWith(l.href);
        return (
          <li key={l.href}>
            <Link
              href={l.href}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                active ? "bg-ink text-cream" : "text-muted hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
