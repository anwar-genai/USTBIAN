'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

interface MentionAutocompleteProps {
  show: boolean;
  query: string;
  position: { top: number; left: number };
  onSelect: (username: string) => void;
  onClose: () => void;
}

const MentionAutocompleteComponent = ({
  show,
  query,
  position,
  onSelect,
  onClose,
}: MentionAutocompleteProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show) {
      setUsers([]);
      return;
    }

    // If query is empty (just typed @), show empty state but don't search
    if (!query || query.trim() === '') {
      setUsers([]);
      setLoading(false);
      return;
    }

    const searchUsers = async () => {
      setLoading(true);
      try {
        const token = getToken();
        if (!token) return;

        const results = await api.searchUsers(token, query, 5);
        setUsers(results);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Failed to search users:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchUsers, 200);
    return () => clearTimeout(debounce);
  }, [query, show]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!show) return;

      // Handle Escape even when no users
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Only handle other keys when there are users
      if (users.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % users.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + users.length) % users.length);
          break;
        case 'Enter':
          e.preventDefault();
          e.stopPropagation();
          if (users[selectedIndex]) {
            onSelect(users[selectedIndex].username);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true); // Use capture phase
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [show, users, selectedIndex, onSelect, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (containerRef.current) {
      const selectedElement = containerRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  if (!show) return null;

  return (
    <div
      ref={containerRef}
      className="mention-autocomplete fixed bg-white rounded-lg shadow-xl border border-gray-200 max-h-64 overflow-y-auto z-50"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        minWidth: '250px',
        maxWidth: '350px',
      }}
    >
      {loading ? (
        <div className="p-3 text-center text-gray-500 text-sm">
          <div className="inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
          Searching...
        </div>
      ) : users.length === 0 && query.trim() !== '' ? (
        <div className="p-3 text-center text-gray-500 text-sm">
          No users found
        </div>
      ) : users.length === 0 ? (
        <div className="p-3 text-center text-gray-500 text-sm">
          Type a username to search...
        </div>
      ) : (
        <div className="py-1">
          {users.map((user, index) => (
            <button
              key={user.id}
              type="button"
              onClick={() => onSelect(user.username)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left transition ${
                index === selectedIndex
                  ? 'bg-blue-50 text-blue-900'
                  : 'hover:bg-gray-50 text-gray-900'
              }`}
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {user.displayName[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{user.displayName}</p>
                <p className="text-xs text-gray-600 truncate">@{user.username}</p>
              </div>
              {index === selectedIndex && (
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
      <div className="border-t border-gray-200 px-3 py-2 bg-gray-50 text-xs text-gray-600">
        <div className="flex items-center justify-between">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export const MentionAutocomplete = memo(MentionAutocompleteComponent, (prev, next) => {
  // Only re-render if these props change
  return (
    prev.show === next.show &&
    prev.query === next.query &&
    prev.position.top === next.position.top &&
    prev.position.left === next.position.left
  );
});

MentionAutocomplete.displayName = 'MentionAutocomplete';

