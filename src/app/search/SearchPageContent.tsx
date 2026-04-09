"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePostStore } from "@/lib/store";
import PostCard from "@/components/PostCard";
import { getDistinctGenres } from "@/lib/db-posts";
import { Search, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const {
    searchPosts,
    searchResults,
    isSearching,
    hasSearched,
    searchQuery,
    setSearchQuery
  } = usePostStore();

  const [inputValue, setInputValue] = useState(query);
  const [genres, setGenres] = useState<string[]>([]);

  // Fetch popular genres
  useEffect(() => {
    getDistinctGenres(8).then((g) => {
      setGenres(g.length > 0 ? g : ["Adventure", "Horror", "RPG", "Simulation", "Action"]);
    });
  }, []);

  // 初期検索（URLパラメータから）
  useEffect(() => {
    if (query && query !== searchQuery) {
      setSearchQuery(query);
      searchPosts(query);
    }
  }, [query, searchQuery, setSearchQuery, searchPosts]);

  // 新しい検索
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setSearchQuery(inputValue);
    await searchPosts(inputValue);

    // URLを更新（履歴に残す）
    const url = new URL(window.location.href);
    url.searchParams.set("q", inputValue);
    window.history.pushState({}, "", url);
  };

  return (
    <main className="min-h-screen bg-zinc-950 pt-[55px]">
      <div className="max-w-[610px] mx-auto px-[21px] pt-[34px] pb-[89px]">

        {/* 戻るリンク */}
        <Link
          href="/"
          className="inline-flex items-center gap-[8px] text-zinc-500 hover:text-zinc-200 transition-colors mb-[34px] text-[13px] tracking-wide"
        >
          <ArrowLeft size={14} />
          <span>Feedに戻る</span>
        </Link>

        {/* ── 検索カード ── */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/[0.06] rounded-[13px] p-[34px] mb-[34px]">
          <h1 className="text-[21px] font-bold text-zinc-50 tracking-tight mb-[21px]">
            ゲームを検索
          </h1>
          <form onSubmit={handleSearch} className="relative">
            <div className="relative flex items-center">
              <Search className="absolute left-[13px] w-[18px] h-[18px] text-zinc-500" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="ゲーム名、タグ、説明文..."
                className="w-full pl-[42px] pr-[89px] py-[13px] bg-white/[0.04] border border-white/[0.08] rounded-[8px]
                         text-sm text-zinc-200 placeholder-zinc-500
                         focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20
                         transition-all"
              />
              <button
                type="submit"
                disabled={isSearching || !inputValue.trim()}
                className="absolute right-[8px] px-[13px] py-[8px] bg-emerald-500/90 hover:bg-emerald-500
                         disabled:bg-zinc-700 disabled:cursor-not-allowed
                         text-white text-xs font-medium rounded-[8px] transition-all"
              >
                {isSearching ? (
                  <Loader2 className="w-[14px] h-[14px] animate-spin" />
                ) : (
                  "検索"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ── 検索結果 ── */}
        <div>
          {/* 結果サマリー */}
          {hasSearched && (
            <div className="flex items-center justify-between mb-[21px]">
              <p className="text-zinc-500 text-[13px]">
                {isSearching ? (
                  "検索中..."
                ) : (
                  <>
                    <span className="text-zinc-200 font-medium">&ldquo;{searchQuery}&rdquo;</span>
                    {" の検索結果 "}
                    <span className="text-emerald-400 font-semibold tabular-nums">{searchResults.length}件</span>
                  </>
                )}
              </p>
            </div>
          )}

          {/* 結果グリッド */}
          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-[89px] gap-[13px]">
              <Loader2 className="w-[34px] h-[34px] text-emerald-400/60 animate-spin" />
              <span className="text-zinc-500 text-[13px]">検索中...</span>
            </div>
          ) : hasSearched && searchResults.length > 0 ? (
            <div className="space-y-[21px]">
              {searchResults.map((post) => (
                <PostCard
                  key={post.id}
                  post={{
                    ...post,
                    userLiked: false,
                    comments: [],
                  }}
                />
              ))}
            </div>
          ) : hasSearched ? (
            // 結果なし
            <div className="text-center py-[89px]">
              <div className="w-[55px] h-[55px] bg-zinc-900/50 backdrop-blur-sm border border-white/[0.06] rounded-full flex items-center justify-center mx-auto mb-[21px]">
                <Search className="w-[21px] h-[21px] text-zinc-600" />
              </div>
              <h3 className="text-[16px] font-medium text-zinc-300 mb-[8px]">
                結果が見つかりませんでした
              </h3>
              <p className="text-zinc-600 text-[13px] max-w-[377px] mx-auto leading-relaxed">
                「{searchQuery}」に一致するゲームが見つかりませんでした。
                別のキーワードやタグで試してみてください。
              </p>
            </div>
          ) : (
            // 初期状態（検索前）
            <div className="text-center py-[89px]">
              <div className="w-[55px] h-[55px] bg-zinc-900/50 backdrop-blur-sm border border-white/[0.06] rounded-full flex items-center justify-center mx-auto mb-[21px]">
                <Search className="w-[21px] h-[21px] text-zinc-600" />
              </div>
              <h3 className="text-[16px] font-medium text-zinc-300 mb-[8px]">
                ゲームを検索
              </h3>
              <p className="text-zinc-600 text-[13px] max-w-[377px] mx-auto leading-relaxed">
                ゲーム名、タグ、説明文を入力して、
                新しいお気に入りゲームを見つけましょう。
              </p>

              {/* 人気タグ例 */}
              <div className="mt-[34px]">
                <p className="text-zinc-600 text-[11px] uppercase tracking-wider mb-[13px]">人気の検索</p>
                <div className="flex flex-wrap justify-center gap-[8px]">
                  {genres.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setInputValue(tag);
                        setSearchQuery(tag);
                        searchPosts(tag);
                        const url = new URL(window.location.href);
                        url.searchParams.set("q", tag);
                        window.history.pushState({}, "", url);
                      }}
                      className="px-[13px] py-[8px] bg-white/[0.04] hover:bg-white/[0.08]
                               border border-white/[0.06] hover:border-white/[0.1]
                               text-zinc-400 hover:text-zinc-200 text-[13px] rounded-[8px]
                               backdrop-blur-sm transition-all"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
