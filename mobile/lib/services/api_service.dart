import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';
import '../models/post.dart';

class ApiService {
  static const String baseUrl = 'http://192.168.100.101:3000';

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

  static Future<void> likePost(String postId) async {
    final response = await http.post(
      Uri.parse('$baseUrl/posts/$postId/like'),
      headers: await _getHeaders(),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to like post');
    }
  }

  static Future<void> unlikePost(String postId) async {
    final response = await http.delete(
      Uri.parse('$baseUrl/posts/$postId/like'),
      headers: await _getHeaders(),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to unlike post');
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
}
