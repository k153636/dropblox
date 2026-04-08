"use client";

import { useState, useEffect } from "react";
import { getPostsByUserId } from "@/lib/db-posts";
import type { Post } from "@/lib/db-posts";
import EditPostModal from "./EditPostModal";
import { useAuthStore } from "@/lib/auth-store";

interface UserPostsGridProps {
  userId: string;
}

// SVG Icons
const GridIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
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

// Edit icon
const EditIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

// Individual User Post Card
function UserPostCard({ post, onClick }: { post: Post; onClick: () => void }) {
  return (
    <div className="group cursor-pointer" onClick={onClick}>
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
        
        {/* Edit indicator overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900/80 p-[8px] rounded-full">
            <EditIcon className="w-[21px] h-[21px] text-white" />
          </div>
        </div>
      </div>
      
      {/* Game name */}
      <h3 className="text-sm font-medium text-zinc-200 truncate mb-[8px] group-hover:text-emerald-400 transition-colors">
        {post.preview_name || "Untitled Game"}
      </h3>
      
      {/* Like count */}
      <div className="flex items-center gap-[5px] text-zinc-500 text-xs">
        <svg className="w-[13px] h-[13px] text-emerald-500" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
        <span>{post.likes || 0}</span>
      </div>
    </div>
  );
}

export default function UserPostsGrid({ userId }: UserPostsGridProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const LIMIT = 20;

  const openPostDetail = (post: Post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const closePostDetail = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  async function loadUserPosts(reset = false) {
    const currentOffset = reset ? 0 : offset;
    
    if (reset) {
      setLoading(true);
      setError(null);
    }

    const data = await getPostsByUserId(userId, LIMIT, currentOffset);

    if (data === null) {
      setError("Failed to load posts");
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
    loadUserPosts(true);
  }, [userId]);

  // Loading skeleton
  if (loading && posts.length === 0) {
    return (
      <div 
        className="grid gap-[21px]"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
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
          onClick={() => loadUserPosts(true)}
          className="px-[21px] py-[13px] bg-zinc-800 hover:bg-zinc-700 text-white rounded-[8px] text-sm transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Empty state - show grid with message overlay
  if (posts.length === 0) {
    return (
      <div className="relative">
        {/* Empty grid skeleton */}
        <div 
          className="grid gap-[21px] opacity-20"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        {/* Message overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400">
          <GridIcon className="w-[55px] h-[55px] mb-[13px] opacity-60" />
          <p className="font-medium">No posts yet</p>
          <p className="text-sm mt-[8px] opacity-60">
            Your posts will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-[21px]">
      {/* Grid - Auto responsive */}
      <div 
        className="grid gap-[21px]"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}
      >
        {posts.map((post) => (
          <UserPostCard key={post.id} post={post} onClick={() => openPostDetail(post)} />
        ))}
      </div>

      {/* Edit Post Modal */}
      <EditPostModal 
        post={selectedPost} 
        isOpen={isModalOpen} 
        onClose={closePostDetail}
        onUpdate={(updatedPost) => {
          setPosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p));
        }}
        onDelete={(deletedPostId) => {
          setPosts(posts.filter(p => p.id !== deletedPostId));
        }}
      />

      {/* Load more */}
      {hasMore && (
        <div className="text-center pt-[21px]">
          <button
            onClick={() => loadUserPosts(false)}
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
          No more posts
        </p>
      )}
    </div>
  );
}
