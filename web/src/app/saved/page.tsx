'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { AppHeader } from '@/components/AppHeader';
import { parseMultilineText } from '@/utils/text-parser';

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
  savedAt?: string;
  commentsCount?: number;
  likesCount?: number;
}

export default function SavedPostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    loadSavedPosts();
  }, [router]);

  const loadSavedPosts = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const [savedPostsData, meData, likesData] = await Promise.all([
        api.getMySavedPosts(token),
        api.getMe(token),
        api.getMyLikes(token).catch(() => ({ likedPostIds: [] })),
      ]);

      setPosts(savedPostsData);
      setCurrentUserId(meData.userId);
      setLikedPosts(new Set(likesData.likedPostIds));
    } catch (err) {
      console.error('Failed to load saved posts', err);
    } finally {
      setLoading(false);
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

  const handleUnsave = async (postId: string) => {
    const token = getToken();
    if (!token) return;

    try {
      await api.unsavePost(token, postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error('Failed to unsave post', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Saved Posts</h1>
              <p className="text-blue-100 text-sm">Your bookmarked posts ({posts.length})</p>
            </div>
          </div>
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No saved posts yet</h2>
            <p className="text-gray-600 mb-6">Start saving posts to read them later</p>
            <button
              onClick={() => router.push('/feed')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer font-medium"
            >
              Go to Feed
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6">
                <div className="flex items-start gap-3">
                  <a href={`/user/${post.author.username}`} className="flex-shrink-0 cursor-pointer">
                    {post.author.avatarUrl ? (
                      <img
                        src={post.author.avatarUrl}
                        alt={post.author.displayName}
                        className="w-12 h-12 rounded-full object-cover hover:opacity-80 transition"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg hover:scale-105 transition">
                        {post.author.displayName[0].toUpperCase()}
                      </div>
                    )}
                  </a>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
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
                    </div>
                    <div className="text-gray-800 mb-4 leading-relaxed">{parseMultilineText(post.content)}</div>
                    <div className="flex items-center gap-3">
                      {/* Like Button */}
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition cursor-pointer ${
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
                        <span className="text-sm font-medium">{post.likesCount ?? 0}</span>
                      </button>
                      {/* View Post Button */}
                      <a
                        href={`/post/${post.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition cursor-pointer"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h8M8 14h5m5 0V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11l4-3h8a2 2 0 002-2z" />
                        </svg>
                        <span className="text-sm font-medium">{post.commentsCount ?? 0}</span>
                      </a>
                      {/* Remove Button */}
                      <button
                        onClick={() => handleUnsave(post.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition cursor-pointer ml-auto"
                        title="Remove from saved"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        <span className="text-sm font-medium">Saved</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

