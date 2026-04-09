"use client";

import { Suspense } from "react";
import SearchPageContent from "./SearchPageContent";

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageFallback />}>
      <SearchPageContent />
    </Suspense>
  );
}

// ローディング時のフォールバック
function SearchPageFallback() {
  return (
    <main className="min-h-screen bg-zinc-950 pt-[55px]">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center py-20">
          <p className="text-zinc-400">読み込み中...</p>
        </div>
      </div>
    </main>
  );
}
