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
import 'search_screen.dart';
import 'feed_screen.dart';

class UserProfileScreen extends StatefulWidget {
  final User user;

  const UserProfileScreen({super.key, required this.user});

  @override
  State<UserProfileScreen> createState() => _UserProfileScreenState();
}

class _UserProfileScreenState extends State<UserProfileScreen>
    with SingleTickerProviderStateMixin {
  User? _currentUser;
  User? _profileUser;
  bool _isFollowing = false;
  bool _isLoading = true;
  int _followersCount = 0;
  int _followingCount = 0;
  List<Post> _posts = [];
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );

    _scaleAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOutBack),
    );

    _loadData();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
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
      _animationController.forward();
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.error_outline, color: Colors.white),
                const SizedBox(width: 12),
                Expanded(child: Text('Failed to load profile: $e')),
              ],
            ),
            backgroundColor: Colors.red.shade600,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            margin: const EdgeInsets.all(16),
          ),
        );
      }
    }
  }

  Future<void> _refresh() async {
    await _loadData();
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
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.error_outline, color: Colors.white),
              const SizedBox(width: 12),
              Expanded(child: Text('Failed to like post: $e')),
            ],
          ),
          backgroundColor: Colors.red.shade600,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          margin: const EdgeInsets.all(16),
        ),
      );
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
            content: Row(
              children: [
                const Icon(Icons.error_outline, color: Colors.white),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Failed to ${_isFollowing ? 'unfollow' : 'follow'} user: $e',
                  ),
                ),
              ],
            ),
            backgroundColor: Colors.red.shade600,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            margin: const EdgeInsets.all(16),
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
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? Colors.grey.shade900 : Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('Ustbian'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.search_rounded),
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
                const SnackBar(
                  content: Text('Notifications coming soon'),
                  behavior: SnackBarBehavior.floating,
                ),
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
              switch (value) {
                case 'profile':
                  if (_currentUser != null) {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (context) =>
                            UserProfileScreen(user: _currentUser!),
                      ),
                    );
                  }
                  break;
                case 'logout':
                  await ApiService.logout();
                  if (mounted) {
                    Navigator.of(context).pushReplacement(
                      MaterialPageRoute(
                        builder: (context) => const FeedScreen(),
                      ),
                    );
                  }
                  break;
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'profile',
                child: Row(
                  children: [
                    Icon(Icons.person_outline),
                    SizedBox(width: 12),
                    Text('My Profile'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'logout',
                child: Row(
                  children: [
                    Icon(Icons.logout),
                    SizedBox(width: 12),
                    Text('Logout'),
                  ],
                ),
              ),
            ],
            child: Container(
              margin: const EdgeInsets.only(right: 8),
              child:
                  _currentUser?.avatarUrl != null &&
                      _currentUser!.avatarUrl!.isNotEmpty
                  ? CircleAvatar(
                      radius: 16,
                      backgroundColor: Colors.white,
                      backgroundImage: NetworkImage(
                        ApiService.resolveUrl(_currentUser!.avatarUrl!),
                      ),
                      onBackgroundImageError: (exception, stackTrace) {
                        print('Error loading appbar avatar: $exception');
                      },
                    )
                  : CircleAvatar(
                      radius: 16,
                      backgroundColor: Colors.white,
                      child: Builder(
                        builder: (context) {
                          final displayName = _currentUser?.displayName;
                          if (displayName != null && displayName.isNotEmpty) {
                            return Text(
                              displayName[0].toUpperCase(),
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: Colors.blue,
                              ),
                            );
                          }
                          return const Icon(
                            Icons.person,
                            size: 16,
                            color: Colors.blue,
                          );
                        },
                      ),
                    ),
            ),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _refresh,
              child: ListView(
                children: [
                  // Profile Content
                  FadeTransition(
                    opacity: _fadeAnimation,
                    child: Column(
                      children: [
                        // Profile Header Card
                        Transform.translate(
                          offset: const Offset(0, -30),
                          child: ScaleTransition(
                            scale: _scaleAnimation,
                            child: Container(
                              margin: const EdgeInsets.symmetric(
                                horizontal: 20,
                              ),
                              padding: const EdgeInsets.fromLTRB(
                                24,
                                32,
                                24,
                                24,
                              ),
                              decoration: BoxDecoration(
                                color: isDark
                                    ? Colors.grey.shade800
                                    : Colors.white,
                                borderRadius: BorderRadius.circular(24),
                                border: Border.all(
                                  color: isDark
                                      ? Colors.grey.shade700
                                      : Colors.grey.shade200,
                                  width: 1,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: isDark
                                        ? Colors.black.withOpacity(0.2)
                                        : Colors.grey.shade200,
                                    blurRadius: 15,
                                    offset: const Offset(0, 5),
                                  ),
                                ],
                              ),
                              child: Column(
                                children: [
                                  // Avatar with subtle shadow and border
                                  Container(
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                        color: isDark
                                            ? Colors.grey.shade700
                                            : Colors.grey.shade300,
                                        width: 3,
                                      ),
                                      boxShadow: [
                                        BoxShadow(
                                          color: isDark
                                              ? Colors.black.withOpacity(0.3)
                                              : Colors.grey.shade400
                                                    .withOpacity(0.3),
                                          blurRadius: 15,
                                          offset: const Offset(0, 5),
                                        ),
                                      ],
                                    ),
                                    child:
                                        (_profileUser?.avatarUrl != null &&
                                            _profileUser!.avatarUrl!.isNotEmpty)
                                        ? CircleAvatar(
                                            radius: 60,
                                            backgroundColor: isDark
                                                ? Colors.grey.shade700
                                                : Colors.grey.shade100,
                                            backgroundImage: NetworkImage(
                                              ApiService.resolveUrl(
                                                _profileUser!.avatarUrl!,
                                              ),
                                            ),
                                            onBackgroundImageError:
                                                (exception, stackTrace) {
                                                  print(
                                                    'Error loading profile avatar: $exception',
                                                  );
                                                },
                                          )
                                        : CircleAvatar(
                                            radius: 60,
                                            backgroundColor: isDark
                                                ? Colors.grey.shade700
                                                : Colors.grey.shade100,
                                            child: Text(
                                              (_profileUser?.displayName ??
                                                      'U')[0]
                                                  .toUpperCase(),
                                              style: TextStyle(
                                                fontSize: 40,
                                                fontWeight: FontWeight.bold,
                                                color: isDark
                                                    ? Colors.white
                                                    : Colors.grey.shade700,
                                              ),
                                            ),
                                          ),
                                  ),
                                  const SizedBox(height: 20),

                                  // Name
                                  Text(
                                    _profileUser?.displayName ?? '',
                                    style: TextStyle(
                                      fontSize: 26,
                                      fontWeight: FontWeight.bold,
                                      color: isDark
                                          ? Colors.white
                                          : Colors.grey.shade900,
                                    ),
                                  ),
                                  const SizedBox(height: 6),

                                  // Username
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 6,
                                    ),
                                    decoration: BoxDecoration(
                                      color: isDark
                                          ? Colors.grey.shade700
                                          : Colors.grey.shade100,
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Text(
                                      '@${_profileUser?.username}',
                                      style: TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w500,
                                        color: isDark
                                            ? Colors.grey.shade300
                                            : Colors.grey.shade700,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 20),

                                  // Bio
                                  if (_profileUser?.bio != null &&
                                      _profileUser!.bio!.isNotEmpty)
                                    Container(
                                      padding: const EdgeInsets.all(16),
                                      decoration: BoxDecoration(
                                        color: isDark
                                            ? Colors.grey.shade700.withOpacity(
                                                0.3,
                                              )
                                            : Colors.blue.shade50.withOpacity(
                                                0.5,
                                              ),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        _profileUser!.bio!,
                                        textAlign: TextAlign.center,
                                        style: TextStyle(
                                          fontSize: 15,
                                          height: 1.5,
                                          color: isDark
                                              ? Colors.grey.shade300
                                              : Colors.grey.shade800,
                                        ),
                                      ),
                                    )
                                  else
                                    Text(
                                      'No bio yet',
                                      style: TextStyle(
                                        fontSize: 15,
                                        color: Colors.grey.shade500,
                                        fontStyle: FontStyle.italic,
                                      ),
                                    ),
                                  const SizedBox(height: 20),

                                  // Joined date
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(
                                        Icons.calendar_today_rounded,
                                        size: 16,
                                        color: isDark
                                            ? Colors.grey.shade500
                                            : Colors.grey.shade600,
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        _profileUser != null
                                            ? 'Joined ${DateFormat('MMMM yyyy').format(_profileUser!.createdAt)}'
                                            : '',
                                        style: TextStyle(
                                          fontSize: 14,
                                          color: isDark
                                              ? Colors.grey.shade500
                                              : Colors.grey.shade600,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 24),

                                  // Follow stats in cards
                                  Row(
                                    children: [
                                      Expanded(
                                        child: _StatCard(
                                          count: _followersCount,
                                          label: 'Followers',
                                          isDark: isDark,
                                          onTap: () {
                                            Navigator.of(context).push(
                                              MaterialPageRoute(
                                                builder: (context) =>
                                                    FollowersScreen(
                                                      user: widget.user,
                                                    ),
                                              ),
                                            );
                                          },
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: _StatCard(
                                          count: _followingCount,
                                          label: 'Following',
                                          isDark: isDark,
                                          onTap: () {
                                            Navigator.of(context).push(
                                              MaterialPageRoute(
                                                builder: (context) =>
                                                    FollowingScreen(
                                                      user: widget.user,
                                                    ),
                                              ),
                                            );
                                          },
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: _StatCard(
                                          count: _posts.length,
                                          label: 'Posts',
                                          isDark: isDark,
                                          onTap: () {},
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 20),

                                  // Action buttons
                                  if (_currentUser != null &&
                                      _profileUser != null &&
                                      _currentUser!.id == _profileUser!.id)
                                    Row(
                                      children: [
                                        Expanded(
                                          child: OutlinedButton.icon(
                                            onPressed: () async {
                                              final updated =
                                                  await Navigator.of(
                                                    context,
                                                  ).push<User>(
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
                                            icon: const Icon(
                                              Icons.edit_rounded,
                                              size: 20,
                                            ),
                                            label: const Text(
                                              'Edit Profile',
                                              style: TextStyle(
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                            style: OutlinedButton.styleFrom(
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                    vertical: 14,
                                                  ),
                                              side: BorderSide(
                                                color: isDark
                                                    ? Colors.grey.shade600
                                                    : Colors.blue.shade600,
                                                width: 2,
                                              ),
                                              shape: RoundedRectangleBorder(
                                                borderRadius:
                                                    BorderRadius.circular(12),
                                              ),
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: ElevatedButton.icon(
                                            onPressed: () async {
                                              final result =
                                                  await Navigator.of(
                                                    context,
                                                  ).push(
                                                    MaterialPageRoute(
                                                      builder: (_) =>
                                                          const CreatePostScreen(),
                                                    ),
                                                  );
                                              if (result == true) {
                                                await _refresh();
                                              }
                                            },
                                            icon: const Icon(
                                              Icons.add_rounded,
                                              size: 20,
                                            ),
                                            label: const Text(
                                              'New Post',
                                              style: TextStyle(
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor:
                                                  Colors.blue.shade600,
                                              foregroundColor: Colors.white,
                                              elevation: 0,
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                    vertical: 14,
                                                  ),
                                              shape: RoundedRectangleBorder(
                                                borderRadius:
                                                    BorderRadius.circular(12),
                                              ),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),

                                  // Follow button
                                  if (_currentUser != null &&
                                      _profileUser != null &&
                                      _currentUser!.id != _profileUser!.id)
                                    SizedBox(
                                      width: double.infinity,
                                      child: ElevatedButton.icon(
                                        onPressed: _isLoading
                                            ? null
                                            : _toggleFollow,
                                        icon: Icon(
                                          _isFollowing
                                              ? Icons.person_remove_rounded
                                              : Icons.person_add_rounded,
                                          size: 20,
                                        ),
                                        label: _isLoading
                                            ? const SizedBox(
                                                height: 20,
                                                width: 20,
                                                child: CircularProgressIndicator(
                                                  strokeWidth: 2,
                                                  valueColor:
                                                      AlwaysStoppedAnimation<
                                                        Color
                                                      >(Colors.white),
                                                ),
                                              )
                                            : Text(
                                                _isFollowing
                                                    ? 'Unfollow'
                                                    : 'Follow',
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.w600,
                                                  fontSize: 16,
                                                ),
                                              ),
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: _isFollowing
                                              ? isDark
                                                    ? Colors.grey.shade700
                                                    : Colors.grey.shade400
                                              : Colors.blue.shade600,
                                          foregroundColor: Colors.white,
                                          elevation: 0,
                                          padding: const EdgeInsets.symmetric(
                                            vertical: 14,
                                          ),
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(
                                              12,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          ),
                        ),

                        // Posts section header
                        Padding(
                          padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                          child: Row(
                            children: [
                              Icon(
                                Icons.article_rounded,
                                color: isDark
                                    ? Colors.grey.shade400
                                    : Colors.grey.shade700,
                                size: 24,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Posts',
                                style: TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                  color: isDark
                                      ? Colors.white
                                      : Colors.grey.shade900,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.blue.shade600,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  '${_posts.length}',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                  ),
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
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(24),
                                  decoration: BoxDecoration(
                                    color: isDark
                                        ? Colors.grey.shade800.withOpacity(0.5)
                                        : Colors.grey.shade100,
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(
                                    Icons.article_outlined,
                                    size: 64,
                                    color: isDark
                                        ? Colors.grey.shade600
                                        : Colors.grey.shade400,
                                  ),
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  'No posts yet',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w500,
                                    color: isDark
                                        ? Colors.grey.shade500
                                        : Colors.grey.shade600,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Share your first thought!',
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: isDark
                                        ? Colors.grey.shade600
                                        : Colors.grey.shade500,
                                  ),
                                ),
                              ],
                            ),
                          )
                        else
                          ..._posts.map(
                            (p) => _ProfilePostCard(
                              post: p,
                              onLike: () => _likePost(p.id),
                              isDark: isDark,
                            ),
                          ),
                        const SizedBox(height: 20),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final int count;
  final String label;
  final bool isDark;
  final VoidCallback onTap;

  const _StatCard({
    required this.count,
    required this.label,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: isDark
              ? Colors.grey.shade700.withOpacity(0.3)
              : Colors.blue.shade50.withOpacity(0.5),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isDark ? Colors.grey.shade700 : Colors.blue.shade100,
          ),
        ),
        child: Column(
          children: [
            Text(
              count.toString(),
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : Colors.grey.shade900,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfilePostCard extends StatelessWidget {
  final Post post;
  final VoidCallback onLike;
  final bool isDark;

  const _ProfilePostCard({
    required this.post,
    required this.onLike,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? Colors.grey.shade800 : Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: isDark
                ? Colors.black.withOpacity(0.3)
                : Colors.grey.shade200.withOpacity(0.8),
            blurRadius: 15,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Timestamp
            Row(
              children: [
                Icon(
                  Icons.access_time_rounded,
                  size: 14,
                  color: isDark ? Colors.grey.shade500 : Colors.grey.shade600,
                ),
                const SizedBox(width: 4),
                Text(
                  DateFormat('MMM d, yyyy').format(post.createdAt),
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? Colors.grey.shade500 : Colors.grey.shade600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Content
            Text(
              post.content,
              style: TextStyle(
                fontSize: 15,
                height: 1.5,
                color: isDark ? Colors.grey.shade200 : Colors.black87,
              ),
              maxLines: 6,
              overflow: TextOverflow.ellipsis,
            ),
            if (post.imageUrl != null) ...[
              const SizedBox(height: 16),
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.network(
                  post.imageUrl!,
                  fit: BoxFit.cover,
                  width: double.infinity,
                ),
              ),
            ],
            const SizedBox(height: 16),

            // Actions
            Container(
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                color: isDark
                    ? Colors.grey.shade700.withOpacity(0.3)
                    : Colors.grey.shade50,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _ActionButton(
                    icon: post.isLiked
                        ? Icons.favorite_rounded
                        : Icons.favorite_border_rounded,
                    label: '${post.likesCount}',
                    color: post.isLiked ? Colors.red : null,
                    onPressed: onLike,
                    isDark: isDark,
                  ),
                  _ActionButton(
                    icon: Icons.comment_rounded,
                    label: '${post.commentsCount}',
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => CommentsScreen(post: post),
                        ),
                      );
                    },
                    isDark: isDark,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color? color;
  final VoidCallback onPressed;
  final bool isDark;

  const _ActionButton({
    required this.icon,
    required this.label,
    this.color,
    required this.onPressed,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveColor =
        color ?? (isDark ? Colors.grey.shade400 : Colors.grey.shade700);

    return InkWell(
      onTap: onPressed,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Row(
          children: [
            Icon(icon, color: effectiveColor, size: 22),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                color: effectiveColor,
                fontWeight: FontWeight.w600,
                fontSize: 15,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
