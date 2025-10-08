import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../models/post.dart';
import '../models/user.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});

  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  List<Post> _posts = [];
  User? _currentUser;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final user = await ApiService.getMe();
      final posts = await ApiService.getPosts();

      setState(() {
        _currentUser = user;
        _posts = posts;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to load data: $e')));
      }
    }
  }

  Future<void> _likePost(String postId) async {
    try {
      await ApiService.likePost(postId);
      setState(() {
        final postIndex = _posts.indexWhere((p) => p.id == postId);
        if (postIndex != -1) {
          final post = _posts[postIndex];
          _posts[postIndex] = Post(
            id: post.id,
            content: post.content,
            imageUrl: post.imageUrl,
            author: post.author,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            likesCount: post.isLiked
                ? post.likesCount - 1
                : post.likesCount + 1,
            commentsCount: post.commentsCount,
            isLiked: !post.isLiked,
          );
        }
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to like post: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Ustbian'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {
              // TODO: Implement search
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Search coming soon!')),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.person),
            onPressed: () {
              // TODO: Navigate to profile
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Profile coming soon!')),
              );
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: _posts.isEmpty
                  ? const Center(
                      child: Text(
                        'No posts yet.\nBe the first to post!',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 16, color: Colors.grey),
                      ),
                    )
                  : ListView.builder(
                      itemCount: _posts.length,
                      itemBuilder: (context, index) {
                        final post = _posts[index];
                        return _PostCard(
                          post: post,
                          onLike: () => _likePost(post.id),
                        );
                      },
                    ),
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // TODO: Navigate to create post screen
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Create post coming soon!')),
          );
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}

class _PostCard extends StatelessWidget {
  final Post post;
  final VoidCallback onLike;

  const _PostCard({required this.post, required this.onLike});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.all(8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Author info
            Row(
              children: [
                CircleAvatar(
                  backgroundImage: post.author.avatarUrl != null
                      ? NetworkImage(post.author.avatarUrl!)
                      : null,
                  child: post.author.avatarUrl == null
                      ? Text(post.author.displayName[0].toUpperCase())
                      : null,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        post.author.displayName,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      Text(
                        '@${post.author.username}',
                        style: const TextStyle(
                          color: Colors.grey,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  _formatDate(post.createdAt),
                  style: const TextStyle(color: Colors.grey, fontSize: 12),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Post content
            Text(post.content, style: const TextStyle(fontSize: 16)),
            if (post.imageUrl != null) ...[
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.network(
                  post.imageUrl!,
                  width: double.infinity,
                  fit: BoxFit.cover,
                ),
              ),
            ],
            const SizedBox(height: 12),

            // Actions
            Row(
              children: [
                IconButton(
                  icon: Icon(
                    post.isLiked ? Icons.favorite : Icons.favorite_border,
                    color: post.isLiked ? Colors.red : Colors.grey,
                  ),
                  onPressed: onLike,
                ),
                Text('${post.likesCount}'),
                const SizedBox(width: 16),
                IconButton(
                  icon: const Icon(Icons.comment_outlined),
                  onPressed: () {
                    // TODO: Navigate to comments
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Comments coming soon!')),
                    );
                  },
                ),
                Text('${post.commentsCount}'),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays > 0) {
      return '${difference.inDays}d';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m';
    } else {
      return 'now';
    }
  }
}
