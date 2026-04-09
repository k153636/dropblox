"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePostStore } from "@/lib/store";
import PostCard from "@/components/PostCard";
import { Search, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SearchPage() {
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

  // 初期検索（URLパラメータから）
  useEffect(() => {
    if (query && query !== searchQuery) {
      setSearchQuery(query);
      searchPosts(query);
    }
  }, [query]);

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
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 戻るリンク */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Feedに戻る</span>
        </Link>

        {/* 検索バー */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-100 mb-4">
            ゲームを検索
          </h1>
          <form onSubmit={handleSearch} className="relative max-w-xl">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="ゲーム名、タグ、説明文..."
                className="w-full pl-12 pr-4 py-3 bg-zinc-900/80 border border-zinc-800 rounded-xl 
                         text-base text-zinc-200 placeholder-zinc-500
                         focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20
                         transition-all"
              />
              <button
                type="submit"
                disabled={isSearching || !inputValue.trim()}
                className="absolute right-2 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 
                         disabled:bg-zinc-700 disabled:cursor-not-allowed
                         text-white text-sm font-medium rounded-lg transition-colors"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "検索"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 検索結果 */}
        <div>
          {/* 結果サマリー */}
          {hasSearched && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-zinc-400 text-sm">
                {isSearching ? (
                  "検索中..."
                ) : (
                  <>
                    <span className="text-zinc-200 font-medium">"{searchQuery}"</span>
                    {" の検索結果 "}
                    <span className="text-emerald-400 font-medium">{searchResults.length}件</span>
                  </>
                )}
              </p>
            </div>
          )}

          {/* 結果グリッド */}
          {isSearching ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              <span className="ml-3 text-zinc-400">検索中...</span>
            </div>
          ) : hasSearched && searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-zinc-600" />
              </div>
              <h3 className="text-lg font-medium text-zinc-300 mb-2">
                結果が見つかりませんでした
              </h3>
              <p className="text-zinc-500 text-sm max-w-md mx-auto">
                「{searchQuery}」に一致するゲームが見つかりませんでした。
                別のキーワードやタグで試してみてください。
              </p>
            </div>
          ) : (
            // 初期状態（検索前）
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-zinc-600" />
              </div>
              <h3 className="text-lg font-medium text-zinc-300 mb-2">
                ゲームを検索
              </h3>
              <p className="text-zinc-500 text-sm max-w-md mx-auto">
                ゲーム名、タグ、説明文を入力して、
                新しいお気に入りゲームを見つけましょう。
              </p>
              
              {/* 人気タグ例 */}
              <div className="mt-6">
                <p className="text-zinc-600 text-xs mb-3">人気の検索</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {["アドベンチャー", "ホラー", "RPG", "シミュレーション", "アクション"].map((tag) => (
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
                      className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 
                               text-zinc-400 hover:text-zinc-200 text-sm rounded-full
                               transition-colors"
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
