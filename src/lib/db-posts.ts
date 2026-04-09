import { supabase } from "./supabase";

export interface Post {
  id: string;
  url: string;
  body: string;
  preview_name?: string;
  preview_description?: string;
  preview_thumbnail?: string;
  preview_playing?: number | string; // BIGINT can be returned as string
  preview_visits?: number | string; // BIGINT can be returned as string
  author_id: string;
  author_name: string;
  likes: number;
  created_at: string;
}

export interface CreatePostInput {
  url: string;
  body: string;
  preview?: {
    name: string;
    description: string;
    thumbnail: string;
    playing: number;
    visits: number;
  };
}

// Create a new post
export async function createPost(
  input: CreatePostInput,
  userId: string,
  userName: string
): Promise<Post | null> {
  const { data, error } = await supabase
    .from("posts")
    .insert({
      url: input.url,
      body: input.body,
      preview_name: input.preview?.name,
      preview_description: input.preview?.description,
      preview_thumbnail: input.preview?.thumbnail,
      preview_playing: input.preview?.playing,
      preview_visits: input.preview?.visits,
      author_id: userId,
      author_name: userName,
      likes: 0,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating post:", error);
    return null;
  }

  return data as Post;
}

// Get all posts (with pagination)
export async function getPosts(limit = 20, offset = 0): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching posts:", error);
    return [];
  }

  return (data as Post[]) || [];
}

// Get a single post by ID
export async function getPostById(id: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching post:", error);
    return null;
  }

  return data as Post;
}

// Get posts by a specific user (for profile page)
export async function getPostsByUserId(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<Post[] | null> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("author_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching user posts:", error);
    return null;
  }

  return data as Post[];
}

// Update a post (author only)
export async function updatePost(
  id: string,
  updates: Partial<CreatePostInput>,
  userId: string
): Promise<Post | null> {
  // Verify ownership first
  const { data: existing } = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", id)
    .single();

  if (!existing || existing.author_id !== userId) {
    console.error("Unauthorized: not the post author");
    return null;
  }

  const { data, error } = await supabase
    .from("posts")
    .update({
      body: updates.body,
      // Only update preview if provided
      ...(updates.preview && {
        preview_name: updates.preview.name,
        preview_description: updates.preview.description,
        preview_thumbnail: updates.preview.thumbnail,
        preview_playing: updates.preview.playing,
        preview_visits: updates.preview.visits,
      }),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating post:", error);
    return null;
  }

  return data as Post;
}

// Delete a post (author only)
export async function deletePost(id: string, userId: string): Promise<boolean> {
  // Verify ownership first
  const { data: existing } = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", id)
    .single();

  if (!existing || existing.author_id !== userId) {
    console.error("Unauthorized: not the post author");
    return false;
  }

  const { error } = await supabase.from("posts").delete().eq("id", id);

  if (error) {
    console.error("Error deleting post:", error);
    return false;
  }

  return true;
}

// Subscribe to post changes
export function subscribeToPosts(callback: (payload: any) => void) {
  return supabase
    .channel("posts")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "posts" },
      callback
    )
    .subscribe();
}

// Search posts by keyword (full-text search)
export async function searchPosts(query: string, limit: number = 20) {
  const { data, error } = await supabase
    .rpc('search_posts', { query_text: query })
    .limit(limit);

  if (error) {
    console.error('Search error:', error);
    throw error;
  }

  return data || [];
}

// Alternative: Client-side simple search (fallback)
export async function searchPostsSimple(query: string, limit: number = 20) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .or(`preview_name.ilike.%${query}%,preview_description.ilike.%${query}%,body.ilike.%${query}%`)
    .limit(limit)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Simple search error:', error);
    throw error;
  }

  return data || [];
}
