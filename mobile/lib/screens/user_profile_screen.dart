import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/user.dart';
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
  bool _isFollowing = false;
  bool _isLoading = true;
  int _followersCount = 0;
  int _followingCount = 0;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final currentUser = await ApiService.getMe();
      final followers = await ApiService.getFollowers(widget.user.id);
      final following = await ApiService.getFollowing(widget.user.id);

      setState(() {
        _currentUser = currentUser;
        _followersCount = followers.length;
        _followingCount = following.length;
        _isFollowing = followers.any((f) => f.id == currentUser.id);
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
        title: Text(widget.user.displayName),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              child: Column(
                children: [
                  // Profile header
                  Container(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      children: [
                        // Avatar
                        (widget.user.avatarUrl != null &&
                                widget.user.avatarUrl!.isNotEmpty)
                            ? CircleAvatar(
                                radius: 50,
                                backgroundColor: Colors.blue.shade100,
                                backgroundImage: NetworkImage(
                                  ApiService.resolveUrl(widget.user.avatarUrl!),
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
                                  widget.user.displayName[0].toUpperCase(),
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
                          widget.user.displayName,
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '@${widget.user.username}',
                          style: const TextStyle(
                            fontSize: 16,
                            color: Colors.grey,
                          ),
                        ),
                        const SizedBox(height: 16),
                        // Bio
                        if (widget.user.bio != null &&
                            widget.user.bio!.isNotEmpty)
                          Text(
                            widget.user.bio!,
                            textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 16),
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
                        const SizedBox(height: 24),
                        // Follow button
                        if (_currentUser != null &&
                            _currentUser!.id != widget.user.id)
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
