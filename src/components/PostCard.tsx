"use client";

import { useState, useEffect } from "react";
import { usePostStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import { Comment } from "@/lib/db-comments";
import CopyLinkButton from "./CopyLinkButton";
import { 
  Heart, 
  MessageCircle, 
  Send, 
  X, 
  Trash2, 
  Edit2, 
  CornerDownRight,
  Play,
  Check
} from "lucide-react";

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
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  
  const addComment = usePostStore((s) => s.addComment);
  const updateComment = usePostStore((s) => s.updateComment);
  const deleteComment = usePostStore((s) => s.deleteComment);
  const currentUser = useAuthStore((s) => s.user);
  const { posts } = usePostStore();
  
  // Find child comments (replies to this comment)
  const childComments = posts.find(p => p.id === postId)?.comments.filter(
    c => c.parent_id === comment.id
  ) || [];

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
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    // TODO: implement comment likes in backend
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
        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400 text-xs font-bold flex-shrink-0">
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
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-zinc-500"
                autoFocus
              />
              <button
                type="submit"
                className="p-1 text-emerald-400 hover:text-emerald-300"
              >
                <Check size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditText(comment.body);
                }}
                className="p-1 text-zinc-400 hover:text-zinc-300"
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
                  liked ? "text-red-400" : "text-zinc-500 hover:text-red-400"
                }`}
              >
                <Heart size={14} fill={liked ? "currentColor" : "none"} />
                <span className="w-4 text-center">{likeCount > 0 ? likeCount : " "}</span>
              </button>
              
              {/* Reply */}
              <button
                onClick={() => setShowReplyInput(!showReplyInput)}
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <CornerDownRight size={14} />
                <span>Reply</span>
              </button>
              
              {/* Edit/Delete - author only */}
              {isAuthor && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-1 text-xs text-zinc-500 hover:text-red-400 transition-colors"
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
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
              />
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="px-3 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded transition-colors disabled:opacity-50"
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
    likes: number;
    userLiked: boolean;
    comments: Comment[];
    created_at: string;
    preview_name?: string;
    preview_description?: string;
    preview_thumbnail?: string;
    preview_playing?: number | string;
    preview_visits?: number | string;
  };
}

export default function PostCard({ post }: PostCardProps) {
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(post.body);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [hasLoadedComments, setHasLoadedComments] = useState(false);
  
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
        .then(() => {
          setHasLoadedComments(true);
        })
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

  function handleDelete() {
    if (confirm("Are you sure you want to delete this post?")) {
      deletePost(post.id);
    }
  }

  const isAuthor = currentUser?.id === post.author_id;
  const hasPreview = post.preview_thumbnail || post.preview_name;

  return (
    <article className="bg-zinc-900 border border-zinc-800 rounded-[13px] overflow-hidden">
      <div className="p-[21px] space-y-[13px]">
        {/* Author & time */}
        <div className="flex items-center justify-between gap-[13px]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold">
              {post.author_name?.[0] || "?"}
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-sm">{post.author_name}</span>
              <span className="text-xs text-zinc-500">
                {timeAgo(post.created_at)}
              </span>
            </div>
          </div>
          
          {/* Edit/Delete buttons - author only */}
          {isAuthor && (
            <div className="flex items-center gap-[8px]">
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
              className="w-full bg-zinc-800 border border-zinc-700 rounded-[8px] px-[13px] py-[8px] text-sm focus:outline-none focus:border-zinc-500"
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
          <div className="rounded-lg overflow-hidden border border-zinc-800">
            {post.preview_thumbnail && (
              <div className="relative">
                <img
                  src={post.preview_thumbnail}
                  alt={post.preview_name || "Game"}
                  className="w-full aspect-[1.618/1] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/60 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
              </div>
            )}
            <div className="bg-zinc-900 px-[21px] pb-[21px] pt-[13px] -mt-1 space-y-[8px]">
              <p className="font-semibold text-sm">{post.preview_name}</p>
              <p className="text-xs text-zinc-400 line-clamp-2">
                {post.preview_description}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex gap-3 text-xs text-zinc-500">
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
                  className="inline-flex items-center gap-[5px] px-[13px] py-[8px] text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded-[8px] transition-colors"
                >
                  <Play size={14} fill="currentColor" />
                  Play on Roblox
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-800/50 rounded-[8px] p-[13px] flex items-center justify-between gap-[13px]">
            <span className="text-sm text-zinc-400">Roblox Game</span>
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-[5px] px-[13px] py-[8px] text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded-[8px] transition-colors"
            >
              <Play size={14} fill="currentColor" />
              Play on Roblox
            </a>
          </div>
        )}

        {/* Actions - fixed width buttons to prevent layout shift */}
        <div className="flex items-center gap-4 pt-1">
          <button
            onClick={() => likePost(post.id)}
            className={`flex items-center justify-center gap-1.5 text-xs transition-colors min-w-[50px] ${
              post.userLiked ? "text-red-400" : "text-zinc-400 hover:text-red-400"
            }`}
          >
            <Heart size={16} fill={post.userLiked ? "currentColor" : "none"} />
            <span className="w-5 text-center tabular-nums">{post.likes}</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center justify-center gap-1.5 text-xs text-zinc-400 hover:text-emerald-400 transition-colors min-w-[50px]"
          >
            <MessageCircle size={16} />
            <span className="w-5 text-center tabular-nums">{post.comments.length}</span>
          </button>
          {/* Copy Link Button */}
          <CopyLinkButton postId={post.id} gameUrl={post.url} />
        </div>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-zinc-800 p-[21px]">
          {/* Comment count header */}
          <h3 className="text-lg font-bold text-zinc-200 mb-[21px]">
            {post.comments.length} {post.comments.length === 1 ? "comment" : "comments"}
          </h3>

          {/* Add comment */}
          {currentUser ? (
            <form onSubmit={handleComment} className="flex gap-[13px] mb-[21px]">
              <div className="w-[34px] h-[34px] rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold flex-shrink-0">
                {currentUser.username?.[0] || "Y"}
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full bg-zinc-800 border-b border-zinc-700 px-[8px] py-[8px] text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                />
                {commentText.trim() && (
                  <div className="flex justify-end gap-[8px] mt-[8px]">
                    <button
                      type="button"
                      onClick={() => setCommentText("")}
                      className="px-[13px] py-[8px] text-xs font-semibold text-zinc-400 hover:text-zinc-200 rounded-full transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!commentText.trim()}
                      className="px-[13px] py-[8px] text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-full transition-colors disabled:opacity-50"
                    >
                      Comment
                    </button>
                  </div>
                )}
              </div>
            </form>
          ) : (
            <div className="mb-[21px] p-[13px] bg-zinc-800/50 rounded-[8px] text-center text-sm text-zinc-400">
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
  );
}
