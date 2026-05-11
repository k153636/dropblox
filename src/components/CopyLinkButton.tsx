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
      await navigator.clipboard.writeText(gameUrl);
      setCopied(true);
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
      className={`flex items-center gap-1.5 text-xs px-[10px] py-[6px] rounded-[6px] transition-all ${
        copied
          ? "text-emerald-400 bg-emerald-500/10"
          : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]"
      }`}
      title={copied ? "Copied!" : "Copy game URL"}
    >
      {copied ? <Check size={14} /> : <Link2 size={14} />}
    </button>
  );
}
