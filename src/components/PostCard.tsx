"use client";

import { useState, useEffect } from "react";
import { usePostStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import { Comment } from "@/lib/db-comments";
import CopyLinkButton from "./CopyLinkButton";
import PostDetailModal from "./PostDetailModal";
import { 
  Heart, 
  MessageCircle, 
  Send, 
  X, 
  Trash2, 
  Edit2, 
  CornerDownRight,
  Play,
  Check,
  ChevronDown,
  ChevronUp
} from "lucide-react";

function fmt(n: number | string | undefined): string {
  const num = Number(n);
  if (isNaN(num)) return "0";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

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

// Comment Component with edit, delete, like, and reply
function CommentItem({
  comment,
  postId,
  depth = 0,
}: {
  comment: Comment;
  postId: string;
  depth?: number;
}) {
  const [replyText, setReplyText] = useState("");
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.body);
  const addComment = usePostStore((s) => s.addComment);
  const updateComment = usePostStore((s) => s.updateComment);
  const deleteComment = usePostStore((s) => s.deleteComment);
  const likeComment = usePostStore((s) => s.likeComment);
  const currentUser = useAuthStore((s) => s.user);
  const childComments = usePostStore((s) =>
    s.posts.find(p => p.id === postId)?.comments.filter(
      c => c.parent_id === comment.id
    ) ?? []
  );

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim()) return;
    await addComment(postId, replyText.trim(), comment.id);
    setReplyText("");
    setShowReplyInput(false);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editText.trim() || editText === comment.body) {
      setIsEditing(false);
      return;
    }
    await updateComment(postId, comment.id, editText.trim());
    setIsEditing(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this comment?")) return;
    await deleteComment(postId, comment.id);
  }

  function handleLike() {
    likeComment(postId, comment.id);
  }

  const isAuthor = currentUser?.id === comment.author_id;
  const isReply = comment.parent_id !== null;
  
  // Limit nesting depth to 5
  if (depth >= 5) {
    return null;
  }

  return (
    <div className={`${depth > 0 ? "ml-8 mt-3" : ""}`}>
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center text-zinc-300 text-xs font-bold flex-shrink-0">
          {comment.author_name?.[0] || "?"}
        </div>
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-zinc-300">
              {comment.author_name}
            </span>
            <span className="text-xs text-zinc-500">
              {timeAgo(comment.created_at)}
            </span>
            {isAuthor && (
              <span className="text-xs text-emerald-500">(You)</span>
            )}
          </div>
          
          {/* Body - editable or display */}
          {isEditing ? (
            <form onSubmit={handleEdit} className="flex gap-2 mt-1">
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-[6px] px-2 py-1 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/40 transition-colors"
                autoFocus
              />
              <button
                type="submit"
                className="p-1 text-emerald-400 hover:text-emerald-300 active:text-emerald-300"
              >
                <Check size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditText(comment.body);
                }}
                className="p-1 text-zinc-400 hover:text-zinc-300 active:text-zinc-300"
              >
                <X size={16} />
              </button>
            </form>
          ) : (
            <p className="text-sm text-zinc-300 whitespace-pre-wrap">{comment.body}</p>
          )}
          
          {/* Actions */}
          {!isEditing && (
            <div className="flex items-center gap-4 mt-2">
              {/* Like - fixed width container to prevent layout shift */}
              <button
                onClick={handleLike}
                className={`flex items-center justify-center gap-1 text-xs transition-colors min-w-[40px] ${
                  comment.user_has_liked ? "text-red-400" : "text-zinc-500 hover:text-red-400 active:text-red-400"
                }`}
              >
                <Heart size={14} fill={comment.user_has_liked ? "currentColor" : "none"} />
                <span className="w-4 text-center">{comment.comment_likes_count > 0 ? comment.comment_likes_count : " "}</span>
              </button>
              
              {/* Reply */}
              <button
                onClick={() => setShowReplyInput(!showReplyInput)}
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 active:text-zinc-300 transition-colors"
              >
                <CornerDownRight size={14} />
                <span>Reply</span>
              </button>
              
              {/* Edit/Delete - author only */}
              {isAuthor && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 active:text-zinc-300 transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-1 text-xs text-zinc-500 hover:text-red-400 active:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          )}

          {/* Reply input */}
          {showReplyInput && (
            <form onSubmit={handleReply} className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="Reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-[6px] px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40 transition-colors"
              />
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="px-3 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-400 text-white rounded-[6px] transition-colors disabled:opacity-50"
              >
                <Send size={14} />
              </button>
            </form>
          )}
        </div>
      </div>
      
      {/* Nested replies */}
      {childComments.length > 0 && (
        <div className="mt-3">
          {childComments.map((child) => (
            <CommentItem 
              key={child.id} 
              comment={child} 
              postId={postId} 
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface PostCardProps {
  post: {
    id: string;
    url: string;
    body: string;
    author_name: string;
    author_id: string;
    author_avatar_url?: string | null;
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
}

export default function PostCard({ post, showActions = false }: PostCardProps) {
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(post.body);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  
  const likePost = usePostStore((s) => s.likePost);
  const addComment = usePostStore((s) => s.addComment);
  const updatePost = usePostStore((s) => s.updatePost);
  const deletePost = usePostStore((s) => s.deletePost);
  const loadComments = usePostStore((s) => s.loadComments);
  const currentUser = useAuthStore((s) => s.user);

  // Load comments when expanding - always reload when opened
  useEffect(() => {
    if (showComments) {
      setCommentsLoading(true);
      setCommentsError(null);
      loadComments(post.id)
        .catch((err) => {
          setCommentsError("Failed to load comments");
          console.error("Error loading comments:", err);
        })
        .finally(() => {
          setCommentsLoading(false);
        });
    }
  }, [showComments, post.id, loadComments]);

  function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(post.id, commentText.trim());
    setCommentText("");
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editBody.trim()) return;
    updatePost(post.id, editBody.trim());
    setIsEditing(false);
  }

  function handleLikeClick() {
    likePost(post.id);
    if (!post.userLiked) {
      setLikeAnim(true);
      setTimeout(() => setLikeAnim(false), 350);
    }
  }

  function handleDelete() {
    if (confirm("Are you sure you want to delete this post?")) {
      deletePost(post.id);
    }
  }

  const isAuthor = currentUser?.id === post.author_id;
  const hasPreview = post.preview_thumbnail || post.preview_name;

  return (
    <>
    <article className="bg-zinc-950/55 backdrop-blur-md border border-white/[0.05] rounded-[13px] overflow-hidden cursor-pointer hover:bg-zinc-950/65 hover:border-white/[0.08] hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(16,185,129,0.07)] active:bg-zinc-950/65 active:border-white/[0.08] active:-translate-y-0.5 active:shadow-[0_8px_32px_rgba(16,185,129,0.07)] transition-all group" onClick={() => setShowDetail(true)}>
      <div className="p-[21px] space-y-[13px]">
        {/* Author & time */}
        <div className="flex items-center justify-between gap-[13px]">
          <div className="flex items-center gap-2">
            {post.author_avatar_url ? (
              <img
                src={post.author_avatar_url}
                alt={post.author_name}
                className="w-8 h-8 rounded-full ring-1 ring-white/[0.08] object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-700/20 ring-1 ring-white/[0.08] flex items-center justify-center text-emerald-400 text-sm font-bold">
                {post.author_name?.[0] || "?"}
              </div>
            )}
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
          <form onSubmit={handleEdit} onClick={(e) => e.stopPropagation()} className="space-y-[8px]">
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
          <div className="rounded-[8px] overflow-hidden border border-white/[0.04]">
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
            <div className="bg-black/50 px-[21px] pb-[21px] pt-[13px] -mt-1 space-y-[10px]">
              <div className="flex items-start justify-between gap-[8px]">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[15px] leading-tight text-zinc-100">{post.preview_name}</p>
                  {post.preview_description && (
                    <p className="text-[12px] text-zinc-500 mt-[5px] leading-relaxed line-clamp-2">{post.preview_description}</p>
                  )}
                </div>
                {post.preview_genre && post.preview_genre !== "All" && (
                  <span className="flex-shrink-0 px-[8px] py-[3px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-[5px] text-[11px] font-medium">
                    {post.preview_genre}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-[8px]">
                <div className="flex gap-[13px] text-[12px] text-zinc-500">
                  {post.preview_playing !== undefined && (
                    <span>{fmt(post.preview_playing)} playing</span>
                  )}
                  {post.preview_visits !== undefined && (
                    <span>{fmt(post.preview_visits)} visits</span>
                  )}
                </div>
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 inline-flex items-center gap-[5px] px-[13px] py-[8px] text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-400 text-white rounded-[7px] transition-colors shadow-lg shadow-emerald-900/30"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Play size={13} fill="currentColor" />
                  Play
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/[0.02] border border-white/[0.04] rounded-[8px] p-[13px] flex items-center justify-between gap-[13px]">
            <span className="text-sm text-zinc-500">Roblox Game</span>
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-[5px] px-[13px] py-[8px] text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-400 text-white rounded-[7px] transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Play size={13} fill="currentColor" />
              Play
            </a>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-[5px] pt-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleLikeClick}
            className={`flex items-center gap-1.5 text-xs px-[10px] py-[6px] rounded-[6px] transition-all ${
              post.userLiked
                ? "text-red-400 bg-red-500/10"
                : "text-zinc-500 hover:text-red-400 hover:bg-red-500/[0.08] active:text-red-400 active:bg-red-500/[0.08]"
            }`}
          >
            <Heart size={14} fill={post.userLiked ? "currentColor" : "none"} className={likeAnim ? "heart-pop" : ""} />
            <span className="tabular-nums">{post.likes}</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-xs px-[10px] py-[6px] rounded-[6px] transition-all text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06] active:text-zinc-300 active:bg-white/[0.06]"
          >
            <MessageCircle size={14} />
            <span className="tabular-nums">{post.comments.length}</span>
          </button>
          {/* Copy Link Button */}
          <CopyLinkButton postId={post.id} gameUrl={post.url} />
        </div>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-white/[0.04] p-[21px]" onClick={(e) => e.stopPropagation()}>
          {/* Comment count header */}
          <p className="text-[12px] font-medium text-zinc-500 mb-[13px] uppercase tracking-wider">
            {post.comments.length} {post.comments.length === 1 ? "comment" : "comments"}
          </p>

          {/* Add comment */}
          {currentUser ? (
            <form onSubmit={handleComment} className="flex gap-[13px] mb-[21px]">
              <div className="w-[34px] h-[34px] rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold flex-shrink-0">
                {currentUser?.username?.[0] || "Y"}
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full bg-white/[0.04] border-b border-white/[0.08] px-[8px] py-[8px] text-sm placeholder-zinc-500 focus:outline-none focus:border-emerald-500/40"
                />
                {commentText.trim() && (
                  <div className="flex justify-end gap-[8px] mt-[8px]">
                    <button
                      type="button"
                      onClick={() => setCommentText("")}
                      className="px-[13px] py-[8px] text-xs font-semibold text-zinc-400 hover:text-zinc-200 active:text-zinc-200 rounded-full transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!commentText.trim()}
                      className="px-[13px] py-[8px] text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-400 text-white rounded-[6px] transition-colors disabled:opacity-50"
                    >
                      Comment
                    </button>
                  </div>
                )}
              </div>
            </form>
          ) : (
            <div className="mb-[21px] p-[13px] bg-white/[0.04] border border-white/[0.05] rounded-[8px] text-center text-sm text-zinc-500">
              Sign in to comment
            </div>
          )}

          {/* Loading state */}
          {commentsLoading && (
            <div className="flex items-center justify-center py-[34px]">
              <div className="w-6 h-6 border-2 border-zinc-600 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          )}
          
          {/* Error state */}
          {commentsError && (
            <div className="mb-[13px] p-[13px] bg-red-500/10 border border-red-500/20 rounded-[8px] text-center text-sm text-red-400">
              {commentsError}
              <button 
                onClick={() => {
                  setCommentsLoading(true);
                  setCommentsError(null);
                  loadComments(post.id).finally(() => setCommentsLoading(false));
                }}
                className="ml-2 underline hover:text-red-300"
              >
                Retry
              </button>
            </div>
          )}
          
          {/* Comments list - only parent comments at top level */}
          {!commentsLoading && !commentsError && (
            <div className="space-y-[21px]">
              {post.comments.filter(c => !c.parent_id).length === 0 ? (
                <div className="text-center text-sm text-zinc-500 py-[21px]">
                  No comments yet. Be the first to comment!
                </div>
              ) : (
                post.comments.filter(c => !c.parent_id).map((c) => (
                  <CommentItem key={c.id} comment={c} postId={post.id} />
                ))
              )}
            </div>
          )}
        </div>
      )}
    </article>
    <PostDetailModal
      post={post}
      isOpen={showDetail}
      onClose={() => setShowDetail(false)}
    />
    </>
  );
}
