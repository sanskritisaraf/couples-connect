import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-5 py-24 text-center">
      <h1 className="font-display text-4xl font-semibold">Nothing here</h1>
      <p className="mt-2 text-muted">That page doesn&apos;t exist or isn&apos;t yours to see.</p>
      <Link href="/discover" className="btn-primary mt-6">Back to Discover</Link>
    </main>
  );
}
