"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, SquarePlus, User, Menu, X } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
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
  const { user, openAuthModal } = useAuthStore();
  const openPostModal = () => {
    if (!user) {
      openAuthModal();
    } else {
      setIsPostModalOpen(true);
    }
  };
  const closePostModal = () => setIsPostModalOpen(false);

  const prevIsMobile = useRef(true);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      // モバイル→PC遷移時にサイドバーが開いていたら閉じてPCデフォルトにリセット
      if (prevIsMobile.current && !mobile && isOpen) {
        onToggle();
      }
      prevIsMobile.current = mobile;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [isOpen, onToggle]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStart === null) return;
      const touchEnd = e.changedTouches[0].clientX;
      const diff = touchStart - touchEnd;
      const threshold = 50;
      if (!isOpen && touchStart < 20 && diff < -threshold) onToggle();
      else if (isOpen && diff > threshold) onToggle();
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
      {/* Backdrop - mobile only when open */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[39] transition-opacity"
          onClick={onToggle}
        />
      )}

      {/* Left-edge swipe area - mobile only */}
      <div
        className="fixed left-0 top-0 w-[20px] h-full z-[35] md:hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />

      {/* Sidebar - mobile: hidden until opened, desktop: always visible */}
      <aside
        className={`fixed left-[13px] bg-zinc-950/65 backdrop-blur-2xl rounded-b-[13px] shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.07)] z-[40] transition-all duration-300 ease-out ${
          isOpen ? "w-[144px] translate-x-0" : "w-[89px] -translate-x-[calc(100%+14px)] md:translate-x-0"
        }`}
        style={{ top: "55px", bottom: "13px" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* X button when open */}
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
              className="flex flex-row items-center justify-center bg-emerald-500/80 hover:bg-emerald-500 backdrop-blur-sm text-white rounded-[8px] transition-all w-full min-h-[47px] px-[13px] py-[13px] gap-[13px]"
            >
              <SquarePlus className="flex-shrink-0 w-[21px] h-[21px]" />
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
                    if (isMobile && isOpen) onToggle();
                  }}
                  className={`flex flex-row items-center justify-center rounded-[8px] transition-colors w-full min-h-[47px] px-[13px] py-[13px] gap-[13px] ${
                    item.active
                      ? "bg-white/[0.11] text-emerald-400"
                      : "text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200"
                  }`}
                >
                  <Icon className="flex-shrink-0 w-[21px] h-[21px]" />
                  {isOpen && <span className="font-medium text-xs whitespace-nowrap">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Menu button - desktop only when sidebar closed */}
      {!isOpen && !isMobile && (
        <button
          onClick={onToggle}
          className="fixed top-[13px] left-[13px] z-[45] p-[8px] bg-zinc-950/65 backdrop-blur-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_4px_20px_rgba(0,0,0,0.4)] rounded-[8px] text-zinc-400 hover:text-zinc-200 transition-all"
          aria-label="Open sidebar"
        >
          <Menu size={21} className="flex-shrink-0" />
        </button>
      )}

      <PostModal isOpen={isPostModalOpen} onClose={closePostModal} />
    </>
  );
}
