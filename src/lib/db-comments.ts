import { supabase } from "./supabase";
import { getCommentLikeCounts, getUserCommentLikes } from "./db-comment-likes";

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  body: string;
  parent_id: string | null;
  created_at: string;
  comment_likes_count: number;
  user_has_liked: boolean;
}

// Get comments for a post
export async function getCommentsByPostId(postId: string, userId?: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching comments:", error);
    return [];
  }

  const rows = (data as Omit<Comment, "comment_likes_count" | "user_has_liked">[]) || [];
  if (rows.length === 0) return [];

  const ids = rows.map((c) => c.id);
  const [counts, likedSet] = await Promise.all([
    getCommentLikeCounts(ids),
    userId ? getUserCommentLikes(ids, userId) : Promise.resolve(new Set<string>()),
  ]);

  return rows.map((c) => ({
    ...c,
    comment_likes_count: counts.get(c.id) || 0,
    user_has_liked: likedSet.has(c.id),
  }));
}

// Create a comment
export async function createComment(
  postId: string,
  body: string,
  userId: string,
  userName: string,
  parentId?: string
): Promise<Comment | null> {
  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      author_id: userId,
      author_name: userName,
      body,
      parent_id: parentId || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating comment:", error);
    return null;
  }

  return { ...(data as Omit<Comment, "comment_likes_count" | "user_has_liked">), comment_likes_count: 0, user_has_liked: false };
}

// Update a comment (author only)
export async function updateComment(
  id: string,
  body: string,
  userId: string
): Promise<Comment | null> {
  // Verify ownership
  const { data: existing } = await supabase
    .from("comments")
    .select("author_id")
    .eq("id", id)
    .single();

  if (!existing || existing.author_id !== userId) {
    console.error("Unauthorized: not the comment author");
    return null;
  }

  const { data, error } = await supabase
    .from("comments")
    .update({ body })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating comment:", error);
    return null;
  }

  const base = data as Omit<Comment, "comment_likes_count" | "user_has_liked">;
  const [counts, likedSet] = await Promise.all([
    getCommentLikeCounts([base.id]),
    Promise.resolve(new Set<string>()),
  ]);
  return { ...base, comment_likes_count: counts.get(base.id) || 0, user_has_liked: false };
}

// Delete a comment (author only)
export async function deleteComment(id: string, userId: string): Promise<boolean> {
  // Verify ownership
  const { data: existing } = await supabase
    .from("comments")
    .select("author_id")
    .eq("id", id)
    .single();

  if (!existing || existing.author_id !== userId) {
    console.error("Unauthorized: not the comment author");
    return false;
  }

  const { error } = await supabase.from("comments").delete().eq("id", id);

  if (error) {
    console.error("Error deleting comment:", error);
    return false;
  }

  return true;
}

// Subscribe to comments for a post
export function subscribeToComments(postId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`comments:${postId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "comments",
        filter: `post_id=eq.${postId}`,
      },
      callback
    )
    .subscribe();
}

// Get comment count for a post
export async function getCommentCount(postId: string): Promise<number> {
  const { count, error } = await supabase
    .from("comments")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);

  if (error) {
    console.error("Error counting comments:", error);
    return 0;
  }

  return count || 0;
}
