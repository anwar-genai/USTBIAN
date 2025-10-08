'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSocket } from '@/lib/socket';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';

export interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  actor?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  metadata?: {
    postId?: string;
    commentId?: string;
    followerId?: string;
    followerUsername?: string;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.getNotifications(token);
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark a notification as read
  const markAsRead = async (notificationId: string) => {
    const token = getToken();
    if (!token) return;

    try {
      await api.markNotificationAsRead(token, notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    const token = getToken();
    if (!token) return;

    try {
      await api.markAllNotificationsAsRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Setup real-time listeners
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    let cleanup: (() => void) | undefined;

    const setupRealtimeListeners = async () => {
      try {
        const me = await api.getMe(token);
        setCurrentUserId(me.userId);

        const socket = getSocket();

        // Remove any existing listeners first to prevent duplicates
        socket.off(`notification.${me.userId}`);
        socket.off(`notification.deleted.${me.userId}`);

        // Listen for new notifications
        const handleNewNotification = (notification: Notification) => {
          setNotifications((prev) => {
            // Check if notification already exists
            if (prev.some((n) => n.id === notification.id)) {
              return prev; // Skip duplicates
            }
            return [notification, ...prev];
          });
        };

        // Listen for deleted notifications
        const handleDeletedNotification = (data: any) => {
          const notifId = data?.notificationId || data?.id;
          if (notifId) {
            setNotifications((prev) => prev.filter((n) => n.id !== notifId));
          }
        };

        socket.on(`notification.${me.userId}`, handleNewNotification);
        socket.on(`notification.deleted.${me.userId}`, handleDeletedNotification);

        // Return cleanup function
        cleanup = () => {
          socket.off(`notification.${me.userId}`, handleNewNotification);
          socket.off(`notification.deleted.${me.userId}`, handleDeletedNotification);
          console.log('🔌 Cleaned up global notification listeners');
        };
      } catch (error) {
        console.error('❌ Failed to setup global notification listeners:', error);
      }
    };

    setupRealtimeListeners();

    // Cleanup on unmount
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  // Fetch notifications on mount and poll every 30 seconds
  useEffect(() => {
    fetchNotifications();
    
    // Poll for notifications every 30 seconds as a fallback
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, []);


  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
