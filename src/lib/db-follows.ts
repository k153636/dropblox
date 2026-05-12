import { supabase } from "./supabase";
import type { Post } from "./db-posts";

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface FollowStats {
  followers: number;
  following: number;
}

function isBenignFollowsError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "PGRST116") return true;
  const msg = (error.message || "").toLowerCase();
  return msg.includes("relation") || msg.includes("follows") || msg.includes("does not exist");
}

export async function followUser(followerId: string, followingId: string): Promise<boolean> {
  const { error } = await supabase.from("follows").insert({
    follower_id: followerId,
    following_id: followingId,
  });
  if (error) {
    console.error("Error following user:", error);
    return false;
  }
  return true;
}

export async function unfollowUser(followerId: string, followingId: string): Promise<boolean> {
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);
  if (error) {
    console.error("Error unfollowing user:", error);
    return false;
  }
  return true;
}

export async function getFollowStats(userId: string): Promise<FollowStats> {
  const [followersResult, followingResult] = await Promise.all([
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId),
  ]);
  if (followersResult.error || followingResult.error) {
    const err = followersResult.error || followingResult.error;
    if (!isBenignFollowsError(err)) {
      console.error("Error fetching follow stats:", err);
    }
    return { followers: 0, following: 0 };
  }
  return { followers: followersResult.count || 0, following: followingResult.count || 0 };
}

export async function checkIsFollowing(followerId: string, followingId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .single();
  if (error && error.code !== "PGRST116") {
    console.error("Error checking follow:", error);
    return false;
  }
  return !!data;
}

export async function getFollowingIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);
  if (error) {
    if (!isBenignFollowsError(error)) {
      console.error("Error fetching following ids:", error);
    }
    return [];
  }
  return (data || []).map((r) => r.following_id);
}

export async function getPostsByFollowing(
  followingIds: string[],
  limit: number = 20,
  offset: number = 0
): Promise<Post[]> {
  if (followingIds.length === 0) return [];
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .in("author_id", followingIds)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) {
    console.error("Error fetching following posts:", error);
    return [];
  }
  return (data as Post[]) || [];
}
