"use client";

import { useEffect, useState, useCallback } from "react";
import type { Post } from "@/lib/db-posts";
import { X, ChevronLeft, ChevronRight, Heart, ExternalLink, Maximize2, Minimize2 } from "lucide-react";

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

  // Show existing thumbnail immediately, fetch real screenshots in background
  useEffect(() => {
    if (!isOpen || !post?.url) return;
    setCurrentSlide(0);
    setDescExpanded(false);
    setFullscreen(false);
    // Instantly show existing thumbnail
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

  // Keyboard nav
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

  if (!isOpen || !post) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] ${fullscreen ? 'invisible' : ''}`}
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`fixed inset-0 z-[61] flex items-center justify-center p-[21px] ${fullscreen ? 'invisible' : ''}`}>
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
            {/* Screenshot Slider */}
            <div
              className="relative aspect-video rounded-[8px] overflow-hidden bg-zinc-800 cursor-pointer"
              onClick={() => screenshots.length > 0 && setFullscreen(true)}
            >
              {screenshots.length > 0 ? (
                <>
                  {/* Slides */}
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

                  {/* Navigation arrows */}
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

                  {/* Dots indicator */}
                  {screenshots.length > 1 && (
                    <div className="absolute bottom-[8px] left-1/2 -translate-x-1/2 flex gap-[5px]">
                      {screenshots.map((_, i) => (
                        <button
                          key={i}
                          onClick={(e) => { e.stopPropagation(); setCurrentSlide(i); }}
                          className={`w-[6px] h-[6px] rounded-full transition-all ${
                            i === currentSlide
                              ? "bg-white w-[18px]"
                              : "bg-white/40 hover:bg-white/60"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                  {/* Fullscreen hint */}
                  <div className="absolute top-[8px] left-[8px] w-[28px] h-[28px] bg-black/40 backdrop-blur-md rounded-[6px] flex items-center justify-center text-white/60 hover:text-white transition-all">
                    <Maximize2 size={14} />
                  </div>
                  {/* Loading more indicator */}
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
                  className={`text-zinc-400 text-sm leading-relaxed cursor-pointer hover:text-zinc-300 transition-colors ${descExpanded ? '' : 'line-clamp-3'}`}
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
                <ExternalLink size={16} />
                Visit Game
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen overlay - outside modal so it's not affected by invisible class */}
      {fullscreen && screenshots.length > 0 && (
        <div className="fixed inset-0 z-[70] bg-black/95 flex flex-col items-center justify-center" onClick={() => setFullscreen(false)}>
          {/* Close / minimize */}
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-[21px] right-[21px] w-[34px] h-[34px] bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-all z-10"
          >
            <Minimize2 size={18} />
          </button>

          {/* Fullscreen slides */}
          <div className="relative w-full max-w-[90vw] max-h-[80vh] aspect-video overflow-hidden" onClick={(e) => e.stopPropagation()}>
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

            {/* Fullscreen nav arrows */}
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

          {/* Fullscreen dots */}
          {screenshots.length > 1 && (
            <div className="flex gap-[8px] mt-[21px]" onClick={(e) => e.stopPropagation()}>
              {screenshots.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`w-[8px] h-[8px] rounded-full transition-all ${
                    i === currentSlide
                      ? "bg-white w-[24px]"
                      : "bg-white/30 hover:bg-white/50"
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
