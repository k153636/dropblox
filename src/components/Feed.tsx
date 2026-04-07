"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { usePostStore } from "@/lib/store";
import PostCard from "./PostCard";

const ITEMS_PER_PAGE = 20;
const BUFFER_ITEMS = 5; // Extra items above/below viewport
const MAX_DOM_ITEMS = 50; // Target: keep DOM nodes under 50

interface VirtualItem {
  id: string;
  index: number;
  isVisible: boolean;
}

export default function Feed() {
  const posts = usePostStore((s) => s.posts);
  const isLoading = usePostStore((s) => s.isLoading);
  const isLoadingMore = usePostStore((s) => s.isLoadingMore);
  const hasMore = usePostStore((s) => s.hasMore);
  const loadPosts = usePostStore((s) => s.loadPosts);
  const loadMorePosts = usePostStore((s) => s.loadMorePosts);
  const subscribeToRealtime = usePostStore((s) => s.subscribeToRealtime);
  
  // Virtualization state
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: MAX_DOM_ITEMS });
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Load posts on mount
  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

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

  if (isLoading) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-4xl">⏳</p>
        <p className="text-zinc-400 text-lg font-medium">Loading...</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-4xl">🎮</p>
        <p className="text-zinc-400 text-lg font-medium">No drops yet</p>
        <p className="text-zinc-500 text-sm">
          Be the first to share a Roblox game!
        </p>
      </div>
    );
  }

  // Calculate visible items
  const startIdx = Math.max(0, visibleRange.start);
  const endIdx = Math.min(posts.length, visibleRange.end);

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Virtual padding top */}
      {startIdx > 0 && (
        <div style={{ height: startIdx * 200 }} className="w-full" />
      )}
      
      {/* Visible items only */}
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
      
      {/* Virtual padding bottom */}
      {endIdx < posts.length && (
        <div style={{ height: (posts.length - endIdx) * 200 }} className="w-full" />
      )}
      
      {/* Stats for debugging */}
      <div className="text-xs text-zinc-600 text-center py-2">
        Showing {startIdx + 1}-{endIdx} of {posts.length} posts | DOM nodes: {endIdx - startIdx}
      </div>
      
      {/* Infinite scroll trigger */}
      <div ref={loadMoreRef} className="py-4 text-center">
        {isLoadingMore ? (
          <div className="flex items-center justify-center gap-2 text-zinc-500">
            <div className="w-5 h-5 border-2 border-zinc-600 border-t-emerald-500 rounded-full animate-spin" />
            <span className="text-sm">Loading more...</span>
          </div>
        ) : hasMore ? (
          <div className="h-8" /> // Spacer for observer
        ) : (
          <p className="text-sm text-zinc-500">No more posts</p>
        )}
      </div>
    </div>
  );
}
