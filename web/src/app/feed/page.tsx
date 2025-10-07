'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getToken, clearToken } from '@/lib/auth';

interface Post {
  id: string;
  content: string;
  mediaUrls?: string[];
  author: {
    id: string;
    username: string;
    displayName: string;
  };
  createdAt: string;
}

export default function FeedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    loadPosts();
  }, [router]);

  const loadPosts = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const data = await api.getPosts(token);
      setPosts(data);
    } catch (err) {
      console.error('Failed to load posts', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    const token = getToken();
    if (!token) return;

    setPosting(true);
    try {
      await api.createPost(token, newPost);
      setNewPost('');
      await loadPosts();
    } catch (err) {
      console.error('Failed to create post', err);
    } finally {
      setPosting(false);
    }
  };

  const handleLogout = () => {
    clearToken();
    router.push('/login');
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
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Ustbian</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Create Post */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <form onSubmit={handleCreatePost}>
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              maxLength={500}
            />
            <div className="mt-3 flex justify-between items-center">
              <span className="text-sm text-gray-500">{newPost.length}/500</span>
              <button
                type="submit"
                disabled={posting || !newPost.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
              >
                {posting ? 'Posting...' : 'Post'}
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
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {post.author.displayName[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{post.author.displayName}</span>
                      <span className="text-gray-500 text-sm">@{post.author.username}</span>
                    </div>
                    <p className="text-gray-800 mt-2">{post.content}</p>
                    <div className="mt-3 text-sm text-gray-500">
                      {new Date(post.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

