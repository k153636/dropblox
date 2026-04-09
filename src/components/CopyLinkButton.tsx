"use client";

import { useState, useRef, useEffect } from "react";
import { Link2, Check, ExternalLink, Gamepad2, X } from "lucide-react";

interface CopyLinkButtonProps {
  postId: string;
  gameUrl: string;
}

export default function CopyLinkButton({ postId, gameUrl }: CopyLinkButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copiedType, setCopiedType] = useState<"game" | "post" | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // メニュー外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopy = async (type: "game" | "post") => {
    try {
      let url = "";
      if (type === "game") {
        url = gameUrl;
      } else {
        url = `${window.location.origin}/post/${postId}`;
      }
      
      await navigator.clipboard.writeText(url);
      setCopiedType(type);
      setShowMenu(false);
      
      // 2秒後にリセット
      setTimeout(() => {
        setCopiedType(null);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const isCopied = copiedType !== null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`flex items-center justify-center gap-1.5 text-xs transition-colors min-w-[50px] ${
          isCopied 
            ? "text-emerald-400" 
            : "text-zinc-400 hover:text-zinc-200"
        }`}
        title="リンクをコピー"
      >
        {isCopied ? (
          <Check size={16} />
        ) : (
          <Link2 size={16} />
        )}
        <span className="w-5 text-center">
          {isCopied ? "済" : ""}
        </span>
      </button>

      {/* ドロップダウンメニュー */}
      {showMenu && (
        <div className="absolute bottom-full right-0 mb-2 w-56 bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg overflow-hidden z-50">
          {/* ヘッダー */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
            <span className="text-xs text-zinc-400">リンクをコピー</span>
            <button 
              onClick={() => setShowMenu(false)}
              className="text-zinc-500 hover:text-zinc-300"
            >
              <X size={14} />
            </button>
          </div>

          {/* メニュー項目 */}
          <div className="p-1">
            {/* RobloxゲームURL */}
            <button
              onClick={() => handleCopy("game")}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-zinc-300 hover:bg-zinc-800 hover:text-emerald-400 rounded-md transition-colors"
            >
              <Gamepad2 size={16} className="text-emerald-400" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">RobloxゲームURL</p>
                <p className="text-xs text-zinc-500 truncate">{gameUrl}</p>
              </div>
              {copiedType === "game" && <Check size={14} className="text-emerald-400" />}
            </button>

            {/* 区切り線 */}
            <div className="my-1 border-t border-zinc-800" />

            {/* Dropblox投稿URL */}
            <button
              onClick={() => handleCopy("post")}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-zinc-300 hover:bg-zinc-800 hover:text-emerald-400 rounded-md transition-colors"
            >
              <ExternalLink size={16} className="text-blue-400" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">Dropblox投稿URL</p>
                <p className="text-xs text-zinc-500 truncate">/post/{postId}</p>
              </div>
              {copiedType === "post" && <Check size={14} className="text-emerald-400" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
