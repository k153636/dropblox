"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, SquarePlus, User, Menu, X } from "lucide-react";
import PostModal from "./PostModal";
import SearchBar from "./SearchBar";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  const openPostModal = () => setIsPostModalOpen(true);
  const closePostModal = () => setIsPostModalOpen(false);

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
    { icon: Home, label: "Home", href: "/", active: pathname === "/" },
    { icon: User, label: "Profile", href: "/profile", active: pathname === "/profile" },
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

      {/* Sidebar - Golden Ratio: Closed 89px, Open 144px (144/89 ≈ 1.618) */}
      <aside
        className={`fixed left-0 top-0 h-full bg-zinc-900/60 backdrop-blur-xl border-r border-white/[0.06] z-[40] transition-all duration-300 ease-out ${
          isOpen ? "w-[144px] translate-x-0" : "w-[89px] -translate-x-full md:translate-x-0"
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
            <X size={21} />
          </button>
        )}

        <div className="flex flex-col h-full py-[13px]">
          {/* New Post Button */}
          <div className="px-[13px] mb-[13px]">
            <button
              onClick={openPostModal}
              className={`flex flex-col items-center justify-center bg-emerald-500/80 hover:bg-emerald-500 backdrop-blur-sm text-white rounded-[8px] transition-all ${
                isOpen && !isMobile
                  ? "w-[89px] h-[89px] gap-[8px] mx-auto p-0"
                  : "w-full min-h-[47px] px-[13px] py-[13px] gap-[13px] flex-row"
              }`}
            >
              <SquarePlus className={`flex-shrink-0 ${isOpen && !isMobile ? "w-[34px] h-[34px]" : "w-[21px] h-[21px]"}`} />
              {isOpen && <span className="font-medium text-xs whitespace-nowrap">New Post</span>}
            </button>
          </div>

          {/* Search Bar */}
          <SearchBar sidebarOpen={isOpen} />

          {/* Navigation Items */}
          <nav className="flex-1 space-y-[8px] px-[13px]">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    // Close sidebar on mobile when navigating
                    if (isMobile && isOpen) {
                      onToggle();
                    }
                  }}
                  className={`flex flex-col items-center justify-center rounded-[8px] transition-colors ${
                    item.active
                      ? "bg-white/[0.08] text-emerald-400"
                      : "text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200"
                  } ${
                    isOpen && !isMobile
                      ? "w-[89px] h-[89px] gap-[8px] mx-auto p-0"
                      : "w-full min-h-[47px] px-[13px] py-[13px] gap-[13px] flex-row"
                  }`}
                >
                  <Icon className={`flex-shrink-0 ${isOpen && !isMobile ? "w-[34px] h-[34px]" : "w-[21px] h-[21px]"}`} />
                  {isOpen && <span className="font-medium text-xs whitespace-nowrap">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Desktop toggle button - visible when sidebar closed (desktop only) */}
      {!isOpen && !isMobile && (
        <button
          onClick={onToggle}
          className="fixed top-[13px] left-[13px] z-[45] p-[8px] bg-zinc-900/60 backdrop-blur-xl border border-white/[0.08] rounded-[8px] text-zinc-400 hover:text-zinc-200 transition-all"
          aria-label="Open sidebar"
        >
          <Menu size={21} className="flex-shrink-0" />
        </button>
      )}

      {/* Post Modal */}
      <PostModal isOpen={isPostModalOpen} onClose={closePostModal} />
    </>
  );
}
