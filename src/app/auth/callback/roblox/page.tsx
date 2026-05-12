"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/lib/auth-store";

interface RobloxAuthResponse {
  user?: unknown;
  session?: {
    access_token?: string;
    refresh_token?: string;
  };
  session_token?: string;
  tokens?: {
    access_token?: string;
  };
}

function RobloxCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const [error, setError] = useState<string | null>(null);

  const exchangeCodeForToken = useCallback(async (code: string) => {
    try {
      const response = await fetch("/api/auth/roblox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to authenticate");
      }

      const data = (await response.json()) as RobloxAuthResponse;

      if (!data.session?.access_token || !data.session.refresh_token) {
        throw new Error("Authentication response did not include a Supabase session");
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      if (sessionError) {
        throw sessionError;
      }

      if (data.session_token) {
        localStorage.setItem("roblox_session_token", data.session_token);
      }
      if (data.tokens?.access_token) {
        localStorage.setItem("roblox_access_token", data.tokens.access_token);
      }
      if (data.user) {
        localStorage.setItem("roblox_user", JSON.stringify(data.user));
      }

      await fetchUser();
      toast.success("Successfully signed in with Roblox!");
      router.push("/");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed";
      setError(message);
      toast.error(`Authentication failed: ${message}`);
      setTimeout(() => router.push("/"), 3000);
    }
  }, [fetchUser, router]);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      setError(errorDescription || "Authentication failed");
      toast.error(errorDescription || "Authentication failed");
      setTimeout(() => router.push("/"), 3000);
      return;
    }

    const storedState = sessionStorage.getItem("roblox_oauth_state");
    if (!state || state !== storedState) {
      setError("Invalid state parameter");
      toast.error("Invalid state parameter");
      setTimeout(() => router.push("/"), 3000);
      return;
    }

    sessionStorage.removeItem("roblox_oauth_state");

    if (!code) {
      setError("No authorization code received");
      toast.error("No authorization code received");
      setTimeout(() => router.push("/"), 3000);
      return;
    }

    exchangeCodeForToken(code);
  }, [searchParams, router, exchangeCodeForToken]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-center p-8 bg-zinc-900 rounded-2xl border border-zinc-800 max-w-md">
          <div className="text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Authentication Failed</h1>
          <p className="text-zinc-400">{error}</p>
          <p className="text-zinc-500 text-sm mt-4">Redirecting to home...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
        <p className="text-zinc-400">Completing Roblox authentication...</p>
      </div>
    </div>
  );
}

export default function RobloxCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
          <p className="text-zinc-400">Completing Roblox authentication...</p>
        </div>
      </div>
    }>
      <RobloxCallbackInner />
    </Suspense>
  );
}
