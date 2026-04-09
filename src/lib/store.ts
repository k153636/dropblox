import { create } from "zustand";
import { getPosts, createPost, updatePost, deletePost, subscribeToPosts, searchPosts, Post } from "./db-posts";
import { getCommentsByPostId, createComment, updateComment, deleteComment, subscribeToComments, Comment } from "./db-comments";
import { toggleLike, hasLiked, getLikeCount, subscribeToLikes, subscribeToAllLikes } from "./db-likes";
import { useAuthStore } from "./auth-store";

export interface GamePreview {
  name: string;
  description: string;
  thumbnail: string;
  playing: number;
  visits: number;
}

export { type Post, type Comment };

export interface PostWithComments extends Post {
  comments: Comment[];
  userLiked: boolean;
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
      const comments = await getCommentsByPostId(postId);
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
      set({ error: "Must be signed in to create posts" });
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
      set({ error: "Must be signed in to like posts" });
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
      set({ error: "Must be signed in to comment" });
      return;
    }

    try {
      const comment = await createComment(postId, body, user.id, user.username, parentId);
      if (comment) {
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId
              ? { ...p, comments: [...p.comments, comment] }
              : p
          ),
        }));
      }
    } catch (error: any) {
      set({ error: error.message });
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

    try {
      const success = await deleteComment(commentId, user.id);
      if (success) {
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  comments: p.comments.filter((c) => c.id !== commentId),
                }
              : p
          ),
        }));
      }
    } catch (error: any) {
      set({ error: error.message });
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
              ? { ...p, body: updatedPost.body, preview_name: updatedPost.preview_name, preview_description: updatedPost.preview_description }
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

    return () => {
      postsSubscription.unsubscribe();
      likesSubscription.unsubscribe();
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
