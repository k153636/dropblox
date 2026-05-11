"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { usePostStore } from "@/lib/store";
import PostCard from "./PostCard";
import { Flame, Clock } from "lucide-react";

const BUFFER_ITEMS = 5;
const MAX_DOM_ITEMS = 50;

export default function Feed() {
  const posts = usePostStore((s) => s.posts);
  const isLoading = usePostStore((s) => s.isLoading);
  const isLoadingMore = usePostStore((s) => s.isLoadingMore);
  const hasMore = usePostStore((s) => s.hasMore);
  const loadPosts = usePostStore((s) => s.loadPosts);
  const loadMorePosts = usePostStore((s) => s.loadMorePosts);
  const subscribeToRealtime = usePostStore((s) => s.subscribeToRealtime);
  const activeGenre = usePostStore((s) => s.activeGenre);
  const sortBy = usePostStore((s) => s.sortBy);
  const genres = usePostStore((s) => s.genres);
  const loadGenres = usePostStore((s) => s.loadGenres);
  const setGenre = usePostStore((s) => s.setGenre);
  const setSortBy = usePostStore((s) => s.setSortBy);

  // Virtualization state
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: MAX_DOM_ITEMS });
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    loadPosts();
    loadGenres();
  }, [loadPosts, loadGenres]);

  // Subscribe to realtime updates
  useEffect(() => {
    const unsubscribe = subscribeToRealtime();
    return () => {
      unsubscribe();
    };
  }, [subscribeToRealtime]);

  // Virtualization: track which items are visible
  useEffect(() => {
    if (!containerRef.current) return;

    const options = {
      root: null,
      rootMargin: `${BUFFER_ITEMS * 200}px`, // Buffer zone
      threshold: 0,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const id = entry.target.getAttribute("data-id");
        if (!id) return;
        
        const index = posts.findIndex((p) => p.id === id);
        if (index === -1) return;

        // Update visible range based on intersecting items
        if (entry.isIntersecting) {
          setVisibleRange((prev) => {
            const newStart = Math.min(prev.start, Math.max(0, index - BUFFER_ITEMS));
            const newEnd = Math.max(prev.end, Math.min(posts.length, index + BUFFER_ITEMS + 10));
            // Limit to MAX_DOM_ITEMS
            if (newEnd - newStart > MAX_DOM_ITEMS) {
              return { start: index - MAX_DOM_ITEMS / 2, end: index + MAX_DOM_ITEMS / 2 };
            }
            return { start: newStart, end: newEnd };
          });
        }
      });
    }, options);

    // Observe all items
    itemRefs.current.forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [posts]);

  // Infinite scroll with Intersection Observer
  const handleLoadMore = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !isLoadingMore) {
        loadMorePosts();
      }
    },
    [hasMore, isLoadingMore, loadMorePosts]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const loadMoreObserver = new IntersectionObserver(handleLoadMore, {
      threshold: 0.1,
      rootMargin: "100px",
    });

    loadMoreObserver.observe(element);

    return () => {
      loadMoreObserver.disconnect();
    };
  }, [handleLoadMore]);

  const setItemRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    if (el) {
      itemRefs.current.set(id, el);
      observerRef.current?.observe(el);
    } else {
      itemRefs.current.delete(id);
    }
  }, []);

  const FilterBar = () => (
    <div className="mb-[21px] space-y-[13px]">
      {/* Sort toggle */}
      <div className="flex items-center gap-[8px]">
        <button
          onClick={() => setSortBy("recent")}
          className={`flex items-center gap-[6px] px-[13px] py-[6px] rounded-[8px] text-xs font-medium transition-all ${
            sortBy === "recent"
              ? "bg-white/[0.08] text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
          }`}
        >
          <Clock size={13} />
          Recent
        </button>
        <button
          onClick={() => setSortBy("popular")}
          className={`flex items-center gap-[6px] px-[13px] py-[6px] rounded-[8px] text-xs font-medium transition-all ${
            sortBy === "popular"
              ? "bg-white/[0.08] text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
          }`}
        >
          <Flame size={13} />
          Popular
        </button>
      </div>

      {/* Genre chips */}
      {genres.length > 0 && (
        <div className="flex flex-wrap gap-[6px]">
          <button
            onClick={() => setGenre("")}
            className={`px-[10px] py-[4px] rounded-full text-xs transition-all ${
              activeGenre === ""
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-white/[0.04] text-zinc-500 border border-white/[0.06] hover:text-zinc-300 hover:bg-white/[0.08]"
            }`}
          >
            All
          </button>
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setGenre(g)}
              className={`px-[10px] py-[4px] rounded-full text-xs transition-all ${
                activeGenre === g
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-white/[0.04] text-zinc-500 border border-white/[0.06] hover:text-zinc-300 hover:bg-white/[0.08]"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <>
        <FilterBar />
        <div className="space-y-[21px]">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white/[0.028] backdrop-blur-md border border-white/[0.05] rounded-[13px] overflow-hidden animate-pulse">
              <div className="p-[21px] space-y-[13px]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/[0.06]" />
                  <div className="space-y-[6px]">
                    <div className="h-[12px] w-[89px] bg-white/[0.06] rounded-[4px]" />
                    <div className="h-[10px] w-[55px] bg-white/[0.04] rounded-[4px]" />
                  </div>
                </div>
                <div className="bg-white/[0.04] rounded-[8px] aspect-square" />
                <div className="flex gap-[5px]">
                  <div className="h-[28px] w-[54px] bg-white/[0.04] rounded-[6px]" />
                  <div className="h-[28px] w-[54px] bg-white/[0.04] rounded-[6px]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  if (posts.length === 0) {
    return (
      <>
        <FilterBar />
        <div className="text-center py-[55px] space-y-[13px]">
          <div className="w-[55px] h-[55px] mx-auto bg-white/[0.04] backdrop-blur-md border border-white/[0.05] rounded-[13px] flex items-center justify-center text-[24px]">
            🎮
          </div>
          <p className="text-zinc-200 text-lg font-semibold">
            {activeGenre ? `No ${activeGenre} games yet` : "No drops yet"}
          </p>
          <p className="text-zinc-500 text-sm">
            {activeGenre ? "Try a different genre or check back later." : "Be the first to share a Roblox game!"}
          </p>
        </div>
      </>
    );
  }

  const startIdx = Math.max(0, visibleRange.start);
  const endIdx = Math.min(posts.length, visibleRange.end);

  return (
    <>
      <FilterBar />
      <div ref={containerRef} className="space-y-[21px]">
        {posts.slice(startIdx, endIdx).map((post, idx) => (
          <div
            key={post.id}
            ref={setItemRef(post.id)}
            data-id={post.id}
            data-index={startIdx + idx}
          >
            <PostCard post={post} />
          </div>
        ))}

        {process.env.NODE_ENV === "development" && (
          <div className="text-xs text-zinc-600 text-center py-[8px]">
            Showing {startIdx + 1}-{endIdx} of {posts.length} posts | DOM nodes: {endIdx - startIdx}
          </div>
        )}

        <div ref={loadMoreRef} className="py-[21px] text-center">
          {isLoadingMore ? (
            <div className="flex items-center justify-center gap-[8px] text-zinc-500">
              <div className="w-[21px] h-[21px] border-2 border-zinc-600 border-t-emerald-500 rounded-full animate-spin" />
              <span className="text-sm">Loading more...</span>
            </div>
          ) : hasMore ? (
            <div className="h-[21px]" />
          ) : (
            <p className="text-sm text-zinc-500">No more posts</p>
          )}
        </div>
      </div>
    </>
  );
}
