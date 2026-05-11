"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import PostModal from "./PostModal";

const IconHome = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconPlus = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

export default function MobileNav() {
  const pathname = usePathname();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const { user, openAuthModal } = useAuthStore();

  const openPostModal = () => {
    if (!user) openAuthModal();
    else setIsPostModalOpen(true);
  };

  return (
    <>
      <nav className="mobile-nav">
        <Link href="/" style={{ flex: 1, height: 44, borderRadius: 10, background: "none", border: "none", color: pathname === "/" ? "var(--accent-bright)" : "var(--text-4)", backgroundColor: pathname === "/" ? "rgba(16,185,129,0.10)" : "transparent", display: "grid", placeItems: "center", textDecoration: "none", transition: "color 180ms cubic-bezier(0.22,1,0.36,1), background-color 180ms cubic-bezier(0.22,1,0.36,1), transform 180ms cubic-bezier(0.22,1,0.36,1)" }}>
          <IconHome />
        </Link>
        <button className="new-post" onClick={openPostModal} style={{ flex: "none" }}>
          <IconPlus />
        </button>
        <Link href="/profile" style={{ flex: 1, height: 44, borderRadius: 10, background: "none", border: "none", color: pathname === "/profile" ? "var(--accent-bright)" : "var(--text-4)", backgroundColor: pathname === "/profile" ? "rgba(16,185,129,0.10)" : "transparent", display: "grid", placeItems: "center", textDecoration: "none", transition: "color 180ms cubic-bezier(0.22,1,0.36,1), background-color 180ms cubic-bezier(0.22,1,0.36,1), transform 180ms cubic-bezier(0.22,1,0.36,1)" }}>
          <IconUser />
        </Link>
      </nav>
      <PostModal isOpen={isPostModalOpen} onClose={() => setIsPostModalOpen(false)} />
    </>
  );
}
