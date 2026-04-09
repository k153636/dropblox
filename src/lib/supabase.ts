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
    preview_name: string | null;
    preview_description: string | null;
    preview_thumbnail: string | null;
    preview_playing: number | string | null;
    preview_visits: number | string | null;
    preview_genre: string | null;
    last_fetched_at: string | null;
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
    github_id: string | null;
    roblox_id: string | null;
    provider: string;
    username: string;
    avatar_url: string | null;
    created_at: string;
  };
};

