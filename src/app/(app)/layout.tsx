import { Logo } from "@/components/Logo";
import { NavLinks } from "@/components/NavLinks";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-5 pb-24 md:pb-8">
      <header className="flex items-center justify-between py-5">
        <Logo href="/discover" />
        <div className="hidden md:block"><NavLinks /></div>
        <form action="/auth/signout" method="post">
          <button className="text-sm font-medium text-muted hover:text-ink">Sign out</button>
        </form>
      </header>
      <main className="flex-1">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 border-t border-line bg-cream/95 px-5 py-3 backdrop-blur md:hidden">
        <NavLinks />
      </nav>
    </div>
  );
}
