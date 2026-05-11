"use client";

import { useState } from "react";
import { usePostStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import { Comment } from "@/lib/db-comments";
import CopyLinkButton from "./CopyLinkButton";
import PostDetailModal from "./PostDetailModal";
import { Heart, MessageCircle, Play } from "lucide-react";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface PostCardProps {
  post: {
    id: string;
    url: string;
    body: string;
    author_name: string;
    author_id: string;
    likes: number;
    userLiked: boolean;
    comments: Comment[];
    created_at: string;
    preview_name?: string;
    preview_description?: string;
    preview_thumbnail?: string;
    preview_playing?: number | string;
    preview_visits?: number | string;
    preview_genre?: string;
  };
  showActions?: boolean;
  index?: number;
}

export default function PostCard({ post, showActions = false, index = 0 }: PostCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [editBody, setEditBody] = useState(post.body);
  const [showDetail, setShowDetail] = useState(false);

  const likePost = usePostStore((s) => s.likePost);
  const updatePost = usePostStore((s) => s.updatePost);
  const deletePost = usePostStore((s) => s.deletePost);
  const currentUser = useAuthStore((s) => s.user);

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editBody.trim()) return;
    updatePost(post.id, editBody.trim());
    setIsEditing(false);
  }

  function handleDelete() {
    if (confirm("Are you sure you want to delete this post?")) {
      deletePost(post.id);
    }
  }

  const isAuthor = currentUser?.id === post.author_id;
  const hasPreview = post.preview_thumbnail || post.preview_name;
  const commentCount = post.comments.length;

  return (
    <>
    <article className="post-card bg-zinc-900/60 border border-white/[0.06] rounded-[13px] overflow-hidden cursor-pointer hover:border-white/[0.1] group" style={{ animationDelay: `${index * 60}ms` }} onClick={() => setShowDetail(true)}>
      <div className="p-[21px] space-y-[13px]">
        {/* Author & time */}
        <div className="flex items-center justify-between gap-[13px]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-700/20 ring-1 ring-white/[0.08] flex items-center justify-center text-emerald-400 text-sm font-bold">
              {post.author_name?.[0] || "?"}
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-sm">{post.author_name}</span>
              <span className="text-xs text-zinc-500">
                {timeAgo(post.created_at)}
              </span>
            </div>
          </div>
          
          {/* Edit/Delete buttons - author only, profile page only */}
          {showActions && isAuthor && (
            <div className="flex items-center gap-[8px]" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs text-zinc-400 hover:text-zinc-200 px-[8px] py-[5px]"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="text-xs text-red-400 hover:text-red-300 px-[8px] py-[5px]"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Body - editable if editing */}
        {isEditing ? (
          <form onSubmit={handleEdit} className="space-y-[8px]">
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-[8px] px-[13px] py-[8px] text-sm focus:outline-none focus:border-emerald-500/40"
              rows={3}
            />
            <div className="flex justify-end gap-[8px]">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditBody(post.body);
                }}
                className="px-[13px] py-[8px] text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-[13px] py-[8px] text-xs bg-emerald-500 hover:bg-emerald-600 text-white rounded-[5px]"
              >
                Save
              </button>
            </div>
          </form>
        ) : (
          post.body && <p className="text-sm text-zinc-300">{post.body}</p>
        )}

        {/* Game preview card */}
        {hasPreview ? (
          <div className="rounded-[8px] overflow-hidden border border-white/[0.06]">
            {post.preview_thumbnail && (
              <div className="relative">
                <img
                  src={post.preview_thumbnail}
                  alt={post.preview_name || "Game"}
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent" />
              </div>
            )}
            <div className="bg-zinc-950/60 px-[21px] pb-[21px] pt-[21px] -mt-1 space-y-[16px]">
              <div className="flex items-start justify-between gap-[8px]">
                <p className="font-semibold text-[15px] leading-tight text-zinc-100">{post.preview_name}</p>
                {post.preview_genre && post.preview_genre !== "All" && (
                  <span className="flex-shrink-0 px-[8px] py-[3px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-[5px] text-[11px] font-medium">
                    {post.preview_genre}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-[8px]">
                <div className="flex gap-[13px] text-[12px] text-zinc-500">
                  {post.preview_playing !== undefined && (
                    <span>{Number(post.preview_playing).toLocaleString()} playing</span>
                  )}
                  {post.preview_visits !== undefined && (
                    <span>{Number(post.preview_visits).toLocaleString()} visits</span>
                  )}
                </div>
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 inline-flex items-center gap-[5px] px-[13px] py-[8px] text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-white rounded-[7px] transition-colors shadow-lg shadow-emerald-900/30"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Play size={13} fill="currentColor" />
                  Play
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-[8px] p-[13px] flex items-center justify-between gap-[13px]">
            <span className="text-sm text-zinc-500">Roblox Game</span>
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-[5px] px-[13px] py-[8px] text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-white rounded-[7px] transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Play size={13} fill="currentColor" />
              Play
            </a>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-[8px] pt-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => { likePost(post.id); setLikeAnimating(true); }}
            onAnimationEnd={() => setLikeAnimating(false)}
            className={`flex items-center gap-1.5 text-xs px-[10px] py-[6px] rounded-[6px] transition-all min-w-[54px] ${
              post.userLiked
                ? "text-red-400 bg-red-500/10"
                : "text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
            }`}
          >
            <Heart size={14} fill={post.userLiked ? "currentColor" : "none"} className={likeAnimating ? "heart-pop" : ""} />
            <span className="tabular-nums">{post.likes}</span>
          </button>
          <button
            onClick={() => setShowDetail(true)}
            className="flex items-center gap-1.5 text-xs px-[10px] py-[6px] rounded-[6px] transition-all min-w-[54px] text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10"
          >
            <MessageCircle size={14} />
            <span className="tabular-nums">{commentCount}</span>
          </button>
          {/* Copy Link Button */}
          <CopyLinkButton postId={post.id} gameUrl={post.url} />
        </div>
      </div>
    </article>
    <PostDetailModal
      post={post}
      isOpen={showDetail}
      onClose={() => setShowDetail(false)}
    />
    </>
  );
}
