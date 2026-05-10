"use client";

import { useAuthStore } from "@/lib/auth-store";
import { X, Lock } from "lucide-react";

const GitHubIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

function RobloxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
      <title>Roblox</title>
      <path d="M18.926 23.998 0 18.892 5.075.002 24 5.108ZM15.348 10.09l-5.282-1.453-1.414 5.273 5.282 1.453z"/>
    </svg>
  );
}

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, signInWithGithub, signInWithRoblox, isLoading } = useAuthStore();

  if (!isAuthModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
        onClick={closeAuthModal}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-sm overflow-hidden bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Glow effect */}
        <div className="absolute -top-[100px] -left-[100px] w-[200px] h-[200px] bg-emerald-500/10 blur-[80px] pointer-events-none" />
        
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-full transition-all"
        >
          <X size={20} />
        </button>

        <div className="p-8 flex flex-col items-center text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/20">
            <Lock size={32} />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-zinc-400 text-sm mb-8">
            Sign in to like, comment and share your creations with the community.
          </p>

          <div className="w-full space-y-3">
            <button
              onClick={signInWithGithub}
              disabled={isLoading}
              className="w-full h-12 flex items-center justify-center gap-3 bg-white text-zinc-950 font-semibold rounded-xl hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <GitHubIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
              Continue with GitHub
            </button>
            
            <button
              onClick={signInWithRoblox}
              disabled={isLoading}
              className="w-full h-12 flex items-center justify-center gap-3 bg-zinc-800 text-white font-semibold rounded-xl border border-white/5 hover:bg-zinc-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <RobloxIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
              Continue with Roblox
            </button>
          </div>

          <p className="mt-8 text-[11px] text-zinc-500 max-w-[200px]">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
