import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-800 py-6 mt-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-zinc-400 text-sm">
            © 2026 Dropblox. All Rights Reserved.
          </div>
          <div className="flex gap-6 text-sm">
            <Link 
              href="/privacy" 
              className="text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              プライバシーポリシー
            </Link>
            <Link 
              href="/terms" 
              className="text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              利用規約
            </Link>
          </div>
        </div>
        <div className="mt-4 text-center text-zinc-500 text-xs">
          Dropblox is not affiliated with, endorsed by, or sponsored by Roblox Corporation.
        </div>
      </div>
    </footer>
  );
}
