'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { parseMultilineText } from '@/utils/text-parser';
import { AppHeader } from '@/components/AppHeader';
import { getSocket } from '@/lib/socket';

interface Post {
  id: string;
  content: string;
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

export default function HashtagPage() {
  const params = useParams();
  const router = useRouter();
  const tag = params.tag as string;
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
    setupRealtimeListeners();

    return () => {
      const socket = getSocket();
      socket.off('post.like.added');
      socket.off('post.like.removed');
    };
  }, [tag]);

  const loadData = async () => {
    try {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const [postsData, meData, likesData] = await Promise.all([
        api.searchByHashtag(tag),
        api.getMe(token),
        api.getMyLikes(token).catch(() => ({ likedPostIds: [] })),
      ]);

      setPosts(postsData);
      setCurrentUserId(meData.userId);
      setLikedPosts(new Set(likesData.likedPostIds));
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeListeners = async () => {
    const socket = getSocket();
    const token = getToken();
    if (!token) return;

    try {
      const me = await api.getMe(token);
      const myUserId = me.userId as string;

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

  const shouldTruncatePost = (content: string): boolean => {
    const lines = content.split('\n');
    return lines.length > 4 || content.length > 200;
  };

  const getTruncatedPost = (content: string): string => {
    const lines = content.split('\n');
    if (lines.length > 4) {
      return lines.slice(0, 4).join('\n');
    }
    if (content.length > 200) {
      return content.substring(0, 200);
    }
    return content;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Hashtag Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg p-8 mb-6 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center border-2 border-white/30">
              <span className="text-4xl font-bold">#</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">#{tag}</h1>
              <p className="text-purple-100">
                {loading ? 'Loading...' : `${posts.length} ${posts.length === 1 ? 'post' : 'posts'} found`}
              </p>
            </div>
          </div>
          <p className="text-purple-100 text-sm">
            Explore all posts tagged with #{tag}
          </p>
        </div>

        {/* Posts */}
        {loading ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <div className="inline-block w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No posts yet</h3>
            <p className="text-gray-600 mb-2">
              Be the first to use <span className="font-semibold text-purple-600">#{tag}</span>!
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Start a conversation and help others discover this topic
            </p>
            <button
              onClick={() => router.push('/feed')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-medium shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create a Post
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl shadow hover:shadow-lg transition-all duration-200">
                <div className="p-6">
                  <div className="flex items-start gap-3">
                    <a
                      href={`/user/${post.author.username}`}
                      className="flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {post.author.avatarUrl ? (
                        <img
                          src={post.author.avatarUrl}
                          alt={post.author.displayName}
                          className="w-12 h-12 rounded-full object-cover hover:ring-4 hover:ring-blue-100 transition"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold hover:ring-4 hover:ring-blue-100 transition">
                          {post.author.displayName[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </a>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <a
                          href={`/user/${post.author.username}`}
                          className="font-semibold text-gray-900 hover:text-blue-600 hover:underline transition"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {post.author.displayName}
                        </a>
                        <a
                          href={`/user/${post.author.username}`}
                          className="text-gray-500 text-sm hover:text-blue-600 transition"
                          onClick={(e) => e.stopPropagation()}
                        >
                          @{post.author.username}
                        </a>
                        <span className="text-gray-400 text-xs">· {formatTimeAgo(post.createdAt)}</span>
                      </div>
                      <div className="mt-3 text-gray-800 leading-relaxed">
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
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2"
                        >
                          {expandedPosts.has(post.id) ? 'Show less' : 'Show more'}
                        </button>
                      )}
                      <div className="mt-4 flex items-center gap-6">
                        {/* Like Button */}
                        <button
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-full transition ${
                            likedPosts.has(post.id)
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <svg
                            className="w-5 h-5"
                            fill={likedPosts.has(post.id) ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                          <span className="font-medium">{post.likesCount || 0}</span>
                        </button>

                        {/* Comment Button */}
                        <button
                          onClick={() => router.push(`/post/${post.id}`)}
                          className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 10h8M8 14h5m5 0V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11l4-3h8a2 2 0 002-2z"
                            />
                          </svg>
                          <span className="font-medium">{post.commentsCount || 0}</span>
                        </button>

                        {/* View Details */}
                        <button
                          onClick={() => router.push(`/post/${post.id}`)}
                          className="ml-auto flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View details
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
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
