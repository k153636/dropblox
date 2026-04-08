"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { useAuthStore } from "@/lib/auth-store";

// SVG Icons
const GridIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const HeartIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5 4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

export default function ProfilePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "likes">("posts");
  const { user } = useAuthStore();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">Please sign in to view your profile</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header onMenuClick={toggleSidebar} sidebarOpen={sidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      {/* Main content */}
      <main
        className={`transition-all duration-300 ${
          sidebarOpen ? "md:ml-[233px]" : "md:ml-[55px]"
        }`}
      >
        <div className="max-w-[676px] mx-auto px-[21px] py-[34px]">
          {/* Profile Header */}
          <div className="flex items-center gap-[21px] mb-[34px]">
            {/* Avatar */}
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-[89px] h-[89px] rounded-full border-2 border-zinc-700"
              />
            ) : (
              <div className="w-[89px] h-[89px] rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-3xl border-2 border-zinc-700">
                {user.username[0]?.toUpperCase()}
              </div>
            )}

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-zinc-100">{user.username}</h1>
              <p className="text-zinc-500 text-sm mt-[8px]">
                Joined {new Date().toLocaleDateString()}
              </p>

              {/* Stats */}
              <div className="flex gap-[21px] mt-[13px]">
                <div className="text-center">
                  <div className="font-bold text-zinc-100">0</div>
                  <div className="text-xs text-zinc-500">posts</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-zinc-100">0</div>
                  <div className="text-xs text-zinc-500">likes</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mb-[34px]">
            <p className="text-zinc-300">
              Roblox developer and game enthusiast
            </p>
          </div>

          {/* Tabs */}
          <div className="border-b border-zinc-800 mb-[21px]">
            <div className="flex gap-[34px]">
              <button
                onClick={() => setActiveTab("posts")}
                className={`flex items-center gap-[8px] pb-[13px] text-sm font-medium transition-colors ${
                  activeTab === "posts"
                    ? "text-emerald-400 border-b-2 border-emerald-400"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <GridIcon className="w-[21px] h-[21px]" />
                Posts
              </button>
              <button
                onClick={() => setActiveTab("likes")}
                className={`flex items-center gap-[8px] pb-[13px] text-sm font-medium transition-colors ${
                  activeTab === "likes"
                    ? "text-emerald-400 border-b-2 border-emerald-400"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <HeartIcon className="w-[21px] h-[21px]" />
                Liked
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-[200px]">
            {activeTab === "posts" ? (
              <div className="text-center py-[55px] text-zinc-500">
                <GridIcon className="w-[55px] h-[55px] mx-auto mb-[13px] opacity-30" />
                <p>No posts yet</p>
                <p className="text-sm mt-[8px] opacity-60">
                  Your posts will appear here
                </p>
              </div>
            ) : (
              <div className="text-center py-[55px] text-zinc-500">
                <HeartIcon className="w-[55px] h-[55px] mx-auto mb-[13px] opacity-30" />
                <p>No liked posts yet</p>
                <p className="text-sm mt-[8px] opacity-60">
                  Posts you like will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
