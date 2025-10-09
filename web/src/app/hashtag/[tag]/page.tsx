'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { parseMultilineText } from '@/utils/text-parser';

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

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const results = await api.searchByHashtag(tag);
        setPosts(results);
      } catch (error) {
        console.error('Failed to load posts:', error);
      } finally {
        setLoading(false);
      }
    };

    if (tag) {
      loadPosts();
    }
  }, [tag]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back</span>
          </button>
          <button
            onClick={() => router.push('/feed')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Go to Feed
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Hashtag Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-2xl text-purple-600 font-bold">#</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">#{tag}</h1>
              <p className="text-gray-600">
                {loading ? 'Loading...' : `${posts.length} ${posts.length === 1 ? 'post' : 'posts'}`}
              </p>
            </div>
          </div>
        </div>

        {/* Posts */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts found</h3>
            <p className="text-gray-600">
              No one has used <span className="font-semibold text-purple-600">#{tag}</span> yet.
            </p>
            <p className="text-gray-600 mt-2">Be the first to use this hashtag!</p>
            <button
              onClick={() => router.push('/feed')}
              className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
            >
              Create a Post
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition cursor-pointer"
                onClick={() => router.push(`/post/${post.id}`)}
              >
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
                        className="w-10 h-10 rounded-full object-cover hover:opacity-80 transition"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold hover:bg-blue-700 transition">
                        {post.author.displayName[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </a>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
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
                    <div className="mt-2 text-gray-800">
                      {parseMultilineText(post.content)}
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{post.likesCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h8M8 14h5m5 0V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11l4-3h8a2 2 0 002-2z" />
                        </svg>
                        <span>{post.commentsCount || 0}</span>
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

