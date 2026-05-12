"use client";

import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { Menu, LogOut, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const GitHubIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

// Roblox icon component - official Simple Icons version
function RobloxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
      <title>Roblox</title>
      <path d="M18.926 23.998 0 18.892 5.075.002 24 5.108ZM15.348 10.09l-5.282-1.453-1.414 5.273 5.282 1.453z"/>
    </svg>
  );
}

interface HeaderProps {
  onMenuClick?: () => void;
  sidebarOpen?: boolean;
}

export default function Header({ onMenuClick, sidebarOpen = false }: HeaderProps) {
  const { user, signInWithGithub, signInWithRoblox, signOut } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 bg-zinc-950/55 backdrop-blur-2xl shadow-[0_1px_0_rgba(255,255,255,0.05),0_1px_0_rgba(16,185,129,0.05),0_8px_32px_rgba(0,0,0,0.35)]">
      <div 
        className={`h-[55px] flex items-center justify-between transition-all duration-300 ${
          sidebarOpen ? "md:ml-[144px] px-[21px]" : "md:ml-[89px] px-[21px]"
        }`}
      >
        {/* Left side - Title */}
        <div className="flex items-center gap-[13px]">
          {/* Hamburger menu button */}
          <button
            onClick={onMenuClick}
            className="p-[8px] text-zinc-400 hover:text-zinc-200 active:text-zinc-200 transition-colors md:hidden"
            aria-label="Toggle menu"
          >
            <Menu size={21} />
          </button>
          <Link href="/" className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity">
            <span className="text-emerald-400">drop</span>blox
          </Link>
        </div>

        {/* Right side - User auth */}
        <div className="flex-shrink-0">
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-[8px] px-[10px] py-[6px] rounded-[8px] hover:bg-white/[0.06] active:bg-white/[0.06] transition-colors"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="w-7 h-7 rounded-full ring-1 ring-white/[0.1]"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-700/20 ring-1 ring-white/[0.1] flex items-center justify-center text-emerald-400 font-bold text-xs">
                    {user.username[0]?.toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-zinc-300 font-medium hidden sm:block">{user.username}</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-[160px] bg-zinc-950/90 backdrop-blur-2xl border border-white/[0.07] rounded-[10px] shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden z-50">
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-[8px] px-[13px] py-[10px] text-sm text-zinc-300 hover:bg-white/[0.06] active:bg-white/[0.06] transition-colors"
                  >
                    <User size={14} className="text-zinc-500" />
                    Profile
                  </Link>
                  <div className="border-t border-white/[0.06]" />
                  <button
                    onClick={() => { signOut(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-[8px] px-[13px] py-[10px] text-sm text-zinc-500 hover:text-red-400 hover:bg-red-500/5 active:text-red-400 active:bg-red-500/5 transition-colors"
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-[8px]">
              <button
                onClick={signInWithGithub}
                className="px-[10px] py-[6px] text-xs font-medium bg-white/[0.06] hover:bg-white/[0.1] active:bg-white/[0.1] border border-white/[0.08] text-zinc-200 rounded-[8px] transition-all flex items-center gap-[6px]"
              >
                <GitHubIcon className="w-[14px] h-[14px]" />
                <span className="hidden sm:inline">GitHub</span>
              </button>
              <button
                onClick={signInWithRoblox}
                className="px-[10px] py-[6px] text-xs font-medium bg-white/[0.06] hover:bg-white/[0.1] active:bg-white/[0.1] border border-white/[0.08] text-zinc-200 rounded-[8px] transition-all flex items-center gap-[6px]"
                title="Requires Roblox OAuth setup"
              >
                <RobloxIcon className="w-[14px] h-[14px]" />
                <span className="hidden sm:inline">Roblox</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
