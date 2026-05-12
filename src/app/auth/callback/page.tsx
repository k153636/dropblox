"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

const oauthExchangeInFlight = new Map<string, Promise<Error | null>>();

async function hasSession(): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return Boolean(session);
}

function exchangeCodeOnce(code: string): Promise<Error | null> {
  const existing = oauthExchangeInFlight.get(code);
  if (existing) {
    return existing;
  }
  const task = hasSession()
    .then(async (sessionExists) => {
      if (sessionExists) {
        return null;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return null;
      }

      const recovered = await hasSession();
      if (recovered) {
        return null;
      }
      return error;
    })
    .finally(() => {
      oauthExchangeInFlight.delete(code);
    });
  oauthExchangeInFlight.set(code, task);
  return task;
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    async function completeAuth() {
      const oauthError = searchParams.get("error_description") || searchParams.get("error");
      if (oauthError) {
        toast.error(`GitHub sign-in failed: ${oauthError}`);
        router.replace("/");
        return;
      }

      const code = searchParams.get("code");
      if (code) {
        const error = await exchangeCodeOnce(code);
        if (error) {
          toast.error(`GitHub sign-in failed: ${error.message}`);
          router.replace("/");
          return;
        }
      }

      await fetchUser();
      if (!useAuthStore.getState().user) {
        await fetchUser();
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session || !useAuthStore.getState().user) {
        toast.error("GitHub sign-in failed: session not established");
        router.replace("/");
        return;
      }

      router.replace("/");
      router.refresh();
    }

    completeAuth();
  }, [fetchUser, router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
        <p className="text-zinc-400">Completing authentication...</p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
