import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { followUser, getFollowingIds, getFollowStats, unfollowUser } from "./db-follows";
import toast from "react-hot-toast";

export interface User {
  id: string;
  github_id: string | null;
  roblox_id: string | null;
  provider: "github" | "roblox";
  username: string;
  avatarUrl: string | null;
  bio: string;
  createdAt: string | null;
}

interface ProfileRecord {
  id: string;
  github_id: string | null;
  roblox_id: string | null;
  username: string;
  avatar_url: string | null;
  bio?: string | null;
  created_at?: string | null;
}

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthModalOpen: boolean;
  followingIds: string[];
  followersCount: number;
  followingCount: number;

  setUser: (user: User | null) => void;
  signInWithGithub: () => Promise<void>;
  signInWithRoblox: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
  updateProfile: (updates: { bio?: string; username?: string }) => Promise<void>;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  loadFollowingIds: () => Promise<void>;
  loadFollowStats: () => Promise<void>;
  toggleFollow: (targetId: string) => Promise<void>;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function normalizeProvider(robloxId: string | null): "github" | "roblox" {
  return robloxId ? "roblox" : "github";
}

function profileToUser(profile: ProfileRecord): User {
  return {
    id: profile.id,
    github_id: profile.github_id,
    roblox_id: profile.roblox_id,
    provider: normalizeProvider(profile.roblox_id),
    username: profile.username,
    avatarUrl: profile.avatar_url,
    bio: profile.bio || "",
    createdAt: profile.created_at || null,
  };
}

function normalizeProfileRecord(row: Record<string, unknown>): ProfileRecord {
  return {
    id: typeof row.id === "string" ? row.id : "",
    github_id: typeof row.github_id === "string" ? row.github_id : null,
    roblox_id: typeof row.roblox_id === "string" ? row.roblox_id : null,
    username: typeof row.username === "string" ? row.username : "User",
    avatar_url: typeof row.avatar_url === "string" ? row.avatar_url : null,
    bio: typeof row.bio === "string" ? row.bio : null,
    created_at: typeof row.created_at === "string" ? row.created_at : null,
  };
}

function getMetadataValue(metadata: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return null;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get): AuthStore => ({
      user: null,
      isLoading: false,
      error: null,
      isAuthModalOpen: false,
      followingIds: [],
      followersCount: 0,
      followingCount: 0,

      setUser: (user) => set({ user }),

      signInWithGithub: async () => {
        set({ isLoading: true, error: null });
        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: "github",
            options: {
              redirectTo: `${window.location.origin}/auth/callback`,
            },
          });

          if (error) throw error;
          set({ isAuthModalOpen: false });
        } catch (error) {
          const message = getErrorMessage(error, "Login failed");
          set({ error: message, isLoading: false });
          toast.error(`Login failed: ${message}`);
        }
      },

      signInWithRoblox: async () => {
        set({ isLoading: true, error: null });
        try {
          const clientId = process.env.NEXT_PUBLIC_ROBLOX_CLIENT_ID;
          if (!clientId) {
            throw new Error("Roblox OAuth client ID is not configured");
          }

          const stateBytes = new Uint8Array(16);
          crypto.getRandomValues(stateBytes);
          const state = Array.from(stateBytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
          sessionStorage.setItem("roblox_oauth_state", state);

          const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: `${window.location.origin}/auth/callback/roblox`,
            response_type: "code",
            scope: "openid profile",
            state,
          });

          set({ isAuthModalOpen: false });
          window.location.assign(`https://apis.roblox.com/oauth/v1/authorize?${params.toString()}`);
        } catch (error) {
          const message = getErrorMessage(error, "Login failed");
          set({ error: message, isLoading: false });
          toast.error(`Login failed: ${message}`);
        }
      },

      signOut: async () => {
        set({ isLoading: true });
        try {
          await supabase.auth.signOut();
          localStorage.removeItem("roblox_session_token");
          localStorage.removeItem("roblox_access_token");
          localStorage.removeItem("roblox_user");
          set({ user: null, isLoading: false, followingIds: [], followersCount: 0, followingCount: 0 });
        } catch (error) {
          const message = getErrorMessage(error, "Sign out failed");
          set({ error: message, isLoading: false });
        }
      },

      openAuthModal: () => set({ isAuthModalOpen: true }),
      closeAuthModal: () => set({ isAuthModalOpen: false }),

      loadFollowingIds: async () => {
        const user = get().user;
        if (!user) return;
        const ids = await getFollowingIds(user.id);
        set({ followingIds: ids });
      },

      loadFollowStats: async () => {
        const user = get().user;
        if (!user) return;
        const stats = await getFollowStats(user.id);
        set({ followersCount: stats.followers, followingCount: stats.following });
      },

      toggleFollow: async (targetId: string) => {
        const user = get().user;
        if (!user) {
          get().openAuthModal();
          return;
        }

        const isFollowing = get().followingIds.includes(targetId);
        set((state) => ({
          followingIds: isFollowing
            ? state.followingIds.filter((id) => id !== targetId)
            : [...state.followingIds, targetId],
          followingCount: isFollowing ? state.followingCount - 1 : state.followingCount + 1,
        }));

        const ok = isFollowing ? await unfollowUser(user.id, targetId) : await followUser(user.id, targetId);
        if (!ok) {
          set((state) => ({
            followingIds: isFollowing
              ? [...state.followingIds, targetId]
              : state.followingIds.filter((id) => id !== targetId),
            followingCount: isFollowing ? state.followingCount + 1 : state.followingCount - 1,
          }));
          toast.error("Failed to update follow");
        }
      },

      fetchUser: async () => {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (!session) {
            set({ user: null, isLoading: false });
            return;
          }

          const { data: profile, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single<Record<string, unknown>>();

          if (error && error.code === "PGRST116") {
            const metadata = session.user.user_metadata as Record<string, unknown>;
            const provider = String(session.user.app_metadata.provider || "github") === "roblox" ? "roblox" : "github";
            const providerId = getMetadataValue(metadata, ["provider_id", "sub"]);
            const username =
              getMetadataValue(metadata, ["full_name", "name", "user_name", "preferred_username"]) ||
              session.user.email?.split("@")[0] ||
              "User";

            const { data: newProfile, error: createError } = await supabase
              .from("profiles")
              .upsert({
                id: session.user.id,
                github_id: provider === "roblox" ? null : providerId,
                roblox_id: provider === "roblox" ? providerId : null,
                username,
                avatar_url: getMetadataValue(metadata, ["avatar_url", "picture"]),
              }, { onConflict: "id" })
              .select("*")
              .single<Record<string, unknown>>();

            if (createError) {
              const { data: retryProfile, error: retryError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", session.user.id)
                .single<Record<string, unknown>>();
              if (retryError) throw createError;
              set({ user: profileToUser(normalizeProfileRecord(retryProfile)), isLoading: false });
              get().loadFollowingIds();
              get().loadFollowStats();
              return;
            }

            set({ user: profileToUser(normalizeProfileRecord(newProfile)), isLoading: false });
            get().loadFollowingIds();
            get().loadFollowStats();
          } else if (error) {
            throw error;
          } else {
            set({ user: profileToUser(normalizeProfileRecord(profile)), isLoading: false });
            get().loadFollowingIds();
            get().loadFollowStats();
          }
        } catch (error) {
          const message = getErrorMessage(error, "Failed to load user");
          set({ error: message, isLoading: false });
        }
      },

      updateProfile: async (updates) => {
        const user = get().user;
        if (!user) return;

        try {
          const updateData: Record<string, string> = {};
          if (updates.bio !== undefined) updateData.bio = updates.bio;
          if (updates.username !== undefined) updateData.username = updates.username;

          const { error } = await supabase.from("profiles").update(updateData).eq("id", user.id);
          if (error) throw error;

          set({
            user: {
              ...user,
              ...(updates.bio !== undefined && { bio: updates.bio }),
              ...(updates.username !== undefined && { username: updates.username }),
            },
          });
        } catch (error) {
          const message = getErrorMessage(error, "Failed to update profile");
          set({ error: message });
          toast.error(`Failed to update profile: ${message}`);
          throw error;
        }
      },
    }),
    {
      name: "auth-storage",
    },
  ),
);

supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
  if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session) {
    useAuthStore.getState().fetchUser();
  } else if (event === "SIGNED_OUT") {
    useAuthStore.getState().setUser(null);
  }
});
