"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
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
  const followersCount = useAuthStore((s) => s.followersCount);
  const followingCount = useAuthStore((s) => s.followingCount);
  const loadFollowStats = useAuthStore((s) => s.loadFollowStats);
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
    loadFollowStats();
    setBioText(user.bio || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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

      {/* Main content — φ container */}
      <main
        className={`transition-all duration-300 ${
          sidebarOpen ? "md:ml-[157px]" : "md:ml-[102px]"
        }`}
      >
        <div className="max-w-[610px] mx-auto px-[21px] pt-[55px] pb-[89px] md:pb-[89px]" style={{ paddingBottom: "calc(89px + env(safe-area-inset-bottom))" }}>

          {/* ── Profile Card ── */}
          <div className="rounded-[13px] p-[34px] mb-[34px]">
            <div className="flex items-start gap-[21px]">
              {/* Avatar — φ ring */}
              <div className="relative shrink-0">
                <div className="absolute -inset-[3px] rounded-full bg-gradient-to-br from-emerald-500/40 to-emerald-700/20" />
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="relative w-[89px] h-[89px] rounded-full border-2 border-zinc-900 object-cover"
                  />
                ) : (
                  <div className="relative w-[89px] h-[89px] rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-[34px] border-2 border-zinc-900">
                    {user.username[0]?.toUpperCase()}
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-[21px] font-bold text-zinc-50 tracking-tight leading-tight truncate">
                  {user.username}
                </h1>
                <p className="text-zinc-500 text-[13px] mt-[5px] tracking-wide">
                  Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-[21px] mt-[13px]">
                  <div>
                    <div className="text-[21px] font-bold text-zinc-50 tabular-nums leading-none">{postCount}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-[4px]">Posts</div>
                  </div>
                  <div className="w-px h-[34px] bg-white/[0.06]" />
                  <div>
                    <div className="text-[21px] font-bold text-zinc-50 tabular-nums leading-none">{likesCount}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-[4px]">Likes</div>
                  </div>
                  <div className="w-px h-[34px] bg-white/[0.06]" />
                  <div>
                    <div className="text-[21px] font-bold text-zinc-50 tabular-nums leading-none">{followersCount}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-[4px]">Followers</div>
                  </div>
                  <div className="w-px h-[34px] bg-white/[0.06]" />
                  <div>
                    <div className="text-[21px] font-bold text-zinc-50 tabular-nums leading-none">{followingCount}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-[4px]">Following</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio — φ divider */}
            <div className="mt-[21px] pt-[21px] border-t border-white/[0.05]">
              {isEditingBio ? (
                <div className="space-y-[13px]">
                  <textarea
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value)}
                    placeholder="Write a short bio..."
                    maxLength={200}
                    rows={3}
                    className="w-full px-[13px] py-[13px] bg-white/[0.04] border border-white/[0.08] rounded-[8px] text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition-all resize-none text-sm leading-relaxed"
                    autoFocus
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-600 tabular-nums">{bioText.length}/200</span>
                    <div className="flex gap-[8px]">
                      <button
                        onClick={handleCancelBio}
                        disabled={bioSaving}
                        className="flex items-center gap-[5px] px-[13px] py-[8px] text-xs text-zinc-500 hover:text-zinc-300 rounded-[8px] hover:bg-zinc-800/60 transition-all"
                      >
                        <X size={13} />
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveBio}
                        disabled={bioSaving}
                        className="flex items-center gap-[5px] px-[13px] py-[8px] text-xs font-medium bg-emerald-500/90 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-[8px] transition-all"
                      >
                        <Check size={13} />
                        {bioSaving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-[13px]">
                  <p className="text-zinc-400 text-sm flex-1 leading-relaxed">
                    {user.bio || <span className="text-zinc-600 italic">No bio yet</span>}
                  </p>
                  <button
                    onClick={() => setIsEditingBio(true)}
                    className="shrink-0 p-[5px] text-zinc-600 hover:text-emerald-400 transition-colors"
                    title="Edit bio"
                  >
                    <Pencil size={13} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Tabs — φ spacing ── */}
          <div className="border-b border-white/[0.06] mb-[34px]">
            <div className="flex gap-[34px]">
              <button
                onClick={() => setActiveTab("posts")}
                className={`flex items-center gap-[8px] pb-[13px] text-[13px] font-medium tracking-wide transition-all ${
                  activeTab === "posts"
                    ? "text-emerald-400 border-b-[2px] border-emerald-400"
                    : "text-zinc-500 hover:text-zinc-300 border-b-[2px] border-transparent"
                }`}
              >
                <LayoutGrid size={16} />
                Posts
              </button>
              <button
                onClick={() => setActiveTab("likes")}
                className={`flex items-center gap-[8px] pb-[13px] text-[13px] font-medium tracking-wide transition-all ${
                  activeTab === "likes"
                    ? "text-emerald-400 border-b-[2px] border-emerald-400"
                    : "text-zinc-500 hover:text-zinc-300 border-b-[2px] border-transparent"
                }`}
              >
                <Heart size={16} />
                Liked
              </button>
            </div>
          </div>

          {/* ── Tab Content ── */}
          <div className="min-h-[233px]">
            {activeTab === "posts" ? (
              <UserPostsGrid userId={user.id} />
            ) : (
              <LikedPostsGrid userId={user.id} />
            )}
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
