"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";

export default function AuthCallback() {
  const router = useRouter();
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    // Handle the OAuth callback
    fetchUser().then(() => {
      // Redirect to home after successful auth
      router.push("/");
      router.refresh();
    });
  }, [fetchUser, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
        <p className="text-zinc-400">Completing authentication...</p>
      </div>
    </div>
  );
}
