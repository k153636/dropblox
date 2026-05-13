import { supabase } from "./supabase";

export async function toggleCommentLike(
  commentId: string,
  userId: string
): Promise<{ liked: boolean; error: Error | null }> {
  const { data: existing, error: checkError } = await supabase
    .from("comment_likes")
    .select("id")
    .eq("comment_id", commentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (checkError && checkError.code !== "PGRST116") {
    return { liked: false, error: checkError };
  }

  if (existing) {
    const { error } = await supabase
      .from("comment_likes")
      .delete()
      .eq("id", existing.id);
    if (error) return { liked: true, error };
    return { liked: false, error: null };
  } else {
    const { error } = await supabase.from("comment_likes").insert({
      comment_id: commentId,
      user_id: userId,
    });
    if (error) return { liked: false, error };
    return { liked: true, error: null };
  }
}

export async function getCommentLikeCounts(
  commentIds: string[]
): Promise<Map<string, number>> {
  if (commentIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from("comment_likes")
    .select("comment_id")
    .in("comment_id", commentIds);

  if (error) return new Map();

  const counts = new Map<string, number>();
  for (const row of data || []) {
    const cid = row.comment_id as string;
    counts.set(cid, (counts.get(cid) || 0) + 1);
  }
  return counts;
}

export async function getUserCommentLikes(
  commentIds: string[],
  userId: string
): Promise<Set<string>> {
  if (commentIds.length === 0) return new Set();
  const { data, error } = await supabase
    .from("comment_likes")
    .select("comment_id")
    .in("comment_id", commentIds)
    .eq("user_id", userId);

  if (error) return new Set();
  return new Set((data || []).map((r) => r.comment_id as string));
}
