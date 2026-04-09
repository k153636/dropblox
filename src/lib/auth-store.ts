import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "./supabase";

export interface User {
  id: string;
  github_id: string | null;
  roblox_id: string | null;
  provider: "github" | "roblox";
  username: string;
  avatarUrl: string | null;
  bio: string;
}

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  signInWithGithub: () => Promise<void>;
  signInWithRoblox: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
  updateProfile: (updates: { bio?: string; username?: string }) => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get): AuthStore => ({
      user: null,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user }),

      signInWithGithub: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "github",
            options: {
              redirectTo: `${window.location.origin}/auth/callback`,
            },
          });

          if (error) throw error;
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },

      signInWithRoblox: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "roblox" as any, // Supabase Dashboardでカスタムプロバイダーとして設定
            options: {
              redirectTo: `${window.location.origin}/auth/callback`,
              scopes: "openid profile",
            },
          });

          if (error) throw error;
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },

      signOut: async () => {
        set({ isLoading: true });
        try {
          await supabase.auth.signOut();
          set({ user: null, isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },

      fetchUser: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session) {
            set({ user: null });
            return;
          }

          // Fetch or create user profile
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (error && error.code === "PGRST116") {
            // Profile doesn't exist, create it
            const provider = session.user.app_metadata.provider || "github";
            const isRoblox = provider === "roblox";
            
            const { data: newProfile, error: createError } = await supabase
              .from("profiles")
              .insert({
                id: session.user.id,
                github_id: isRoblox ? null : (session.user.user_metadata.provider_id || session.user.user_metadata.sub),
                roblox_id: isRoblox ? (session.user.user_metadata.provider_id || session.user.user_metadata.sub) : null,
                provider: provider,
                username: session.user.user_metadata.full_name || session.user.user_metadata.name || session.user.user_metadata.user_name || session.user.email?.split('@')[0] || 'User',
                avatar_url: session.user.user_metadata.avatar_url,
              })
              .select()
              .single();

            if (createError) throw createError;
            
            set({
              user: {
                id: newProfile.id,
                github_id: newProfile.github_id,
                roblox_id: newProfile.roblox_id,
                provider: newProfile.provider,
                username: newProfile.username,
                avatarUrl: newProfile.avatar_url,
                bio: newProfile.bio || "",
              },
            });
          } else if (error) {
            throw error;
          } else {
            set({
              user: {
                id: profile.id,
                github_id: profile.github_id,
                roblox_id: profile.roblox_id,
                provider: profile.provider,
                username: profile.username,
                avatarUrl: profile.avatar_url,
                bio: profile.bio || "",
              },
            });
          }
        } catch (error: any) {
          set({ error: error.message });
        }
      },

      updateProfile: async (updates) => {
        const user = get().user;
        if (!user) return;

        try {
          const updateData: Record<string, string> = {};
          if (updates.bio !== undefined) updateData.bio = updates.bio;
          if (updates.username !== undefined) updateData.username = updates.username;

          const { error } = await supabase
            .from("profiles")
            .update(updateData)
            .eq("id", user.id);

          if (error) throw error;

          set({
            user: {
              ...user,
              ...(updates.bio !== undefined && { bio: updates.bio }),
              ...(updates.username !== undefined && { username: updates.username }),
            },
          });
        } catch (error: any) {
          set({ error: error.message });
          throw error;
        }
      },
    }),
    {
      name: "auth-storage",
    }
  )
);

// Auth state change listener
supabase.auth.onAuthStateChange((event: string, session: any) => {
  if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
    useAuthStore.getState().fetchUser();
  } else if (event === "SIGNED_OUT") {
    useAuthStore.getState().setUser(null);
  }
});
