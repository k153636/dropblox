"use client";

import { useState, useEffect } from "react";
import { getLikedPostsByUserId } from "@/lib/db-likes";
import type { Post } from "@/lib/db-posts";

interface LikedPostsGridProps {
  userId: string;
}

// SVG Icons
const HeartIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

const HeartOutlineIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5 4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

// Skeleton Card
function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="aspect-video bg-zinc-800 rounded-[8px] mb-[13px]" />
      <div className="h-[16px] bg-zinc-800 rounded w-3/4 mb-[8px]" />
      <div className="h-[14px] bg-zinc-800 rounded w-1/2" />
    </div>
  );
}

// Individual Liked Post Card
function LikedPostCard({ post }: { post: Post }) {
  return (
    <div className="group cursor-pointer">
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-[8px] overflow-hidden mb-[13px] bg-zinc-800">
        {post.preview_thumbnail ? (
          <img
            src={post.preview_thumbnail}
            alt={post.preview_name || "Game thumbnail"}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600">
            <span className="text-xs">No image</span>
          </div>
        )}
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
      </div>
      
      {/* Game name */}
      <h3 className="text-sm font-medium text-zinc-200 truncate mb-[8px] group-hover:text-emerald-400 transition-colors">
        {post.preview_name || "Untitled Game"}
      </h3>
      
      {/* Like count */}
      <div className="flex items-center gap-[5px] text-zinc-500 text-xs">
        <HeartIcon className="w-[13px] h-[13px] text-emerald-500" />
        <span>{post.likes || 0}</span>
      </div>
    </div>
  );
}

export default function LikedPostsGrid({ userId }: LikedPostsGridProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const LIMIT = 20;

  async function loadLikedPosts(reset = false) {
    const currentOffset = reset ? 0 : offset;
    
    if (reset) {
      setLoading(true);
      setError(null);
    }

    const data = await getLikedPostsByUserId(userId, LIMIT, currentOffset);

    if (data === null) {
      setError("Failed to load liked posts");
      setLoading(false);
      return;
    }

    if (reset) {
      setPosts(data);
    } else {
      setPosts((prev) => [...prev, ...data]);
    }

    setHasMore(data.length === LIMIT);
    setOffset(currentOffset + data.length);
    setLoading(false);
  }

  useEffect(() => {
    loadLikedPosts(true);
  }, [userId]);

  // Loading skeleton
  if (loading && posts.length === 0) {
    return (
      <div className="grid grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-[21px]">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  // Error state
  if (error && posts.length === 0) {
    return (
      <div className="text-center py-[55px]">
        <p className="text-zinc-400 mb-[13px]">{error}</p>
        <button
          onClick={() => loadLikedPosts(true)}
          className="px-[21px] py-[13px] bg-zinc-800 hover:bg-zinc-700 text-white rounded-[8px] text-sm transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (posts.length === 0) {
    return (
      <div className="text-center py-[55px] text-zinc-500">
        <HeartOutlineIcon className="w-[55px] h-[55px] mx-auto mb-[13px] opacity-30" />
        <p>No liked posts yet</p>
        <p className="text-sm mt-[8px] opacity-60">
          Posts you like will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-[21px]">
      {/* Grid */}
      <div className="grid grid-cols-3 lg:grid-cols-2 sm:grid-cols-1 gap-[21px]">
        {posts.map((post) => (
          <LikedPostCard key={post.id} post={post} />
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="text-center pt-[21px]">
          <button
            onClick={() => loadLikedPosts(false)}
            disabled={loading}
            className="px-[21px] py-[13px] bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 text-white rounded-[8px] text-sm transition-colors"
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        </div>
      )}

      {/* End message */}
      {!hasMore && posts.length > 0 && (
        <p className="text-center text-zinc-500 text-sm pt-[21px]">
          No more liked posts
        </p>
      )}
    </div>
  );
}
