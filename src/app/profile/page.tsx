"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import UserPostsGrid from "@/components/UserPostsGrid";
import LikedPostsGrid from "@/components/LikedPostsGrid";
import { useAuthStore } from "@/lib/auth-store";
import { getPostCountByUserId } from "@/lib/db-posts";
import { getTotalLikesReceivedByUserId } from "@/lib/db-likes";
import { LayoutGrid, Heart, Pencil, Check, X } from "lucide-react";

export default function ProfilePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "likes">("posts");
  const { user } = useAuthStore();
  const [postCount, setPostCount] = useState(0);
  const [likesCount, setLikesCount] = useState(0);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState("");
  const [bioSaving, setBioSaving] = useState(false);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  useEffect(() => {
    if (!user) return;
    getPostCountByUserId(user.id).then(setPostCount);
    getTotalLikesReceivedByUserId(user.id).then(setLikesCount);
    setBioText(user.bio || "");
  }, [user]);

  async function handleSaveBio() {
    setBioSaving(true);
    try {
      await updateProfile({ bio: bioText });
      setIsEditingBio(false);
    } catch {
      // error handled in store
    } finally {
      setBioSaving(false);
    }
  }

  function handleCancelBio() {
    setBioText(user?.bio || "");
    setIsEditingBio(false);
  }

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
                Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
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
            {isEditingBio ? (
              <div className="space-y-[8px]">
                <textarea
                  value={bioText}
                  onChange={(e) => setBioText(e.target.value)}
                  placeholder="自己紹介を書いてください..."
                  maxLength={200}
                  rows={3}
                  className="w-full px-[13px] py-[13px] bg-zinc-800 border border-zinc-700 rounded-[8px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors resize-none text-sm"
                  autoFocus
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">{bioText.length}/200</span>
                  <div className="flex gap-[8px]">
                    <button
                      onClick={handleCancelBio}
                      disabled={bioSaving}
                      className="flex items-center gap-[5px] px-[13px] py-[8px] text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      <X size={14} />
                      キャンセル
                    </button>
                    <button
                      onClick={handleSaveBio}
                      disabled={bioSaving}
                      className="flex items-center gap-[5px] px-[13px] py-[8px] text-xs font-medium bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-[6px] transition-colors"
                    >
                      <Check size={14} />
                      {bioSaving ? "保存中..." : "保存"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="group flex items-start gap-[8px]">
                <p className="text-zinc-300 text-sm flex-1">
                  {user.bio || <span className="text-zinc-500 italic">自己紹介はまだありません</span>}
                </p>
                <button
                  onClick={() => setIsEditingBio(true)}
                  className="p-[5px] text-zinc-500 hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all"
                  title="自己紹介を編集"
                >
                  <Pencil size={14} />
                </button>
              </div>
            )}
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
                <LayoutGrid size={21} />
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
                <Heart size={21} />
                Liked
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-[200px]">
            {activeTab === "posts" ? (
              <UserPostsGrid userId={user.id} />
            ) : (
              <LikedPostsGrid userId={user.id} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
