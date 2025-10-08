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

export default function FollowingPage() {
  const router = useRouter();
  const params = useParams();
  const username = params?.username as string;

  const [user, setUser] = useState<User | null>(null);
  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFollowing();
  }, [username]);

  const loadFollowing = async () => {
    try {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      // Get user info
      const searchResults = await api.searchUsers(token, username, 1);
      const foundUser = searchResults.find((u: User) => u.username === username);

      if (!foundUser) {
        alert('User not found');
        router.push('/feed');
        return;
      }

      setUser(foundUser);

      // Load following
      const followingData = await api.getFollowing(token, foundUser.id);
      setFollowing(followingData);
    } catch (err) {
      console.error('Failed to load following', err);
      router.push('/feed');
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/user/${username}`} className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition">
              ← Back to Profile
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/feed" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
              Feed
            </Link>
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
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              {following.length} Following
            </h1>
            <p className="text-gray-600 mt-1">
              People <span className="font-semibold">{user.displayName}</span> is following
            </p>
          </div>

          {/* Following List */}
          <div className="divide-y divide-gray-200">
            {following.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-lg font-medium">Not following anyone yet</p>
                <p className="text-sm">When {user.displayName} follows people, they'll appear here.</p>
              </div>
            ) : (
              following.map((followedUser) => (
                <div key={followedUser.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-center gap-4">
                    <Link href={`/user/${followedUser.username}`} className="flex-shrink-0">
                      {followedUser.avatarUrl ? (
                        <img
                          src={followedUser.avatarUrl}
                          alt={followedUser.displayName}
                          className="w-12 h-12 rounded-full object-cover hover:opacity-80 transition"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold hover:bg-blue-700 transition">
                          {followedUser.displayName[0].toUpperCase()}
                        </div>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link 
                        href={`/user/${followedUser.username}`}
                        className="block hover:bg-gray-50 -m-2 p-2 rounded transition"
                      >
                        <p className="font-semibold text-gray-900 truncate">{followedUser.displayName}</p>
                        <p className="text-sm text-gray-600 truncate">@{followedUser.username}</p>
                        {followedUser.bio && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{followedUser.bio}</p>
                        )}
                      </Link>
                    </div>
                    <div className="flex-shrink-0">
                      <Link
                        href={`/user/${followedUser.username}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
