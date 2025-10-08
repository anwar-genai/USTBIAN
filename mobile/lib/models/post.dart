import 'user.dart';

class Post {
  final String id;
  final String content;
  final String? imageUrl;
  final User author;
  final DateTime createdAt;
  final DateTime updatedAt;
  final int likesCount;
  final int commentsCount;
  final bool isLiked;

  Post({
    required this.id,
    required this.content,
    this.imageUrl,
    required this.author,
    required this.createdAt,
    required this.updatedAt,
    required this.likesCount,
    required this.commentsCount,
    required this.isLiked,
  });

  factory Post.fromJson(Map<String, dynamic> json) {
    // Handle mediaUrls array from backend (take first one if exists)
    String? imageUrl;
    if (json['mediaUrls'] != null &&
        json['mediaUrls'] is List &&
        (json['mediaUrls'] as List).isNotEmpty) {
      imageUrl = json['mediaUrls'][0];
    } else if (json['imageUrl'] != null) {
      imageUrl = json['imageUrl'];
    }

    return Post(
      id: json['id'],
      content: json['content'],
      imageUrl: imageUrl,
      author: User.fromJson(json['author']),
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
      likesCount: json['likesCount'] ?? 0,
      commentsCount: json['commentsCount'] ?? 0,
      isLiked: json['isLiked'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'content': content,
      'imageUrl': imageUrl,
      'author': author.toJson(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'likesCount': likesCount,
      'commentsCount': commentsCount,
      'isLiked': isLiked,
    };
  }
}
