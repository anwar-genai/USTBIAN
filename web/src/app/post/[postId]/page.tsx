'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { getSocket } from '@/lib/socket';

// Rolling counter animation component
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

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.postId as string;

  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [likedByMe, setLikedByMe] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deletePostConfirm, setDeletePostConfirm] = useState(false);
  const [editingPost, setEditingPost] = useState(false);
  const [editPostContent, setEditPostContent] = useState('');
  const commentInputRef = useRef<HTMLInputElement | null>(null);
  const deletedCommentIdsRef = useRef<Set<string>>(new Set());

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

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toISOString().slice(0, 16).replace('T', ' ');
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
      socket.removeAllListeners();
    };
  }, [postId]);

  const loadData = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const [postData, meData, likesData, commentsData] = await Promise.all([
        api.getPosts(token).then((posts: any[]) => posts.find((p) => p.id === postId)),
        api.getMe(token),
        api.getMyLikes(token).catch(() => ({ likedPostIds: [] })),
        api.getComments(postId, 100, 0),
      ]);

      if (!postData) {
        router.push('/feed');
        return;
      }

      setPost(postData);
      setCurrentUserId(meData.userId);
      setLikedByMe(likesData.likedPostIds.includes(postId));
      setComments(commentsData);
    } catch (err) {
      console.error('Failed to load post', err);
      router.push('/feed');
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

      socket.on('post.like.added', (data: { postId: string; userId: string }) => {
        if (data.postId !== postId) return;
        if (data.userId === myUserId) return;
        setPost((prev: any) => (prev ? { ...prev, likesCount: (prev.likesCount || 0) + 1 } : prev));
      });

      socket.on('post.like.removed', (data: { postId: string; userId: string }) => {
        if (data.postId !== postId) return;
        if (data.userId === myUserId) return;
        setPost((prev: any) => (prev ? { ...prev, likesCount: Math.max((prev.likesCount || 1) - 1, 0) } : prev));
      });

      socket.on(`comment.added.${postId}`, (comment: any) => {
        if (comment?.author?.id && comment.author.id === myUserId) return;
        setComments((prev) => dedupeById([...prev, comment]));
        setPost((prev: any) => (prev ? { ...prev, commentsCount: (prev.commentsCount || 0) + 1 } : prev));
      });

      socket.on(`comment.deleted.${postId}`, (data: { commentId: string }) => {
        if (deletedCommentIdsRef.current.has(data.commentId)) {
          deletedCommentIdsRef.current.delete(data.commentId);
          return;
        }
        setComments((prev) => prev.filter((c) => c.id !== data.commentId));
        setPost((prev: any) => (prev ? { ...prev, commentsCount: Math.max((prev.commentsCount || 1) - 1, 0) } : prev));
      });
    } catch (err) {
      console.error('Failed to setup realtime listeners', err);
    }
  };

  const handleLike = async () => {
    const token = getToken();
    if (!token) return;

    try {
      if (likedByMe) {
        await api.unlikePost(token, postId);
        setLikedByMe(false);
        setPost((prev: any) => (prev ? { ...prev, likesCount: Math.max((prev.likesCount || 1) - 1, 0) } : prev));
      } else {
        await api.likePost(token, postId);
        setLikedByMe(true);
        setPost((prev: any) => (prev ? { ...prev, likesCount: (prev.likesCount || 0) + 1 } : prev));
      }
    } catch (err) {
      console.error('Failed to toggle like', err);
    }
  };

  const handleAddComment = async () => {
    const token = getToken();
    if (!token || !newComment.trim()) return;

    try {
      const parentId = replyTo?.id as string | undefined;
      const created = await api.addComment(token, postId, newComment, parentId);
      setComments((prev) => dedupeById([...prev, created]));
      setNewComment('');
      setReplyTo(null);
      setPost((prev: any) => (prev ? { ...prev, commentsCount: (prev.commentsCount || 0) + 1 } : prev));
    } catch (err) {
      console.error('Failed to add comment', err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const token = getToken();
    if (!token) return;

    try {
      deletedCommentIdsRef.current.add(commentId);
      await api.deleteComment(token, postId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setPost((prev: any) => (prev ? { ...prev, commentsCount: Math.max((prev.commentsCount || 1) - 1, 0) } : prev));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete comment', err);
      setDeleteConfirm(null);
    }
  };

  const handleEditPost = () => {
    setEditingPost(true);
    setEditPostContent(post.content);
  };

  const handleSavePost = async () => {
    const token = getToken();
    if (!token || !editPostContent.trim()) return;

    try {
      await api.updatePost(token, postId, editPostContent);
      setPost((prev: any) => (prev ? { ...prev, content: editPostContent } : prev));
      setEditingPost(false);
      setEditPostContent('');
    } catch (err) {
      console.error('Failed to update post', err);
    }
  };

  const handleDeletePost = async () => {
    const token = getToken();
    if (!token) return;

    try {
      await api.deletePost(token, postId);
      router.push('/feed');
    } catch (err) {
      console.error('Failed to delete post', err);
      setDeletePostConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => router.push('/feed')}
            className="p-2 hover:bg-gray-100 rounded-full transition cursor-pointer"
            title="Back to feed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900">Post</h1>
        </div>
      </header>

      {/* Post Detail */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start gap-3">
            {post.author.avatarUrl ? (
              <img
                src={post.author.avatarUrl}
                alt={post.author.displayName}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {post.author.displayName[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-gray-900">{post.author.displayName}</span>
                  <span className="text-gray-500 text-sm">@{post.author.username}</span>
                  <span className="text-gray-400 text-xs">· {formatTimeAgo(post.createdAt)}</span>
                </div>
                {post.author.id === currentUserId && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleEditPost}
                      className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition cursor-pointer"
                      title="Edit post"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeletePostConfirm(true)}
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
              {editingPost ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={editPostContent}
                    onChange={(e) => setEditPostContent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    maxLength={500}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSavePost}
                      disabled={!editPostContent.trim()}
                      className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingPost(false);
                        setEditPostContent('');
                      }}
                      className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition cursor-pointer text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-800 mt-3 text-lg whitespace-pre-wrap">{post.content}</p>
              )}
              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-4">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition cursor-pointer ${
                    likedByMe ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <svg className="w-5 h-5" fill={likedByMe ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <RollingCounter value={post.likesCount ?? 0} />
                </button>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h8M8 14h5m5 0V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11l4-3h8a2 2 0 002-2z" />
                  </svg>
                  <RollingCounter value={post.commentsCount ?? 0} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Comments</h2>

          {/* Reply indicator */}
          {replyTo && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border-l-4 border-blue-500 rounded mb-3">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span className="text-xs text-gray-700">
                Replying to <span className="font-semibold text-blue-700">{replyTo.author?.displayName || 'User'}</span>
              </span>
              <button
                onClick={() => setReplyTo(null)}
                className="ml-auto text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Comment input */}
          <div className="flex gap-2 mb-6">
            <input
              ref={commentInputRef}
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={replyTo ? `Reply to ${replyTo.author?.displayName}...` : "Write a comment..."}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (newComment.trim()) {
                    handleAddComment();
                  }
                }
              }}
            />
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title={replyTo ? 'Send reply' : 'Send comment'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>

          {/* Comments list */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No comments yet. Be the first to comment!</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className={`flex items-start gap-2 ${c.parent ? 'pl-8 border-l-2 border-gray-200' : ''}`}>
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-semibold flex-shrink-0">
                    {c.author?.displayName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{c.author?.displayName || 'User'}</span>
                      <span className="text-xs text-gray-500">{formatDate(c.createdAt)}</span>
                    </div>
                    <p className="text-gray-800 text-sm mt-1 whitespace-pre-wrap break-words">{c.content}</p>
                    <div className="mt-1 flex items-center gap-3">
                      <button
                        onClick={() => {
                          setReplyTo(c);
                          setTimeout(() => {
                            commentInputRef.current?.focus();
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
                          onClick={() => setDeleteConfirm(c.id)}
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
              ))
            )}
          </div>
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
                  onClick={() => handleDeleteComment(deleteConfirm)}
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
                  onClick={() => setDeletePostConfirm(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePost}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition cursor-pointer"
                >
                  Delete Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

