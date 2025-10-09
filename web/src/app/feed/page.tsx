'use client';

import { useEffect, useRef, useState } from 'react';
// Rolling counter animation (old value slides up, new value slides in)
function RollingCounter({ value }: { value: number }) {
  const prevRef = useRef<number>(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const prev = prevRef.current;
    if (value === prev) return;

    setIsAnimating(true);
    const t = setTimeout(() => {
      prevRef.current = value;
      setIsAnimating(false);
    }, 350);
    return () => clearTimeout(t);
  }, [value]);

  const prev = prevRef.current;
  const direction = value > prev ? 'up' : 'down';
  const widthCh = String(Math.max(prev, value, String(value).length + 1)).length + 0.5;

  const transformClass = isAnimating
    ? (direction === 'up' ? '-translate-y-5' : 'translate-y-5')
    : 'translate-y-0';

  return (
    <span
      className="relative inline-block overflow-hidden align-middle"
      style={{ width: `${widthCh}ch`, height: '1.25rem' }}
      aria-live="polite"
      aria-atomic="true"
    >
      <span className={`block transition-transform duration-300 ease-out ${transformClass}`}>
        {value}
      </span>
    </span>
  );
}

import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getToken, clearToken } from '@/lib/auth';
import { getSocket } from '@/lib/socket';
import { NotificationBell } from '@/components/NotificationBell';
import { AIToolbar } from '@/components/AIToolbar';
import { AIPromptDialog } from '@/components/AIPromptDialog';
import { AIGenerateDialog } from '@/components/AIGenerateDialog';
import { MentionAutocomplete } from '@/components/MentionAutocomplete';
import { parseMultilineText } from '@/utils/text-parser';
import { useMentionAutocomplete } from '@/hooks/useMentionAutocomplete';

interface Post {
  id: string;
  content: string;
  mediaUrls?: string[];
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  createdAt: string;
  commentsCount?: number;
  likesCount?: number;
}

interface Notification {
  id: string;
  type: string;
  message?: string;
  read: boolean;
  createdAt: string;
}

export default function FeedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [replyTo, setReplyTo] = useState<Record<string, any | null>>({});
  const [commentOffset, setCommentOffset] = useState<Record<string, number>>({});
  const deletedCommentIdsRef = useRef<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<{ postId: string; commentId: string } | null>(null);
  const [deletePostConfirm, setDeletePostConfirm] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editPostContent, setEditPostContent] = useState<string>('');
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // AI states
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestions, setAISuggestions] = useState<string[]>([]);
  const [aiLoading, setAILoading] = useState(false);
  const [aiError, setAIError] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState(false);

  const formatDate = (iso: string) => {
    try {
      // Stable, timezone-agnostic rendering to avoid hydration mismatches
      return new Date(iso).toISOString().slice(0, 16).replace('T', ' ');
    } catch {
      return iso;
    }
  };

  const formatTimeAgo = (iso: string) => {
    try {
      const date = new Date(iso);
      const now = new Date();
      const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (seconds < 60) return 'just now';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `${days}d ago`;
      const weeks = Math.floor(days / 7);
      if (weeks < 4) return `${weeks}w ago`;
      const months = Math.floor(days / 30);
      if (months < 12) return `${months}mo ago`;
      const years = Math.floor(days / 365);
      return `${years}y ago`;
    } catch {
      return iso;
    }
  };

  const dedupeById = (items: any[]) => {
    const seen = new Set<string>();
    const out: any[] = [];
    for (const it of items) {
      const id = it?.id;
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push(it);
    }
    return out;
  };
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const profileTriggerRef = useRef<HTMLButtonElement | null>(null);
  const commentInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const newPostTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const editPostTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  
  // Mention autocomplete for new post
  const {
    mentionState: newPostMentionState,
    handleTextChange: handleNewPostTextChange,
    handleMentionSelect: handleNewPostMentionSelect,
    closeMentionAutocomplete: closeNewPostMentionAutocomplete,
  } = useMentionAutocomplete(newPostTextareaRef);

  // Mention autocomplete for edit post
  const {
    mentionState: editPostMentionState,
    handleTextChange: handleEditPostTextChange,
    handleMentionSelect: handleEditPostMentionSelect,
    closeMentionAutocomplete: closeEditPostMentionAutocomplete,
  } = useMentionAutocomplete(editPostTextareaRef);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    loadData();
    setupRealtimeListeners();

    return () => {
      const socket = getSocket();
      socket.off('post.like.added');
      socket.off('post.like.removed');
      socket.removeAllListeners(); // Remove all listeners to prevent duplicates
    };
  }, [router]);

  const loadData = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const [postsData, meData, likesData] = await Promise.all([
        api.getPosts(token),
        api.getMe(token),
        api.getMyLikes(token).catch(() => ({ likedPostIds: [] })),
      ]);

      // Fetch full user profile
      const userData = await api.getUserById(token, meData.userId);

      setPosts(postsData);
      setCurrentUserId(meData.userId);
      setCurrentUser(userData);
      setLikedPosts(new Set(likesData.likedPostIds));
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeListeners = async () => {
    const socket = getSocket();
    
    const token = getToken();
    if (token) {
      try {
        const me = await api.getMe(token);
        const myUserId = me.userId as string;

        // Remove existing post like listeners to prevent duplicates
        socket.off('post.like.added');
        socket.off('post.like.removed');

        socket.on('post.like.added', (data: { postId: string; userId: string }) => {
          if (data.userId === myUserId) return;
          setPosts((prev) => prev.map((p) => (p.id === data.postId ? { ...p, likesCount: (p.likesCount || 0) + 1 } : p)));
        });

        socket.on('post.like.removed', (data: { postId: string; userId: string }) => {
          if (data.userId === myUserId) return;
          setPosts((prev) => prev.map((p) => (p.id === data.postId ? { ...p, likesCount: Math.max((p.likesCount || 1) - 1, 0) } : p)));
        });
      } catch (err) {
        console.error('Failed to setup realtime listeners', err);
      }
    }
  };

  const cleanPostContent = (content: string): string => {
    // Remove excessive consecutive newlines (replace 3+ with 2)
    let cleaned = content.replace(/\n{3,}/g, '\n\n');
    
    // Remove trailing/leading whitespace from each line
    cleaned = cleaned.split('\n').map(line => line.trim()).join('\n');
    
    // Remove leading/trailing empty lines
    cleaned = cleaned.trim();
    
    return cleaned;
  };

  const validatePost = (content: string): string | null => {
    if (!content.trim()) return 'Post cannot be empty';
    return null;
  };

  const shouldTruncatePost = (content: string): boolean => {
    const lines = content.split('\n');
    return lines.length > 3;
  };

  const getTruncatedPost = (content: string): string => {
    const lines = content.split('\n');
    return lines.slice(0, 3).join('\n');
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanedContent = cleanPostContent(newPost);
    
    const error = validatePost(cleanedContent);
    if (error) {
      alert(error);
      return;
    }

    const token = getToken();
    if (!token) return;

    setPosting(true);
    try {
      await api.createPost(token, cleanedContent);
      setNewPost('');
      await loadData();
    } catch (err) {
      console.error('Failed to create post', err);
      alert('Failed to create post. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    const token = getToken();
    if (!token) return;

    try {
      if (likedPosts.has(postId)) {
        await api.unlikePost(token, postId);
        setLikedPosts((prev) => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        // optimistic
        setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likesCount: Math.max((p.likesCount || 1) - 1, 0) } : p)));
      } else {
        await api.likePost(token, postId);
        setLikedPosts((prev) => new Set(prev).add(postId));
        setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likesCount: (p.likesCount || 0) + 1 } : p)));
      }
    } catch (err) {
      console.error('Failed to toggle like', err);
    }
  };

  const handleEditPost = (post: any) => {
    setEditingPost(post.id);
    setEditPostContent(post.content);
    setIsEditMode(true);
  };

  const handleSavePost = async (postId: string) => {
    const token = getToken();
    if (!token) return;

    const cleanedContent = cleanPostContent(editPostContent);

    const error = validatePost(cleanedContent);
    if (error) {
      alert(error);
      return;
    }

    try {
      await api.updatePost(token, postId, cleanedContent);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, content: cleanedContent } : p))
      );
      setEditingPost(null);
      setEditPostContent('');
    } catch (err) {
      console.error('Failed to update post', err);
      alert('Failed to update post. Please try again.');
    }
  };

  const handleDeletePost = async (postId: string) => {
    const token = getToken();
    if (!token) return;

    try {
      await api.deletePost(token, postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setDeletePostConfirm(null);
    } catch (err) {
      console.error('Failed to delete post', err);
      setDeletePostConfirm(null);
    }
  };

  const loadComments = async (postId: string) => {
    try {
      const offset = commentOffset[postId] ?? 0;
      const data = await api.getComments(postId, 20, offset);
      setComments((prev) => ({ ...prev, [postId]: dedupeById([ ...(prev[postId] || []), ...data ]) }));
      setCommentOffset((prev) => ({ ...prev, [postId]: offset + data.length }));
    } catch (e) {
      console.error('Failed to load comments', e);
    }
  };

  const handleToggleComments = async (postId: string) => {
    const next = expandedPostId === postId ? null : postId;
    setExpandedPostId(next);
    if (next && !comments[next]) {
      await loadComments(next);
    }
  };

  const handleAddComment = async (postId: string) => {
    const token = getToken();
    if (!token) return;
    const text = (newComment[postId] || '').trim();
    if (!text) return;
    try {
      const parentId = replyTo[postId]?.id as string | undefined;
      const created = await api.addComment(token, postId, text, parentId);
      setComments((prev) => ({ ...prev, [postId]: dedupeById([...(prev[postId] || []), created]) }));
      setNewComment((prev) => ({ ...prev, [postId]: '' }));
      setReplyTo((prev) => ({ ...prev, [postId]: null }));
      // optimistic increment
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p)));
    } catch (e) {
      console.error('Failed to add comment', e);
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    const token = getToken();
    if (!token) return;
    try {
      // mark to ignore realtime duplicate decrement
      deletedCommentIdsRef.current.add(commentId);
      await api.deleteComment(token, postId, commentId);
      setComments((prev) => ({ ...prev, [postId]: (prev[postId] || []).filter((c) => c.id !== commentId) }));
      // optimistic decrement
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, commentsCount: Math.max((p.commentsCount || 1) - 1, 0) } : p)));
      setDeleteConfirm(null);
    } catch (e) {
      console.error('Failed to delete comment', e);
      setDeleteConfirm(null);
    }
  };

  const handleLogout = () => {
    clearToken();
    router.push('/login');
  };


  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      const token = getToken();
      if (!token) return;

      setSearching(true);
      try {
        const results = await api.searchUsers(token, query);
        setSearchResults(results);
      } catch (err) {
        console.error('Failed to search users', err);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  // AI Functions
  const handleAIGenerate = async (prompt: string) => {
    const token = getToken();
    if (!token) return;

    setShowAIPrompt(false);
    setShowAISuggestions(true);
    setAILoading(true);
    setAIError('');
    setAISuggestions([]);

    try {
      const response = await api.generateText(token, prompt, 500);
      if (response.error) {
        setAIError(response.error);
      } else {
        setAISuggestions(response.suggestions || []);
      }
    } catch (err) {
      console.error('AI generation failed:', err);
      setAIError('Failed to generate text. Please try again.');
    } finally {
      setAILoading(false);
    }
  };

  const handleAIEnhance = async (tone?: 'professional' | 'casual' | 'friendly' | 'humorous') => {
    const token = getToken();
    if (!token) return;

    const textToEnhance = isEditMode ? editPostContent : newPost;
    if (!textToEnhance.trim()) return;

    setAILoading(true);
    try {
      const response = await api.enhanceText(token, textToEnhance, tone, 500);
      if (response.error) {
        alert(response.error);
      } else {
        if (isEditMode) {
          setEditPostContent(response.enhanced);
        } else {
          setNewPost(response.enhanced);
        }
      }
    } catch (err) {
      console.error('AI enhancement failed:', err);
      alert('Failed to enhance text. Please try again.');
    } finally {
      setAILoading(false);
    }
  };

  const handleAIShorten = async () => {
    const token = getToken();
    if (!token) return;

    const textToShorten = isEditMode ? editPostContent : newPost;
    if (!textToShorten.trim()) return;

    setAILoading(true);
    try {
      const response = await api.shortenText(token, textToShorten, 500);
      if (response.error) {
        alert(response.error);
      } else {
        if (isEditMode) {
          setEditPostContent(response.shortened);
        } else {
          setNewPost(response.shortened);
        }
      }
    } catch (err) {
      console.error('AI shortening failed:', err);
      alert('Failed to shorten text. Please try again.');
    } finally {
      setAILoading(false);
    }
  };

  const handleSelectAISuggestion = (text: string) => {
    if (isEditMode) {
      setEditPostContent(text);
    } else {
      setNewPost(text);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      if (showProfileMenu && !target.closest('.profile-dropdown') && !target.closest('.profile-menu-trigger')) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu]);

  // Keyboard: close on Escape and focus management
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showProfileMenu) {
          setShowProfileMenu(false);
          // return focus to trigger
          profileTriggerRef.current?.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showProfileMenu]);

  useEffect(() => {
    if (showProfileMenu) profileMenuRef.current?.focus();
  }, [showProfileMenu]);
  // Realtime comments listeners
  useEffect(() => {
    if (!expandedPostId) return;
    const socket = getSocket();
    let myUserIdCache: string | null = null;
    (async () => {
      const token = getToken();
      if (!token) return;
      try {
        const me = await api.getMe(token);
        myUserIdCache = me.userId as string;
      } catch {}
    })();

    const added = (comment: any) => {
      // Skip if I just added optimistically
      if (comment?.author?.id && myUserIdCache && comment.author.id === myUserIdCache) return;
      setComments((prev) => ({ ...prev, [expandedPostId]: dedupeById([ ...(prev[expandedPostId] || []), comment ]) }));
      // increment count for the post that received comment
      setPosts((prev) => prev.map((p) => (p.id === expandedPostId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p)));
    };
    const deleted = (data: { commentId: string }) => {
      if (deletedCommentIdsRef.current.has(data.commentId)) {
        deletedCommentIdsRef.current.delete(data.commentId);
        return;
      }
      setComments((prev) => ({ ...prev, [expandedPostId]: (prev[expandedPostId] || []).filter((c) => c.id !== data.commentId) }));
      setPosts((prev) => prev.map((p) => (p.id === expandedPostId ? { ...p, commentsCount: Math.max((p.commentsCount || 1) - 1, 0) } : p)));
    };
    socket.on(`comment.added.${expandedPostId}`, added);
    socket.on(`comment.deleted.${expandedPostId}`, deleted);
    return () => {
      socket.off(`comment.added.${expandedPostId}`, added);
      socket.off(`comment.deleted.${expandedPostId}`, deleted);
    };
  }, [expandedPostId]);

  // Global per-post listeners to keep counts in sync even when threads are collapsed or in other tabs
  useEffect(() => {
    const socket = getSocket();
    const handlers: { id: string; add: (c: any) => void; del: (d: { commentId: string }) => void }[] = [];
    posts.forEach((p) => {
      const add = (comment: any) => {
        if (comment?.author?.id && currentUserId && comment.author.id === currentUserId) return;
        setPosts((prev) => prev.map((x) => (x.id === p.id ? { ...x, commentsCount: (x.commentsCount || 0) + 1 } : x)));
      };
      const del = (data: { commentId: string }) => {
        if (deletedCommentIdsRef.current.has(data.commentId)) return;
        setPosts((prev) => prev.map((x) => (x.id === p.id ? { ...x, commentsCount: Math.max((x.commentsCount || 1) - 1, 0) } : x)));
      };
      socket.on(`comment.added.${p.id}`, add);
      socket.on(`comment.deleted.${p.id}`, del);
      handlers.push({ id: p.id, add, del });
    });
    return () => {
      handlers.forEach((h) => {
        socket.off(`comment.added.${h.id}`, h.add);
        socket.off(`comment.deleted.${h.id}`, h.del);
      });
    };
  }, [posts, currentUserId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Ustbian</h1>
          <div className="flex items-center gap-4">
            {/* Search (anchored) */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSearch((v) => !v);
                  setShowNotifications(false);
                  setShowProfileMenu(false);
                }}
                className="p-2 text-gray-600 hover:text-gray-900 transition focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full cursor-pointer"
                title="Search users"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {showSearch && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto focus:outline-none">
                  <div className="p-3 border-b border-gray-200">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Search users..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoFocus
                    />
                  </div>
                  {searching ? (
                    <div className="p-4 text-center text-gray-500">Searching...</div>
                  ) : searchResults.length === 0 && searchQuery.trim() ? (
                    <div className="p-4 text-center text-gray-500">No users found</div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">Type to search users</div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {searchResults.map((user: any) => (
                        <a
                          key={user.id}
                          href={`/user/${user.username}`}
                          className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition"
                          onClick={() => {
                            setShowSearch(false);
                            setSearchQuery('');
                            setSearchResults([]);
                          }}
                        >
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.displayName} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {user.displayName[0].toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{user.displayName}</p>
                            <p className="text-sm text-gray-600 truncate">@{user.username}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notifications */}
            <NotificationBell />

            {/* Profile (anchored) */}
            <div className="relative">
              <button
                ref={profileTriggerRef}
                aria-haspopup="menu"
                aria-expanded={showProfileMenu}
                onClick={() => {
                  setShowProfileMenu((v) => !v);
                }}
                className="profile-menu-trigger focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full cursor-pointer"
              >
                {currentUser?.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.displayName}
                    className="w-9 h-9 rounded-full object-cover border border-gray-300 hover:border-blue-500 transition"
                  />
                ) : (
                  <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold hover:bg-blue-700 transition">
                    {currentUser?.displayName?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </button>

              {showProfileMenu && (
                <div
                  ref={profileMenuRef}
                  role="menu"
                  tabIndex={-1}
                  className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 profile-dropdown focus:outline-none"
                >
                  <div className="p-3 border-b border-gray-200 flex items-center gap-3">
                    {currentUser?.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                        {currentUser?.displayName?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900 leading-4">{currentUser?.displayName}</p>
                      <p className="text-xs text-gray-600">@{currentUser?.username}</p>
                    </div>
                  </div>
                  <div className="py-1">
                    <a
                      href="/profile"
                      role="menuitem"
                      className="block px-3 py-2 text-gray-700 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        View Profile
                      </div>
                    </a>
                    <button
                      role="menuitem"
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 transition"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Create Post */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 relative">
          <form onSubmit={handleCreatePost}>
            <textarea
              ref={newPostTextareaRef}
              value={newPost}
              onChange={(e) => {
                setNewPost(e.target.value);
                handleNewPostTextChange(e.target.value, e.target.selectionStart);
              }}
              onKeyUp={(e) => {
                handleNewPostTextChange(e.currentTarget.value, e.currentTarget.selectionStart);
              }}
              onClick={(e) => {
                handleNewPostTextChange(e.currentTarget.value, e.currentTarget.selectionStart);
              }}
              placeholder="What's on your mind? Use @ to mention someone"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              maxLength={500}
            />
            
            <MentionAutocomplete
              show={newPostMentionState.show}
              query={newPostMentionState.query}
              position={newPostMentionState.position}
              onSelect={(username) => handleNewPostMentionSelect(username, newPost, setNewPost)}
              onClose={closeNewPostMentionAutocomplete}
            />
            
            <AIToolbar
              onGenerate={() => {
                setIsEditMode(false);
                setShowAIPrompt(true);
              }}
              onEnhance={(tone) => {
                setIsEditMode(false);
                handleAIEnhance(tone);
              }}
              onShorten={() => {
                setIsEditMode(false);
                handleAIShorten();
              }}
              disabled={aiLoading}
              hasText={newPost.trim().length > 0}
            />
            
            <div className="mt-3 flex justify-between items-center">
              <span className={`text-sm ${newPost.length > 450 ? 'text-orange-600 font-semibold' : 'text-gray-500'}`}>
                {newPost.length}/500
              </span>
              <button
                type="submit"
                disabled={posting || !newPost.trim() || aiLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
              >
                {posting ? 'Posting...' : aiLoading ? 'AI Processing...' : 'Post'}
              </button>
            </div>
          </form>
        </div>

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              No posts yet. Be the first to post!
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start gap-3">
                  <a href={`/user/${post.author.username}`} className="flex-shrink-0 cursor-pointer">
                    {post.author.avatarUrl ? (
                      <img
                        src={post.author.avatarUrl}
                        alt={post.author.displayName}
                        className="w-10 h-10 rounded-full object-cover hover:opacity-80 transition"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold hover:bg-blue-700 transition">
                        {post.author.displayName[0].toUpperCase()}
                      </div>
                    )}
                  </a>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <a 
                          href={`/user/${post.author.username}`}
                          className="font-semibold text-gray-900 hover:text-blue-600 hover:underline transition cursor-pointer"
                        >
                          {post.author.displayName}
                        </a>
                        <a 
                          href={`/user/${post.author.username}`}
                          className="text-gray-500 text-sm hover:text-blue-600 transition cursor-pointer"
                        >
                          @{post.author.username}
                        </a>
                        <span className="text-gray-400 text-xs">· {formatTimeAgo(post.createdAt)}</span>
                      </div>
                      {post.author.id === currentUserId && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditPost(post)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition cursor-pointer"
                            title="Edit post"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeletePostConfirm(post.id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition cursor-pointer"
                            title="Delete post"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                    {editingPost === post.id ? (
                      <div className="mt-2 space-y-2 relative">
                        <textarea
                          ref={editPostTextareaRef}
                          value={editPostContent}
                          onChange={(e) => {
                            setEditPostContent(e.target.value);
                            handleEditPostTextChange(e.target.value, e.target.selectionStart);
                          }}
                          onKeyUp={(e) => {
                            handleEditPostTextChange(e.currentTarget.value, e.currentTarget.selectionStart);
                          }}
                          onClick={(e) => {
                            handleEditPostTextChange(e.currentTarget.value, e.currentTarget.selectionStart);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          rows={3}
                          maxLength={500}
                        />
                        
                        <MentionAutocomplete
                          show={editPostMentionState.show}
                          query={editPostMentionState.query}
                          position={editPostMentionState.position}
                          onSelect={(username) => handleEditPostMentionSelect(username, editPostContent, setEditPostContent)}
                          onClose={closeEditPostMentionAutocomplete}
                        />
                        
                        <AIToolbar
                          onGenerate={() => {
                            setIsEditMode(true);
                            setShowAIPrompt(true);
                          }}
                          onEnhance={(tone) => {
                            setIsEditMode(true);
                            handleAIEnhance(tone);
                          }}
                          onShorten={() => {
                            setIsEditMode(true);
                            handleAIShorten();
                          }}
                          disabled={aiLoading}
                          hasText={editPostContent.trim().length > 0}
                        />
                        
                        <div className="flex items-center justify-between">
                          <span className={`text-xs ${editPostContent.length > 450 ? 'text-orange-600 font-semibold' : 'text-gray-500'}`}>
                            {editPostContent.length}/500
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSavePost(post.id)}
                              disabled={!editPostContent.trim() || aiLoading}
                              className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                            >
                              {aiLoading ? 'AI Processing...' : 'Save'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingPost(null);
                                setEditPostContent('');
                                setIsEditMode(false);
                              }}
                              className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition cursor-pointer text-sm font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <div className="text-gray-800">
                          {expandedPosts.has(post.id) || !shouldTruncatePost(post.content)
                            ? parseMultilineText(post.content)
                            : parseMultilineText(getTruncatedPost(post.content))}
                        </div>
                        {shouldTruncatePost(post.content) && (
                          <button
                            onClick={() =>
                              setExpandedPosts((prev) => {
                                const newSet = new Set(prev);
                                if (newSet.has(post.id)) {
                                  newSet.delete(post.id);
                                } else {
                                  newSet.add(post.id);
                                }
                                return newSet;
                              })
                            }
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-1 cursor-pointer"
                          >
                            {expandedPosts.has(post.id) ? 'Show less' : 'Show more'}
                          </button>
                        )}
                      </div>
                    )}
                    <div className="mt-4 flex items-center gap-4">
                      {/* Like Button */}
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition cursor-pointer ${
                          likedPosts.has(post.id)
                            ? 'bg-red-50 text-red-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <svg className="w-5 h-5" fill={likedPosts.has(post.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                        <RollingCounter value={post.likesCount ?? 0} />
                      </button>
                      <button
                        aria-label={`Comments: ${post.commentsCount ?? 0}`}
                        onClick={() => handleToggleComments(post.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition cursor-pointer"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h8M8 14h5m5 0V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11l4-3h8a2 2 0 002-2z" />
                        </svg>
                        <RollingCounter value={post.commentsCount ?? 0} />
                      </button>
                    </div>
                    {expandedPostId === post.id && (
                      <div className="mt-4 border-t border-gray-200 pt-4 space-y-3">
                        {/* Reply indicator */}
                        {replyTo[post.id] && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border-l-4 border-blue-500 rounded">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            <span className="text-xs text-gray-700">
                              Replying to <span className="font-semibold text-blue-700">{replyTo[post.id].author?.displayName || 'User'}</span>
                            </span>
                            <button
                              onClick={() => setReplyTo((prev) => ({ ...prev, [post.id]: null }))}
                              className="ml-auto text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        )}

                        {/* Comment input */}
                        <div className="flex gap-2">
                          <input
                            ref={(el) => (commentInputRefs.current[post.id] = el)}
                            type="text"
                            value={newComment[post.id] || ''}
                            onChange={(e) => setNewComment((prev) => ({ ...prev, [post.id]: e.target.value }))}
                            placeholder={replyTo[post.id] ? `Reply to ${replyTo[post.id].author?.displayName}...` : "Write a comment..."}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (newComment[post.id]?.trim()) {
                                  handleAddComment(post.id);
                                }
                              }
                            }}
                          />
                          <button
                            onClick={() => handleAddComment(post.id)}
                            disabled={!newComment[post.id]?.trim()}
                            className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            title={replyTo[post.id] ? 'Send reply' : 'Send comment'}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                          </button>
                        </div>

                        {/* Comments list */}
                        <div className="space-y-2">
                          {(comments[post.id] || []).map((c) => (
                            <div key={c.id} className={`flex items-start gap-2 ${c.parent ? 'pl-8 border-l-2 border-gray-200' : ''}`}>
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-semibold flex-shrink-0">
                                {c.author?.displayName?.[0]?.toUpperCase() || 'U'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-gray-900">{c.author?.displayName || 'User'}</span>
                                  <span className="text-xs text-gray-500">{formatDate(c.createdAt)}</span>
                                </div>
                                <div className="text-gray-800 text-sm mt-1 break-words">{parseMultilineText(c.content)}</div>
                                <div className="mt-1 flex items-center gap-3">
                                  <button
                                    onClick={() => {
                                      setReplyTo((prev) => ({ ...prev, [post.id]: c }));
                                      // Focus input after state update
                                      setTimeout(() => {
                                        commentInputRefs.current[post.id]?.focus();
                                      }, 0);
                                    }}
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 cursor-pointer transition"
                                    title="Reply to this comment"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                    </svg>
                                    Reply
                                  </button>
                                  {c.author?.id === currentUserId && (
                                    <button
                                      onClick={() => setDeleteConfirm({ postId: post.id, commentId: c.id })}
                                      className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 cursor-pointer transition"
                                      title="Delete this comment"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                      Delete
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Load more */}
                        {comments[post.id] && comments[post.id].length > 0 && (
                          <div className="pt-2">
                            <button
                              onClick={() => loadComments(post.id)}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                            >
                              Load more comments
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Comment Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform animate-scaleIn">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">Delete Comment?</h3>
              <p className="text-gray-600 text-center mb-6">
                This action cannot be undone. Are you sure you want to delete this comment?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteComment(deleteConfirm.postId, deleteConfirm.commentId)}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Post Confirmation Modal */}
      {deletePostConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform animate-scaleIn">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">Delete Post?</h3>
              <p className="text-gray-600 text-center mb-6">
                This will permanently delete your post and all its comments. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletePostConfirm(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeletePost(deletePostConfirm)}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition cursor-pointer"
                >
                  Delete Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Prompt Dialog */}
      <AIPromptDialog
        isOpen={showAIPrompt}
        onClose={() => setShowAIPrompt(false)}
        onGenerate={handleAIGenerate}
      />

      {/* AI Suggestions Dialog */}
      <AIGenerateDialog
        isOpen={showAISuggestions}
        onClose={() => {
          setShowAISuggestions(false);
          setAISuggestions([]);
          setAIError('');
        }}
        onSelect={handleSelectAISuggestion}
        suggestions={aiSuggestions}
        loading={aiLoading}
        error={aiError}
      />
    </div>
  );
}
