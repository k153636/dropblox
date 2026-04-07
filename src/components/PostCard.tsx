"use client";

import { useState, useEffect } from "react";
import { usePostStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import { Comment } from "@/lib/db-comments";

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

// Comment Component (simplified - flat structure)
function CommentItem({
  comment,
  postId,
}: {
  comment: Comment;
  postId: string;
}) {
  const [replyText, setReplyText] = useState("");
  const [showReplyInput, setShowReplyInput] = useState(false);
  const addComment = usePostStore((s) => s.addComment);
  const currentUser = useAuthStore((s) => s.user);

  function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim()) return;
    addComment(postId, replyText.trim(), comment.id);
    setReplyText("");
    setShowReplyInput(false);
  }

  const isAuthor = currentUser?.username === comment.author_name;

  return (
    <div className="flex gap-3">
      <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400 text-sm font-bold flex-shrink-0">
        {comment.author_name?.[0] || "?"}
      </div>
      <div className="flex-1 min-w-0">
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
        <p className="text-sm text-zinc-300 whitespace-pre-wrap">{comment.body}</p>
        
        {/* Reply button */}
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={() => setShowReplyInput(!showReplyInput)}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Reply
          </button>
        </div>

        {/* Reply input */}
        {showReplyInput && (
          <form onSubmit={handleReply} className="mt-3 flex gap-2">
            <input
              type="text"
              placeholder="Reply to comment..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
            />
            <button
              type="submit"
              disabled={!replyText.trim()}
              className="px-3 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded transition-colors disabled:opacity-50"
            >
              Reply
            </button>
          </form>
        )}
      </div>
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
    preview_playing?: number;
    preview_visits?: number;
  };
}

export default function PostCard({ post }: PostCardProps) {
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(post.body);
  
  const likePost = usePostStore((s) => s.likePost);
  const addComment = usePostStore((s) => s.addComment);
  const updatePost = usePostStore((s) => s.updatePost);
  const deletePost = usePostStore((s) => s.deletePost);
  const loadComments = usePostStore((s) => s.loadComments);
  const currentUser = useAuthStore((s) => s.user);

  // Load comments when expanding
  useEffect(() => {
    if (showComments && post.comments.length === 0) {
      loadComments(post.id);
    }
  }, [showComments, post.id, post.comments.length, loadComments]);

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
    <article className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="p-5 space-y-3">
        {/* Author & time */}
        <div className="flex items-center justify-between">
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
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="text-xs text-red-400 hover:text-red-300 px-2 py-1"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Body - editable if editing */}
        {isEditing ? (
          <form onSubmit={handleEdit} className="space-y-2">
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditBody(post.body);
                }}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs bg-emerald-500 hover:bg-emerald-600 text-white rounded"
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
            <div className="bg-zinc-900 px-4 pb-4 pt-2 -mt-1 space-y-2">
              <p className="font-semibold text-sm">{post.preview_name}</p>
              <p className="text-xs text-zinc-400 line-clamp-2">
                {post.preview_description}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex gap-3 text-xs text-zinc-500">
                  {post.preview_playing !== undefined && (
                    <span>{post.preview_playing.toLocaleString()} playing</span>
                  )}
                  {post.preview_visits !== undefined && (
                    <span>{post.preview_visits.toLocaleString()} visits</span>
                  )}
                </div>
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                >
                  ▶ Play on Roblox
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-800/50 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm text-zinc-400">Roblox Game</span>
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
            >
              ▶ Play on Roblox
            </a>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-1">
          <button
            onClick={() => likePost(post.id)}
            className={`flex items-center gap-1.5 text-xs transition-colors ${
              post.userLiked ? "text-red-400" : "text-zinc-400 hover:text-red-400"
            }`}
          >
            <span>{post.userLiked ? "♥" : "♡"}</span>
            <span>{post.likes}</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-emerald-400 transition-colors"
          >
            <span>💬</span>
            <span>{post.comments.length}</span>
          </button>
        </div>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-zinc-800 p-5">
          {/* Comment count header */}
          <h3 className="text-lg font-bold text-zinc-200 mb-4">
            {post.comments.length} {post.comments.length === 1 ? "comment" : "comments"}
          </h3>

          {/* Add comment */}
          {currentUser ? (
            <form onSubmit={handleComment} className="flex gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold flex-shrink-0">
                {currentUser.username?.[0] || "Y"}
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full bg-zinc-800 border-b border-zinc-700 px-1 py-2 text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                />
                {commentText.trim() && (
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setCommentText("")}
                      className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 rounded-full transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!commentText.trim()}
                      className="px-4 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-full transition-colors disabled:opacity-50"
                    >
                      Comment
                    </button>
                  </div>
                )}
              </div>
            </form>
          ) : (
            <div className="mb-6 p-3 bg-zinc-800/50 rounded-lg text-center text-sm text-zinc-400">
              Sign in to comment
            </div>
          )}

          {/* Comments list */}
          <div className="space-y-5">
            {post.comments.map((c) => (
              <CommentItem key={c.id} comment={c} postId={post.id} />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
