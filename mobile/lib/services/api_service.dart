import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';
import '../models/post.dart';

class ApiService {
  static const String baseUrl = 'http://192.168.100.101:3000';

  // Resolve relative URLs (e.g. "/uploads/avatar.jpg") to absolute
  static String resolveUrl(String url) {
    if (url.isEmpty) return url;
    // If it's an absolute URL but points to localhost, rewrite to baseUrl host
    if (url.startsWith('http://') || url.startsWith('https://')) {
      final uri = Uri.tryParse(url);
      final base = Uri.tryParse(baseUrl);
      if (uri != null && base != null) {
        if (uri.host == 'localhost' || uri.host == '127.0.0.1') {
          return Uri(
            scheme: base.scheme,
            host: base.host,
            port: base.hasPort ? base.port : null,
            path: uri.path,
            query: uri.query,
          ).toString();
        }
      }
      return url;
    }
    final String base = baseUrl.endsWith('/')
        ? baseUrl.substring(0, baseUrl.length - 1)
        : baseUrl;
    final String path = url.startsWith('/') ? url : '/$url';
    return '$base$path';
  }

  // Get stored token
  static Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  // Public method to get token (for debugging)
  static Future<String?> getToken() async {
    return _getToken();
  }

  // Store token
  static Future<void> _storeToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
  }

  // Remove token
  static Future<void> _removeToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
  }

  // HTTP headers with auth
  static Future<Map<String, String>> _getHeaders() async {
    final token = await _getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // Authentication
  static Future<Map<String, dynamic>> login(
    String email,
    String password,
  ) async {
    try {
      print('Attempting login to: $baseUrl/auth/login');
      print('Email: $email');

      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      );

      print('Response status: ${response.statusCode}');
      print('Response body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        // Handle different token field names
        final token = data['token'] ?? data['access_token'];
        if (token != null) {
          await _storeToken(token);
          return data;
        } else {
          throw Exception('No token found in response');
        }
      } else {
        // Check if it's actually a successful response with error message
        if (response.body.contains('access_token')) {
          final data = jsonDecode(response.body);
          final token = data['token'] ?? data['access_token'];
          if (token != null) {
            await _storeToken(token);
            return data;
          }
        }
        throw Exception('Login failed: ${response.body}');
      }
    } catch (e) {
      print('Login error: $e');
      // Don't wrap the exception again if it's already a login failure
      if (e.toString().contains('Login failed')) {
        rethrow;
      }
      throw Exception('Network error: $e');
    }
  }

  static Future<Map<String, dynamic>> register(
    String email,
    String password,
    String username,
    String displayName,
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
        'username': username,
        'displayName': displayName,
      }),
    );

    if (response.statusCode == 201) {
      final data = jsonDecode(response.body);
      await _storeToken(data['token']);
      return data;
    } else {
      throw Exception('Registration failed: ${response.body}');
    }
  }

  static Future<void> logout() async {
    await _removeToken();
  }

  // User operations
  static Future<User> getMe() async {
    try {
      print('Fetching user info from: $baseUrl/auth/me');
      final response = await http.get(
        Uri.parse('$baseUrl/auth/me'),
        headers: await _getHeaders(),
      );

      print('User info response status: ${response.statusCode}');
      print('User info response body: ${response.body}');

      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        print('Parsed auth JSON: $json');

        // /auth/me returns { userId: string }, so we need to fetch the full user
        final userId = json['userId'] as String;
        print('Fetching full user data for userId: $userId');

        return await getUserById(userId);
      } else {
        throw Exception('Failed to get user info: ${response.statusCode}');
      }
    } catch (e) {
      print('Error in getMe: $e');
      rethrow;
    }
  }

  static Future<List<User>> searchUsers(String query) async {
    final response = await http.get(
      Uri.parse('$baseUrl/users/search?q=${Uri.encodeComponent(query)}'),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => User.fromJson(json)).toList();
    } else {
      throw Exception('Failed to search users');
    }
  }

  // Posts
  static Future<List<Post>> getPosts() async {
    try {
      print('Fetching posts from: $baseUrl/posts');
      final response = await http.get(
        Uri.parse('$baseUrl/posts'),
        headers: await _getHeaders(),
      );

      print('Posts response status: ${response.statusCode}');
      print('Posts response body: ${response.body}');

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        print('Parsed ${data.length} posts');
        return data.map((json) => Post.fromJson(json)).toList();
      } else {
        throw Exception(
          'Failed to get posts: ${response.statusCode} - ${response.body}',
        );
      }
    } catch (e) {
      print('Error in getPosts: $e');
      rethrow;
    }
  }

  static Future<Post> createPost(String content) async {
    final response = await http.post(
      Uri.parse('$baseUrl/posts'),
      headers: await _getHeaders(),
      body: jsonEncode({'content': content}),
    );

    if (response.statusCode == 201) {
      return Post.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to create post');
    }
  }

  // Fetch posts authored by a specific user (client-side filter over /posts)
  static Future<List<Post>> getPostsByUser(String userId) async {
    final all = await getPosts();
    return all.where((p) => p.author.id == userId).toList();
  }

  // Returns true if like state changed (created), false if it was already liked
  static Future<bool> likePost(String postId) async {
    final response = await http.post(
      Uri.parse('$baseUrl/posts/$postId/likes'),
      headers: await _getHeaders(),
    );

    // Backend may return 201 Created or 200 OK
    if (response.statusCode == 409) {
      // Already liked - treat as success (no-op)
      return false;
    }
    if (response.statusCode != 200 && response.statusCode != 201) {
      throw Exception(
        'Failed to like post: ${response.statusCode} ${response.body}',
      );
    }
    return true;
  }

  // Returns true if unlike state changed (deleted), false if it was already unliked
  static Future<bool> unlikePost(String postId) async {
    final response = await http.delete(
      Uri.parse('$baseUrl/posts/$postId/likes'),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 409) {
      // Already unliked - treat as success (no-op)
      return false;
    }
    if (response.statusCode != 200 && response.statusCode != 204) {
      throw Exception(
        'Failed to unlike post: ${response.statusCode} ${response.body}',
      );
    }
    return true;
  }

  // Likes - fetch posts liked by the current user
  static Future<Set<String>> getMyLikedPostIds() async {
    final response = await http.get(
      Uri.parse('$baseUrl/likes/my'),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      final dynamic decoded = jsonDecode(response.body);
      final Set<String> ids = {};

      List<dynamic>? list;
      if (decoded is List) {
        list = decoded;
      } else if (decoded is Map<String, dynamic>) {
        // Try common wrappers
        for (final key in [
          'likedPostIds',
          'data',
          'items',
          'likes',
          'results',
        ]) {
          final v = decoded[key];
          if (v is List) {
            list = v;
            break;
          }
        }
      }

      if (list != null) {
        for (final item in list) {
          if (item is String) {
            ids.add(item);
          } else if (item is Map<String, dynamic>) {
            // Possible shapes:
            // 1) { postId: '...' }
            // 2) { post: { id: '...' } }
            // 3) { id: '...', content: '...', ... } (direct Post)
            final byPostId = item['postId'];
            final byNested = (item['post'] is Map<String, dynamic>)
                ? item['post']['id']
                : null;
            final byDirectPost = item['id'];
            final id = byPostId ?? byNested ?? byDirectPost;
            if (id is String) ids.add(id);
          }
        }
      }

      return ids;
    } else {
      throw Exception('Failed to fetch my likes: ${response.statusCode}');
    }
  }

  // Comments
  static Future<List<Map<String, dynamic>>> getComments(String postId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/posts/$postId/comments'),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(jsonDecode(response.body));
    } else {
      throw Exception('Failed to get comments');
    }
  }

  static Future<Map<String, dynamic>> createComment(
    String postId,
    String content,
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/posts/$postId/comments'),
      headers: await _getHeaders(),
      body: jsonEncode({'content': content}),
    );

    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to create comment');
    }
  }

  static Future<void> deleteComment(String postId, String commentId) async {
    final response = await http.delete(
      Uri.parse('$baseUrl/posts/$postId/comments/$commentId'),
      headers: await _getHeaders(),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to delete comment');
    }
  }

  // Notifications
  static Future<List<Map<String, dynamic>>> getNotifications() async {
    final response = await http.get(
      Uri.parse('$baseUrl/notifications'),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(jsonDecode(response.body));
    } else {
      throw Exception('Failed to get notifications');
    }
  }

  static Future<void> markNotificationAsRead(String notificationId) async {
    final response = await http.patch(
      Uri.parse('$baseUrl/notifications/$notificationId/read'),
      headers: await _getHeaders(),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to mark notification as read');
    }
  }

  static Future<void> markAllNotificationsAsRead() async {
    final response = await http.patch(
      Uri.parse('$baseUrl/notifications/read-all'),
      headers: await _getHeaders(),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to mark all notifications as read');
    }
  }

  // Follow system
  static Future<void> followUser(String userId) async {
    final response = await http.post(
      Uri.parse('$baseUrl/users/$userId/follow'),
      headers: await _getHeaders(),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to follow user');
    }
  }

  static Future<void> unfollowUser(String userId) async {
    final response = await http.delete(
      Uri.parse('$baseUrl/users/$userId/follow'),
      headers: await _getHeaders(),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to unfollow user');
    }
  }

  static Future<List<User>> getFollowers(String userId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/users/$userId/follow/followers'),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => User.fromJson(json)).toList();
    } else {
      throw Exception('Failed to get followers');
    }
  }

  static Future<List<User>> getFollowing(String userId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/users/$userId/follow/following'),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => User.fromJson(json)).toList();
    } else {
      throw Exception('Failed to get following');
    }
  }

  // User profile
  static Future<User> getUserById(String userId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/users/$userId'),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      return User.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to get user');
    }
  }

  // Update user profile (displayName, bio, avatarUrl optional)
  static Future<User> updateUser(
    String userId, {
    String? displayName,
    String? bio,
    String? avatarUrl,
  }) async {
    final body = <String, dynamic>{};
    if (displayName != null) body['displayName'] = displayName;
    if (bio != null) body['bio'] = bio;
    if (avatarUrl != null) body['avatarUrl'] = avatarUrl;

    final response = await http.patch(
      Uri.parse('$baseUrl/users/$userId'),
      headers: await _getHeaders(),
      body: jsonEncode(body),
    );

    if (response.statusCode == 200) {
      return User.fromJson(jsonDecode(response.body));
    }
    throw Exception(
      'Failed to update profile: ${response.statusCode} ${response.body}',
    );
  }
}
