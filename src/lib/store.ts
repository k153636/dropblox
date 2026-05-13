import { create } from "zustand";
import { getPosts, getPostById, getGameStatsByIds, createPost, updatePost, deletePost, subscribeToPosts, searchPosts, getDistinctGenres, Post } from "./db-posts";
import { getCommentsByPostId, createComment, updateComment, deleteComment, Comment } from "./db-comments";
import { toggleLike, hasLikedBatch, subscribeToAllLikes } from "./db-likes";
import { toggleCommentLike } from "./db-comment-likes";
import { getFollowingIds, getPostsByFollowing } from "./db-follows";
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

  // Filter / Sort
  activeGenre: string;
  sortBy: "recent" | "popular";
  genres: string[];
  feedMode: "all" | "following";

  // Search
  searchQuery: string;
  searchResults: Post[];
  isSearching: boolean;
  hasSearched: boolean;

  // Actions
  loadPosts: () => Promise<void>;
  loadMorePosts: () => Promise<void>;
  loadGenres: () => Promise<void>;
  setGenre: (genre: string) => void;
  setSortBy: (sort: "recent" | "popular") => void;
  setFeedMode: (mode: "all" | "following") => void;
  refreshGameStats: () => Promise<void>;
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

  // Filter / Sort state
  activeGenre: "",
  sortBy: "recent",
  genres: [],
  feedMode: "all" as "all" | "following",

  // Search state
  searchQuery: "",
  searchResults: [],
  isSearching: false,
  hasSearched: false,

  loadPosts: async () => {
    const { activeGenre, sortBy, feedMode } = get();
    set({ isLoading: true, error: null, offset: 0 });
    try {
      const user = useAuthStore.getState().user;
      let posts: Post[];

      if (feedMode === "following" && user) {
        const followingIds = await getFollowingIds(user.id);
        posts = await getPostsByFollowing(followingIds, 20, 0);
      } else {
        posts = await getPosts(20, 0, activeGenre || undefined, sortBy);
      }

      const postIds = posts.map((p) => p.id);
      const likedSet = user ? await hasLikedBatch(postIds, user.id) : new Set<string>();
      const postsWithLikes = posts.map((post) => ({
        ...post,
        userLiked: likedSet.has(post.id),
        comments: [],
      }));

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
    const { offset, posts, isLoadingMore, activeGenre, sortBy, feedMode } = get();
    if (isLoadingMore) return;

    set({ isLoadingMore: true });
    try {
      const user = useAuthStore.getState().user;
      let newPosts: Post[];

      if (feedMode === "following" && user) {
        const followingIds = await getFollowingIds(user.id);
        newPosts = await getPostsByFollowing(followingIds, 20, offset);
      } else {
        newPosts = await getPosts(20, offset, activeGenre || undefined, sortBy);
      }

      const newPostIds = newPosts.map((p) => p.id);
      const likedSet = user ? await hasLikedBatch(newPostIds, user.id) : new Set<string>();
      const postsWithLikes = newPosts.map((post) => ({
        ...post,
        userLiked: likedSet.has(post.id),
        comments: [],
      }));

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
        user.username,
        user.avatarUrl
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
      toast.success("Dropped!");
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
      toast.success("Post deleted");
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
    const currentPost = get().posts.find((p) => p.id === id);
    if (!currentPost) return;

    const wasLiked = currentPost.userLiked;
    const newLikes = wasLiked ? currentPost.likes - 1 : currentPost.likes + 1;
    const newUserLiked = !wasLiked;

    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === id
          ? {
              ...p,
              likes: newLikes,
              userLiked: newUserLiked,
            }
          : p
      ),
    }));

    try {
      const result = await toggleLike(id, user.id);
      if (result.error) {
        // Revert on error using stored previous state
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === id
              ? {
                  ...p,
                  likes: wasLiked ? currentPost.likes : currentPost.likes,
                  userLiked: wasLiked,
                }
              : p
          ),
        }));
        toast.error("Failed to toggle like");
      }
    } catch (error: any) {
      console.error("Error toggling like:", error);
      // Revert on exception
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === id
            ? {
                ...p,
                likes: wasLiked ? currentPost.likes : currentPost.likes,
                userLiked: wasLiked,
              }
            : p
        ),
      }));
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

    // Store previous state for reliable revert
    const currentPost = get().posts.find((p) => p.id === postId);
    const comment = currentPost?.comments.find((c) => c.id === commentId);
    if (!comment) return;

    const wasLiked = comment.user_has_liked;
    const prevCount = comment.comment_likes_count;

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
                      user_has_liked: !wasLiked,
                      comment_likes_count: wasLiked ? prevCount - 1 : prevCount + 1,
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
        // Revert using stored previous state
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  comments: p.comments.map((c) =>
                    c.id === commentId
                      ? {
                          ...c,
                          user_has_liked: wasLiked,
                          comment_likes_count: prevCount,
                        }
                      : c
                  ),
                }
              : p
          ),
        }));
        toast.error("Failed to toggle like");
      }
    } catch {
      // Revert using stored previous state
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId
            ? {
                ...p,
                comments: p.comments.map((c) =>
                  c.id === commentId
                    ? {
                        ...c,
                        user_has_liked: wasLiked,
                        comment_likes_count: prevCount,
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
        const postId = (payload.new as { id: string }).id;
        getPostById(postId).then((updated) => {
          if (!updated) return;
          set((state) => ({
            posts: state.posts.map((p) =>
              p.id === postId
                ? {
                    ...p,
                    body: updated.body,
                    preview_name: updated.preview_name,
                    preview_description: updated.preview_description,
                    preview_thumbnail: updated.preview_thumbnail,
                    preview_playing: updated.preview_playing,
                    preview_visits: updated.preview_visits,
                    preview_genre: updated.preview_genre,
                    last_fetched_at: updated.last_fetched_at,
                  }
                : p
            ),
          }));
        });
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

    // Poll game stats every 60 s — fallback for when Supabase Realtime
    // postgres_changes is not configured for the posts table
    const statsInterval = setInterval(() => {
      get().refreshGameStats();
    }, 60_000);

    return () => {
      clearInterval(statsInterval);
      postsSubscription.unsubscribe();
      likesSubscription.unsubscribe();
      commentsSubscription.unsubscribe();
    };
  },

  loadGenres: async () => {
    const genres = await getDistinctGenres(8);
    set({ genres });
  },

  setGenre: (genre: string) => {
    set({ activeGenre: genre });
    get().loadPosts();
  },

  setSortBy: (sort: "recent" | "popular") => {
    set({ sortBy: sort });
    get().loadPosts();
  },

  setFeedMode: (mode: "all" | "following") => {
    set({ feedMode: mode });
    get().loadPosts();
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

  refreshGameStats: async () => {
    const { posts } = get();
    if (posts.length === 0) return;
    const ids = posts.map((p) => p.id);
    const freshStats = await getGameStatsByIds(ids);
    if (freshStats.length === 0) return;
    const statsMap = new Map(freshStats.map((s) => [s.id, s]));
    set((state) => ({
      posts: state.posts.map((p) => {
        const s = statsMap.get(p.id);
        if (!s) return p;
        return {
          ...p,
          preview_name: s.preview_name,
          preview_thumbnail: s.preview_thumbnail,
          preview_playing: s.preview_playing,
          preview_visits: s.preview_visits,
          preview_genre: s.preview_genre,
          last_fetched_at: s.last_fetched_at,
        };
      }),
    }));
  },
}));
