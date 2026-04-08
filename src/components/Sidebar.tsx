"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

// SVG Icons
const HomeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const PlusSquareIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M8 12h8" />
    <path d="M12 8v8" />
  </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MenuIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStart === null) return;

      const touchEnd = e.changedTouches[0].clientX;
      const diff = touchStart - touchEnd;
      const threshold = 50;

      // Left edge swipe to open (start < 20px from left edge)
      if (!isOpen && touchStart < 20 && diff < -threshold) {
        onToggle();
      }
      // Swipe left to close
      else if (isOpen && diff > threshold) {
        onToggle();
      }

      setTouchStart(null);
    },
    [touchStart, isOpen, onToggle]
  );

  const navItems = [
    { icon: HomeIcon, label: "Home", href: "/", active: pathname === "/" },
    { icon: UserIcon, label: "Profile", href: "/profile", active: pathname === "/profile" },
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[39] transition-opacity"
          onClick={onToggle}
        />
      )}

      {/* Touch area for left edge swipe */}
      <div
        className="fixed left-0 top-0 w-[20px] h-full z-[35] md:hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-zinc-900 border-r border-zinc-800 z-[40] transition-all duration-300 ease-out ${
          isOpen ? "w-[233px] translate-x-0" : "w-[55px] -translate-x-full md:translate-x-0"
        }`}
        style={{ paddingTop: "55px" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Toggle button - X when open (top right) */}
        {isOpen && (
          <button
            onClick={onToggle}
            className="absolute top-[13px] right-[13px] p-[8px] text-zinc-400 hover:text-zinc-200 transition-colors z-[41]"
            aria-label="Close sidebar"
          >
            <XIcon className="w-[21px] h-[21px]" />
          </button>
        )}

        <div className="flex flex-col h-full py-[13px]">
          {/* New Post Button */}
          <div className="px-[13px] mb-[13px]">
            <button
              onClick={() => {
                // TODO: Open post modal
                console.log("New post clicked");
              }}
              className={`flex items-center gap-[13px] w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-[8px] transition-all ${
                isOpen ? "px-[13px] py-[13px]" : "justify-center p-[13px]"
              }`}
            >
              <PlusSquareIcon className="w-[21px] h-[21px]" />
              {isOpen && <span className="font-medium text-sm">New Post</span>}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 space-y-[8px] px-[13px]">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-[13px] rounded-[8px] transition-colors ${
                    item.active
                      ? "bg-zinc-800 text-emerald-400"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  } ${isOpen ? "px-[13px] py-[13px]" : "justify-center p-[13px]"}`}
                >
                  <Icon className="w-[21px] h-[21px]" />
                  {isOpen && <span className="font-medium text-sm">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Desktop toggle button - fixed position, always visible when closed (md and up) */}
      {!isOpen && !isMobile && (
        <button
          onClick={onToggle}
          className="fixed top-[13px] left-[13px] z-[45] p-[8px] bg-zinc-900 border border-zinc-800 rounded-[8px] text-zinc-400 hover:text-zinc-200 transition-colors hidden md:block"
          aria-label="Open sidebar"
        >
          <MenuIcon className="w-[21px] h-[21px]" />
        </button>
      )}
    </>
  );
}
