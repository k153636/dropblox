"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  sidebarOpen?: boolean;
}

export default function SearchBar({ sidebarOpen = true }: SearchBarProps) {
  const [inputValue, setInputValue] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    // 検索結果ページに遷移
    router.push(`/search?q=${encodeURIComponent(inputValue)}`);
  };

  const handleClear = () => {
    setInputValue("");
  };

  // Sidebarが閉じている時はアイコンのみ表示
  if (!sidebarOpen) {
    return (
      <div className="flex justify-center py-2">
        <button
          onClick={() => router.push('/search')}
          className="p-2 text-zinc-400 hover:text-emerald-400 transition-colors"
          title="検索"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="px-3 py-2">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="ゲームを検索..."
            className="w-full pl-9 pr-8 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg 
                       text-sm text-zinc-200 placeholder-zinc-500
                       focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20
                       backdrop-blur-sm transition-all"
          />
          {inputValue ? (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2.5 p-0.5 text-zinc-500 hover:text-zinc-300 
                         hover:bg-zinc-800 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
