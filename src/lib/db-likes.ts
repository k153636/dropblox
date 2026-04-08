import { supabase } from "./supabase";

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

// Toggle like on a post
export async function toggleLike(
  postId: string,
  userId: string
): Promise<{ liked: boolean; error: Error | null }> {
  // Check if already liked
  const { data: existing, error: checkError } = await supabase
    .from("likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .single();

  if (checkError && checkError.code !== "PGRST116") {
    // PGRST116 = not found, which is expected if not liked
    console.error("Error checking like:", checkError);
    return { liked: false, error: checkError };
  }

  if (existing) {
    // Unlike
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("id", existing.id);

    if (error) {
      console.error("Error removing like:", error);
      return { liked: true, error };
    }

    return { liked: false, error: null };
  } else {
    // Like
    const { error } = await supabase.from("likes").insert({
      post_id: postId,
      user_id: userId,
    });

    if (error) {
      console.error("Error adding like:", error);
      return { liked: false, error };
    }

    return { liked: true, error: null };
  }
}

// Check if user has liked a post
export async function hasLiked(postId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error checking like:", error);
    return false;
  }

  return !!data;
}

// Get like count for a post
export async function getLikeCount(postId: string): Promise<number> {
  const { count, error } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);

  if (error) {
    console.error("Error counting likes:", error);
    return 0;
  }

  return count || 0;
}

// Subscribe to likes for a post
export function subscribeToLikes(postId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`likes:${postId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "likes",
        filter: `post_id=eq.${postId}`,
      },
      callback
    )
    .subscribe();
}

// Get all likes for a post (with user info)
export async function getLikesByPostId(postId: string): Promise<Like[]> {
  const { data, error } = await supabase
    .from("likes")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching likes:", error);
    return [];
  }

  return (data as Like[]) || [];
}

// Import Post type
import type { Post } from "./db-posts";

// Get posts liked by a user (TikTok-style grid)
export async function getLikedPostsByUserId(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<Post[] | null> {
  const { data, error } = await supabase
    .from("likes")
    .select(`
      post_id,
      posts:post_id (*)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching liked posts:", error);
    return null;
  }

  // Extract posts from the nested structure
  const posts = data?.map((item: any) => item.posts as Post) || [];
  return posts;
}
