'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getToken, clearToken } from '@/lib/auth';
import { parseMultilineText } from '@/utils/text-parser';
import { AppHeader } from '@/components/AppHeader';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    try {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const [postData, commentsData, meData, likesData] = await Promise.all([
        api.findById(postId),
        api.getComments(postId),
        api.getMe(token),
        api.getMyLikes(token).catch(() => ({ likedPostIds: [] })),
      ]);

      setPost(postData);
      setComments(commentsData);
      setCurrentUserId(meData.userId);
      setLiked(likesData.likedPostIds.includes(postId));
    } catch (error) {
      console.error('Failed to load post:', error);
      router.push('/feed');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    const token = getToken();
    if (!token) return;

    try {
      if (liked) {
        await api.unlikePost(token, postId);
        setPost((prev: any) => ({ ...prev, likesCount: Math.max((prev.likesCount || 1) - 1, 0) }));
        setLiked(false);
      } else {
        await api.likePost(token, postId);
        setPost((prev: any) => ({ ...prev, likesCount: (prev.likesCount || 0) + 1 }));
        setLiked(true);
      }
    } catch (err) {
      console.error('Failed to toggle like', err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token || !newComment.trim()) return;

    try {
      const created = await api.addComment(token, postId, newComment.trim(), replyTo?.id);
      setComments((prev) => [...prev, created]);
      setNewComment('');
      setReplyTo(null);
      setPost((prev: any) => ({ ...prev, commentsCount: (prev.commentsCount || 0) + 1 }));
    } catch (err) {
      console.error('Failed to add comment', err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const token = getToken();
    if (!token) return;

    try {
      await api.deleteComment(token, postId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setPost((prev: any) => ({ ...prev, commentsCount: Math.max((prev.commentsCount || 1) - 1, 0) }));
    } catch (err) {
      console.error('Failed to delete comment', err);
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
      return new Date(iso).toLocaleDateString();
    } catch {
      return iso;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <p className="text-gray-600">Post not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Post */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <a href={`/user/${post.author.username}`} className="flex-shrink-0">
              {post.author.avatarUrl ? (
                <img
                  src={post.author.avatarUrl}
                  alt={post.author.displayName}
                  className="w-14 h-14 rounded-full object-cover"
                />
              ) : (
                <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  {post.author.displayName[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </a>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <a href={`/user/${post.author.username}`} className="font-bold text-lg text-gray-900 hover:text-blue-600">
                  {post.author.displayName}
                </a>
                <a href={`/user/${post.author.username}`} className="text-gray-500">
                  @{post.author.username}
                </a>
              </div>
              <p className="text-gray-500 text-sm">{formatTimeAgo(post.createdAt)}</p>
              <div className="mt-4 text-gray-800 text-lg leading-relaxed">
                {parseMultilineText(post.content)}
              </div>
              <div className="mt-6 flex items-center gap-6 pt-4 border-t border-gray-200">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition ${
                    liked ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <svg
                    className="w-6 h-6"
                    fill={liked ? 'currentColor' : 'none'}
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
                  <span className="font-semibold">{post.likesCount || 0}</span>
                </button>
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h8M8 14h5m5 0V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11l4-3h8a2 2 0 002-2z"
                    />
                  </svg>
                  <span className="font-semibold">{post.commentsCount || 0} comments</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comment Form */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h3 className="font-bold text-lg text-gray-900 mb-4">
            {replyTo ? `Replying to ${replyTo.author?.displayName}` : 'Add a comment'}
          </h3>
          {replyTo && (
            <div className="mb-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  Replying to <span className="font-semibold">{replyTo.author?.displayName}</span>
                </span>
                <button onClick={() => setReplyTo(null)} className="text-sm text-blue-600 hover:text-blue-700">
                  Cancel
                </button>
              </div>
            </div>
          )}
          <form onSubmit={handleAddComment} className="flex gap-3">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
            >
              Post
            </button>
          </form>
        </div>

        {/* Comments */}
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className={`bg-white rounded-xl shadow p-6 ${comment.parent ? 'ml-12' : ''}`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-semibold">
                  {comment.author?.displayName?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{comment.author?.displayName || 'User'}</span>
                    <span className="text-sm text-gray-500">{formatTimeAgo(comment.createdAt)}</span>
                  </div>
                  <div className="mt-2 text-gray-800">{parseMultilineText(comment.content)}</div>
                  <div className="mt-2 flex items-center gap-4">
                    <button
                      onClick={() => setReplyTo(comment)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Reply
                    </button>
                    {comment.author?.id === currentUserId && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
