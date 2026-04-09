"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";

interface CopyLinkButtonProps {
  postId: string;
  gameUrl: string;
}

export default function CopyLinkButton({ postId, gameUrl }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      // ゲームURLをコピー
      await navigator.clipboard.writeText(gameUrl);
      setCopied(true);
      
      // 2秒後に元のアイコンに戻す
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center justify-center gap-1.5 text-xs transition-colors min-w-[50px] ${
        copied 
          ? "text-emerald-400" 
          : "text-zinc-400 hover:text-zinc-200"
      }`}
      title={copied ? "コピーしました！" : "ゲームURLをコピー"}
    >
      {copied ? (
        <Check size={16} />
      ) : (
        <Link2 size={16} />
      )}
      <span className="w-5 text-center">
        {copied ? "済" : ""}
      </span>
    </button>
  );
}
