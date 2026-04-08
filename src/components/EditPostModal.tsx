"use client";

import { useState, useEffect } from "react";
import type { Post } from "@/lib/db-posts";
import { updatePost } from "@/lib/db-posts";

interface EditPostModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedPost: Post) => void;
}

// SVG Icons
const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export default function EditPostModal({ post, isOpen, onClose, onUpdate }: EditPostModalProps) {
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

    const updated = await updatePost(post.id, { body }, post.author_id);

    setLoading(false);

    if (updated) {
      setSuccess(true);
      onUpdate(updated);
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setError("Failed to update post");
    }
  }

  if (!isOpen || !post) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-[60] transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-[21px]">
        <div className="w-full max-w-[610px] max-h-[90vh] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-[13px] shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-[21px] py-[13px] border-b border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-100">Edit Post</h2>
            <button
              onClick={onClose}
              className="p-[8px] text-zinc-400 hover:text-zinc-200 transition-colors rounded-[8px] hover:bg-zinc-800"
            >
              <XIcon className="w-[21px] h-[21px]" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-[21px] space-y-[21px]">
            {/* Game Info (Read-only) */}
            <div className="p-[13px] bg-zinc-800/50 border border-zinc-700 rounded-[8px] space-y-[13px]">
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
                className="w-full px-[13px] py-[13px] bg-zinc-800 border border-zinc-700 rounded-[8px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors resize-none"
              />
            </div>

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
            <div className="flex justify-end gap-[13px]">
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
          </form>
        </div>
      </div>
    </>
  );
}
