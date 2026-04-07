"use client";

import { useState } from "react";
import { usePostStore } from "@/lib/store";

export default function PostForm() {
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

  const addPost = usePostStore((s) => s.addPost);

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
    if (!isValidRobloxUrl) return;

    let finalPreview = preview;
    if (!finalPreview) {
      try {
        const res = await fetch(`/api/roblox?url=${encodeURIComponent(url)}`);
        if (res.ok) {
          finalPreview = await res.json();
        }
      } catch {
        // post without preview
      }
    }

    addPost(url.trim(), body.trim(), finalPreview || undefined);

    setUrl("");
    setBody("");
    setPreview(null);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3"
    >
      <input
        type="text"
        placeholder="Paste your Roblox game URL..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onBlur={handleUrlBlur}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
      />

      {loading && (
        <p className="text-xs text-zinc-500">Loading preview...</p>
      )}

      {preview && (
        <div className="flex gap-3 bg-zinc-800/50 rounded-lg p-3">
          {preview.thumbnail && (
            <img
              src={preview.thumbnail}
              alt={preview.name}
              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
            />
          )}
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{preview.name}</p>
            <p className="text-xs text-zinc-400 line-clamp-2">
              {preview.description}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {preview.playing.toLocaleString()} playing &middot;{" "}
              {preview.visits.toLocaleString()} visits
            </p>
          </div>
        </div>
      )}

      <textarea
        placeholder="What did you build? (optional)"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm placeholder-zinc-500 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
      />

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!isValidRobloxUrl}
          className="px-5 py-2 text-sm font-medium bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          Drop it
        </button>
      </div>
    </form>
  );
}
