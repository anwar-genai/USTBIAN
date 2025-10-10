'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { getToken, clearToken } from '@/lib/auth';
import { NotificationBell } from './NotificationBell';

interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const profileTriggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const meData = await api.getMe(token);
      const userData = await api.getUserById(token, meData.userId);
      setCurrentUser(userData);
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      const token = getToken();
      if (!token) return;

      setSearching(true);
      try {
        const results = await api.searchUsers(token, query);
        setSearchResults(results);
      } catch (err) {
        console.error('Failed to search users', err);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleLogout = () => {
    clearToken();
    router.push('/login');
  };

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      if (showProfileMenu && !target.closest('.profile-dropdown') && !target.closest('.profile-menu-trigger')) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu]);

  // Keyboard handling
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showProfileMenu) {
          setShowProfileMenu(false);
          profileTriggerRef.current?.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showProfileMenu]);

  // Get page title based on current path
  const getPageTitle = () => {
    if (pathname === '/feed') return 'Feed';
    if (pathname === '/profile') return 'Profile';
    if (pathname?.startsWith('/hashtag/')) {
      const tag = pathname.split('/').pop();
      return `#${tag}`;
    }
    if (pathname?.startsWith('/post/')) return 'Post';
    if (pathname?.startsWith('/user/')) {
      const username = pathname.split('/').pop();
      return `@${username}`;
    }
    return 'Ustbian';
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left: Logo and Page Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/feed')}
            className="flex items-center gap-2 hover:opacity-80 transition cursor-pointer"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">U</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 hidden sm:block">Ustbian</h1>
          </button>
          
          <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
          
          <span className="text-lg font-semibold text-gray-700">{getPageTitle()}</span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSearch((v) => !v);
                setShowProfileMenu(false);
              }}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition"
              title="Search users"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {showSearch && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto">
                <div className="p-3 border-b border-gray-200">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search users..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
                {searching ? (
                  <div className="p-4 text-center text-gray-500">Searching...</div>
                ) : searchResults.length === 0 && searchQuery.trim() ? (
                  <div className="p-4 text-center text-gray-500">No users found</div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">Type to search users</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {searchResults.map((user: any) => (
                      <a
                        key={user.id}
                        href={`/user/${user.username}`}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 transition"
                        onClick={() => {
                          setShowSearch(false);
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                      >
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.displayName} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {user.displayName[0].toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{user.displayName}</p>
                          <p className="text-sm text-gray-600 truncate">@{user.username}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notifications */}
          <NotificationBell />

          {/* Profile Menu */}
          <div className="relative">
            <button
              ref={profileTriggerRef}
              onClick={() => setShowProfileMenu((v) => !v)}
              className="profile-menu-trigger focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
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

            {showProfileMenu && (
              <div
                ref={profileMenuRef}
                className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 profile-dropdown"
              >
                <div className="p-3 border-b border-gray-200 flex items-center gap-3">
                  {currentUser?.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {currentUser?.displayName?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{currentUser?.displayName}</p>
                    <p className="text-xs text-gray-600 truncate">@{currentUser?.username}</p>
                  </div>
                </div>
                <div className="py-1">
                  <a
                    href="/profile"
                    className="block px-3 py-2 text-gray-700 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      View Profile
                    </div>
                  </a>
                  <a
                    href="/feed"
                    className="block px-3 py-2 text-gray-700 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      Feed
                    </div>
                  </a>
                  <a
                    href="/saved"
                    className="block px-3 py-2 text-gray-700 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      Saved Posts
                    </div>
                  </a>
                  <button
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
  );
}

