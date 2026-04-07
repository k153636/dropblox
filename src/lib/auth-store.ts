import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "./supabase";

export interface User {
  id: string;
  github_id: string;
  username: string;
  avatarUrl: string | null;
}

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  signInWithGithub: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
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
            const { data: newProfile, error: createError } = await supabase
              .from("profiles")
              .insert({
                id: session.user.id,
                github_id: session.user.user_metadata.provider_id || session.user.user_metadata.sub,
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
                username: newProfile.username,
                avatarUrl: newProfile.avatar_url,
              },
            });
          } else if (error) {
            throw error;
          } else {
            set({
              user: {
                id: profile.id,
                github_id: profile.github_id,
                username: profile.username,
                avatarUrl: profile.avatar_url,
              },
            });
          }
        } catch (error: any) {
          set({ error: error.message });
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
