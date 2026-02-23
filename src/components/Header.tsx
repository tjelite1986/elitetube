"use client";
import { useRouter, usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const isAdult = pathname.startsWith("/adult");
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-yt-bg border-b border-yt-border h-14 flex items-center px-3 gap-2">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-1.5 shrink-0">
        <span className="text-yt-red font-bold text-2xl leading-none">▶</span>
        <span className="text-yt-text font-bold text-lg hidden sm:inline">EliteTube</span>
      </Link>

      {/* Desktop sökfält */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value.trim();
          if (q) router.push(`${isAdult ? "/adult/search" : "/search"}?q=${encodeURIComponent(q)}`);
        }}
        className="hidden sm:flex flex-1 max-w-xl mx-4 gap-0"
      >
        <input
          name="q"
          type="text"
          placeholder="Sök..."
          className="flex-1 bg-yt-surface border border-yt-border rounded-l-full px-4 py-2 text-sm text-yt-text placeholder-yt-muted focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          className="bg-yt-surface2 border border-yt-border border-l-0 rounded-r-full px-5 py-2 hover:bg-yt-hover transition-colors"
        >
          <IconSearch className="w-4 h-4 text-yt-muted" />
        </button>
      </form>

      {/* Spacer på mobil */}
      <div className="flex-1 sm:hidden" />

      {/* Ikonknappar */}
      <div className="flex items-center shrink-0">
        {/* Sök-ikon — bara mobil */}
        <Link
          href={isAdult ? "/adult/search" : "/search"}
          className="sm:hidden p-2 text-yt-muted hover:text-yt-text transition-colors rounded-full hover:bg-yt-hover"
          aria-label="Sök"
        >
          <IconSearch className="w-5 h-5" />
        </Link>

        {/* Admin */}
        {role === "admin" && (
          <Link
            href="/admin"
            className="p-2 text-yt-muted hover:text-yt-text transition-colors rounded-full hover:bg-yt-hover"
            aria-label="Admin"
          >
            <IconSettings className="w-5 h-5" />
          </Link>
        )}

        {/* Logga ut */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="p-2 text-yt-muted hover:text-yt-text transition-colors rounded-full hover:bg-yt-hover"
          aria-label="Logga ut"
        >
          <IconLogout className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function IconSettings({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconLogout({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}
