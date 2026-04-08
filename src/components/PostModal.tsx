"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { createPost } from "@/lib/db-posts";

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// SVG Icons
const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export default function PostModal({ isOpen, onClose }: PostModalProps) {
  const [url, setUrl] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{
    name: string;
    description: string;
    thumbnail: string;
    playing: number;
    visits: number;
  } | null>(null);

  const { user } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setUrl("");
      setBody("");
      setPreview(null);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  async function handleUrlBlur() {
    if (!url.includes("roblox.com") || !url.includes("games/")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/roblox?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const data = await res.json();
        setPreview(data);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }

  const isValidRobloxUrl = url.includes("roblox.com") && /games\/\d+/.test(url);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidRobloxUrl || !user) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    let finalPreview = preview;
    if (!finalPreview) {
      try {
        const res = await fetch(`/api/roblox?url=${encodeURIComponent(url)}`);
        if (res.ok) {
          finalPreview = await res.json();
        }
      } catch {
        // ignore
      }
    }

    const post = await createPost(
      { url, body, preview: finalPreview || undefined },
      user.id,
      user.username
    );

    setLoading(false);

    if (post) {
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setError("Failed to create post.");
    }
  }

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

  if (!isOpen) return null;

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
            <h2 className="text-lg font-semibold text-zinc-100">New Post</h2>
            <button
              onClick={onClose}
              className="p-[8px] text-zinc-400 hover:text-zinc-200 transition-colors rounded-[8px] hover:bg-zinc-800"
            >
              <XIcon className="w-[21px] h-[21px]" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-[21px] space-y-[21px]">
            {/* Roblox URL */}
            <div className="space-y-[8px]">
              <label className="block text-sm font-medium text-zinc-300">
                Roblox Game URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={handleUrlBlur}
                placeholder="https://www.roblox.com/games/..."
                className="w-full px-[13px] py-[13px] bg-zinc-800 border border-zinc-700 rounded-[8px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                required
              />
            </div>

            {/* Preview */}
            {preview && (
              <div className="p-[13px] bg-zinc-800/50 border border-zinc-700 rounded-[8px] space-y-[8px]">
                <img
                  src={preview.thumbnail}
                  alt={preview.name}
                  className="w-full aspect-ratio-16/9 object-cover rounded-[8px]"
                />
                <h3 className="font-semibold text-zinc-100">{preview.name}</h3>
                <p className="text-sm text-zinc-400 line-clamp-2">{preview.description}</p>
                <div className="flex items-center gap-[13px] text-xs text-zinc-500">
                  <span>{preview.playing.toLocaleString()} playing</span>
                  <span>{preview.visits.toLocaleString()} visits</span>
                </div>
              </div>
            )}

            {/* Body */}
            <div className="space-y-[8px]">
              <label className="block text-sm font-medium text-zinc-300">
                Comment (optional)
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
                Post created successfully!
              </div>
            )}

            {/* Submit Button */}
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
                disabled={loading || !isValidRobloxUrl}
                className="px-[21px] py-[13px] text-sm font-medium bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-[8px] transition-colors"
              >
                {loading ? "Posting..." : "Post"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
