import { Injectable, NotFoundException, UnauthorizedException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostEntity } from './post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { User } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';
import { extractMentions, getRemovedMentions, getAddedMentions } from './utils/mention-parser';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postsRepository: Repository<PostEntity>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(author: User, dto: CreatePostDto): Promise<PostEntity> {
    const post = this.postsRepository.create({ author, content: dto.content, mediaUrls: dto.mediaUrls });
    const savedPost = await this.postsRepository.save(post);

    // Handle mentions
    await this.handleMentions(savedPost, author.id);

    return savedPost;
  }

  /**
   * Extract mentions from post content and create notifications
   */
  private async handleMentions(post: PostEntity, authorId: string) {
    const usernames = extractMentions(post.content);
    
    if (usernames.length === 0) return;

    // Find mentioned users
    const mentionedUsers = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.username IN (:...usernames)', { usernames })
      .getMany();

    // Create notifications for each mentioned user (except the author)
    for (const user of mentionedUsers) {
      if (user.id !== authorId) {
        await this.notificationsService.create(
          user.id,
          NotificationType.MENTION,
          authorId,
          `@${post.author.username} mentioned you in a post`,
          { postId: post.id },
        );
      }
    }
  }

  async createByUserId(userId: string, dto: CreatePostDto): Promise<PostEntity> {
    const author = await this.usersRepository.findOne({ where: { id: userId } });
    if (!author) throw new NotFoundException('User not found');
    return this.create(author, dto);
  }

  async findById(id: string): Promise<PostEntity> {
    const post = await this.postsRepository.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async listRecent(limit = 20): Promise<PostEntity[]> {
    return await this.postsRepository.find({ order: { createdAt: 'DESC' }, take: limit });
  }

  async searchByHashtag(hashtag: string, limit = 50): Promise<PostEntity[]> {
    // Search for posts containing the hashtag (case-insensitive)
    const searchPattern = `%#${hashtag.toLowerCase()}%`;
    
    return await this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('LOWER(post.content) LIKE :searchPattern', { searchPattern })
      .orderBy('post.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async update(authorId: string, id: string, dto: UpdatePostDto): Promise<PostEntity> {
    const post = await this.findById(id);
    if (post.author.id !== authorId) throw new UnauthorizedException('Not the author');
    
    const oldContent = post.content;
    Object.assign(post, dto);
    const updatedPost = await this.postsRepository.save(post);

    // Handle mention changes
    if (dto.content && dto.content !== oldContent) {
      await this.handleMentionChanges(updatedPost, oldContent, dto.content, authorId);
    }

    return updatedPost;
  }

  /**
   * Handle mention changes when post is edited
   */
  private async handleMentionChanges(
    post: PostEntity,
    oldContent: string,
    newContent: string,
    authorId: string,
  ) {
    // Find removed mentions
    const removedUsernames = getRemovedMentions(oldContent, newContent);
    if (removedUsernames.length > 0) {
      const removedUsers = await this.usersRepository
        .createQueryBuilder('user')
        .where('user.username IN (:...usernames)', { usernames: removedUsernames })
        .getMany();

      // Delete notifications for removed mentions
      for (const user of removedUsers) {
        await this.notificationsService.deleteMentionNotification(user.id, authorId, post.id);
      }
    }

    // Find added mentions
    const addedUsernames = getAddedMentions(oldContent, newContent);
    if (addedUsernames.length > 0) {
      const addedUsers = await this.usersRepository
        .createQueryBuilder('user')
        .where('user.username IN (:...usernames)', { usernames: addedUsernames })
        .getMany();

      // Create notifications for new mentions
      for (const user of addedUsers) {
        if (user.id !== authorId) {
          await this.notificationsService.create(
            user.id,
            NotificationType.MENTION,
            authorId,
            `@${post.author.username} mentioned you in a post`,
            { postId: post.id },
          );
        }
      }
    }
  }

  async remove(authorId: string, id: string): Promise<void> {
    const post = await this.findById(id);
    if (post.author.id !== authorId) throw new UnauthorizedException('Not the author');
    
    // Delete all mention notifications for this post before deleting the post
    await this.notificationsService.deleteAllMentionNotificationsForPost(id);
    
    await this.postsRepository.remove(post);
  }
}


