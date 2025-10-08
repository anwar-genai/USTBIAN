import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/user.dart';
import '../models/post.dart';
import 'comments_screen.dart';
import 'create_post_screen.dart';
import 'package:intl/intl.dart';
import 'user_profile_edit_screen.dart';
import 'followers_screen.dart';
import 'following_screen.dart';

class UserProfileScreen extends StatefulWidget {
  final User user;

  const UserProfileScreen({super.key, required this.user});

  @override
  State<UserProfileScreen> createState() => _UserProfileScreenState();
}

class _UserProfileScreenState extends State<UserProfileScreen> {
  User? _currentUser;
  User? _profileUser;
  bool _isFollowing = false;
  bool _isLoading = true;
  int _followersCount = 0;
  int _followingCount = 0;
  List<Post> _posts = [];
  bool _isRefreshing = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final currentUser = await ApiService.getMe();
      final viewUser = await ApiService.getUserById(widget.user.id);
      final followers = await ApiService.getFollowers(viewUser.id);
      final following = await ApiService.getFollowing(viewUser.id);
      final posts = await ApiService.getPostsByUser(viewUser.id);
      Set<String> likedIds = {};
      try {
        likedIds = await ApiService.getMyLikedPostIds();
      } catch (_) {}

      setState(() {
        _currentUser = currentUser;
        _profileUser = viewUser;
        _followersCount = followers.length;
        _followingCount = following.length;
        _isFollowing = followers.any((f) => f.id == currentUser.id);
        _posts = posts
            .map(
              (p) => Post(
                id: p.id,
                content: p.content,
                imageUrl: p.imageUrl,
                author: p.author,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
                likesCount: p.likesCount,
                commentsCount: p.commentsCount,
                isLiked: likedIds.contains(p.id),
              ),
            )
            .toList();
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to load profile: $e')));
      }
    }
  }

  Future<void> _refresh() async {
    setState(() => _isRefreshing = true);
    await _loadData();
    if (mounted) setState(() => _isRefreshing = false);
  }

  Future<void> _likePost(String postId) async {
    try {
      final idx = _posts.indexWhere((p) => p.id == postId);
      if (idx == -1) return;
      final post = _posts[idx];
      bool changed;
      if (post.isLiked) {
        changed = await ApiService.unlikePost(postId);
      } else {
        changed = await ApiService.likePost(postId);
      }
      if (changed) {
        setState(() {
          _posts[idx] = Post(
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
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Failed to like post: $e')));
    }
  }

  Future<void> _toggleFollow() async {
    if (_currentUser == null) return;

    setState(() => _isLoading = true);

    try {
      if (_isFollowing) {
        await ApiService.unfollowUser(widget.user.id);
        setState(() {
          _isFollowing = false;
          _followersCount--;
        });
      } else {
        await ApiService.followUser(widget.user.id);
        setState(() {
          _isFollowing = true;
          _followersCount++;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Failed to ${_isFollowing ? 'unfollow' : 'follow'} user: $e',
            ),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_profileUser?.displayName ?? ''),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _refresh,
              child: ListView(
                children: [
                  // Profile header
                  Container(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      children: [
                        // Avatar
                        (_profileUser?.avatarUrl != null &&
                                _profileUser!.avatarUrl!.isNotEmpty)
                            ? CircleAvatar(
                                radius: 50,
                                backgroundColor: Colors.blue.shade100,
                                backgroundImage: NetworkImage(
                                  ApiService.resolveUrl(
                                    _profileUser!.avatarUrl!,
                                  ),
                                ),
                                onBackgroundImageError: (exception, stackTrace) {
                                  print(
                                    'Error loading profile avatar: $exception',
                                  );
                                },
                              )
                            : CircleAvatar(
                                radius: 50,
                                backgroundColor: Colors.blue.shade100,
                                child: Text(
                                  (_profileUser?.displayName ?? 'U')[0]
                                      .toUpperCase(),
                                  style: const TextStyle(
                                    fontSize: 32,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.blue,
                                  ),
                                ),
                              ),
                        const SizedBox(height: 16),
                        // Name and username
                        Text(
                          _profileUser?.displayName ?? '',
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '@${_profileUser?.username}',
                          style: const TextStyle(
                            fontSize: 16,
                            color: Colors.grey,
                          ),
                        ),
                        const SizedBox(height: 16),
                        // Bio (show placeholder if empty)
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 8),
                          child: Text(
                            (_profileUser?.bio != null &&
                                    _profileUser!.bio!.isNotEmpty)
                                ? _profileUser!.bio!
                                : 'No bio yet',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 16,
                              color:
                                  (widget.user.bio != null &&
                                      widget.user.bio!.isNotEmpty)
                                  ? Colors.black87
                                  : Colors.grey,
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        // Joined date
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(
                              Icons.calendar_today,
                              size: 16,
                              color: Colors.grey,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              _profileUser != null
                                  ? 'Joined ${DateFormat('MMMM yyyy').format(_profileUser!.createdAt)}'
                                  : '',
                              style: const TextStyle(color: Colors.grey),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),
                        // Follow stats
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: [
                            _StatButton(
                              count: _followersCount,
                              label: 'Followers',
                              onTap: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (context) =>
                                        FollowersScreen(user: widget.user),
                                  ),
                                );
                              },
                            ),
                            _StatButton(
                              count: _followingCount,
                              label: 'Following',
                              onTap: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (context) =>
                                        FollowingScreen(user: widget.user),
                                  ),
                                );
                              },
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        // Owner actions: Edit profile, New post
                        if (_currentUser != null &&
                            _profileUser != null &&
                            _currentUser!.id == _profileUser!.id)
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: () async {
                                    final updated = await Navigator.of(context)
                                        .push<User>(
                                          MaterialPageRoute(
                                            builder: (_) =>
                                                UserProfileEditScreen(
                                                  user: _currentUser!,
                                                ),
                                          ),
                                        );
                                    if (updated != null) {
                                      await _refresh();
                                    }
                                  },
                                  icon: const Icon(Icons.edit_outlined),
                                  label: const Text('Edit Profile'),
                                  style: OutlinedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 12,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: ElevatedButton.icon(
                                  onPressed: () async {
                                    final result = await Navigator.of(context)
                                        .push(
                                          MaterialPageRoute(
                                            builder: (_) =>
                                                const CreatePostScreen(),
                                          ),
                                        );
                                    if (result == true) {
                                      await _refresh();
                                    }
                                  },
                                  icon: const Icon(Icons.add),
                                  label: const Text('New Post'),
                                  style: ElevatedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 12,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        const SizedBox(height: 8),
                        // Follow button
                        if (_currentUser != null &&
                            _profileUser != null &&
                            _currentUser!.id != _profileUser!.id)
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: _isLoading ? null : _toggleFollow,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: _isFollowing
                                    ? Colors.grey
                                    : Colors.blue,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(
                                  vertical: 12,
                                ),
                              ),
                              child: _isLoading
                                  ? const SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        valueColor:
                                            AlwaysStoppedAnimation<Color>(
                                              Colors.white,
                                            ),
                                      ),
                                    )
                                  : Text(_isFollowing ? 'Unfollow' : 'Follow'),
                            ),
                          ),
                      ],
                    ),
                  ),
                  // Posts list
                  if (_posts.isEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 48),
                      child: Column(
                        children: const [
                          Icon(
                            Icons.article_outlined,
                            size: 64,
                            color: Colors.grey,
                          ),
                          SizedBox(height: 8),
                          Text(
                            'No posts yet',
                            style: TextStyle(color: Colors.grey),
                          ),
                        ],
                      ),
                    )
                  else
                    ..._posts.map(
                      (p) => _ProfilePostCard(
                        post: p,
                        onLike: () => _likePost(p.id),
                      ),
                    ),
                ],
              ),
            ),
    );
  }
}

class _StatButton extends StatelessWidget {
  final int count;
  final String label;
  final VoidCallback onTap;

  const _StatButton({
    required this.count,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Text(
            count.toString(),
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          Text(label, style: const TextStyle(fontSize: 14, color: Colors.grey)),
        ],
      ),
    );
  }
}

class _ProfilePostCard extends StatelessWidget {
  final Post post;
  final VoidCallback onLike;

  const _ProfilePostCard({required this.post, required this.onLike});

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
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Content
            Text(
              post.content,
              style: const TextStyle(
                fontSize: 15,
                height: 1.4,
                color: Colors.black87,
              ),
              maxLines: 6,
              overflow: TextOverflow.ellipsis,
            ),
            if (post.imageUrl != null) ...[
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.network(
                  post.imageUrl!,
                  fit: BoxFit.cover,
                  width: double.infinity,
                ),
              ),
            ],
            const SizedBox(height: 12),
            Row(
              children: [
                IconButton(
                  icon: Icon(
                    post.isLiked ? Icons.favorite : Icons.favorite_border,
                    color: post.isLiked ? Colors.red : Colors.grey.shade600,
                  ),
                  onPressed: onLike,
                ),
                Text('${post.likesCount}'),
                const SizedBox(width: 16),
                IconButton(
                  icon: const Icon(Icons.comment_outlined),
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => CommentsScreen(post: post),
                      ),
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
}
