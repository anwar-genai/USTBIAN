'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const meData = await api.getMe(token);
      const userData = await api.getUserById(token, meData.userId);
      setUser(userData);
      setDisplayName(userData.displayName);
      setBio(userData.bio || '');
      setAvatarUrl(userData.avatarUrl || '');
    } catch (err) {
      console.error('Failed to load profile', err);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    const token = getToken();
    if (!token) return;

    setSaving(true);
    try {
      await api.updateUser(token, user.id, {
        displayName,
        bio,
        avatarUrl: avatarUrl || undefined,
      });
      await loadProfile();
      setEditing(false);
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setSaving(false);
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
          <Link href="/feed" className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition">
            Ustbian
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-semibold mb-4">
              {user.displayName[0].toUpperCase()}
            </div>
            {!editing && (
              <>
                <h1 className="text-2xl font-bold text-gray-900">{user.displayName}</h1>
                <p className="text-gray-600">@{user.username}</p>
              </>
            )}
          </div>

          {editing ? (
            /* Edit Mode */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  maxLength={160}
                  placeholder="Tell us about yourself..."
                />
                <p className="text-xs text-gray-500 mt-1">{bio.length}/160</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Avatar URL (optional)
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setDisplayName(user.displayName);
                    setBio(user.bio || '');
                    setAvatarUrl(user.avatarUrl || '');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* View Mode */
            <div className="space-y-4">
              {user.bio && (
                <div className="text-center">
                  <p className="text-gray-700">{user.bio}</p>
                </div>
              )}

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Email:</span>
                  <span className="text-gray-900">{user.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Username:</span>
                  <span className="text-gray-900">@{user.username}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Joined:</span>
                  <span className="text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setEditing(true)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium transition mt-6"
              >
                Edit Profile
              </button>

              <Link
                href="/feed"
                className="block text-center w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 font-medium transition"
              >
                Back to Feed
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

