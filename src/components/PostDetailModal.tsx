"use client";

import { useEffect } from "react";
import type { Post } from "@/lib/db-posts";
import { X } from "lucide-react";

interface PostDetailModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
}

const HeartIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

const ExternalLinkIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" x2="21" y1="14" y2="3" />
  </svg>
);

export default function PostDetailModal({ post, isOpen, onClose }: PostDetailModalProps) {
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

          {/* Content */}
          <div className="p-[21px] space-y-[21px]">
            {/* Thumbnail */}
            {post.preview_thumbnail && (
              <div className="aspect-video rounded-[8px] overflow-hidden bg-zinc-800">
                <img
                  src={post.preview_thumbnail}
                  alt={post.preview_name || "Game thumbnail"}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Game Info */}
            <div className="space-y-[13px]">
              <h1 className="text-2xl font-bold text-zinc-100">
                {post.preview_name || "Untitled Game"}
              </h1>
              
              {post.preview_description && (
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {post.preview_description}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-[21px] py-[13px] border-y border-zinc-800">
              <div className="flex items-center gap-[8px] text-zinc-400">
                <HeartIcon className="w-[21px] h-[21px] text-emerald-500" />
                <span className="font-medium">{post.likes || 0} likes</span>
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

            {/* Posted by */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-zinc-500">
                Posted by <span className="text-zinc-300 font-medium">{post.author_name}</span>
              </div>
              
              {/* Visit Game Button */}
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-[8px] px-[21px] py-[13px] bg-emerald-500 hover:bg-emerald-600 text-white rounded-[8px] font-medium text-sm transition-colors"
              >
                <ExternalLinkIcon className="w-[16px] h-[16px]" />
                Visit Game
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
