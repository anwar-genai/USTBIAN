import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/user.dart';
import 'user_profile_screen.dart';

class FollowingScreen extends StatefulWidget {
  final User user;

  const FollowingScreen({super.key, required this.user});

  @override
  State<FollowingScreen> createState() => _FollowingScreenState();
}

class _FollowingScreenState extends State<FollowingScreen> {
  List<User> _following = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadFollowing();
  }

  Future<void> _loadFollowing() async {
    try {
      final following = await ApiService.getFollowing(widget.user.id);
      setState(() {
        _following = following;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to load following: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.user.displayName}\'s Following'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _following.isEmpty
          ? const Center(
              child: Text(
                'Not following anyone yet',
                style: TextStyle(fontSize: 16, color: Colors.grey),
              ),
            )
          : ListView.builder(
              itemCount: _following.length,
              itemBuilder: (context, index) {
                final user = _following[index];
                return _FollowingCard(
                  user: user,
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (context) => UserProfileScreen(user: user),
                      ),
                    );
                  },
                );
              },
            ),
    );
  }
}

class _FollowingCard extends StatelessWidget {
  final User user;
  final VoidCallback onTap;

  const _FollowingCard({required this.user, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: ListTile(
        leading: CircleAvatar(
          backgroundImage: user.avatarUrl != null
              ? NetworkImage(user.avatarUrl!)
              : null,
          child: user.avatarUrl == null
              ? Text(user.displayName[0].toUpperCase())
              : null,
        ),
        title: Text(
          user.displayName,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('@${user.username}'),
            if (user.bio != null && user.bio!.isNotEmpty)
              Text(
                user.bio!,
                style: const TextStyle(fontSize: 12),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
          ],
        ),
        onTap: onTap,
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
      ),
    );
  }
}
