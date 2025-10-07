import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LikeEntity } from './like.entity';
import { User } from '../users/user.entity';
import { PostEntity } from '../posts/post.entity';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(LikeEntity)
    private readonly likesRepository: Repository<LikeEntity>,
    @InjectRepository(PostEntity)
    private readonly postsRepository: Repository<PostEntity>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly realtime: RealtimeGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  async like(user: User, postId: string) {
    const post = await this.postsRepository.findOne({ where: { id: postId }, relations: ['author'] });
    if (!post) throw new ConflictException('Post not found');
    
    // Check if already liked
    const existing = await this.likesRepository.findOne({
      where: { user: { id: user.id }, post: { id: postId } },
    });
    if (existing) {
      throw new ConflictException('Already liked');
    }

    const like = this.likesRepository.create({ user, post });
    await this.likesRepository.save(like);
    
    this.realtime.emitLikeAdded(postId, user.id);

    // Create notification for post author (if not liking own post)
    if (post.author.id !== user.id) {
      // Get user details for notification
      const fullUser = await this.usersRepository.findOne({ where: { id: user.id } });
      if (fullUser) {
        await this.notificationsService.create(
          post.author.id,
          NotificationType.LIKE,
          user.id,
          `${fullUser.displayName} liked your post`,
          { postId },
        );
      }
    }

    return { success: true };
  }

  async unlike(user: User, postId: string) {
    const existing = await this.likesRepository.findOne({ where: { user: { id: user.id }, post: { id: postId } } });
    if (!existing) return { success: true };
    await this.likesRepository.remove(existing);
    this.realtime.emitLikeRemoved(postId, user.id);
    return { success: true };
  }

  async likeByUserId(userId: string, postId: string) {
    const user = { id: userId } as User; // minimal reference
    return this.like(user, postId);
  }

  async unlikeByUserId(userId: string, postId: string) {
    const user = { id: userId } as User;
    return this.unlike(user, postId);
  }

  async checkLike(userId: string, postId: string) {
    const existing = await this.likesRepository.findOne({
      where: { user: { id: userId }, post: { id: postId } },
    });
    return { liked: !!existing };
  }

  async getLikesForPosts(userId: string, postIds: string[]) {
    const likes = await this.likesRepository.find({
      where: postIds.map((postId) => ({ user: { id: userId }, post: { id: postId } })),
    });
    return likes.map((like) => like.post.id);
  }
}


