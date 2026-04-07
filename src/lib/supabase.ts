import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Database types
export type Tables = {
  posts: {
    id: string;
    url: string;
    body: string;
    preview_name: string;
    preview_description: string;
    preview_thumbnail: string;
    preview_playing: number;
    preview_visits: number;
    author_id: string;
    author_name: string;
    likes: number;
    created_at: string;
  };
  comments: {
    id: string;
    post_id: string;
    author_id: string;
    author_name: string;
    body: string;
    parent_id: string | null;
    created_at: string;
  };
  likes: {
    id: string;
    post_id: string;
    user_id: string;
    created_at: string;
  };
  profiles: {
    id: string;
    discord_id: string;
    username: string;
    avatar_url: string | null;
    created_at: string;
  };
};

// Realtime subscriptions helper
export function subscribeToPosts(callback: (payload: any) => void) {
  return supabase
    .channel("posts")
    .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, callback)
    .subscribe();
}

export function subscribeToComments(postId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`comments:${postId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "comments", filter: `post_id=eq.${postId}` },
      callback
    )
    .subscribe();
}
