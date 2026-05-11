"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, User, SquarePlus } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import PostModal from "./PostModal";

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
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden px-[13px]"
        style={{ paddingBottom: "calc(13px + env(safe-area-inset-bottom))" }}
      >
        <div
          className="flex items-center justify-center gap-[55px] bg-zinc-950/80 backdrop-blur-2xl rounded-[21px] shadow-[0_8px_32px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.07)] px-[21px] py-[13px]"
        >
          <Link
            href="/"
            className={`flex items-center justify-center w-[44px] h-[44px] rounded-[10px] transition-colors ${
              pathname === "/"
                ? "text-emerald-400 bg-emerald-500/10"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Home size={21} />
          </Link>

          <button
            onClick={openPostModal}
            className="w-[47px] h-[47px] bg-emerald-500 hover:bg-emerald-400 active:scale-95 rounded-[13px] flex items-center justify-center text-white transition-all shadow-lg shadow-emerald-900/40"
          >
            <SquarePlus size={21} />
          </button>

          <Link
            href="/profile"
            className={`flex items-center justify-center w-[44px] h-[44px] rounded-[10px] transition-colors ${
              pathname === "/profile"
                ? "text-emerald-400 bg-emerald-500/10"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <User size={21} />
          </Link>
        </div>
      </nav>

      <PostModal isOpen={isPostModalOpen} onClose={() => setIsPostModalOpen(false)} />
    </>
  );
}
