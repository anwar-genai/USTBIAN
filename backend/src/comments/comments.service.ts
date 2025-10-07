import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentEntity } from './comment.entity';
import { PostEntity } from '../posts/post.entity';
import { User } from '../users/user.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly commentsRepository: Repository<CommentEntity>,
    @InjectRepository(PostEntity)
    private readonly postsRepository: Repository<PostEntity>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly realtime: RealtimeGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  async addComment(postId: string, authorId: string, dto: CreateCommentDto): Promise<CommentEntity> {
    const post = await this.postsRepository.findOne({ where: { id: postId }, relations: ['author'] });
    if (!post) throw new NotFoundException('Post not found');
    const author = await this.usersRepository.findOne({ where: { id: authorId } });
    if (!author) throw new NotFoundException('User not found');

    let parent: CommentEntity | null = null;
    if (dto.parentId) {
      console.log(`Looking for parent comment with ID: ${dto.parentId}`);
      parent = await this.commentsRepository.findOne({ where: { id: dto.parentId }, relations: ['author'] });
      if (!parent) throw new NotFoundException('Parent comment not found');
      console.log(`Parent comment found, author: ${parent.author.displayName}`);
    }

    const comment = this.commentsRepository.create({ content: dto.content, post, author, parent });
    const saved = await this.commentsRepository.save(comment);
    this.realtime.emitCommentAdded(postId, { ...saved, post: undefined });

    // If replying to a comment, notify the parent comment author
    if (parent && parent.author.id !== authorId) {
      console.log(`Creating reply notification for ${parent.author.displayName}`);
      await this.notificationsService.create(
        parent.author.id,
        NotificationType.COMMENT,
        authorId,
        `${author.displayName} replied to your comment`,
        { postId, commentId: saved.id, parentCommentId: parent.id },
      );
    }
    // Otherwise, notify the post author (unless commenting on own post)
    else if (!parent && post.author.id !== authorId) {
      console.log(`Creating post comment notification for ${post.author.displayName}`);
      await this.notificationsService.create(
        post.author.id,
        NotificationType.COMMENT,
        authorId,
        `${author.displayName} commented on your post`,
        { postId, commentId: saved.id },
      );
    }

    return saved;
  }

  async deleteComment(authorId: string, commentId: string): Promise<void> {
    const c = await this.commentsRepository.findOne({ where: { id: commentId }, relations: ['author', 'post', 'post.author'] });
    if (!c) return;
    if (c.author.id !== authorId) throw new UnauthorizedException('Cannot delete others comments');

    const postId = c.post.id;
    const postAuthorId = c.post.author.id;

    await this.commentsRepository.remove(c);
    this.realtime.emitCommentDeleted(postId, commentId);

    // Delete the comment notification if it exists
    if (postAuthorId !== authorId) {
      await this.notificationsService.deleteCommentNotification(postAuthorId, authorId, postId, commentId);
    }
  }

  async listForPost(postId: string, limit = 50, offset = 0): Promise<CommentEntity[]> {
    return await this.commentsRepository.find({
      where: { post: { id: postId } },
      order: { createdAt: 'ASC' },
      relations: ['parent'],
      take: limit,
      skip: offset,
    });
  }

  async countForPost(postId: string): Promise<number> {
    return await this.commentsRepository.count({ where: { post: { id: postId } } });
  }
}


