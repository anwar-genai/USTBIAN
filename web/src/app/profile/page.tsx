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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

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

      // Load followers and following
      const [followers, following] = await Promise.all([
        api.getFollowers(token, meData.userId),
        api.getFollowing(token, meData.userId),
      ]);
      setFollowersCount(followers.length);
      setFollowingCount(following.length);
    } catch (err) {
      console.error('Failed to load profile', err);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setSelectedFile(f);
      setPreviewUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(f);
      });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const f = files[0];
      setSelectedFile(f);
      setPreviewUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(f);
      });
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleSave = async () => {
    if (!user) return;
    const token = getToken();
    if (!token) return;

    setSaving(true);
    try {
      let finalAvatarUrl = avatarUrl;

      // Upload avatar if file is selected
      if (selectedFile) {
        setUploading(true);
        const uploadResult = await api.uploadAvatar(token, selectedFile);
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        finalAvatarUrl = `${API_URL}${uploadResult.url}`;
        setUploading(false);
      }

      await api.updateUser(token, user.id, {
        displayName,
        bio,
        avatarUrl: finalAvatarUrl || undefined,
      });
      
      setSelectedFile(null);
      setPreviewUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return null;
      });
      await loadProfile();
      setEditing(false);
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setSaving(false);
      setUploading(false);
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
          {/* Avatar with live preview when editing */}
          <div className="flex flex-col items-center mb-6">
            {(() => {
              const displayAvatar = editing ? (previewUrl || user.avatarUrl) : user.avatarUrl;
              if (displayAvatar) {
                return (
                  <img
                    src={displayAvatar}
                    alt={user.displayName}
                    className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-gray-200"
                  />
                );
              }
              return (
                <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-semibold mb-4">
                  {user.displayName[0].toUpperCase()}
                </div>
              );
            })()}
            {!editing && (
              <>
                <h1 className="text-2xl font-bold text-gray-900">{user.displayName}</h1>
                <p className="text-gray-600">@{user.username}</p>
              </>
            )}
          </div>

          {/* Followers/Following Stats */}
          {!editing && (
            <div className="flex justify-center gap-8 mb-6 border-t border-b border-gray-200 py-4">
              <Link href={`/user/${user.username}/followers`} className="text-center hover:bg-gray-50 -m-2 p-2 rounded transition cursor-pointer">
                <p className="text-2xl font-bold text-gray-900">{followersCount}</p>
                <p className="text-sm text-gray-600">Followers</p>
              </Link>
              <Link href={`/user/${user.username}/following`} className="text-center hover:bg-gray-50 -m-2 p-2 rounded transition cursor-pointer">
                <p className="text-2xl font-bold text-gray-900">{followingCount}</p>
                <p className="text-sm text-gray-600">Following</p>
              </Link>
            </div>
          )}

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
                  Profile Image
                </label>
                {/* Dropzone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative flex flex-col items-center justify-center w-full rounded-lg border-2 ${
                    isDragging ? 'border-blue-500' : 'border-dashed border-gray-300'
                  } bg-white text-gray-600 transition-colors px-4 py-6`}
                >
                  <input
                    id="avatar-file"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="pointer-events-none text-center">
                    <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mt-2 text-sm">
                      <span className="font-medium text-blue-600 underline cursor-pointer">Click to choose</span> or drag & drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF, WebP (max 5MB)</p>
                  </div>
                </div>
                {/* Preview */}
                {selectedFile && (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden border">
                      <img
                        src={URL.createObjectURL(selectedFile)}
                        alt="preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-sm text-gray-800 truncate max-w-[220px]">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving || uploading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition cursor-pointer disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setDisplayName(user.displayName);
                    setBio(user.bio || '');
                    setAvatarUrl(user.avatarUrl || '');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 font-medium transition cursor-pointer"
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
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium transition mt-6 cursor-pointer"
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

