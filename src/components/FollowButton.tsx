"use client";

import { useAuthStore } from "@/lib/auth-store";

interface Props {
  targetId: string;
  className?: string;
}

export default function FollowButton({ targetId, className = "" }: Props) {
  const user = useAuthStore((s) => s.user);
  const followingIds = useAuthStore((s) => s.followingIds);
  const toggleFollow = useAuthStore((s) => s.toggleFollow);

  if (!user || user.id === targetId) return null;

  const isFollowing = followingIds.includes(targetId);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleFollow(targetId);
      }}
      className={`px-[8px] py-[3px] rounded-full text-[11px] font-medium transition-all ${
        isFollowing
          ? "bg-white/[0.06] text-zinc-400 hover:bg-white/[0.10] hover:text-zinc-200 active:bg-white/[0.10] active:text-zinc-200"
          : "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 active:bg-emerald-500/25"
      } ${className}`}
    >
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}
