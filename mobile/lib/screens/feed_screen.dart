import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../models/post.dart';
import '../models/user.dart';
import 'create_post_screen.dart';
import 'comments_screen.dart';
import 'search_screen.dart';
import 'user_profile_screen.dart';

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
      print('Loading feed data...');
      final token = await ApiService.getToken();
      print('Token: ${token != null ? "Present" : "Missing"}');

      final user = await ApiService.getMe();
      print('User loaded: ${user.username}');

      final posts = await ApiService.getPosts();
      print('Posts loaded: ${posts.length} posts');

      setState(() {
        _currentUser = user;
        _posts = posts;
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading feed: $e');
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
      final postIndex = _posts.indexWhere((p) => p.id == postId);
      if (postIndex == -1) return;

      final post = _posts[postIndex];

      if (post.isLiked) {
        await ApiService.unlikePost(postId);
      } else {
        await ApiService.likePost(postId);
      }

      setState(() {
        _posts[postIndex] = Post(
          id: post.id,
          content: post.content,
          imageUrl: post.imageUrl,
          author: post.author,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1,
          commentsCount: post.commentsCount,
          isLiked: !post.isLiked,
        );
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
              Navigator.of(context).push(
                MaterialPageRoute(builder: (context) => const SearchScreen()),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.notifications_none_outlined),
            tooltip: 'Notifications',
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Notifications coming soon')),
              );
            },
          ),
          const SizedBox(width: 4),
          PopupMenuButton<String>(
            tooltip: 'Account',
            offset: const Offset(0, 40),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            onSelected: (value) async {
              if (value == 'profile' && _currentUser != null) {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (context) =>
                        UserProfileScreen(user: _currentUser!),
                  ),
                );
              } else if (value == 'logout') {
                await ApiService.logout();
                // ignore: use_build_context_synchronously
                Navigator.of(context).popUntil((route) => route.isFirst);
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'profile',
                child: ListTile(
                  leading: Icon(Icons.person_outline),
                  title: Text('View Profile'),
                  contentPadding: EdgeInsets.zero,
                ),
              ),
              const PopupMenuItem(
                value: 'logout',
                child: ListTile(
                  leading: Icon(Icons.logout),
                  title: Text('Logout'),
                  contentPadding: EdgeInsets.zero,
                ),
              ),
            ],
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child:
                  (_currentUser != null &&
                      _currentUser!.avatarUrl != null &&
                      _currentUser!.avatarUrl!.isNotEmpty)
                  ? CircleAvatar(
                      radius: 16,
                      backgroundImage: NetworkImage(
                        ApiService.resolveUrl(_currentUser!.avatarUrl!),
                      ),
                    )
                  : CircleAvatar(
                      radius: 16,
                      backgroundColor: Colors.white,
                      child: const Icon(
                        Icons.person_outline,
                        color: Colors.black87,
                      ),
                    ),
            ),
          ),
        ],
      ),
      body: Container(
        color: Colors.grey.shade50,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : RefreshIndicator(
                onRefresh: _loadData,
                child: _posts.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.post_add,
                              size: 80,
                              color: Colors.grey.shade300,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'No posts yet',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: Colors.grey.shade600,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Be the first to share something!',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey.shade500,
                              ),
                            ),
                            const SizedBox(height: 24),
                            ElevatedButton.icon(
                              onPressed: () async {
                                final result = await Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (context) =>
                                        const CreatePostScreen(),
                                  ),
                                );
                                if (result == true) {
                                  _loadData();
                                }
                              },
                              icon: const Icon(Icons.add),
                              label: const Text('Create Post'),
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 24,
                                  vertical: 12,
                                ),
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(vertical: 8),
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
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          final result = await Navigator.of(context).push(
            MaterialPageRoute(builder: (context) => const CreatePostScreen()),
          );
          if (result == true) {
            _loadData(); // Reload posts if a new post was created
          }
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}

class _PostCard extends StatefulWidget {
  final Post post;
  final VoidCallback onLike;

  const _PostCard({required this.post, required this.onLike});

  @override
  State<_PostCard> createState() => _PostCardState();
}

class _PostCardState extends State<_PostCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _likeAnimationController;
  late Animation<double> _likeAnimation;
  bool _isExpanded = false;

  @override
  void initState() {
    super.initState();
    _likeAnimationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _likeAnimation = Tween<double>(begin: 1.0, end: 1.3).animate(
      CurvedAnimation(
        parent: _likeAnimationController,
        curve: Curves.elasticOut,
      ),
    );
  }

  @override
  void dispose() {
    _likeAnimationController.dispose();
    super.dispose();
  }

  void _handleLike() {
    widget.onLike();
    _likeAnimationController.forward().then((_) {
      _likeAnimationController.reverse();
    });
  }

  bool _isTextLong() {
    // Check if text has more than 3 lines or is longer than 150 characters
    final lineCount = '\n'.allMatches(widget.post.content).length + 1;
    return lineCount > 3 || widget.post.content.length > 150;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () {},
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Author info
                Row(
                  children: [
                    GestureDetector(
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (context) =>
                                UserProfileScreen(user: widget.post.author),
                          ),
                        );
                      },
                      child: Hero(
                        tag:
                            'avatar_${widget.post.author.id}_${widget.post.id}',
                        child: Container(
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: Colors.blue.withOpacity(0.3),
                              width: 2,
                            ),
                          ),
                          child:
                              (widget.post.author.avatarUrl != null &&
                                  widget.post.author.avatarUrl!.isNotEmpty)
                              ? CircleAvatar(
                                  radius: 22,
                                  backgroundColor: Colors.blue.shade100,
                                  backgroundImage: NetworkImage(
                                    ApiService.resolveUrl(
                                      widget.post.author.avatarUrl!,
                                    ),
                                  ),
                                  onBackgroundImageError:
                                      (exception, stackTrace) {
                                        print(
                                          'Error loading avatar: $exception',
                                        );
                                      },
                                )
                              : CircleAvatar(
                                  radius: 22,
                                  backgroundColor: Colors.blue.shade100,
                                  child: Text(
                                    widget.post.author.displayName[0]
                                        .toUpperCase(),
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 18,
                                      color: Colors.blue,
                                    ),
                                  ),
                                ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: GestureDetector(
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (context) =>
                                  UserProfileScreen(user: widget.post.author),
                            ),
                          );
                        },
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.post.author.displayName,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                                color: Colors.black87,
                              ),
                            ),
                            Text(
                              '@${widget.post.author.username}',
                              style: TextStyle(
                                color: Colors.grey.shade600,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        _formatDate(widget.post.createdAt),
                        style: TextStyle(
                          color: Colors.grey.shade600,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                // Post content
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.post.content,
                      maxLines: _isExpanded ? null : 3,
                      overflow: _isExpanded
                          ? TextOverflow.visible
                          : TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 15,
                        height: 1.4,
                        color: Colors.black87,
                      ),
                    ),
                    if (_isTextLong())
                      GestureDetector(
                        onTap: () {
                          setState(() {
                            _isExpanded = !_isExpanded;
                          });
                        },
                        child: Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(
                            _isExpanded ? 'Show less' : 'Read more',
                            style: const TextStyle(
                              color: Colors.blue,
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
                if (widget.post.imageUrl != null) ...[
                  const SizedBox(height: 12),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.network(
                      widget.post.imageUrl!,
                      fit: BoxFit.cover,
                      width: double.infinity,
                      loadingBuilder: (context, child, loadingProgress) {
                        if (loadingProgress == null) return child;
                        return Container(
                          height: 200,
                          color: Colors.grey.shade200,
                          child: Center(
                            child: CircularProgressIndicator(
                              value: loadingProgress.expectedTotalBytes != null
                                  ? loadingProgress.cumulativeBytesLoaded /
                                        loadingProgress.expectedTotalBytes!
                                  : null,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
                const SizedBox(height: 12),
                Divider(color: Colors.grey.shade200, height: 1),
                const SizedBox(height: 8),
                // Actions
                Row(
                  children: [
                    Expanded(
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          borderRadius: BorderRadius.circular(8),
                          onTap: _handleLike,
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                ScaleTransition(
                                  scale: _likeAnimation,
                                  child: Icon(
                                    widget.post.isLiked
                                        ? Icons.favorite
                                        : Icons.favorite_border,
                                    color: widget.post.isLiked
                                        ? Colors.red
                                        : Colors.grey.shade600,
                                    size: 22,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  '${widget.post.likesCount}',
                                  style: TextStyle(
                                    color: widget.post.isLiked
                                        ? Colors.red
                                        : Colors.grey.shade700,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 14,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                    Container(
                      width: 1,
                      height: 24,
                      color: Colors.grey.shade200,
                    ),
                    Expanded(
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          borderRadius: BorderRadius.circular(8),
                          onTap: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (context) =>
                                    CommentsScreen(post: widget.post),
                              ),
                            );
                          },
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.chat_bubble_outline,
                                  color: Colors.grey.shade600,
                                  size: 22,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  '${widget.post.commentsCount}',
                                  style: TextStyle(
                                    color: Colors.grey.shade700,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 14,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays > 7) {
      return '${(difference.inDays / 7).floor()}w';
    } else if (difference.inDays > 0) {
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
