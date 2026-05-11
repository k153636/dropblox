import { create } from "zustand";
import { getPosts, createPost, updatePost, deletePost, subscribeToPosts, searchPosts, Post } from "./db-posts";
import { getCommentsByPostId, createComment, updateComment, deleteComment, Comment } from "./db-comments";
import { toggleLike, hasLiked, getLikeCount, subscribeToAllLikes } from "./db-likes";
import { toggleCommentLike } from "./db-comment-likes";
import { supabase } from "./supabase";
import { useAuthStore } from "./auth-store";
import toast from "react-hot-toast";

export interface GamePreview {
  name: string;
  description: string;
  thumbnail: string;
  playing: number;
  visits: number;
  genre?: string;
}

export { type Post, type Comment };

export interface PostWithComments extends Post {
  comments: Comment[];
  userLiked: boolean;
  comment_count?: number;
}

interface PostStore {
  posts: PostWithComments[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  offset: number;
  
  // Search
  searchQuery: string;
  searchResults: Post[];
  isSearching: boolean;
  hasSearched: boolean;
  
  // Actions
  loadPosts: () => Promise<void>;
  loadMorePosts: () => Promise<void>;
  loadComments: (postId: string) => Promise<void>;
  addPost: (url: string, body: string, preview?: GamePreview) => Promise<void>;
  updatePost: (id: string, body: string) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  likePost: (id: string) => Promise<void>;
  addComment: (postId: string, body: string, parentId?: string) => Promise<void>;
  updateComment: (postId: string, commentId: string, body: string) => Promise<void>;
  deleteComment: (postId: string, commentId: string) => Promise<void>;
  likeComment: (postId: string, commentId: string) => Promise<void>;
  
  // Subscriptions
  subscribeToRealtime: () => (() => void);
  
  // Search Actions
  searchPosts: (query: string) => Promise<void>;
  clearSearch: () => void;
  setSearchQuery: (query: string) => void;
}

export const usePostStore = create<PostStore>((set, get) => ({
  posts: [],
  isLoading: false,
  isLoadingMore: false,
  error: null,
  hasMore: true,
  offset: 0,
  
  // Search state
  searchQuery: "",
  searchResults: [],
  isSearching: false,
  hasSearched: false,

  loadPosts: async () => {
    set({ isLoading: true, error: null, offset: 0 });
    try {
      const posts = await getPosts(20, 0);
      const user = useAuthStore.getState().user;
      
      // Load likes status for each post
      const postsWithLikes = await Promise.all(
        posts.map(async (post) => {
          const likeCount = await getLikeCount(post.id);
          const userLiked = user ? await hasLiked(post.id, user.id) : false;
          return {
            ...post,
            likes: likeCount,
            userLiked,
            comments: [], // Load comments separately
          };
        })
      );
      
      set({ 
        posts: postsWithLikes, 
        isLoading: false,
        hasMore: posts.length === 20,
        offset: posts.length,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  loadMorePosts: async () => {
    const { offset, posts, isLoadingMore } = get();
    if (isLoadingMore) return;
    
    set({ isLoadingMore: true });
    try {
      const newPosts = await getPosts(20, offset);
      const user = useAuthStore.getState().user;
      
      // Load likes status for each post
      const postsWithLikes = await Promise.all(
        newPosts.map(async (post) => {
          const likeCount = await getLikeCount(post.id);
          const userLiked = user ? await hasLiked(post.id, user.id) : false;
          return {
            ...post,
            likes: likeCount,
            userLiked,
            comments: [],
          };
        })
      );
      
      set({ 
        posts: [...posts, ...postsWithLikes],
        isLoadingMore: false,
        hasMore: newPosts.length === 20,
        offset: offset + newPosts.length,
      });
    } catch (error: any) {
      set({ error: error.message, isLoadingMore: false });
    }
  },

  loadComments: async (postId: string) => {
    try {
      const user = useAuthStore.getState().user;
      const comments = await getCommentsByPostId(postId, user?.id);
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, comments } : p
        ),
      }));
    } catch (error: any) {
      console.error("Error loading comments:", error);
    }
  },

  addPost: async (url: string, body: string, preview?: GamePreview) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      useAuthStore.getState().openAuthModal();
      return;
    }

    try {
      const post = await createPost(
        { url, body, preview },
        user.id,
        user.username
      );
      
      if (!post) {
        throw new Error("Failed to create post");
      }

      set((state) => ({
        posts: [
          { ...post, likes: 0, userLiked: false, comments: [] },
          ...state.posts,
        ],
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  updatePost: async (id: string, body: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    try {
      const updated = await updatePost(id, { body }, user.id);
      if (!updated) {
        throw new Error("Failed to update post");
      }

      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === id ? { ...p, body: updated.body } : p
        ),
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  deletePost: async (id: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    try {
      const success = await deletePost(id, user.id);
      if (!success) {
        throw new Error("Failed to delete post");
      }

      set((state) => ({
        posts: state.posts.filter((p) => p.id !== id),
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  likePost: async (id: string) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      useAuthStore.getState().openAuthModal();
      return;
    }

    // Optimistic update
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === id
          ? {
              ...p,
              likes: p.userLiked ? p.likes - 1 : p.likes + 1,
              userLiked: !p.userLiked,
            }
          : p
      ),
    }));

    try {
      const result = await toggleLike(id, user.id);
      if (result.error) {
        // Revert on error
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === id
              ? {
                  ...p,
                  likes: p.userLiked ? p.likes - 1 : p.likes + 1,
                  userLiked: !p.userLiked,
                }
              : p
          ),
        }));
      }
    } catch (error: any) {
      console.error("Error toggling like:", error);
    }
  },

  addComment: async (postId: string, body: string, parentId?: string) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      useAuthStore.getState().openAuthModal();
      return;
    }

    // Optimistic: add a temporary comment immediately
    const tempId = `temp-${Date.now()}`;
    const optimistic: Comment = {
      id: tempId,
      post_id: postId,
      author_id: user.id,
      author_name: user.username,
      body,
      parent_id: parentId || null,
      created_at: new Date().toISOString(),
      comment_likes_count: 0,
      user_has_liked: false,
    };
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId
          ? { ...p, comments: [...p.comments, optimistic], comment_count: (p.comment_count || p.comments.length) + 1 }
          : p
      ),
    }));

    try {
      const comment = await createComment(postId, body, user.id, user.username, parentId);
      if (comment) {
        // Replace optimistic with real
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId
              ? { ...p, comments: p.comments.map((c) => (c.id === tempId ? comment : c)) }
              : p
          ),
        }));
      } else {
        // Revert
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId
              ? { ...p, comments: p.comments.filter((c) => c.id !== tempId), comment_count: Math.max(0, (p.comment_count || p.comments.length) - 1) }
              : p
          ),
        }));
        toast.error("Failed to post comment");
      }
    } catch {
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId
            ? { ...p, comments: p.comments.filter((c) => c.id !== tempId), comment_count: Math.max(0, (p.comment_count || p.comments.length) - 1) }
            : p
        ),
      }));
      toast.error("Failed to post comment");
    }
  },

  updateComment: async (postId: string, commentId: string, body: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    try {
      const updated = await updateComment(commentId, body, user.id);
      if (updated) {
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  comments: p.comments.map((c) =>
                    c.id === commentId ? { ...c, body: updated.body } : c
                  ),
                }
              : p
          ),
        }));
      }
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteComment: async (postId: string, commentId: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    // Optimistic: remove immediately, save for revert
    let removed: Comment | undefined;
    set((state) => ({
      posts: state.posts.map((p) => {
        if (p.id !== postId) return p;
        removed = p.comments.find((c) => c.id === commentId);
        return {
          ...p,
          comments: p.comments.filter((c) => c.id !== commentId),
          comment_count: Math.max(0, (p.comment_count || p.comments.length) - 1),
        };
      }),
    }));

    try {
      const success = await deleteComment(commentId, user.id);
      if (!success && removed) {
        // Revert
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId
              ? { ...p, comments: [...p.comments, removed!], comment_count: (p.comment_count || p.comments.length) + 1 }
              : p
          ),
        }));
        toast.error("Failed to delete comment");
      }
    } catch {
      if (removed) {
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId
              ? { ...p, comments: [...p.comments, removed!], comment_count: (p.comment_count || p.comments.length) + 1 }
              : p
          ),
        }));
      }
      toast.error("Failed to delete comment");
    }
  },

  likeComment: async (postId: string, commentId: string) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      useAuthStore.getState().openAuthModal();
      return;
    }

    // Optimistic toggle
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: p.comments.map((c) =>
                c.id === commentId
                  ? {
                      ...c,
                      user_has_liked: !c.user_has_liked,
                      comment_likes_count: c.user_has_liked
                        ? c.comment_likes_count - 1
                        : c.comment_likes_count + 1,
                    }
                  : c
              ),
            }
          : p
      ),
    }));

    try {
      const result = await toggleCommentLike(commentId, user.id);
      if (result.error) {
        // Revert
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  comments: p.comments.map((c) =>
                    c.id === commentId
                      ? {
                          ...c,
                          user_has_liked: !c.user_has_liked,
                          comment_likes_count: c.user_has_liked
                            ? c.comment_likes_count - 1
                            : c.comment_likes_count + 1,
                        }
                      : c
                  ),
                }
              : p
          ),
        }));
      }
    } catch {
      // Revert
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId
            ? {
                ...p,
                comments: p.comments.map((c) =>
                  c.id === commentId
                    ? {
                        ...c,
                        user_has_liked: !c.user_has_liked,
                        comment_likes_count: c.user_has_liked
                          ? c.comment_likes_count - 1
                          : c.comment_likes_count + 1,
                      }
                    : c
                ),
              }
            : p
        ),
      }));
    }
  },

  subscribeToRealtime: () => {
    // Subscribe to posts
    const postsSubscription = subscribeToPosts((payload) => {
      if (payload.eventType === "INSERT") {
        // New post added - skip if already exists (e.g. added by addPost optimistically)
        const newPost = payload.new as Post;
        set((state) => {
          if (state.posts.some((p) => p.id === newPost.id)) return state;
          return {
            posts: [
              { ...newPost, likes: 0, userLiked: false, comments: [] },
              ...state.posts,
            ],
          };
        });
      } else if (payload.eventType === "UPDATE") {
        // Post updated
        const updatedPost = payload.new as Post;
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === updatedPost.id
              ? {
                  ...p,
                  body: updatedPost.body,
                  preview_name: updatedPost.preview_name,
                  preview_description: updatedPost.preview_description,
                  preview_thumbnail: updatedPost.preview_thumbnail,
                  preview_playing: updatedPost.preview_playing,
                  preview_visits: updatedPost.preview_visits,
                  preview_genre: updatedPost.preview_genre,
                  last_fetched_at: updatedPost.last_fetched_at,
                }
              : p
          ),
        }));
      } else if (payload.eventType === "DELETE") {
        // Post deleted
        const deletedId = payload.old.id;
        set((state) => ({
          posts: state.posts.filter((p) => p.id !== deletedId),
        }));
      }
    });

    // Subscribe to likes - Realtime like updates
    const likesSubscription = subscribeToAllLikes((payload: any) => {
      const likeData = payload.eventType === "DELETE" ? payload.old : payload.new;
      if (!likeData) return;
      const { post_id: postId, user_id: userId } = likeData as { post_id: string; user_id: string };
      const currentUserId = useAuthStore.getState().user?.id;

      // Skip events from the current user — already handled by optimistic update in likePost
      if (userId === currentUserId) return;

      set((state) => ({
        posts: state.posts.map((post) => {
          if (post.id === postId) {
            if (payload.eventType === "INSERT") {
              return {
                ...post,
                likes: post.likes + 1,
              };
            } else if (payload.eventType === "DELETE") {
              return {
                ...post,
                likes: Math.max(0, post.likes - 1),
              };
            }
          }
          return post;
        }),
      }));
    });

    // Subscribe to all comments for realtime badge + modal updates
    const commentsSubscription = supabase
      .channel("comments:all")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments" },
        (payload) => {
          const currentUserId = useAuthStore.getState().user?.id;

          if (payload.eventType === "INSERT") {
            const newComment = payload.new as Omit<Comment, "comment_likes_count" | "user_has_liked">;
            const postId = newComment.post_id;

            set((state) => {
              const post = state.posts.find((p) => p.id === postId);
              if (!post) return state;

              // If already exists (optimistic), skip
              if (post.comments.some((c) => c.id === newComment.id)) return state;

              // Skip own inserts that are already covered by optimistic (temp id replaced)
              // but include comments from other users
              if (newComment.author_id === currentUserId) return state;

              const fullComment: Comment = {
                ...newComment,
                comment_likes_count: 0,
                user_has_liked: false,
              };
              return {
                posts: state.posts.map((p) =>
                  p.id === postId
                    ? {
                        ...p,
                        comments: [...p.comments, fullComment],
                        comment_count: (p.comment_count || p.comments.length) + 1,
                      }
                    : p
                ),
              };
            });
          } else if (payload.eventType === "DELETE") {
            const deleted = payload.old as { id: string; post_id: string; author_id: string };
            if (deleted.author_id === currentUserId) return;
            set((state) => ({
              posts: state.posts.map((p) =>
                p.id === deleted.post_id
                  ? {
                      ...p,
                      comments: p.comments.filter((c) => c.id !== deleted.id),
                      comment_count: Math.max(0, (p.comment_count || p.comments.length) - 1),
                    }
                  : p
              ),
            }));
          }
        }
      )
      .subscribe();

    return () => {
      postsSubscription.unsubscribe();
      likesSubscription.unsubscribe();
      commentsSubscription.unsubscribe();
    };
  },

  // Search Actions
  searchPosts: async (query: string) => {
    if (!query.trim()) {
      get().clearSearch();
      return;
    }
    
    set({ isSearching: true, error: null });
    try {
      const results = await searchPosts(query, 20);
      set({ searchResults: results, isSearching: false, hasSearched: true });
    } catch (error: any) {
      set({ error: error.message, isSearching: false });
    }
  },

  clearSearch: () => {
    set({ searchQuery: "", searchResults: [], isSearching: false, hasSearched: false });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },
}));
