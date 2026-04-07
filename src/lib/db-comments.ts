import { supabase } from "./supabase";

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  body: string;
  parent_id: string | null;
  created_at: string;
}

// Get comments for a post
export async function getCommentsByPostId(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching comments:", error);
    return [];
  }

  return (data as Comment[]) || [];
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

  return data as Comment;
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

  return data as Comment;
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
