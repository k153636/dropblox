"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { Post } from "@/lib/db-posts";
import type { Comment } from "@/lib/db-comments";
import { usePostStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  ExternalLink,
  Maximize2,
  Minimize2,
  MessageCircle,
  Send,
  Trash2,
  CornerDownRight,
  Check,
  Edit2,
} from "lucide-react";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

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
    s.posts.find((p) => p.id === postId)?.comments.filter((c) => c.parent_id === comment.id) || []
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

  const isAuthor = currentUser?.id === comment.author_id;

  if (depth >= 5) return null;

  return (
    <div className={`${depth > 0 ? "ml-[34px] mt-[13px]" : ""}`}>
      <div className="flex gap-[13px]">
        <div className="w-[34px] h-[34px] rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400 text-xs font-bold flex-shrink-0">
          {comment.author_name?.[0] || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-[8px] mb-[5px]">
            <span className="font-semibold text-sm text-zinc-300">{comment.author_name}</span>
            <span className="text-xs text-zinc-500">{timeAgo(comment.created_at)}</span>
            {isAuthor && <span className="text-xs text-emerald-500">(You)</span>}
          </div>

          {isEditing ? (
            <form onSubmit={handleEdit} className="flex gap-[8px] mt-[5px]">
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-[6px] px-[8px] py-[5px] text-sm focus:outline-none focus:border-zinc-500"
                autoFocus
              />
              <button type="submit" className="p-[5px] text-emerald-400 hover:text-emerald-300">
                <Check size={16} />
              </button>
              <button
                type="button"
                onClick={() => { setIsEditing(false); setEditText(comment.body); }}
                className="p-[5px] text-zinc-400 hover:text-zinc-300"
              >
                <X size={16} />
              </button>
            </form>
          ) : (
            <p className="text-sm text-zinc-300 whitespace-pre-wrap">{comment.body}</p>
          )}

          {!isEditing && (
            <div className="flex items-center gap-[13px] mt-[8px]">
              <button
                onClick={() => likeComment(postId, comment.id)}
                className={`flex items-center gap-[5px] text-xs transition-colors min-w-[40px] ${
                  comment.user_has_liked ? "text-red-400" : "text-zinc-500 hover:text-red-400"
                }`}
              >
                <Heart size={13} fill={comment.user_has_liked ? "currentColor" : "none"} />
                <span className="w-[16px] text-center tabular-nums">
                  {comment.comment_likes_count > 0 ? comment.comment_likes_count : ""}
                </span>
              </button>

              <button
                onClick={() => setShowReplyInput(!showReplyInput)}
                className="flex items-center gap-[5px] text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <CornerDownRight size={13} />
                <span>Reply</span>
              </button>

              {isAuthor && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-[5px] text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-[5px] text-xs text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </>
              )}
            </div>
          )}

          {showReplyInput && (
            <form onSubmit={handleReply} className="mt-[13px] flex gap-[8px]">
              <input
                type="text"
                placeholder="Reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-[6px] px-[13px] py-[8px] text-sm focus:outline-none focus:border-zinc-500"
                autoFocus
              />
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="px-[13px] py-[8px] text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-[6px] transition-colors disabled:opacity-50"
              >
                <Send size={13} />
              </button>
            </form>
          )}
        </div>
      </div>

      {childComments.length > 0 && (
        <div className="mt-[13px]">
          {childComments.map((child) => (
            <CommentItem key={child.id} comment={child} postId={postId} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

interface PostDetailModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PostDetailModal({ post, isOpen, onClose }: PostDetailModalProps) {
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const commentListRef = useRef<HTMLDivElement>(null);

  const currentUser = useAuthStore((s) => s.user);
  const loadComments = usePostStore((s) => s.loadComments);
  const addComment = usePostStore((s) => s.addComment);
  const postWithComments = usePostStore((s) =>
    post ? s.posts.find((p) => p.id === post.id) : undefined
  );
  const comments = postWithComments?.comments || [];
  const topLevelComments = comments.filter((c) => !c.parent_id);

  // Load comments when modal opens
  useEffect(() => {
    if (!isOpen || !post?.id) return;
    setCommentText("");
    setCommentsLoading(true);
    loadComments(post.id).finally(() => setCommentsLoading(false));
  }, [isOpen, post?.id, loadComments]);

  // Auto-scroll to bottom of comments when new comments arrive
  useEffect(() => {
    if (commentListRef.current && comments.length > 0) {
      commentListRef.current.scrollTop = commentListRef.current.scrollHeight;
    }
  }, [comments.length]);

  // Show existing thumbnail immediately, fetch real screenshots in background
  useEffect(() => {
    if (!isOpen || !post?.url) return;
    setCurrentSlide(0);
    setDescExpanded(false);
    setFullscreen(false);
    setScreenshots(post.preview_thumbnail ? [post.preview_thumbnail] : []);
    setLoadingMore(true);

    fetch(`/api/roblox/screenshots?url=${encodeURIComponent(post.url)}`)
      .then((res) => res.json())
      .then((data: { screenshots: string[] }) => {
        const imgs = data.screenshots || [];
        if (imgs.length > 0) {
          setScreenshots(imgs);
          setCurrentSlide(0);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }, [isOpen, post?.url, post?.preview_thumbnail]);

  const goNext = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % screenshots.length);
  }, [screenshots.length]);

  const goPrev = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + screenshots.length) % screenshots.length);
  }, [screenshots.length]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && screenshots.length > 1) goNext();
      if (e.key === "ArrowLeft" && screenshots.length > 1) goPrev();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose, screenshots.length, goNext, goPrev]);

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || !post) return;
    const text = commentText.trim();
    setCommentText("");
    await addComment(post.id, text);
  }

  if (!isOpen || !post) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] ${fullscreen ? "invisible" : ""}`}
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`fixed inset-0 z-[61] flex items-center justify-center p-[21px] ${fullscreen ? "invisible" : ""}`}>
        <div className="w-full max-w-[760px] max-h-[90vh] flex flex-col bg-zinc-900/70 backdrop-blur-xl border border-white/[0.08] rounded-[13px] shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-[21px] py-[13px] border-b border-white/[0.06] flex-shrink-0">
            <h2 className="text-lg font-semibold text-zinc-100 truncate pr-[13px]">
              {post.preview_name || "Game Details"}
            </h2>
            <button
              onClick={onClose}
              className="p-[8px] text-zinc-400 hover:text-zinc-200 transition-colors rounded-[8px] hover:bg-white/[0.06] flex-shrink-0"
            >
              <X size={21} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1">
            <div className="p-[21px] space-y-[21px]">
              {/* Screenshot Slider */}
              <div
                className="relative aspect-video rounded-[8px] overflow-hidden bg-zinc-800 cursor-pointer"
                onClick={() => screenshots.length > 0 && setFullscreen(true)}
              >
                {screenshots.length > 0 ? (
                  <>
                    <div
                      className="flex h-full transition-transform duration-300 ease-out"
                      style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                    >
                      {screenshots.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`${post.preview_name || "Game"} screenshot ${i + 1}`}
                          className="w-full h-full object-cover flex-shrink-0"
                        />
                      ))}
                    </div>

                    {screenshots.length > 1 && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); goPrev(); }}
                          className="absolute left-[8px] top-1/2 -translate-y-1/2 w-[34px] h-[34px] bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition-all"
                        >
                          <ChevronLeft size={18} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); goNext(); }}
                          className="absolute right-[8px] top-1/2 -translate-y-1/2 w-[34px] h-[34px] bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition-all"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </>
                    )}

                    {screenshots.length > 1 && (
                      <div className="absolute bottom-[8px] left-1/2 -translate-x-1/2 flex gap-[5px]">
                        {screenshots.map((_, i) => (
                          <button
                            key={i}
                            onClick={(e) => { e.stopPropagation(); setCurrentSlide(i); }}
                            className={`w-[6px] h-[6px] rounded-full transition-all ${
                              i === currentSlide ? "bg-white w-[18px]" : "bg-white/40 hover:bg-white/60"
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    <div className="absolute top-[8px] left-[8px] w-[28px] h-[28px] bg-black/40 backdrop-blur-md rounded-[6px] flex items-center justify-center text-white/60 hover:text-white transition-all">
                      <Maximize2 size={14} />
                    </div>
                    {loadingMore && (
                      <div className="absolute top-[8px] right-[8px] w-[21px] h-[21px] border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-sm">
                    No screenshots available
                  </div>
                )}
              </div>

              {/* Game Info */}
              <div className="space-y-[13px]">
                <h1 className="text-2xl font-bold text-zinc-100">
                  {post.preview_name || "Untitled Game"}
                </h1>
                {post.preview_description && (
                  <p
                    className={`text-zinc-400 text-sm leading-relaxed cursor-pointer hover:text-zinc-300 transition-colors ${descExpanded ? "" : "line-clamp-3"}`}
                    onClick={() => setDescExpanded(!descExpanded)}
                  >
                    {post.preview_description}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-[21px] py-[13px] border-y border-zinc-800">
                <div className="flex items-center gap-[8px] text-zinc-400">
                  <Heart size={21} className="text-emerald-500" fill="currentColor" />
                  <span className="font-medium">{post.likes || 0} likes</span>
                </div>
                <div className="flex items-center gap-[8px] text-zinc-400">
                  <MessageCircle size={21} className="text-blue-400" />
                  <span className="font-medium">{comments.length} comments</span>
                </div>
                {(post.preview_playing || post.preview_visits) && (
                  <div className="flex items-center gap-[13px] text-sm text-zinc-500">
                    {post.preview_playing && (
                      <span>{Number(post.preview_playing).toLocaleString()} playing</span>
                    )}
                    {post.preview_visits && (
                      <span>{Number(post.preview_visits).toLocaleString()} visits</span>
                    )}
                  </div>
                )}
              </div>

              {/* Posted by + Visit button */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-zinc-500">
                  Posted by <span className="text-zinc-300 font-medium">{post.author_name}</span>
                </div>
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-[8px] px-[21px] py-[13px] bg-emerald-500 hover:bg-emerald-600 text-white rounded-[8px] font-medium text-sm transition-colors"
                >
                  <ExternalLink size={16} />
                  Visit Game
                </a>
              </div>

              {/* Comments Section */}
              <div className="border-t border-white/[0.06] pt-[21px] space-y-[21px]">
                <h3 className="text-base font-semibold text-zinc-200">
                  {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
                </h3>

                {/* Add comment form */}
                {currentUser ? (
                  <form onSubmit={handleComment} className="flex gap-[13px]">
                    <div className="w-[34px] h-[34px] rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold flex-shrink-0">
                      {currentUser.username?.[0] || "Y"}
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="w-full bg-white/[0.04] border-b border-white/[0.08] px-[8px] py-[8px] text-sm placeholder-zinc-500 focus:outline-none focus:border-emerald-500/40 transition-colors"
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
                  <div className="p-[13px] bg-zinc-800/50 rounded-[8px] text-center text-sm text-zinc-400">
                    Sign in to comment
                  </div>
                )}

                {/* Comment list */}
                {commentsLoading ? (
                  <div className="flex items-center justify-center py-[34px]">
                    <div className="w-6 h-6 border-2 border-zinc-600 border-t-emerald-500 rounded-full animate-spin" />
                  </div>
                ) : (
                  <div ref={commentListRef} className="space-y-[21px]">
                    {topLevelComments.length === 0 ? (
                      <div className="text-center text-sm text-zinc-500 py-[21px]">
                        No comments yet. Be the first to comment!
                      </div>
                    ) : (
                      topLevelComments.map((c) => (
                        <CommentItem key={c.id} comment={c} postId={post.id} />
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen overlay */}
      {fullscreen && screenshots.length > 0 && (
        <div
          className="fixed inset-0 z-[70] bg-black/95 flex flex-col items-center justify-center"
          onClick={() => setFullscreen(false)}
        >
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-[21px] right-[21px] w-[34px] h-[34px] bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-all z-10"
          >
            <Minimize2 size={18} />
          </button>

          <div
            className="relative w-full max-w-[90vw] max-h-[80vh] aspect-video overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex h-full transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {screenshots.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`${post.preview_name || "Game"} screenshot ${i + 1}`}
                  className="w-full h-full object-contain flex-shrink-0"
                />
              ))}
            </div>

            {screenshots.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); goPrev(); }}
                  className="absolute left-[13px] top-1/2 -translate-y-1/2 w-[42px] h-[42px] bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-all"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); goNext(); }}
                  className="absolute right-[13px] top-1/2 -translate-y-1/2 w-[42px] h-[42px] bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-all"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>

          {screenshots.length > 1 && (
            <div className="flex gap-[8px] mt-[21px]" onClick={(e) => e.stopPropagation()}>
              {screenshots.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`w-[8px] h-[8px] rounded-full transition-all ${
                    i === currentSlide ? "bg-white w-[24px]" : "bg-white/30 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
