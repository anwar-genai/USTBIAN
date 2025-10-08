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

  useEffect(() => {
    loadUserProfile();
  }, [username]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/feed" className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition">
            Ustbian
          </Link>
          <div className="flex items-center gap-4">
            {!isOwnProfile && (
              <Link href="/profile" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                My Profile
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Logout
            </button>
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

