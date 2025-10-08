'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { getToken, clearToken } from '@/lib/auth';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
}

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const username = params?.username as string;

  const [user, setUser] = useState<User | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  useEffect(() => {
    loadUserProfile();
    loadCurrentUserData();
  }, [username]);

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

  // Keyboard: close on Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showNotifications) setShowNotifications(false);
        if (showProfileMenu) setShowProfileMenu(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showNotifications, showProfileMenu]);

  const loadUserProfile = async () => {
    try {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      // Get current user
      const meData = await api.getMe(token);
      setCurrentUserId(meData.userId);

      // Search for user by username
      const searchResults = await api.searchUsers(token, username, 1);
      const foundUser = searchResults.find((u: User) => u.username === username);

      if (!foundUser) {
        alert('User not found');
        router.push('/feed');
        return;
      }

      setUser(foundUser);

      // Load followers and following
      const [followers, following] = await Promise.all([
        api.getFollowers(token, foundUser.id),
        api.getFollowing(token, foundUser.id),
      ]);

      setFollowersCount(followers.length);
      setFollowingCount(following.length);

      // Check if current user is following this user
      const myFollowing = await api.getFollowing(token, meData.userId);
      setIsFollowing(myFollowing.some((u: User) => u.id === foundUser.id));
    } catch (err) {
      console.error('Failed to load user profile', err);
      router.push('/feed');
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUserData = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const [meData, userData, notificationsData] = await Promise.all([
        api.getMe(token),
        api.getUserById(token, meData.userId),
        api.getNotifications(token).catch(() => []),
      ]);

      setCurrentUser(userData);
      setNotifications(notificationsData);
    } catch (err) {
      console.error('Failed to load current user data', err);
    }
  };

  const handleNotificationClick = async (notification: any) => {
    const token = getToken();
    if (!token) return;

    try {
      await api.markNotificationAsRead(token, notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );

      if (notification.type === 'follow' && notification.metadata?.followerUsername) {
        router.push(`/user/${notification.metadata.followerUsername}`);
      } else if (notification.metadata?.postId) {
        router.push(`/post/${notification.metadata.postId}`);
      }
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

  const handleFollowToggle = async () => {
    if (!user) return;
    const token = getToken();
    if (!token) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await api.unfollowUser(token, user.id);
        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(prev - 1, 0));
      } else {
        await api.followUser(token, user.id);
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Failed to toggle follow', err);
    } finally {
      setFollowLoading(false);
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

  if (!user) return null;

  const isOwnProfile = currentUserId === user.id;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/feed" className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition">
            Ustbian
          </Link>
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative">
              <button
                aria-haspopup="menu"
                aria-expanded={showNotifications}
                onClick={() => {
                  setShowNotifications((v) => !v);
                  setShowProfileMenu(false);
                }}
                className="relative p-2 text-gray-600 hover:text-gray-900 transition notifications-bell focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full cursor-pointer"
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

              {showNotifications && (
                <div
                  role="menu"
                  tabIndex={-1}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto notifications-dropdown focus:outline-none"
                >
                  <div className="p-3 border-b border-gray-200 flex items-center justify-between">
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
                        <button
                          key={notif.id}
                          role="menuitem"
                          onClick={() => handleNotificationClick(notif)}
                          className={`w-full text-left p-3 hover:bg-gray-50 cursor-pointer transition ${!notif.read ? 'bg-blue-50' : ''}`}
                        >
                          <p className="text-sm text-gray-800">{notif.message || notif.type}</p>
                          <p className="text-xs text-gray-500 mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div className="relative">
              <button
                aria-haspopup="menu"
                aria-expanded={showProfileMenu}
                onClick={() => {
                  setShowProfileMenu((v) => !v);
                  setShowNotifications(false);
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
                    <Link
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
                    </Link>
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

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-gray-200"
              />
            ) : (
              <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-semibold mb-4">
                {user.displayName[0].toUpperCase()}
              </div>
            )}
            <h1 className="text-2xl font-bold text-gray-900">{user.displayName}</h1>
            <p className="text-gray-600">@{user.username}</p>
          </div>

          {/* Bio */}
          {user.bio && (
            <div className="text-center mb-6">
              <p className="text-gray-700">{user.bio}</p>
            </div>
          )}

          {/* Followers/Following Stats */}
          <div className="flex justify-center gap-8 mb-6 border-t border-b border-gray-200 py-4">
            <Link href={`/user/${username}/followers`} className="text-center hover:bg-gray-50 -m-2 p-2 rounded transition cursor-pointer">
              <p className="text-2xl font-bold text-gray-900">{followersCount}</p>
              <p className="text-sm text-gray-600">Followers</p>
            </Link>
            <Link href={`/user/${username}/following`} className="text-center hover:bg-gray-50 -m-2 p-2 rounded transition cursor-pointer">
              <p className="text-2xl font-bold text-gray-900">{followingCount}</p>
              <p className="text-sm text-gray-600">Following</p>
            </Link>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {isOwnProfile ? (
              <Link
                href="/profile"
                className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium transition"
              >
                Edit Profile
              </Link>
            ) : (
              <button
                onClick={handleFollowToggle}
                disabled={followLoading}
                className={`w-full py-2 px-4 rounded-lg font-medium transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  isFollowing
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {followLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
              </button>
            )}

            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Joined:</span>
                <span className="text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <Link
              href="/feed"
              className="block text-center w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 font-medium transition"
            >
              Back to Feed
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

