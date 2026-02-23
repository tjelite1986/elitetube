"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const CATEGORIES = ["Animation", "Film", "Musik", "Dokumentär", "Sport", "Gaming", "Utbildning"];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const onAdultPath = pathname.startsWith("/adult");

  // Initialt värde baserat på nuvarande stig (undviker hydration-mismatch)
  const [adultMode, setAdultMode] = useState(onAdultPath);

  useEffect(() => {
    if (onAdultPath) {
      // Gick in i adult-läge — spara i sessionStorage
      sessionStorage.setItem("adultMode", "1");
      setAdultMode(true);
    } else {
      // Annan sida — läs sessionStorage
      setAdultMode(sessionStorage.getItem("adultMode") === "1");
    }
  }, [onAdultPath]);

  const exitAdultMode = useCallback(() => {
    sessionStorage.removeItem("adultMode");
    setAdultMode(false);
    router.push("/");
  }, [router]);

  const isAdult = adultMode;

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="fixed left-0 top-14 bottom-0 w-56 bg-yt-bg overflow-y-auto py-3 hidden lg:block border-r border-yt-border">
        {isAdult ? (
          /* Adult-läge desktop */
          <nav className="flex flex-col gap-1 px-2">
            {/* 18+-banner */}
            <div className="mx-2 mb-3 px-3 py-2 bg-red-950 border border-red-800 rounded-lg flex items-center gap-2">
              <span className="text-red-400 text-xs font-bold">18+ LÄGE</span>
            </div>
            <SidebarLink href="/adult" label="Hem" icon={<IconHome />} active={pathname === "/adult"} />
            <SidebarLink href="/adult/search" label="Sök" icon={<IconSearch />} active={pathname.startsWith("/adult/search")} />
            <SidebarLink href="/playlists" label="Spellistor" icon={<IconPlaylist />} active={false} />
            <div className="my-3 border-t border-yt-border" />
            <button
              onClick={exitAdultMode}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-yt-muted hover:bg-yt-hover hover:text-yt-text transition-colors w-full text-left"
            >
              <span className="w-5 h-5 shrink-0"><IconExit /></span>
              <span>Tillbaka till normalt</span>
            </button>
          </nav>
        ) : (
          /* Normalt läge desktop */
          <nav className="flex flex-col gap-1 px-2">
            <SidebarLink href="/" label="Hem" icon={<IconHome />} active={pathname === "/"} />
            <SidebarLink href="/search" label="Utforska" icon={<IconSearch />} active={pathname === "/search"} />
            <SidebarLink href="/playlists" label="Mina playlists" icon={<IconPlaylist />} active={pathname.startsWith("/playlists")} />
            <div className="my-3 border-t border-yt-border" />
            <SidebarLink href="/adult" label="18+" icon={<IconAdult />} active={false} />
            <div className="my-3 border-t border-yt-border" />
            <p className="text-xs text-yt-muted px-3 py-1 uppercase tracking-wider">Kategorier</p>
            {CATEGORIES.map((cat) => (
              <SidebarLink
                key={cat}
                href={`/?category=${encodeURIComponent(cat)}`}
                label={cat}
                icon={<IconPlay />}
                active={false}
              />
            ))}
          </nav>
        )}
      </aside>

      {/* ── Mobil bottom nav ── */}
      {isAdult ? (
        /* Adult-läge mobil */
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-yt-bg border-t-2 border-red-700 flex lg:hidden h-14">
          <MobileNavItem href="/adult" label="Hem" icon={<IconHome />} active={pathname === "/adult"} adult />
          <MobileNavItem href="/adult/search" label="Sök" icon={<IconSearch />} active={pathname.startsWith("/adult/search")} adult />
          <MobileNavItem href="/playlists" label="Spellistor" icon={<IconPlaylist />} active={false} adult />
          <MobileNavExitItem onClick={exitAdultMode} />
        </nav>
      ) : (
        /* Normalt läge mobil */
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-yt-bg border-t border-yt-border flex lg:hidden h-14">
          <MobileNavItem href="/" label="Hem" icon={<IconHome />} active={pathname === "/"} />
          <MobileNavItem href="/search" label="Utforska" icon={<IconSearch />} active={pathname.startsWith("/search")} />
          <MobileNavItem href="/playlists" label="Spellistor" icon={<IconPlaylist />} active={pathname.startsWith("/playlists")} />
          <MobileNavItem href="/adult" label="18+" icon={<IconAdult />} active={false} />
        </nav>
      )}
    </>
  );
}

/* ── Komponenter ── */

function MobileNavExitItem({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors text-yt-muted"
    >
      <span className="w-6 h-6"><IconExit /></span>
      <span className="text-[10px] font-medium">Avsluta</span>
    </button>
  );
}

function MobileNavItem({
  href, label, icon, active, adult,
}: {
  href: string; label: string; icon: React.ReactNode;
  active: boolean; adult?: boolean;
}) {
  const color = active
    ? adult ? "text-red-400" : "text-white"
    : adult ? "text-red-600" : "text-yt-muted";

  return (
    <Link
      href={href}
      className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${color}`}
    >
      <span className="w-6 h-6">{icon}</span>
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}


function SidebarLink({
  href, label, icon, active, muted,
}: {
  href: string; label: string; icon: React.ReactNode; active: boolean; muted?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
        active
          ? "bg-yt-surface text-yt-text font-medium"
          : muted
            ? "text-yt-muted hover:bg-yt-hover hover:text-yt-text"
            : "text-yt-muted hover:bg-yt-hover hover:text-yt-text"
      }`}
    >
      <span className="w-5 h-5 shrink-0">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

/* ── SVG-ikoner ── */

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function IconPlaylist() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M3 12h12M3 18h12" />
      <polygon points="16 12 21 9 21 15 16 12" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconAdult() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function IconExit() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
