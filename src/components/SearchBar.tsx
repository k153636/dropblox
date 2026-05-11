"use client";

import { useState, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  sidebarOpen?: boolean;
}

export default function SearchBar({ sidebarOpen = true }: SearchBarProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    router.push(`/search?q=${encodeURIComponent(inputValue.trim())}`);
  };

  return (
    <div className="px-[13px] py-[8px]">
      <form onSubmit={handleSubmit}>
        <div
          className={`flex items-center w-full rounded-[8px] transition-all duration-300 ${
            sidebarOpen
              ? "bg-white/[0.04] border border-white/[0.08] px-[10px] py-[7px] gap-[6px] focus-within:border-emerald-500/40 focus-within:bg-white/[0.06]"
              : "justify-center min-h-[47px] hover:bg-white/[0.06] cursor-pointer"
          }`}
          onClick={() => {
            if (!sidebarOpen) router.push("/search");
            else inputRef.current?.focus();
          }}
        >
          {/* アイコン: 開閉に合わせてサイズ変化 */}
          <Search
            className="flex-shrink-0 transition-all duration-300"
            style={{
              width: sidebarOpen ? "13px" : "21px",
              height: sidebarOpen ? "13px" : "21px",
              color: sidebarOpen ? "rgb(113 113 122)" : "rgb(161 161 170)",
            }}
          />

          {/* 入力エリア: 幅・透明度をサイドバーと同期してアニメーション */}
          <div
            style={{
              maxWidth: sidebarOpen ? "200px" : "0px",
              opacity: sidebarOpen ? 1 : 0,
              overflow: "hidden",
              transition: "max-width 300ms ease-out, opacity 300ms ease-out",
              flex: 1,
              minWidth: 0,
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="検索..."
              tabIndex={sidebarOpen ? 0 : -1}
              className="w-full bg-transparent text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none"
            />
          </div>

          {/* クリアボタン */}
          <div
            style={{
              maxWidth: sidebarOpen && inputValue ? "20px" : "0px",
              opacity: sidebarOpen && inputValue ? 1 : 0,
              overflow: "hidden",
              transition: "max-width 200ms ease-out, opacity 200ms ease-out",
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              tabIndex={sidebarOpen ? 0 : -1}
              onClick={(e) => {
                e.stopPropagation();
                setInputValue("");
                inputRef.current?.focus();
              }}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="w-[11px] h-[11px]" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
