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

function SearchPageFallback() {
  return (
    <main className="min-h-screen bg-zinc-950 pt-[55px]">
      <div className="max-w-[610px] mx-auto px-[21px] pt-[34px] pb-[89px]">
        <div className="flex items-center justify-center py-[89px]">
          <p className="text-zinc-500 text-[13px]">Loading...</p>
        </div>
      </div>
    </main>
  );
}
