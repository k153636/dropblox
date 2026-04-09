"use client";

import { useState, useEffect } from "react";
import type { Post } from "@/lib/db-posts";
import { usePostStore } from "@/lib/store";
import { X } from "lucide-react";

interface EditPostModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedPost: Post) => void;
  onDelete?: (postId: string) => void;
}

export default function EditPostModal({ post, isOpen, onClose, onUpdate, onDelete }: EditPostModalProps) {
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const storeUpdatePost = usePostStore((s) => s.updatePost);
  const storeDeletePost = usePostStore((s) => s.deletePost);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && post) {
      setBody(post.body || "");
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, post]);

  // Close on escape key
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!post) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await storeUpdatePost(post.id, body);
      setLoading(false);
      setSuccess(true);
      onUpdate({ ...post, body });
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch {
      setLoading(false);
      setError("Failed to update post");
    }
  }

  async function handleDelete() {
    if (!post) return;

    setDeleting(true);
    setError(null);

    try {
      await storeDeletePost(post.id);
      setDeleting(false);
      onDelete?.(post.id);
      onClose();
    } catch {
      setDeleting(false);
      setError("Failed to delete post");
      setShowDeleteConfirm(false);
    }
  }

  if (!isOpen || !post) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-[21px]">
        <div className="w-full max-w-[610px] max-h-[90vh] overflow-y-auto bg-zinc-900/70 backdrop-blur-xl border border-white/[0.08] rounded-[13px] shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-[21px] py-[13px] border-b border-white/[0.06]">
            <h2 className="text-lg font-semibold text-zinc-100">Edit Post</h2>
            <button
              onClick={onClose}
              className="p-[8px] text-zinc-400 hover:text-zinc-200 transition-colors rounded-[8px] hover:bg-white/[0.06]"
            >
              <X size={21} />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-[21px] space-y-[21px]">
            {/* Game Info (Read-only) */}
            <div className="p-[13px] bg-white/[0.04] border border-white/[0.06] rounded-[8px] space-y-[13px]">
              {post.preview_thumbnail && (
                <img
                  src={post.preview_thumbnail}
                  alt={post.preview_name || "Game thumbnail"}
                  className="w-full aspect-video object-cover rounded-[8px]"
                />
              )}
              <div>
                <label className="block text-xs text-zinc-500 mb-[5px]">Game</label>
                <p className="font-medium text-zinc-200">{post.preview_name || "Untitled Game"}</p>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-[5px]">URL</label>
                <p className="text-sm text-zinc-400 truncate">{post.url}</p>
              </div>
            </div>

            {/* Body Edit */}
            <div className="space-y-[8px]">
              <label className="block text-sm font-medium text-zinc-300">
                Comment
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write something about this game..."
                rows={4}
                className="w-full px-[13px] py-[13px] bg-white/[0.04] border border-white/[0.08] rounded-[8px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition-all resize-none"
              />
            </div>

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
              <div className="p-[13px] bg-red-500/10 border border-red-500/20 rounded-[8px] space-y-[13px]">
                <p className="text-sm text-red-400">
                  Are you sure you want to delete this post? This action cannot be undone.
                </p>
                <div className="flex gap-[8px] justify-end">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                    className="px-[13px] py-[8px] text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-[13px] py-[8px] text-sm font-medium bg-red-500 hover:bg-red-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-[6px] transition-colors"
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            )}

            {/* Error & Success */}
            {error && (
              <div className="p-[13px] bg-red-500/10 border border-red-500/20 rounded-[8px] text-sm text-red-400">
                {error}
              </div>
            )}
            {success && (
              <div className="p-[13px] bg-emerald-500/10 border border-emerald-500/20 rounded-[8px] text-sm text-emerald-400">
                Post updated successfully!
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-between items-center">
              {/* Delete button */}
              {!showDeleteConfirm && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-[21px] py-[13px] text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-[8px] transition-colors"
                >
                  Delete
                </button>
              )}
              {showDeleteConfirm && <div />}

              {/* Save/Cancel buttons */}
              <div className="flex gap-[13px]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-[21px] py-[13px] text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-[21px] py-[13px] text-sm font-medium bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-[8px] transition-colors"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
