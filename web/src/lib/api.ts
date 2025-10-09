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

  async getPosts(token?: string, limit = 20, offset = 0) {
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${API_URL}/posts?limit=${limit}&offset=${offset}`, { headers });
    if (!res.ok) throw new Error('Failed to fetch posts');
    return res.json();
  },

  async findById(postId: string) {
    const res = await fetch(`${API_URL}/posts/${postId}`);
    if (!res.ok) throw new Error('Failed to fetch post');
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

  async updatePost(token: string, postId: string, content: string, mediaUrls?: string[]) {
    const res = await fetch(`${API_URL}/posts/${postId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content, mediaUrls }),
    });
    if (!res.ok) throw new Error('Failed to update post');
    return res.json();
  },

  async deletePost(token: string, postId: string) {
    const res = await fetch(`${API_URL}/posts/${postId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to delete post');
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

  async getUserById(token: string, userId: string) {
    const res = await fetch(`${API_URL}/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  },

  async updateUser(token: string, userId: string, data: { displayName?: string; bio?: string; avatarUrl?: string }) {
    const res = await fetch(`${API_URL}/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update user');
    return res.json();
  },

  async markAllNotificationsAsRead(token: string) {
    const res = await fetch(`${API_URL}/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to mark all notifications as read');
    return res.json();
  },

  async uploadAvatar(token: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_URL}/uploads/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload avatar');
    return res.json();
  },

  // Comments
  async getComments(postId: string, limit = 50, offset = 0) {
    const res = await fetch(`${API_URL}/posts/${postId}/comments?limit=${limit}&offset=${offset}`);
    if (!res.ok) throw new Error('Failed to fetch comments');
    return res.json();
  },

  async addComment(token: string, postId: string, content: string, parentId?: string) {
    const res = await fetch(`${API_URL}/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content, parentId }),
    });
    if (!res.ok) throw new Error('Failed to add comment');
    return res.json();
  },

  async deleteComment(token: string, postId: string, commentId: string) {
    const res = await fetch(`${API_URL}/posts/${postId}/comments/${commentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to delete comment');
    return res.json();
  },

  // User search
  async searchUsers(token: string, query: string, limit = 20) {
    const res = await fetch(`${API_URL}/users/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to search users');
    return res.json();
  },

  // Followers/Following
  async getFollowers(token: string, userId: string) {
    const res = await fetch(`${API_URL}/users/${userId}/follow/followers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch followers');
    return res.json();
  },

  async getFollowing(token: string, userId: string) {
    const res = await fetch(`${API_URL}/users/${userId}/follow/following`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch following');
    return res.json();
  },

  // AI Features
  async generateText(token: string, prompt: string, maxLength?: number) {
    const res = await fetch(`${API_URL}/ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ prompt, maxLength }),
    });
    if (!res.ok) throw new Error('Failed to generate text');
    return res.json();
  },

  async enhanceText(token: string, text: string, tone?: 'professional' | 'casual' | 'friendly' | 'humorous', maxLength?: number) {
    const res = await fetch(`${API_URL}/ai/enhance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text, tone, maxLength }),
    });
    if (!res.ok) throw new Error('Failed to enhance text');
    return res.json();
  },

  async shortenText(token: string, text: string, targetLength: number) {
    const res = await fetch(`${API_URL}/ai/shorten`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text, targetLength }),
    });
    if (!res.ok) throw new Error('Failed to shorten text');
    return res.json();
  },

  async checkAIStatus(token: string) {
    const res = await fetch(`${API_URL}/ai/status`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to check AI status');
    return res.json();
  },

  // Hashtag search
  async searchByHashtag(tag: string) {
    const res = await fetch(`${API_URL}/posts/hashtag/${encodeURIComponent(tag)}`);
    if (!res.ok) throw new Error('Failed to search by hashtag');
    return res.json();
  },
};

