'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getToken, clearToken } from '@/lib/auth';
import { getSocket } from '@/lib/socket';

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

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

      const [postsData, meData, notificationsData, likesData] = await Promise.all([
        api.getPosts(token),
        api.getMe(token),
        api.getNotifications(token).catch(() => []),
        api.getMyLikes(token).catch(() => ({ likedPostIds: [] })),
      ]);

      // Fetch full user profile
      const userData = await api.getUserById(token, meData.userId);

      setPosts(postsData);
      setCurrentUserId(meData.userId);
      setCurrentUser(userData);
      setNotifications(notificationsData);
      setLikedPosts(new Set(likesData.likedPostIds));
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeListeners = async () => {
    const socket = getSocket();
    
    // Remove any existing listeners first to prevent duplicates
    socket.removeAllListeners();

    socket.on('post.like.added', (data: { postId: string; userId: string }) => {
      console.log('Like added:', data);
      // Refresh posts to show updated like count if needed
    });

    socket.on('post.like.removed', (data: { postId: string; userId: string }) => {
      console.log('Like removed:', data);
    });

    const token = getToken();
    if (token) {
      try {
        const me = await api.getMe(token);
        
        // Listen for new notifications (prevent duplicates by checking if already exists)
        socket.on(`notification.${me.userId}`, (notification: Notification) => {
          console.log('New notification received:', notification);
          setNotifications((prev) => {
            // Check if notification already exists to prevent duplicates
            if (prev.some((n) => n.id === notification.id)) {
              return prev;
            }
            return [notification, ...prev];
          });
        });

        // Listen for deleted notifications
        socket.on(`notification.deleted.${me.userId}`, (data: any) => {
          console.log('Notification deletion event received:', data);
          const notifId = data?.notificationId || data?.id;
          if (notifId) {
            console.log('Deleting notification with ID:', notifId);
            setNotifications((prev) => prev.filter((n) => n.id !== notifId));
          } else {
            console.error('No notificationId found in deletion event:', data);
          }
        });
        
        setCurrentUserId(me.userId);
      } catch (err) {
        console.error('Failed to setup realtime listeners', err);
      }
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
      await loadData();
    } catch (err) {
      console.error('Failed to create post', err);
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
      } else {
        await api.likePost(token, postId);
        setLikedPosts((prev) => new Set(prev).add(postId));
      }
    } catch (err) {
      console.error('Failed to toggle like', err);
    }
  };

  const handleLogout = () => {
    clearToken();
    router.push('/login');
  };

  const handleNotificationClick = async (notificationId: string) => {
    const token = getToken();
    if (!token) return;

    try {
      await api.markNotificationAsRead(token, notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    const token = getToken();
    if (!token) return;

    setMarkingAllRead(true);
    try {
      await api.markAllNotificationsAsRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    } finally {
      setMarkingAllRead(false);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      if (showNotifications && !target.closest('.notifications-dropdown') && !target.closest('.notifications-bell')) {
        setShowNotifications(false);
      }
      
      if (showProfileMenu && !target.closest('.profile-dropdown') && !target.closest('.profile-menu-trigger')) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications, showProfileMenu]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Ustbian</h1>
          <div className="flex items-center gap-4">
            {/* Notifications Bell */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:text-gray-900 transition notifications-bell"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Profile Menu */}
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="profile-menu-trigger"
            >
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  className="w-9 h-9 rounded-full object-cover border-2 border-gray-300 hover:border-blue-500 transition"
                />
              ) : (
                <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold hover:bg-blue-700 transition">
                  {currentUser?.displayName?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Notifications Dropdown */}
        {showNotifications && (
          <div className="absolute right-16 top-14 w-80 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto notifications-dropdown">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={markingAllRead}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                >
                  {markingAllRead ? 'Marking...' : 'Mark all read'}
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No notifications</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif.id)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition ${!notif.read ? 'bg-blue-50' : ''}`}
                  >
                    <p className="text-sm text-gray-800">{notif.message || notif.type}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notif.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Menu Dropdown */}
        {showProfileMenu && (
          <div className="absolute right-4 top-14 w-56 bg-white rounded-lg shadow-lg border border-gray-200 profile-dropdown">
            <div className="p-4 border-b border-gray-200">
              <p className="font-semibold text-gray-900">{currentUser?.displayName}</p>
              <p className="text-sm text-gray-600">@{currentUser?.username}</p>
            </div>
            <div className="py-2">
              <a
                href="/profile"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  View Profile
                </div>
              </a>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Logout
                </div>
              </button>
            </div>
          </div>
        )}
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
                  {post.author.avatarUrl ? (
                    <img
                      src={post.author.avatarUrl}
                      alt={post.author.displayName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {post.author.displayName[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{post.author.displayName}</span>
                      <span className="text-gray-500 text-sm">@{post.author.username}</span>
                    </div>
                    <p className="text-gray-800 mt-2 whitespace-pre-wrap">{post.content}</p>
                    <div className="mt-4 flex items-center gap-4">
                      {/* Like Button */}
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition ${
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
                        <span className="text-sm font-medium">
                          {likedPosts.has(post.id) ? 'Liked' : 'Like'}
                        </span>
                      </button>
                      <span className="text-sm text-gray-500">
                        {new Date(post.createdAt).toLocaleString()}
                      </span>
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
