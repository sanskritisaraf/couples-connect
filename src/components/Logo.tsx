import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2" aria-label="Couples Connect home">
      <svg width="34" height="22" viewBox="0 0 34 22" aria-hidden>
        <circle cx="11" cy="11" r="9" fill="none" stroke="#c8553d" strokeWidth="2.5" />
        <circle cx="23" cy="11" r="9" fill="none" stroke="#5f8466" strokeWidth="2.5" />
      </svg>
      <span className="font-display text-xl font-semibold tracking-tight">Couples Connect</span>
    </Link>
  );
}
