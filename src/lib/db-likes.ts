import { supabase } from "./supabase";
import type { Post } from "./db-posts";

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

// Subscribe to all likes (for realtime like count updates)
export function subscribeToAllLikes(callback: (payload: any) => void) {
  return supabase
    .channel("likes:all")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "likes",
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

// Get total likes received on all posts by a user
export async function getTotalLikesReceivedByUserId(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("posts")
    .select("id")
    .eq("author_id", userId);

  if (error || !data || data.length === 0) return 0;

  const postIds = data.map((p) => p.id);
  const { count, error: countError } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .in("post_id", postIds);

  if (countError) {
    console.error("Error counting received likes:", countError);
    return 0;
  }

  return count || 0;
}

// Get posts liked by a user (TikTok-style grid), sorted by most recently liked
export async function getLikedPostsByUserId(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<Post[] | null> {
  // Step 1: Get liked post IDs in newest-liked-first order
  const { data: likes, error: likesError } = await supabase
    .from("likes")
    .select("post_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (likesError) {
    console.error("Error fetching liked post IDs:", likesError);
    return null;
  }

  if (!likes || likes.length === 0) return [];

  const postIds = likes.map((l) => l.post_id);

  // Step 2: Fetch posts by IDs
  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select("*")
    .in("id", postIds);

  if (postsError) {
    console.error("Error fetching liked posts:", postsError);
    return null;
  }

  // Step 3: Maintain the liked order (newest liked first)
  const postMap = new Map((posts || []).map((p) => [p.id, p]));
  const ordered = postIds
    .map((id) => postMap.get(id))
    .filter(Boolean) as Post[];

  return ordered;
}
