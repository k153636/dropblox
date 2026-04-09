"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import UserPostsGrid from "@/components/UserPostsGrid";
import { useAuthStore } from "@/lib/auth-store";
import { getPostCountByUserId } from "@/lib/db-posts";
import { getTotalLikesReceivedByUserId } from "@/lib/db-likes";
import { LayoutGrid } from "lucide-react";

export default function ProfilePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuthStore();
  const [postCount, setPostCount] = useState(0);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    getPostCountByUserId(user.id).then(setPostCount);
    getTotalLikesReceivedByUserId(user.id).then(setLikesCount);
  }, [user]);

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

      {/* Main content - Golden Ratio */}
      <main
        className={`transition-all duration-300 ${
          sidebarOpen ? "md:ml-[144px]" : "md:ml-[89px]"
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
                  <div className="font-bold text-zinc-100">{postCount}</div>
                  <div className="text-xs text-zinc-500">posts</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-zinc-100">{likesCount}</div>
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
                className="flex items-center gap-[8px] pb-[13px] text-sm font-medium text-emerald-400 border-b-2 border-emerald-400"
              >
                <LayoutGrid size={21} />
                Posts
              </button>
            </div>
          </div>

          {/* Posts Content */}
          <div className="min-h-[200px]">
            <UserPostsGrid userId={user.id} />
          </div>
        </div>
      </main>
    </div>
  );
}
