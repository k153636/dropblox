import { create } from "zustand";
import { getPosts, createPost, updatePost, deletePost, subscribeToPosts, Post } from "./db-posts";
import { getCommentsByPostId, createComment, subscribeToComments, Comment } from "./db-comments";
import { toggleLike, hasLiked, getLikeCount, subscribeToLikes } from "./db-likes";
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
  
  // Actions
  loadPosts: () => Promise<void>;
  loadMorePosts: () => Promise<void>;
  loadComments: (postId: string) => Promise<void>;
  addPost: (url: string, body: string, preview?: GamePreview) => Promise<void>;
  updatePost: (id: string, body: string) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  likePost: (id: string) => Promise<void>;
  addComment: (postId: string, body: string, parentId?: string) => Promise<void>;
  
  // Subscriptions
  subscribeToRealtime: () => (() => void);
}

export const usePostStore = create<PostStore>((set, get) => ({
  posts: [],
  isLoading: false,
  isLoadingMore: false,
  error: null,
  hasMore: true,
  offset: 0,

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
      
      if (post) {
        set((state) => ({
          posts: [
            { ...post, likes: 0, userLiked: false, comments: [] },
            ...state.posts,
          ],
        }));
      }
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updatePost: async (id: string, body: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    try {
      const updated = await updatePost(id, { body }, user.id);
      if (updated) {
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === id ? { ...p, body: updated.body } : p
          ),
        }));
      }
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deletePost: async (id: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    try {
      const success = await deletePost(id, user.id);
      if (success) {
        set((state) => ({
          posts: state.posts.filter((p) => p.id !== id),
        }));
      }
    } catch (error: any) {
      set({ error: error.message });
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

  subscribeToRealtime: () => {
    // Subscribe to posts
    const postsSubscription = subscribeToPosts((payload) => {
      if (payload.eventType === "INSERT") {
        // New post added by another user
        const newPost = payload.new as Post;
        set((state) => ({
          posts: [
            { ...newPost, likes: 0, userLiked: false, comments: [] },
            ...state.posts,
          ],
        }));
      } else if (payload.eventType === "DELETE") {
        // Post deleted
        const deletedId = payload.old.id;
        set((state) => ({
          posts: state.posts.filter((p) => p.id !== deletedId),
        }));
      }
    });

    return () => {
      postsSubscription.unsubscribe();
    };
  },
}));
