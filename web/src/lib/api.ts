const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface RegisterData {
  email: string;
  username: string;
  displayName: string;
  password: string;
  bio?: string;
}

interface LoginData {
  email: string;
  password: string;
}

export const api = {
  async register(data: RegisterData) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Registration failed');
    return res.json();
  },

  async login(data: LoginData) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },

  async getMe(token: string) {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  },

  async getPosts(token?: string) {
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${API_URL}/posts`, { headers });
    if (!res.ok) throw new Error('Failed to fetch posts');
    return res.json();
  },

  async createPost(token: string, content: string, mediaUrls?: string[]) {
    const res = await fetch(`${API_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content, mediaUrls }),
    });
    if (!res.ok) throw new Error('Failed to create post');
    return res.json();
  },

  async likePost(token: string, postId: string) {
    const res = await fetch(`${API_URL}/posts/${postId}/likes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to like post');
    return res.json();
  },

  async unlikePost(token: string, postId: string) {
    const res = await fetch(`${API_URL}/posts/${postId}/likes`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to unlike post');
    return res.json();
  },

  async followUser(token: string, userId: string) {
    const res = await fetch(`${API_URL}/users/${userId}/follow`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to follow user');
    return res.json();
  },

  async unfollowUser(token: string, userId: string) {
    const res = await fetch(`${API_URL}/users/${userId}/follow`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to unfollow user');
    return res.json();
  },

  async getNotifications(token: string) {
    const res = await fetch(`${API_URL}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  async getMyLikes(token: string) {
    const res = await fetch(`${API_URL}/likes/my`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch likes');
    return res.json();
  },

  async markNotificationAsRead(token: string, notificationId: string) {
    const res = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to mark notification as read');
    return res.json();
  },
};

